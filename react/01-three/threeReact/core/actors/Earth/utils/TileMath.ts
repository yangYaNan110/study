import { TileKey } from "../types/TileState";

// 使用 z/x/y 作为整个 Earth 子系统通用的瓦片身份。
export const tileId = ({ z, x, y }: TileKey) => `${z}/${x}/${y}`;

export function tilesAtLevel(level: number) {
    // 每深入一级四叉树，横、纵方向的瓦片数均翻倍。
    return 1 << level;
}

export function tileCenter(key: TileKey) {
    // 将瓦片中心从归一化格网转换到经纬度弧度。
    const count = tilesAtLevel(key.z);
    const longitude = ((key.x + 0.5) / count) * Math.PI * 2 - Math.PI;
    const latitude = Math.PI / 2 - ((key.y + 0.5) / count) * Math.PI;
    return { longitude, latitude };
}
