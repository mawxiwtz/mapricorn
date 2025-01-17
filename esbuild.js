import esbuild from 'esbuild';
import chalk from 'chalk';
import fse from 'fs-extra';

const srcdir = './src';
const sources = [
    `${srcdir}/mapricorn.ts`,
    `${srcdir}/latlng.ts`,
    `${srcdir}/gpx.ts`,
    `${srcdir}/geography.ts`,
    `${srcdir}/vector.ts`,
];
const destdir = './dist';
const isServeMode = process.argv.includes('--serve');

// create directory and copy files
try {
    fse.rmSync(destdir, { recursive: true, force: true });
    fse.mkdirsSync(destdir);
    fse.copyFileSync(`static/index.html`, `${destdir}/index.html`);
} catch (err) {
    console.error(`[${chalk.red('copying files or directories for distibution failed:')}]\n`, err);
    process.exit(1);
}

// build CommonJS library
await esbuild.build({
    target: 'esnext',
    platform: 'node', // 'node' 'browser' 'neutral' のいずれかを指定,
    format: 'cjs',
    entryPoints: sources,
    outdir: `${destdir}/lib/cjs`, // 出力先ディレクトリ
    bundle: false,
    minify: false,
    sourcemap: true,
});

// build ESM library
await esbuild.build({
    target: 'esnext',
    platform: 'node', // 'node' 'browser' 'neutral' のいずれかを指定,
    format: 'esm',
    entryPoints: sources,
    outdir: `${destdir}/lib/esm`, // 出力先ディレクトリ
    bundle: false,
    minify: false,
    sourcemap: true,
});

//// build JavaScript library

// build options for JavaScript
const buildOptions = {
    target: 'es2017',
    platform: 'browser',
    format: 'iife',
    entryPoints: [`${srcdir}/bootstrap.ts`],
    outfile: `${destdir}/mapricorn.min.js`,
    bundle: true,
    minify: true,
    sourcemap: true,
};

// build library without minified
await esbuild.build({
    ...buildOptions,
    outfile: `${destdir}/mapricorn.js`,
    minify: false,
    sourcemap: false,
});

// build minified library and start server
if (isServeMode) {
    // with test server
    let ctx = await esbuild.context({
        ...buildOptions,
        plugins: [
            {
                name: 'on-end',
                setup(build) {
                    build.onEnd((result) => {
                        const message = `Sources rebuilded (error: ${result.errors.length}, warning: ${result.warnings.length})`;
                        console.log(`${chalk.cyan(message)}`);
                    });
                },
            },
        ],
    });

    await ctx.watch();
    console.log(`[${chalk.green('Watching source files ...')}]`);

    await ctx.serve({
        host: 'localhost',
        port: 3000,
        servedir: `${destdir}/`,
    });
    console.log(`[${chalk.green('Web server starting ...')}]`);
} else {
    // build only
    await esbuild.build(buildOptions);
}
