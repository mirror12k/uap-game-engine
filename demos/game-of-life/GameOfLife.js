import { Entity, ShaderManager, mat4 } from '../../src/index.js';

export class GameOfLife extends Entity {
  constructor(gridWidth = 20, gridHeight = 20, cellSize = 0.5) {
    super();
    this.gridWidth = gridWidth;
    this.gridHeight = gridHeight;
    this.cellSize = cellSize;

    // Initialize grid with random state
    this.currentGrid = this.createEmptyGrid();
    this.nextGrid = this.createEmptyGrid();

    // Initialize with random pattern
    this.initializeRandomPattern(0.3); // 30% chance of cell being alive

    this.updateInterval = 0.2; // Update every 200ms
    this.timeSinceUpdate = 0;

    this.model = mat4.create();
  }

  createEmptyGrid() {
    const grid = [];
    for (let y = 0; y < this.gridHeight; y++) {
      grid[y] = [];
      for (let x = 0; x < this.gridWidth; x++) {
        grid[y][x] = false;
      }
    }
    return grid;
  }

  initializeRandomPattern(density = 0.3) {
    for (let y = 0; y < this.gridHeight; y++) {
      for (let x = 0; x < this.gridWidth; x++) {
        this.currentGrid[y][x] = Math.random() < density;
      }
    }
  }

  initializeGlider() {
    // Classic glider pattern
    const startX = Math.floor(this.gridWidth / 4);
    const startY = Math.floor(this.gridHeight / 4);

    this.currentGrid[startY][startX + 1] = true;
    this.currentGrid[startY + 1][startX + 2] = true;
    this.currentGrid[startY + 2][startX] = true;
    this.currentGrid[startY + 2][startX + 1] = true;
    this.currentGrid[startY + 2][startX + 2] = true;
  }

  initializeBlinker() {
    // Simple blinker pattern
    const centerX = Math.floor(this.gridWidth / 2);
    const centerY = Math.floor(this.gridHeight / 2);

    this.currentGrid[centerY][centerX - 1] = true;
    this.currentGrid[centerY][centerX] = true;
    this.currentGrid[centerY][centerX + 1] = true;
  }

  countNeighbors(x, y) {
    let count = 0;
    for (let dy = -1; dy <= 1; dy++) {
      for (let dx = -1; dx <= 1; dx++) {
        if (dx === 0 && dy === 0) continue;

        const nx = x + dx;
        const ny = y + dy;

        // Wrap around edges (toroidal topology)
        const wrappedX = (nx + this.gridWidth) % this.gridWidth;
        const wrappedY = (ny + this.gridHeight) % this.gridHeight;

        if (this.currentGrid[wrappedY][wrappedX]) {
          count++;
        }
      }
    }
    return count;
  }

  updateGameState() {
    // Apply Conway's Game of Life rules
    for (let y = 0; y < this.gridHeight; y++) {
      for (let x = 0; x < this.gridWidth; x++) {
        const neighbors = this.countNeighbors(x, y);
        const isAlive = this.currentGrid[y][x];

        if (isAlive) {
          // Cell survives if it has 2 or 3 neighbors
          this.nextGrid[y][x] = neighbors === 2 || neighbors === 3;
        } else {
          // Dead cell becomes alive if it has exactly 3 neighbors
          this.nextGrid[y][x] = neighbors === 3;
        }
      }
    }

    // Swap grids
    const temp = this.currentGrid;
    this.currentGrid = this.nextGrid;
    this.nextGrid = temp;
  }

  init(game) {
    super.init(game);
    const gl = game.gl;

    // Create shader for rendering squares
    this.shader = ShaderManager.getShader(gl, `
      attribute vec2 position;

      uniform mat4 model;
      uniform mat4 view;
      uniform mat4 projection;
      uniform vec2 cellPosition;
      uniform float cellSize;

      void main() {
        vec2 worldPos = position * cellSize + cellPosition;
        gl_Position = projection * view * model * vec4(worldPos, 0.0, 1.0);
      }
    `, `
      precision mediump float;

      uniform vec3 color;

      void main() {
        gl_FragColor = vec4(color, 1.0);
      }
    `);

    // Create a simple quad (two triangles)
    const quadVertices = new Float32Array([
      -0.5, -0.5,
       0.5, -0.5,
       0.5,  0.5,
      -0.5,  0.5
    ]);

    const quadIndices = new Uint16Array([
      0, 1, 2,
      0, 2, 3
    ]);

    this.vbo = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, this.vbo);
    gl.bufferData(gl.ARRAY_BUFFER, quadVertices, gl.STATIC_DRAW);

    this.ibo = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.ibo);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, quadIndices, gl.STATIC_DRAW);

    // Set clear color to white
    gl.clearColor(1.0, 1.0, 1.0, 1.0);
  }

  update(delta) {
    this.timeSinceUpdate += delta;

    if (this.timeSinceUpdate >= this.updateInterval) {
      this.updateGameState();
      this.timeSinceUpdate = 0;
    }
  }

  render(gl) {
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    this.shader.use();

    mat4.identity(this.model);

    this.shader.setUniformMatrix('model', this.model);
    this.shader.setUniformMatrix('view', this.game.camera.getViewMatrix());
    this.shader.setUniformMatrix('projection', this.game.camera.getProjectionMatrix());
    this.shader.setUniform('cellSize', this.cellSize);

    // Bind buffers
    gl.bindBuffer(gl.ARRAY_BUFFER, this.vbo);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.ibo);

    const posAttr = this.shader.getAttribute('position');
    gl.enableVertexAttribArray(posAttr);
    gl.vertexAttribPointer(posAttr, 2, gl.FLOAT, false, 0, 0);

    // Calculate offset to center the grid
    const offsetX = -(this.gridWidth * this.cellSize) / 2;
    const offsetY = -(this.gridHeight * this.cellSize) / 2;

    // Draw each alive cell as black square
    this.shader.setUniform('color', 0.0, 0.0, 0.0); // Black

    for (let y = 0; y < this.gridHeight; y++) {
      for (let x = 0; x < this.gridWidth; x++) {
        if (this.currentGrid[y][x]) {
          // Calculate cell position
          const cellX = offsetX + x * this.cellSize;
          const cellY = offsetY + y * this.cellSize;

          this.shader.setUniform('cellPosition', cellX, cellY);
          gl.drawElements(gl.TRIANGLES, 6, gl.UNSIGNED_SHORT, 0);
        }
      }
    }
  }
}
