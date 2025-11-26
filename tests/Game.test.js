import { TestRunner, assert, assertEqual } from '../src/engine/TestRunner.js';
import { Game } from '../src/engine/Game.js';

const runner = new TestRunner();

// Mock window object for Node.js environment
if (typeof global !== 'undefined' && typeof global.window === 'undefined') {
  global.window = {
    innerWidth: 800,
    innerHeight: 600,
    addEventListener: () => {}
  };
}

// Helper to create a mock canvas
function createMockCanvas() {
  return {
    width: 800,
    height: 600,
    getContext: () => ({
      viewport: () => {},
      clearColor: () => {},
      clear: () => {},
      enable: () => {},
      depthFunc: () => {},
      cullFace: () => {},
      blendFunc: () => {},
      activeTexture: () => {},
      bindTexture: () => {},
      texParameteri: () => {},
      createBuffer: () => ({}),
      createTexture: () => ({}),
      createShader: () => ({}),
      createProgram: () => ({}),
      shaderSource: () => {},
      compileShader: () => {},
      attachShader: () => {},
      linkProgram: () => {},
      useProgram: () => {},
      getShaderParameter: () => true,
      getProgramParameter: () => true,
      getUniformLocation: () => ({}),
      getAttribLocation: () => 0,
      deleteBuffer: () => {},
    })
  };
}

// ============================
// Timer Tests - after()
// ============================

runner.test('Game: after() executes callback once after specified time', () => {
  const canvas = createMockCanvas();
  const game = new Game(canvas);

  let executed = false;
  game.after(0.1, () => {
    executed = true;
  });

  // Should not execute immediately
  assertEqual(executed, false);

  // Simulate time passing (0.05 seconds - not enough)
  game.updateTimers(0.05);
  assertEqual(executed, false);

  // Simulate more time passing (0.1 seconds total)
  game.updateTimers(0.05);
  assertEqual(executed, true);
});

runner.test('Game: after() callback executes only once', () => {
  const canvas = createMockCanvas();
  const game = new Game(canvas);

  let count = 0;
  game.after(0.1, () => {
    count++;
  });

  // Execute timer
  game.updateTimers(0.15);
  assertEqual(count, 1);

  // Try to execute again - should not increment
  game.updateTimers(0.15);
  assertEqual(count, 1);
});

runner.test('Game: after() returns a timer handle', () => {
  const canvas = createMockCanvas();
  const game = new Game(canvas);

  const timer = game.after(1.0, () => {});

  assert(timer !== undefined);
  assert(timer !== null);
  assert(typeof timer === 'object');
});

// ============================
// Timer Tests - every()
// ============================

runner.test('Game: every() executes callback repeatedly', () => {
  const canvas = createMockCanvas();
  const game = new Game(canvas);

  let count = 0;
  game.every(0.1, () => {
    count++;
  });

  // Should not execute immediately
  assertEqual(count, 0);

  // First execution
  game.updateTimers(0.1);
  assertEqual(count, 1);

  // Second execution
  game.updateTimers(0.1);
  assertEqual(count, 2);

  // Third execution
  game.updateTimers(0.1);
  assertEqual(count, 3);
});

runner.test('Game: every() returns a timer handle', () => {
  const canvas = createMockCanvas();
  const game = new Game(canvas);

  const timer = game.every(1.0, () => {});

  assert(timer !== undefined);
  assert(timer !== null);
  assert(typeof timer === 'object');
});

runner.test('Game: every() maintains consistent interval', () => {
  const canvas = createMockCanvas();
  const game = new Game(canvas);

  let count = 0;
  const timer = game.every(0.5, () => {
    count++;
  });

  // Check timer was added
  assertEqual(game.timers.length, 1);
  assertEqual(game.timers[0], timer);

  // First test: simple case - exactly 0.5 seconds
  game.updateTimers(0.5);
  assertEqual(count, 1);

  // Second test: another 0.5 seconds
  game.updateTimers(0.5);
  assertEqual(count, 2);
});

// ============================
// Timer Tests - clearEvent()
// ============================

runner.test('Game: clearEvent() stops a repeating timer', () => {
  const canvas = createMockCanvas();
  const game = new Game(canvas);

  let count = 0;
  const timer = game.every(0.1, () => {
    count++;
  });

  // First execution
  game.updateTimers(0.1);
  assertEqual(count, 1);

  // Clear the timer
  game.clearEvent(timer);

  // Should not execute anymore
  game.updateTimers(0.1);
  assertEqual(count, 1);

  game.updateTimers(0.1);
  assertEqual(count, 1);
});

runner.test('Game: clearEvent() can stop a pending after() timer', () => {
  const canvas = createMockCanvas();
  const game = new Game(canvas);

  let executed = false;
  const timer = game.after(0.5, () => {
    executed = true;
  });

  // Clear before it executes
  game.clearEvent(timer);

  // Time passes, but callback should not execute
  game.updateTimers(0.6);
  assertEqual(executed, false);
});

runner.test('Game: clearEvent() handles invalid timer gracefully', () => {
  const canvas = createMockCanvas();
  const game = new Game(canvas);

  // Should not throw error with null or non-existent timer
  game.clearEvent(null);
  game.clearEvent({});
  game.clearEvent(undefined);

  // Test passes if no errors thrown
  assert(true);
});

runner.test('Game: clearEvent() can be called inside callback', () => {
  const canvas = createMockCanvas();
  const game = new Game(canvas);

  let count = 0;
  let timer;
  timer = game.every(0.1, () => {
    count++;
    if (count >= 3) {
      game.clearEvent(timer);
    }
  });

  // Execute 3 times
  game.updateTimers(0.1);
  assertEqual(count, 1);

  game.updateTimers(0.1);
  assertEqual(count, 2);

  game.updateTimers(0.1);
  assertEqual(count, 3);

  // Should not execute anymore
  game.updateTimers(0.1);
  assertEqual(count, 3);
});

// ============================
// Multiple Timers Tests
// ============================

runner.test('Game: multiple timers work independently', () => {
  const canvas = createMockCanvas();
  const game = new Game(canvas);

  let count1 = 0;
  let count2 = 0;
  let afterExecuted = false;

  game.every(0.1, () => { count1++; });
  game.every(0.2, () => { count2++; });
  game.after(0.15, () => { afterExecuted = true; });

  game.updateTimers(0.1);
  assertEqual(count1, 1);
  assertEqual(count2, 0);
  assertEqual(afterExecuted, false);

  game.updateTimers(0.1); // 0.2s total
  assertEqual(count1, 2);
  assertEqual(count2, 1);
  assertEqual(afterExecuted, true);

  game.updateTimers(0.1); // 0.3s total
  assertEqual(count1, 3);
  assertEqual(count2, 1);
});

runner.test('Game: clearing one timer does not affect others', () => {
  const canvas = createMockCanvas();
  const game = new Game(canvas);

  let count1 = 0;
  let count2 = 0;

  const timer1 = game.every(0.1, () => { count1++; });
  const timer2 = game.every(0.1, () => { count2++; });

  game.updateTimers(0.1);
  assertEqual(count1, 1);
  assertEqual(count2, 1);

  // Clear only timer1
  game.clearEvent(timer1);

  game.updateTimers(0.1);
  assertEqual(count1, 1); // Should not increase
  assertEqual(count2, 2); // Should continue
});

export { runner };
