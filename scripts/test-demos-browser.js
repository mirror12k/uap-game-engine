import puppeteer from 'puppeteer';
import { existsSync, readdirSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const DEMO_TIMEOUT = 5000; // Run each demo for 5 seconds
const LAUNCH_TIMEOUT = 30000; // 30 seconds to launch browser

class DemoTester {
  constructor() {
    this.results = [];
    this.browser = null;
  }

  async init() {
    console.log('Launching headless browser...\n');
    try {
      this.browser = await puppeteer.launch({
        headless: 'new',
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-gpu',
          '--disable-software-rasterizer',
          '--disable-dev-tools',
          '--no-first-run',
          '--no-zygote',
          '--single-process'
        ],
        timeout: LAUNCH_TIMEOUT
      });
    } catch (error) {
      console.error('❌ Failed to launch browser:', error.message);
      console.error('\nThis may be due to missing system libraries.');
      console.error('On Linux, you may need to install:');
      console.error('  - libnspr4, libnss3, libatk-bridge2.0-0, libdrm2, libxkbcommon0');
      console.error('  - libgbm1, libasound2, libatspi2.0-0, libxcomposite1');
      console.error('\nFor CI/Docker environments, consider using:');
      console.error('  - puppeteer with --no-sandbox');
      console.error('  - playwright (has better Docker support)');
      console.error('  - XVFB for virtual display\n');
      throw error;
    }
  }

  async testDemo(demoPath, demoName) {
    const page = await this.browser.newPage();
    const consoleMessages = [];
    const errors = [];
    const warnings = [];

    // Capture console messages
    page.on('console', msg => {
      const type = msg.type();
      const text = msg.text();

      consoleMessages.push({ type, text });

      if (type === 'error') {
        errors.push(text);
      } else if (type === 'warning') {
        warnings.push(text);
      }
    });

    // Capture page errors
    page.on('pageerror', error => {
      errors.push(`Page Error: ${error.message}`);
    });

    // Capture request failures
    page.on('requestfailed', request => {
      errors.push(`Request Failed: ${request.url()} - ${request.failure().errorText}`);
    });

    try {
      // Load the demo
      const fullPath = resolve(__dirname, '..', demoPath);
      await page.goto(`file://${fullPath}`, {
        waitUntil: 'networkidle0',
        timeout: 10000
      });

      // Wait for canvas to be ready
      await page.waitForSelector('canvas', { timeout: 5000 });

      // Let the demo run for a bit
      await new Promise(resolve => setTimeout(resolve, DEMO_TIMEOUT));

      // Check if WebGL context was created
      const webglCheck = await page.evaluate(() => {
        const canvas = document.getElementById('game');
        if (!canvas) return { success: false, error: 'Canvas not found' };

        const gl = canvas.getContext('webgl2') || canvas.getContext('webgl');
        if (!gl) return { success: false, error: 'WebGL context not available' };

        return {
          success: true,
          width: canvas.width,
          height: canvas.height,
          vendor: gl.getParameter(gl.VENDOR),
          renderer: gl.getParameter(gl.RENDERER)
        };
      });

      this.results.push({
        name: demoName,
        path: demoPath,
        status: errors.length === 0 ? 'PASS' : 'FAIL',
        errors,
        warnings,
        consoleMessages,
        webglCheck
      });

    } catch (error) {
      errors.push(`Test Error: ${error.message}`);
      this.results.push({
        name: demoName,
        path: demoPath,
        status: 'FAIL',
        errors,
        warnings,
        consoleMessages,
        webglCheck: { success: false, error: error.message }
      });
    } finally {
      await page.close();
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

    console.log(`Found ${demoFiles.length} demo(s) to test\n`);
    console.log('='.repeat(60));

    for (const demoFile of demoFiles) {
      const demoPath = `dist/${demoFile}`;
      console.log(`\nTesting: ${demoFile}...`);

      try {
        await this.testDemo(demoPath, demoFile);
        const result = this.results[this.results.length - 1];

        if (result.status === 'PASS') {
          console.log(`✓ ${demoFile} - PASSED`);
        } else {
          console.log(`✗ ${demoFile} - FAILED`);
        }
      } catch (error) {
        console.log(`✗ ${demoFile} - ERROR: ${error.message}`);
      }
    }

    console.log('\n' + '='.repeat(60));
  }

  async printReport() {
    console.log('\n');
    console.log('='.repeat(60));
    console.log('DETAILED TEST REPORT');
    console.log('='.repeat(60));

    let passCount = 0;
    let failCount = 0;

    for (const result of this.results) {
      console.log(`\n${result.name} - ${result.status}`);
      console.log('-'.repeat(60));

      if (result.webglCheck.success) {
        console.log(`✓ WebGL initialized successfully`);
        console.log(`  Canvas: ${result.webglCheck.width}x${result.webglCheck.height}`);
        console.log(`  Vendor: ${result.webglCheck.vendor}`);
        console.log(`  Renderer: ${result.webglCheck.renderer}`);
      } else {
        console.log(`✗ WebGL initialization failed: ${result.webglCheck.error}`);
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
      }

      // Show last few console messages for context
      const logs = result.consoleMessages.filter(m => m.type === 'log');
      if (logs.length > 0) {
        console.log(`\nℹ️  Console output (last ${Math.min(3, logs.length)} messages):`);
        logs.slice(-3).forEach(msg => {
          console.log(`  ${msg.text}`);
        });
      }
    }

    console.log('\n' + '='.repeat(60));
    console.log('SUMMARY');
    console.log('='.repeat(60));
    console.log(`Total demos tested: ${this.results.length}`);
    console.log(`Passed: ${passCount}`);
    console.log(`Failed: ${failCount}`);
    console.log('='.repeat(60));

    return failCount === 0;
  }

  async cleanup() {
    if (this.browser) {
      await this.browser.close();
    }
  }
}

async function main() {
  const tester = new DemoTester();

  try {
    await tester.init();
    await tester.runAllDemos();
    const success = await tester.printReport();
    await tester.cleanup();

    process.exit(success ? 0 : 1);
  } catch (error) {
    console.error('\n❌ Fatal error:', error.message);
    console.error(error.stack);
    await tester.cleanup();
    process.exit(1);
  }
}

main();
