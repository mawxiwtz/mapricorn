export type WayPoint = {
    lat: number;
    lng: number;
    alt: number;
    time: number;
};
export type GPXData = {
    stats: {
        latMin: number;
        latMax: number;
        lngMin: number;
        lngMax: number;
        altMin: number;
        altMax: number;
        center: {
            lat: number;
            lng: number;
            alt: number;
        };
        startTime: number;
        endTime: number;
        elapsedTime: number;
    };
    wpts: WayPoint[];
};
export declare const GPXDataDefault: GPXData;
export declare class GPX {
    doc: Document;
    constructor(xmlStr: string);
    parse(xmlStr: string): Document;
    getXPath(prefix: string, args: string[]): string;
    toJson(): GPXData;
}
