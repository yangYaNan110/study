# Path2dDebugger

Path2dDebugger 是 PathVariable 的二维路径调试和预览模块，负责把三维路径数据转换成可交互的 Pixi 二维视图。

当前模块将入口、渲染控制、业务计算、响应式状态和具体绘制组件分开，便于继续扩展投影、路径校验和视图交互能力。

## 目录结构

```text
Path2dDebugger/
├── index.vue
├── index_back.vue                 # 旧版实现，仅作为迁移对照
├── controller/
│   └── Path2dRenderController.ts  # Pixi 渲染和视图控制
├── service/
│   └── Path2dDebuggerService.ts   # Path2D 业务计算
├── store/
│   └── index.ts                   # 功能级响应式状态
└── components/
    ├── Path2DGrid.vue
    ├── Path2DOutline.vue
    ├── Path2DPoints.vue
    ├── Path2DLabels.vue
    ├── Path2DViewport.vue
    ├── Path2DZoom.vue
    ├── Path2DToolbar.vue
    ├── Path2DStatus.vue
    ├── Path2DChecks.vue
    └── Path2DAxis.vue
```

## 模块职责

### index.vue

Path2dDebugger 的入口组件，负责：

- 接收父组件传入的 `segments` 和 `selectedIndex`。
- 创建 `Path2dDebuggerStore`。
- 创建并初始化 `Path2dRenderController`。
- 通过 `provide` 向子组件提供 Store 和渲染控制器。
- 同步外部路径数据和选中状态。
- 管理整体初始化和卸载生命周期。

入口组件不编写具体的 Pixi 绘制逻辑。

画布布局与旧版保持一致：

```text
path-debugger
├── Path2DToolbar
├── debugger-canvas       # Pixi 实际画布区域
├── Path2DStatus
└── Path2DChecks
```

### Path2dRenderController

`controller/Path2dRenderController.ts` 是 Path2dDebugger 专用的渲染控制器，负责：

- 创建和初始化 `PixiRenderer`。
- 管理 Pixi canvas、root 和渲染容器。
- 创建、清理和删除渲染 layer。
- 同步画布尺寸和设备像素比。
- 执行 `fitView`、`resetView` 和 `focusView`。
- 开关 Pixi 内置相机的缩放、拖拽交互。
- 在组件卸载时销毁 Pixi 资源。

它不负责路径业务计算，也不负责网格、轮廓或标签的具体绘制。

### Path2dDebuggerService

`service/Path2dDebuggerService.ts` 是 Path2D 领域业务服务，负责与 Vue 和 Pixi 无关的计算：

- 识别线段、圆弧和折线。
- 将原始路径段转换成标准化 `PathSegmentModel`。
- 解析表达式数值。
- 计算路径点、长度和弧线数据。
- 识别路径所在的 `XY / XZ / YZ` 标准平面。
- 根据当前投影面生成二维投影点。
- 计算二维投影包围盒和标签位置。
- 检查路径是否连续、闭合以及参数是否合法。

Service 负责“怎么算”，不保存响应式状态，也不操作 Pixi 对象。

当前斜面 `EProjection.xyz` 已能被识别，具体投影面选择后续扩展。

### Path2dDebuggerStore

`store/index.ts` 是 Path2dDebugger 的功能级业务 Store，负责：

- 保存原始 `segments`。
- 保存当前选中的路径段。
- 保存点、标签和网格的显示状态。
- 保存标准化后的 `segmentModels`。
- 保存路径校验结果 `issues`。
- 保存当前投影面、法线和投影错误信息。
- 暴露投影轴标签和状态文本。
- 调用 `Path2dDebuggerService` 更新派生数据。

典型数据流：

```text
setSegments()
  → rebuild()
  → buildSegmentModels()
  → detectProjection()
  → projectSegmentModels()
  → validatePath()
  → 更新 segmentModels、projection 和 issues
```

Store 不应该保存 Pixi 的 `Graphics`、`Container`、renderer、canvas、`ResizeObserver` 等运行时对象。

## 渲染组件职责

### Path2DGrid.vue

负责根据 `store.projectedBounds` 绘制网格和坐标参考线。它只管理自己的 layer 和 Graphics，不解析原始路径对象。

### Path2DOutline.vue

负责绘制线段、圆弧和折线轮廓，并处理轮廓的选中样式、错误样式和点击选择。

### Path2DPoints.vue

负责绘制路径端点，并根据 `showPoints`、选中状态和错误状态切换显示效果。

### Path2DLabels.vue

负责绘制段号标签、标签背景和边框。标签尺寸会根据当前 Pixi root 缩放比例反向计算；视图执行适配、重置或定位后，需要重新同步标签尺寸。

### Path2DViewport.vue

负责：

- 监听画布容器尺寸。
- 同步 Pixi 画布尺寸。
- 执行初始视图适配。
- 响应工具栏的适配和 1:1 操作。
- 响应问题列表的线段定位。
- 在视图变化后通知标签等依赖缩放的渲染组件重绘。

### Path2DZoom.vue

负责启用和关闭 Pixi 内置相机的滚轮缩放、缩放中心跟随和拖拽移动能力。

### Path2DToolbar.vue

负责 DOM 工具栏：

- 视图适配。
- 1:1 重置。
- 点显示开关。
- 段号显示开关。
- 网格显示开关。

工具栏通过 Store 和 bus 触发操作，不直接修改 Pixi 对象。

### Path2DStatus.vue

负责显示当前选中线段、线段类型、长度、错误信息和当前投影方向。

### Path2DChecks.vue

负责显示路径校验问题，区分 warning/error 样式，并支持点击问题定位到对应线段。

### Path2DAxis.vue

负责 DOM 坐标轴覆盖层，显示当前投影面的正方向。它属于 UI 层，不创建 Pixi Graphics，不拦截画布交互。

当前坐标轴标签：

- XY：`+X / +Y`
- XZ：`+X / +Z`
- YZ：`+Y / +Z`

## 数据流

```text
父组件传入 segments
        │
        ▼
     index.vue
        │
        ▼
  Store.setSegments()
        │
        ▼
Path2dDebuggerService
        │
        ├── segmentModels ──► Outline / Points / Labels
        ├── projectedBounds ─► Grid / Viewport
        ├── projection ──────► Status / Axis
        └── issues ───────────► Status / Checks / 渲染错误样式
```

## Bus 事件

Bus 只用于跨组件通知，不代替 Store 保存业务状态。

当前主要事件包括：

- `onRenderControllerInitEnd`：Pixi 渲染控制器初始化完成。
- `onFitView`：请求适配当前路径。
- `onResetView`：请求恢复 1:1 视图。
- `onFocusSegment`：请求定位到指定线段。
- `onViewChanged`：视图缩放或位置变化后，通知依赖视图比例的组件重绘。

组件注册 bus 监听后，必须在卸载时取消监听：

```ts
bus.on("onRenderControllerInitEnd", handleInitEnd);
bus.off("onRenderControllerInitEnd", handleInitEnd);
```

## 新增渲染组件约定

新增 Pixi 渲染组件时：

1. 从 `inject` 获取 Store 和 `Path2dRenderController`。
2. 创建并管理自己的 Pixi layer。
3. 只监听自己关心的 Store 状态或 bus 事件。
4. 重绘前清理自己创建的显示对象。
5. 卸载时取消监听并销毁自己的 layer。
6. 不直接修改其他渲染组件的 layer。
7. 不在组件中重复解析原始路径对象。

## 边界原则

- Store 管响应式状态和业务入口。
- Service 管 Path2D 业务计算。
- Controller 管 Pixi 渲染资源和视图控制。
- 渲染组件管自己的显示对象。
- DOM 组件管界面展示、交互和事件转发。
- 不把 Pixi 运行时对象放入响应式 Store。
- 不在 `index.vue` 中堆积具体绘制算法。
