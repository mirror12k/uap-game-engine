import { Game } from '../../src/index.js';
import { GameOfLife3D } from './GameOfLife3D.js';
import { OrbitingCamera } from './OrbitingCamera.js';
import { TextOverlay } from './TextOverlay.js';

const canvas = document.getElementById('game');
const game = new Game(canvas);

// Create orbiting camera with mouse controls
const camera = new OrbitingCamera({
  target: [0, 0, 0],
  orbitRadius: 20,
  orbitSpeed: 0.05,
  orbitHeight: 0,
  autoOrbit: true
});

game.setCamera(camera);

// Create 3D Game of Life simulation with configurable rules
// Using 4556 rule set: survival 4-5, birth 5-6
const gameOfLife3D = new GameOfLife3D({
  gridWidth: 20,
  gridHeight: 20,
  gridDepth: 20,
  cellSize: 0.5,
  survivalMin: 2,
  survivalMax: 5,
  birthMin: 5,
  birthMax: 5,
  initialDensity: 0.5,
  updateInterval: 0.3
});

game.add(gameOfLife3D);

// Add text overlay to display cell count
const textOverlay = new TextOverlay(gameOfLife3D);
game.add(textOverlay);

// Start the game
game.start();

// Log instructions to console
console.log('3D Conway\'s Game of Life');
console.log('========================');
console.log('Rules: 2555');
console.log('Grid size: 20x20x20');
console.log('Controls: Drag to rotate camera, auto-orbit enabled');
console.log('Cell count displayed at top-left');
