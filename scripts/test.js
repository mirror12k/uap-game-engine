import { TestRunner, assert } from '../src/engine/TestRunner.js';
import { runner as cameraTests } from '../tests/Camera.test.js';
import { runner as shaderManagerTests } from '../tests/ShaderManager.test.js';
import { runner as gameTests } from '../tests/Game.test.js';

const runner = new TestRunner();

runner.test('Dependency count check', async () => {
  const { readFileSync } = await import('fs');
  const pkg = JSON.parse(readFileSync('./package.json', 'utf8'));
  const deps = Object.keys(pkg.dependencies || {}).length;
  const devDeps = Object.keys(pkg.devDependencies || {}).length;
  const total = deps + devDeps;

  assert(total <= 12, `Dependency limit exceeded: ${total}/12`);
});

runner.test('Only direct dependencies counted', async () => {
  const { readFileSync } = await import('fs');
  const pkg = JSON.parse(readFileSync('./package.json', 'utf8'));
  const lockfile = JSON.parse(readFileSync('./package-lock.json', 'utf8'));

  const directCount = Object.keys(pkg.dependencies || {}).length +
                      Object.keys(pkg.devDependencies || {}).length;
  const totalInLockfile = Object.keys(lockfile.packages || {}).length;

  assert(totalInLockfile > directCount, 'Lockfile should contain transitive deps');
  assert(directCount <= 12, 'Only direct dependencies should count toward limit');
});

// Run all test suites
(async () => {
  console.log('=================================');
  console.log('Running Camera Tests');
  console.log('=================================\n');
  await cameraTests.run();

  console.log('\n=================================');
  console.log('Running ShaderManager Tests');
  console.log('=================================\n');
  await shaderManagerTests.run();

  console.log('\n=================================');
  console.log('Running Game Tests');
  console.log('=================================\n');
  await gameTests.run();

  console.log('\n=================================');
  console.log('Running Dependency Tests');
  console.log('=================================\n');
  await runner.run();
})();
