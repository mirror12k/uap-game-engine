export class Shader {
  constructor(gl, vertexSource, fragmentSource) {
    this.gl = gl;
    this.program = this.createProgram(vertexSource, fragmentSource);
    this.uniforms = {};
    this.attributes = {};
  }

  createProgram(vertexSource, fragmentSource) {
    const gl = this.gl;
    const vertexShader = this.compileShader(gl.VERTEX_SHADER, vertexSource);
    const fragmentShader = this.compileShader(gl.FRAGMENT_SHADER, fragmentSource);

    const program = gl.createProgram();
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);

    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      throw new Error('Shader program failed to link: ' + gl.getProgramInfoLog(program));
    }

    return program;
  }

  compileShader(type, source) {
    const gl = this.gl;
    const shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);

    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      throw new Error('Shader compilation failed: ' + gl.getShaderInfoLog(shader));
    }

    return shader;
  }

  use() {
    this.gl.useProgram(this.program);
  }

  getUniform(name) {
    if (!this.uniforms[name]) {
      this.uniforms[name] = this.gl.getUniformLocation(this.program, name);
    }
    return this.uniforms[name];
  }

  getAttribute(name) {
    if (!this.attributes[name]) {
      this.attributes[name] = this.gl.getAttribLocation(this.program, name);
    }
    return this.attributes[name];
  }

  setUniform(name, ...values) {
    const location = this.getUniform(name);
    const gl = this.gl;

    if (values.length === 1) {
      gl.uniform1f(location, values[0]);
    } else if (values.length === 2) {
      gl.uniform2f(location, values[0], values[1]);
    } else if (values.length === 3) {
      gl.uniform3f(location, values[0], values[1], values[2]);
    } else if (values.length === 4) {
      gl.uniform4f(location, values[0], values[1], values[2], values[3]);
    }
  }

  setUniformMatrix(name, matrix) {
    const location = this.getUniform(name);
    const gl = this.gl;

    if (matrix.length === 16) {
      gl.uniformMatrix4fv(location, false, matrix);
    } else if (matrix.length === 9) {
      gl.uniformMatrix3fv(location, false, matrix);
    }
  }
}

export class ShaderManager {
  static cache = new Map();

  static generateKey(vertexSource, fragmentSource) {
    // Simple hash function for cache key generation
    let hash = 0;
    const combined = vertexSource + fragmentSource;
    for (let i = 0; i < combined.length; i++) {
      const char = combined.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return hash.toString(36);
  }

  static getShader(gl, vertexSource, fragmentSource) {
    const key = this.generateKey(vertexSource, fragmentSource);

    if (!this.cache.has(key)) {
      this.cache.set(key, new Shader(gl, vertexSource, fragmentSource));
    }

    return this.cache.get(key);
  }

  static clear() {
    this.cache.clear();
  }

  static getCacheSize() {
    return this.cache.size;
  }
}
