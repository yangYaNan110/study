# threeReact 架构总结

## 目标

基于 Three.js 构建一个带有 UE 风格思想的轻量库，并向 React 项目提供声明式组件。业务通过 React 创建 Actor，并通过组件为 Actor 组合能力。

核心目标不是复刻 UE，而是建立可扩展的 Actor、业务数据、组件和渲染调度基础，让地球、实例化、组合模型等不同对象都能使用自己的数据结构。

## 目录与职责

```text
threeReact/
├── core/
│   ├── system/
│   │   ├── Actor.ts
│   │   ├── Component.ts
│   │   └── RenderController.ts
│   ├── components/
│   │   ├── StaticMeshComponent.ts
│   │   ├── TransformComponent.ts
│   │   └── ...
│   └── actors/
│       ├── StaticMeshActor.ts
│       ├── EarthActor.ts
│       └── ...
├── output/                # 面向 React 业务的组件
└── doc/
```

```text
system     = 引擎最小运行时与基础抽象
components = 可复用的 Actor 能力
actors     = 按用途装配 Component，并持有自己的业务 Store
output     = React 的声明式包装
```

| 位置 | 职责 | 不应承担的职责 |
| --- | --- | --- |
| `core/system` | Actor、Component、RenderController 三个基础类 | React API、地球或实例化业务细节 |
| `core/components` | 可被多个 Actor 复用的能力 | 管理整个场景或 React 生命周期 |
| `core/actors` | 创建专属 Store，并装配合适的 Component | 引擎基础设施 |
| `output` | `<Canvas />`、`<Earth />` 等 React API | 四叉树、缓存、实例化等核心算法 |

## Actor：容器、Store 持有者与生命周期宿主

`Actor` 不实现地球、静态网格或实例化等具体能力。它是场景中的基本单元，负责：

- 通用信息：`id`、`name`、`tags`。
- 持有一个属于自己的业务 Store。
- 管理 Component 的添加、删除和查找。
- 将挂载、更新和销毁等生命周期分发给 Component。
- 可选地管理通用 Transform 与父子 Actor 关系。

```ts
class Actor<TStore> {
  id: string
  name: string
  readonly store: TStore
  components: Component[]

  addComponent(component: Component): void
  removeComponent(component: Component): void
  getComponent<T extends Component>(type: ComponentType<T>): T | undefined

  onAttach(controller: RenderController): void
  update(delta: number): void
  dispose(): void
}
```

Actor 基类不直接拥有 `tileUrl`、`quadTree`、`instances`、`geometry` 等特定字段。它只约束“每个 Actor 都有一个 Store”；Store 的具体结构由对应 Actor 决定。

## Store：一个 Actor 的业务数据中心

每个 Actor 有自己的 Store。Store 管理这个 Actor 的业务数据、运行状态以及多个组件需要共同访问的状态。

以地球为例：

```ts
interface EarthConfig {
  radius: number
  tileUrl: string
  maxLevel: number
}

class EarthStore {
  readonly config: EarthConfig
  readonly quadTree: QuadTree
  readonly visibleTiles = new Map<string, Tile>()
  readonly loadingTiles = new Set<string>()

  constructor(config: EarthConfig) {
    this.config = config
    this.quadTree = new QuadTree()
  }
}
```

- `EarthConfig` 是外部传入、可序列化的配置。
- `EarthStore` 是地球运行期间的共享业务数据中心。
- `quadTree`、可见瓦片、加载队列和缓存等地球状态都放在 `EarthStore`。

Store 由 Actor 创建并持有，相关组件通过所属 Actor 访问同一个 Store：

```text
EarthActor
  ├── store: EarthStore
  ├── TileSchedulerComponent ──读写──┐
  └── EarthRenderComponent ───读写───┴── EarthStore
```

这避免了两种问题：

- 把地球字段直接放在 `Actor` 基类，导致基类被具体业务污染。
- 每个 Component 维护一份自己的 `quadTree` 或 `visibleTiles`，导致状态分裂和同步困难。

Store 放“多个组件共同理解的业务状态”。完全私有的实现状态仍放在组件内部，例如 `EarthRenderComponent` 的临时材质、GPU buffer、事件订阅回调等。

## Component：具体能力的实现者

`Component` 是可附加能力的基类。它知道自己属于哪个 Actor，因此可以访问该 Actor 的 Store；每个组件只实现自己负责的业务逻辑。

```ts
abstract class Component {
  actor: Actor<unknown>

  onAttach?(controller: RenderController): void
  update?(delta: number): void
  onDetach?(): void
  dispose?(): void
}
```

公共且可复用的能力放入 `core/components`：

```text
components/
├── StaticMeshComponent.ts
├── TransformComponent.ts
├── InstancedMeshComponent.ts
├── AnimationComponent.ts
├── LightComponent.ts
└── CameraComponent.ts
```

例如，`StaticMeshComponent` 持有普通 `THREE.Mesh`，`InstancedMeshComponent` 持有 `THREE.InstancedMesh` 和实例矩阵数据。

只服务于地球的组件，例如 `TileSchedulerComponent`，可以先放在 `core/actors/earth`。等出现第二个复用场景时，再抽到 `core/components`。

## 预置 Actor：创建 Store 并装配组件

`core/actors` 中的预置 Actor 只做两件事：创建专属 Store，装配所需 Component。它们不把具体算法写在自身类中。

```text
StaticMeshActor
  ├── store: StaticMeshStore
  └── StaticMeshComponent

EarthActor
  ├── store: EarthStore
  ├── EarthComponent
  ├── TileSchedulerComponent
  └── EarthRenderComponent
```

```ts
class EarthActor extends Actor<EarthStore> {
  constructor(config: EarthConfig) {
    super(new EarthStore(config))

    this.addComponent(new EarthComponent())
    this.addComponent(new TileSchedulerComponent())
    this.addComponent(new EarthRenderComponent())
  }
}
```

组件挂载后，通过 `this.actor.store` 读取或写入地球共享状态。`EarthActor` 是装配入口，不负责四叉树遍历、瓦片缓存或 Mesh 更新。

未来可以按领域组织地球代码：

```text
core/actors/
└── earth/
    ├── EarthActor.ts
    ├── EarthStore.ts
    ├── EarthComponent.ts
    ├── TileSchedulerComponent.ts
    ├── EarthRenderComponent.ts
    └── EarthTypes.ts
```

## RenderController：场景运行时与渲染调度中心

`RenderController` 不理解地球或静态网格的业务。它负责：

- 持有 `renderer`、`scene`、当前 `camera` 和可选的 `composer`。
- 注册和移除 Actor。
- 统一帧循环：调用 Actor 的 `update()`，由 Actor 转发给 Component。
- 接收或查询组件提交的渲染对象、渲染批次和渲染层。
- 有后处理时调用 `composer.render()`；否则调用 `renderer.render(scene, camera)`。
- 管理 resize、DPR、暂停、恢复和销毁。

每个 React `<Canvas>` 最好有独立的 `RenderController`，不要使用全局单例。

## 渲染内容与后处理的注册方式

当前版本直接把 `RenderController` 作为受控的渲染上下文传给 Actor 和 Component，不单独创建 `RenderContext` 类。

Component 负责创建自己需要的 Mesh、实例化对象或后处理 Pass；但不直接调用 `scene.add()`、`scene.remove()`、`composer.addPass()`。它们通过 `RenderController` 的注册方法提交内容，并保存返回的注销函数。

```ts
class StaticMeshComponent extends Component {
  private removeRenderable?: () => void

  onAttach(controller: RenderController) {
    const mesh = new THREE.Mesh(geometry, material)
    this.removeRenderable = controller.addRenderable(mesh)
  }

  dispose() {
    this.removeRenderable?.()
  }
}
```

`RenderController` 可以逐步提供类似下面的受控方法：

```ts
class RenderController {
  addRenderable(object: THREE.Object3D): () => void
  addPostProcessPass(pass: Pass, priority?: number): () => void

  render(): void
}
```

这样各方职责为：

| 内容 | 负责方 |
| --- | --- |
| 创建 Mesh、瓦片、实例化对象 | Component |
| 创建后处理 Pass | 对应的后处理 Component |
| 添加、移除和管理场景对象 | RenderController |
| 添加、移除和排序 Composer Pass | RenderController |
| 执行每帧最终渲染 | RenderController |

`render()` 本身不需要在每一帧遍历所有 Actor 重新收集对象。Actor 和 Component 在挂载、卸载或渲染内容发生变化时，增量地注册或注销对象即可；例如地球瓦片变化时，仅添加新的可见瓦片并移除不可见瓦片。

后处理 Pass 必须集中由 `RenderController` 管理，因为它们有明确的执行顺序：

```text
RenderPass → SSAO → Bloom → Outline → FXAA → OutputPass
```

集中管理可以处理优先级、重复注册、卸载，以及 `OutputPass` 必须位于末尾等问题。未来如果 `RenderController` 对外接口变多，再将这些受控方法抽成独立 `RenderContext`；当前阶段直接传递 `RenderController` 即可。

## 数据流

```text
React 组件
  → 创建 / 更新 Actor
  → Actor 持有 Store 并将生命周期交给 Component
  → Component 读写 Actor Store，向 RenderController 注册或注销渲染内容
  → RenderController 调度并渲染内容
  → renderer 或 composer 输出画面
```

React 只负责声明、属性同步和卸载；Three.js 核心负责帧循环、资源管理与实际渲染。

## 最小实现顺序

1. `RenderController`：scene、camera、renderer、帧循环、resize、销毁。
2. `Actor`：Store 持有、Component 管理和生命周期转发。
3. `Component`：挂载、更新、卸载的统一约定。
4. `StaticMeshStore` 与 `StaticMeshComponent`：验证 Store、组件和渲染器的数据流。
5. `StaticMeshActor`：验证“Actor 创建 Store 并装配组件”的模式。
6. `output`：实现 `<Canvas>`、`<Actor>`、`<StaticMesh>` 等最小 React API。
7. `EarthActor + EarthStore + 地球专用组件`：再扩展四叉树、瓦片、缓存与调度。

## 命名记录

- `system` 中只保留 `Actor`、`Component`、`RenderController`。
- 公共组件统一放入 `core/components`。
- 预置 Actor 统一放入 `core/actors`，并持有各自的 Store。
- 当前 `RenderContrler.ts` 文件名中缺少 `ol`；后续实现时可统一为 `RenderController.ts`。
