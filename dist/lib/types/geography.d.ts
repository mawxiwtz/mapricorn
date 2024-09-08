export declare const R = 6378137;
export declare const TILE_PIXEL = 256;
export declare class Geography {
    static getTilePixelByZoom(zoom: number): number;
    static degrees2meters(lat: number, lng: number): {
        x: number;
        y: number;
    };
    static meters2degrees(mx: number, my: number): {
        lat: number;
        lng: number;
    };
    static meters2tile(mx: number, my: number, zoom: number): {
        x: number;
        y: number;
    };
    static degrees2tile(lat: number, lng: number, zoom: number): {
        x: number;
        y: number;
    };
    static tile2meters(x: number, y: number, zoom: number): {
        x: number;
        y: number;
    };
    static meter2world(mx: number, my: number, zoom: number): {
        x: number;
        y: number;
    };
    static getZoomByMetersPerPixel(mpp: number): number;
    static getMetersPerTileByZoom(zoom: number): number;
    static getMetersPerPixelByZoom(zoom: number): number;
}
