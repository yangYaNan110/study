import { Actor } from "../../system/Actor";
import { TileRenderComponent } from "./components/TileRenderComponent";
import { TileSchedulerComponent } from "./components/TileSchedulerComponent";
import { EarthStore } from "./store/EarthStore";
import { EarthConfig, EarthActorOptions } from "./types/EarthConfig";

/** 
 * 球体，其可见表面被管理为四叉树瓦片。
 * Actor 只负责装配组件，不参与瓦片筛选或 Mesh 创建。 
 * 
 */
export class EarthActor extends Actor {
    name = "earthActor";
    readonly store: EarthStore;

    constructor(options: EarthActorOptions) {
        super();
        /** Store 在 Actor 创建时生成，Earth 的所有组件共享这一份状态。 */
        this.store = new EarthStore(options.config);
        /** 四叉树瓦片调度组件负责筛选和排序四叉树中的瓦片。 */
        const tileScheduler = new TileSchedulerComponent();
        /** 四叉树瓦片渲染组件负责渲染四叉树中的瓦片。 */
        const tileRender = new TileRenderComponent();
        
        this.addComponent(tileScheduler);
        this.addComponent(tileRender);
    }
}

export type { EarthConfig } from "./types/EarthConfig";
export type { TileKey, TileRecord, TileStatus } from "./types/TileState";

/**
 * 创建一个球体 Actor。
 * @param config 地球配置。
 * @returns 地球 Actor。
 */
export function createEarthActor(
    config: Partial<EarthConfig> = {},
) {
    return new EarthActor({  config });
}
