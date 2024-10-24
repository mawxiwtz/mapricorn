import { LatLng, type LatLngExpression } from './latlng.js';
import type { GPXData } from './gpx.js';
import { Geography } from './geography.js';
import { Vector2 } from './vector.js';

type PointerInfo = {
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
    enableRotate?: boolean;
    showTileInfo?: boolean;
};

// 地図表示を行うクラス
export class Mapricorn {
    container?: HTMLElement;
    width = '';
    height = '';
    canvas: HTMLCanvasElement;
    canvas2: HTMLCanvasElement;
    mapSource = 'https://tile.openstreetmap.org/{z}/{x}/{y}.png';
    //mapSource = '/map/osm/{z}/{x}/{y}.png';
    gpxData?: GPXData;
    center: LatLng;
    zoom: number = 2;
    zoomMax = 19;
    zoomMin = 2;
    latMax: number = 0;
    lngMin: number = 0;
    enableRotate: boolean = true;
    showTileInfo = false;

    _serial: number = 0;
    _oldPoint?: { x: number; y: number };
    _isMoving = false;
    _imageCache: Record<string, HTMLImageElement>;
    _drawing: boolean = false;
    _pointers: Record<number, PointerInfo>;
    _shiftL = false;
    _theta = 0;

    constructor(opts?: MapricornOptions) {
        this.center = new LatLng([0, 0, 0]);
        this.canvas = document.createElement('canvas');
        this.canvas2 = document.createElement('canvas');
        this._imageCache = {};
        this._pointers = {};

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
            if (opts.enableRotate) {
                this.enableRotate = opts.enableRotate;
            }
            if (opts.showTileInfo) {
                this.showTileInfo = opts.showTileInfo;
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
        this.container.style.overflow = 'hidden';
        if (this.width) {
            this.container.style.width = this.width;
        }
        if (this.height) {
            this.container.style.height = this.height;
        }

        this.canvas = document.createElement('canvas');
        this.canvas.style.position = 'absolute';
        this.canvas.style.width = '100%';
        this.canvas.style.height = '100%';
        this.canvas.style.zIndex = '1';
        this.container.appendChild(this.canvas);

        this.canvas2 = document.createElement('canvas');
        this.canvas2.style.position = 'absolute';
        this.canvas2.style.width = '100%';
        this.canvas2.style.height = '100%';
        this.canvas2.style.zIndex = '0';
        this.container.appendChild(this.canvas2);

        window.addEventListener('resize', this.handlerResize());

        // container setup
        this.container.tabIndex = 0; // enable receive key event on element
        this.container.style.outline = 'none'; // not show outline of element when getting focus
        this.container.focus();

        // disable pinch in-out by browser
        this.container.addEventListener('touchstart', (event) => {
            event.preventDefault();
        });

        this.container.addEventListener('pointerdown', this.handlerPointerDown());
        this.container.addEventListener('pointerup', this.handlerPointerUp());
        this.container.addEventListener('pointermove', this.handlerPointerMove());
        this.container.addEventListener('wheel', this.handlerMouseWheel());

        this.container.addEventListener('keydown', this.handlerKeyDown());
        this.container.addEventListener('keyup', this.handlerKeyUp());
    }

    // canvasのリサイズと解像度設定（ぼやけ防止）
    // canvasの各種設定は消える
    resize() {
        const dpr = window.devicePixelRatio;
        this.canvas.width = this.canvas.clientWidth * dpr;
        this.canvas.height = this.canvas.clientHeight * dpr;

        this.canvas2.width = this.canvas2.clientWidth * dpr;
        this.canvas2.height = this.canvas2.clientHeight * dpr;

        const context = this.canvas.getContext('2d');
        if (!context) {
            return;
        }
        context.restore();
        context.scale(dpr, dpr);
        context.save();

        const context2 = this.canvas2.getContext('2d');
        if (!context2) {
            return;
        }
        context2.restore();
        context2.scale(dpr, dpr);
        context2.save();

        this.draw();
    }

    // 現在の中心点と新しいズームレベルで地図を描画する
    // offsetX, offsetYはズームの中心ピクセル（あらかじめmoveCenter()で
    // 中心点をこの位置に移動しておくこと。描画後に中心点は表示領域の中心に
    // 再設定される）。省略時はcanvasの中心
    // zoomは新しいズームレベルを指定する。省略時は現在のズームレベル
    // easingをfalseにするとズーム変更時もアニメーションしなくなる（ピンチ操作時のUX向上）
    draw(offsetX?: number, offsetY?: number, zoom: number = this.zoom, easing: boolean = true) {
        const ease = (func: (progress: number) => void, duration: number, endFunc: () => void) => {
            let start = -1;
            const handler = { id: 0 };
            const loop = (tic: number) => {
                if (start < 0) start = tic;
                let progress = (tic - start) / duration;
                if (progress > 1) progress = 1;
                func(progress);
                if (progress < 1) {
                    handler.id = requestAnimationFrame(loop);
                } else {
                    endFunc();
                }
            };
            handler.id = requestAnimationFrame(loop);
            return handler;
        };

        const end = () => {
            if (easing && zoom != this.zoom) {
                this.draw2d(this.canvas, this.center, zoom, 0, offsetX, offsetY);
            }

            // canvasの透明度をリセットする
            this.canvas.style.opacity = '1.0';

            // 新しいズームを反映する
            this.zoom = zoom;

            // this.draw()やthis.moveCenter()をアンロックする
            this._drawing = false;

            // ホイールアクションの場合、中心点がポインタの位置となるため
            // 中心点と実際の表示の中心がずれる。そのためズーム変更後の新たな
            // 中心点を計算し、設定する
            if (offsetX !== undefined && offsetY !== undefined) {
                const rx = this.canvas.clientWidth / 2 - offsetX;
                const ry = this.canvas.clientHeight / 2 - offsetY;
                this.moveCenter(rx, ry);
            }
        };

        if (this._drawing) {
            return;
        }

        // this.draw()およびthis.moveCenter()をロックする
        this._drawing = true;

        if (!easing || zoom == this.zoom) {
            this.draw2d(this.canvas, this.center, zoom, 0, offsetX, offsetY);
            end();
        } else {
            // ズーム倍率変更をイージングつきで行う
            const sign = zoom - this.zoom;

            // アニメーションでイージング用キャンバスのサイズと透明度を変更する。
            ease(
                (progress: number) => {
                    // 変化前の描画
                    this.canvas.style.opacity = String(1 - progress);
                    this.draw2d(
                        this.canvas,
                        this.center,
                        this.zoom,
                        sign * progress,
                        offsetX,
                        offsetY,
                    );
                    this.draw2d(
                        this.canvas2,
                        this.center,
                        zoom,
                        -sign * (1 - progress),
                        offsetX,
                        offsetY,
                    );
                },
                300,
                end,
            );
        }
    }

    draw2d(
        canvas: HTMLCanvasElement,
        center: LatLng,
        zoom: number,
        decimals: number = 0,
        offsetX?: number,
        offsetY?: number,
    ) {
        // 複数の座標系を扱うためそれぞれの違いに注意
        //   経緯度：グリニッジ/赤道を原点とした度数単位。北東方向が正の数値
        //   メートル座標：グリニッジ/赤道を原点としたメートル単位。北東方向が正の数値
        //   タイルXY；グリニッジ/北極を原点としたタイル番号。南東方向が正の数値
        //   ワールド座標：グリニッジ/赤道を原点としたピクセル単位。南東方向が正の数値
        //   Canvas座標：画面のcanvasタグ領域の左上隅を原点としたピクセル単位。南東方向が正の数値

        // canvasのサイズ
        const w = canvas.clientWidth;
        const h = canvas.clientHeight;

        // zoomの中心点の「canvas上のオフセット」を求める
        // ホイールアクションやピンチイン/アウト時はcanvasの中心とは限らないことに注意する
        const cx = offsetX ?? w / 2;
        const cy = offsetY ?? h / 2;

        // canvasの表示範囲のメートル座標
        // zoomレベルでのcanvas四隅のメートル座標（zoomの中心点で逆回転させておく）
        const pa = new Vector2(-cx, -cy).rotate(-this._theta);
        const pb = new Vector2(w - cx, -cy).rotate(-this._theta);
        const pc = new Vector2(w - cx, h - cy).rotate(-this._theta);
        const pd = new Vector2(-cx, h - cy).rotate(-this._theta);

        // zoom中心点のメートル座標
        const center_meter = Geography.degrees2meters(center.lat, center.lng);

        // 1ピクセル当たりのメートル
        const mpp = Geography.getMetersPerPixelByZoom(zoom + decimals);

        // 四隅それぞれのメートル座標
        const pma = new Vector2(center_meter.x + pa.x * mpp, center_meter.y - pa.y * mpp);
        const pmb = new Vector2(center_meter.x + pb.x * mpp, center_meter.y - pb.y * mpp);
        const pmc = new Vector2(center_meter.x + pc.x * mpp, center_meter.y - pc.y * mpp);
        const pmd = new Vector2(center_meter.x + pd.x * mpp, center_meter.y - pd.y * mpp);
        const vab = pmb.clone().sub(pma);
        const vbc = pmc.clone().sub(pmb);
        const vcd = pmd.clone().sub(pmc);
        const vda = pma.clone().sub(pmd);

        // 四隅それぞれのタイル座標
        const ta = Geography.meters2tile(pma.x, pma.y, zoom);
        const tb = Geography.meters2tile(pmb.x, pmb.y, zoom);
        const tc = Geography.meters2tile(pmc.x, pmc.y, zoom);
        const td = Geography.meters2tile(pmd.x, pmd.y, zoom);

        // 四隅のタイル座標がすべて収まるタイル範囲
        let minX = Infinity,
            minY = Infinity;
        let maxX = -Infinity,
            maxY = -Infinity;
        [ta, tb, tc, td].forEach((tile) => {
            if (tile.x < minX) minX = tile.x;
            if (tile.y < minY) minY = tile.y;
            if (tile.x > maxX) maxX = tile.x;
            if (tile.y > maxY) maxY = tile.y;
        });

        // 中心点のワールド座標
        const world_center = Geography.meter2world(center_meter.x, center_meter.y, zoom + decimals);
        // 中心点のあるタイル
        const tile = Geography.meters2tile(center_meter.x, center_meter.y, zoom);
        const world_meter = Geography.tile2meters(tile.x, tile.y, zoom);
        const world = Geography.meter2world(world_meter.x, world_meter.y, zoom + decimals);
        // 中心点のあるタイルにおける中心点の相対ワールド座標（南東方向が正）
        const deltax = world_center.x - world.x;
        const deltay = world_center.y - world.y;

        // タイル一辺のピクセル数
        const tilePixel = Geography.getTilePixelByZoom(zoom, decimals);

        // canvasコンテキストの準備
        const ctx = canvas.getContext('2d');
        if (!ctx) {
            return;
        }
        ctx.restore();
        ctx.save();
        ctx.translate(cx, cy);
        ctx.rotate(this._theta);
        const putTileText = (x: number, y: number, str: string) => {
            ctx.strokeRect(x, y, tilePixel, tilePixel);
            ctx.fillText(str, x + tilePixel / 2, y + tilePixel / 2);
        };

        if (this.showTileInfo) {
            ctx.lineWidth = 1;
            ctx.strokeStyle = '#f00';
            ctx.fillStyle = 'red';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.font = `${Math.ceil(tilePixel / 10)}px Arial`;
        }

        // タイル範囲内で表示範囲内にあるタイルを描画
        const tlenx = maxX - minX + 1;
        const tleny = maxY - minY + 1;
        const disparray: boolean[][] = [...Array(tleny)].map(() => [...Array(tlenx)].fill(false));
        for (let iy = 0; iy < tleny; iy++) {
            for (let ix = 0; ix < tlenx; ix++) {
                // タイル左上隅頂点のメートル座標
                const p = Geography.tile2meters(ix + minX, iy + minY, zoom);
                const point = new Vector2(p.x, p.y);
                const vap = point.clone().sub(pma);
                const vbp = point.clone().sub(pmb);
                const vcp = point.clone().sub(pmc);
                const vdp = point.clone().sub(pmd);

                // pointとcanvas表示範囲の四辺との各外積がすべて負ならばpointは表示範囲内
                const crosses =
                    vab.cross(vap) < 0 &&
                    vbc.cross(vbp) < 0 &&
                    vcd.cross(vcp) < 0 &&
                    vda.cross(vdp) < 0;

                disparray[iy][ix] = crosses;
                if (crosses) {
                    if (iy > 0) {
                        disparray[iy - 1][ix] = true;
                    }
                    if (ix > 0) {
                        disparray[iy][ix - 1] = true;
                    }
                    if (iy > 0 && ix > 0) {
                        disparray[iy - 1][ix - 1] = true;
                    }
                }
            }
        }

        let serial = this._serial;
        for (let iy = 0; iy < tleny; iy++) {
            for (let ix = 0; ix < tlenx; ix++) {
                if (disparray[iy][ix]) {
                    // 描画
                    const tx = minX + ix;
                    const ty = minY + iy;
                    const x2 = (tx - tile.x) * tilePixel - deltax; // - cx;
                    const y2 = (ty - tile.y) * tilePixel - deltay; // - cy;

                    const tileText = `${Math.round(zoom)}/${tx}/${ty}`;
                    const url = this.getMapURL(tx, ty, zoom);
                    let image: HTMLImageElement;
                    if (url in this._imageCache) {
                        image = this._imageCache[url];
                        ctx.drawImage(image, x2, y2, tilePixel, tilePixel);

                        // タイルの境界とタイルXYの表示
                        if (this.showTileInfo) {
                            putTileText(x2, y2, tileText);
                        }
                    } else {
                        image = new Image(tilePixel, tilePixel);
                        image.src = url;
                        //ctx.fillRect(x2, y2, tilePixel, tilePixel);
                    }
                    const handler = () => {
                        if (serial === this._serial) {
                            // 地図画像読み込み後も現在のdrawが無効になっていなければ描画を行う
                            ctx.drawImage(image, x2, y2, tilePixel, tilePixel);
                            // タイルの境界とタイルXYの表示
                            if (this.showTileInfo) {
                                putTileText(x2, y2, tileText);
                            }
                        }
                        image.removeEventListener('load', handler);
                        this._imageCache[url] = image;
                    };
                    image.addEventListener('load', handler);
                }
            }
        }

        serial++;
        this._serial = serial > 65536 ? 0 : serial;
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
        if (!this.gpxData) {
            return undefined;
        }

        // ログの範囲(m)を計算
        const s = this.gpxData.stats;
        const min = Geography.degrees2meters(s.latMin, s.lngMin);
        const max = Geography.degrees2meters(s.latMax, s.lngMax);
        const wm = (max.x - min.x) * margin;
        const hm = (max.y - min.y) * margin;

        // 範囲に収めるためのズームレベル、タイル数を求める
        // 縦横それぞれのズームレベルを計算し、より小さな方を取る
        const wz = Math.round(Geography.getZoomByMetersPerPixel(wm / this.canvas.clientWidth));
        const hz = Math.round(Geography.getZoomByMetersPerPixel(hm / this.canvas.clientHeight));
        this.zoom = wz < hz ? wz : hz;
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
        if (this._drawing) {
            return;
        }
        const dv = new Vector2(dx, dy);
        dv.rotate(-this._theta);
        const mpp = Geography.getMetersPerPixelByZoom(this.zoom);

        // 中心経緯度をメートルに直す
        const center = Geography.degrees2meters(this.center.lat, this.center.lng);
        // ピクセル増分をメートルに変換し、中心経緯度のメートルに加算する
        center.x += dv.x * mpp;
        center.y -= dv.y * mpp;
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
        this._isMoving = true;
        this._oldPoint = { x, y };
    }

    stop() {
        this._oldPoint = undefined;
        this._isMoving = false;
    }

    // 指定座標に中心点を移動する
    move({ offsetX: x, offsetY: y }: MouseEvent | Record<string, number>) {
        if (this._oldPoint) {
            // ワールド座標の増分を求めて中心点を移動する
            const dx = this._oldPoint.x - x;
            const dy = this._oldPoint.y - y;
            this.moveCenter(dx, dy);
        }

        this._oldPoint = { x, y };
    }

    handlerResize() {
        return () => {
            this.resize();
        };
    }

    handlerPointerDown() {
        return (e: PointerEvent) => {
            this._pointers[e.pointerId] = {
                id: e.pointerId,
                x: e.offsetX,
                y: e.offsetY,
            };
            const element = <HTMLCanvasElement>e.currentTarget;
            element.setPointerCapture(e.pointerId);

            const pointers = Object.values(this._pointers);
            if (pointers.length === 1) {
                // 最初の指ならばタッチ開始
                this.canvas.style.cursor = 'grab';
                this.start({
                    offsetX: pointers[0].x,
                    offsetY: pointers[0].y,
                });
            }
        };
    }

    handlerPointerUp() {
        return (e: PointerEvent) => {
            //e.preventDefault();

            const element = <HTMLCanvasElement>e.currentTarget;
            element.releasePointerCapture(e.pointerId);
            delete this._pointers[e.pointerId];

            const pointers = Object.values(this._pointers);
            if (pointers.length === 0) {
                // 指がすべて離れた
                this.stop();
                this.canvas.style.cursor = '';
            }
        };
    }

    handlerPointerMove() {
        return (e: PointerEvent) => {
            //e.preventDefault();

            if (!this._isMoving) {
                return;
            }

            // ポインタ情報の更新
            if (e.pointerId in this._pointers) {
                const v = this._pointers[e.pointerId];
                v.old = {
                    x: v.x,
                    y: v.y,
                };
                v.x = e.offsetX;
                v.y = e.offsetY;
            } else {
                this._pointers[e.pointerId] = { id: e.pointerId, x: e.offsetX, y: e.offsetY };
            }

            // ポインタを古い順にソートして配列化
            const pointers = Object.values(this._pointers).sort((a, b) => a.id - b.id);
            if (pointers.length === 0) {
                return;
            }

            // １本目のタッチ情報
            const p0 = pointers[0];
            if (!p0.old) {
                return;
            }

            const w = this.canvas.clientWidth;
            const h = this.canvas.clientHeight;

            // １本目の移動量
            // 地図を右下にドラッグした場合、地図の中心を左上に移動することと同じ。
            const d0 = new Vector2(p0.old.x - p0.x, p0.old.y - p0.y);

            if (pointers.length >= 2) {
                // マルチタッチ
                // ２本目のタッチ情報
                const p1 = pointers[1];
                if (!p1.old) {
                    return;
                }

                // ２本目の移動量
                const d1 = new Vector2(p1.old.x - p1.x, p1.old.y - p1.y);

                // １本目と２本目の移動量の平均分、中心点をずらす。
                const dx = (d0.x + d1.x) / 2;
                const dy = (d0.y + d1.y) / 2;

                // ピンチイン・アウトの最終的な中心位置を求める
                const rx = (p0.x + p1.x) / 2;
                const ry = (p0.y + p1.y) / 2;
                this.moveCenter(rx - w / 2 + dx, ry - h / 2 + dy);

                let z = this.zoom;

                // ピンチイン・アウト
                // １本目と２本目の移動場所、移動量からズームの変化を計算する
                const rb = Math.sqrt((p0.old.x - p1.old.x) ** 2 + (p0.old.y - p1.old.y) ** 2);
                const ra = Math.sqrt((p0.x - p1.x) ** 2 + (p0.y - p1.y) ** 2);
                const mpp = Geography.getMetersPerPixelByZoom(this.zoom);
                z = Geography.getZoomByMetersPerPixel((mpp * rb) / ra);

                if (z > this.zoomMax) z = this.zoomMax;
                if (z < this.zoomMin) z = this.zoomMin;

                if (this.enableRotate && pointers.length >= 3) {
                    // ３本以上のときのみ回転有効
                    // ２本のタッチ位置（移動前、移動後）を正規化する
                    const v00 = new Vector2(p0.old.x / w - 0.5, p0.old.y / h - 0.5);
                    const v01 = new Vector2(p0.x / w - 0.5, p0.y / h - 0.5);
                    const v10 = new Vector2(p1.old.x / w - 0.5, p1.old.y / h - 0.5);
                    const v11 = new Vector2(p1.x / w - 0.5, p1.y / h - 0.5);

                    // ２本指間の中間位置を求める
                    const c00 = v00.clone().add(v10).div(2);
                    const c01 = v01.clone().add(v11).div(2);

                    // 地図の中央を円の中心としたベクトルにする
                    v00.sub(c00);
                    v10.sub(c00);
                    v01.sub(c01);
                    v11.sub(c01);

                    // 各指の回転角を求め、合算を平均したものを地図の回転角とする
                    const delta0 = v00.angleTo(v01) * (v00.cross(v01) < 0 ? -1 : 1);
                    const delta1 = v10.angleTo(v11) * (v10.cross(v11) < 0 ? -1 : 1);
                    const deltaRad = (delta0 + delta1) / 2;

                    let theta = this._theta + deltaRad;
                    if (theta > Math.PI * 2) theta = theta - Math.PI * 2;
                    if (theta < -Math.PI * 2) theta = theta + Math.PI * 2;
                    this._theta = theta;
                }

                // 描画する
                this.draw(rx, ry, z, false);

                return;
            } else {
                // マウスドラッグ or シングルタッチ
                if (this.enableRotate && this._shiftL) {
                    // Shift + ドラッグで地図の回転
                    const v0 = new Vector2(p0.old.x / w - 0.5, p0.old.y / h - 0.5);
                    const v1 = new Vector2(p0.x / w - 0.5, p0.y / h - 0.5);
                    const sign = v0.cross(v1) < 0 ? -1 : 1;

                    let theta = this._theta + v0.angleTo(v1) * sign;
                    if (theta > Math.PI * 2) theta = theta - Math.PI * 2;
                    if (theta < -Math.PI * 2) theta = theta + Math.PI * 2;
                    this._theta = theta;

                    this.draw();
                } else {
                    // 地図の移動
                    if (this._oldPoint) {
                        const nx = this._oldPoint.x - d0.x;
                        const ny = this._oldPoint.y - d0.y;
                        this.move({
                            offsetX: nx,
                            offsetY: ny,
                        });
                        this.draw();
                    }
                }
                return;
            }
        };
    }

    handlerMouseWheel() {
        return (e: WheelEvent) => {
            // disable wheel action by browser
            e.preventDefault();

            // ホイール操作開始位置を中心に拡大縮小するために中心点を移動する
            const x = e.offsetX;
            const y = e.offsetY;
            const dx = e.offsetX - this.canvas.clientWidth / 2;
            const dy = e.offsetY - this.canvas.clientHeight / 2;
            this.moveCenter(dx, dy);

            let z = this.zoom;
            if (e.deltaY < 0) {
                z += 1;
                if (z > this.zoomMax) z = this.zoomMax;
            } else if (e.deltaY > 0) {
                z += -1;
                if (z < this.zoomMin) z = this.zoomMin;
            } else {
                return;
            }

            this.draw(x, y, z);
        };
    }

    handlerKeyDown() {
        const keyMap: Record<string, () => void> = {
            ShiftLeft: () => {
                this._shiftL = true;
            },
        };

        return (e: KeyboardEvent) => {
            const func = keyMap[e.code];
            if (func) func();
        };
    }

    handlerKeyUp() {
        const keyMap: Record<string, () => void> = {
            ShiftLeft: () => {
                this._shiftL = false;
            },
        };

        return (e: KeyboardEvent) => {
            const func = keyMap[e.code];
            if (func) func();
        };
    }
}
