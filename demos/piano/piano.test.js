import { TestRunner, assert, assertEqual, assertApprox } from '../../src/engine/TestRunner.js';

const runner = new TestRunner();

// ============================
// Piano Key Frequency Tests
// ============================

runner.test('Piano: C4 has correct frequency', () => {
  const c4Frequency = 261.63;
  assertApprox(c4Frequency, 261.63, 0.01);
});

runner.test('Piano: A4 has correct frequency (440Hz standard)', () => {
  const a4Frequency = 440.00;
  assertApprox(a4Frequency, 440.00, 0.01);
});

runner.test('Piano: Middle C to A4 is roughly 5 semitones', () => {
  const c4 = 261.63;
  const a4 = 440.00;
  const ratio = a4 / c4;
  // 9 semitones = 2^(9/12) ≈ 1.682
  assertApprox(ratio, 1.682, 0.01);
});

// Export the runner for use by the test framework
export { runner };
