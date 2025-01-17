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
var vector_exports = {};
__export(vector_exports, {
  Vector2: () => Vector2
});
module.exports = __toCommonJS(vector_exports);
class Vector2 {
  x;
  y;
  constructor(x, y) {
    this.x = x;
    this.y = y;
  }
  clone() {
    return new Vector2(this.x, this.y);
  }
  add(obj) {
    if (obj instanceof Vector2) {
      this.x += obj.x;
      this.y += obj.y;
    } else {
      this.x += obj;
      this.y += obj;
    }
    return this;
  }
  sub(obj) {
    if (obj instanceof Vector2) {
      this.x -= obj.x;
      this.y -= obj.y;
    } else {
      this.x -= obj;
      this.y -= obj;
    }
    return this;
  }
  mul(obj) {
    this.x *= obj;
    this.y *= obj;
    return this;
  }
  div(obj) {
    this.x /= obj;
    this.y /= obj;
    return this;
  }
  dot(vec) {
    return this.x * vec.x + this.y * vec.y;
  }
  cross(vec) {
    return this.x * vec.y - this.y * vec.x;
  }
  lengthSq() {
    return this.x ** 2 + this.y ** 2;
  }
  angleTo(vec) {
    const denominator = Math.sqrt(this.lengthSq() * vec.lengthSq());
    if (denominator === 0)
      throw new Error("angleTo() can't handle zero length vectors.");
    let theta = this.dot(vec) / denominator;
    if (theta < -1)
      theta = -1;
    if (theta > 1)
      theta = 1;
    return Math.acos(theta);
  }
  translate(x, y) {
    this.x += x;
    this.y += y;
    return this;
  }
  rotate(rad) {
    const x = Math.cos(rad) * this.x - Math.sin(rad) * this.y;
    const y = Math.sin(rad) * this.x + Math.cos(rad) * this.y;
    this.x = x;
    this.y = y;
    return this;
  }
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  Vector2
});
//# sourceMappingURL=vector.js.map
