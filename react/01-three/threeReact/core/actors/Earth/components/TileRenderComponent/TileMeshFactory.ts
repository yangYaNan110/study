import * as THREE from "three";
import { EarthStore } from "../../store/EarthStore";
import { TileRecord } from "../../types/TileState";
import { createTileGeometry } from "../../utils/SphereProjection";

export class TileMeshFactory {
    create(tile: TileRecord, store: EarthStore) {
        // Geometry 只覆盖当前 z/x/y 对应的球面局部 patch。
        const geometry = createTileGeometry(tile.key, store.config.radius);
        // 影像纹理尚未接入时，用稳定的颜色区分不同瓦片以方便观察调度结果。
        const hue = (tile.key.x * 31 + tile.key.y * 17 + tile.key.z * 19) % 360;
        const material = new THREE.MeshBasicMaterial({
            color: new THREE.Color(`hsl(${hue}, 45%, 48%)`),
            wireframe: !tile.textureUrl,
            side: THREE.FrontSide,
        });
        return new THREE.Mesh(geometry, material);
    }

    dispose(mesh: THREE.Mesh) {
        // 从 Scene 移除不等于释放 WebGL 资源，Geometry 和 Material 都要显式 dispose。
        mesh.geometry.dispose();
        const material = mesh.material;
        if (Array.isArray(material)) material.forEach(item => item.dispose());
        else material.dispose();
    }
}
