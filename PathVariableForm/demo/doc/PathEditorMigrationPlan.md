# Path 编辑器迁移实施计划

## 当前进度

### 已完成

- [x] 建立 `PathVariableForm/demo` 迁移目录，暂不接入正式旧入口。
- [x] 建立 demo 入口 `demo/index.vue`。
- [x] 建立基础模式和高级模式的 Tab 切换。
- [x] 建立基础模式视图 `BasicPathEditorView`。
- [x] 建立统一模板编辑区域 `BasicTemplateEditorView`。
- [x] 默认使用矩形模板，并支持切换圆形、L 型、梯形和斜切边模板。
- [x] 为不同模板建立独立的占位组件。
- [x] 将旧版矩形模板的主要 UI 迁移到 `RectTemplateEditor`：
  - 宽度、深度编辑区域；
  - 表达式编辑器；
  - 预览值；
  - 角点表格；
  - 操作列。
- [x] 建立矩形角点编辑弹窗 `RectCornerEditDialog`。
- [x] 实现矩形角点编辑按钮打开弹窗、取消和 demo 静态数据保存。
- [x] 统一 demo 页面模板使用 `div`，并补充组件职责注释。

### 尚未开始

- [ ] 建立 `demo/store/PathEditorStore.ts`。 -完成
- [x] 通过 `provide/inject` 共享编辑 Store。 -完成
- [x] 将矩形模板的静态数据替换为 Store 响应式数据。 -完成
- [x] 接入 `RectShape`、`PathTemplateCompiler`，生成真实 `previewSegments`。 -完成
- [ ] 将 `Path2dPreviewView` 接入正式 `Path2dDebugger`。 -完成
- [x] 实现矩形宽度、深度变化驱动右侧画布刷新。
- [x] 实现矩形角点变化驱动右侧画布刷新。
- [ ] 接入其他模板的真实编辑 UI 和几何逻辑。
- [ ] 迁移高级模式、线段编辑和 DXF 导入。
- [ ] 迁移保存、取消、表单校验和旧数据兼容流程。
- [ ] 用 demo 稳定实现替换正式旧代码。

### 当前阶段说明

目前 demo 已完成页面结构和矩形模板 UI 的第一轮迁移，但所有数据仍是组件内部的静态 demo 状态。下一步应优先实现 `PathEditorStore`，再进行矩形模板和右侧 Path2D 画布的联动。

## 一、当前目标

所有新结构暂时在 `PathVariableForm/demo` 下开发和验证，不接入正式的 `PathVariableForm/index.vue`。

当前第一阶段只打通：

```text
矩形模板 UI
  ↓ 修改宽度/深度
PathEditorStore
  ↓ 重新生成轮廓
previewSegments
  ↓
Path2dDebugger
  ↓
右侧 2D 画布刷新
```

## 二、Store 规划

当前只建立一个编辑会话 Store：

```text
demo/store/PathEditorStore.ts
```

暂时不拆分 `BasicTemplateStore`、`AdvancedPathStore` 等多个 Store。

`PathEditorStore` 统一管理：

- 当前编辑模式；
- 当前模板类型；
- 模板编辑数据；
- 矩形模板的宽度、深度和角点信息；
- 当前预览线段 `previewSegments`；
- 当前选中线段；
- 更新、重建、保存和取消等操作。

同一份业务数据只能由一个 Store 维护，UI 组件不直接修改 `RectShape`、`PathInfo` 或 `modelValue` 的深层字段。

## 三、第一阶段：打通矩形模板和画布

### 1. 建立 `PathEditorStore`

文件：

```text
demo/store/PathEditorStore.ts
```

先实现以下状态：

```text
templateType
rectTemplate
  ├─ width
  ├─ depth
  └─ cornerInfos
previewSegments
selectedSegmentIndex
```

先使用 demo 默认数据初始化，暂不读取旧版 `modelValue`。

### 2. 在 demo 根入口创建 Store

文件：

```text
demo/index.vue
```

由根入口创建 `PathEditorStore`，后续通过 `provide` 提供给基础模板编辑组件和右侧预览组件。

### 3. 接入矩形模板宽度和深度

文件：

```text
demo/components/basic/templates/RectTemplateEditor.vue
```

将当前组件中的本地静态状态改为读取 Store：

```text
输入宽度/深度
  ↓
store.updateRectWidth()
store.updateRectDepth()
```

### 4. 生成矩形预览线段

由 Store 调用现有 Three/domain 能力：

```text
RectShape.update()
  ↓
PathTemplateCompiler.compile()
  ↓
previewSegments 更新
```

几何生成逻辑不写入 Vue 组件。

### 5. 接入右侧 `Path2dDebugger`

文件：

```text
demo/views/Path2dPreviewView.vue
```

将当前占位文字替换为 `Path2dDebugger`，把 Store 的 `previewSegments` 传入：

```text
PathEditorStore.previewSegments
  ↓
Path2dDebugger
  ↓
Path2dDebuggerStore
  ↓
Pixi RenderController
```

先确认矩形宽度和深度变化能够驱动画布刷新。

## 四、第二阶段：接入矩形角点编辑

### 1. 接入角点表格

将 `RectTemplateEditor` 中的静态 `cornerInfos` 替换为 Store 数据。

### 2. 接入角点编辑弹窗

文件：

```text
demo/components/basic/templates/RectCornerEditDialog.vue
```

弹窗只负责：

- 展示角点编辑表单；
- 处理表单输入；
- 通过事件返回编辑结果。

实际角点更新由 `PathEditorStore.updateRectCorner()` 负责。

### 3. 打通角点到画布的更新链路

```text
角点弹窗保存
  ↓
PathEditorStore.updateRectCorner()
  ↓
RectShape.update()
  ↓
previewSegments 更新
  ↓
Path2dDebugger 重绘
```

## 五、第三阶段：模板切换

当前模板默认是矩形模板：

```ts
templateType = "rect";
```

模板切换流程：

```text
选择其他模板
  ↓
PathEditorStore.switchTemplate()
  ↓
初始化对应模板数据
  ↓
生成统一的 previewSegments
  ↓
Path2dDebugger 刷新
```

每种模板的尺寸、角点列表和参数编辑 UI 由各自模板组件负责，不抽取为所有模板共用的角点组件。

```text
demo/components/basic/templates/
├─ RectTemplateEditor.vue
├─ CircleTemplateEditor.vue
├─ LShapeTemplateEditor.vue
├─ TrapezoidTemplateEditor.vue
└─ BevelTemplateEditor.vue
```

模板组件只负责 UI 和事件转发，模板计算由 Store 调用对应的 Handler 或 Three/domain 能力完成。

## 六、第四阶段：完善 Path2D 预览

在矩形模板联动稳定后，再完善：

1. 预览缩放和适配；
2. 网格显示开关；
3. 点显示开关；
4. 段号显示开关；
5. 线段选中同步；
6. 错误线段高亮；
7. 投影方向和坐标轴显示；
8. 画布尺寸变化适配。

`Path2dDebugger` 负责展示和渲染，编辑业务仍由 `PathEditorStore` 管理。

## 七、第五阶段：高级模式迁移

基础模式链路稳定后，再迁移高级模式：

```text
AdvancedPathEditorView
├─ 变量公共信息
├─ DXF 导入
├─ 线段列表
├─ 线段新增
├─ 线段编辑
└─ 线段删除
```

高级模式修改统一调用：

```text
PathEditorStore.addSegment()
PathEditorStore.updateSegment()
PathEditorStore.deleteSegment()
PathEditorStore.importDxfAsync()
```

高级模式和基础模式共用同一个 `previewSegments`，右侧仍然只使用同一个 `Path2dDebugger`。

## 八、第六阶段：保存、取消和表单校验

迁移完成后，将保存和取消逻辑收拢到 `PathEditorStore`：

```text
save()
  ├─ 校验当前模式数据
  ├─ 生成最终 PathInfo
  ├─ 设置 PathSourceKind
  └─ 返回编辑结果

cancel()
  └─ 丢弃 demo 编辑草稿
```

保存前需要验证：

- 当前模板数据是否合法；
- segments 是否为空；
- 表达式是否能够计算；
- 角点参数是否超出几何限制；
- 路径是否存在连接异常。

## 九、第七阶段：接入旧数据和持久化流程

新结构内部联动稳定后，再接入旧版数据：

```text
旧 modelValue
  ↓
PathEditorStore.init()
  ↓
转换为 demo 编辑状态
  ↓
用户编辑
  ↓
PathEditorStore.save()
  ↓
写回兼容的 PathInfo / contourInfo
```

接入时保持现有：

- Path 数据结构；
- 持久化字段名；
- `PathInfo` 结构；
- `contourInfo` 结构；
- `PathSourceKind` 语义；
- 历史 JSON 兼容逻辑。

## 十、最终替换旧代码

只有满足以下条件后，才替换正式目录中的旧实现：

1. 基础模式模板切换稳定；
2. 矩形 W/D 修改可以刷新画布；
3. 角点编辑可以刷新画布；
4. 高级模式线段编辑稳定；
5. DXF 导入稳定；
6. 保存和取消流程通过验证；
7. 历史数据加载和保存兼容；
8. UI、画布和场景数据没有分叉；
9. 相关构建、Lint 和格式检查通过。

替换顺序：

```text
demo 新实现稳定
  ↓
替换 PathVariableForm 正式入口
  ↓
验证正式编辑流程
  ↓
清理旧版 RAngleEdit、RectTemplate 和重复刷新逻辑
```

在替换完成前，旧代码继续保留并作为正式入口使用。

### 接下来建议按这个顺序：

先做基础模式联动验证  
修改矩形宽度、深度，确认右侧画布刷新。-完成
修改四个角点，确认圆角/斜切实时刷新。 -完成
验证后把迁移清单第 31、32 项标记完成。

完善 Path2dDebugger demo 副本  
检查 Store、Service、Controller 的路径和职责。
确认选中线段、网格、点、标签、校验信息都正常。 -完成

接入其他基础模板  
圆形
L 型
梯形
斜切边
每种模板独立维护 UI 和几何转换，但共用 previewSegments。

再迁移高级模式 -进行中
变量公共信息 -完成
线段新增、编辑、删除
DXF 导入

最后迁移保存、取消、校验和旧数据兼容。-进行中
