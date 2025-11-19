import esbuild from 'esbuild';
import { execSync } from 'child_process';
import { existsSync } from 'fs';

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
  console.log('=== Building UAP Game Engine ===\n');

  await buildLibrary();

  if (existsSync('demos')) {
    execSync('node scripts/build-demos.js', { stdio: 'inherit' });
  }
}

main().catch(console.error);
