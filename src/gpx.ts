export type WayPoint = {
    lat: number;
    lng: number;
    ati: number;
    time: number;
};

export type GPXData = {
    stats: {
        latMin: number;
        latMax: number;
        lngMin: number;
        lngMax: number;
        atiMin: number;
        atiMax: number;
        center: {
            lat: number;
            lng: number;
            ati: number;
        };
        startTime: number;
        endTime: number;
        elapsedTime: number;
    };
    wpts: WayPoint[];
};

export const GPXDataDefault: GPXData = {
    stats: {
        latMin: NaN,
        latMax: NaN,
        lngMin: NaN,
        lngMax: NaN,
        atiMin: NaN,
        atiMax: NaN,
        center: {
            lat: NaN,
            lng: NaN,
            ati: NaN,
        },
        startTime: NaN,
        endTime: NaN,
        elapsedTime: NaN,
    },
    wpts: [],
};

export class GPX {
    doc: Document;

    constructor(xmlStr: string) {
        this.doc = this.parse(xmlStr);
    }

    parse(xmlStr: string): Document {
        const parser = new DOMParser();
        const doc = parser.parseFromString(xmlStr, 'application/xml');
        const errorNode = doc.querySelector('parsererror');
        if (errorNode) {
            throw new Error('An error occurred in parsing');
        }
        return doc;
    }

    // XPathは、デフォルトnamespaceを指定できない。
    // そのためxmlns=""によってnamespaceが与えられているxmlドキュメントに
    // ついて検索する場合は[namespace-uri()]によって修飾する必要がある。
    getXPath(prefix: string, args: string[]): string {
        const ns = this.doc.lookupNamespaceURI(null);
        if (ns) {
            return args
                .map((p) => prefix + `*[namespace-uri()="${ns}" and name()="${p}"]`)
                .join('/');
        } else {
            return prefix + args.join('/');
        }
    }

    toJson(): GPXData {
        const result = GPXDataDefault;

        // Waypoint
        const xpath = this.getXPath('/', ['gpx', 'trk', 'trkseg', 'trkpt']);
        const trkpts = document.evaluate(xpath, this.doc, null, XPathResult.ANY_TYPE, null);

        const s = result.stats;
        const xpathEle = this.getXPath('', ['ele']);
        const xpathTime = this.getXPath('', ['time']);
        let element;
        while ((element = trkpts.iterateNext())) {
            const lat = document.evaluate('@lat', element, null, XPathResult.NUMBER_TYPE, null);
            const lng = document.evaluate('@lon', element, null, XPathResult.NUMBER_TYPE, null);
            const ati = document.evaluate(xpathEle, element, null, XPathResult.NUMBER_TYPE, null);
            const tm = document.evaluate(xpathTime, element, null, XPathResult.STRING_TYPE, null);
            const wpt: WayPoint = {
                lat: lat.numberValue ?? NaN,
                lng: lng.numberValue ?? NaN,
                ati: ati.numberValue ?? NaN,
                time: new Date(tm.stringValue).getTime(),
            };

            // NaNとの比較結果は必ずfalseとなるので、通常と反転した条件式となる
            if (!(s.latMin <= wpt.lat)) s.latMin = wpt.lat;
            if (!(s.latMax >= wpt.lat)) s.latMax = wpt.lat;
            if (!(s.lngMin <= wpt.lng)) s.lngMin = wpt.lng;
            if (!(s.lngMax >= wpt.lng)) s.lngMax = wpt.lng;
            if (!(s.atiMin <= wpt.ati)) s.atiMin = wpt.ati;
            if (!(s.atiMax >= wpt.ati)) s.atiMax = wpt.ati;
            if (!(s.startTime <= wpt.time)) s.startTime = wpt.time;
            if (!(s.endTime >= wpt.time)) s.endTime = wpt.time;
            s.center.lat = (s.latMax + s.latMin) / 2;
            s.center.lng = (s.lngMax + s.lngMin) / 2;
            s.center.ati = (s.atiMax + s.atiMin) / 2;
            s.elapsedTime = s.endTime - s.startTime;

            result.wpts.push(wpt);
        }

        return result;
    }
}