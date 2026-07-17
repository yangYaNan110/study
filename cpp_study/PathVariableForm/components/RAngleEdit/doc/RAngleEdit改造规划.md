# RAngleEdit 基础模式改造规划

## 1. 改造目标

构建独立的基础模板编辑模块，参考 `Path2dDebugger` 和 `demo` 的组织方式：

- UI 组件只负责展示、表单交互和事件转发。
- Store 负责编辑会话、模板切换、模板参数更新、表达式计算和预览数据同步。
- 所有子组件通过 `provide/inject` 获取同一个 `RAngleEditStore`。
- 当前只实现基础模式，不改造高级模式，也不实现 2D R 角编辑。
- 支持矩形、圆形、L 型、梯形、斜切边模板切换；后面三种先使用空占位组件。
- 保持已有变量保存、取消、`contourInfo`、`pathInfo` 和右侧预览链路兼容。

## 2. 数据源和 Store 设计

Store 不维护与真实模板并行的 `rectData`、`circleData` UI 数据副本。

`RAngleEditStore` 内部维护真实模板对象：

```text
RAngleEditStore
├─ rectTemplate: RectShape
├─ circleTemplate: CicleShape
├─ templateType: 当前模板类型
├─ modelValue: 外层变量编辑对象
└─ previewSegments: 当前模板生成的预览线段
```

真实模板对象是唯一业务数据源，UI 通过语义化接口访问数据：

```ts
getRectTemplateW(): string;
getRectTemplateWValue(): number;
updateRectTemplateW(value: string | number): void;

getRectTemplateD(): string;
getRectTemplateDValue(): number;
updateRectTemplateD(value: string | number): void;

getRectTemplateCornerInfos(): RAngleCornerInfo[];
updateRectTemplateCorner(index: number, corner: RAngleCornerInfo): void;

getCircleTemplateR(): string;
getCircleTemplateRValue(): number;
getCircleTemplateArcSegmentValue(): number;
updateCircleTemplateR(value: string | number): void;
```

接口的职责边界：

- getter 直接从当前真实模板读取表达式或角点数据。
- setter 负责更新真实模板、调用模板 `update()`、同步外层 `contourInfo` 和重建预览。
- 表达式原文和计算值分开处理，计算值不能覆盖原表达式。
- UI 不直接访问 `RectShape`、`CicleShape`、`update()` 或 `contourInfo`。
- Store 对外暴露的接口必须有中文注释，说明数据来源、参数、返回值和副作用。

模板切换规则：

- 切换矩形或圆形时，激活对应真实模板并更新当前预览。
- 切换到未实现模板时只显示占位组件，不生成错误几何数据。
- 占位模板不能覆盖已有正式 `contourInfo`。
- 每个模板的编辑草稿由 Store 内部保留，模板切换不能丢失已输入数据。

### 模板注册表

当模板数量增加时，Store 通过模板注册表查找 Handler，不在 Store 中持续增加模板类型判断分支：

```ts
const templateHandlerMap = {
  rect: rectTemplateHandler,
  circle: circleTemplateHandler,
  "l-shape": lShapeTemplateHandler,
};
```

- 注册表的 key 使用 `RAngleTemplateType`。
- 已实现模板注册对应 Handler。
- 未实现模板可以暂时没有 Handler，由 Store 返回空值并显示占位组件。
- 新增模板时新增 Handler、注册表项和编辑组件，不修改已有模板 Handler。
- Store 只负责从注册表获取当前 Handler、转发通用操作和同步外层数据。

## 3. 目录结构

```text
RAngleEdit/
├─ index.vue                         # 创建 Store、provide Store、暴露确认和取消接口
├─ store/
│  ├─ index.ts                       # provider context 和 Store UI 接口
│  └─ RAngleEditStore.ts             # 真实模板编辑会话和业务入口
├─ handler/
│  ├─ IRAngleTemplateHandler.ts      # 已实现模板 Handler 公共能力
│  ├─ RectTemplateHandler.ts          # 矩形模板领域逻辑
│  └─ CircleTemplateHandler.ts        # 圆形模板领域逻辑
├─ types.ts                          # 模板类型、模板选项、角点编辑类型
├─ components/
│  ├─ BasicVariableInfoView.vue      # 变量名称和引用名称
│  ├─ BasicTemplateEditorView.vue    # 模板选择和动态组件分发
│  ├─ RectTemplateEditor.vue         # 矩形尺寸和角点编辑
│  ├─ CircleTemplateEditor.vue       # 圆形半径和分段数展示
│  ├─ LShapeTemplateEditor.vue       # L 型占位组件
│  ├─ TrapezoidTemplateEditor.vue    # 梯形占位组件
│  ├─ BevelTemplateEditor.vue        # 斜切边占位组件
│  └─ RectCornerEditDialog.vue       # 矩形角点临时编辑弹窗
└─ doc/
   └─ RAngleEdit改造规划.md
```

## 4. 组件职责和调用规则

### `index.vue`

- 创建一个独立的 `RAngleEditStore` 实例。
- 通过 `RANGLE_EDIT_CONTEXT` provider 提供 Store。
- 监听变量上下文刷新事件，通知 Store 重新计算表达式预览。
- 通过 `defineExpose` 向外层提供 `commit()` 和 `cancel()`。

### `BasicVariableInfoView.vue`

- 展示和编辑变量名称、引用名称。
- 通过 Store 的 `name`、`refName` 和更新接口驱动表单。
- 不处理模板参数、模板切换和预览逻辑。

### `BasicTemplateEditorView.vue`

- 展示模板选择器。
- 调用 Store 的 `switchTemplate()` 切换当前模板。
- 根据当前模板分发矩形、圆形或占位编辑组件。
- 不处理具体模板参数。

### `RectTemplateEditor.vue`

- 使用 `getRectTemplateW()`、`getRectTemplateD()` 读取表达式。
- 使用 `updateRectTemplateW()`、`updateRectTemplateD()` 更新尺寸。
- 使用角点 getter 渲染表格。
- 角点弹窗确认后调用 `updateRectTemplateCorner()`。
- 不直接修改 `RectShape`，不直接调用 `update()`。

### `CircleTemplateEditor.vue`

- 使用 Store 接口读取和更新圆形半径。
- 分段数只读展示，计算规则由 Store 和真实模板负责。
- 不直接修改 `CicleShape`。

### 占位模板组件

L 型、梯形、斜切边组件当前只展示“暂未实现”，保留完整的模板切换入口。后续扩展时只增加自身 UI 和 Store 接口，不修改模板选择框架。

### `RectCornerEditDialog.vue`

- 接收当前角点的临时快照。
- 负责角点类型、圆角半径和斜切距离的表单编辑。
- 取消时不回写 Store。
- 确认时通过事件把结构化角点数据交给 `RectTemplateEditor`，再由 Store 更新真实角点。

## 5. Service 层边界

当前不强制新增 Service 文件。只有当以下逻辑复杂到影响 Store 可读性或需要独立复用时，才抽取 `service/RAngleEditService.ts`：

- 模板类型识别和模板选项整理。
- 领域角点与 UI 角点之间的数据转换。
- 表达式计算和异常回退。
- 模板参数校验。
- 预览线段转换。

Service 必须保持无 Vue、无 Element Plus、无组件生命周期依赖，不保存响应式状态，不直接修改外层 `modelValue`。

## 6. 注释规则（强制）

以后读取本规划并继续开发 RAngleEdit 时，新增或修改代码必须补充简要中文注释，参考 `demo/index.vue` 的写法。

- 每个 Vue 组件要说明组件职责和边界。
- 父组件模板中，每个子组件标签正上方必须有注释，说明子组件用途、数据来源和事件用途。
- 每个 class、interface、type、关键字段和公开方法必须有注释。
- 每个 `props`、`emits`、provider/inject 接口要说明数据流向和调用边界。
- 注释必须与实际实现保持一致，逻辑变化时同步更新注释。
- 占位组件要说明当前只展示空状态，以及后续扩展入口。

## 7. 兼容性和验证

- 不修改高级模式和 `Path2dDebugger` 内部实现。
- 不修改既有持久化字段名称和外层确认/取消事件名称。
- 新增或编辑模板时，确认后才写入正式数据；取消必须恢复编辑前数据。
- 表达式原文必须保留，变量上下文变化后重新计算预览值。
- 直角和斜切角的半径表达式、半径值必须为空；只有圆角显示半径相关字段。
- 手动验证：新建矩形、编辑宽度和深度、输入变量表达式、编辑四个角点、切换圆形和占位模板、取消、确认后重新打开。
- 代码修改后至少执行 `pnpm bdev`，并检查 Store、组件和文档中的接口调用是否一致。

## 8. 实施范围

- 基础 UI、provider/inject、真实 Store 和模板 Handler 按本规划实现。
- 矩形和圆形提供真实编辑能力。
- L 型、梯形、斜切边保留模板入口和空占位组件。
- 高级模式和 2D R 角编辑不在本次范围内。

## 9. 领域对象响应式规则

- `RectShape`、`CicleShape` 等领域 class 实例必须保持普通对象，禁止整体使用 Vue `reactive` 包裹。
- Store 中使用内部更新版本或消息订阅机制作为 UI 更新通知，不改变领域对象本身的 class 语义。
- 每个模板编辑接口完成 `setParams()`、角点更新或 `update()` 后，必须发布更新信号并重建预览。
- UI 只能通过 Store getter 重新读取模板数据，不能直接监听或修改领域对象内部字段。
- 如果单一更新版本无法覆盖复杂的跨模块刷新场景，再使用明确的消息订阅；消息订阅必须在组件卸载时解除。

## 10. 规划文档维护规则

规划文档只保留当前最终方案，不记录临时实现、历史删除动作、迁移过程或阶段性方案；后续更新时直接修改最终架构、职责边界和验证标准。

## 11. 当前完成状态

- 基础模式入口和变量基础信息 UI：已完成。
- 模板选择和动态组件分发：已完成。
- 矩形、圆形编辑组件：已完成。
- L 型、梯形、斜切边占位组件：已完成。
- `provide/inject` Store 上下文：已完成。
- `RAngleEditStore` 会话协调器：已完成。
- `handler/` 模板 Handler 目录和公共接口：已完成。
- 矩形、圆形 Handler：已完成。
- 模板注册表：已接入 Store，当前注册矩形和圆形 Handler。
- 表达式原文、变量上下文计算和预览刷新：已完成。
- 矩形角点编辑及直角、圆角、斜切角字段约束：已完成。
- 外层 `contourInfo` 同步、确认和取消链路：已接入。
- 右侧既有预览联动：已接入基础模板预览数据。
- 高级模式、2D R 角编辑和未实现模板的真实几何逻辑：按范围暂不实现。

## 12. 旧版功能细节对齐与回归验证

基础模式核心链路完成后，继续对照旧版行为进行细节对齐。对齐过程中保持当前 Store、Handler 和 provider 架构不变，具体差异由对应 Handler 或编辑组件负责。

### 12.1 矩形模板对齐 -完成

- 宽度、深度继续使用 `ExpressionEditor`，保留表达式原文。
- 宽度、深度预览值使用当前变量上下文重新计算。
- 角点表完整展示方向、类型、圆角表达式、圆角值、圆弧分段数、斜切表达式和斜切值。
- 直角的圆角字段为空，斜切角的圆角字段为空，圆角的斜切字段为空。
- 修改尺寸或角点后，真实 `RectShape`、`contourInfo` 和右侧预览同步更新。
- 角点编辑取消时不修改 Store，确认时只通过 Store 更新真实角点。

### 12.2 圆形模板对齐 -完成

- 半径继续使用 `ExpressionEditor`，保留表达式原文。
- 半径预览值使用当前变量上下文重新计算。
- 半径变化后重新计算圆形分段数，并刷新圆形预览。
- 分段数按照现有圆形模板规则只读展示；如果后续开放编辑，必须通过 Circle Handler 更新。
- 圆形模板切换、编辑和确认后，外层 `contourInfo` 保持正确的圆形模板结构。

### 12.3 外层链路对齐

- 新建基础变量后，默认矩形模板行为与旧版一致。
- 编辑已有矩形或圆形时，模板参数、角点和表达式正确回填。
- 确认时名称、引用名称和当前模板数据正确写回外层对象。
- 取消时恢复进入编辑前的名称、引用名称和 `contourInfo`。
- 基础模式确认后，既有 `PathTemplateCompiler` 和右侧预览链路继续正常工作。
- 高级模式、`Path2dDebugger` 和已有路径数据不受影响。

### 12.4 回归验证清单

- 新建矩形：修改宽度、深度、四个角点并确认保存。
- 编辑矩形：分别验证直角、圆角、斜切角字段显示和数据恢复。
- 输入变量表达式：修改变量值后，尺寸、半径、角点预览值能够刷新。
- 新建圆形：修改半径，验证分段数和右侧预览更新。
- 编辑已有圆形：验证半径、分段数和模板类型正确恢复。
- 在矩形、圆形和占位模板之间切换，确认各模板草稿不丢失。
- 点击取消，确认所有未确认修改都被恢复。
- 点击确认并重新打开，确认保存数据与界面显示一致。
- 检查高级模式、Path2dDebugger、路径保存和重新加载功能没有回归。

### 12.5 完成标准

- 上述功能细节与旧版行为一致或具备明确的兼容说明。
- 所有模板参数都通过对应 Handler 处理，UI 不直接修改领域对象。
- 表达式原文、计算值和预览结果保持一致。
- `pnpm bdev` 构建通过，并完成至少一轮手动回归验证。
