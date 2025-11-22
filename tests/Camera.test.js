import { TestRunner, assert, assertEqual, assertApprox } from '../src/engine/TestRunner.js';
import { Camera } from '../src/engine/Camera.js';
import { mat4 } from 'gl-matrix';

const runner = new TestRunner();

// Helper to create mock game object
function createMockGame() {
  return {
    canvas: { width: 800, height: 600 }
  };
}

// Helper to check if two arrays are approximately equal
function assertArrayApprox(actual, expected, epsilon = 0.001, message) {
  if (actual.length !== expected.length) {
    throw new Error(message || `Array lengths differ: expected ${expected.length}, got ${actual.length}`);
  }
  for (let i = 0; i < actual.length; i++) {
    if (Math.abs(actual[i] - expected[i]) > epsilon) {
      throw new Error(message || `Array mismatch at index ${i}: expected ${expected[i]}, got ${actual[i]}`);
    }
  }
}

// ============================
// Constructor Tests
// ============================

runner.test('Camera: constructor with default options', () => {
  const camera = new Camera();

  assertEqual(camera.position.length, 3);
  assertApprox(camera.position[0], 0);
  assertApprox(camera.position[1], 0);
  assertApprox(camera.position[2], 5);

  assertEqual(camera.target.length, 3);
  assertApprox(camera.target[0], 0);
  assertApprox(camera.target[1], 0);
  assertApprox(camera.target[2], 0);

  assertEqual(camera.up.length, 3);
  assertApprox(camera.up[0], 0);
  assertApprox(camera.up[1], 1);
  assertApprox(camera.up[2], 0);

  assertApprox(camera.fov, 45 * Math.PI / 180, 0.001);
  assertApprox(camera.near, 0.1);
  assertApprox(camera.far, 100);
});

runner.test('Camera: constructor with custom position', () => {
  const camera = new Camera({ position: [10, 20, 30] });

  assertApprox(camera.position[0], 10);
  assertApprox(camera.position[1], 20);
  assertApprox(camera.position[2], 30);
});

runner.test('Camera: constructor with custom target', () => {
  const camera = new Camera({ target: [5, 5, 5] });

  assertApprox(camera.target[0], 5);
  assertApprox(camera.target[1], 5);
  assertApprox(camera.target[2], 5);
});

runner.test('Camera: constructor with custom up vector', () => {
  const camera = new Camera({ up: [0, 0, 1] });

  assertApprox(camera.up[0], 0);
  assertApprox(camera.up[1], 0);
  assertApprox(camera.up[2], 1);
});

runner.test('Camera: constructor with custom FOV', () => {
  const camera = new Camera({ fov: Math.PI / 2 });

  assertApprox(camera.fov, Math.PI / 2);
});

runner.test('Camera: constructor with custom near/far planes', () => {
  const camera = new Camera({ near: 0.5, far: 200 });

  assertApprox(camera.near, 0.5);
  assertApprox(camera.far, 200);
});

runner.test('Camera: constructor with all custom options', () => {
  const camera = new Camera({
    position: [1, 2, 3],
    target: [4, 5, 6],
    up: [0, 0, 1],
    fov: Math.PI / 3,
    near: 0.01,
    far: 1000
  });

  assertApprox(camera.position[0], 1);
  assertApprox(camera.position[1], 2);
  assertApprox(camera.position[2], 3);
  assertApprox(camera.target[0], 4);
  assertApprox(camera.target[1], 5);
  assertApprox(camera.target[2], 6);
  assertApprox(camera.fov, Math.PI / 3);
  assertApprox(camera.near, 0.01);
  assertApprox(camera.far, 1000);
});

// ============================
// init() Tests
// ============================

runner.test('Camera: init() creates projection matrix with correct aspect ratio', () => {
  const camera = new Camera();
  const game = createMockGame();

  camera.init(game);

  // Verify projection matrix was created
  assert(camera.projection instanceof Float32Array || Array.isArray(camera.projection));
  assertEqual(camera.projection.length, 16);

  // Projection matrix should not be identity after init
  const identity = mat4.create();
  const isIdentity = camera.projection.every((val, idx) => Math.abs(val - identity[idx]) < 0.001);
  assert(!isIdentity, 'Projection matrix should not be identity after init');
});

runner.test('Camera: init() creates view matrix', () => {
  const camera = new Camera();
  const game = createMockGame();

  camera.init(game);

  // Verify view matrix was created
  assert(camera.view instanceof Float32Array || Array.isArray(camera.view));
  assertEqual(camera.view.length, 16);

  // View matrix should not be identity (camera is at z=5 looking at origin)
  const identity = mat4.create();
  const isIdentity = camera.view.every((val, idx) => Math.abs(val - identity[idx]) < 0.001);
  assert(!isIdentity, 'View matrix should not be identity for non-default camera');
});

runner.test('Camera: init() handles different aspect ratios', () => {
  const camera = new Camera();
  const wideGame = { canvas: { width: 1920, height: 1080 } };
  const squareGame = { canvas: { width: 1000, height: 1000 } };

  const camera1 = new Camera();
  camera1.init(wideGame);

  const camera2 = new Camera();
  camera2.init(squareGame);

  // Projection matrices should differ due to aspect ratio
  const matricesEqual = camera1.projection.every((val, idx) =>
    Math.abs(val - camera2.projection[idx]) < 0.001
  );
  assert(!matricesEqual, 'Projection matrices should differ for different aspect ratios');
});

// ============================
// setPosition() Tests
// ============================

runner.test('Camera: setPosition() updates position', () => {
  const camera = new Camera();
  const game = createMockGame();
  camera.init(game);

  camera.setPosition(10, 20, 30);

  assertApprox(camera.position[0], 10);
  assertApprox(camera.position[1], 20);
  assertApprox(camera.position[2], 30);
});

runner.test('Camera: setPosition() updates view matrix', () => {
  const camera = new Camera();
  const game = createMockGame();
  camera.init(game);

  const oldView = Array.from(camera.view);
  camera.setPosition(5, 5, 5);

  // View matrix should have changed
  const viewUnchanged = camera.view.every((val, idx) => Math.abs(val - oldView[idx]) < 0.001);
  assert(!viewUnchanged, 'View matrix should update after setPosition');
});

runner.test('Camera: setPosition() with negative coordinates', () => {
  const camera = new Camera();
  const game = createMockGame();
  camera.init(game);

  camera.setPosition(-10, -5, -20);

  assertApprox(camera.position[0], -10);
  assertApprox(camera.position[1], -5);
  assertApprox(camera.position[2], -20);
});

runner.test('Camera: setPosition() with zero coordinates', () => {
  const camera = new Camera();
  const game = createMockGame();
  camera.init(game);

  camera.setPosition(0, 0, 0);

  assertApprox(camera.position[0], 0);
  assertApprox(camera.position[1], 0);
  assertApprox(camera.position[2], 0);
});

// ============================
// setTarget() Tests
// ============================

runner.test('Camera: setTarget() updates target', () => {
  const camera = new Camera();
  const game = createMockGame();
  camera.init(game);

  camera.setTarget(15, 25, 35);

  assertApprox(camera.target[0], 15);
  assertApprox(camera.target[1], 25);
  assertApprox(camera.target[2], 35);
});

runner.test('Camera: setTarget() updates view matrix', () => {
  const camera = new Camera();
  const game = createMockGame();
  camera.init(game);

  const oldView = Array.from(camera.view);
  camera.setTarget(10, 0, 0);

  // View matrix should have changed
  const viewUnchanged = camera.view.every((val, idx) => Math.abs(val - oldView[idx]) < 0.001);
  assert(!viewUnchanged, 'View matrix should update after setTarget');
});

runner.test('Camera: setTarget() with negative coordinates', () => {
  const camera = new Camera();
  const game = createMockGame();
  camera.init(game);

  camera.setTarget(-8, -12, -16);

  assertApprox(camera.target[0], -8);
  assertApprox(camera.target[1], -12);
  assertApprox(camera.target[2], -16);
});

// ============================
// getViewMatrix() Tests
// ============================

runner.test('Camera: getViewMatrix() returns view matrix', () => {
  const camera = new Camera();
  const game = createMockGame();
  camera.init(game);

  const view = camera.getViewMatrix();

  assert(view instanceof Float32Array || Array.isArray(view));
  assertEqual(view.length, 16);
  assert(view === camera.view, 'getViewMatrix should return the internal view matrix');
});

runner.test('Camera: getViewMatrix() returns updated matrix after setPosition', () => {
  const camera = new Camera();
  const game = createMockGame();
  camera.init(game);

  const oldView = Array.from(camera.getViewMatrix());
  camera.setPosition(1, 2, 3);
  const newView = camera.getViewMatrix();

  const viewChanged = newView.some((val, idx) => Math.abs(val - oldView[idx]) > 0.001);
  assert(viewChanged, 'getViewMatrix should reflect position changes');
});

// ============================
// getProjectionMatrix() Tests
// ============================

runner.test('Camera: getProjectionMatrix() returns projection matrix', () => {
  const camera = new Camera();
  const game = createMockGame();
  camera.init(game);

  const projection = camera.getProjectionMatrix();

  assert(projection instanceof Float32Array || Array.isArray(projection));
  assertEqual(projection.length, 16);
  assert(projection === camera.projection, 'getProjectionMatrix should return the internal projection matrix');
});

runner.test('Camera: getProjectionMatrix() returns consistent matrix', () => {
  const camera = new Camera();
  const game = createMockGame();
  camera.init(game);

  const proj1 = camera.getProjectionMatrix();
  const proj2 = camera.getProjectionMatrix();

  assert(proj1 === proj2, 'getProjectionMatrix should return same reference');
});

// ============================
// Integration Tests
// ============================

runner.test('Camera: multiple position and target updates work correctly', () => {
  const camera = new Camera();
  const game = createMockGame();
  camera.init(game);

  camera.setPosition(1, 0, 0);
  camera.setTarget(0, 0, 0);

  assertApprox(camera.position[0], 1);
  assertApprox(camera.target[0], 0);

  camera.setPosition(0, 2, 0);
  camera.setTarget(0, 0, 0);

  assertApprox(camera.position[0], 0);
  assertApprox(camera.position[1], 2);
});

runner.test('Camera: view matrix correctly reflects lookAt transformation', () => {
  const camera = new Camera({
    position: [0, 0, 10],
    target: [0, 0, 0]
  });
  const game = createMockGame();
  camera.init(game);

  const view = camera.getViewMatrix();

  // Verify it's a valid matrix (non-zero, non-NaN)
  assert(view.some(val => val !== 0), 'View matrix should have non-zero values');
  assert(view.every(val => !isNaN(val)), 'View matrix should not contain NaN');
});

runner.test('Camera: projection matrix has correct properties', () => {
  const camera = new Camera({
    fov: Math.PI / 4,
    near: 0.1,
    far: 100
  });
  const game = { canvas: { width: 800, height: 600 } };
  camera.init(game);

  const proj = camera.getProjectionMatrix();

  // Basic validation: projection matrix should have non-zero values
  assert(proj.some(val => val !== 0), 'Projection matrix should have non-zero values');
  assert(proj.every(val => !isNaN(val)), 'Projection matrix should not contain NaN');

  // Check that perspective projection was applied (element [15] should be 0 for perspective)
  assertApprox(proj[15], 0, 0.001, 'Projection matrix [15] should be 0 for perspective projection');
});

export { runner };
