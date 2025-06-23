const dotenv = require('dotenv');
const path = require('path');

// Charge les variables d'environnement appropriées
const setupEnvironment = (env = 'test') => {
  // Configuration par défaut pour tous les environnements
  process.env.NODE_ENV = env;

  // Chargement du fichier .env spécifique à l'environnement
  const envPath = path.resolve(__dirname, `../config/${env}.env`);
  dotenv.config({ path: envPath });

  // Overrides spécifiques par environnement
  switch (env) {
    case 'test':
      process.env.MONGODB_URL = process.env.MONGODB_URL || 'mongodb://localhost:27017/ai-blog-test';
      process.env.JWT_SECRET = 'test-jwt-secret';
      process.env.JWT_ACCESS_EXPIRATION_MINUTES = 15;
      process.env.REDIS_HOST = process.env.REDIS_HOST || 'localhost';
      process.env.STRIPE_KEY = 'test_stripe_key';
      process.env.OPENAI_API_KEY = 'sk-test-openai-key';
      break;
    case 'dev':
      process.env.MONGODB_URL = process.env.MONGODB_URL || 'mongodb://localhost:27017/ai-blog-dev';
      break;
    case 'staging':
      // Variables spécifiques à l'environnement de staging
      break;
    case 'production':
      // Pas d'override pour la production, utiliser uniquement les variables .env
      if (process.env.NODE_ENV === 'production' && !process.env.PRODUCTION_CONFIRMATION) {
        throw new Error('Tests de production non autorisés sans confirmation explicite');
      }
      break;
  }
};

module.exports = setupEnvironment;
