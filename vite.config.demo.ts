import path from 'node:path';
import { defineConfig } from 'vite';

const libEntry = path.resolve(__dirname, 'src/index.ts');

export default defineConfig({
    resolve: {
        alias: {
            '@mapricorn': path.resolve(__dirname, 'src'),
        },
    },
    base: './',
    build: {
        lib: {
            entry: libEntry,
            name: 'Mapricorn',
            fileName: 'demo',
            formats: ['es'],
        },
        emptyOutDir: false,
        outDir: 'dist',
        minify: false,
        rollupOptions: {
            input: 'index.html',
            output: {
                exports: 'named',
                paths: {
                    '@mapricorn': './mapricorn.esm.min.js',
                },
            },
            external: ['@mapricorn'],
        },
    },
});
