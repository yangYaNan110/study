import { TileKey } from "./TileState";

/** 四叉树瓦片节点接口，用于表示四叉树中的一个瓦片。 */
export interface TileNode {
    key: TileKey;
    u0: number;
    v0: number;
    u1: number;
    v1: number;
}
