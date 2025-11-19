import esbuild from 'esbuild';
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { resolve } from 'path';

async function buildDemo(demoPath, outputPath) {
  const entryPoint = resolve(demoPath, 'index.js');

  if (!existsSync(entryPoint)) {
    console.log(`Skipping ${demoPath} - no index.js found`);
    return;
  }

  const result = await esbuild.build({
    entryPoints: [entryPoint],
    bundle: true,
    minify: true,
    format: 'iife',
    write: false,
    external: []
  });

  const js = result.outputFiles[0].text;

  const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>UAP Game Engine</title>
  <style>
    body { margin: 0; overflow: hidden; }
    canvas { display: block; width: 100vw; height: 100vh; }
  </style>
</head>
<body>
  <canvas id="game"></canvas>
  <script>${js}</script>
</body>
</html>`;

  writeFileSync(outputPath, html);
  console.log(`Built ${demoPath} -> ${outputPath}`);
}

async function buildLibrary() {
  await esbuild.build({
    entryPoints: ['src/index.js'],
    bundle: true,
    format: 'esm',
    outfile: 'dist/index.js',
    external: ['gl-matrix']
  });
  console.log('Built library -> dist/index.js');
}

async function main() {
  await buildLibrary();

  if (existsSync('demos')) {
    await buildDemo('demos/spinning-triangle', 'dist/demo1.html');
    await buildDemo('demos/mouse-triangle', 'dist/demo2.html');
    await buildDemo('demos/box-room', 'dist/demo3.html');
  }
}

main().catch(console.error);
