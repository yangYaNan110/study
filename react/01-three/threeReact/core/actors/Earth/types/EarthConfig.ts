
export interface TileSource {
    /** Return an imagery URL for a quadtree tile, or omit for a colored debug globe. */
    getUrl?(z: number, x: number, y: number): string;
}

export interface EarthConfig {
    // 球面半径，同时也是瓦片几何体的生成半径。
    radius: number;
    // 调度器允许选择的四叉树层级范围。
    minLevel: number;
    maxLevel: number;
    // 限制单帧可见瓦片数和缓存量，避免相机靠近时资源失控。
    maxVisibleTiles: number;
    maxCachedTiles: number;
    maxConcurrentRequests: number;
    source?: TileSource;
}

export interface EarthActorOptions {
    config?: Partial<EarthConfig>;
}

export const defaultEarthConfig: EarthConfig = {
    // 默认值优先保证调试可见性，而不是追求高精度地球表面。
    radius: 5,
    minLevel: 1,
    maxLevel: 6,
    maxVisibleTiles: 128,
    maxCachedTiles: 256,
    maxConcurrentRequests: 6,
};
