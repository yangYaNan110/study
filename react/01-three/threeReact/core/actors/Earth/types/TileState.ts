export interface TileKey {
    // 四叉树层级及该层中的列、行坐标。
    z: number;
    x: number;
    y: number;
}

export type TileStatus = "idle" | "queued" | "loading" | "ready" | "error" | "evicted";

export interface TileRecord {
    // id 由 z/x/y 派生，作为 Map 和渲染注册表的稳定键。
    key: TileKey;
    id: string;
    status: TileStatus;
    priority: number;
    lastUsedFrame: number;
    textureUrl?: string;
    error?: Error;
}

export interface TileTask {
    // 队列只存轻量任务；完整的生命周期状态仍留在 TileRecord。
    id: string;
    key: TileKey;
    priority: number;
}
