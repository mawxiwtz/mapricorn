export class Vector2 {
    x: number;
    y: number;

    constructor(x: number, y: number) {
        this.x = x;
        this.y = y;
    }

    clone() {
        return new Vector2(this.x, this.y);
    }

    add(obj: number | Vector2) {
        if (obj instanceof Vector2) {
            this.x += obj.x;
            this.y += obj.y;
        } else {
            this.x += obj;
            this.y += obj;
        }
        return this;
    }

    sub(obj: number | Vector2) {
        if (obj instanceof Vector2) {
            this.x -= obj.x;
            this.y -= obj.y;
        } else {
            this.x -= obj;
            this.y -= obj;
        }
        return this;
    }

    mul(obj: number) {
        this.x *= obj;
        this.y *= obj;
        return this;
    }

    div(obj: number) {
        this.x /= obj;
        this.y /= obj;
        return this;
    }

    dot(vec: Vector2) {
        return this.x * vec.x + this.y * vec.y;
    }

    cross(vec: Vector2) {
        return this.x * vec.y - this.y * vec.x;
    }

    lengthSq() {
        return this.x ** 2 + this.y ** 2;
    }

    angleTo(vec: Vector2) {
        const denominator = Math.sqrt(this.lengthSq() * vec.lengthSq());

        if (denominator === 0) throw new Error("angleTo() can't handle zero length vectors.");

        let theta = this.dot(vec) / denominator;
        if (theta < -1) theta = -1;
        if (theta > 1) theta = 1;

        return Math.acos(theta);
    }

    translate(x: number, y: number) {
        this.x += x;
        this.y += y;
        return this;
    }

    rotate(rad: number) {
        const x = Math.cos(rad) * this.x - Math.sin(rad) * this.y;
        const y = Math.sin(rad) * this.x + Math.cos(rad) * this.y;
        this.x = x;
        this.y = y;
        return this;
    }
}
