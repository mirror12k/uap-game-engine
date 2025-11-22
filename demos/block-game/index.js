import { Game } from '../../src/index.js';
import { BlockRenderer } from './Block.js';
import { OrbitingCamera } from './OrbitingCamera.js';

// Define the blocks in the scene
const blocks = [
  // Three grass blocks in a triangle formation
  {
    position: [-2, 0, 0],
    topTile: [0, 0],      // grass (uncolored)
    sideTile: [6, 2],     // grass edge (uncolored)
    bottomTile: [2, 0],   // dirt
    tint: [0.8, 0.8, 0.2] // green tint for grass
  },
  {
    position: [1, 0, 0],
    topTile: [0, 0],      // grass (uncolored)
    sideTile: [6, 2],     // grass edge (uncolored)
    bottomTile: [2, 0],   // dirt
    tint: [0.6, 0.8, 0.3] // green tint for grass
  },
  {
    position: [0, 0, -1],
    topTile: [0, 0],      // grass (uncolored)
    sideTile: [6, 2],     // grass edge (uncolored)
    bottomTile: [2, 0],   // dirt
    tint: [0.4, 0.8, 0.3] // green tint for grass
  },
  // Dirt block in the center
  {
    position: [0, 0, 0],
    topTile: [2, 0],      // dirt
    sideTile: [2, 0],     // dirt
    bottomTile: [2, 0],   // dirt
    tint: [1, 1, 1]       // no tint
  },
  // Grass block on top of the dirt block
  {
    position: [0, 1, 0],
    topTile: [0, 0],      // grass (uncolored)
    sideTile: [6, 2],     // grass edge (uncolored)
    bottomTile: [2, 0],   // dirt
    tint: [0.4, 0.8, 0.3] // green tint for grass
  }
];

const canvas = document.getElementById('game');
const game = new Game(canvas);

// Create orbiting camera with mouse controls
const camera = new OrbitingCamera({
  target: [0, 0.5, 0],
  orbitRadius: 6,
  orbitSpeed: 0.3,
  orbitHeight: 3,
  autoOrbit: true
});

// Create block renderer with texture (filename will be looked up in embedded assets)
const blockRenderer = new BlockRenderer('terrain.png', blocks);

game.setCamera(camera);
game.add(blockRenderer);
game.start();
