# Mapricorn

Mapricorn is a drawing engine for displaying maps in specified areas on the web. It supports any wiki world map such as OpenStreetMap. Can be used from JavaScript or TypeScript. It doesn't have as much functionality as Leaflet, but it uses less code.

[Sample Demo](https://mawxiwtz.github.io/mapricorn/)

## Installation

```
npm install https://github.com/mawxiwtz/mapricorn
```

## Usage

### JavaScript (Browser)

Copy "maprincorn.umd.js" from the dist directory and load it inside your HTML file:

```
<script lang="javascript" src="./mapricorn.umd.js"></script>
```

And place one tag for map display:

```
<div id="maparea" />
```

Then, specify the display location etc. in javascript as follows:

```
const mapr = Mapricorn.create({
    container: maparea,
    mapSource: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
    center: { lat: 0, lng: 0 },
    zoom: 3,
});
mapr.draw();
```

### ESM

you can now do this:

```
import { Mapricorn } from 'mapricorn';
```

Then, specify the display location etc. in javascript as follows:

```
const mapr = new Mapricorn({
    container: maparea,
    mapSource: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
    center: { lat: 0, lng: 0 },
    zoom: 3,
});
mapr.draw();
```

## License

Released under the MIT license

Copyright (c) 2024 Pekoe
