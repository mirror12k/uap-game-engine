# Conway's Game of Life Demo

A demonstration of Conway's Game of Life implemented using the UAP Game Engine.

## Overview

This demo implements the classic cellular automaton devised by mathematician John Conway. The simulation runs on a 20x20 grid with toroidal topology (edges wrap around).

## Game Rules

1. **Survival**: Any live cell with 2 or 3 live neighbors survives to the next generation
2. **Birth**: Any dead cell with exactly 3 live neighbors becomes alive
3. **Death**: All other cells die or remain dead

## Implementation Details

### Architecture

- **GameOfLife Entity**: Manages the 2D grid state and handles both game logic and rendering
- **Camera Entity**: Positioned to view the grid from above
- **Grid System**: 20x20 cells with 0.5 unit cell size

### Features

- Random initialization with 30% cell density
- Automatic updates every 200ms
- Toroidal grid topology (edges wrap around)
- Visual grid lines for better visibility
- Clean black-on-white rendering

### Technical Highlights

- Uses `ShaderManager` for efficient shader caching
- Double-buffered grid updates for clean state transitions
- Instanced rendering approach for drawing individual cells
- Orthographic-like view with perspective camera

## Files

- `index.js` - Demo entry point and game setup
- `GameOfLife.js` - Main controller entity implementing game logic and rendering
- `README.md` - This file

## Building

```bash
npm run build
```

The demo will be built to `dist/demo5.html`.

## Patterns

The demo currently initializes with a random pattern. You can modify the initialization in `GameOfLife.js` to use classic patterns:

- `initializeGlider()` - Creates a glider pattern
- `initializeBlinker()` - Creates a simple oscillator
- `initializeRandomPattern(density)` - Random initialization with specified density

## Future Enhancements

Potential improvements:
- Interactive cell toggling with mouse clicks
- Pause/resume controls
- Speed adjustment
- Pattern presets selection
- Grid size configuration
- Color customization
