import { Entity, ShaderManager, mat4 } from '../../src/index.js';

export class GameOfLife3D extends Entity {
  constructor(options = {}) {
    super();
    this.gridWidth = options.gridWidth || 20;
    this.gridHeight = options.gridHeight || 20;
    this.gridDepth = options.gridDepth || 20;
    this.cellSize = options.cellSize || 0.5;

    // Configurable rules (defaults to 4556 rule set)
    this.survivalMin = options.survivalMin !== undefined ? options.survivalMin : 4;
    this.survivalMax = options.survivalMax !== undefined ? options.survivalMax : 5;
    this.birthMin = options.birthMin !== undefined ? options.birthMin : 5;
    this.birthMax = options.birthMax !== undefined ? options.birthMax : 6;

    // Initialize 3D grid with random state
    this.currentGrid = this.createEmptyGrid();
    this.nextGrid = this.createEmptyGrid();

    // Initialize with random pattern in the center
    const initialDensity = options.initialDensity || 0.15;
    this.initializeRandomPattern(initialDensity);

    this.updateInterval = options.updateInterval || 0.3;
    this.timeSinceUpdate = 0;

    this.model = mat4.create();
    this.aliveCount = 0;
  }

  createEmptyGrid() {
    const grid = [];
    for (let z = 0; z < this.gridDepth; z++) {
      grid[z] = [];
      for (let y = 0; y < this.gridHeight; y++) {
        grid[z][y] = [];
        for (let x = 0; x < this.gridWidth; x++) {
          grid[z][y][x] = false;
        }
      }
    }
    return grid;
  }

  initializeRandomPattern(density = 0.15) {
    // Initialize in the center region only to make it more interesting
    const centerX = Math.floor(this.gridWidth / 2);
    const centerY = Math.floor(this.gridHeight / 2);
    const centerZ = Math.floor(this.gridDepth / 2);
    const radius = Math.min(this.gridWidth, this.gridHeight, this.gridDepth) / 4;

    for (let z = 0; z < this.gridDepth; z++) {
      for (let y = 0; y < this.gridHeight; y++) {
        for (let x = 0; x < this.gridWidth; x++) {
          const dx = x - centerX;
          const dy = y - centerY;
          const dz = z - centerZ;
          const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);

          if (dist < radius) {
            this.currentGrid[z][y][x] = Math.random() < density;
          }
        }
      }
    }
  }

  initializeGlider3D() {
    // A 3D glider pattern (simplified)
    const cx = Math.floor(this.gridWidth / 2);
    const cy = Math.floor(this.gridHeight / 2);
    const cz = Math.floor(this.gridDepth / 2);

    // Simple 3D structure
    this.currentGrid[cz][cy][cx] = true;
    this.currentGrid[cz][cy][cx + 1] = true;
    this.currentGrid[cz][cy + 1][cx] = true;
    this.currentGrid[cz + 1][cy][cx] = true;
    this.currentGrid[cz + 1][cy + 1][cx + 1] = true;
  }

  countNeighbors(x, y, z) {
    let count = 0;

    // Check all 26 neighbors (3x3x3 cube minus center)
    for (let dz = -1; dz <= 1; dz++) {
      for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
          if (dx === 0 && dy === 0 && dz === 0) continue;

          const nx = x + dx;
          const ny = y + dy;
          const nz = z + dz;

          // Wrap around edges (toroidal topology)
          const wrappedX = (nx + this.gridWidth) % this.gridWidth;
          const wrappedY = (ny + this.gridHeight) % this.gridHeight;
          const wrappedZ = (nz + this.gridDepth) % this.gridDepth;

          if (this.currentGrid[wrappedZ][wrappedY][wrappedX]) {
            count++;
          }
        }
      }
    }

    return count;
  }

  updateGameState() {
    // Apply 3D Game of Life rules
    // Common 3D rules: 5766 (survival: 5-7, birth: 6)
    // Using more lenient rules: 4556 (survival: 4-5, birth: 5-6)

    for (let z = 0; z < this.gridDepth; z++) {
      for (let y = 0; y < this.gridHeight; y++) {
        for (let x = 0; x < this.gridWidth; x++) {
          const neighbors = this.countNeighbors(x, y, z);
          const isAlive = this.currentGrid[z][y][x];

          if (isAlive) {
            // Cell survives based on configured rules
            this.nextGrid[z][y][x] = neighbors >= this.survivalMin && neighbors <= this.survivalMax;
          } else {
            // Dead cell becomes alive based on configured rules
            this.nextGrid[z][y][x] = neighbors >= this.birthMin && neighbors <= this.birthMax;
          }
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

    // Create shader for rendering cubes
    this.shader = ShaderManager.getShader(gl, `
      attribute vec3 position;
      attribute vec3 normal;

      uniform mat4 model;
      uniform mat4 view;
      uniform mat4 projection;
      uniform vec3 cellPosition;
      uniform float cellSize;

      varying vec3 vNormal;
      varying vec3 vPosition;

      void main() {
        vec3 worldPos = position * cellSize + cellPosition;
        vPosition = worldPos;
        vNormal = normal;
        gl_Position = projection * view * model * vec4(worldPos, 1.0);
      }
    `, `
      precision mediump float;

      uniform vec3 color;
      uniform vec3 lightDir;

      varying vec3 vNormal;
      varying vec3 vPosition;

      void main() {
        // Simple directional lighting
        vec3 normal = normalize(vNormal);
        float diff = max(dot(normal, lightDir), 0.0);
        float ambient = 0.3;
        float intensity = ambient + diff * 0.7;

        vec3 finalColor = color * intensity;
        gl_FragColor = vec4(finalColor, 1.0);
      }
    `);

    // Create a cube mesh
    const s = 0.45; // Slightly smaller than cellSize to show gaps
    const cubeVertices = new Float32Array([
      // Front face
      -s, -s,  s,  0,  0,  1,
       s, -s,  s,  0,  0,  1,
       s,  s,  s,  0,  0,  1,
      -s,  s,  s,  0,  0,  1,

      // Back face
      -s, -s, -s,  0,  0, -1,
      -s,  s, -s,  0,  0, -1,
       s,  s, -s,  0,  0, -1,
       s, -s, -s,  0,  0, -1,

      // Top face
      -s,  s, -s,  0,  1,  0,
      -s,  s,  s,  0,  1,  0,
       s,  s,  s,  0,  1,  0,
       s,  s, -s,  0,  1,  0,

      // Bottom face
      -s, -s, -s,  0, -1,  0,
       s, -s, -s,  0, -1,  0,
       s, -s,  s,  0, -1,  0,
      -s, -s,  s,  0, -1,  0,

      // Right face
       s, -s, -s,  1,  0,  0,
       s,  s, -s,  1,  0,  0,
       s,  s,  s,  1,  0,  0,
       s, -s,  s,  1,  0,  0,

      // Left face
      -s, -s, -s, -1,  0,  0,
      -s, -s,  s, -1,  0,  0,
      -s,  s,  s, -1,  0,  0,
      -s,  s, -s, -1,  0,  0
    ]);

    const cubeIndices = new Uint16Array([
      0,  1,  2,    0,  2,  3,   // front
      4,  5,  6,    4,  6,  7,   // back
      8,  9,  10,   8,  10, 11,  // top
      12, 13, 14,   12, 14, 15,  // bottom
      16, 17, 18,   16, 18, 19,  // right
      20, 21, 22,   20, 22, 23   // left
    ]);

    this.vbo = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, this.vbo);
    gl.bufferData(gl.ARRAY_BUFFER, cubeVertices, gl.STATIC_DRAW);

    this.ibo = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.ibo);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, cubeIndices, gl.STATIC_DRAW);

    this.vertexCount = cubeIndices.length;

    // Enable depth testing
    gl.enable(gl.DEPTH_TEST);
    gl.depthFunc(gl.LESS);

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

    // Light direction
    this.shader.setUniform('lightDir', 0.5, 0.7, 0.3);

    // Bind buffers
    gl.bindBuffer(gl.ARRAY_BUFFER, this.vbo);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.ibo);

    const posAttr = this.shader.getAttribute('position');
    const normalAttr = this.shader.getAttribute('normal');

    gl.enableVertexAttribArray(posAttr);
    gl.vertexAttribPointer(posAttr, 3, gl.FLOAT, false, 24, 0);

    gl.enableVertexAttribArray(normalAttr);
    gl.vertexAttribPointer(normalAttr, 3, gl.FLOAT, false, 24, 12);

    // Calculate offset to center the grid
    const offsetX = -(this.gridWidth * this.cellSize) / 2;
    const offsetY = -(this.gridHeight * this.cellSize) / 2;
    const offsetZ = -(this.gridDepth * this.cellSize) / 2;

    // Draw each alive cell as a black cube
    this.shader.setUniform('color', 0.1, 0.1, 0.1); // Dark gray/black

    this.aliveCount = 0;
    for (let z = 0; z < this.gridDepth; z++) {
      for (let y = 0; y < this.gridHeight; y++) {
        for (let x = 0; x < this.gridWidth; x++) {
          if (this.currentGrid[z][y][x]) {
            this.aliveCount++;

            // Calculate cell position
            const cellX = offsetX + x * this.cellSize;
            const cellY = offsetY + y * this.cellSize;
            const cellZ = offsetZ + z * this.cellSize;

            this.shader.setUniform('cellPosition', cellX, cellY, cellZ);
            gl.drawElements(gl.TRIANGLES, this.vertexCount, gl.UNSIGNED_SHORT, 0);
          }
        }
      }
    }
  }
}
