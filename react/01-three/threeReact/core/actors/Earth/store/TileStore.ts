import { TileKey, TileRecord, TileStatus } from "../types/TileState";
import { tileId } from "../utils/TileMath";

/** Shared tile state. It deliberately contains no Three.js render objects. */
export class TileStore {
    // id -> record，便于调度与渲染组件以同一个瓦片身份访问状态。
    readonly tiles = new Map<string, TileRecord>();
    // 仅表示本帧调度器需要的瓦片，不等同于已渲染或已缓存的瓦片。
    readonly desired = new Set<string>();

    get(key: TileKey) {
        return this.tiles.get(tileId(key));
    }

    ensure(key: TileKey) {
        const id = tileId(key);
        let record = this.tiles.get(id);
        if (!record) {
            // 初次遇到瓦片先建立 idle 记录，之后交给调度器推进状态。
            record = { id, key, status: "idle", priority: 0, lastUsedFrame: 0 };
            this.tiles.set(id, record);
        }
        return record;
    }

    setStatus(key: TileKey, status: TileStatus) {
        // 统一从 Store 更新状态，避免组件自行创建不在 Map 内的记录。
        this.ensure(key).status = status;
    }
}
