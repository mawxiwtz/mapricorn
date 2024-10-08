import { LatLng, type LatLngExpression } from './latlng.js';
import type { GPXData } from './gpx.js';
import { Geography } from './geography.js';

type TouchInfo = {
    id: number;
    x: number;
    y: number;
    old?: {
        x: number;
        y: number;
    };
};

export type MapricornOptions = {
    container?: HTMLElement;
    width?: string;
    height?: string;
    mapSource?: string;
    center?: LatLngExpression;
    zoom?: number;
};

// 地図表示を行うクラス
export class Mapricorn {
    debug = false;
    container?: HTMLElement;
    width = '';
    height = '';
    canvas?: HTMLCanvasElement;
    mapSource = 'https://tile.openstreetmap.org/{z}/{x}/{y}.png';
    //mapSource = '/map/osm/{z}/{x}/{y}.png';
    offScreen?: HTMLCanvasElement;
    useOffScreen = true;
    gpxData?: GPXData;
    center: LatLng;
    zoom: number = 1;
    zoomMax = 19;
    zoomMin = 0;
    latMax: number = 0;
    lngMin: number = 0;
    oldPoint?: { x: number; y: number };
    isMoving = false;
    touchMap: Record<number, TouchInfo> = {};
    touchList: TouchInfo[] = [];
    images: HTMLImageElement[] = [];

    constructor(opts?: MapricornOptions) {
        this.center = new LatLng([0, 0, 0]);
        if (opts) {
            if (opts.mapSource) {
                this.mapSource = opts.mapSource;
            }
            if (opts.center) {
                this.center = new LatLng(opts.center);
            }
            if (opts.zoom) {
                this.setZoom(opts.zoom);
            }
            if (opts.width) {
                this.width = opts.width;
            }
            if (opts.height) {
                this.height = opts.height;
            }
            if (opts.container) {
                this.bind(opts.container);
            }
        }
    }

    bind(container: HTMLElement) {
        if (container === undefined) {
            throw new Error('Invalid container');
        }
        this.container = container;
        this.setup();
        this.resize();
    }

    // canvasの初期設定
    setup() {
        if (!this.container) {
            return;
        }
        this.container.style.position = 'relative';
        if (this.width) {
            this.container.style.width = this.width;
        }
        if (this.height) {
            this.container.style.height = this.height;
        }

        if (!this.canvas) {
            this.canvas = document.createElement('canvas');
            this.container.appendChild(this.canvas);
            this.canvas.style.width = '100%';
            this.canvas.style.height = '100%';

            const context = this.canvas.getContext('2d');
            if (!context) {
                return;
            }
            context.lineWidth = 1;
            context.strokeStyle = '#fff';

            this.canvas.addEventListener('mousedown', this.handlerMouseDown());
            this.canvas.addEventListener('mouseup', this.handlerMouseUp());
            this.canvas.addEventListener('mousemove', this.handlerMouseMove());
            this.canvas.addEventListener('mouseleave', this.handlerMouseLeave());
            this.canvas.addEventListener('touchstart', this.handlerTouchStart());
            this.canvas.addEventListener('touchend', this.handlerTouchEnd());
            this.canvas.addEventListener('touchmove', this.handlerTouchMove());
            this.canvas.addEventListener('wheel', this.handlerMouseWheel());

            window.addEventListener('resize', this.handlerResize());
        }
    }

    // canvasのリサイズと解像度設定（ぼやけ防止）
    // canvasの各種設定は消える
    resize() {
        if (!this.canvas) {
            return;
        }
        const dpr = window.devicePixelRatio;
        const rect = this.canvas.getBoundingClientRect();
        this.canvas.width = rect.width * dpr;
        this.canvas.height = rect.height * dpr;
        if (this.useOffScreen) {
            if (!this.offScreen) {
                this.offScreen = document.createElement('canvas');
                console.log('offScreen created');
            }
            this.offScreen.width = rect.width * dpr;
            this.offScreen.height = rect.height * dpr;
        }

        const context = this.canvas.getContext('2d');
        if (!context) {
            return;
        }
        context.scale(dpr, dpr);

        if (this.offScreen) {
            const ctx = this.offScreen.getContext('2d');
            if (!ctx) {
                return;
            }
        }

        this.draw();
    }

    // 現在の中心点と新しいズームレベルで地図を描画する
    // offsetX, offsetYはズームの中心ピクセル（あらかじめmakeCenter()で
    // 中心点をこの位置に移動しておくこと。描画後に中心点は表示領域の中心に
    // 再設定される）。省略時はcanvasの中心
    // zoomは新しいズームレベルを指定する。省略時は現在のズームレベル
    draw(offsetX?: number, offsetY?: number, zoom: number = this.zoom) {
        if (!this.canvas || (this.useOffScreen && !this.offScreen)) {
            return;
        }

        // Canvasのサイズを取得
        const rect = this.canvas.getBoundingClientRect();
        //console.log(rect);

        const tilePixel = Geography.getTilePixelByZoom(zoom);
        //console.log(`zoom: ${zoom}, pixel: ${tilePixel}`);

        // 複数の座標系があるので注意
        //   経緯度：グリニッジ/赤道を原点とした度数単位。北東方向が正の数値
        //   メートル：グリニッジ/赤道を原点としたメートル単位。北東方向が正の数値
        //   タイルXY；グリニッジ/北極を原点としたタイル番号。南東方向が正の数値
        //   ワールド座標：グリニッジ/赤道を原点としたピクセル単位。南東方向が正の数値
        //   Canvas座標：画面のcanvasタグ領域の左上隅を原点としたピクセル単位。南東方向が正の数値

        // 中心点（メートル）と中心タイルXYを求める
        const center = Geography.degrees2meters(this.center.lat, this.center.lng);
        //console.log(`center: ${center.x}/${center.y}`);
        const tile = Geography.meters2tile(center.x, center.y, zoom);
        //console.log(`tile: ${zoom}/${tile.x}/${tile.y}`);

        // 描画開始点のタイルのXYを求める（開始点のLat/Lngがはっきりしている場合）
        //const startTile = Geography.degrees2tile(this.latMax, this.lngMin, zoom);
        // 描画開始点のタイルのXYを求める（zoomと表示領域から決める場合）
        const mpp = Geography.getMetersPerPixelByZoom(zoom);
        const ltx = center.x - (offsetX ?? rect.width / 2) * mpp;
        const lty = center.y + (offsetY ?? rect.height / 2) * mpp;
        const startTile = Geography.meters2tile(ltx, lty, zoom);

        // ワールド座標の計算
        const world_meter = Geography.tile2meters(tile.x, tile.y, zoom);
        const world = Geography.meter2world(world_meter.x, world_meter.y, zoom);
        const world_center = Geography.meter2world(center.x, center.y, zoom);
        //console.log(`world: ${world.x}, ${world.y}`);
        //console.log(`world_center: ${world_center.x}, ${world_center.y}`);

        // タイルが必要な範囲を計算する
        // Canvasサイズから、実際に表示可能なタイル数はおのずと決まる
        //   rect: Canvas
        //   world: 中心タイル左上隅のワールド座標
        //   world_center: 地図の中心のワールド座標
        //   tpx: タイルの1辺のピクセル数(= 256)
        //   cx, cy: canvas上の中心点（小数点未満は切り捨て）
        //   dx, dy: 地図の中心点と中心タイル左上隅との差）
        const cx = offsetX ?? rect.width / 2;
        const cy = offsetY ?? rect.height / 2;
        //console.log(`rect: ${rect.width}x${rect.height}, center: [${cx},${cy}]`);

        const dx = world_center.x - world.x;
        const dy = world_center.y - world.y;
        //console.log(`delta: [${dx},${dy}]`);

        // 1. canvasのサイズに応じた必要タイル数とはみ出しピクセル数を求める
        //    「左側はみ出し」と、「フル表示+右側はみ出し」にわけて考える。
        //    左側はみ出しピクセル数 modx = (cx - dx) % tpx
        //    modxが0ならはみだしなし、0以上なら左はみだしあり。ただし負数なら画面外なので描画不要
        //      tilexnum = modxを除いた部分をカバーするタイル数 + modx分のタイル
        //      高さについても同様に計算
        const modx = (cx - dx) % tilePixel;
        const tilexnum = Math.ceil((rect.width - modx) / tilePixel) + (modx > 0 ? 1 : 0);
        const mody = (cy - dy) % tilePixel;
        const tileynum = Math.ceil((rect.height - mody) / tilePixel) + (mody > 0 ? 1 : 0);
        //console.log(`tiles: ${tilexnum}x${tileynum}, moduler: ${modx},${mody}`);

        // 2. Canvasにタイル画像を敷き詰める。
        //      ln + lm + tx + rm + rn
        //      高さについても同様に計算
        //      左上隅から敷いていく
        const context = this.canvas.getContext('2d');
        if (!context) {
            return;
        }

        const ctx = this.offScreen ? this.offScreen.getContext('2d') : context;
        if (ctx) {
            if (this.debug) {
                ctx.lineWidth = 1;
                ctx.strokeStyle = '#f00';
                ctx.fillStyle = 'red';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.font = '26px Arial';
            }
        } else {
            return;
        }

        // オフスクリーンからcanvasに転送する際のオフセットを計算
        // こちらが速くできるが、startTileがタイルマップの最初でないといけない
        //const deltax = modx >= 0 ? modx - tilePixel : modx;
        //const deltay = mody >= 0 ? mody - tilePixel : mody;
        // こちらが汎用
        const startTile_meter = Geography.tile2meters(startTile.x, startTile.y, zoom);
        const offsetX_meter = startTile_meter.x - ltx;
        const offsetY_meter = lty - startTile_meter.y;
        const deltax = offsetX_meter / mpp;
        const deltay = offsetY_meter / mpp;

        const tileNum = tilexnum * tileynum;
        let tiles = 0;
        for (const i of this.images) {
            // cancel image loading
            i.src = '';
        }
        this.images = [];
        for (let x = 0; x < tilexnum; x++) {
            for (let y = 0; y < tileynum; y++) {
                const tx =
                    startTile.x + x; /* + (modx > 0 ? -1 : 0) // lng指定startTileの場合に必要 */
                const ty =
                    startTile.y + y; /* + (mody > 0 ? -1 : 0) // lat指定startTileの場合に必要 */
                const url = this.getMapURL(tx, ty, zoom);
                const image = new Image();
                this.images.push(image);
                image.addEventListener('load', () => {
                    const x2 = x * tilePixel + deltax;
                    const y2 = y * tilePixel + deltay;
                    if (this.offScreen) {
                        // オフスクリーンに描画
                        ctx.drawImage(image, x2, y2, tilePixel, tilePixel);

                        // タイルの境界とタイルXYの表示
                        if (this.debug) {
                            ctx.strokeRect(x2, y2, tilePixel, tilePixel);
                            ctx.fillText(
                                `${zoom}/${tx}/${ty}`,
                                x2 + tilePixel / 2,
                                y2 + tilePixel / 2,
                            );
                        }

                        // オフスクリーンの画像をcanvasに転写する
                        tiles++;
                        if (tiles === tileNum) {
                            context.drawImage(this.offScreen, 0, 0);
                        }
                    } else {
                        // 表示コンテキストに直接描画
                        ctx.drawImage(image, x2, y2, tilePixel, tilePixel);

                        // タイルの境界とタイルXYの表示
                        if (this.debug) {
                            ctx.strokeRect(x2, y2, tilePixel, tilePixel);
                            ctx.fillText(
                                `${zoom}/${tx}/${ty}`,
                                x2 + tilePixel / 2,
                                y2 + tilePixel / 2,
                            );
                        }
                    }
                });
                image.src = url;
            }
        }

        // 新しいズームを反映する
        this.zoom = zoom;

        // ホイールアクションの場合、中心点がポインタの位置となるため
        // 中心点と実際の表示の中心がずれる。そのためズーム変更後の新たな
        // 中心点を計算し、設定する
        if (offsetX !== undefined && offsetY !== undefined) {
            const rx = rect.width / 2 - offsetX;
            const ry = rect.height / 2 - offsetY;
            this.moveCenter(rx, ry);
        }
    }

    // OpenStreetMapなどの地図画像に対するURLを生成する
    getMapURL(x: number, y: number, zoom: number) {
        const z = Math.round(zoom);
        const tileMax = 1 << z;
        x = x % tileMax;
        if (x < 0) {
            x = tileMax + x;
        }
        y = y % tileMax;
        if (y < 0) {
            y = tileMax + y;
        }
        return this.mapSource
            .replace('{x}', String(x))
            .replace('{y}', String(y))
            .replace('{z}', String(z));
    }

    // GPXデータをセットする
    // setViewがtrueの時は地図の中心点やズームレベルも自動調整される
    setGPXData(gpxData: GPXData, setView: boolean = false) {
        if (!gpxData || isNaN(gpxData.stats.center.lat) || isNaN(gpxData.stats.center.lng)) {
            return;
        }
        this.gpxData = gpxData;

        if (setView) {
            this.adjustCenterByGPXData();
            this.adjustZoomLevelByGPXData();
        }
    }

    adjustCenterByGPXData() {
        if (this.gpxData && this.gpxData.stats) {
            const s = this.gpxData.stats;
            this.latMax = s.latMax;
            this.lngMin = s.lngMin;
            this.setView(s.center);
        }
    }

    // CanvasとGPXデータの範囲で適切なズームレベルを計算して設定する
    adjustZoomLevelByGPXData(margin: number = 1.2): number | undefined {
        if (!this.canvas) {
            return;
        }
        if (!this.gpxData) {
            return undefined;
        }

        // Canvasのサイズを取得
        const rect = this.canvas.getBoundingClientRect();

        // ログの範囲(m)を計算
        const s = this.gpxData.stats;
        const min = Geography.degrees2meters(s.latMin, s.lngMin);
        const max = Geography.degrees2meters(s.latMax, s.lngMax);
        const wm = (max.x - min.x) * margin;
        const hm = (max.y - min.y) * margin;
        //console.log(`width: ${wm}m, ${rect.width}px`);
        //console.log(`height: ${hm}m, ${rect.height}px`);

        // 範囲に収めるためのズームレベル、タイル数を求める
        // 縦横それぞれのズームレベルを計算し、より小さな方を取る
        const wz = Math.round(Geography.getZoomByMetersPerPixel(wm / rect.width));
        const hz = Math.round(Geography.getZoomByMetersPerPixel(hm / rect.height));
        this.zoom = wz < hz ? wz : hz;
        console.log(`adjusted zoom level: ${this.zoom}`);
    }

    setMapSource(mapSource: string) {
        this.mapSource = mapSource;
    }

    // 地図表示の中心点とズーム倍率を設定する
    setView(center: LatLngExpression, zoom?: number) {
        this.center = new LatLng(center);
        this.setZoom(zoom);
    }

    setZoom(zoom?: number) {
        if (zoom && zoom > 0 && zoom < 30) {
            this.zoom = zoom;
        }
    }

    // 中心点をx,yピクセル分移動する
    // 移動方向は正の数なら南東方向
    moveCenter(dx: number, dy: number) {
        const mpp = Geography.getMetersPerPixelByZoom(this.zoom);

        // 中心経緯度をメートルに直す
        const center = Geography.degrees2meters(this.center.lat, this.center.lng);
        // ピクセル増分をメートルに変換し、中心経緯度のメートルに加算する
        center.x += dx * mpp;
        center.y -= dy * mpp;
        // 中心経緯度のメートルを経緯度に戻す
        const deg = Geography.meters2degrees(center.x, center.y);

        // 緯度の限界
        if (deg.lat > 85.0) {
            deg.lat = 85.0;
        }
        if (deg.lat < -85.0) {
            deg.lat = -85.0;
        }
        // 経度の限界
        if (deg.lng > 180.0) {
            deg.lng -= 360.0;
        }
        if (deg.lng < -180.0) {
            deg.lng += 360.0;
        }

        this.center.lat = deg.lat;
        this.center.lng = deg.lng;
    }

    start({ offsetX: x, offsetY: y }: MouseEvent | Record<string, number>) {
        this.isMoving = true;
        this.oldPoint = { x, y };
    }

    stop() {
        this.oldPoint = undefined;
        this.isMoving = false;
    }

    // 指定座標に中心点を移動する
    move({ offsetX: x, offsetY: y }: MouseEvent | Record<string, number>) {
        if (this.oldPoint) {
            // ワールド座標の増分を求めて中心点を移動する
            const dx = this.oldPoint.x - x;
            const dy = this.oldPoint.y - y;
            this.moveCenter(dx, dy);
        }

        this.oldPoint = { x, y };
    }

    handlerResize() {
        return () => {
            this.resize();
        };
    }

    handlerMouseDown() {
        return (e: MouseEvent) => {
            if (this.canvas) {
                this.canvas.style.cursor = 'grab';
            }
            this.start(e);
        };
    }

    handlerMouseUp() {
        return () => {
            this.stop();
            if (this.canvas) {
                this.canvas.style.cursor = '';
            }
        };
    }

    handlerMouseMove() {
        return (e: MouseEvent) => {
            if (this.isMoving) {
                if (this.canvas) {
                    this.canvas.style.cursor = 'grabbing';
                }
                this.move(e);
                this.draw();
            }
        };
    }

    handlerMouseLeave() {
        return () => {
            // this.stop();
        };
    }

    handlerTouchStart() {
        return (e: TouchEvent) => {
            if (!this.canvas) {
                return;
            }
            e.preventDefault();
            const rect = this.canvas.getBoundingClientRect();

            // タッチ状態を保存
            const ts = this.touchMap;
            const len = Object.keys(ts).length;
            for (let i = 0; i < e.changedTouches.length; i++) {
                const t = e.changedTouches[i];
                const v = { id: t.identifier, x: t.pageX - rect.left, y: t.pageY - rect.top };
                ts[t.identifier] = v;
            }

            // タッチ状態をタッチ順に配列化
            this.touchList = Object.values(ts).sort((a, b) => a.id - b.id);
            if (len === 0) {
                // 最初の指ならばタッチ開始;
                this.start({
                    offsetX: this.touchList[0].x,
                    offsetY: this.touchList[0].y,
                });
            }
        };
    }

    handlerTouchEnd() {
        return (e: TouchEvent) => {
            if (!this.canvas) {
                return;
            }
            //e.preventDefault();

            // タッチ状態を保存
            const ts = this.touchMap;
            for (let i = 0; i < e.changedTouches.length; i++) {
                const t = e.changedTouches[i];
                if (this.touchList.length > 0 && this.touchList[0].id === t.identifier) {
                    // 一番古い指が離れたならばいったん停止
                    this.stop();
                }
                delete ts[t.identifier];
            }

            // タッチ状態をタッチ順に配列化
            this.touchList = Object.values(ts).sort((a, b) => a.id - b.id);
            if (!this.isMoving && this.touchList.length > 0) {
                // タッチが停止しているとき、次の指が存在する場合は次の指でタッチ再開
                this.start({
                    offsetX: this.touchList[0].x,
                    offsetY: this.touchList[0].y,
                });
            }
        };
    }

    handlerTouchMove() {
        return (e: TouchEvent) => {
            if (!this.canvas) {
                return;
            }
            //e.preventDefault();
            const rect = this.canvas.getBoundingClientRect();

            const ts = this.touchMap;
            for (let i = 0; i < e.changedTouches.length; i++) {
                const t = e.changedTouches[i];
                let v = ts[t.identifier];
                if (v) {
                    v.old = {
                        x: v.x,
                        y: v.y,
                    };
                    v.x = t.pageX - rect.left;
                    v.y = t.pageY - rect.top;
                } else {
                    v = { id: t.identifier, x: t.pageX - rect.left, y: t.pageY - rect.top };
                    ts[t.identifier] = v;
                }
            }
            this.touchList = Object.values(ts).sort((a, b) => a.id - b.id);

            // １本目のタッチ情報
            const t0 = this.touchList[0];
            if (t0.old) {
                // １本目の移動量
                const d0x = t0.old.x - t0.x;
                const d0y = t0.old.y - t0.y;

                if (this.touchList.length >= 2) {
                    // ２本目のタッチ情報
                    const t1 = this.touchList[1];
                    if (t1.old) {
                        // ２本目の移動量
                        const d1x = t1.old.x - t1.x;
                        const d1y = t1.old.y - t1.y;

                        // １本目と２本目の移動量の平均分、中心点をずらす。
                        const dx = (d0x + d1x) / 2;
                        const dy = (d0y + d1y) / 2;

                        // ピンチイン・アウトの最終的な中心位置を求める
                        const rx = (t0.x + t1.x) / 2;
                        const ry = (t0.y + t1.y) / 2;
                        this.moveCenter(rx - rect.width / 2 + dx, ry - rect.height / 2 + dy);

                        // ピンチイン・アウト
                        // １本目と２本目の移動場所、移動量からズームの変化を計算する
                        const rb = Math.sqrt(
                            (t0.old.x - t1.old.x) ** 2 + (t0.old.y - t1.old.y) ** 2,
                        );
                        const ra = Math.sqrt((t0.x - t1.x) ** 2 + (t0.y - t1.y) ** 2);
                        const mpp = Geography.getMetersPerPixelByZoom(this.zoom);
                        const z = Geography.getZoomByMetersPerPixel((mpp * rb) / ra);

                        // 描画する
                        this.draw(rx, ry, z);

                        return;
                    }
                }
            }

            // drag
            this.move({
                offsetX: t0.x,
                offsetY: t0.y,
            });
            this.draw();
        };
    }

    handlerMouseWheel() {
        return (e: WheelEvent) => {
            if (!this.canvas) {
                return;
            }
            e.preventDefault();

            // ホイール操作開始位置を中心に拡大縮小するために中心点を移動する
            const x = e.offsetX;
            const y = e.offsetY;
            const rect = this.canvas.getBoundingClientRect();
            const dx = x - rect.width / 2;
            const dy = y - rect.height / 2;
            this.moveCenter(dx, dy);

            let z = this.zoom;
            if (e.deltaY < 0) {
                z += 0.1;
                if (z > this.zoomMax) z = this.zoomMax;
            } else if (e.deltaY > 0) {
                z += -0.1;
                if (z < this.zoomMin) z = this.zoomMin;
            } else {
                return;
            }
            //this.zoom = z;

            this.draw(x, y, z);
        };
    }
}
