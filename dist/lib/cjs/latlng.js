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
var latlng_exports = {};
__export(latlng_exports, {
  LatLng: () => LatLng,
  formatNum: () => formatNum
});
module.exports = __toCommonJS(latlng_exports);
function formatNum(num, precision) {
  const pow = Math.pow(10, precision === void 0 ? 6 : precision);
  return Math.round(num * pow) / pow;
}
class LatLng {
  lat = 0;
  lng = 0;
  alt;
  constructor(a, b, c) {
    if (a instanceof LatLng) {
      return a;
    }
    if (Array.isArray(a) && typeof a[0] !== "object") {
      if (a.length === 3) {
        return new LatLng(a[0], a[1], a[2]);
      }
      if (a.length === 2) {
        return new LatLng(a[0], a[1]);
      }
      throw new Error("Invalid parameters");
    }
    if (a === void 0 || a === null) {
      return a;
    }
    if (typeof a === "object" && "lat" in a) {
      return new LatLng(a.lat, a.lng, a.alt);
    }
    if (b === void 0) {
      throw new Error("Invalid parameters");
    }
    const a2 = a;
    if (isNaN(a2) || isNaN(b)) {
      throw new Error("Invalid LatLng object: (" + a2 + ", " + b + ")");
    }
    this.lat = a2;
    this.lng = b;
    if (c !== void 0) {
      this.alt = c;
    }
  }
  equals(otherLatLng, maxMargin) {
    if (!otherLatLng) {
      return false;
    }
    const obj = new LatLng(otherLatLng);
    const margin = Math.max(Math.abs(this.lat - obj.lat), Math.abs(this.lng - obj.lng));
    return margin <= (maxMargin === void 0 ? 1e-9 : maxMargin);
  }
  toString(precision) {
    return "LatLng(" + formatNum(this.lat, precision) + ", " + formatNum(this.lng, precision) + ")";
  }
  /*
      distanceTo(otherLatLng: LatLngExpression): number {
          return Earth.distance(this, toLatLng(otherLatLng));
      }
  
      wrap(): LatLng {
          return Earth.wrapLatLng(this);
      }
  
      toBounds(sizeInMeters: number): LatLngBounds {
          const latAccuracy = (180 * sizeInMeters) / 40075017,
              lngAccuracy = latAccuracy / Math.cos((Math.PI / 180) * this.lat);
  
          return toLatLngBounds(
              [this.lat - latAccuracy, this.lng - lngAccuracy],
              [this.lat + latAccuracy, this.lng + lngAccuracy],
          );
      }
      */
  clone() {
    return new LatLng(this.lat, this.lng, this.alt);
  }
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  LatLng,
  formatNum
});
//# sourceMappingURL=latlng.js.map
