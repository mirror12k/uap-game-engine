import { Game, Entity, ShaderManager, mat4 } from '../../src/index.js';

class SpinningTriangle extends Entity {
  init(game) {
    super.init(game);
    const gl = game.gl;

    this.shader = ShaderManager.getShader(gl, `
      attribute vec3 position;
      attribute vec3 color;
      uniform mat4 model;
      uniform mat4 projection;
      varying vec3 vColor;

      void main() {
        vColor = color;
        gl_Position = projection * model * vec4(position, 1.0);
      }
    `, `
      precision mediump float;
      varying vec3 vColor;

      void main() {
        gl_FragColor = vec4(vColor, 1.0);
      }
    `);

    const vertices = new Float32Array([
      0.0, 0.5, 0.0,  1.0, 0.0, 0.0,
      -0.5, -0.5, 0.0,  0.0, 1.0, 0.0,
      0.5, -0.5, 0.0,  0.0, 0.0, 1.0
    ]);

    this.vbo = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, this.vbo);
    gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);

    this.rotation = 0;
    this.model = mat4.create();
    this.projection = mat4.create();
  }

  update(delta) {
    this.rotation += delta;
  }

  render(gl) {
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    this.shader.use();

    mat4.identity(this.model);
    mat4.rotateZ(this.model, this.model, this.rotation);

    mat4.identity(this.projection);

    this.shader.setUniformMatrix('model', this.model);
    this.shader.setUniformMatrix('projection', this.projection);

    gl.bindBuffer(gl.ARRAY_BUFFER, this.vbo);

    const posAttr = this.shader.getAttribute('position');
    gl.enableVertexAttribArray(posAttr);
    gl.vertexAttribPointer(posAttr, 3, gl.FLOAT, false, 24, 0);

    const colorAttr = this.shader.getAttribute('color');
    gl.enableVertexAttribArray(colorAttr);
    gl.vertexAttribPointer(colorAttr, 3, gl.FLOAT, false, 24, 12);

    gl.drawArrays(gl.TRIANGLES, 0, 3);
  }
}

const canvas = document.getElementById('game');
const game = new Game(canvas);
game.add(new SpinningTriangle());
game.start();
