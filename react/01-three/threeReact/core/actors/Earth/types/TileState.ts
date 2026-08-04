/** 四叉树瓦片键接口，用于表示四叉树中的一个瓦片。 */
export interface TileKey {
    /** 四叉树层级。 */
    z: number;
    /** 四叉树列坐标。 */
    x: number;
    /** 四叉树行坐标。 */
    y: number;
}
/** 四叉树瓦片状态枚举类型。 */
export type TileStatus = "idle" | "queued" | "loading" | "ready" | "error" | "evicted";
/** 四叉树瓦片记录接口，用于表示四叉树中的一个瓦片的生命周期状态。 */
export interface TileRecord {
    /** id 由 z/x/y 派生，作为 Map 和渲染注册表的稳定键。 */
    key: TileKey;
    /** 四叉树瓦片的唯一标识符。 */
    id: string;
    /** 四叉树瓦片的状态。 */
    status: TileStatus;
    priority: number;
    lastUsedFrame: number;
    textureUrl?: string;
    error?: Error;
}
/** 四叉树瓦片任务接口，用于表示四叉树中的一个瓦片的任务。 */
export interface TileTask {
    /** 队列只存轻量任务；完整的生命周期状态仍留在 TileRecord。 */
    /** 任务的唯一标识符。 */
    id: string;
    /** 任务的四叉树键。 */
    key: TileKey;
    priority: number;
}
