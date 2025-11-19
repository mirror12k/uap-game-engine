import { readFileSync } from 'fs';

const MAX_DEPS = 12;

const pkg = JSON.parse(readFileSync('./package.json', 'utf8'));
const deps = Object.keys(pkg.dependencies || {});
const devDeps = Object.keys(pkg.devDependencies || {});
const total = deps.length + devDeps.length;

if (total > MAX_DEPS) {
  console.error(`\n❌ ERROR: Cannot install dependencies!`);
  console.error(`   package.json contains ${total} direct dependencies.`);
  console.error(`   Maximum allowed is ${MAX_DEPS}.`);
  console.error(`\n   Please remove ${total - MAX_DEPS} dependency/dependencies before installing.\n`);
  process.exit(1);
}

console.log(`✓ Pre-install check passed (${total}/${MAX_DEPS} dependencies)\n`);
