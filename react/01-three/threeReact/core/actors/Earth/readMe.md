# Earth Actor 设计

`EarthActor` 是一个拥有瓦片调度能力的领域 Actor。它负责创建 Earth 专属的 Store 并装配组件；四叉树筛选、资源加载、缓存和 Mesh 渲染等细节不直接写进 Actor。

## 目录规划

Earth 内部按职责类型分层，而不是按某次功能拆分目录。组件私有的辅助类与对应组件放在同一个目录中。

```text
Earth/
├── index.ts
├── components/
│   ├── TileSchedulerComponent/
│   │   ├── index.ts
│   │   ├── TileSelector.ts
│   │   ├── TilePriorityQueue.ts
│   │   ├── TileRequestQueue.ts
│   │   └── TileScheduler.ts
│   │
│   ├── TileRenderComponent/
│   │   ├── index.ts
│   │   ├── TileMeshFactory.ts
│   │   ├── TileMaterialFactory.ts
│   │   └── TileRenderRegistry.ts
│   │
│   └── TileLoaderComponent/
│       ├── index.ts
│       ├── TileLoader.ts
│       ├── TileRequest.ts
│       └── TileCache.ts
│
├── store/
│   ├── EarthStore.ts
│   └── TileStore.ts
│
├── types/
│   ├── EarthConfig.ts
│   ├── TileKey.ts
│   ├── TileNode.ts
│   ├── TileState.ts
│   ├── TileSource.ts
│   └── TileTask.ts
│
└── utils/
    ├── TileMath.ts
    ├── TileScheme.ts
    ├── FrustumUtils.ts
    └── SphereProjection.ts
```

## 各目录职责

| 目录 | 职责 |
| --- | --- |
| `components/` | 生命周期入口。每个 Component 读写 Store，并管理自己特有的辅助类。 |
| `store/` | 跨组件共享且长期存在的运行状态，不放具体算法。 |
| `types/` | 纯类型、枚举和数据描述；尽量不依赖 Three.js 实例。 |
| `utils/` | 无状态工具函数，例如瓦片 ID、坐标转换、视锥判断和球面投影。 |

## 第一版范围

第一版先只实现两个组件：

```text
components/
├── TileSchedulerComponent/
└── TileRenderComponent/
```

- `TileSchedulerComponent`：根据相机选择目标瓦片，维护请求优先级、并发加载、取消请求和缓存淘汰；它将瓦片状态写入 `TileStore`。
- `TileRenderComponent`：读取 `TileStore` 中状态为 `ready` 的瓦片，创建或销毁 Mesh，并通过 `RenderController` 增量注册或移除渲染对象。

`TileLoader`、请求队列和缓存先由 `TileSchedulerComponent` 持有，不急于拆为独立 Component。等同一套调度能力需要同时服务影像、地形高程或矢量瓦片时，再增加 `TileLoaderComponent`。

## 数据流

```text
Camera
  ↓
TileSchedulerComponent
  ↓ 选择、排队、加载、缓存
TileStore
  ↓ ready / evicted
TileRenderComponent
  ↓
RenderController
```

这样可以保持边界清晰：Actor 负责装配，Store 负责共享状态，Component 负责生命周期与具体能力，普通类负责局部算法和数据结构。
