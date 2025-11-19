import { Game, Entity, Shader, Input, mat4 } from '../../src/index.js';

class MouseTriangle extends Entity {
  init(game) {
    super.init(game);
    const gl = game.gl;

    this.input = new Input();

    this.shader = new Shader(gl, `
      attribute vec3 position;
      uniform mat4 model;
      uniform mat4 projection;
      uniform vec2 mousePos;
      varying vec3 vColor;

      void main() {
        gl_Position = projection * model * vec4(position, 1.0);

        // Calculate distance from mouse in screen space
        vec2 screenPos = (gl_Position.xy / gl_Position.w + 1.0) * 0.5;
        float dist = distance(screenPos, mousePos);

        // Create heatmap colors based on distance
        float t = clamp(dist * 2.0, 0.0, 1.0);
        float r = t;
        float g = 1.0 - t;
        float b = sin(t * 3.14159);

        vColor = vec3(r, g, b);
      }
    `, `
      precision mediump float;
      varying vec3 vColor;

      void main() {
        gl_FragColor = vec4(vColor, 1.0);
      }
    `);

    const vertices = new Float32Array([
      0.0, 0.5, 0.0,
      -0.5, -0.5, 0.0,
      0.5, -0.5, 0.0
    ]);

    this.vbo = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, this.vbo);
    gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);

    this.model = mat4.create();
    this.projection = mat4.create();
  }

  update(delta) {
    const mouse = this.input.getMousePosition();
    // Convert mouse position to normalized device coordinates (0 to 1)
    this.mouseNDC = {
      x: mouse.x / this.game.canvas.width,
      y: 1.0 - (mouse.y / this.game.canvas.height) // Flip Y axis for WebGL
    };
  }

  render(gl) {
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    this.shader.use();

    // Pass mouse position to vertex shader
    this.shader.setUniform('mousePos', this.mouseNDC.x, this.mouseNDC.y);
    this.shader.setUniformMatrix('model', this.model);
    this.shader.setUniformMatrix('projection', this.projection);

    gl.bindBuffer(gl.ARRAY_BUFFER, this.vbo);

    const posAttr = this.shader.getAttribute('position');
    gl.enableVertexAttribArray(posAttr);
    gl.vertexAttribPointer(posAttr, 3, gl.FLOAT, false, 0, 0);

    gl.drawArrays(gl.TRIANGLES, 0, 3);
  }
}

const canvas = document.getElementById('game');
const game = new Game(canvas);
game.add(new MouseTriangle());
game.start();
