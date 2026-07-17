# Path Variable 编辑器改造方案

## 目的

当前 `PathVariableForm` 同时包含基础模式、高级模式、Path2D 预览、模板编辑、线段编辑和 DXF 导入等功能。后续计划在不影响旧代码稳定性的前提下，逐步建立新的模块结构，等新结构验证稳定后再统一替换旧实现。

当前阶段所有新结构和迁移代码都暂时放在 `PathVariableForm/demo` 下进行开发和验证，不直接改造正式目录中的旧代码。

迁移完成并确认功能稳定后，再将 `demo` 中的实现替换到正式目录，最后清理旧代码。替换之前，旧实现继续作为当前生产入口使用。

## 目标目录结构

```text
PathVariableForm/
├─ index.vue                         # 旧入口，后续逐步收敛为编辑器容器
├─ components/
│  └─ Path2dDebugger/
│     ├─ index.vue                   # 对外使用的正式入口
│     ├─ views/                      # 页面级视图，负责组合布局
│     ├─ components/                 # 多个 View 共用的展示组件
│     ├─ store/                      # 本模块的响应式状态
│     ├─ service/                     # 业务计算、校验和数据转换
│     ├─ controller/                 # Pixi、Canvas 等外部对象控制
│     ├─ types/                      # 本模块类型
│     └─ demo/                       # 示例或调试装配页
│
├─ demo/                             # 新结构迁移区，暂不接入正式入口
│  ├─ README.md                      # 本文档
│  ├─ views/                         # 新的页面级视图
│  ├─ components/                    # 新的公共组件
│  ├─ store/                         # 新的编辑状态
│  ├─ service/                       # 新的业务服务
│  └─ ...
│
└─ ...
```

后续如果基础模式和高级模式也纳入新的编辑器结构，可以扩展为：

```text
PathVariableForm/
├─ components/
│  ├─ editor/
│  │  ├─ PathEditorShell.vue         # 页面布局、Tab、保存和取消
│  │  ├─ BasicPathEditor.vue         # 基础模式
│  │  └─ AdvancedPathEditor.vue      # 高级模式
│  ├─ basic/                         # 模板、尺寸、角点相关组件
│  ├─ advanced/                      # 线段、DXF 相关组件
│  └─ Path2dDebugger/                # 共享 2D 预览模块
├─ store/
│  ├─ PathEditorStore.ts             # Path 编辑会话 Store
│  └─ modules/                       # 基础、高级等功能模块
├─ service/
├─ types/
└─ demo/
```

## 各层职责

### `views`

`views` 是页面级组件，负责布局和功能组合，例如调试页、基础编辑页、高级编辑页。

可以处理页面级事件和组件拼装，但不负责：

- 几何计算；
- 直接修改 `modelValue` 的深层业务数据；
- 直接调用 `RectShape.update()` 或 `PathTemplateCompiler`；
- 手动触发画布刷新。

### `components`

`components` 放可被多个 View 复用的展示组件，例如工具栏、页脚、表格、选项面板和表单组件。

如果组件只属于某个 View，可以放在对应 View 的局部目录中，避免顶层 `components` 逐渐变成大杂烩。

### `store`

Store 保存响应式状态，并提供明确的操作接口。UI 组件通过 Store 方法修改数据，由 Store 状态变化驱动 UI 和画布更新。

例如：

```ts
editorStore.updateWidth(value);
editorStore.updateCorner(index, data);
debugStore.setSelectedIndex(index);
viewportStore.zoomToFit();
```

Store 可以按职责拆分，例如：

```text
store/
├─ Path2dDebugStore.ts       # 显示开关、选中状态、校验状态
├─ Path2dEditorStore.ts      # 编辑中的路径数据
└─ Path2dViewportStore.ts    # 缩放、平移和视口状态
```

拆分 Store 时必须避免多个 Store 同时维护同一份 `segments`。同一份业务数据只能有一个明确的数据源。

### `service`

Service 负责纯业务计算、校验和数据转换，尽量不依赖 Vue。

例如：

```text
Path2dDebuggerService
├─ buildSegmentModels()
├─ validatePath()
└─ projectSegmentModels()
```

模板编译、表达式计算、线段转换和路径校验优先放在 Service 或 Three/domain 层，不放在 Vue 组件中。

### `controller`

Controller 负责 Pixi、Canvas、ResizeObserver 等外部对象的生命周期和操作。

例如：

```text
Path2dRenderController
├─ init()
├─ createLayer()
├─ clearLayer()
├─ resize()
└─ unmount()
```

Controller 不负责维护编辑业务状态，业务状态由 Store 管理。

## 基础模式和高级模式

基础模式和高级模式共用一个编辑会话 Store，不各自维护一份 Path 数据。

```text
PathEditorStore
├─ variableDraft
├─ editorMode
├─ basic
│  ├─ currentTemplate
│  ├─ templateType
│  ├─ dimensions
│  └─ cornerInfos
├─ advanced
│  ├─ segments
│  ├─ selectedSegmentIndex
│  └─ dxfImportState
├─ preview
│  ├─ segments
│  ├─ issues
│  └─ projection
└─ actions
   ├─ switchMode()
   ├─ switchTemplate()
   ├─ updateWidth()
   ├─ updateCorner()
   ├─ addSegment()
   ├─ updateSegment()
   ├─ deleteSegment()
   ├─ importDxfAsync()
   ├─ save()
   └─ cancel()
```

基础模式修改模板数据后重新生成预览线段；高级模式修改线段数据后直接更新预览线段。右侧 `Path2dDebugger` 只负责显示标准化后的预览数据，不关心数据来自哪种编辑模式。

## 推荐数据流

```text
UI 组件
  ↓ 调用 Store 方法
PathEditorStore
  ↓ 调用模板 Handler / Three 几何逻辑
contourInfo 或 pathInfo.segments
  ↓ 生成标准化预览数据
preview.segments
  ↓
Path2dDebuggerStore
  ↓
Pixi RenderController
  ↓
2D 画布
```

组件不再通过 `bus.emit("refreshCount")` 强制刷新，也不直接操作 `modelValue` 的深层字段。全局事件仅在确实需要跨模块通信且没有更明确的数据归属时使用。

## provide/inject 约定

由编辑器最外层创建编辑会话 Store，并通过 `provide` 提供给后代组件：

```ts
const editorStore = new PathEditorStore();

provide(PATH_EDITOR_CONTEXT, {
  store: editorStore,
});
```

子组件通过统一的 composable 或 Context 类型获取 Store，不自行创建重复的编辑会话：

```ts
const { store } = usePathEditorContext();
```

`Path2dDebugger` 可以继续拥有自己的显示 Store，但编辑数据只能由上层编辑会话 Store 提供。

## Demo 迁移原则

1. 新代码优先在 `PathVariableForm/demo` 下建立，不直接覆盖旧实现。
2. 先在 `demo` 中建立新的 Store 接口，再迁移 UI 组件。
3. 先迁移基础模式的模板、尺寸和角点编辑。
4. 确认基础模式能够通过响应式状态驱动 UI 和画布刷新。
5. 再迁移高级模式的线段增删改和 DXF 导入。
6. 最后在 `demo` 中收拢保存、取消和表单校验逻辑。
7. 新旧代码并行验证期间，不删除旧文件，不修改公共持久化字段名。
8. `demo` 版本完成并稳定后，再整体替换正式目录中的对应实现。
9. 替换完成并验证通过后，再清理旧的刷新事件和重复逻辑。

## 迁移阶段

```text
第一阶段：设计
PathVariableForm/demo
  └─ 确定 views、components、store、service、controller 边界

第二阶段：迁移
PathVariableForm/demo
  └─ 在隔离目录中实现基础模式、高级模式和 Path2D 联动

第三阶段：验证
PathVariableForm/demo
  └─ 验证新增、编辑、切换模式、画布刷新、保存和取消

第四阶段：替换
demo 中的稳定实现
  └─ 替换 PathVariableForm 正式目录中的旧实现

第五阶段：清理
PathVariableForm 正式目录
  └─ 删除已被替换的旧组件和无用刷新逻辑
```

## 暂不处理的事项

- 暂不移动现有 `RectShape`、`PathInfo`、`PathTemplateCompiler` 等 Three/domain 文件。
- 暂不改变现有 Path 数据结构和保存格式。
- 暂不改变 `Path2dDebugger` 对外接口。
- 暂不引入新的全局状态管理依赖。
- 暂不删除旧的 `RAngleEdit.vue`、`RectTemplate.vue` 和高级模式代码。
- 暂不把 `demo` 版本接入正式的 `PathVariableForm/index.vue`。
- 在迁移完成前，正式目录和 `demo` 目录允许暂时存在重复实现。
