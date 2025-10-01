#!/usr/bin/env npx tsx

/**
 * @fileoverview Test runner for @monitext/typsert type-level tests
 *
 * This script validates all type-level assertions in the Claude test suite.
 * It imports all test modules, which triggers TypeScript's type checking,
 * and provides runtime feedback about the validation process.
 *
 * Usage:
 *   npx tsx claude-test/run-tests.ts
 *   node -r ts-node/register claude-test/run-tests.ts
 *   npm run test:types (if configured in package.json)
 */

import * as fs from 'fs';
import * as path from 'path';
import { execSync } from 'child_process';

/**
 * Test runner configuration
 */
const CONFIG = {
  testDir: __dirname,
  testPattern: /\.test\.ts$/,
  indexFile: 'index.ts',
  tsConfigPath: '../tsconfig.json',
  verbose: process.argv.includes('--verbose') || process.argv.includes('-v'),
  strictMode: process.argv.includes('--strict'),
  bailOnError: process.argv.includes('--bail'),
} as const;

/**
 * ANSI color codes for terminal output
 */
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
} as const;

/**
 * Logger utility with colored output
 */
const logger = {
  info: (msg: string) => console.log(`${colors.blue}ℹ${colors.reset} ${msg}`),
  success: (msg: string) => console.log(`${colors.green}✓${colors.reset} ${msg}`),
  warning: (msg: string) => console.log(`${colors.yellow}⚠${colors.reset} ${msg}`),
  error: (msg: string) => console.log(`${colors.red}✗${colors.reset} ${msg}`),
  verbose: (msg: string) => CONFIG.verbose && console.log(`${colors.cyan}→${colors.reset} ${msg}`),
  header: (msg: string) => console.log(`\n${colors.bright}${colors.magenta}${msg}${colors.reset}`),
};

/**
 * Test file metadata
 */
interface TestFileInfo {
  name: string;
  path: string;
  size: number;
  description: string;
}

/**
 * Test execution result
 */
interface TestResult {
  file: string;
  success: boolean;
  duration: number;
  error?: string;
  typeErrors?: string[];
}

/**
 * Discover all test files in the directory
 */
function discoverTestFiles(): TestFileInfo[] {
  const files = fs.readdirSync(CONFIG.testDir);
  const testFiles: TestFileInfo[] = [];

  for (const file of files) {
    if (CONFIG.testPattern.test(file)) {
      const filePath = path.join(CONFIG.testDir, file);
      const stats = fs.statSync(filePath);

      // Try to extract description from file content
      let description = 'Type-level tests';
      try {
        const content = fs.readFileSync(filePath, 'utf8');
        const match = content.match(/\/\*\*\s*\n\s*\*\s*(.+?)\s*\n/);
        if (match) description = match[1];
      } catch {
        // Ignore errors reading file description
      }

      testFiles.push({
        name: file,
        path: filePath,
        size: stats.size,
        description,
      });
    }
  }

  return testFiles.sort((a, b) => a.name.localeCompare(b.name));
}

/**
 * Validate TypeScript compilation for a specific file
 */
function validateTypeScript(filePath: string): Promise<TestResult> {
  return new Promise((resolve) => {
    const startTime = Date.now();
    const fileName = path.basename(filePath);

    try {
      logger.verbose(`Validating ${fileName}...`);

      // Use TypeScript compiler to check the file
      const tscCommand = `npx tsc --noEmit --strict ${filePath}`;

      execSync(tscCommand, {
        stdio: 'pipe',
        cwd: CONFIG.testDir,
        timeout: 30000, // 30 second timeout
      });

      const duration = Date.now() - startTime;
      logger.verbose(`${fileName} validated successfully in ${duration}ms`);

      resolve({
        file: fileName,
        success: true,
        duration,
      });

    } catch (error: any) {
      const duration = Date.now() - startTime;
      const errorOutput = error.stdout?.toString() || error.stderr?.toString() || error.message;

      // Parse TypeScript errors
      const typeErrors = parseTypeScriptErrors(errorOutput);

      resolve({
        file: fileName,
        success: false,
        duration,
        error: errorOutput,
        typeErrors,
      });
    }
  });
}

/**
 * Parse TypeScript error output to extract meaningful error messages
 */
function parseTypeScriptErrors(output: string): string[] {
  const errors: string[] = [];
  const lines = output.split('\n');

  for (const line of lines) {
    if (line.includes('error TS')) {
      errors.push(line.trim());
    }
  }

  return errors;
}

/**
 * Run comprehensive type validation
 */
async function runComprehensiveValidation(): Promise<boolean> {
  logger.header('🧪 @monitext/typsert Type Test Suite');
  logger.info('Validating type-level assertions...');

  // First, try to validate the index file which imports everything
  const indexPath = path.join(CONFIG.testDir, CONFIG.indexFile);

  if (fs.existsSync(indexPath)) {
    logger.info('Running comprehensive validation via index file...');

    const indexResult = await validateTypeScript(indexPath);

    if (indexResult.success) {
      logger.success(`All tests passed! (${indexResult.duration}ms)`);
      return true;
    } else {
      logger.error('Index file validation failed');
      if (indexResult.typeErrors && indexResult.typeErrors.length > 0) {
        logger.error('Type errors found:');
        indexResult.typeErrors.forEach(error => {
          logger.error(`  ${error}`);
        });
      }

      if (!CONFIG.bailOnError) {
        logger.warning('Continuing with individual file validation...');
        return runIndividualValidation();
      }

      return false;
    }
  } else {
    logger.warning('Index file not found, running individual file validation...');
    return runIndividualValidation();
  }
}

/**
 * Run validation on individual test files
 */
async function runIndividualValidation(): Promise<boolean> {
  const testFiles = discoverTestFiles();

  if (testFiles.length === 0) {
    logger.warning('No test files found!');
    return false;
  }

  logger.info(`Found ${testFiles.length} test files`);

  if (CONFIG.verbose) {
    testFiles.forEach(file => {
      logger.verbose(`  ${file.name} (${file.size} bytes) - ${file.description}`);
    });
  }

  const results: TestResult[] = [];
  let totalDuration = 0;

  // Run tests sequentially to avoid overwhelming the system
  for (const testFile of testFiles) {
    const result = await validateTypeScript(testFile.path);
    results.push(result);
    totalDuration += result.duration;

    if (result.success) {
      logger.success(`${result.file} (${result.duration}ms)`);
    } else {
      logger.error(`${result.file} (${result.duration}ms)`);

      if (result.typeErrors && result.typeErrors.length > 0 && CONFIG.verbose) {
        result.typeErrors.slice(0, 3).forEach(error => {
          logger.error(`    ${error}`);
        });

        if (result.typeErrors.length > 3) {
          logger.error(`    ... and ${result.typeErrors.length - 3} more errors`);
        }
      }

      if (CONFIG.bailOnError) {
        logger.error('Stopping due to --bail flag');
        break;
      }
    }
  }

  // Summary
  const passed = results.filter(r => r.success).length;
  const failed = results.filter(r => r.success === false).length;

  logger.header('📊 Test Results Summary');
  logger.info(`Total files: ${results.length}`);
  logger.info(`Passed: ${colors.green}${passed}${colors.reset}`);
  logger.info(`Failed: ${colors.red}${failed}${colors.reset}`);
  logger.info(`Total time: ${totalDuration}ms`);

  if (failed > 0) {
    logger.error('\nFailed tests:');
    results
      .filter(r => !r.success)
      .forEach(result => {
        logger.error(`  ${result.file}`);
      });
  }

  return failed === 0;
}

/**
 * Display help information
 */
function displayHelp(): void {
  logger.header('📖 @monitext/typsert Type Test Runner');
  console.log(`
Usage: npx tsx run-tests.ts [options]

Options:
  --verbose, -v     Show detailed output during test execution
  --strict          Use strict TypeScript checking mode
  --bail            Stop on first test failure
  --help, -h        Show this help message

Examples:
  npx tsx run-tests.ts                    # Run all tests with minimal output
  npx tsx run-tests.ts --verbose          # Run with detailed logging
  npx tsx run-tests.ts --bail --verbose   # Stop on first failure with details

Description:
  This script validates all type-level assertions in the @monitext/typsert
  test suite. It uses the TypeScript compiler to check that all type
  expressions resolve correctly at compile time.

  The tests verify that:
  - Type assignability works correctly
  - Type equality checks are accurate
  - Boolean logic operations behave properly
  - Assertion utilities function as expected
  - Complex type relationships are handled properly

Exit Codes:
  0    All tests passed
  1    Some tests failed
  2    Configuration or runtime error
`);
}

/**
 * Main execution function
 */
async function main(): Promise<void> {
  // Handle command line arguments
  if (process.argv.includes('--help') || process.argv.includes('-h')) {
    displayHelp();
    process.exit(0);
  }

  const startTime = Date.now();

  try {
    // Check if we're in the right directory
    const packageJsonPath = path.join(CONFIG.testDir, '../package.json');
    if (!fs.existsSync(packageJsonPath)) {
      logger.error('Could not find package.json. Make sure you\'re in the typsert directory.');
      process.exit(2);
    }

    // Verify TypeScript is available
    try {
      execSync('npx tsc --version', { stdio: 'pipe' });
    } catch {
      logger.error('TypeScript compiler not found. Please install TypeScript.');
      process.exit(2);
    }

    // Run the tests
    const success = await runComprehensiveValidation();

    const totalTime = Date.now() - startTime;

    if (success) {
      logger.header('🎉 All Type Tests Passed!');
      logger.success(`Test suite completed successfully in ${totalTime}ms`);
      logger.info('Your @monitext/typsert utilities are working correctly! 🚀');
      process.exit(0);
    } else {
      logger.header('❌ Some Tests Failed');
      logger.error(`Test suite completed with failures in ${totalTime}ms`);
      logger.error('Please review the errors above and fix the failing assertions.');
      process.exit(1);
    }

  } catch (error) {
    logger.error(`Unexpected error: ${error}`);
    process.exit(2);
  }
}

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  logger.error(`Uncaught exception: ${error.message}`);
  process.exit(2);
});

process.on('unhandledRejection', (reason) => {
  logger.error(`Unhandled rejection: ${reason}`);
  process.exit(2);
});

// Run the main function if this script is executed directly
if (require.main === module) {
  main().catch((error) => {
    logger.error(`Fatal error: ${error}`);
    process.exit(2);
  });
}

// Export for programmatic use
export { runComprehensiveValidation, discoverTestFiles, validateTypeScript };
export type { TestResult, TestFileInfo };
