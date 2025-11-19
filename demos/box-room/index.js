import { Game, Entity, Shader, Input, mat4, vec3 } from '../../src/index.js';

class BoxRoom extends Entity {
  init(game) {
    super.init(game);
    const gl = game.gl;

    this.input = new Input();

    this.shader = new Shader(gl, `
      attribute vec3 position;
      uniform mat4 model;
      uniform mat4 view;
      uniform mat4 projection;

      void main() {
        gl_Position = projection * view * model * vec4(position, 1.0);
      }
    `, `
      precision mediump float;

      void main() {
        gl_FragColor = vec4(0.0, 0.0, 0.0, 1.0);
      }
    `);

    const edges = [
      -2, -2, -2,  2, -2, -2,
      2, -2, -2,  2, -2, 2,
      2, -2, 2,  -2, -2, 2,
      -2, -2, 2,  -2, -2, -2,

      -2, 2, -2,  2, 2, -2,
      2, 2, -2,  2, 2, 2,
      2, 2, 2,  -2, 2, 2,
      -2, 2, 2,  -2, 2, -2,

      -2, -2, -2,  -2, 2, -2,
      2, -2, -2,  2, 2, -2,
      2, -2, 2,  2, 2, 2,
      -2, -2, 2,  -2, 2, 2
    ];

    this.vbo = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, this.vbo);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(edges), gl.STATIC_DRAW);

    this.vertexCount = edges.length / 3;

    this.cameraPos = vec3.fromValues(0, 0, 3);
    this.cameraFront = vec3.fromValues(0, 0, -1);
    this.cameraUp = vec3.fromValues(0, 1, 0);

    this.model = mat4.create();
    this.view = mat4.create();
    this.projection = mat4.create();

    gl.clearColor(0.8, 0.8, 0.8, 1.0);
  }

  update(delta) {
    const speed = 2.0 * delta;

    if (this.input.isKeyDown('forward')) {
      const front = vec3.create();
      vec3.scale(front, this.cameraFront, speed);
      vec3.add(this.cameraPos, this.cameraPos, front);
    }
    if (this.input.isKeyDown('backward')) {
      const front = vec3.create();
      vec3.scale(front, this.cameraFront, speed);
      vec3.subtract(this.cameraPos, this.cameraPos, front);
    }
    if (this.input.isKeyDown('left')) {
      const right = vec3.create();
      vec3.cross(right, this.cameraFront, this.cameraUp);
      vec3.normalize(right, right);
      vec3.scale(right, right, speed);
      vec3.subtract(this.cameraPos, this.cameraPos, right);
    }
    if (this.input.isKeyDown('right')) {
      const right = vec3.create();
      vec3.cross(right, this.cameraFront, this.cameraUp);
      vec3.normalize(right, right);
      vec3.scale(right, right, speed);
      vec3.add(this.cameraPos, this.cameraPos, right);
    }
  }

  render(gl) {
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    gl.enable(gl.DEPTH_TEST);

    this.shader.use();

    const target = vec3.create();
    vec3.add(target, this.cameraPos, this.cameraFront);
    mat4.lookAt(this.view, this.cameraPos, target, this.cameraUp);

    const aspect = gl.canvas.width / gl.canvas.height;
    mat4.perspective(this.projection, Math.PI / 4, aspect, 0.1, 100);

    this.shader.setUniformMatrix('model', this.model);
    this.shader.setUniformMatrix('view', this.view);
    this.shader.setUniformMatrix('projection', this.projection);

    gl.bindBuffer(gl.ARRAY_BUFFER, this.vbo);

    const posAttr = this.shader.getAttribute('position');
    gl.enableVertexAttribArray(posAttr);
    gl.vertexAttribPointer(posAttr, 3, gl.FLOAT, false, 0, 0);

    gl.drawArrays(gl.LINES, 0, this.vertexCount);
  }
}

const canvas = document.getElementById('game');
const game = new Game(canvas);
game.add(new BoxRoom());
game.start();
