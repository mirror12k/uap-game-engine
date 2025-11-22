import { Game, Camera } from '../../src/index.js';
import { GameOfLife } from './GameOfLife.js';
import { OrbitingCamera } from './OrbitingCamera.js';

const canvas = document.getElementById('game');
const game = new Game(canvas);

// // Create and position camera to view the grid from above
// const camera = new Camera({
//   position: [0, 0, 15],  // Position camera above the grid
//   target: [0, 0, 0],      // Look at the center
//   fov: 45 * Math.PI / 180,
//   near: 0.1,
//   far: 100
// });

// Create orbiting camera with mouse controls
const camera = new OrbitingCamera({
  target: [0, 0.5, 0],
  orbitRadius: 15,
  orbitSpeed: 0.05,
  orbitHeight: 3,
  autoOrbit: true
});

game.setCamera(camera);

// Create Game of Life simulation
// 20x20 grid, cell size 0.5
const gameOfLife = new GameOfLife(100, 100, 0.1);
game.add(gameOfLife);

// Start the game
game.start();

// Log instructions to console
console.log('Conway\'s Game of Life');
console.log('=====================');
console.log('Watch the cells evolve according to these rules:');
console.log('1. Any live cell with 2-3 neighbors survives');
console.log('2. Any dead cell with exactly 3 neighbors becomes alive');
console.log('3. All other cells die or stay dead');
console.log('');
console.log('The grid wraps around at the edges (toroidal topology)');
