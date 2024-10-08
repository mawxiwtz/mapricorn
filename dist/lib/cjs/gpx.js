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
var gpx_exports = {};
__export(gpx_exports, {
  GPX: () => GPX,
  GPXDataDefault: () => GPXDataDefault
});
module.exports = __toCommonJS(gpx_exports);
const GPXDataDefault = {
  stats: {
    latMin: NaN,
    latMax: NaN,
    lngMin: NaN,
    lngMax: NaN,
    altMin: NaN,
    altMax: NaN,
    center: {
      lat: NaN,
      lng: NaN,
      alt: NaN
    },
    startTime: NaN,
    endTime: NaN,
    elapsedTime: NaN
  },
  wpts: []
};
class GPX {
  doc;
  constructor(xmlStr) {
    this.doc = this.parse(xmlStr);
  }
  parse(xmlStr) {
    const parser = new DOMParser();
    const doc = parser.parseFromString(xmlStr, "application/xml");
    const errorNode = doc.querySelector("parsererror");
    if (errorNode) {
      throw new Error("An error occurred in parsing");
    }
    return doc;
  }
  // XPathは、デフォルトnamespaceを指定できない。
  // そのためxmlns=""によってnamespaceが与えられているxmlドキュメントに
  // ついて検索する場合は[namespace-uri()]によって修飾する必要がある。
  getXPath(prefix, args) {
    const ns = this.doc.lookupNamespaceURI(null);
    if (ns) {
      return args.map((p) => prefix + `*[namespace-uri()="${ns}" and name()="${p}"]`).join("/");
    } else {
      return prefix + args.join("/");
    }
  }
  toJson() {
    const result = GPXDataDefault;
    const xpath = this.getXPath("/", ["gpx", "trk", "trkseg", "trkpt"]);
    const trkpts = document.evaluate(xpath, this.doc, null, XPathResult.ANY_TYPE, null);
    const s = result.stats;
    const xpathEle = this.getXPath("", ["ele"]);
    const xpathTime = this.getXPath("", ["time"]);
    let element;
    while (element = trkpts.iterateNext()) {
      const lat = document.evaluate("@lat", element, null, XPathResult.NUMBER_TYPE, null);
      const lng = document.evaluate("@lon", element, null, XPathResult.NUMBER_TYPE, null);
      const alt = document.evaluate(xpathEle, element, null, XPathResult.NUMBER_TYPE, null);
      const tm = document.evaluate(xpathTime, element, null, XPathResult.STRING_TYPE, null);
      const wpt = {
        lat: lat.numberValue ?? NaN,
        lng: lng.numberValue ?? NaN,
        alt: alt.numberValue ?? NaN,
        time: new Date(tm.stringValue).getTime()
      };
      if (!(s.latMin <= wpt.lat))
        s.latMin = wpt.lat;
      if (!(s.latMax >= wpt.lat))
        s.latMax = wpt.lat;
      if (!(s.lngMin <= wpt.lng))
        s.lngMin = wpt.lng;
      if (!(s.lngMax >= wpt.lng))
        s.lngMax = wpt.lng;
      if (!(s.altMin <= wpt.alt))
        s.altMin = wpt.alt;
      if (!(s.altMax >= wpt.alt))
        s.altMax = wpt.alt;
      if (!(s.startTime <= wpt.time))
        s.startTime = wpt.time;
      if (!(s.endTime >= wpt.time))
        s.endTime = wpt.time;
      s.center.lat = (s.latMax + s.latMin) / 2;
      s.center.lng = (s.lngMax + s.lngMin) / 2;
      s.center.alt = (s.altMax + s.altMin) / 2;
      s.elapsedTime = s.endTime - s.startTime;
      result.wpts.push(wpt);
    }
    return result;
  }
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  GPX,
  GPXDataDefault
});
//# sourceMappingURL=gpx.js.map
