import { execSync } from 'child_process';
import { existsSync } from 'fs';

const demos = [
  {
    name: 'Spinning Triangle',
    entry: 'demos/spinning-triangle/index.js',
    output: 'dist/demo1.html'
  },
  {
    name: 'Mouse Triangle',
    entry: 'demos/mouse-triangle/index.js',
    output: 'dist/demo2.html'
  },
  {
    name: 'Box Room',
    entry: 'demos/box-room/index.js',
    output: 'dist/demo3.html'
  },
  {
    name: 'Block Game',
    entry: 'demos/block-game/index.js',
    output: 'dist/demo4.html'
  },
  {
    name: 'Game of Life',
    entry: 'demos/game-of-life/index.js',
    output: 'dist/demo5.html'
  },
  {
    name: 'Game of Life 3D',
    entry: 'demos/game-of-life-3d/index.js',
    output: 'dist/demo6.html'
  },
  {
    name: 'Physics Demo',
    entry: 'demos/physics-demo/index.js',
    output: 'dist/demo7.html'
  },
  {
    name: 'Simplex Noise',
    entry: 'demos/simplex-noise/index.js',
    output: 'dist/demo8.html'
  }
];

console.log('\n=== Building Demos ===\n');

for (const demo of demos) {
  if (!existsSync(demo.entry)) {
    console.log(`Skipping ${demo.name} - ${demo.entry} not found`);
    continue;
  }

  try {
    execSync(
      `node bin/uap-build.js --entry ${demo.entry} --output ${demo.output} --name "${demo.name}"`,
      { stdio: 'inherit' }
    );
  } catch (err) {
    console.error(`Failed to build ${demo.name}`);
    process.exit(1);
  }
}

console.log('\n=== All demos built successfully ===\n');
