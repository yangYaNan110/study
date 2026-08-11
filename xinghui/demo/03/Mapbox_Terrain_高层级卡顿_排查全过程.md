# Mapbox Terrain 高层级卡顿：排查全过程

> 环境：Mapbox GL JS v3.25.0  
> 现象：开启 `raster-dem` Terrain 后，低层级流畅，高层级（例如 z18～z20）明显卡顿；关闭 Terrain 后恢复流畅。

---

## 1. 问题现象

项目中 Terrain 大致这样配置：

```js
map.addSource('local-model-dem', {
  type: 'raster-dem',
  tiles: [...],
  tileSize: 512,
  maxzoom: 15
});

map.setTerrain({
  source: 'local-model-dem'
});
```

实际现象：

- 低 zoom 时基本流畅；
- zoom 越高越卡；
- 相机停留不动后，卡顿也不会明显缓解；
- DEM 最大层级只有 15，但相机 zoom 到 18、19、20 后，Terrain draw call 仍然明显增加；
- Performance 面板中能看到 `gl.texSubImage2D` 等 GPU 相关耗时；
- Spector.js 中 Terrain 的 draw call 数量在高 zoom 时暴增；
- 关闭 Terrain 后性能立即恢复。

最开始最反直觉的问题是：

> 高 zoom 时，屏幕能看到的地理范围明明更小，为什么 Terrain 反而需要绘制更多 tile？

---

## 2. 第一阶段：怀疑纹理上传

最早从 Performance 面板看到：

```text
gl.texSubImage2D
```

耗时比较明显。

于是首先怀疑：

```text
是不是 Mapbox 每帧都在重新上传 DEM / 影像纹理？
是不是 Terrain Mesh 每帧都在重建？
是不是缓存没有生效？
```

继续观察后发现：

- DEM / 影像纹理本身通常只有 512×512；
- 停留一段时间后卡顿不会明显消失；
- 同样的 Terrain draw call 会持续存在。

因此可以判断：

> 单纯“数据还没下载完”不是根因。

`gl.texSubImage2D` 更像是高 Terrain 工作量下的一个伴随现象，而不是最核心原因。

---

## 3. 第二阶段：怀疑 Terrain Shader 太重

Terrain 渲染过程包含：

```text
规则网格
+
DEM 高度纹理
+
Vertex Shader 采样高度
+
顶点抬升
+
影像采样
```

所以一度怀疑：

> 是否 Terrain Shader 计算量过大？

曾考虑把 Terrain Shader 改成最简单版本，看看性能是否明显恢复。

但用 Spector.js 继续观察后，发现一个更明显的问题：

> 高 zoom 时，Terrain 的 draw call 数量本身就在暴增。

也就是说，即使单次 draw 很快：

```text
1 次 draw 很快
×
几百个 proxy tile
```

一样会非常重。

所以排查重点从：

```text
单个 Terrain draw 为什么慢
```

转向：

```text
为什么 Terrain draw 的数量会增加这么多
```

---

## 4. DEM maxzoom=15，为什么 z19/z20 还能出现大量 Terrain Tile？

这是排查过程中一个非常重要的认识。

一开始容易认为：

```text
DEM maxzoom = 15
```

那么 Terrain 最多也只应该绘制到 z15。

实际上不是。

Mapbox Terrain 中：

```text
DEM 数据层级
≠
Terrain Proxy Tile 层级
```

DEM Source 可以停留在较低层级：

```text
DEM z15
```

但 Terrain 的 proxy / covering tile 仍然可以继续细分到：

```text
z18
z19
z20
```

更高层级的 proxy tile 可以继续使用较低层级的 DEM 数据。

所以：

> `raster-dem.maxzoom = 15` 并不会限制 Terrain Proxy 最大只能到 z15。

这也解释了为什么没有 z19 DEM，依然能看到大量 z19 / z20 Terrain draw call。

---

## 5. 加入 Terrain Cover 诊断

为了确认 Mapbox 实际生成了多少 Terrain Proxy Tile，加入运行时诊断，重点观察：

```text
zoom
pitch
projection
isOrthographic
orthographicAtLowPitch
proxySourceCache.getIds()
terrain.proxyCoords
DEM renderable tile
terrain drape mode
```

旧场景高 zoom 时观察到：

### z18 左右

```text
proxy tile ≈ 158
```

并且不是单一层级，而是混合：

```text
z13
z15
z16
z18
```

### z20 左右

```text
proxy tile ≈ 336
```

大致混合：

```text
z15
z16
z18
z19
z20
```

这说明：

> Mapbox 最终不是简单地用一层 z20 tile 覆盖屏幕，而是在生成一套多 LOD Terrain Cover。

这也是后面理解问题的关键。

---

## 6. 排除 Proxy Cache 残留

一度怀疑：

> 158 / 336 个 proxy tile 会不会只是之前加载过的历史缓存，没有及时删除？

继续查看 Terrain Proxy Source Cache 的逻辑后发现：

- 每次 update 都会重新计算当前 Terrain Cover；
- 不再需要的 proxy tile 会被移除。

因此：

> 当前看到的数百个 proxy tile，基本就是当前 Terrain Cover 真正需要的节点，而不是单纯缓存残留。

于是问题进一步收敛到：

```text
coveringTiles()
+
Terrain LOD
```

---

## 7. 排除 Terrain Drape Mode 差异

对比旧代码和新代码时，也曾怀疑：

```text
Standard Style
vs
Satellite Style
```

是不是走了不同 Terrain 渲染模式。

诊断结果显示，两边都是：

```text
terrainDrapeMode = 1
terrainUsingMockSource = false
```

也就是说：

- 两边都是真实 DEM；
- 并不是一个场景用了 mock terrain；
- 也不是某个特殊 drape mode 导致的巨大差异。

因此这一方向被排除。

---

## 8. 排除 Globe / Mercator 差异

新代码一开始是 Standard Style，并且默认处于 Globe。

新代码表现：

```text
proxy tile ≈ 4～6
非常流畅
```

旧代码：

```text
Mercator
proxy tile ≈ 158～336
严重卡顿
```

于是第一反应是：

> Globe 是否比 Mercator 更容易控制 Terrain Tile 数量？

随后把新代码明确改成：

```js
projection: 'mercator'
```

结果：

```text
仍然流畅
proxy 仍然只有几个
```

因此可以排除：

> Globe / Mercator 本身不是根因。

---

## 9. 关键发现：Low-Pitch Orthographic

继续对比 Transform 状态后发现真正明显的差异。

流畅场景：

```text
projection = mercator
isOrthographic = true
orthographicAtLowPitch = true
proxy ≈ 4～6
```

卡顿场景：

```text
projection = mercator
isOrthographic = false
orthographicAtLowPitch = false
proxy ≈ 158～336
```

Mapbox GL JS v3.25.0 中存在低俯仰角正交投影逻辑。

大致条件：

```ts
get isOrthographic(): boolean {
    return this.projection.name !== 'globe' &&
        this._orthographicProjectionAtLowPitch &&
        this.pitch < OrthographicPitchTranstionValue;
}
```

其中低俯仰角切换阈值约为：

```text
15°
```

也就是说：

```text
Mercator
+
允许 Low-Pitch Orthographic
+
pitch < 15°
```

时，Mapbox 可以使用 Orthographic Projection。

---

## 10. 最关键的控制实验

为了排除 Style、Projection、DEM 等其他变量，在同一个场景中保持：

```text
Standard Style
Mercator
pitch = 0
相同 DEM
相同 zoom
```

只执行：

```js
map.transform.setOrthographicProjectionAtLowPitch(false);
```

也就是只关闭：

```text
Low-Pitch Orthographic
```

结果非常明确：

```text
Orthographic 开启
→ proxy ≈ 4～6
→ 流畅
```

关闭之后：

```text
Perspective
→ proxy 数量大幅增加
→ 高 zoom 卡顿重新出现
```

因此目前最强的实验结论是：

> 高层级卡顿和低 pitch 下 Perspective Terrain Cover 生成大量 Proxy Tile 有直接关系。

---

## 11. 先区分两个完全不同的问题

理解后面的源码前，必须把两件事分开：

### A. 一个四叉树节点是否进入候选？

主要由：

```text
Frustum Culling
```

决定。

### B. 这个节点进入候选之后，要继续细分到多深？

主要由：

```text
LOD / shouldSplit()
```

决定。

这两个问题不能混在一起。

---

## 12. 关于 LOD：原来的直觉其实是对的

Perspective 下：

```text
画面中心
→ 更接近相机

画面边缘
→ 距离相机更远
```

Mapbox 的 Terrain LOD 会根据 tile AABB 与 camera 的距离决定是否继续 split。

可以简单理解为：

```text
近
→ 继续细分
→ 更高层级
```

```text
远
→ 更早停止细分
→ 更粗层级
```

因此：

> “Perspective 下边缘 tile 更远，所以应该更容易满足 LOD、更早停止细分。”

这个直觉是对的。

也就是说，Perspective tile 多，并不是因为：

```text
边缘 tile 反而拆得更细
```

实际上外围 tile 通常拆得更粗。

这也解释了为什么最终看到的是：

```text
z15
z16
z18
z19
z20
```

多层级混合，而不是全部 z20。

---

## 13. Mapbox 确实做了真正的 Frustum Culling

排查过程中还怀疑过：

> Mapbox 会不会没有真正判断 tile 是否在视锥体内，只是简单判断是否落在 Perspective 的某个投影范围里？

继续看 `coveringTiles()` 源码，可以确认：

Mapbox 会根据当前的逆投影矩阵创建真正的 Camera Frustum：

```ts
const cameraFrustum =
    Frustum.fromInvProjectionMatrix(
        this.invProjMatrix,
        this.worldSize,
        z,
        zInMeters
    );
```

之后会用 Tile AABB 与这个 Frustum 做真实 3D 相交测试：

```ts
const intersectResult = it.aabb.intersects(cameraFrustum);

if (intersectResult === 0) {
    continue;
}
```

必要时最终还会进行更精确的：

```ts
it.aabb.intersectsPrecise(cameraFrustum)
```

因此可以确认：

> Mapbox 没有跳过真正的 Frustum Culling，也不是简单拿 Far Plane 的二维投影矩形做判断。

---

## 14. 真正关键：Terrain 使用的是 Deep 3D AABB

这里是整个问题最关键的源码机制。

Terrain 开启后，Mapbox 在计算 Terrain Cover 时，并不是把一个 tile 当成：

```text
地面上的一个二维矩形
```

而是给每个 tile 构造一个具有垂直高度范围的：

```text
3D AABB
```

可以理解为：

```text
        max elevation
             ↑
        +---------+
        |         |
        |  Tile   |
        |  AABB   |
        |         |
        +---------+
             ↓
        min elevation
```

源码中有专门注释，大意是：

> 在计算 Terrain Cover 时，为节点创建较深的 AABB，以确保 Terrain 节点与视锥正确相交。

所以最终判断的是：

```text
Camera Frustum
∩
Deep Terrain AABB
```

而不是：

```text
Camera Frustum
∩
地表二维 tile
```

---

## 15. 为什么 Perspective 和 Orthographic 看到的地面差不多，Proxy 数量却可以差几十倍？

这是本次问题最核心的几何原因。

假设：

```text
pitch = 0
```

为了保持当前 zoom 的屏幕尺度，两种投影在真实地面高度处看到的范围可以非常接近。

例如：

```text
Orthographic 地面覆盖宽度 ≈ 100m
Perspective  地面覆盖宽度 ≈ 100m
```

所以肉眼看到的画面差不多。

但两种视体沿深度方向的形状完全不同。

---

## 16. Orthographic

正交视体类似：

```text
|             |
|             |
|             |
|             |
|             |
```

它从 Near 到 Far：

```text
横截面宽度基本不变
```

如果地面处宽度是：

```text
100m
```

那么更深的位置仍然大约：

```text
100m
```

所以即使 Terrain AABB 很深，屏幕外的外围 Tile 通常还是不会和正交视体相交。

它们能够很早在四叉树遍历中被剔除。

---

## 17. Perspective

透视视锥类似：

```text
          camera
             *
            / \
           /   \
          /     \
         /       \
```

它从 Near 到 Far：

```text
距离相机越远
→ 横截面越宽
```

例如：

```text
真实地面处：100m
更深位置：300m
再深位置：800m
```

注意：

> 这不是说 Mapbox 会超过 Far Plane 继续扩展。

Near / Far 依然严格限定视锥。

这里说的是：

```text
在 Near ～ Far 内部
```

Perspective Frustum 本身就随着离相机距离增大而张开。

---

## 18. 为什么高 Zoom 时这个问题特别明显？

高 zoom 最大的特点是：

```text
camera 离真实地表非常近
```

假设低 zoom：

```text
camera 到地面 = 5000m
Terrain AABB 再向下延伸 = 500m
```

相对比例只有：

```text
500 / 5000 = 10%
```

Perspective Frustum 在这段额外深度里不会扩张得特别夸张。

但高 zoom：

```text
camera 到地面 = 50m
Terrain AABB 向下 = 500m
```

那么：

```text
camera → 地面 = 50m
camera → AABB 底部 = 550m
```

距离扩大：

```text
11 倍
```

Perspective 的横截面也会随着深度显著扩大。

于是会出现：

```text
真实地面附近：
视锥只覆盖很小范围
```

但是：

```text
Deep Terrain AABB 的较深位置：
Perspective Frustum 已经张开很多
```

最终导致：

> 一些地表 footprint 明明完全在屏幕外的 tile，其 3D AABB 更深的部分仍然会与 Perspective Frustum 相交。

因此这些 Tile 不能被 Frustum Culling 提前剔除。

---

## 19. “相机贴近地面，很多地上 Tile 明明不在视锥里”为什么仍然不矛盾？

高 zoom 时相机贴近地面，从直觉看：

```text
Perspective 视锥有很大一部分进入地下
地面真正被看到的范围反而很小
```

这个判断本身没有错。

关键是：

> Mapbox Terrain Cover 判断的不是“地面平面上的可见范围”，而是 Deep Terrain AABB 与整个 3D Frustum 的相交。

因此：

```text
地表可见范围很小
```

和：

```text
有多少 Deep Terrain AABB 能碰到 Perspective Frustum
```

并不是同一件事。

这正是之前最容易混淆的地方。

---

## 20. 完整的 Proxy Tile 放大链路

最终可以把高 zoom 卡顿过程总结为：

```text
zoom 升高
↓
camera 越来越贴近地表
↓
Terrain Cover 使用 Deep 3D AABB
↓
Perspective Frustum 沿深度快速张开
↓
大量屏幕外 Tile 的 Deep AABB 仍与 Frustum 相交
↓
这些四叉树节点无法在 Frustum Culling 阶段被提前剔除
↓
继续进入 Terrain LOD / shouldSplit()
↓
近处继续深拆
远处较早停止
↓
产生大量多 LOD Proxy Tile
↓
z15 / z16 / z18 / z19 / z20 混合存在
↓
Terrain draw call 数量暴增
↓
CPU 提交 / GPU 绘制 / Texture 相关开销一起增加
↓
明显卡顿
```

---

## 21. 为什么 Orthographic 下只有几个 Proxy？

Orthographic 下：

```text
Deep AABB 仍然存在
```

但是：

```text
正交视体的横截面不会随着深度扩大
```

因此很多屏幕外节点：

```text
AABB ∩ Orthographic Frustum = 空
```

会很早被裁掉。

所以只留下真正接近当前屏幕范围的少量节点：

```text
4～6 个 proxy
```

这也是为什么相同：

```text
Mercator
pitch = 0
zoom
DEM
```

只切换：

```text
Orthographic / Perspective
```

就能出现几十倍 Proxy 数量差异。

---

## 22. 为什么最终会出现多个 LOD？

Perspective 下即使外围 Tile 的 Deep AABB 通过 Frustum Test，它们通常离相机比较远。

于是：

```text
shouldSplit()
```

会比较早停止。

因此外围区域可能停在：

```text
z15
z16
z18
```

而中心更近的区域继续细分：

```text
z19
z20
```

所以最终 Terrain Cover 是：

```text
外围：粗 LOD
+
中央：细 LOD
```

这与实际诊断看到的层级分布一致。

---

## 23. 已排除的方向

| 怀疑点 | 结论 |
|---|---|
| 网络还没加载完 | 排除，停留后仍然卡 |
| 单纯 512×512 纹理太大 | 不是根因 |
| `gl.texSubImage2D` | 更像高工作量下的症状 |
| Terrain Shader 太重 | 不是主要矛盾 |
| DEM `maxzoom=15` | 不会限制 Proxy 到 z15 |
| Proxy Cache 没清 | 排除 |
| Standard / Satellite Style 差异 | 不是根因 |
| Globe / Mercator | 控制实验已排除 |
| Terrain Drape Mode | 已排除 |
| Far Plane 后继续扩展 | 不存在 |
| Mapbox 没做真正 Frustum Culling | 不成立 |
| Perspective 远处拆得更细 | 不成立，远处通常更早停止 |

---

## 24. 最关键的实验结果

控制变量：

```text
Standard Style
Mercator
pitch = 0
相同 DEM
相同 zoom
```

### 开启 Low-Pitch Orthographic

```text
isOrthographic = true
proxy ≈ 4～6
流畅
```

### 关闭 Low-Pitch Orthographic

执行：

```js
map.transform.setOrthographicProjectionAtLowPitch(false);
```

结果：

```text
isOrthographic = false
proxy 数量明显增加
高 zoom 卡顿重新出现
```

这个实验是目前最有说服力的证据。

---

## 25. 最终根因

本次问题目前最可信、同时也经过控制实验验证的根因是：

> **Mapbox GL JS v3.25.0 在低 pitch 的 Perspective 模式下，高 zoom 时 camera 非常贴近真实地表；Terrain Cover 又使用具有较大垂直范围的 Deep 3D AABB。Perspective Frustum 在 Near～Far 范围内会随深度张开，因此大量地表 footprint 已经在屏幕外的 Terrain Tile，其 Deep AABB 仍可能与 Frustum 相交。这些四叉树分支不能被提前剔除，继续进入 Terrain LOD，并最终形成大量多层级 Proxy Tile，导致 Terrain draw call 暴增和明显卡顿。**

Low-Pitch Orthographic 则不同：

> **正交视体沿深度方向横截面基本不变，因此 Deep Terrain AABB 不会因为向深处延伸而额外扩大横向候选范围，大量外围节点可以更早被 Frustum Culling，最终 Proxy Tile 数量保持很低。**

---

## 26. 以后排查 Terrain 卡顿时优先看什么？

建议按这个顺序观察：

```text
1. Terrain Proxy Tile 数量
2. Proxy Tile 的 zoom 分布
3. Terrain Draw Call 数量
4. isOrthographic
5. pitch
6. zoom / camera height
7. projection
8. DEM renderable tile 数量
9. terrain drape mode
10. gl.texSubImage2D 是否只是伴随现象
```

尤其应该优先看：

```text
proxy tile 数量
```

它比单独盯：

```text
gl.texSubImage2D
```

更容易快速判断 Terrain 高层级卡顿是不是由覆盖范围 / LOD 导致。

---

## 27. 这次排查得到的几个重要认知

### 认知 1

```text
DEM 数据层级
≠
Terrain Proxy 层级
```

### 认知 2

```text
Frustum Culling
```

决定：

```text
哪些四叉树分支可以继续存在
```

而：

```text
LOD / shouldSplit()
```

决定：

```text
这些分支继续拆到多深
```

二者必须分开理解。

### 认知 3

Perspective 下：

```text
远处 tile
→ LOD 更粗
```

这个直觉是正确的。

Proxy 总数变多，不等于远处 Tile 拆得更细。

### 认知 4

Terrain 下真正参与裁剪的是：

```text
3D Deep AABB
```

而不是：

```text
地表二维 footprint
```

### 认知 5

```text
屏幕上看到的地面范围很小
```

不代表：

```text
Terrain Cover 的 3D 候选空间也很小
```

真正应该考虑的是：

```text
Camera Frustum
∩
Deep Terrain AABB
+
Quadtree LOD
```

---

## 28. 一句话总结

> **这次 Mapbox Terrain 高层级卡顿，本质上不是“高 zoom 加载了更大的 DEM”，而是高 zoom 下 Perspective Camera 太贴近地表，配合 Terrain Cover 的 Deep AABB，使大量屏幕外四叉树节点仍然通过 3D Frustum Test，随后继续参与 LOD，最终造成 Proxy Tile 和 Terrain Draw Call 暴增；Low-Pitch Orthographic 因为视体沿深度不扩张，因此能把外围节点更早裁掉。**
