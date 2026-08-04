import { EarthConfig, defaultEarthConfig } from "../types/EarthConfig";
import { TileStore } from "./TileStore";

export class EarthStore {
    // 配置是 Earth 的静态输入；运行时瓦片状态统一放在 tileStore。
    readonly config: EarthConfig;
    /** 四叉树瓦片状态存储。 */
    readonly tileStore = new TileStore();
    // 单调递增的帧号，用于记录瓦片最近一次被需要的时间。
    frame = 0;

    constructor(config: Partial<EarthConfig> = {}) {
        // 调用方只需传想覆盖的配置项。
        this.config = { ...defaultEarthConfig, ...config };
    }
}
