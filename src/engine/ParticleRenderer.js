import { Entity } from './Entity.js';
import { ShaderManager } from './Shader.js';
import { mat4 } from './Vector.js';

export class ParticleRenderer extends Entity {
  constructor(emitters, customShader = null) {
    super();
    this.emitters = Array.isArray(emitters) ? emitters : [emitters];
    this.customShader = customShader;
    this.model = mat4.create();
  }

  init(game) {
    super.init(game);
    const gl = game.gl;

    if (this.customShader) {
      this.shader = this.customShader;
    } else {
      this.shader = ShaderManager.getShader(gl, `
        attribute vec3 position;
        attribute vec2 uv;

        uniform mat4 model;
        uniform mat4 view;
        uniform mat4 projection;
        uniform vec3 cameraRight;
        uniform vec3 cameraUp;
        uniform vec3 particlePosition;
        uniform float particleSize;

        varying vec2 vUv;

        void main() {
          vec3 worldPos = particlePosition
            + cameraRight * position.x * particleSize
            + cameraUp * position.y * particleSize;
          gl_Position = projection * view * vec4(worldPos, 1.0);
          vUv = uv;
        }
      `, `
        precision mediump float;

        uniform vec4 color;

        varying vec2 vUv;

        void main() {
          gl_FragColor = color;
        }
      `);
    }

    const quadVertices = new Float32Array([
      -0.5, -0.5, 0.0,  0.0, 0.0,
       0.5, -0.5, 0.0,  1.0, 0.0,
       0.5,  0.5, 0.0,  1.0, 1.0,
      -0.5,  0.5, 0.0,  0.0, 1.0
    ]);

    const quadIndices = new Uint16Array([
      0, 2, 1,
      0, 3, 2
    ]);

    this.vbo = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, this.vbo);
    gl.bufferData(gl.ARRAY_BUFFER, quadVertices, gl.STATIC_DRAW);

    this.ibo = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.ibo);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, quadIndices, gl.STATIC_DRAW);
  }

  render(gl) {
    const now = performance.now() / 1000.0;
    if (!this.lastTime) {
      this.lastTime = now;
    }
    const delta = now - this.lastTime;
    this.lastTime = now;

    for (const emitter of this.emitters) {
      const particles = emitter.getParticles();
      for (const particle of particles) {
        particle.update(delta);
      }
      emitter.particles = particles.filter(p => !p.isDead());
    }

    const allParticles = [];
    for (const emitter of this.emitters) {
      allParticles.push(...emitter.getParticles());
    }

    if (allParticles.length === 0) return;

    const view = this.game.camera.getViewMatrix();
    const projection = this.game.camera.getProjectionMatrix();

    const viewInverse = mat4.create();
    mat4.invert(viewInverse, view);

    const cameraRight = [viewInverse[0], viewInverse[1], viewInverse[2]];
    const cameraUp = [viewInverse[4], viewInverse[5], viewInverse[6]];

    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
    gl.depthMask(false);

    this.shader.use();
    this.shader.setUniformMatrix('view', view);
    this.shader.setUniformMatrix('projection', projection);
    mat4.identity(this.model);
    this.shader.setUniformMatrix('model', this.model);

    const cameraRightLoc = gl.getUniformLocation(this.shader.program, 'cameraRight');
    if (cameraRightLoc) {
      gl.uniform3fv(cameraRightLoc, new Float32Array(cameraRight));
    }

    const cameraUpLoc = gl.getUniformLocation(this.shader.program, 'cameraUp');
    if (cameraUpLoc) {
      gl.uniform3fv(cameraUpLoc, new Float32Array(cameraUp));
    }

    gl.bindBuffer(gl.ARRAY_BUFFER, this.vbo);

    const stride = 5 * 4;

    const positionAttr = this.shader.getAttribute('position');
    gl.enableVertexAttribArray(positionAttr);
    gl.vertexAttribPointer(positionAttr, 3, gl.FLOAT, false, stride, 0);

    const uvAttr = this.shader.getAttribute('uv');
    gl.enableVertexAttribArray(uvAttr);
    gl.vertexAttribPointer(uvAttr, 2, gl.FLOAT, false, stride, 3 * 4);

    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.ibo);

    for (const particle of allParticles) {
      const particlePositionLoc = gl.getUniformLocation(this.shader.program, 'particlePosition');
      if (particlePositionLoc) {
        gl.uniform3fv(particlePositionLoc, new Float32Array(particle.position));
      }

      const particleSizeLoc = gl.getUniformLocation(this.shader.program, 'particleSize');
      if (particleSizeLoc) {
        gl.uniform1f(particleSizeLoc, particle.size);
      }

      const color = particle.getCurrentColor();
      const colorLoc = gl.getUniformLocation(this.shader.program, 'color');
      if (colorLoc) {
        gl.uniform4fv(colorLoc, new Float32Array(color));
      }

      gl.drawElements(gl.TRIANGLES, 6, gl.UNSIGNED_SHORT, 0);
    }

    gl.depthMask(true);
    gl.disable(gl.BLEND);
  }
}
