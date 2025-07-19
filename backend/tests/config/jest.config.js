const path = require('path');
const rootDir = path.resolve(__dirname, '../..');

module.exports = {
  rootDir,
  testEnvironment: 'node',
  testMatch: ['<rootDir>/tests/**/*.test.js'],
  coveragePathIgnorePatterns: ['node_modules', 'tests'],
  coverageReporters: ['text', 'lcov', 'clover', 'html'],
  testTimeout: 30000,
  setupFilesAfterEnv: [path.join(__dirname, 'jest.setup.js')],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
};
