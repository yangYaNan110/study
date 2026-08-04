
/** 瓦片来源接口，用于获取四叉树瓦片的图像URL。 */
export interface TileSource {
    /** 获取四叉树瓦片的图像URL。如果未实现，则使用调试球面。 */
    getUrl?(z: number, x: number, y: number): string;
}
/** 地球配置接口，用于配置地球的渲染行为。 */
export interface EarthConfig {
    /** 球面半径，同时也是瓦片几何体的生成半径。 */
    radius: number;
    /** 调度器允许选择的四叉树层级范围。 */
    minLevel: number;
    maxLevel: number;
    /** 限制单帧可见瓦片数和缓存量，避免相机靠近时资源失控。 */
    maxVisibleTiles: number;
    /** 限制缓存的四叉树瓦片数，避免内存泄漏。 */
    maxCachedTiles: number;
    /** 限制同时发送的四叉树瓦片请求数，避免网络拥塞。 */
    maxConcurrentRequests: number;
    /** 瓦片来源。 */
    source?: TileSource;
}
/** 地球演员选项接口，用于配置地球演员的渲染行为。 */
export interface EarthActorOptions {
    config?: Partial<EarthConfig>;
}
/** 默认地球配置。 */
export const defaultEarthConfig: EarthConfig = {
    // 默认值优先保证调试可见性，而不是追求高精度地球表面。
    radius: 5,
    minLevel: 1,
    maxLevel: 18,
    maxVisibleTiles: 128,
    maxCachedTiles: 256,
    maxConcurrentRequests: 6,
};
