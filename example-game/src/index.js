import { Game, Entity, Shader, mat4 } from 'uap-game-engine';

class ColorfulSquare extends Entity {
  init(game) {
    super.init(game);
    const gl = game.gl;

    this.shader = new Shader(gl, `
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
      -0.5, 0.5, 0.0,  1.0, 0.0, 0.0,
      -0.5, -0.5, 0.0,  0.0, 1.0, 0.0,
      0.5, -0.5, 0.0,  0.0, 0.0, 1.0,
      0.5, 0.5, 0.0,  1.0, 1.0, 0.0
    ]);

    const indices = new Uint16Array([
      0, 1, 2,
      0, 2, 3
    ]);

    this.vbo = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, this.vbo);
    gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);

    this.ibo = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.ibo);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indices, gl.STATIC_DRAW);

    this.rotation = 0;
    this.scale = 1.0;
    this.scaleDirection = 1;
    this.model = mat4.create();
    this.projection = mat4.create();
  }

  update(delta) {
    this.rotation += delta * 0.5;

    this.scale += delta * this.scaleDirection * 0.3;
    if (this.scale > 1.2) {
      this.scale = 1.2;
      this.scaleDirection = -1;
    } else if (this.scale < 0.8) {
      this.scale = 0.8;
      this.scaleDirection = 1;
    }
  }

  render(gl) {
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    this.shader.use();

    mat4.identity(this.model);
    mat4.rotateZ(this.model, this.model, this.rotation);
    mat4.scale(this.model, this.model, [this.scale, this.scale, 1.0]);

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

    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.ibo);
    gl.drawElements(gl.TRIANGLES, 6, gl.UNSIGNED_SHORT, 0);
  }
}

const canvas = document.getElementById('game');
const game = new Game(canvas);
game.add(new ColorfulSquare());
game.start();
