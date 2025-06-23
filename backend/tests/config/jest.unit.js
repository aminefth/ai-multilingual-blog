const config = require('./jest.config');

module.exports = {
  ...config,
  testMatch: ['<rootDir>/tests/unit/**/*.test.js'],
  collectCoverageFrom: ['src/**/*.js', '!src/index.js', '!src/app.js'],
};
