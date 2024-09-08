export function formatNum(num: number, precision?: number) {
    const pow = Math.pow(10, precision === undefined ? 6 : precision);
    return Math.round(num * pow) / pow;
}

// 経緯度、高度を扱うクラス
export class LatLng {
    lat: number = 0.0;
    lng: number = 0.0;
    alt?: number | undefined;

    // overloads
    constructor(latitude: number, longitude: number, altitude?: number);
    constructor(latitude: LatLngExpression);

    constructor(a: number | LatLngExpression, b?: number, c?: number) {
        if (a instanceof LatLng) {
            // (LatLng object)
            return a;
        }
        if (Array.isArray(a) && typeof a[0] !== 'object') {
            // ([x, y, z])
            if (a.length === 3) {
                return new LatLng(a[0], a[1], a[2]);
            }
            // ([x, y])
            if (a.length === 2) {
                return new LatLng(a[0], a[1]);
            }
            throw new Error('Invalid parameters');
        }
        if (a === undefined || a === null) {
            return a;
        }
        if (typeof a === 'object' && 'lat' in a) {
            // ({lat: x, lng: y, ati: z})
            return new LatLng(a.lat, a.lng, a.alt);
        }
        if (b === undefined) {
            throw new Error('Invalid parameters');
        }

        // (x, y, z)
        const a2 = a as unknown as number;

        if (isNaN(a2) || isNaN(b)) {
            throw new Error('Invalid LatLng object: (' + a2 + ', ' + b + ')');
        }

        this.lat = a2;

        this.lng = b;

        if (c !== undefined) {
            this.alt = c;
        }
    }

    equals(otherLatLng: LatLngExpression, maxMargin?: number): boolean {
        if (!otherLatLng) {
            return false;
        }

        const obj = new LatLng(otherLatLng);

        const margin = Math.max(Math.abs(this.lat - obj!.lat), Math.abs(this.lng - obj!.lng));

        return margin <= (maxMargin === undefined ? 1.0e-9 : maxMargin);
    }

    toString(precision: number): string {
        return (
            'LatLng(' + formatNum(this.lat, precision) + ', ' + formatNum(this.lng, precision) + ')'
        );
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

    clone(): LatLng {
        return new LatLng(this.lat, this.lng, this.alt);
    }
}

export interface LatLngLiteral {
    lat: number; // 緯度
    lng: number; // 経度
    alt?: number; // 高度
}

export type LatLngTuple = [number, number, number?];

export type LatLngExpression = LatLng | LatLngLiteral | LatLngTuple;
