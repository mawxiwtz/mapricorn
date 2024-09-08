import { Mapricorn, type MapricornOptions } from './mapricorn.js';

declare global {
    interface Window {
        Mapricorn: (opts: MapricornOptions) => void;
    }
}

if (window) {
    window.Mapricorn = (opts?: MapricornOptions) => {
        return new Mapricorn(opts);
    };
}
