import * as THREE from "three";
import { TileKey } from "../types/TileState";
import { tilesAtLevel } from "./TileMath";

/** 创建一个四叉树瓦片的球面几何体。 */
export function createTileGeometry(key: TileKey, radius: number, segments = 12) {
    const count = tilesAtLevel(key.z);
    // Three.js 的 SphereGeometry 用 phi 表示经度、theta 表示从北极开始的极角。
    const phiStart = (key.x / count) * Math.PI * 2;
    const phiLength = (1 / count) * Math.PI * 2;
    const thetaStart = (key.y / count) * Math.PI;
    const thetaLength = Math.PI / count;
    return new THREE.SphereGeometry(radius, segments, segments, phiStart, phiLength, thetaStart, thetaLength);
}
