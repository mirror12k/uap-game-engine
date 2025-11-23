import { Game, Entity, ShaderManager, mat4 } from '../../src/index.js';
import { OrbitingCamera } from './OrbitingCamera.js';

class Metaballs extends Entity {
  init(game) {
    super.init(game);
    const gl = game.gl;

    // Create shader with raymarching metaballs
    this.shader = ShaderManager.getShader(gl, `
      attribute vec3 position;
      varying vec2 vScreenPos;

      void main() {
        vScreenPos = position.xy;
        gl_Position = vec4(position, 1.0);
      }
    `, `
      precision highp float;

      uniform float uTime;
      uniform vec3 uCameraPos;
      uniform mat4 uInvProjection;
      uniform mat4 uInvView;
      uniform vec2 uResolution;

      // Metaball positions (4 balls)
      uniform vec3 uBall1;
      uniform vec3 uBall2;
      uniform vec3 uBall3;
      uniform vec3 uBall4;

      varying vec2 vScreenPos;

      // Metaball field function
      float metaballField(vec3 p) {
        float field = 0.0;

        // Each ball contributes: strength / distance^2
        float d1 = distance(p, uBall1);
        field += 1.0 / (d1 * d1 + 0.01);

        float d2 = distance(p, uBall2);
        field += 1.0 / (d2 * d2 + 0.01);

        float d3 = distance(p, uBall3);
        field += 1.0 / (d3 * d3 + 0.01);

        float d4 = distance(p, uBall4);
        field += 1.0 / (d4 * d4 + 0.01);

        return field;
      }

      // Calculate normal using gradient
      vec3 calculateNormal(vec3 p) {
        float eps = 0.01;
        vec3 n;
        n.x = metaballField(vec3(p.x + eps, p.y, p.z)) - metaballField(vec3(p.x - eps, p.y, p.z));
        n.y = metaballField(vec3(p.x, p.y + eps, p.z)) - metaballField(vec3(p.x, p.y - eps, p.z));
        n.z = metaballField(vec3(p.x, p.y, p.z + eps)) - metaballField(vec3(p.x, p.y, p.z - eps));
        return normalize(n);
      }

      // Raymarch to find metaball surface
      vec4 raymarch(vec3 ro, vec3 rd) {
        float t = 0.0;
        float threshold = 2.0; // Metaball surface threshold

        for (int i = 0; i < 128; i++) {
          vec3 p = ro + rd * t;
          float field = metaballField(p);

          // If field value crosses threshold, we hit the surface
          if (field >= threshold) {
            vec3 normal = calculateNormal(p);

            // Simple lighting
            vec3 lightDir = normalize(vec3(1.0, 1.0, 1.0));
            float diffuse = max(dot(normal, lightDir), 0.0);
            float ambient = 0.3;
            float lighting = ambient + diffuse * 0.7;

            // Color based on position and lighting
            vec3 color = vec3(0.2, 0.6, 0.9) * lighting;

            // Add specular highlight
            vec3 viewDir = normalize(ro - p);
            vec3 reflectDir = reflect(-lightDir, normal);
            float spec = pow(max(dot(viewDir, reflectDir), 0.0), 32.0);
            color += vec3(1.0) * spec * 0.5;

            return vec4(color, 1.0);
          }

          // Adaptive step size based on field strength
          float stepSize = 0.1 / (field + 0.1);
          t += stepSize;

          if (t > 20.0) break;
        }

        // Background color
        return vec4(0.1, 0.1, 0.15, 1.0);
      }

      void main() {
        // Convert screen position to ray direction
        vec2 uv = vScreenPos;

        // Create ray from camera through pixel
        vec4 clipPos = vec4(uv, -1.0, 1.0);
        vec4 eyePos = uInvProjection * clipPos;
        eyePos = vec4(eyePos.xy, -1.0, 0.0);
        vec3 worldDir = (uInvView * eyePos).xyz;
        vec3 rayDir = normalize(worldDir);

        // Raymarch
        gl_FragColor = raymarch(uCameraPos, rayDir);
      }
    `);

    // Create fullscreen quad
    const vertices = new Float32Array([
      -1, -1, 0,
       1, -1, 0,
      -1,  1, 0,
       1,  1, 0
    ]);

    this.vbo = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, this.vbo);
    gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);

    this.time = 0;

    // Initialize ball positions
    this.balls = [
      { phase: 0, radiusX: 1.5, radiusY: 1.0, radiusZ: 1.5, speed: 1.0 },
      { phase: Math.PI * 0.5, radiusX: 1.2, radiusY: 1.5, radiusZ: 1.0, speed: 1.3 },
      { phase: Math.PI, radiusX: 1.0, radiusY: 1.2, radiusZ: 1.5, speed: 0.8 },
      { phase: Math.PI * 1.5, radiusX: 1.5, radiusY: 1.0, radiusZ: 1.2, speed: 1.1 }
    ];

    this.invProjection = mat4.create();
    this.invView = mat4.create();
  }

  update(delta) {
    this.time += delta;
  }

  render(gl) {
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    gl.clearColor(0.1, 0.1, 0.15, 1.0);
    gl.disable(gl.DEPTH_TEST);

    this.shader.use();

    // Calculate ball positions based on time
    const positions = this.balls.map((ball, i) => {
      const angle = this.time * ball.speed + ball.phase;
      return [
        Math.cos(angle) * ball.radiusX,
        Math.sin(angle * 1.3) * ball.radiusY,
        Math.sin(angle) * ball.radiusZ
      ];
    });

    // Set ball position uniforms
    const ball1Loc = gl.getUniformLocation(this.shader.program, 'uBall1');
    gl.uniform3f(ball1Loc, positions[0][0], positions[0][1], positions[0][2]);

    const ball2Loc = gl.getUniformLocation(this.shader.program, 'uBall2');
    gl.uniform3f(ball2Loc, positions[1][0], positions[1][1], positions[1][2]);

    const ball3Loc = gl.getUniformLocation(this.shader.program, 'uBall3');
    gl.uniform3f(ball3Loc, positions[2][0], positions[2][1], positions[2][2]);

    const ball4Loc = gl.getUniformLocation(this.shader.program, 'uBall4');
    gl.uniform3f(ball4Loc, positions[3][0], positions[3][1], positions[3][2]);

    // Set time uniform
    const uTimeLoc = gl.getUniformLocation(this.shader.program, 'uTime');
    gl.uniform1f(uTimeLoc, this.time);

    // Set camera position
    const cameraPosLoc = gl.getUniformLocation(this.shader.program, 'uCameraPos');
    const camPos = this.game.camera.position;
    gl.uniform3f(cameraPosLoc, camPos[0], camPos[1], camPos[2]);

    // Set inverse matrices for ray calculation
    const projection = this.game.camera.getProjectionMatrix();
    const view = this.game.camera.getViewMatrix();

    mat4.invert(this.invProjection, projection);
    mat4.invert(this.invView, view);

    const invProjLoc = gl.getUniformLocation(this.shader.program, 'uInvProjection');
    gl.uniformMatrix4fv(invProjLoc, false, this.invProjection);

    const invViewLoc = gl.getUniformLocation(this.shader.program, 'uInvView');
    gl.uniformMatrix4fv(invViewLoc, false, this.invView);

    // Set resolution
    const resolutionLoc = gl.getUniformLocation(this.shader.program, 'uResolution');
    gl.uniform2f(resolutionLoc, gl.canvas.width, gl.canvas.height);

    // Bind VBO and draw
    gl.bindBuffer(gl.ARRAY_BUFFER, this.vbo);

    const posAttr = this.shader.getAttribute('position');
    gl.enableVertexAttribArray(posAttr);
    gl.vertexAttribPointer(posAttr, 3, gl.FLOAT, false, 0, 0);

    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
  }
}

const canvas = document.getElementById('game');
const game = new Game(canvas);

// Create orbiting camera
const camera = new OrbitingCamera({
  target: [0, 0, 0],
  orbitRadius: 5,
  orbitSpeed: 0.2,
  orbitHeight: 2,
  autoOrbit: true
});

game.setCamera(camera);
game.add(new Metaballs());
game.start();
