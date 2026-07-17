# Demo 视图规划

`views` 只放页面级视图，负责页面布局、功能组合和页面级事件转发。当前阶段只规划职责，不实现具体组件。

## 计划中的视图

### `PathEditorHeaderView.vue`

编辑器顶部区域，负责标题、变量基础信息入口，以及关闭或返回操作。

不负责模板计算、线段生成和画布刷新。

### `PathEditorModeView.vue`

基础模式和高级模式的切换区域，负责展示 Tab、切换当前模式，以及处理不可用模式。

### `BasicPathEditorView.vue`

基础模式页面，负责组合模板选择、模板尺寸编辑、角点列表、角点编辑弹窗和基础模式校验提示。

具体数据修改通过 `PathEditorStore` 完成，不直接操作 `RectShape` 或 `contourInfo`。

### `AdvancedPathEditorView.vue`

高级模式页面，负责组合变量公共信息、DXF 导入、线段列表、线段新增/编辑/删除弹窗和高级模式校验提示。

具体线段修改通过 `PathEditorStore` 完成，不在 View 内维护另一份 `segments` 数据。

### `Path2dPreviewView.vue`

右侧 2D 预览区域，负责组合 `Path2dDebugger`，接收编辑器 Store 的预览线段，并转发选中线段等页面级事件。

Pixi 生命周期和绘制逻辑继续由 `Path2dDebugger` 内部的 controller、store 和 service 负责。

### `PathEditorFooterView.vue`

编辑器底部操作区域，负责取消、保存、表单校验结果展示，以及向外层转发保存和取消事件。

保存和取消的具体数据处理由 `PathEditorStore` 提供。

## 页面组合关系

```text
demo/index.vue
├─ PathEditorHeaderView
├─ PathEditorModeView
├─ BasicPathEditorView 或 AdvancedPathEditorView
├─ Path2dPreviewView
└─ PathEditorFooterView
```

## 后续实现顺序

1. 实现顶部和底部静态布局。
2. 实现基础/高级模式切换。
3. 实现 `BasicPathEditorView`，接入基础模式 Store。
4. 实现 `AdvancedPathEditorView`，接入高级模式 Store。
5. 实现 `Path2dPreviewView`，接入统一预览数据。
6. 在 `demo/index.vue` 中创建 Store、provide 上下文并完成整体联动。

