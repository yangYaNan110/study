import { TileNode } from "../../types/TileNode";
import { TileKey } from "../../types/TileState";
import { tilesAtLevel } from "../../utils/TileMath";

/** Logical quadtree only. It has no camera, network, or Three.js dependency. */
export class TileTree {
    node(key: TileKey): TileNode {
        const count = tilesAtLevel(key.z);
        return {
            key,
            u0: key.x / count,
            v0: key.y / count,
            u1: (key.x + 1) / count,
            v1: (key.y + 1) / count,
        };
    }

    children(key: TileKey) {
        // 四叉树的每个节点固定分成左上、右上、左下、右下四个子节点。
        const z = key.z + 1;
        return [
            { z, x: key.x * 2, y: key.y * 2 },
            { z, x: key.x * 2 + 1, y: key.y * 2 },
            { z, x: key.x * 2, y: key.y * 2 + 1 },
            { z, x: key.x * 2 + 1, y: key.y * 2 + 1 },
        ];
    }

    nodesAtLevel(level: number) {
        // 第一版按目标层级平铺节点；之后可改为按屏幕误差递归细分。
        const count = tilesAtLevel(level);
        const nodes: TileNode[] = [];
        for (let y = 0; y < count; y++) {
            for (let x = 0; x < count; x++) nodes.push(this.node({ z: level, x, y }));
        }
        return nodes;
    }
}
