"use strict";
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);
var geography_exports = {};
__export(geography_exports, {
  Geography: () => Geography,
  R: () => R,
  TILE_PIXEL: () => TILE_PIXEL
});
module.exports = __toCommonJS(geography_exports);
const R = 6378137;
const TILE_PIXEL = 256;
class Geography {
  static getTilePixelByZoom(zoom) {
    return TILE_PIXEL * (2 ** zoom / 2 ** Math.round(zoom));
  }
  // 経緯度をグリニッジ子午線/赤道を原点としたm単位に変換する
  static degrees2meters(lat, lng) {
    const x = lng * R * Math.PI / 180;
    const y = R * Math.log(Math.tan(Math.PI / 4 + lat * Math.PI / 180 / 2));
    return { x, y };
  }
  // グリニッジ子午線/赤道を原点としたm単位を経緯度に変換する
  static meters2degrees(mx, my) {
    const lat = (2 * Math.atan(Math.exp(my / R)) - Math.PI / 2) / Math.PI * 180;
    const lng = mx / R / Math.PI * 180;
    return { lat, lng };
  }
  // グリニッジ子午線/赤道を原点としたm単位を地図タイル状のX/Yに変換する
  static meters2tile(mx, my, zoom) {
    const x = Math.floor((mx + R * Math.PI) / (2 * R * Math.PI) * 2 ** Math.round(zoom));
    const y = Math.floor((1 - (my + R * Math.PI) / (2 * R * Math.PI)) * 2 ** Math.round(zoom));
    return { x, y };
  }
  // 経緯度を地図タイル状のX/Yに変換する
  static degrees2tile(lat, lng, zoom) {
    const r = Geography.degrees2meters(lat, lng);
    return Geography.meters2tile(r.x, r.y, zoom);
  }
  // 地図タイル状のX/Yをグリニッジ子午線/赤道を原点としたm単位に変換する
  // タイルの左上隅の座標となる
  static tile2meters(x, y, zoom) {
    const mx = x / 2 ** Math.round(zoom) * (2 * R * Math.PI) - R * Math.PI;
    const my = (1 - y / 2 ** Math.round(zoom)) * (2 * R * Math.PI) - R * Math.PI;
    return { x: mx, y: my };
  }
  // グリニッジ子午線/赤道を原点としたm単位を、ワールド座標系のピクセル座標にする
  // ワールド座標系は、原点を中心として東側/南側が正となることに注意する
  static meter2world(mx, my, zoom) {
    const mpp = this.getMetersPerPixelByZoom(zoom);
    const world_px = mx / mpp;
    const world_py = -my / mpp;
    return { x: world_px, y: world_py };
  }
  // 指定メートル/ピクセルに収まるズームレベルを計算
  static getZoomByMetersPerPixel(mpp) {
    return Math.log(2 * Math.PI * R / (mpp * TILE_PIXEL)) / Math.log(2);
  }
  // 指定ズームレベルにおけるタイル１辺の長さ(メートル)を計算
  static getMetersPerTileByZoom(zoom) {
    return 2 * Math.PI * R / 2 ** zoom;
  }
  // 指定ズームレベルにおける1pxあたりのメートルを計算
  static getMetersPerPixelByZoom(zoom) {
    return 2 * R * Math.PI / (2 ** zoom * TILE_PIXEL);
  }
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  Geography,
  R,
  TILE_PIXEL
});
//# sourceMappingURL=geography.js.map
