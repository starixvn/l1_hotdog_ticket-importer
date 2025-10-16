#!/usr/bin/env node

const { execSync } = require('child_process');
const path = require('path');

console.log('🧪 Running Ticket Importer Service Tests...\n');

try {
    // Run unit tests
    console.log('📋 Running Unit Tests...');
    execSync('npm run test', {
        stdio: 'inherit',
        cwd: path.resolve(__dirname, '..'),
    });

    console.log('\n✅ Unit tests completed successfully!');

    // Run e2e tests
    console.log('\n📋 Running E2E Tests...');
    execSync('npm run test:e2e', {
        stdio: 'inherit',
        cwd: path.resolve(__dirname, '..'),
    });

    console.log('\n✅ E2E tests completed successfully!');

    // Generate coverage report
    console.log('\n📊 Generating Coverage Report...');
    execSync('npm run test:cov', {
        stdio: 'inherit',
        cwd: path.resolve(__dirname, '..'),
    });

    console.log('\n🎉 All tests completed successfully!');
    console.log('📈 Coverage report generated in ./coverage directory');
} catch (error) {
    console.error('\n❌ Tests failed:', error.message);
    process.exit(1);
}
