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

function parseArgs() {
  const args = process.argv.slice(2);
  const parsed = {};

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--entry' && i + 1 < args.length) {
      parsed.entry = args[++i];
    } else if (args[i] === '--output' && i + 1 < args.length) {
      parsed.output = args[++i];
    } else if (args[i] === '--name' && i + 1 < args.length) {
      parsed.name = args[++i];
    }
  }

  return parsed;
}

async function main() {
  const args = parseArgs();

  // Use CLI arguments or fall back to defaults
  const srcDir = 'src';
  const distDir = 'dist';
  const entryPoint = args.entry ? resolve(args.entry) : resolve(srcDir, 'index.js');
  const outputPath = args.output ? resolve(args.output) : resolve(distDir, 'index.html');

  // Ensure output directory exists
  const outputDir = outputPath.substring(0, outputPath.lastIndexOf('/'));
  if (!existsSync(outputDir)) {
    mkdirSync(outputDir, { recursive: true });
    console.log(`Created ${outputDir} directory`);
  }

  // Check if entry point exists
  if (!existsSync(entryPoint)) {
    console.error(`Error: ${entryPoint} not found`);
    if (!args.entry) {
      console.error('Please create a src/index.js file as the entry point for your game');
    }
    process.exit(1);
  }

  console.log('Building game...');

  // Get game name
  let gameName = args.name;
  if (!gameName) {
    // Try to get from package.json
    const packageJsonPath = resolve('package.json');
    if (existsSync(packageJsonPath)) {
      try {
        const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf8'));
        gameName = packageJson.name || 'Game';
      } catch (e) {
        gameName = 'Game';
      }
    } else {
      gameName = 'Game';
    }
  }

  await buildGame(entryPoint, outputPath, gameName);

  console.log('\nBuild complete!');
  if (!args.output) {
    console.log(`Run "npm run server" and open http://localhost:8080/dist/index.html to view your game`);
  }
}

main().catch(err => {
  console.error('Build failed:', err);
  process.exit(1);
});
