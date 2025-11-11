import './style.css';

import { Mapricorn } from '@mapricorn';

// get current position from GPS
const getCurrentPosition = (opts?: PositionOptions) => {
    return new Promise((resolve: PositionCallback, reject: PositionErrorCallback) =>
        navigator.geolocation.getCurrentPosition(resolve, reject, opts)
    );
};

const container = document.querySelector<HTMLDivElement>('#map-layer');
if (!container) {
    throw new Error('Demo markup is missing required elements.');
}

const mapr = new Mapricorn({
    container: container,
    mapSource: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
    center: { lat: 0, lng: 0 },
    zoom: 3,
});

// get location
if (navigator.geolocation) {
    await getCurrentPosition()
        .then((pos) => {
            const lat = pos.coords.latitude;
            const lng = pos.coords.longitude;
            mapr.setView({ lat, lng });
        })
        .catch(() => {
            console.error('Could not get current position');
        });
}

mapr.draw();
