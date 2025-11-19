#!/usr/bin/env node
import esbuild from 'esbuild';
import { writeFileSync, mkdirSync, existsSync, readFileSync } from 'fs';
import { resolve } from 'path';

async function buildGame(entryPoint, outputPath, gameName) {
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
  <title>${gameName} - UAP Game Engine</title>
  <style>
    body { margin: 0; overflow: hidden; background: #1a1a1a; }
    canvas { display: block; width: 100vw; height: 100vh; }
  </style>
</head>
<body>
  <canvas id="game"></canvas>
  <script>${js}</script>
</body>
</html>`;

  writeFileSync(outputPath, html);
  console.log(`Built game -> ${outputPath}`);
}

async function main() {
  const srcDir = 'src';
  const distDir = 'dist';
  const entryPoint = resolve(srcDir, 'index.js');
  const outputPath = resolve(distDir, 'index.html');

  // Ensure dist directory exists
  if (!existsSync(distDir)) {
    mkdirSync(distDir, { recursive: true });
    console.log(`Created ${distDir} directory`);
  }

  // Check if src directory exists
  if (!existsSync(srcDir)) {
    console.error(`Error: ${srcDir} directory not found`);
    console.error('Please create a src directory with your game files');
    process.exit(1);
  }

  // Check if entry point exists
  if (!existsSync(entryPoint)) {
    console.error(`Error: ${entryPoint} not found`);
    console.error('Please create a src/index.js file as the entry point for your game');
    process.exit(1);
  }

  console.log('Building game...');

  // Get game name from package.json if it exists
  let gameName = 'Game';
  const packageJsonPath = resolve('package.json');
  if (existsSync(packageJsonPath)) {
    try {
      const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf8'));
      gameName = packageJson.name || 'Game';
    } catch (e) {
      // Ignore errors reading package.json
    }
  }

  await buildGame(entryPoint, outputPath, gameName);

  console.log('\nBuild complete!');
  console.log(`Run "npm run server" and open http://localhost:8080/dist/index.html to view your game`);
}

main().catch(err => {
  console.error('Build failed:', err);
  process.exit(1);
});
