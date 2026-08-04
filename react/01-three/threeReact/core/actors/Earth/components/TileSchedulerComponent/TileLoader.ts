import { TileSource } from "../../types/EarthConfig";
import { TileKey } from "../../types/TileState";

/** 
 * 瓦片加载器，用于加载四叉树瓦片的元数据。
 */
export class TileLoader {
    /** 加载一个四叉树瓦片的元数据。 */
    async load(key: TileKey, source?: TileSource) {
        return source?.getUrl?.(key.z, key.x, key.y);
    }
}
