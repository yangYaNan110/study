import { TileKey } from "./TileState";

/** A logical quadtree node. Bounds are normalized longitude/latitude UV space. */
export interface TileNode {
    key: TileKey;
    u0: number;
    v0: number;
    u1: number;
    v1: number;
}
