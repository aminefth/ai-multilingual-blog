const { version } = require('../../package.json');
const config = require('../config/config');

const swaggerDef = {
  openapi: '3.0.0',
  info: {
    title: 'AI Multilingual Blog API',
    version,
    description:
      'A comprehensive REST API for AI-powered multilingual blog platform with monetization features',
    contact: {
      name: 'AI Tools Blog Team',
      email: 'support@ai-tools-blog.com',
    },
    license: {
      name: 'MIT',
      url: 'https://opensource.org/licenses/MIT',
    },
  },
  servers: [
    {
      url: `http://localhost:${config.port}/v1`,
      description: 'Development server',
    },
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
      },
      apiKeyAuth: {
        type: 'apiKey',
        in: 'header',
        name: 'X-API-Key',
        description: 'API Key authentication for external integrations',
      },
      webhookSignature: {
        type: 'apiKey',
        in: 'header',
        name: 'X-Webhook-Signature',
        description: 'HMAC signature for webhook verification (provider-specific)',
      },
    },
  },
  security: [
    {
      bearerAuth: [],
    },
  ],
};

module.exports = swaggerDef;
