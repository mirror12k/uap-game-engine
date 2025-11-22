import { existsSync, readFileSync, readdirSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import esbuild from 'esbuild';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

class StaticDemoTester {
  constructor() {
    this.results = [];
  }

  extractJavaScript(htmlContent) {
    // Extract JavaScript from <script> tags
    const scriptRegex = /<script[^>]*>([\s\S]*?)<\/script>/gi;
    const scripts = [];
    let match;

    while ((match = scriptRegex.exec(htmlContent)) !== null) {
      scripts.push(match[1]);
    }

    return scripts.join('\n\n');
  }

  async analyzeDemo(demoPath, demoName) {
    const errors = [];
    const warnings = [];

    try {
      const fullPath = resolve(__dirname, '..', demoPath);

      if (!existsSync(fullPath)) {
        errors.push(`File not found: ${demoPath}`);
        return { name: demoName, path: demoPath, status: 'FAIL', errors, warnings };
      }

      const content = readFileSync(fullPath, 'utf-8');
      const jsCode = this.extractJavaScript(content);

      if (!jsCode || jsCode.trim().length === 0) {
        errors.push('No JavaScript code found in HTML file');
        return { name: demoName, path: demoPath, status: 'FAIL', errors, warnings };
      }

      // Check for basic HTML structure
      if (!content.includes('<canvas')) {
        warnings.push('No canvas element found in HTML');
      }

      if (!content.includes('id="game"')) {
        warnings.push('No element with id="game" found');
      }

      // Try to parse the JavaScript with esbuild (syntax check)
      try {
        await esbuild.transform(jsCode, {
          loader: 'js',
          target: 'es2020',
          format: 'esm'
        });
      } catch (buildError) {
        errors.push(`JavaScript syntax error: ${buildError.message}`);
      }

      // Check for common issues
      const checks = [
        {
          pattern: /\.getContext\(['"]webgl2?['"]\)/,
          pass: 'WebGL context initialization found',
          fail: 'No WebGL context initialization found'
        },
        {
          pattern: /new\s+Game\s*\(/,
          pass: 'Game instance creation found',
          fail: 'No Game instance creation found'
        },
        {
          pattern: /\.start\s*\(\)/,
          pass: 'Game start call found',
          fail: 'No game start call found'
        },
        {
          pattern: /document\.getElementById\(['"]game['"]\)/,
          pass: 'Canvas element reference found',
          fail: 'No canvas element reference found'
        }
      ];

      for (const check of checks) {
        if (check.pattern.test(jsCode)) {
          // Check passes
        } else {
          warnings.push(check.fail);
        }
      }

      // Check for potential runtime issues
      if (jsCode.includes('undefined.')) {
        warnings.push('Potential undefined reference detected');
      }

      if (jsCode.includes('null.')) {
        warnings.push('Potential null reference detected');
      }

      // Check for use of deprecated Shader constructor vs ShaderManager
      const directShaderUse = (jsCode.match(/new\s+Shader\s*\(/g) || []).length;
      const shaderManagerUse = (jsCode.match(/ShaderManager\.getShader\s*\(/g) || []).length;

      if (directShaderUse > 0 && shaderManagerUse === 0) {
        warnings.push(`Using direct Shader constructor (${directShaderUse} times) instead of ShaderManager`);
      }

      return {
        name: demoName,
        path: demoPath,
        status: errors.length === 0 ? 'PASS' : 'FAIL',
        errors,
        warnings,
        stats: {
          codeSize: jsCode.length,
          htmlSize: content.length,
          directShaderUse,
          shaderManagerUse
        }
      };

    } catch (error) {
      errors.push(`Analysis error: ${error.message}`);
      return {
        name: demoName,
        path: demoPath,
        status: 'FAIL',
        errors,
        warnings
      };
    }
  }

  async runAllDemos() {
    const distDir = resolve(__dirname, '../dist');

    if (!existsSync(distDir)) {
      console.error('Error: dist/ directory not found. Run "npm run build" first.');
      process.exit(1);
    }

    const demoFiles = readdirSync(distDir)
      .filter(file => file.startsWith('demo') && file.endsWith('.html'))
      .sort();

    if (demoFiles.length === 0) {
      console.error('Error: No demo files found in dist/');
      process.exit(1);
    }

    console.log('\n' + '='.repeat(60));
    console.log('STATIC ANALYSIS - DEMO FILES');
    console.log('='.repeat(60));
    console.log(`Found ${demoFiles.length} demo(s) to analyze\n`);

    for (const demoFile of demoFiles) {
      const demoPath = `dist/${demoFile}`;
      process.stdout.write(`Analyzing ${demoFile}... `);

      const result = await this.analyzeDemo(demoPath, demoFile);
      this.results.push(result);

      if (result.status === 'PASS') {
        console.log('✓ PASS');
      } else {
        console.log('✗ FAIL');
      }
    }
  }

  printReport() {
    console.log('\n' + '='.repeat(60));
    console.log('DETAILED ANALYSIS REPORT');
    console.log('='.repeat(60));

    let passCount = 0;
    let failCount = 0;

    for (const result of this.results) {
      console.log(`\n${result.name} - ${result.status}`);
      console.log('-'.repeat(60));

      if (result.stats) {
        console.log(`📊 Statistics:`);
        console.log(`  HTML size: ${(result.stats.htmlSize / 1024).toFixed(2)} KB`);
        console.log(`  JS size: ${(result.stats.codeSize / 1024).toFixed(2)} KB`);
        console.log(`  Shader usage: ${result.stats.shaderManagerUse} ShaderManager, ${result.stats.directShaderUse} direct`);
      }

      if (result.errors.length > 0) {
        console.log(`\n❌ Errors (${result.errors.length}):`);
        result.errors.forEach((error, i) => {
          console.log(`  ${i + 1}. ${error}`);
        });
        failCount++;
      } else {
        console.log('\n✓ No errors detected');
        passCount++;
      }

      if (result.warnings.length > 0) {
        console.log(`\n⚠️  Warnings (${result.warnings.length}):`);
        result.warnings.forEach((warning, i) => {
          console.log(`  ${i + 1}. ${warning}`);
        });
      } else {
        console.log('✓ No warnings');
      }
    }

    console.log('\n' + '='.repeat(60));
    console.log('SUMMARY');
    console.log('='.repeat(60));
    console.log(`Total demos analyzed: ${this.results.length}`);
    console.log(`Passed: ${passCount}`);
    console.log(`Failed: ${failCount}`);
    console.log('='.repeat(60));
    console.log('\nNote: This is static analysis only.');
    console.log('Run "npm run test:browser" for runtime testing in a headless browser.\n');

    return failCount === 0;
  }
}

async function main() {
  const tester = new StaticDemoTester();

  try {
    await tester.runAllDemos();
    const success = tester.printReport();
    process.exit(success ? 0 : 1);
  } catch (error) {
    console.error('\n❌ Fatal error:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

main();
