import { Game, Entity, ShaderManager, Input, mat4 } from '../../src/index.js';
import Matter from 'matter-js';

class PhysicsDemo extends Entity {
  init(game) {
    super.init(game);
    const gl = game.gl;

    this.input = new Input();
    this.canvas = game.canvas;

    // Initialize Matter.js engine
    this.engine = Matter.Engine.create();
    this.world = this.engine.world;

    // Configure gravity
    this.engine.gravity.y = 1;

    // Track mouse dragging
    this.isDragging = false;
    this.dragStartX = 0;
    this.dragStartY = 0;
    this.dragCurrentX = 0;
    this.dragCurrentY = 0;

    // Create boundary walls
    const wallThickness = 4;
    const wallOptions = { isStatic: true, restitution: 0.5, friction: 0.5 };

    const leftWall = Matter.Bodies.rectangle(wallThickness / 2, this.canvas.height / 2, wallThickness, this.canvas.height, wallOptions);
    leftWall.width = wallThickness;
    leftWall.height = this.canvas.height;

    const rightWall = Matter.Bodies.rectangle(this.canvas.width - wallThickness / 2, this.canvas.height / 2, wallThickness, this.canvas.height, wallOptions);
    rightWall.width = wallThickness;
    rightWall.height = this.canvas.height;

    const topWall = Matter.Bodies.rectangle(this.canvas.width / 2, wallThickness / 2, this.canvas.width, wallThickness, wallOptions);
    topWall.width = this.canvas.width;
    topWall.height = wallThickness;

    const bottomWall = Matter.Bodies.rectangle(this.canvas.width / 2, this.canvas.height - wallThickness / 2, this.canvas.width, wallThickness, wallOptions);
    bottomWall.width = this.canvas.width;
    bottomWall.height = wallThickness;

    this.walls = [leftWall, rightWall, topWall, bottomWall];

    Matter.World.add(this.world, this.walls);

    // Create shader for rendering rectangles
    this.shader = ShaderManager.getShader(gl, `
      attribute vec2 position;
      uniform mat4 projection;
      uniform mat4 model;

      void main() {
        gl_Position = projection * model * vec4(position, 0.0, 1.0);
      }
    `, `
      precision mediump float;
      uniform vec3 color;

      void main() {
        gl_FragColor = vec4(color, 1.0);
      }
    `);

    // Create a unit quad buffer (will be scaled and translated per box)
    const vertices = new Float32Array([
      -0.5, -0.5,
      0.5, -0.5,
      0.5, 0.5,
      -0.5, -0.5,
      0.5, 0.5,
      -0.5, 0.5
    ]);

    this.vbo = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, this.vbo);
    gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);

    // Create orthographic projection matrix
    this.projection = mat4.create();
    mat4.ortho(this.projection, 0, this.canvas.width, this.canvas.height, 0, -1, 1);

    this.model = mat4.create();

    // Add some initial boxes
    this.addBox(200, 100, 80, 80, [0.2, 0.6, 1.0]);
    this.addBox(400, 150, 100, 60, [1.0, 0.5, 0.2]);
    this.addBox(300, 50, 60, 60, [0.5, 1.0, 0.3]);
  }

  addBox(x, y, width, height, color) {
    const body = Matter.Bodies.rectangle(
      x + width / 2,
      y + height / 2,
      width,
      height,
      {
        restitution: 0.5,
        friction: 0.5,
        density: 0.001
      }
    );
    body.color = color;
    body.width = width;
    body.height = height;
    Matter.World.add(this.world, body);
  }

  update(delta) {
    const mouse = this.input.getMousePosition();
    const isMouseDown = this.input.isMouseButtonDown(0);

    // Handle mouse drag for creating boxes
    if (isMouseDown && !this.isDragging) {
      // Start dragging
      this.isDragging = true;
      this.dragStartX = mouse.x;
      this.dragStartY = mouse.y;
      this.dragCurrentX = mouse.x;
      this.dragCurrentY = mouse.y;
    } else if (isMouseDown && this.isDragging) {
      // Update drag position
      this.dragCurrentX = mouse.x;
      this.dragCurrentY = mouse.y;
    } else if (!isMouseDown && this.isDragging) {
      // End dragging - create a box
      this.isDragging = false;

      const x = Math.min(this.dragStartX, this.dragCurrentX);
      const y = Math.min(this.dragStartY, this.dragCurrentY);
      const width = Math.abs(this.dragCurrentX - this.dragStartX);
      const height = Math.abs(this.dragCurrentY - this.dragStartY);

      // Only create box if it has reasonable size
      if (width > 10 && height > 10) {
        // Random color
        const color = [
          Math.random() * 0.5 + 0.5,
          Math.random() * 0.5 + 0.5,
          Math.random() * 0.5 + 0.5
        ];
        this.addBox(x, y, width, height, color);
      }
    }

    // Update Matter.js physics
    // Convert delta from seconds to milliseconds
    Matter.Engine.update(this.engine, delta * 1000);
  }

  render(gl) {
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    gl.clearColor(0.1, 0.1, 0.15, 1.0);

    this.shader.use();
    this.shader.setUniformMatrix('projection', this.projection);

    gl.bindBuffer(gl.ARRAY_BUFFER, this.vbo);

    const posAttr = this.shader.getAttribute('position');
    gl.enableVertexAttribArray(posAttr);
    gl.vertexAttribPointer(posAttr, 2, gl.FLOAT, false, 0, 0);

    // Render all physics bodies (except walls)
    for (const body of this.world.bodies) {
      if (body.isStatic) continue; // Skip walls

      const color = body.color || [0.8, 0.8, 0.8];

      // Create model matrix with position, rotation, and scale
      mat4.identity(this.model);
      mat4.translate(this.model, this.model, [body.position.x, body.position.y, 0]);
      mat4.rotateZ(this.model, this.model, body.angle);
      mat4.scale(this.model, this.model, [body.width, body.height, 1]);

      this.shader.setUniformMatrix('model', this.model);
      this.shader.setUniform('color', color[0], color[1], color[2]);
      gl.drawArrays(gl.TRIANGLES, 0, 6);
    }

    // Render drag preview if dragging
    if (this.isDragging) {
      const x = Math.min(this.dragStartX, this.dragCurrentX);
      const y = Math.min(this.dragStartY, this.dragCurrentY);
      const width = Math.abs(this.dragCurrentX - this.dragStartX);
      const height = Math.abs(this.dragCurrentY - this.dragStartY);

      mat4.identity(this.model);
      mat4.translate(this.model, this.model, [x + width / 2, y + height / 2, 0]);
      mat4.scale(this.model, this.model, [width, height, 1]);

      this.shader.setUniformMatrix('model', this.model);
      this.shader.setUniform('color', 0.8, 0.8, 0.8);

      // Enable blending for semi-transparent preview
      gl.enable(gl.BLEND);
      gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

      gl.drawArrays(gl.TRIANGLES, 0, 6);

      gl.disable(gl.BLEND);
    }

    // Draw boundary walls (visual indication)
    this.drawBoundaries(gl);
  }

  drawBoundaries(gl) {
    const wallColor = [0.3, 0.3, 0.4];

    for (const wall of this.walls) {
      mat4.identity(this.model);
      mat4.translate(this.model, this.model, [wall.position.x, wall.position.y, 0]);
      mat4.scale(this.model, this.model, [wall.width, wall.height, 1]);

      this.shader.setUniformMatrix('model', this.model);
      this.shader.setUniform('color', wallColor[0], wallColor[1], wallColor[2]);
      gl.drawArrays(gl.TRIANGLES, 0, 6);
    }
  }
}

const canvas = document.getElementById('game');
const game = new Game(canvas);
game.add(new PhysicsDemo());
game.start();
