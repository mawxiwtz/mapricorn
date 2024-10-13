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
    static getTilePixelByZoom(zoom) {
      return TILE_PIXEL * (2 ** zoom / 2 ** Math.round(zoom));
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

  // src/mapricorn.ts
  var Mapricorn = class {
    constructor(opts) {
      __publicField(this, "debug", false);
      __publicField(this, "container");
      __publicField(this, "width", "");
      __publicField(this, "height", "");
      __publicField(this, "canvas");
      __publicField(this, "mapSource", "https://tile.openstreetmap.org/{z}/{x}/{y}.png");
      //mapSource = '/map/osm/{z}/{x}/{y}.png';
      __publicField(this, "offScreen");
      __publicField(this, "useOffScreen", true);
      __publicField(this, "gpxData");
      __publicField(this, "center");
      __publicField(this, "zoom", 1);
      __publicField(this, "zoomMax", 19);
      __publicField(this, "zoomMin", 0);
      __publicField(this, "latMax", 0);
      __publicField(this, "lngMin", 0);
      __publicField(this, "oldPoint");
      __publicField(this, "isMoving", false);
      __publicField(this, "touchMap", {});
      __publicField(this, "touchList", []);
      __publicField(this, "images", []);
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
      if (this.width) {
        this.container.style.width = this.width;
      }
      if (this.height) {
        this.container.style.height = this.height;
      }
      if (!this.canvas) {
        this.canvas = document.createElement("canvas");
        this.container.appendChild(this.canvas);
        this.canvas.style.width = "100%";
        this.canvas.style.height = "100%";
        const context = this.canvas.getContext("2d");
        if (!context) {
          return;
        }
        context.lineWidth = 1;
        context.strokeStyle = "#fff";
        this.canvas.addEventListener("mousedown", this.handlerMouseDown());
        this.canvas.addEventListener("mouseup", this.handlerMouseUp());
        this.canvas.addEventListener("mousemove", this.handlerMouseMove());
        this.canvas.addEventListener("mouseleave", this.handlerMouseLeave());
        this.canvas.addEventListener("touchstart", this.handlerTouchStart());
        this.canvas.addEventListener("touchend", this.handlerTouchEnd());
        this.canvas.addEventListener("touchmove", this.handlerTouchMove());
        this.canvas.addEventListener("wheel", this.handlerMouseWheel());
        window.addEventListener("resize", this.handlerResize());
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
          this.offScreen = document.createElement("canvas");
        }
        this.offScreen.width = rect.width * dpr;
        this.offScreen.height = rect.height * dpr;
      }
      const context = this.canvas.getContext("2d");
      if (!context) {
        return;
      }
      context.scale(dpr, dpr);
      if (this.offScreen) {
        const ctx = this.offScreen.getContext("2d");
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
    draw(offsetX, offsetY, zoom = this.zoom) {
      if (!this.canvas || this.useOffScreen && !this.offScreen) {
        return;
      }
      const rect = this.canvas.getBoundingClientRect();
      const tilePixel = Geography.getTilePixelByZoom(zoom);
      const center = Geography.degrees2meters(this.center.lat, this.center.lng);
      const tile = Geography.meters2tile(center.x, center.y, zoom);
      const mpp = Geography.getMetersPerPixelByZoom(zoom);
      const ltx = center.x - (offsetX != null ? offsetX : rect.width / 2) * mpp;
      const lty = center.y + (offsetY != null ? offsetY : rect.height / 2) * mpp;
      const startTile = Geography.meters2tile(ltx, lty, zoom);
      const world_meter = Geography.tile2meters(tile.x, tile.y, zoom);
      const world = Geography.meter2world(world_meter.x, world_meter.y, zoom);
      const world_center = Geography.meter2world(center.x, center.y, zoom);
      const cx = offsetX != null ? offsetX : rect.width / 2;
      const cy = offsetY != null ? offsetY : rect.height / 2;
      const dx = world_center.x - world.x;
      const dy = world_center.y - world.y;
      const modx = (cx - dx) % tilePixel;
      const tilexnum = Math.ceil((rect.width - modx) / tilePixel) + (modx > 0 ? 1 : 0);
      const mody = (cy - dy) % tilePixel;
      const tileynum = Math.ceil((rect.height - mody) / tilePixel) + (mody > 0 ? 1 : 0);
      const context = this.canvas.getContext("2d");
      if (!context) {
        return;
      }
      const ctx = this.offScreen ? this.offScreen.getContext("2d") : context;
      if (ctx) {
        if (this.debug) {
          ctx.lineWidth = 1;
          ctx.strokeStyle = "#f00";
          ctx.fillStyle = "red";
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          ctx.font = "26px Arial";
        }
      } else {
        return;
      }
      const startTile_meter = Geography.tile2meters(startTile.x, startTile.y, zoom);
      const offsetX_meter = startTile_meter.x - ltx;
      const offsetY_meter = lty - startTile_meter.y;
      const deltax = offsetX_meter / mpp;
      const deltay = offsetY_meter / mpp;
      const tileNum = tilexnum * tileynum;
      let tiles = 0;
      for (const i of this.images) {
        i.src = "";
      }
      this.images = [];
      for (let x = 0; x < tilexnum; x++) {
        for (let y = 0; y < tileynum; y++) {
          const tx = startTile.x + x;
          const ty = startTile.y + y;
          const url = this.getMapURL(tx, ty, zoom);
          const image = new Image();
          this.images.push(image);
          image.addEventListener("load", () => {
            const x2 = x * tilePixel + deltax;
            const y2 = y * tilePixel + deltay;
            if (this.offScreen) {
              ctx.drawImage(image, x2, y2, tilePixel, tilePixel);
              if (this.debug) {
                ctx.strokeRect(x2, y2, tilePixel, tilePixel);
                ctx.fillText(
                  `${zoom}/${tx}/${ty}`,
                  x2 + tilePixel / 2,
                  y2 + tilePixel / 2
                );
              }
              tiles++;
              if (tiles === tileNum) {
                context.drawImage(this.offScreen, 0, 0);
              }
            } else {
              ctx.drawImage(image, x2, y2, tilePixel, tilePixel);
              if (this.debug) {
                ctx.strokeRect(x2, y2, tilePixel, tilePixel);
                ctx.fillText(
                  `${zoom}/${tx}/${ty}`,
                  x2 + tilePixel / 2,
                  y2 + tilePixel / 2
                );
              }
            }
          });
          image.src = url;
        }
      }
      this.zoom = zoom;
      if (offsetX !== void 0 && offsetY !== void 0) {
        const rx = rect.width / 2 - offsetX;
        const ry = rect.height / 2 - offsetY;
        this.moveCenter(rx, ry);
      }
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
      if (!this.canvas) {
        return;
      }
      if (!this.gpxData) {
        return void 0;
      }
      const rect = this.canvas.getBoundingClientRect();
      const s = this.gpxData.stats;
      const min = Geography.degrees2meters(s.latMin, s.lngMin);
      const max = Geography.degrees2meters(s.latMax, s.lngMax);
      const wm = (max.x - min.x) * margin;
      const hm = (max.y - min.y) * margin;
      const wz = Math.round(Geography.getZoomByMetersPerPixel(wm / rect.width));
      const hz = Math.round(Geography.getZoomByMetersPerPixel(hm / rect.height));
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
      const mpp = Geography.getMetersPerPixelByZoom(this.zoom);
      const center = Geography.degrees2meters(this.center.lat, this.center.lng);
      center.x += dx * mpp;
      center.y -= dy * mpp;
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
      this.isMoving = true;
      this.oldPoint = { x, y };
    }
    stop() {
      this.oldPoint = void 0;
      this.isMoving = false;
    }
    // 指定座標に中心点を移動する
    move({ offsetX: x, offsetY: y }) {
      if (this.oldPoint) {
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
      return (e) => {
        if (this.canvas) {
          this.canvas.style.cursor = "grab";
        }
        this.start(e);
      };
    }
    handlerMouseUp() {
      return () => {
        this.stop();
        if (this.canvas) {
          this.canvas.style.cursor = "";
        }
      };
    }
    handlerMouseMove() {
      return (e) => {
        if (this.isMoving) {
          if (this.canvas) {
            this.canvas.style.cursor = "grabbing";
          }
          this.move(e);
          this.draw();
        }
      };
    }
    handlerMouseLeave() {
      return () => {
      };
    }
    handlerTouchStart() {
      return (e) => {
        if (!this.canvas) {
          return;
        }
        e.preventDefault();
        const rect = this.canvas.getBoundingClientRect();
        const ts = this.touchMap;
        const len = Object.keys(ts).length;
        for (let i = 0; i < e.changedTouches.length; i++) {
          const t = e.changedTouches[i];
          const v = { id: t.identifier, x: t.pageX - rect.left, y: t.pageY - rect.top };
          ts[t.identifier] = v;
        }
        this.touchList = Object.values(ts).sort((a, b) => a.id - b.id);
        if (len === 0) {
          this.start({
            offsetX: this.touchList[0].x,
            offsetY: this.touchList[0].y
          });
        }
      };
    }
    handlerTouchEnd() {
      return (e) => {
        if (!this.canvas) {
          return;
        }
        const ts = this.touchMap;
        for (let i = 0; i < e.changedTouches.length; i++) {
          const t = e.changedTouches[i];
          if (this.touchList.length > 0 && this.touchList[0].id === t.identifier) {
            this.stop();
          }
          delete ts[t.identifier];
        }
        this.touchList = Object.values(ts).sort((a, b) => a.id - b.id);
        if (!this.isMoving && this.touchList.length > 0) {
          this.start({
            offsetX: this.touchList[0].x,
            offsetY: this.touchList[0].y
          });
        }
      };
    }
    handlerTouchMove() {
      return (e) => {
        if (!this.canvas) {
          return;
        }
        const rect = this.canvas.getBoundingClientRect();
        const ts = this.touchMap;
        for (let i = 0; i < e.changedTouches.length; i++) {
          const t = e.changedTouches[i];
          let v = ts[t.identifier];
          if (v) {
            v.old = {
              x: v.x,
              y: v.y
            };
            v.x = t.pageX - rect.left;
            v.y = t.pageY - rect.top;
          } else {
            v = { id: t.identifier, x: t.pageX - rect.left, y: t.pageY - rect.top };
            ts[t.identifier] = v;
          }
        }
        this.touchList = Object.values(ts).sort((a, b) => a.id - b.id);
        const t0 = this.touchList[0];
        if (t0.old) {
          const d0x = t0.old.x - t0.x;
          const d0y = t0.old.y - t0.y;
          if (this.touchList.length >= 2) {
            const t1 = this.touchList[1];
            if (t1.old) {
              const d1x = t1.old.x - t1.x;
              const d1y = t1.old.y - t1.y;
              const dx = (d0x + d1x) / 2;
              const dy = (d0y + d1y) / 2;
              const rx = (t0.x + t1.x) / 2;
              const ry = (t0.y + t1.y) / 2;
              this.moveCenter(rx - rect.width / 2 + dx, ry - rect.height / 2 + dy);
              const rb = Math.sqrt(
                (t0.old.x - t1.old.x) ** 2 + (t0.old.y - t1.old.y) ** 2
              );
              const ra = Math.sqrt((t0.x - t1.x) ** 2 + (t0.y - t1.y) ** 2);
              const mpp = Geography.getMetersPerPixelByZoom(this.zoom);
              const z = Geography.getZoomByMetersPerPixel(mpp * rb / ra);
              this.draw(rx, ry, z);
              return;
            }
          }
        }
        this.move({
          offsetX: t0.x,
          offsetY: t0.y
        });
        this.draw();
      };
    }
    handlerMouseWheel() {
      return (e) => {
        if (!this.canvas) {
          return;
        }
        e.preventDefault();
        const x = e.offsetX;
        const y = e.offsetY;
        const rect = this.canvas.getBoundingClientRect();
        const dx = x - rect.width / 2;
        const dy = y - rect.height / 2;
        this.moveCenter(dx, dy);
        let z = this.zoom;
        if (e.deltaY < 0) {
          z += 0.1;
          if (z > this.zoomMax)
            z = this.zoomMax;
        } else if (e.deltaY > 0) {
          z += -0.1;
          if (z < this.zoomMin)
            z = this.zoomMin;
        } else {
          return;
        }
        this.draw(x, y, z);
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
