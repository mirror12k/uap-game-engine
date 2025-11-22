import { TestRunner, assert, assertEqual } from '../src/engine/TestRunner.js';
import { ShaderManager, Shader } from '../src/engine/Shader.js';

const runner = new TestRunner();

// Mock WebGL context for testing
function createMockGL() {
  return {
    VERTEX_SHADER: 35633,
    FRAGMENT_SHADER: 35632,
    LINK_STATUS: 35714,
    COMPILE_STATUS: 35713,
    createShader: () => ({}),
    shaderSource: () => {},
    compileShader: () => {},
    getShaderParameter: () => true,
    createProgram: () => ({ id: Math.random() }),
    attachShader: () => {},
    linkProgram: () => {},
    getProgramParameter: () => true,
    getUniformLocation: () => null,
    getAttribLocation: () => 0,
    useProgram: () => {}
  };
}

const simpleVertexShader = `
  attribute vec3 position;
  void main() {
    gl_Position = vec4(position, 1.0);
  }
`;

const simpleFragmentShader = `
  precision mediump float;
  void main() {
    gl_FragColor = vec4(1.0);
  }
`;

const differentFragmentShader = `
  precision mediump float;
  void main() {
    gl_FragColor = vec4(0.5, 0.5, 0.5, 1.0);
  }
`;

// ============================
// generateKey() Tests
// ============================

runner.test('ShaderManager: generateKey() generates consistent keys for same input', () => {
  const key1 = ShaderManager.generateKey(simpleVertexShader, simpleFragmentShader);
  const key2 = ShaderManager.generateKey(simpleVertexShader, simpleFragmentShader);

  assertEqual(key1, key2, 'Same shader sources should generate same key');
});

runner.test('ShaderManager: generateKey() generates different keys for different inputs', () => {
  const key1 = ShaderManager.generateKey(simpleVertexShader, simpleFragmentShader);
  const key2 = ShaderManager.generateKey(simpleVertexShader, differentFragmentShader);

  assert(key1 !== key2, 'Different shader sources should generate different keys');
});

runner.test('ShaderManager: generateKey() returns string', () => {
  const key = ShaderManager.generateKey(simpleVertexShader, simpleFragmentShader);

  assertEqual(typeof key, 'string', 'Key should be a string');
  assert(key.length > 0, 'Key should not be empty');
});

runner.test('ShaderManager: generateKey() handles empty strings', () => {
  const key = ShaderManager.generateKey('', '');

  assertEqual(typeof key, 'string', 'Key should be a string even for empty input');
});

runner.test('ShaderManager: generateKey() handles very long shader sources', () => {
  const longShader = simpleVertexShader.repeat(100);
  const key = ShaderManager.generateKey(longShader, simpleFragmentShader);

  assertEqual(typeof key, 'string', 'Should handle long shader sources');
  assert(key.length > 0, 'Key should not be empty');
});

runner.test('ShaderManager: generateKey() is sensitive to whitespace', () => {
  const shader1 = 'void main() { }';
  const shader2 = 'void main() {  }'; // Extra space

  const key1 = ShaderManager.generateKey(shader1, simpleFragmentShader);
  const key2 = ShaderManager.generateKey(shader2, simpleFragmentShader);

  assert(key1 !== key2, 'Keys should differ with different whitespace');
});

// ============================
// getShader() Tests
// ============================

runner.test('ShaderManager: getShader() returns Shader instance', () => {
  ShaderManager.clear();
  const gl = createMockGL();

  const shader = ShaderManager.getShader(gl, simpleVertexShader, simpleFragmentShader);

  assert(shader instanceof Shader, 'Should return Shader instance');
});

runner.test('ShaderManager: getShader() caches shader instances', () => {
  ShaderManager.clear();
  const gl = createMockGL();

  const shader1 = ShaderManager.getShader(gl, simpleVertexShader, simpleFragmentShader);
  const shader2 = ShaderManager.getShader(gl, simpleVertexShader, simpleFragmentShader);

  assert(shader1 === shader2, 'Same shader sources should return cached instance');
});

runner.test('ShaderManager: getShader() creates new instances for different shaders', () => {
  ShaderManager.clear();
  const gl = createMockGL();

  const shader1 = ShaderManager.getShader(gl, simpleVertexShader, simpleFragmentShader);
  const shader2 = ShaderManager.getShader(gl, simpleVertexShader, differentFragmentShader);

  assert(shader1 !== shader2, 'Different shader sources should create different instances');
});

runner.test('ShaderManager: getShader() increases cache size on new shader', () => {
  ShaderManager.clear();
  const gl = createMockGL();

  assertEqual(ShaderManager.getCacheSize(), 0, 'Cache should start empty');

  ShaderManager.getShader(gl, simpleVertexShader, simpleFragmentShader);

  assertEqual(ShaderManager.getCacheSize(), 1, 'Cache size should increase');
});

runner.test('ShaderManager: getShader() does not increase cache size on cache hit', () => {
  ShaderManager.clear();
  const gl = createMockGL();

  ShaderManager.getShader(gl, simpleVertexShader, simpleFragmentShader);
  assertEqual(ShaderManager.getCacheSize(), 1);

  ShaderManager.getShader(gl, simpleVertexShader, simpleFragmentShader);
  assertEqual(ShaderManager.getCacheSize(), 1, 'Cache size should not increase on cache hit');
});

runner.test('ShaderManager: getShader() works with multiple different shaders', () => {
  ShaderManager.clear();
  const gl = createMockGL();

  const shader1 = ShaderManager.getShader(gl, simpleVertexShader, simpleFragmentShader);
  const shader2 = ShaderManager.getShader(gl, simpleVertexShader, differentFragmentShader);
  const shader3 = ShaderManager.getShader(gl, 'vertex3', 'fragment3');

  assertEqual(ShaderManager.getCacheSize(), 3, 'Should cache 3 different shaders');
  assert(shader1 !== shader2, 'Shader 1 and 2 should be different');
  assert(shader2 !== shader3, 'Shader 2 and 3 should be different');
  assert(shader1 !== shader3, 'Shader 1 and 3 should be different');
});

runner.test('ShaderManager: getShader() retrieves correct cached shader', () => {
  ShaderManager.clear();
  const gl = createMockGL();

  const shader1 = ShaderManager.getShader(gl, simpleVertexShader, simpleFragmentShader);
  const shader2 = ShaderManager.getShader(gl, simpleVertexShader, differentFragmentShader);

  // Request first shader again
  const shader1Again = ShaderManager.getShader(gl, simpleVertexShader, simpleFragmentShader);

  assert(shader1 === shader1Again, 'Should retrieve correct cached shader');
  assert(shader1Again !== shader2, 'Should not confuse different shaders');
});

// ============================
// clear() Tests
// ============================

runner.test('ShaderManager: clear() empties the cache', () => {
  ShaderManager.clear();
  const gl = createMockGL();

  ShaderManager.getShader(gl, simpleVertexShader, simpleFragmentShader);
  ShaderManager.getShader(gl, simpleVertexShader, differentFragmentShader);

  assertEqual(ShaderManager.getCacheSize(), 2);

  ShaderManager.clear();

  assertEqual(ShaderManager.getCacheSize(), 0, 'Cache should be empty after clear()');
});

runner.test('ShaderManager: clear() allows fresh caching', () => {
  ShaderManager.clear();
  const gl = createMockGL();

  const shader1 = ShaderManager.getShader(gl, simpleVertexShader, simpleFragmentShader);
  ShaderManager.clear();

  const shader2 = ShaderManager.getShader(gl, simpleVertexShader, simpleFragmentShader);

  // After clear, new shader instance should be created
  assert(shader1 !== shader2, 'Should create new instance after clear()');
});

runner.test('ShaderManager: clear() on empty cache does not throw', () => {
  ShaderManager.clear();
  ShaderManager.clear(); // Clear again

  assertEqual(ShaderManager.getCacheSize(), 0, 'Clearing empty cache should work');
});

// ============================
// getCacheSize() Tests
// ============================

runner.test('ShaderManager: getCacheSize() returns 0 for empty cache', () => {
  ShaderManager.clear();

  assertEqual(ShaderManager.getCacheSize(), 0);
});

runner.test('ShaderManager: getCacheSize() returns correct count for single shader', () => {
  ShaderManager.clear();
  const gl = createMockGL();

  ShaderManager.getShader(gl, simpleVertexShader, simpleFragmentShader);

  assertEqual(ShaderManager.getCacheSize(), 1);
});

runner.test('ShaderManager: getCacheSize() returns correct count for multiple shaders', () => {
  ShaderManager.clear();
  const gl = createMockGL();

  ShaderManager.getShader(gl, simpleVertexShader, simpleFragmentShader);
  ShaderManager.getShader(gl, simpleVertexShader, differentFragmentShader);
  ShaderManager.getShader(gl, 'v3', 'f3');
  ShaderManager.getShader(gl, 'v4', 'f4');

  assertEqual(ShaderManager.getCacheSize(), 4);
});

runner.test('ShaderManager: getCacheSize() does not count duplicates', () => {
  ShaderManager.clear();
  const gl = createMockGL();

  ShaderManager.getShader(gl, simpleVertexShader, simpleFragmentShader);
  ShaderManager.getShader(gl, simpleVertexShader, simpleFragmentShader);
  ShaderManager.getShader(gl, simpleVertexShader, simpleFragmentShader);

  assertEqual(ShaderManager.getCacheSize(), 1, 'Should only count unique shaders');
});

// ============================
// Integration Tests
// ============================

runner.test('ShaderManager: full cache lifecycle', () => {
  ShaderManager.clear();
  const gl = createMockGL();

  // Start empty
  assertEqual(ShaderManager.getCacheSize(), 0);

  // Add first shader
  const shader1 = ShaderManager.getShader(gl, simpleVertexShader, simpleFragmentShader);
  assertEqual(ShaderManager.getCacheSize(), 1);

  // Get same shader (cached)
  const shader1Cached = ShaderManager.getShader(gl, simpleVertexShader, simpleFragmentShader);
  assert(shader1 === shader1Cached);
  assertEqual(ShaderManager.getCacheSize(), 1);

  // Add different shader
  const shader2 = ShaderManager.getShader(gl, simpleVertexShader, differentFragmentShader);
  assert(shader1 !== shader2);
  assertEqual(ShaderManager.getCacheSize(), 2);

  // Clear cache
  ShaderManager.clear();
  assertEqual(ShaderManager.getCacheSize(), 0);

  // Add shader after clear
  const shader3 = ShaderManager.getShader(gl, simpleVertexShader, simpleFragmentShader);
  assert(shader3 !== shader1, 'Should be new instance after clear');
  assertEqual(ShaderManager.getCacheSize(), 1);
});

runner.test('ShaderManager: handles many shader requests efficiently', () => {
  ShaderManager.clear();
  const gl = createMockGL();

  const shader1 = ShaderManager.getShader(gl, simpleVertexShader, simpleFragmentShader);

  // Request same shader 100 times
  for (let i = 0; i < 100; i++) {
    const shaderN = ShaderManager.getShader(gl, simpleVertexShader, simpleFragmentShader);
    assert(shaderN === shader1, `Request ${i} should return cached shader`);
  }

  assertEqual(ShaderManager.getCacheSize(), 1, 'Should still only have 1 cached shader');
});

runner.test('ShaderManager: cache is shared across calls', () => {
  ShaderManager.clear();
  const gl = createMockGL();

  ShaderManager.getShader(gl, simpleVertexShader, simpleFragmentShader);

  // Verify cache persists
  assertEqual(ShaderManager.getCacheSize(), 1);

  // Different call should see same cache
  ShaderManager.getShader(gl, simpleVertexShader, differentFragmentShader);
  assertEqual(ShaderManager.getCacheSize(), 2);
});

runner.test('ShaderManager: correctly handles shader with special characters', () => {
  ShaderManager.clear();
  const gl = createMockGL();

  const specialShader = `
    // Comment with special chars: !@#$%^&*()
    attribute vec3 position;
    void main() {
      gl_Position = vec4(position, 1.0);
    }
  `;

  const shader = ShaderManager.getShader(gl, specialShader, simpleFragmentShader);

  assert(shader instanceof Shader, 'Should handle special characters');
  assertEqual(ShaderManager.getCacheSize(), 1);
});

runner.test('ShaderManager: distinguishes shaders that differ only in newlines', () => {
  ShaderManager.clear();
  const gl = createMockGL();

  const shader1Source = 'void main() { gl_FragColor = vec4(1.0); }';
  const shader2Source = 'void main() {\n  gl_FragColor = vec4(1.0);\n}';

  const shader1 = ShaderManager.getShader(gl, simpleVertexShader, shader1Source);
  const shader2 = ShaderManager.getShader(gl, simpleVertexShader, shader2Source);

  assert(shader1 !== shader2, 'Should distinguish shaders with different newlines');
  assertEqual(ShaderManager.getCacheSize(), 2);
});

runner.test('ShaderManager: order of vertex and fragment shaders matters', () => {
  ShaderManager.clear();
  const gl = createMockGL();

  // Swap vertex and fragment shaders
  const shader1 = ShaderManager.getShader(gl, simpleVertexShader, simpleFragmentShader);
  const shader2 = ShaderManager.getShader(gl, simpleFragmentShader, simpleVertexShader);

  assert(shader1 !== shader2, 'Order of shaders should matter');
  assertEqual(ShaderManager.getCacheSize(), 2);
});

// ============================
// Edge Cases
// ============================

runner.test('ShaderManager: handles identical vertex shaders with different fragment shaders', () => {
  ShaderManager.clear();
  const gl = createMockGL();

  const shader1 = ShaderManager.getShader(gl, simpleVertexShader, simpleFragmentShader);
  const shader2 = ShaderManager.getShader(gl, simpleVertexShader, differentFragmentShader);
  const shader3 = ShaderManager.getShader(gl, simpleVertexShader, 'fragment3');

  assertEqual(ShaderManager.getCacheSize(), 3);
  assert(shader1 !== shader2);
  assert(shader2 !== shader3);
  assert(shader1 !== shader3);
});

runner.test('ShaderManager: cache key collision is unlikely', () => {
  ShaderManager.clear();
  const gl = createMockGL();

  // Create many similar shaders
  const shaders = [];
  for (let i = 0; i < 50; i++) {
    const fragmentShader = `void main() { gl_FragColor = vec4(${i}.0); }`;
    shaders.push(ShaderManager.getShader(gl, simpleVertexShader, fragmentShader));
  }

  // All shaders should be unique
  const uniqueShaders = new Set(shaders);
  assertEqual(uniqueShaders.size, 50, 'All shaders should be unique (no hash collisions)');
  assertEqual(ShaderManager.getCacheSize(), 50);
});

export { runner };
