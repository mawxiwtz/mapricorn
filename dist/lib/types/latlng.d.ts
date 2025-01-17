export declare function formatNum(num: number, precision?: number): number;
export declare class LatLng {
    lat: number;
    lng: number;
    alt?: number | undefined;
    constructor(latitude: number, longitude: number, altitude?: number);
    constructor(latitude: LatLngExpression);
    equals(otherLatLng: LatLngExpression, maxMargin?: number): boolean;
    toString(precision: number): string;
    clone(): LatLng;
}
export interface LatLngLiteral {
    lat: number;
    lng: number;
    alt?: number;
}
export type LatLngTuple = [number, number, number?];
export type LatLngExpression = LatLng | LatLngLiteral | LatLngTuple;
