const mongoose = require('mongoose');
const setupEnvironment = require('./setupEnvironment');
const { mockOpenAI, mockStripe, mockRedis } = require('../utils/mockServices');

// Configuration de l'environnement de test
setupEnvironment('test');

// Mock des modules externes
jest.mock('../../src/config/openai', () => ({
  openai: mockOpenAI,
}));

jest.mock('../../src/config/stripe', () => mockStripe);

jest.mock('../../src/config/redis', () => ({
  cache: mockRedis,
}));

// Cleanup global après chaque test
afterEach(() => {
  jest.clearAllMocks();
});

// Fermer les connexions après tous les tests
afterAll(async () => {
  await mongoose.disconnect();
});
