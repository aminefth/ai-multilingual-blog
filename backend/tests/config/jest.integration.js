const config = require('./jest.config');

module.exports = {
  ...config,
  testMatch: ['<rootDir>/tests/integration/**/*.test.js'],
  collectCoverageFrom: ['src/controllers/**/*.js', 'src/routes/**/*.js', 'src/middlewares/**/*.js'],
};
