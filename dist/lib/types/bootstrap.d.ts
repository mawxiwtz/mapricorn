import { type MapricornOptions } from './mapricorn.js';
declare global {
    interface Window {
        Mapricorn: (opts: MapricornOptions) => void;
    }
}
