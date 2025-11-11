import path from 'node:path';
import { defineConfig } from 'vite';

const libEntry = path.resolve(__dirname, 'src/index.ts');

export default defineConfig({
    resolve: {
        alias: {
            '@mapricorn': path.resolve(__dirname, 'src'),
        },
    },
    build: {
        lib: {
            entry: libEntry,
            name: 'Mapricorn',
            fileName: (format) => {
                switch (format) {
                    case 'es':
                        return 'mapricorn.esm.js';
                    case 'cjs':
                        return 'mapricorn.cjs';
                    case 'umd':
                    default:
                        return 'mapricorn.umd.js';
                }
            },
            formats: ['es', 'cjs', 'umd'],
        },
        minify: false,
        sourcemap: true,
        rollupOptions: {
            output: {
                exports: 'named',
            },
        },
    },
});
