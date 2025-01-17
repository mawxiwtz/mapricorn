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
export {
  Vector2
};
//# sourceMappingURL=vector.js.map
