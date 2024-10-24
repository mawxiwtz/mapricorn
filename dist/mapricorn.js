"use strict";
(() => {
  var __defProp = Object.defineProperty;
  var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
  var __publicField = (obj, key, value) => {
    __defNormalProp(obj, typeof key !== "symbol" ? key + "" : key, value);
    return value;
  };

  // src/latlng.ts
  function formatNum(num, precision) {
    const pow = Math.pow(10, precision === void 0 ? 6 : precision);
    return Math.round(num * pow) / pow;
  }
  var LatLng = class _LatLng {
    constructor(a, b, c) {
      __publicField(this, "lat", 0);
      __publicField(this, "lng", 0);
      __publicField(this, "alt");
      if (a instanceof _LatLng) {
        return a;
      }
      if (Array.isArray(a) && typeof a[0] !== "object") {
        if (a.length === 3) {
          return new _LatLng(a[0], a[1], a[2]);
        }
        if (a.length === 2) {
          return new _LatLng(a[0], a[1]);
        }
        throw new Error("Invalid parameters");
      }
      if (a === void 0 || a === null) {
        return a;
      }
      if (typeof a === "object" && "lat" in a) {
        return new _LatLng(a.lat, a.lng, a.alt);
      }
      if (b === void 0) {
        throw new Error("Invalid parameters");
      }
      const a2 = a;
      if (isNaN(a2) || isNaN(b)) {
        throw new Error("Invalid LatLng object: (" + a2 + ", " + b + ")");
      }
      this.lat = a2;
      this.lng = b;
      if (c !== void 0) {
        this.alt = c;
      }
    }
    equals(otherLatLng, maxMargin) {
      if (!otherLatLng) {
        return false;
      }
      const obj = new _LatLng(otherLatLng);
      const margin = Math.max(Math.abs(this.lat - obj.lat), Math.abs(this.lng - obj.lng));
      return margin <= (maxMargin === void 0 ? 1e-9 : maxMargin);
    }
    toString(precision) {
      return "LatLng(" + formatNum(this.lat, precision) + ", " + formatNum(this.lng, precision) + ")";
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
    clone() {
      return new _LatLng(this.lat, this.lng, this.alt);
    }
  };

  // src/geography.ts
  var R = 6378137;
  var TILE_PIXEL = 256;
  var Geography = class _Geography {
    static getTilePixelByZoom(zoom, decimals = 0) {
      return TILE_PIXEL * (2 ** (zoom + decimals) / 2 ** Math.round(zoom));
    }
    // 経緯度をグリニッジ子午線/赤道を原点としたm単位に変換する
    static degrees2meters(lat, lng) {
      const x = lng * R * Math.PI / 180;
      const y = R * Math.log(Math.tan(Math.PI / 4 + lat * Math.PI / 180 / 2));
      return { x, y };
    }
    // グリニッジ子午線/赤道を原点としたm単位を経緯度に変換する
    static meters2degrees(mx, my) {
      const lat = (2 * Math.atan(Math.exp(my / R)) - Math.PI / 2) / Math.PI * 180;
      const lng = mx / R / Math.PI * 180;
      return { lat, lng };
    }
    // グリニッジ子午線/赤道を原点としたm単位を地図タイル状のX/Yに変換する
    static meters2tile(mx, my, zoom) {
      const x = Math.floor((mx + R * Math.PI) / (2 * R * Math.PI) * 2 ** Math.round(zoom));
      const y = Math.floor((1 - (my + R * Math.PI) / (2 * R * Math.PI)) * 2 ** Math.round(zoom));
      return { x, y };
    }
    // 経緯度を地図タイル状のX/Yに変換する
    static degrees2tile(lat, lng, zoom) {
      const r = _Geography.degrees2meters(lat, lng);
      return _Geography.meters2tile(r.x, r.y, zoom);
    }
    // 地図タイル状のX/Yをグリニッジ子午線/赤道を原点としたm単位に変換する
    // タイルの左上隅の座標となる
    static tile2meters(x, y, zoom) {
      const mx = x / 2 ** Math.round(zoom) * (2 * R * Math.PI) - R * Math.PI;
      const my = (1 - y / 2 ** Math.round(zoom)) * (2 * R * Math.PI) - R * Math.PI;
      return { x: mx, y: my };
    }
    // グリニッジ子午線/赤道を原点としたm単位を、ワールド座標系のピクセル座標にする
    // ワールド座標系は、原点を中心として東側/南側が正となることに注意する
    static meter2world(mx, my, zoom) {
      const mpp = this.getMetersPerPixelByZoom(zoom);
      const world_px = mx / mpp;
      const world_py = -my / mpp;
      return { x: world_px, y: world_py };
    }
    // 指定メートル/ピクセルに収まるズームレベルを計算
    static getZoomByMetersPerPixel(mpp) {
      return Math.log(2 * Math.PI * R / (mpp * TILE_PIXEL)) / Math.log(2);
    }
    // 指定ズームレベルにおけるタイル１辺の長さ(メートル)を計算
    static getMetersPerTileByZoom(zoom) {
      return 2 * Math.PI * R / 2 ** zoom;
    }
    // 指定ズームレベルにおける1pxあたりのメートルを計算
    static getMetersPerPixelByZoom(zoom) {
      return 2 * R * Math.PI / (2 ** zoom * TILE_PIXEL);
    }
  };

  // src/vector.ts
  var Vector2 = class _Vector2 {
    constructor(x, y) {
      __publicField(this, "x");
      __publicField(this, "y");
      this.x = x;
      this.y = y;
    }
    clone() {
      return new _Vector2(this.x, this.y);
    }
    add(obj) {
      if (obj instanceof _Vector2) {
        this.x += obj.x;
        this.y += obj.y;
      } else {
        this.x += obj;
        this.y += obj;
      }
      return this;
    }
    sub(obj) {
      if (obj instanceof _Vector2) {
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
  };

  // src/mapricorn.ts
  var Mapricorn = class {
    constructor(opts) {
      __publicField(this, "container");
      __publicField(this, "width", "");
      __publicField(this, "height", "");
      __publicField(this, "canvas");
      __publicField(this, "canvas2");
      __publicField(this, "mapSource", "https://tile.openstreetmap.org/{z}/{x}/{y}.png");
      //mapSource = '/map/osm/{z}/{x}/{y}.png';
      __publicField(this, "gpxData");
      __publicField(this, "center");
      __publicField(this, "zoom", 2);
      __publicField(this, "zoomMax", 19);
      __publicField(this, "zoomMin", 2);
      __publicField(this, "latMax", 0);
      __publicField(this, "lngMin", 0);
      __publicField(this, "enableRotate", true);
      __publicField(this, "showTileInfo", false);
      __publicField(this, "_serial", 0);
      __publicField(this, "_oldPoint");
      __publicField(this, "_isMoving", false);
      __publicField(this, "_imageCache");
      __publicField(this, "_drawing", false);
      __publicField(this, "_pointers");
      __publicField(this, "_shiftL", false);
      __publicField(this, "_theta", 0);
      this.center = new LatLng([0, 0, 0]);
      this.canvas = document.createElement("canvas");
      this.canvas2 = document.createElement("canvas");
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
    bind(container) {
      if (container === void 0) {
        throw new Error("Invalid container");
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
      this.container.style.position = "relative";
      this.container.style.overflow = "hidden";
      if (this.width) {
        this.container.style.width = this.width;
      }
      if (this.height) {
        this.container.style.height = this.height;
      }
      this.canvas = document.createElement("canvas");
      this.canvas.style.position = "absolute";
      this.canvas.style.width = "100%";
      this.canvas.style.height = "100%";
      this.canvas.style.zIndex = "1";
      this.container.appendChild(this.canvas);
      this.canvas2 = document.createElement("canvas");
      this.canvas2.style.position = "absolute";
      this.canvas2.style.width = "100%";
      this.canvas2.style.height = "100%";
      this.canvas2.style.zIndex = "0";
      this.container.appendChild(this.canvas2);
      window.addEventListener("resize", this.handlerResize());
      this.container.tabIndex = 0;
      this.container.style.outline = "none";
      this.container.focus();
      this.container.addEventListener("touchstart", (event) => {
        event.preventDefault();
      });
      this.container.addEventListener("pointerdown", this.handlerPointerDown());
      this.container.addEventListener("pointerup", this.handlerPointerUp());
      this.container.addEventListener("pointermove", this.handlerPointerMove());
      this.container.addEventListener("wheel", this.handlerMouseWheel());
      this.container.addEventListener("keydown", this.handlerKeyDown());
      this.container.addEventListener("keyup", this.handlerKeyUp());
    }
    // canvasのリサイズと解像度設定（ぼやけ防止）
    // canvasの各種設定は消える
    resize() {
      const dpr = window.devicePixelRatio;
      this.canvas.width = this.canvas.clientWidth * dpr;
      this.canvas.height = this.canvas.clientHeight * dpr;
      this.canvas2.width = this.canvas2.clientWidth * dpr;
      this.canvas2.height = this.canvas2.clientHeight * dpr;
      const context = this.canvas.getContext("2d");
      if (!context) {
        return;
      }
      context.restore();
      context.scale(dpr, dpr);
      context.save();
      const context2 = this.canvas2.getContext("2d");
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
    draw(offsetX, offsetY, zoom = this.zoom, easing = true) {
      const ease = (func, duration, endFunc) => {
        let start = -1;
        const handler = { id: 0 };
        const loop = (tic) => {
          if (start < 0)
            start = tic;
          let progress = (tic - start) / duration;
          if (progress > 1)
            progress = 1;
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
        this.canvas.style.opacity = "1.0";
        this.zoom = zoom;
        this._drawing = false;
        if (offsetX !== void 0 && offsetY !== void 0) {
          const rx = this.canvas.clientWidth / 2 - offsetX;
          const ry = this.canvas.clientHeight / 2 - offsetY;
          this.moveCenter(rx, ry);
        }
      };
      if (this._drawing) {
        return;
      }
      this._drawing = true;
      if (!easing || zoom == this.zoom) {
        this.draw2d(this.canvas, this.center, zoom, 0, offsetX, offsetY);
        end();
      } else {
        const sign = zoom - this.zoom;
        ease(
          (progress) => {
            this.canvas.style.opacity = String(1 - progress);
            this.draw2d(
              this.canvas,
              this.center,
              this.zoom,
              sign * progress,
              offsetX,
              offsetY
            );
            this.draw2d(
              this.canvas2,
              this.center,
              zoom,
              -sign * (1 - progress),
              offsetX,
              offsetY
            );
          },
          300,
          end
        );
      }
    }
    draw2d(canvas, center, zoom, decimals = 0, offsetX, offsetY) {
      const w = canvas.clientWidth;
      const h = canvas.clientHeight;
      const cx = offsetX != null ? offsetX : w / 2;
      const cy = offsetY != null ? offsetY : h / 2;
      const pa = new Vector2(-cx, -cy).rotate(-this._theta);
      const pb = new Vector2(w - cx, -cy).rotate(-this._theta);
      const pc = new Vector2(w - cx, h - cy).rotate(-this._theta);
      const pd = new Vector2(-cx, h - cy).rotate(-this._theta);
      const center_meter = Geography.degrees2meters(center.lat, center.lng);
      const mpp = Geography.getMetersPerPixelByZoom(zoom + decimals);
      const pma = new Vector2(center_meter.x + pa.x * mpp, center_meter.y - pa.y * mpp);
      const pmb = new Vector2(center_meter.x + pb.x * mpp, center_meter.y - pb.y * mpp);
      const pmc = new Vector2(center_meter.x + pc.x * mpp, center_meter.y - pc.y * mpp);
      const pmd = new Vector2(center_meter.x + pd.x * mpp, center_meter.y - pd.y * mpp);
      const vab = pmb.clone().sub(pma);
      const vbc = pmc.clone().sub(pmb);
      const vcd = pmd.clone().sub(pmc);
      const vda = pma.clone().sub(pmd);
      const ta = Geography.meters2tile(pma.x, pma.y, zoom);
      const tb = Geography.meters2tile(pmb.x, pmb.y, zoom);
      const tc = Geography.meters2tile(pmc.x, pmc.y, zoom);
      const td = Geography.meters2tile(pmd.x, pmd.y, zoom);
      let minX = Infinity, minY = Infinity;
      let maxX = -Infinity, maxY = -Infinity;
      [ta, tb, tc, td].forEach((tile2) => {
        if (tile2.x < minX)
          minX = tile2.x;
        if (tile2.y < minY)
          minY = tile2.y;
        if (tile2.x > maxX)
          maxX = tile2.x;
        if (tile2.y > maxY)
          maxY = tile2.y;
      });
      const world_center = Geography.meter2world(center_meter.x, center_meter.y, zoom + decimals);
      const tile = Geography.meters2tile(center_meter.x, center_meter.y, zoom);
      const world_meter = Geography.tile2meters(tile.x, tile.y, zoom);
      const world = Geography.meter2world(world_meter.x, world_meter.y, zoom + decimals);
      const deltax = world_center.x - world.x;
      const deltay = world_center.y - world.y;
      const tilePixel = Geography.getTilePixelByZoom(zoom, decimals);
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        return;
      }
      ctx.restore();
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(this._theta);
      const putTileText = (x, y, str) => {
        ctx.strokeRect(x, y, tilePixel, tilePixel);
        ctx.fillText(str, x + tilePixel / 2, y + tilePixel / 2);
      };
      if (this.showTileInfo) {
        ctx.lineWidth = 1;
        ctx.strokeStyle = "#f00";
        ctx.fillStyle = "red";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.font = `${Math.ceil(tilePixel / 10)}px Arial`;
      }
      const tlenx = maxX - minX + 1;
      const tleny = maxY - minY + 1;
      const disparray = [...Array(tleny)].map(() => [...Array(tlenx)].fill(false));
      for (let iy = 0; iy < tleny; iy++) {
        for (let ix = 0; ix < tlenx; ix++) {
          const p = Geography.tile2meters(ix + minX, iy + minY, zoom);
          const point = new Vector2(p.x, p.y);
          const vap = point.clone().sub(pma);
          const vbp = point.clone().sub(pmb);
          const vcp = point.clone().sub(pmc);
          const vdp = point.clone().sub(pmd);
          const crosses = vab.cross(vap) < 0 && vbc.cross(vbp) < 0 && vcd.cross(vcp) < 0 && vda.cross(vdp) < 0;
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
            const tx = minX + ix;
            const ty = minY + iy;
            const x2 = (tx - tile.x) * tilePixel - deltax;
            const y2 = (ty - tile.y) * tilePixel - deltay;
            const tileText = `${Math.round(zoom)}/${tx}/${ty}`;
            const url = this.getMapURL(tx, ty, zoom);
            let image;
            if (url in this._imageCache) {
              image = this._imageCache[url];
              ctx.drawImage(image, x2, y2, tilePixel, tilePixel);
              if (this.showTileInfo) {
                putTileText(x2, y2, tileText);
              }
            } else {
              image = new Image(tilePixel, tilePixel);
              image.src = url;
            }
            const handler = () => {
              if (serial === this._serial) {
                ctx.drawImage(image, x2, y2, tilePixel, tilePixel);
                if (this.showTileInfo) {
                  putTileText(x2, y2, tileText);
                }
              }
              image.removeEventListener("load", handler);
              this._imageCache[url] = image;
            };
            image.addEventListener("load", handler);
          }
        }
      }
      serial++;
      this._serial = serial > 65536 ? 0 : serial;
    }
    // OpenStreetMapなどの地図画像に対するURLを生成する
    getMapURL(x, y, zoom) {
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
      return this.mapSource.replace("{x}", String(x)).replace("{y}", String(y)).replace("{z}", String(z));
    }
    // GPXデータをセットする
    // setViewがtrueの時は地図の中心点やズームレベルも自動調整される
    setGPXData(gpxData, setView = false) {
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
    adjustZoomLevelByGPXData(margin = 1.2) {
      if (!this.gpxData) {
        return void 0;
      }
      const s = this.gpxData.stats;
      const min = Geography.degrees2meters(s.latMin, s.lngMin);
      const max = Geography.degrees2meters(s.latMax, s.lngMax);
      const wm = (max.x - min.x) * margin;
      const hm = (max.y - min.y) * margin;
      const wz = Math.round(Geography.getZoomByMetersPerPixel(wm / this.canvas.clientWidth));
      const hz = Math.round(Geography.getZoomByMetersPerPixel(hm / this.canvas.clientHeight));
      this.zoom = wz < hz ? wz : hz;
    }
    setMapSource(mapSource) {
      this.mapSource = mapSource;
    }
    // 地図表示の中心点とズーム倍率を設定する
    setView(center, zoom) {
      this.center = new LatLng(center);
      this.setZoom(zoom);
    }
    setZoom(zoom) {
      if (zoom && zoom > 0 && zoom < 30) {
        this.zoom = zoom;
      }
    }
    // 中心点をx,yピクセル分移動する
    // 移動方向は正の数なら南東方向
    moveCenter(dx, dy) {
      if (this._drawing) {
        return;
      }
      const dv = new Vector2(dx, dy);
      dv.rotate(-this._theta);
      const mpp = Geography.getMetersPerPixelByZoom(this.zoom);
      const center = Geography.degrees2meters(this.center.lat, this.center.lng);
      center.x += dv.x * mpp;
      center.y -= dv.y * mpp;
      const deg = Geography.meters2degrees(center.x, center.y);
      if (deg.lat > 85) {
        deg.lat = 85;
      }
      if (deg.lat < -85) {
        deg.lat = -85;
      }
      if (deg.lng > 180) {
        deg.lng -= 360;
      }
      if (deg.lng < -180) {
        deg.lng += 360;
      }
      this.center.lat = deg.lat;
      this.center.lng = deg.lng;
    }
    start({ offsetX: x, offsetY: y }) {
      this._isMoving = true;
      this._oldPoint = { x, y };
    }
    stop() {
      this._oldPoint = void 0;
      this._isMoving = false;
    }
    // 指定座標に中心点を移動する
    move({ offsetX: x, offsetY: y }) {
      if (this._oldPoint) {
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
      return (e) => {
        this._pointers[e.pointerId] = {
          id: e.pointerId,
          x: e.offsetX,
          y: e.offsetY
        };
        const element = e.currentTarget;
        element.setPointerCapture(e.pointerId);
        const pointers = Object.values(this._pointers);
        if (pointers.length === 1) {
          this.canvas.style.cursor = "grab";
          this.start({
            offsetX: pointers[0].x,
            offsetY: pointers[0].y
          });
        }
      };
    }
    handlerPointerUp() {
      return (e) => {
        const element = e.currentTarget;
        element.releasePointerCapture(e.pointerId);
        delete this._pointers[e.pointerId];
        const pointers = Object.values(this._pointers);
        if (pointers.length === 0) {
          this.stop();
          this.canvas.style.cursor = "";
        }
      };
    }
    handlerPointerMove() {
      return (e) => {
        if (!this._isMoving) {
          return;
        }
        if (e.pointerId in this._pointers) {
          const v = this._pointers[e.pointerId];
          v.old = {
            x: v.x,
            y: v.y
          };
          v.x = e.offsetX;
          v.y = e.offsetY;
        } else {
          this._pointers[e.pointerId] = { id: e.pointerId, x: e.offsetX, y: e.offsetY };
        }
        const pointers = Object.values(this._pointers).sort((a, b) => a.id - b.id);
        if (pointers.length === 0) {
          return;
        }
        const p0 = pointers[0];
        if (!p0.old) {
          return;
        }
        const w = this.canvas.clientWidth;
        const h = this.canvas.clientHeight;
        const d0 = new Vector2(p0.old.x - p0.x, p0.old.y - p0.y);
        if (pointers.length >= 2) {
          const p1 = pointers[1];
          if (!p1.old) {
            return;
          }
          const d1 = new Vector2(p1.old.x - p1.x, p1.old.y - p1.y);
          const dx = (d0.x + d1.x) / 2;
          const dy = (d0.y + d1.y) / 2;
          const rx = (p0.x + p1.x) / 2;
          const ry = (p0.y + p1.y) / 2;
          this.moveCenter(rx - w / 2 + dx, ry - h / 2 + dy);
          let z = this.zoom;
          const rb = Math.sqrt((p0.old.x - p1.old.x) ** 2 + (p0.old.y - p1.old.y) ** 2);
          const ra = Math.sqrt((p0.x - p1.x) ** 2 + (p0.y - p1.y) ** 2);
          const mpp = Geography.getMetersPerPixelByZoom(this.zoom);
          z = Geography.getZoomByMetersPerPixel(mpp * rb / ra);
          if (z > this.zoomMax)
            z = this.zoomMax;
          if (z < this.zoomMin)
            z = this.zoomMin;
          if (this.enableRotate && pointers.length >= 3) {
            const v00 = new Vector2(p0.old.x / w - 0.5, p0.old.y / h - 0.5);
            const v01 = new Vector2(p0.x / w - 0.5, p0.y / h - 0.5);
            const v10 = new Vector2(p1.old.x / w - 0.5, p1.old.y / h - 0.5);
            const v11 = new Vector2(p1.x / w - 0.5, p1.y / h - 0.5);
            const c00 = v00.clone().add(v10).div(2);
            const c01 = v01.clone().add(v11).div(2);
            v00.sub(c00);
            v10.sub(c00);
            v01.sub(c01);
            v11.sub(c01);
            const delta0 = v00.angleTo(v01) * (v00.cross(v01) < 0 ? -1 : 1);
            const delta1 = v10.angleTo(v11) * (v10.cross(v11) < 0 ? -1 : 1);
            const deltaRad = (delta0 + delta1) / 2;
            let theta = this._theta + deltaRad;
            if (theta > Math.PI * 2)
              theta = theta - Math.PI * 2;
            if (theta < -Math.PI * 2)
              theta = theta + Math.PI * 2;
            this._theta = theta;
          }
          this.draw(rx, ry, z, false);
          return;
        } else {
          if (this.enableRotate && this._shiftL) {
            const v0 = new Vector2(p0.old.x / w - 0.5, p0.old.y / h - 0.5);
            const v1 = new Vector2(p0.x / w - 0.5, p0.y / h - 0.5);
            const sign = v0.cross(v1) < 0 ? -1 : 1;
            let theta = this._theta + v0.angleTo(v1) * sign;
            if (theta > Math.PI * 2)
              theta = theta - Math.PI * 2;
            if (theta < -Math.PI * 2)
              theta = theta + Math.PI * 2;
            this._theta = theta;
            this.draw();
          } else {
            if (this._oldPoint) {
              const nx = this._oldPoint.x - d0.x;
              const ny = this._oldPoint.y - d0.y;
              this.move({
                offsetX: nx,
                offsetY: ny
              });
              this.draw();
            }
          }
          return;
        }
      };
    }
    handlerMouseWheel() {
      return (e) => {
        e.preventDefault();
        const x = e.offsetX;
        const y = e.offsetY;
        const dx = e.offsetX - this.canvas.clientWidth / 2;
        const dy = e.offsetY - this.canvas.clientHeight / 2;
        this.moveCenter(dx, dy);
        let z = this.zoom;
        if (e.deltaY < 0) {
          z += 1;
          if (z > this.zoomMax)
            z = this.zoomMax;
        } else if (e.deltaY > 0) {
          z += -1;
          if (z < this.zoomMin)
            z = this.zoomMin;
        } else {
          return;
        }
        this.draw(x, y, z);
      };
    }
    handlerKeyDown() {
      const keyMap = {
        ShiftLeft: () => {
          this._shiftL = true;
        }
      };
      return (e) => {
        const func = keyMap[e.code];
        if (func)
          func();
      };
    }
    handlerKeyUp() {
      const keyMap = {
        ShiftLeft: () => {
          this._shiftL = false;
        }
      };
      return (e) => {
        const func = keyMap[e.code];
        if (func)
          func();
      };
    }
  };

  // src/bootstrap.ts
  if (window) {
    window.Mapricorn = (opts) => {
      return new Mapricorn(opts);
    };
  }
})();
