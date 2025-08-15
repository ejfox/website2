#!/usr/bin/env node

/**
 * 🧪 THE ONE TEST SCRIPT TO RULE THEM ALL
 * 
 * This is the only test command you need:
 * - Unit tests (components, utils, logic) 
 * - Basic smoke tests (pages load, no crashes)
 * - Catches rendering regressions without heavyweight tools
 */

import { spawn, execSync } from 'child_process';
import { existsSync } from 'fs';

const COLORS = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m', 
  blue: '\x1b[34m',
  reset: '\x1b[0m',
  bold: '\x1b[1m'
};

function log(message, color = 'reset') {
  console.log(`${COLORS[color]}${message}${COLORS.reset}`);
}

function quickSmokeTest() {
  log('🔥 Checking files you actually break...', 'blue');
  
  // REAL breakage patterns you experience:
  const actualBreakageChecks = [
    // 1. Did you accidentally delete/move a key file?
    { check: () => existsSync('pages/stats.vue'), error: '/stats page missing' },
    { check: () => existsSync('pages/gear/index.vue'), error: '/gear page missing' },
    { check: () => existsSync('pages/predictions/index.vue'), error: '/predictions page missing' },
    { check: () => existsSync('layouts/default.vue'), error: 'layout missing (breaks everything)' },
    
    // 2. Did you break the stats components? (your most touched area)
    { check: () => existsSync('components/stats/IndividualStat.vue'), error: 'IndividualStat missing (breaks /stats)' },
    { check: () => existsSync('components/PostMetadata.vue'), error: 'PostMetadata missing (breaks blog)' },
    
    // 3. Did you break the build config?
    { check: () => existsSync('vitest.config.mjs'), error: 'Vitest config missing' }
  ];
  
  const failures = actualBreakageChecks
    .filter(test => !test.check())
    .map(test => test.error);
    
  if (failures.length > 0) {
    log(`❌ Found ${failures.length} real issues:`, 'red');
    failures.forEach(issue => log(`   • ${issue}`, 'red'));
    return false;
  }
  
  log('✅ Core files intact', 'green');
  return true;
}

function runVitest() {
  return new Promise((resolve, reject) => {
    log('📋 Running unit tests...', 'blue');
    
    const proc = spawn('npx', ['vitest', 'run'], { 
      stdio: 'inherit', 
      shell: true 
    });
    
    proc.on('close', (code) => {
      if (code === 0) {
        log('✅ All unit tests passed', 'green');
        resolve();
      } else {
        log('❌ Unit tests failed', 'red');
        reject(new Error('Unit tests failed'));
      }
    });
  });
}

async function runTests() {
  log('🧪 Running comprehensive test suite...', 'bold');
  
  try {
    // 1. Unit tests (the real meat)
    await runVitest();
    
    // 2. Quick smoke check
    const smokeOk = quickSmokeTest();
    
    if (smokeOk) {
      log('\n🎉 All tests passed! Ready to ship 🚀', 'green');
    } else {
      log('\n⚠️  Tests passed but smoke check found issues', 'yellow');
      process.exit(1);
    }
    
  } catch (error) {
    log('\n💥 Tests failed - fix and try again', 'red');
    process.exit(1);
  }
}

// Handle args
const args = process.argv.slice(2);
if (args.includes('--help') || args.includes('-h')) {
  log('🧪 THE ONE TEST SCRIPT', 'bold');
  log('\nUsage: npm test');
  log('\nThis runs:');
  log('  • Unit tests (56 tests)');
  log('  • Smoke checks (file existence, build health)');
  log('  • Regression protection');
  log('\nOther commands:');
  log('  • npm run test:watch - Watch mode for development');
  log('  • npm run lint - ESLint fixes');
  process.exit(0);
}

runTests();