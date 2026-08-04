import { TileKey } from "../types/TileState";
/** 生成四叉树瓦片的唯一标识符。 */
export const tileId = ({ z, x, y }: TileKey) => `${z}/${x}/${y}`;
/** 计算四叉树层级 level 中的瓦片数。 */
export function tilesAtLevel(level: number) {
    // 每深入一级四叉树，横、纵方向的瓦片数均翻倍。
    return 1 << level;
}

/** 计算四叉树瓦片 key 的中心经纬度。 */    
export function tileCenter(key: TileKey) {
    // 将瓦片中心从归一化格网转换到经纬度弧度。
    const count = tilesAtLevel(key.z);
    const longitude = ((key.x + 0.5) / count) * Math.PI * 2 - Math.PI;
    const latitude = Math.PI / 2 - ((key.y + 0.5) / count) * Math.PI;
    return { longitude, latitude };
}
