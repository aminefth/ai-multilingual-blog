module.exports = {
  testEnvironment: 'node',
  testMatch: ['<rootDir>/tests/**/*.test.js'],
  coveragePathIgnorePatterns: ['node_modules', 'tests'],
  coverageReporters: ['text', 'lcov', 'clover', 'html'],
  testTimeout: 30000,
  setupFilesAfterEnv: ['<rootDir>/tests/config/jest.setup.js'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
};
