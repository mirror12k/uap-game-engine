import { readFileSync } from 'fs';

const MAX_DEPS = 12;

const pkg = JSON.parse(readFileSync('./package.json', 'utf8'));
const deps = Object.keys(pkg.dependencies || {});
const devDeps = Object.keys(pkg.devDependencies || {});
const total = deps.length + devDeps.length;

console.log('\n=== Dependency Limit Check ===');
console.log(`Direct dependencies: ${deps.length}`);
if (deps.length > 0) {
  deps.forEach(dep => console.log(`  - ${dep}`));
}

console.log(`\nDirect devDependencies: ${devDeps.length}`);
if (devDeps.length > 0) {
  devDeps.forEach(dep => console.log(`  - ${dep}`));
}

console.log(`\nTotal direct dependencies: ${total}/${MAX_DEPS}`);

if (total > MAX_DEPS) {
  console.error(`\n❌ ERROR: Dependency limit exceeded!`);
  console.error(`   Found ${total} dependencies, maximum allowed is ${MAX_DEPS}.`);
  console.error(`   Remove ${total - MAX_DEPS} dependency/dependencies to continue.`);
  process.exit(1);
}

console.log(`✓ Dependency check passed\n`);
