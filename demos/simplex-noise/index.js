import { Game, Entity, ShaderManager, Camera, mat4 } from '../../src/index.js';

class SimplexNoisePlane extends Entity {
  init(game) {
    super.init(game);
    const gl = game.gl;

    // Create shader with 3D simplex noise
    this.shader = ShaderManager.getShader(gl, `
      attribute vec3 position;
      attribute vec2 uv;
      uniform mat4 model;
      uniform mat4 view;
      uniform mat4 projection;
      varying vec2 vUv;

      void main() {
        vUv = uv;
        gl_Position = projection * view * model * vec4(position, 1.0);
      }
    `, `
      precision highp float;
      uniform float uTime;
      uniform float uSpeed;
      varying vec2 vUv;

      // 3D Simplex Noise implementation
      // Based on Stefan Gustavson's implementation
      vec3 mod289(vec3 x) {
        return x - floor(x * (1.0 / 289.0)) * 289.0;
      }

      vec4 mod289(vec4 x) {
        return x - floor(x * (1.0 / 289.0)) * 289.0;
      }

      vec4 permute(vec4 x) {
        return mod289(((x * 34.0) + 1.0) * x);
      }

      vec4 taylorInvSqrt(vec4 r) {
        return 1.79284291400159 - 0.85373472095314 * r;
      }

      float snoise(vec3 v) {
        const vec2 C = vec2(1.0/6.0, 1.0/3.0);
        const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);

        // First corner
        vec3 i  = floor(v + dot(v, C.yyy));
        vec3 x0 = v - i + dot(i, C.xxx);

        // Other corners
        vec3 g = step(x0.yzx, x0.xyz);
        vec3 l = 1.0 - g;
        vec3 i1 = min(g.xyz, l.zxy);
        vec3 i2 = max(g.xyz, l.zxy);

        vec3 x1 = x0 - i1 + C.xxx;
        vec3 x2 = x0 - i2 + C.yyy;
        vec3 x3 = x0 - D.yyy;

        // Permutations
        i = mod289(i);
        vec4 p = permute(permute(permute(
                 i.z + vec4(0.0, i1.z, i2.z, 1.0))
               + i.y + vec4(0.0, i1.y, i2.y, 1.0))
               + i.x + vec4(0.0, i1.x, i2.x, 1.0));

        // Gradients
        float n_ = 0.142857142857;
        vec3 ns = n_ * D.wyz - D.xzx;

        vec4 j = p - 49.0 * floor(p * ns.z * ns.z);

        vec4 x_ = floor(j * ns.z);
        vec4 y_ = floor(j - 7.0 * x_);

        vec4 x = x_ * ns.x + ns.yyyy;
        vec4 y = y_ * ns.x + ns.yyyy;
        vec4 h = 1.0 - abs(x) - abs(y);

        vec4 b0 = vec4(x.xy, y.xy);
        vec4 b1 = vec4(x.zw, y.zw);

        vec4 s0 = floor(b0) * 2.0 + 1.0;
        vec4 s1 = floor(b1) * 2.0 + 1.0;
        vec4 sh = -step(h, vec4(0.0));

        vec4 a0 = b0.xzyw + s0.xzyw * sh.xxyy;
        vec4 a1 = b1.xzyw + s1.xzyw * sh.zzww;

        vec3 p0 = vec3(a0.xy, h.x);
        vec3 p1 = vec3(a0.zw, h.y);
        vec3 p2 = vec3(a1.xy, h.z);
        vec3 p3 = vec3(a1.zw, h.w);

        // Normalize gradients
        vec4 norm = taylorInvSqrt(vec4(dot(p0, p0), dot(p1, p1), dot(p2, p2), dot(p3, p3)));
        p0 *= norm.x;
        p1 *= norm.y;
        p2 *= norm.z;
        p3 *= norm.w;

        // Mix final noise value
        vec4 m = max(0.6 - vec4(dot(x0, x0), dot(x1, x1), dot(x2, x2), dot(x3, x3)), 0.0);
        m = m * m;
        return 42.0 * dot(m * m, vec4(dot(p0, x0), dot(p1, x1), dot(p2, x2), dot(p3, x3)));
      }

      // Fractal Brownian Motion for more interesting patterns
      float fbm(vec3 p) {
        float value = 0.0;
        float amplitude = 0.5;
        float frequency = 1.0;

        for(int i = 0; i < 5; i++) {
          value += amplitude * snoise(p * frequency);
          frequency *= 2.0;
          amplitude *= 0.5;
        }

        return value;
      }

      void main() {
        // Sample the 3D simplex noise with animated z-offset
        vec3 noiseCoord = vec3(vUv * 4.0, uTime * uSpeed);
        float noise = fbm(noiseCoord);

        // Normalize to 0-1 range
        noise = noise * 0.5 + 0.5;
        vec3 color = vec3(noise, noise, noise);

        gl_FragColor = vec4(color, 1.0);
      }
    `);

    // Create a plane geometry
    const resolution = 100;
    const vertices = [];
    const indices = [];

    // Generate vertices
    for (let y = 0; y <= resolution; y++) {
      for (let x = 0; x <= resolution; x++) {
        const xPos = (x / resolution) * 2.0 - 1.0;
        const yPos = (y / resolution) * 2.0 - 1.0;
        const u = x / resolution;
        const v = y / resolution;

        vertices.push(xPos, yPos, 0.0, u, v);
      }
    }

    // Generate indices
    for (let y = 0; y < resolution; y++) {
      for (let x = 0; x < resolution; x++) {
        const topLeft = y * (resolution + 1) + x;
        const topRight = topLeft + 1;
        const bottomLeft = (y + 1) * (resolution + 1) + x;
        const bottomRight = bottomLeft + 1;

        indices.push(topLeft, bottomLeft, topRight);
        indices.push(topRight, bottomLeft, bottomRight);
      }
    }

    this.vertexData = new Float32Array(vertices);
    this.indexData = new Uint16Array(indices);
    this.indexCount = indices.length;

    // Create VBO
    this.vbo = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, this.vbo);
    gl.bufferData(gl.ARRAY_BUFFER, this.vertexData, gl.STATIC_DRAW);

    // Create IBO
    this.ibo = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.ibo);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, this.indexData, gl.STATIC_DRAW);

    this.time = 0;
    this.speed = 0.3;
    this.model = mat4.create();
  }

  update(delta) {
    this.time += delta;
  }

  render(gl) {
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    gl.clearColor(0.1, 0.1, 0.1, 1.0);
    gl.enable(gl.DEPTH_TEST);

    this.shader.use();

    // Setup model matrix
    mat4.identity(this.model);

    // Scale the plane
    mat4.scale(this.model, this.model, [2.0, 2.0, 1.0]);

    // Get camera matrices
    const view = this.game.camera.getViewMatrix();
    const projection = this.game.camera.getProjectionMatrix();

    this.shader.setUniformMatrix('model', this.model);
    this.shader.setUniformMatrix('view', view);
    this.shader.setUniformMatrix('projection', projection);

    // Set uniforms for noise animation
    const uTimeLocation = gl.getUniformLocation(this.shader.program, 'uTime');
    gl.uniform1f(uTimeLocation, this.time);

    const uSpeedLocation = gl.getUniformLocation(this.shader.program, 'uSpeed');
    gl.uniform1f(uSpeedLocation, this.speed);

    // Bind buffers
    gl.bindBuffer(gl.ARRAY_BUFFER, this.vbo);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.ibo);

    // Setup position attribute
    const posAttr = this.shader.getAttribute('position');
    gl.enableVertexAttribArray(posAttr);
    gl.vertexAttribPointer(posAttr, 3, gl.FLOAT, false, 20, 0);

    // Setup UV attribute
    const uvAttr = this.shader.getAttribute('uv');
    gl.enableVertexAttribArray(uvAttr);
    gl.vertexAttribPointer(uvAttr, 2, gl.FLOAT, false, 20, 12);

    // Draw the plane
    gl.drawElements(gl.TRIANGLES, this.indexCount, gl.UNSIGNED_SHORT, 0);
  }
}

const canvas = document.getElementById('game');
const game = new Game(canvas);

// Create camera positioned to view the plane from above at an angle
const camera = new Camera({
  position: [0, 2, 4],
  target: [0, 0, 0],
  fov: 45 * Math.PI / 180,
  near: 0.1,
  far: 100
});

game.setCamera(camera);
game.add(new SimplexNoisePlane());
game.start();
