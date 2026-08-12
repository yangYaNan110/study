# OBJ 与 Mapbox Terrain：离屏后处理实验

入口是 `01.html`。这个 demo 的目标是：terrain 保持开启，OBJ 始终显示在 terrain 上方，同时 OBJ 自己的前后遮挡保持正确。

## 问题背景

Mapbox terrain 与 Three.js OBJ 在同一 WebGL 默认 framebuffer 中渲染时，二者会共享深度缓冲。OBJ 和 DEM 地表高度非常接近时，会竞争同一像素的深度，出现 z-fighting（闪面）。

直接将 OBJ 材质设为 `depthTest: false` 虽然能避免它与 terrain 竞争深度，但 OBJ 内部也不再判断前后关系，背面的三角形可能错误显示到正面。

## 当前方案

每一帧分为两个阶段：

```text
Mapbox 默认 framebuffer
  └─ 绘制底图、DOM 与 terrain

EffectComposer 的独立 WebGLRenderTarget
  ├─ 颜色纹理：OBJ 的透明 RGBA 图像
  └─ 深度纹理：只供 OBJ 内部 depthTest / depthWrite 使用

Mapbox 默认 framebuffer
  └─ 全屏 Quad 以 alpha 将 OBJ 颜色纹理叠加回去
```

因此 OBJ 绘制阶段不会读取 terrain depth，也不会把 OBJ depth 写回 Mapbox；但 OBJ 在离屏 target 中仍使用正常深度测试，所以自身的屋顶、墙面和背面遮挡正确。

当前合成规则是：只要模型像素 alpha 大于零，就覆盖该处 terrain 颜色。也就是说模型整体优先于 terrain；本版不做 terrain / model 的深度比较。

## 目录结构

```text
04/
├─ 01.html                    页面、import map 与模块入口
├─ js/
│  └─ main.js                 Mapbox、OBJ 投影、离屏渲染与合成流程
└─ shader/
   ├─ composite.vert.glsl     全屏合成 Quad 的顶点 shader
   └─ composite.frag.glsl     模型颜色的 alpha 合成 shader
```

## 关键实现点

- `createComposer()` 创建带 `depthTexture` 的 `WebGLRenderTarget`；深度纹理一直留在 GPU 显存中，不会读回 JS。
- `RenderPass(scene, modelCamera)` 只渲染 OBJ，材质保持 `depthTest: true`、`depthWrite: true`。
- `compositeScene` 使用无深度测试、无深度写入的全屏 Quad。关闭的是最终图像合成的 depth，不是 OBJ 绘制时的 depth。
- 每次 Three.js 绘制前调用 `renderer.resetState()`，避免共享 WebGL context 时 Mapbox 和 Three 的状态缓存互相干扰。
- 合成到默认 framebuffer 前绝不能清屏，否则会清掉 Mapbox 已渲染的 terrain 和底图。

## 后续：加入 terrain 深度比较

当前离屏 target 已保留 `depthTexture`，最终合成 shader 以后可增加：

```glsl
float modelDepth = texture2D(modelDepthTexture, vUv).x;
float terrainDepth = texture2D(terrainDepthTexture, vUv).x;
```

然后按容差 `epsilon` 决定模型或 terrain 优先。难点不在模型深度——模型深度已经有了；难点在于 Mapbox GL JS 没有稳定公开的 API 将当前 terrain depth 作为纹理提供给 custom layer。若需要该阶段，应基于同一份 DEM 自行渲染 terrain depth prepass，而不要依赖 Mapbox 私有 framebuffer 结构。
