// 地球の赤道直径(m)
export const R = 6378137;
export const TILE_PIXEL = 256; // タイル1辺のピクセル数

export class Geography {
    static getTilePixelByZoom(zoom: number) {
        return TILE_PIXEL * (2 ** zoom / 2 ** Math.round(zoom));
    }

    // 経緯度をグリニッジ子午線/赤道を原点としたm単位に変換する
    static degrees2meters(lat: number, lng: number) {
        const x = (lng * 20037508.34) / 180;
        const y = 6378137 * Math.log(Math.tan(Math.PI / 4 + (lat * Math.PI) / 180 / 2));
        return { x, y };
    }

    // グリニッジ子午線/赤道を原点としたm単位を経緯度に変換する
    static meters2degrees(mx: number, my: number) {
        const lat = ((2 * Math.atan(Math.exp(my / R)) - Math.PI / 2) / Math.PI) * 180;
        const lng = (mx / R / Math.PI) * 180;
        return { lat, lng };
    }

    // グリニッジ子午線/赤道を原点としたm単位を地図タイル状のX/Yに変換する
    static meters2tile(mx: number, my: number, zoom: number) {
        const x = Math.floor(((mx + R * Math.PI) / (2 * R * Math.PI)) * 2 ** Math.round(zoom));
        const y = Math.floor((1 - (my + R * Math.PI) / (2 * R * Math.PI)) * 2 ** Math.round(zoom));
        return { x, y };
    }

    // 経緯度を地図タイル状のX/Yに変換する
    static degrees2tile(lat: number, lng: number, zoom: number) {
        const r = Geography.degrees2meters(lat, lng);
        return Geography.meters2tile(r.x, r.y, zoom);
    }

    // 地図タイル状のX/Yをグリニッジ子午線/赤道を原点としたm単位に変換する
    // タイルの左上隅の座標となる
    static tile2meters(x: number, y: number, zoom: number) {
        const mx = (x / 2 ** Math.round(zoom)) * (2 * R * Math.PI) - R * Math.PI;
        const my = (1 - y / 2 ** Math.round(zoom)) * (2 * R * Math.PI) - R * Math.PI;
        return { x: mx, y: my };
    }

    // グリニッジ子午線/赤道を原点としたm単位を、ワールド座標系のピクセル座標にする
    // ワールド座標系は、原点を中心として東側/南側が正となることに注意する
    static meter2world(mx: number, my: number, zoom: number) {
        const mpp = this.getMetersPerPixelByZoom(zoom);
        const world_px = mx / mpp;
        const world_py = -my / mpp;
        return { x: world_px, y: world_py };
    }

    // 指定メートル/ピクセルに収まるズームレベルを計算
    static getZoomByMetersPerPixel(mpp: number) {
        return Math.log((2 * Math.PI * R) / (mpp * TILE_PIXEL)) / Math.log(2);
    }

    // 指定ズームレベルにおけるタイル１辺の長さ(メートル)を計算
    static getMetersPerTileByZoom(zoom: number) {
        return (2 * Math.PI * R) / 2 ** zoom;
    }

    // 指定ズームレベルにおける1pxあたりのメートルを計算
    static getMetersPerPixelByZoom(zoom: number) {
        return (2 * R * Math.PI) / (2 ** zoom * TILE_PIXEL);
    }
}
