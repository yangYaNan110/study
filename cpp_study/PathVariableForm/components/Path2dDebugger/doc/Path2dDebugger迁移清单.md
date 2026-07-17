# Path2dDebugger 迁移清单

## 当前迁移总结（以代码现状为准）

### 已完成

- 基础 Pixi 初始化、Canvas 管理、Root/Layer 管理和资源销毁：`core/RenderController.ts`。
- 业务状态集中管理：`store/index.ts`，包括 `segments`、`selectedIndex`、`segmentModels`、`issues`、`showPoints`、`showLabels`、`showGrid`。
- Path2D 通用算法集中管理：`service/Path2dDebuggerService.ts`，包括路径模型构建、投影、包围盒、校验、标签位置和视图范围计算。
- 渲染组件：`Path2DGrid.vue`、`Path2DOutline.vue`、`Path2DPoints.vue`、`Path2DLabels.vue`。
- 画布视图能力：`Path2DViewport.vue`，包括尺寸同步、`fitView`、`resetView`、`focusSegment`。
- Pixi 相机交互：`Path2DZoom.vue`，包括滚轮缩放和拖拽移动。
- DOM 工具栏：`Path2DToolbar.vue`，包括适应、1:1、点、段号和网格开关。
- `index.vue` 已完成 props 到 Store 的 `segments / selectedIndex` 同步，并通过 provide 向子组件提供 Store 和 RenderController。

### 当前仍待迁移

- `Path2DStatus.vue`：独立的路径状态栏。
- `Path2DChecks.vue`：问题列表、错误/警告展示和点击定位。
- `Path2DAxis.vue` 或 DOM 轴覆盖层：坐标轴、原点和 `+X / +Z` 标识。

### 当前验证结论

- 路径、网格、端点、标签和选中状态已由独立组件分别负责渲染。
- 视图操作由 `Path2DToolbar` 发出事件，`Path2DViewport` 负责执行，Store 不直接持有 Pixi 对象。
- `pnpm bdev` 已构建通过；构建输出中的 ESLint warning 为项目既有问题。

以下原有章节保留为迁移设计说明；若与本节状态冲突，以本节和实际代码为准。

本文档用于跟踪 index_back.vue 到组件化 Path2dDebugger 的迁移进度。

迁移原则：

- 业务数据和计算进入 Store / Path2dDebuggerService。
- Pixi 基础设施进入 RenderController。
- 每个渲染组件只管理自己的 layer 和显示对象。
- Vue DOM 负责工具栏、状态和问题列表等界面 UI。
- 不把 Pixi 的 Graphics、Container、renderer、Observer 放进 Store。

## 一、已经迁移

### 1. 基础渲染初始化

对应旧版：

- PixiRenderer 初始化
- renderer canvas 获取
- root 和 layer 的基础管理
- renderer 销毁

当前位置：

- core/RenderController.ts
- index.vue

状态：已完成基础迁移。

### 2. Store 基础状态

已迁移的数据：

- segments
- selectedIndex
- showPoints
- showLabels
- showGrid
- segmentModels
- issues
- projectedBounds

当前代码：

- store/index.ts

说明：index.vue 已补充 selectedIndex 同步，以及 segments watcher 的 immediate 和 deep 配置。

### 3. Path2D 业务计算服务

已迁移：

- 线段、圆弧、折线识别
- segmentModels 构建
- 表达式读取和计算
- 三维点读取
- 二维投影
- 圆弧预览模型构建
- 路径长度计算
- 路径连续性校验
- 路径闭合校验
- 投影包围盒计算

当前位置：

- service/Path2dDebuggerService.ts

### 4. 网格渲染

已迁移：

- 网格范围计算
- 网格步长选择
- X/Z 轴绘制
- 网格 Graphics 创建和清理
- 网格状态变化后的重绘

当前组件：

- components/Path2DGrid.vue

当前行为与旧版一致：网格范围根据路径包围盒生成，视图移动到范围外时可能出现空白。

### 5. 画布尺寸同步

已迁移：

- ResizeObserver
- canvas 尺寸同步
- devicePixelRatio 处理
- 动态 canvas 的 CSS 定位

当前组件：

- components/Path2DViewport.vue

### 6. 缩放和拖拽相机

PixiRenderer 内部已经提供 CameraController，已通过组件启用：

- 鼠标滚轮缩放
- 缩放中心跟随鼠标
- 鼠标拖拽移动
- 缩放范围限制

当前组件：

- components/Path2DZoom.vue

## 二、已迁移的渲染能力

### 1. Path2DOutline.vue

需要迁移旧版的：

- drawSegment
- drawPolyline
- drawArcHelper
- 线段正常样式
- 选中线段样式
- 错误线段样式
- 线段点击选择
- 圆弧中心和半径辅助线

建议：

- 使用独立的 outlineLayer。
- 监听 store.segmentModels、store.selectedIndex 和 store.issues。
- 组件内部只清理和重建自己的 Graphics。

状态：已完成。

### 2. Path2DPoints.vue

需要迁移旧版的：

- drawPoints
- 起点和终点绘制
- 根据错误状态切换颜色
- 根据选中状态切换颜色
- showPoints 开关

建议：

- 使用独立的 pointLayer。
- 不重复解析原始 segments。

状态：已完成。

### 3. Path2DLabels.vue

需要迁移旧版的：

- drawLabels
- 线段编号文字
- 标签背景和边框
- 标签位置计算
- 标签缩放适配
- showLabels 开关

依赖的业务算法：

- getPolylineLabelPlacement
- getPolylineLength
- getPreferredNormal

这些算法建议迁移到 Path2dDebuggerService。

状态：已完成。

## 三、已迁移的视图控制能力

### 1. 适应视图 fitView

旧版功能：

- 根据路径包围盒和画布尺寸计算缩放比例。
- 设置 root.scale。
- 设置 root.position。
- 给路径预留边距。
- 限制缩放范围。

建议新增：

- RenderController.fitView(bounds, options)
- 或新增 Path2DViewController 组件负责视图适配。

状态：已完成。

### 2. 1:1 resetView

旧版功能：

- scale 设置为 1。
- 优先居中当前选中的线段。
- 没有选中线段时居中整个路径。
- 路径过大时只显示首段或合适范围。

建议：

- 由 RenderController 暴露 resetView。
- 具体 bounds 计算继续复用 Path2dDebuggerService。

状态：已完成。

### 3. focusSegment

旧版功能：

- 根据指定 segmentIndex 获取线段包围盒。
- 保持当前 scale。
- 将目标线段移动到画布中心。

建议：

- RenderController 提供 focusBounds 或 focusSegment。
- 问题列表和轮廓点击都调用 Store 的选择接口，再触发视图定位。

状态：已完成。

## 四、界面 UI 迁移状态

### 1. 工具栏

旧版包含：

- 适应按钮
- 1:1 按钮
- 点显示开关
- 段号显示开关
- 网格显示开关

建议拆分：

- components/Path2DToolbar.vue

组件通过 Store 接口修改状态，不直接修改 Pixi 对象。

状态：已完成。

### 2. 空路径提示

旧版：

- segmentModels 为空时显示“暂无可预览线段”。

建议：

- 由 index.vue 或 Path2DStatus.vue 使用 store.segmentModels.length 判断。

状态：待迁移。当前状态文本已由 Store 提供给工具栏，独立空路径提示尚未拆分。

### 3. 轴覆盖层

旧版：

- axis-overlay
- axis-origin
- +X 标签
- +Z 标签

建议：

- 如果轴需要跟随 Pixi root 移动，迁移为 Path2DAxis.vue。
- 如果轴固定在 canvas 中心，继续使用 DOM overlay。

状态：未完成。

### 4. 状态栏

旧版包含：

- 当前选中线段
- 线段类型
- 线段长度
- 错误信息
- 投影方向说明

建议：

- 将 selectedStatusText 迁移为 Store 派生状态。
- 新增 Path2DStatus.vue。

状态：未完成。

### 5. 问题检查列表

旧版包含：

- issues 列表
- warning / error 样式
- 点击问题定位到对应线段
- 没有问题时显示成功提示

建议：

- 新增 Path2DChecks.vue。
- 点击后调用 Store.selectSegment，再调用视图定位接口。

状态：未完成。

## 五、数据联动状态

### 1. segments 初始化同步（已完成）

当前 index.vue 使用以下 watcher：

    watch(
      () => props.segments,
      segments => {
        store.setSegments(segments);
      },
      {
        immediate: true,
        deep: true,
      },
    );

### 2. selectedIndex 同步

需要单独同步：

    watch(
      () => props.selectedIndex,
      index => {
        store.setSelectedIndex(index ?? -1);
      },
      {
        immediate: true,
      },
    );

### 3. 父组件事件回传

旧版通过 emit 回传选中线段：

- update:selectedIndex
- selectSegment

组件化后建议由 index.vue 统一处理子组件事件，再向外 emit。

## 六、建议迁移顺序

1. Path2DOutline.vue -完成
2. Path2DPoints.vue -完成
3. Path2DLabels.vue -完成
4. Store 的 segments / selectedIndex 完整联动 - 完成
5. fitView -完成
6. resetView -完成
7. focusSegment -完成
8. Path2DToolbar.vue - 完成
9. Path2DStatus.vue -完成
10. Path2DChecks.vue -完成
11. Path2DAxis.vue 或 DOM 轴覆盖层 -完成

## 七、迁移完成标准

当以下内容全部满足时，可以认为 index_back.vue 的核心功能迁移完成：

- 原始路径变化后，所有渲染组件同步更新。
- 线段、圆弧、折线可以正常显示。
- 点、标签、网格开关正常工作。
- 选中状态和错误状态正常显示。
- 鼠标滚轮缩放和拖拽正常。
- 画布尺寸变化后显示区域正常。
- 适应视图和 1:1 功能正常。
- 问题列表可以定位对应线段。
- 组件卸载后没有 bus、ResizeObserver 或 Pixi 资源泄漏。
