# Mapbox GL JS v3.25.0 Terrain 高层级卡顿排查全过程

## 1. 问题背景

项目使用 Mapbox GL JS v3.25.0，并叠加：

- 本地 raster 影像
- 本地 raster-dem 地形
- Three.js 自定义 3D 模型
- `pitch = 0`
- 持续放大地图到 z18、z19、z20

最初现象是：

```text
低层级：流畅
高层级：明显卡顿
```

一开始并不知道是 CPU、GPU、纹理上传、Shader，还是 terrain tile 数量导致的。

---

## 2. 第一阶段：先定位“卡在哪里”

最先通过浏览器 Performance / Spector.js 观察 GPU 渲染。

发现两个非常明显的现象：

```text
1. 高层级时 Draw Call 数量明显增加
2. 大量 drawElements(TRIANGLES, ...) 出现
```

并且单次 draw 不是简单的：

```text
6 indices
2 triangles
```

而是能看到接近：

```text
~100k indices
```

这种量级。

这说明问题不像是：

```text
“多画了几个普通 raster quad”
```

而更像是：

```text
Terrain 的高密度 GRID 被重复绘制很多次
```

同时 Performance 面板中还曾观察到：

```text
gl.texSubImage2D
```

在高层级耗时明显。

所以第一阶段得到的结论是：

> 卡顿与 terrain GPU 渲染强相关，尤其要关注 Draw Call、terrain GRID 和纹理更新。

---

## 3. 第二阶段：先排除 DEM 自己继续细分

当时 DEM 配置是：

```js
map.addSource('local-model-dem', {
    type: 'raster-dem',
    tileSize: 512,
    maxzoom: 15
});
```

但地图继续放大到：

```text
z18
z19
z20
```

最初怀疑：

```text
是不是 DEM maxzoom=15 没生效，
Mapbox 还在继续请求 z18 / z20 DEM？
```

于是开始统计 DEM tile。

结果发现：

```text
DEM 实际数据仍然停留在 z15
```

也就是说：

```text
DEM maxzoom = 15
```

确实限制住了真实 DEM 数据层级。

所以：

```text
高层级卡顿
≠
DEM 继续加载 z18/z20 高程数据
```

---

## 4. 第三阶段：发现 Terrain Proxy Tile 数量异常

接着开始打印 Mapbox terrain 内部数据。

重点统计：

```text
terrain proxy tile
```

后来加入了：

```text
proxySourceCache.getIds()
terrain.proxyCoords
proxy 按 zoom 分组
DEM renderable tile
```

旧版本中观察到：

### zoom ≈ 18

```text
proxy ≈ 158
```

并且同一帧不是只有 z18，而是同时存在：

```text
z13
z15
z16
z18
```

例如：

```text
z13 : 3
z15 : 9
z16 : 16
z18 : 130
```

总数：

```text
158
```

### zoom ≈ 20

出现：

```text
proxy ≈ 336
```

并且同一帧存在：

```text
z15
z16
z18
z19
z20
```

例如：

```text
z15 : 9
z16 : 16
z18 : 60
z19 : 235
z20 : 16
```

总数：

```text
336
```

这时候就能解释为什么 Draw Call 会增加：

```text
proxy 数量暴增
    ↓
更多 terrain tile 进入后续 terrain GRID 绘制
    ↓
Draw Call 增加
```

但是还不知道：

> 为什么旧版本 proxy 会变成 158 / 336，而新版本只有几个？

---

## 5. 第四阶段：怀疑 deferred / elevated

因为新版本使用 Mapbox Standard 后不卡，于是最初怀疑：

```text
旧版 → deferred
新版 → elevated
```

也就是：

```text
drapeRenderMode 不同
```

可能改变了 terrain 渲染路径。

于是增加日志打印：

```text
terrain.drapeRenderMode
terrainUsingMockSource
elevationSourceCache
```

结果发现：

### 旧版

```text
terrainDrapeMode = 1
terrainUsingMockSource = false
elevationSourceCache = local-model-dem
```

### 新版

```text
terrainDrapeMode = 1
terrainUsingMockSource = false
elevationSourceCache = local-model-dem
```

两边完全一样。

所以排除：

```text
deferred / elevated
```

是根因。

结论修正为：

> 新旧版本性能差异不是 drapeRenderMode 导致的。

---

## 6. 第五阶段：怀疑 Globe / Mercator Projection

继续对比完整日志后发现：

### 新版 Standard

```text
projection = globe
proxy = 4 ~ 6
```

### 旧版 Satellite

```text
projection = mercator
proxy = 158 / 336
```

这时最大的差异看起来是：

```text
globe vs mercator
```

于是做控制变量实验。

---

## 7. 实验 1：Standard 强制改成 Mercator

在新版本 Standard 中增加：

```js
projection: 'mercator'
```

保持以下条件不变：

```text
style = Mapbox Standard
DEM 不变
terrain 不变
pitch = 0
zoom 测试方式不变
```

如果之前猜测成立，那么：

```text
Standard + Mercator
```

应该重新出现：

```text
大量 proxy
+
卡顿
```

但实测结果：

```text
projection = mercator
proxy ≈ 6
仍然不卡
```

所以：

```text
globe
```

也不是根因。

---

## 8. 第六阶段：发现真正关键的差异 isOrthographic

这次对比中出现了真正关键的变量。

### 旧版 Satellite + Mercator

```text
projection = mercator
pitch = 0
isOrthographic = false
orthographicAtLowPitch = false
proxy = 158 / 336
```

### 新版 Standard + Mercator

```text
projection = mercator
pitch = 0
isOrthographic = true
orthographicAtLowPitch = true
proxy ≈ 6
```

这时候才发现：

> 虽然两边都是 `pitch = 0`，虽然两边都是 Mercator，但内部相机投影方式不同。

旧版：

```text
Perspective
```

新版：

```text
Orthographic
```

这成为新的核心怀疑点。

---

## 9. Mapbox 低 Pitch 正交投影逻辑

Mapbox GL JS v3.25.0 内部存在：

```js
setOrthographicProjectionAtLowPitch(...)
```

低 pitch 时可以启用正交相机。

逻辑上可以理解为：

```text
projection = mercator
pitch < 15
orthographicAtLowPitch = true
        ↓
isOrthographic = true
```

于是 Mapbox 使用：

```text
Orthographic Projection Matrix
```

而不是：

```text
Perspective Projection Matrix
```

---

## 10. 为什么这个变量会影响 Terrain Proxy

Terrain proxy tile 来自：

```text
transform.coveringTiles()
```

而 `coveringTiles()` 会依赖当前相机的：

```text
projMatrix
invProjMatrix
Camera Frustum
```

调用关系可以理解为：

```text
Perspective / Orthographic
        ↓
Projection Matrix
        ↓
invProjMatrix
        ↓
Camera Frustum
        ↓
coveringTiles()
        ↓
Terrain Proxy Tile
```

所以改变相机投影方式，并不是只改变最终画面视觉效果。

它会直接改变：

```text
Mapbox 认为当前相机到底能覆盖哪些 terrain tile
```

---

## 11. 正交投影下为什么 Proxy 少

在 `pitch = 0` 时，正交投影可以近似理解为：

```text
      camera

   |         |
   |         |
   |         |
   |         |
   +---------+
      terrain
```

视线彼此平行。

当前屏幕映射到 terrain 上的范围比较规整。

因此 `coveringTiles()` 得到的 tile cover 通常比较紧凑，例如：

```text
+----+----+
| P1 | P2 |
+----+----+
| P3 | P4 |
+----+----+
```

实测基本只有：

```text
4 ~ 6 个 proxy
```

---

## 12. 透视投影下为什么 Proxy 暴增

关闭低 pitch 正交后：

```js
map.transform.setOrthographicProjectionAtLowPitch(false);
```

即使：

```text
pitch = 0
```

内部仍然使用 Perspective。

透视相机视锥可以近似理解成：

```text
        camera
          *
        /   \
      /       \
    /           \
  /_______________\
       terrain
```

随着距离增加，视锥范围会扩大。

Terrain 的 `coveringTiles()` 又不是简单通过：

```text
屏幕宽度 / tileSize
```

来算 tile。

它会综合：

```text
Camera Frustum
+
Terrain AABB
+
Elevation
+
LOD 四叉树
```

判断当前应该保留哪些 tile、哪些 tile 继续细分。

因此 Perspective 下会产生明显更多的 tile cover。

---

## 13. 为什么同一帧会出现 z15 / z16 / z18 / z19 / z20

这里还需要区分：

```text
coveringZoomLevel = 20
```

和：

```text
最终所有 tile 都是 z20
```

这两件事并不相同。

`coveringZoomLevel = 20` 更接近：

```text
这次 LOD 最多允许细分到 z20
```

Mapbox 会沿着 terrain 四叉树不断判断：

```text
shouldSplit ?
```

如果当前节点需要更高细节：

```text
tile
 ↓
拆成 4 个 child
 ↓
继续判断
```

如果当前节点已经足够，就停在当前层级。

因此最终结果允许同时包含：

```text
z15
z16
z18
z19
z20
```

这就是旧版本日志里看到大量多层级 proxy 的原因。

---

## 14. 实验 2：只关闭低 Pitch 正交投影

为了确认是不是这个原因，继续做控制变量实验。

保持：

```text
Mapbox Standard
projection = mercator
DEM 不变
terrain 不变
pitch = 0
zoom 不变
```

只修改：

```js
map.transform.setOrthographicProjectionAtLowPitch(false);
```

也就是只把：

```text
Orthographic
```

改成：

```text
Perspective
```

结果：

```text
isOrthographic = true
↓
false
```

同时：

```text
terrain proxy 数量重新明显增加
```

并且：

```text
高层级卡顿重新出现
```

这一步完成了真正的控制变量闭环。

---

## 15. 为什么关闭正交后 Draw Call 会增加

`setOrthographicProjectionAtLowPitch(false)` 本身不会直接创建 Draw Call。

真正的链路是：

```text
setOrthographicProjectionAtLowPitch(false)
        ↓
pitch = 0 时仍使用 Perspective
        ↓
Projection Matrix 改变
        ↓
Camera Frustum 改变
        ↓
coveringTiles() 的 terrain LOD 结果改变
        ↓
Terrain Proxy 从 4~6 个增长到上百个
        ↓
更多 Proxy 参与后续 terrain 渲染
        ↓
Draw Call 增加
```

---

## 16. 为什么这些新增 Draw Call 很重

Terrain proxy 最终不是简单：

```text
一个 2-triangle quad
```

而是要进入：

```text
Proxy Texture
+
DEM
    ↓
Terrain GRID
    ↓
drawElements(TRIANGLES, ...)
```

Mapbox terrain 使用的是高密度 GRID。

因此：

```text
1 个 proxy
```

对应的最终 terrain 绘制成本，远高于简单的两个三角形。

当 proxy 从：

```text
6
```

增长到：

```text
158
336
```

时，GPU 需要处理的 terrain grid draw 数量也会显著增加。

所以会出现：

```text
大量 drawElements
+
大量 triangles / indices
+
GPU 帧时间上升
+
高 zoom 卡顿
```

这与最初在 Spector.js 中看到的现象正好对应起来。

---

## 17. 最终根因

最终问题不是：

```text
DEM maxzoom=15 失效
```

不是：

```text
deferred 比 elevated 慢
```

也不是：

```text
globe 比 mercator 快
```

真正的决定性变量是：

```text
低 Pitch 下是否启用 Orthographic
```

最终链路：

```text
旧 Satellite Style
        ↓
orthographicAtLowPitch = false
        ↓
pitch = 0 仍使用 Perspective
        ↓
Perspective Frustum
        ↓
Terrain coveringTiles() 产生大量多层级 proxy
        ↓
proxy = 158 / 336 ...
        ↓
大量 terrain GRID draw
        ↓
Draw Call 增长
        ↓
GPU 压力上升
        ↓
高层级卡顿
```

新版：

```text
Mapbox Standard
        ↓
orthographicAtLowPitch = true
        ↓
pitch = 0 使用 Orthographic
        ↓
Orthographic Frustum
        ↓
Terrain cover 更紧凑
        ↓
proxy ≈ 4 ~ 6
        ↓
terrain GRID draw 大幅减少
        ↓
不卡
```

---

## 18. 最有说服力的控制变量实验

最终最关键的验证不是“换 style”，而是：

```text
Standard + Mercator + Orthographic
→ proxy 少
→ 不卡
```

然后只执行：

```js
map.transform.setOrthographicProjectionAtLowPitch(false);
```

得到：

```text
Standard + Mercator + Perspective
→ proxy 数量重新增长
→ 重新卡顿
```

因为以下条件都保持不变：

- style
- projection
- DEM
- terrain
- pitch
- zoom
- 本地影像
- Three.js 模型

只改变：

```text
Orthographic → Perspective
```

性能问题即可复现。

因此可以确认：

> 这次高层级 Terrain 卡顿的直接根因，是低 Pitch 下使用 Perspective 后，terrain `coveringTiles()` 产生了大量多层级 proxy tile，从而导致 terrain grid Draw Call 大量增加。

---

## 19. 注意事项

以下字段和方法属于 Mapbox GL JS 内部实现：

```text
map.transform
setOrthographicProjectionAtLowPitch
proxySourceCache
terrain.proxyCoords
```

它们适合用于：

- 调试
- 定位
- 验证 Mapbox GL JS v3.25.0 行为

不建议直接作为长期稳定的业务 API 依赖。

升级 Mapbox GL JS 版本后，应重新验证这些内部逻辑。
