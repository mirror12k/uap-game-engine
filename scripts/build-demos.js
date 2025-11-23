import { execSync } from 'child_process';
import { existsSync } from 'fs';

const demos = [
  {
    name: 'Spinning Triangle',
    entry: 'demos/spinning-triangle/index.js',
    output: 'dist/demo1-spinning-triangle.html'
  },
  {
    name: 'Mouse Triangle',
    entry: 'demos/mouse-triangle/index.js',
    output: 'dist/demo2-mouse-triangle.html'
  },
  {
    name: 'Box Room',
    entry: 'demos/box-room/index.js',
    output: 'dist/demo3-box-room.html'
  },
  {
    name: 'Block Game',
    entry: 'demos/block-game/index.js',
    output: 'dist/demo4-block-game.html'
  },
  {
    name: 'Game of Life',
    entry: 'demos/game-of-life/index.js',
    output: 'dist/demo5-game-of-life.html'
  },
  {
    name: 'Game of Life 3D',
    entry: 'demos/game-of-life-3d/index.js',
    output: 'dist/demo6-game-of-life-3d.html'
  },
  {
    name: 'Physics Demo',
    entry: 'demos/physics-demo/index.js',
    output: 'dist/demo7-physics-demo.html'
  },
  {
    name: 'Simplex Noise',
    entry: 'demos/simplex-noise/index.js',
    output: 'dist/demo8-simplex-noise.html'
  },
  {
    name: 'Fisheye Lens',
    entry: 'demos/fisheye-lense-demo/index.js',
    output: 'dist/demo9-fisheye-lense-demo.html'
  },
  {
    name: 'Metaballs',
    entry: 'demos/metaballs/index.js',
    output: 'dist/demo10-metaballs.html'
  },
  {
    name: 'Piano',
    entry: 'demos/piano/index.js',
    output: 'dist/demo11-piano.html'
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
