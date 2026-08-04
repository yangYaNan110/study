import { Actor } from "../../system/Actor";
import { RenderController } from "../../system/RenderController";
import { TileRenderComponent } from "./components/TileRenderComponent";
import { TileSchedulerComponent } from "./components/TileSchedulerComponent";
import { EarthStore } from "./store/EarthStore";
import { EarthConfig, EarthActorOptions } from "./types/EarthConfig";

/** 球体，其可见表面被管理为四叉树瓦片。 */
export class EarthActor extends Actor {
    name = "earthActor";
    readonly store: EarthStore;

    constructor(options: EarthActorOptions) {
        super();
        // Store 在 Actor 创建时生成，Earth 的所有组件共享这一份状态。
        this.store = new EarthStore(options.config);
        // Actor 只负责装配组件，不参与瓦片筛选或 Mesh 创建。
        const tileScheduler = new TileSchedulerComponent();
        const tileRender = new TileRenderComponent();
        this.addComponent(tileScheduler);
        this.addComponent(tileRender);
    }
}

export type { EarthConfig } from "./types/EarthConfig";
export type { TileKey, TileRecord, TileStatus } from "./types/TileState";

/** Convenience constructor for the common RenderController + Earth pairing. */
export function createEarthActor(
    config: Partial<EarthConfig> = {},
) {
    return new EarthActor({  config });
}
