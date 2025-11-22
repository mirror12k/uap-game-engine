# 3D Conway's Game of Life Demo

A demonstration of Conway's Game of Life extended to three dimensions using the UAP Game Engine.

## Overview

This demo implements a 3D version of the classic cellular automaton. The simulation runs on a 20x20x20 grid with 3D toroidal topology (all edges wrap around).

## 3D Game Rules

Unlike the 2D version where each cell has 8 neighbors, in 3D each cell has **26 neighbors** (3×3×3 cube minus the center cell).

### Rules Used (4556 Rule Set)

1. **Survival**: An alive cell with 4-5 neighbors survives to the next generation
2. **Birth**: A dead cell with 5-6 neighbors becomes alive
3. **Death**: All other cells die or remain dead

These rules are balanced for the 26-neighbor topology of 3D space.

## Implementation Details

### Architecture

- **GameOfLife3D Entity**: Manages the 3D grid state and handles both game logic and rendering
- **Camera**: Auto-rotates around the grid for a dynamic view
- **3D Grid System**: 20×20×20 cells with 0.5 unit cell size

### Features

- 3D cellular automaton with proper neighbor counting (26 neighbors)
- Individual cube rendering for each alive cell
- Directional lighting for depth perception
- Automatic camera rotation around the grid
- Toroidal 3D grid topology (wraps on all axes)
- Random initialization in center sphere
- Visual gaps between cubes for clarity

### Technical Highlights

- Uses `ShaderManager` for efficient shader caching
- Triple-nested grid for 3D state management
- Double-buffered updates for clean state transitions
- Instanced cube rendering with lighting
- Depth testing for correct 3D occlusion
- Normal vectors for realistic shading

### Rendering

Each alive cell is rendered as a **separate black cube** with:
- Proper 3D positioning
- Surface normals for lighting
- Directional light source
- Ambient + diffuse shading
- Slight gaps (0.45 vs 0.5 cell size) for visual separation

## Files

- `index.js` - Demo entry point with camera setup
- `GameOfLife3D.js` - Main controller entity implementing 3D game logic and rendering
- `README.md` - This file

## Building

```bash
npm run build
```

The demo will be built to `dist/demo6.html`.

## Performance Considerations

### Grid Size: 20×20×20 = 8,000 cells

- With 15% initial density: ~1,200 alive cells
- Each cell is a separate draw call (36 vertices, 12 triangles)
- Update rate: 300ms (slower than 2D due to complexity)
- Neighbor checks: 26 neighbors × 8,000 cells = 208,000 checks per update

### Optimization Strategies

The demo uses several optimizations:
1. **Only renders alive cells** - Dead cells are not drawn
2. **Shader caching** - Uses ShaderManager to avoid recompilation
3. **Slower update rate** - 300ms instead of 200ms
4. **Efficient neighbor counting** - Single pass with toroidal wrapping

## 3D vs 2D Differences

| Aspect | 2D (8 neighbors) | 3D (26 neighbors) |
|--------|------------------|-------------------|
| **Classic Rules** | 23/3 (Conway) | Various (5766, 4555, 4556, etc.) |
| **This Demo** | 23/3 | 4556 (survival: 4-5, birth: 5-6) |
| **Complexity** | O(n²) | O(n³) |
| **Behavior** | Well-studied | More chaotic, less stable |
| **Rendering** | 2D quads | 3D cubes with lighting |

## Alternative Rule Sets for 3D

Common 3D CA rules you can try (edit `GameOfLife3D.js`):

- **5766**: Survival 5-7, Birth 6 (more stable)
- **4555**: Survival 4-5, Birth 5 (current)
- **5678/6**: Survival 5-6-7-8, Birth 6 (crystal-like growth)
- **445/4**: Survival 4, Birth 4-5 (organic structures)

To change rules, modify the `updateGameState()` method in `GameOfLife3D.js`.

## Mathematical Background

### 3D Moore Neighborhood

In 3D, the Moore neighborhood includes all 26 cells in a 3×3×3 cube:
- 8 corner neighbors
- 12 edge neighbors
- 6 face neighbors

### Toroidal Topology

The grid wraps around on all three axes:
```javascript
wrappedX = (x + width) % width
wrappedY = (y + height) % height
wrappedZ = (z + depth) % depth
```

This creates a finite but boundless 3D space (topologically a 3-torus).

## Camera Controls

The camera automatically rotates around the grid:
- **Orbit radius**: 20 units
- **Rotation speed**: 0.3 radians/second
- **Height variation**: Sinusoidal (10-20 units)
- **Target**: Grid center (0, 0, 0)

## Future Enhancements

Potential improvements:
- Interactive camera controls (mouse drag to rotate)
- Adjustable grid size
- Rule set selection UI
- Different initialization patterns (3D gliders, pulsars)
- Color coding by cell age
- Ghosting/trails for motion visualization
- Performance profiling and optimization
- Pattern library (known 3D structures)

## Interesting Observations

3D cellular automata often exhibit:
- **Less stability** than 2D - patterns die out or explode more easily
- **Complex emergent structures** - 3D allows more intricate patterns
- **Slower convergence** - Takes longer to reach stable state
- **Higher chaos** - Small changes can have dramatic effects

The 4556 rule set used here provides a good balance between stability and interesting behavior.

## References

- Original 2D Conway's Game of Life (1970)
- 3D Cellular Automata research
- Various 3D CA rule sets and their properties
- Toroidal topology in discrete mathematics

## Credits

Implemented using the UAP Game Engine with WebGL rendering.
