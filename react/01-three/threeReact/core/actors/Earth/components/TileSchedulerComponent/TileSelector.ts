import * as THREE from "three";
import { EarthStore } from "../../store/EarthStore";
import { TileKey } from "../../types/TileState";
import { tileCenter } from "../../utils/TileMath";
import { TileTree } from "./TileTree";

export interface SelectedTile { key: TileKey; priority: number; }
/**
 * 瓦片选择器，根据相机位置选择可见的四叉树瓦片。
 */
export class TileSelector {
    private readonly tree = new TileTree();

    /** 选择可见的四叉树瓦片。 */
    select(store: EarthStore, camera: THREE.Camera): SelectedTile[] {
        const position = new THREE.Vector3();
        camera.getWorldPosition(position);
        // 相机越接近球面，选择的层级越深；0.001 防止相机贴面时除零。
        const distance = Math.max(0.001, position.length() - store.config.radius);
        const detail = Math.floor(Math.log2(store.config.radius / distance + 1));
        const level = THREE.MathUtils.clamp(
            store.config.minLevel + detail,
            store.config.minLevel,
            store.config.maxLevel,
        );
        const cameraDirection = position.normalize();
        const result: SelectedTile[] = [];

        for (const node of this.tree.nodesAtLevel(level)) {
            const key = node.key;
            const center = tileCenter(key);
            const normal = new THREE.Vector3(
                Math.cos(center.latitude) * Math.cos(center.longitude),
                Math.sin(center.latitude),
                Math.cos(center.latitude) * Math.sin(center.longitude),
            );
            const facing = normal.dot(cameraDirection);
            // 排除背面瓦片，减少不可能看到的请求和 Mesh。
            if (facing <= -0.12) continue;
            result.push({ key, priority: facing * 10_000 + level * 100 });
        }
        // 面向相机越多的瓦片优先级越高，并由配置限制最终数量。
        return result.sort((a, b) => b.priority - a.priority).slice(0, store.config.maxVisibleTiles);
    }
}
