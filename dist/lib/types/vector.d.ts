export declare class Vector2 {
    x: number;
    y: number;
    constructor(x: number, y: number);
    clone(): Vector2;
    add(obj: number | Vector2): this;
    sub(obj: number | Vector2): this;
    mul(obj: number): this;
    div(obj: number): this;
    dot(vec: Vector2): number;
    cross(vec: Vector2): number;
    lengthSq(): number;
    angleTo(vec: Vector2): number;
    translate(x: number, y: number): this;
    rotate(rad: number): this;
}
