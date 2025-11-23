#!/usr/bin/env node
import esbuild from 'esbuild';
import { writeFileSync, mkdirSync, existsSync, readFileSync, readdirSync, statSync } from 'fs';
import { resolve, dirname, basename, extname, join } from 'path';
import { fileURLToPath } from 'url';
import { spawn } from 'child_process';

function findTestFiles(dir, testFiles = []) {
  if (!existsSync(dir)) return testFiles;

  const files = readdirSync(dir);
  for (const file of files) {
    const filePath = join(dir, file);
    const stat = statSync(filePath);

    if (stat.isDirectory()) {
      // Recursively search subdirectories
      findTestFiles(filePath, testFiles);
    } else if (file.endsWith('.test.js')) {
      testFiles.push(filePath);
    }
  }

  return testFiles;
}

async function runTests(srcDir) {
  const testFiles = findTestFiles(srcDir);

  if (testFiles.length === 0) {
    console.log('No test files found.\n');
    return true; // No tests is not a failure
  }

  console.log('=== Running Tests ===\n');

  console.log(`Found ${testFiles.length} test file(s):\n`);
  testFiles.forEach(file => console.log(`  - ${file}`));
  console.log();

  let allTestsPassed = true;

  // Run each test file
  for (const testFile of testFiles) {
    console.log(`\n=== Running ${testFile} ===\n`);

    const absolutePath = resolve(testFile);

    // Use dynamic import to run the test file
    try {
      const testPackage = await import(absolutePath);
      await testPackage.runner.run();

    } catch (error) {
      console.error(`Error running ${testFile}:`, error);
      allTestsPassed = false;
      break; // Stop on first failure
    }
  }

  if (!allTestsPassed) {
    console.error('\n❌ Tests failed! Aborting build.\n');
    return false;
  }

  console.log('\n✓ All tests passed!\n');
  return true;
}

function findAssets(entryPoint) {
  const dir = dirname(entryPoint);
  const assets = {};

  if (!existsSync(dir)) return assets;

  const files = readdirSync(dir);
  for (const file of files) {
    const ext = extname(file).toLowerCase();
    if (ext === '.png' || ext === '.jpg' || ext === '.jpeg' || ext === '.gif') {
      const filePath = resolve(dir, file);
      const data = readFileSync(filePath);
      const base64 = data.toString('base64');
      const mimeType = ext === '.png' ? 'image/png' :
                       ext === '.jpg' || ext === '.jpeg' ? 'image/jpeg' :
                       'image/gif';
      assets[file] = `data:${mimeType};base64,${base64}`;
    }
  }

  return assets;
}

async function buildGame(entryPoint, outputPath, gameName) {
  const result = await esbuild.build({
    entryPoints: [entryPoint],
    bundle: true,
    minify: true,
    format: 'iife',
    write: false,
    external: [],
    // Exclude test files from the build
    plugins: [{
      name: 'exclude-tests',
      setup(build) {
        build.onResolve({ filter: /\.test\.js$/ }, args => {
          return { path: args.path, external: true };
        });
      }
    }]
  });

  const js = result.outputFiles[0].text;

  // Find and embed assets
  const assets = findAssets(entryPoint);
  const assetScript = Object.keys(assets).length > 0
    ? `<script>window.GAME_ASSETS = ${JSON.stringify(assets)};</script>`
    : '';

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
  ${assetScript}
  <script>${js}</script>
</body>
</html>`;

  writeFileSync(outputPath, html);
  console.log(`Built game -> ${outputPath}`);
  if (Object.keys(assets).length > 0) {
    console.log(`Embedded ${Object.keys(assets).length} asset(s): ${Object.keys(assets).join(', ')}`);
  }
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
    } else if (args[i] === '--test-only') {
      parsed.testOnly = true;
    }
  }

  return parsed;
}

async function main() {
  const args = parseArgs();

  // Run tests before building
  const srcDir = args.entry ? dirname(resolve(args.entry)) : 'src';
  const testsPassed = await runTests(srcDir);

  if (!testsPassed) {
    process.exit(1);
  } else if (args.testOnly) {
    // If --test-only flag is provided, run tests only (no build)
    process.exit(0);
  }

  // Use CLI arguments or fall back to defaults
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
