import { TileSource } from "../../types/EarthConfig";
import { TileKey } from "../../types/TileState";

/** Resolves tile metadata. Rendering owns the actual Three.js texture lifetime. */
export class TileLoader {
    async load(key: TileKey, source?: TileSource) {
        return source?.getUrl?.(key.z, key.x, key.y);
    }
}
