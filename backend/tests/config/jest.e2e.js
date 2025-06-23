const config = require('./jest.config');

module.exports = {
  ...config,
  testMatch: ['<rootDir>/tests/e2e/**/*.test.js'],
  testTimeout: 60000, // E2E tests may take longer
};
