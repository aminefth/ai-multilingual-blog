const dotenv = require('dotenv');
const path = require('path');
const Joi = require('joi');

dotenv.config({ path: path.join(__dirname, '../../.env') });

const envVarsSchema = Joi.object()
  .keys({
    // Node environment
    NODE_ENV: Joi.string().valid('production', 'development', 'test').required(),
    PORT: Joi.number().default(3001),
    API_VERSION: Joi.string().default('v1'),

    // Frontend URL for CORS and redirects
    FRONTEND_URL: Joi.string().default('http://localhost:3000'),

    // Database
    MONGODB_URI: Joi.string().required().description('MongoDB connection string'),
    REDIS_URL: Joi.string().required().description('Redis connection string'),

    // Authentication
    JWT_SECRET: Joi.string().required().description('JWT secret key'),
    JWT_ACCESS_EXPIRATION_MINUTES: Joi.number()
      .default(30)
      .description('minutes after which access tokens expire'),
    JWT_REFRESH_EXPIRATION_DAYS: Joi.number()
      .default(30)
      .description('days after which refresh tokens expire'),
    JWT_RESET_PASSWORD_EXPIRATION_MINUTES: Joi.number()
      .default(10)
      .description('minutes after which reset password token expires'),
    JWT_VERIFY_EMAIL_EXPIRATION_MINUTES: Joi.number()
      .default(10)
      .description('minutes after which verify email token expires'),

    // Email
    SMTP_HOST: Joi.string().description('server that will send the emails'),
    SMTP_PORT: Joi.number().description('port to connect to the email server'),
    SMTP_USERNAME: Joi.string().description('username for email server'),
    SMTP_PASSWORD: Joi.string().description('password for email server'),
    EMAIL_FROM: Joi.string().description('the from field in the emails sent by the app'),

    // AI Services
    OPENAI_API_KEY: Joi.string().description('OpenAI API key for content generation'),
    DEEPL_API_KEY: Joi.string().description('DeepL API key for translations'),

    // Payment
    STRIPE_SECRET_KEY: Joi.string().description('Stripe API secret key'),
    STRIPE_WEBHOOK_SECRET: Joi.string().description('Stripe webhook secret'),
    PRICING_BASIC_PLAN_ID: Joi.string().description('Stripe price ID for basic plan'),
    PRICING_PRO_PLAN_ID: Joi.string().description('Stripe price ID for pro plan'),
    PRICING_ENTERPRISE_PLAN_ID: Joi.string().description('Stripe price ID for enterprise plan'),

    // Storage
    CLOUDFLARE_R2_ENDPOINT: Joi.string().description('Cloudflare R2 endpoint'),
    CLOUDFLARE_R2_ACCESS_KEY_ID: Joi.string().description('Cloudflare R2 access key ID'),
    CLOUDFLARE_R2_SECRET_ACCESS_KEY: Joi.string().description('Cloudflare R2 secret access key'),
    CLOUDFLARE_R2_BUCKET: Joi.string().description('Cloudflare R2 bucket name'),

    // Logging
    LOG_LEVEL: Joi.string()
      .valid('error', 'warn', 'info', 'http', 'verbose', 'debug', 'silly')
      .default('info'),
    SENTRY_DSN: Joi.string().description('Sentry DSN for error tracking'),
  })
  .unknown();

const { value: envVars, error } = envVarsSchema
  .prefs({ errors: { label: 'key' } })
  .validate(process.env);

if (error) {
  throw new Error(`Config validation error: ${error.message}`);
}

module.exports = {
  env: envVars.NODE_ENV,
  port: envVars.PORT,
  apiVersion: envVars.API_VERSION,
  frontendUrl: envVars.FRONTEND_URL,

  mongoose: {
    url: envVars.MONGODB_URI + (envVars.NODE_ENV === 'test' ? '-test' : ''),
    options: {
      // Note: useCreateIndex and useFindAndModify are deprecated in Mongoose 6+
      useNewUrlParser: true,
      useUnifiedTopology: true,
    },
  },

  redis: {
    url: envVars.REDIS_URL,
  },

  jwt: {
    secret: envVars.JWT_SECRET,
    accessExpirationMinutes: envVars.JWT_ACCESS_EXPIRATION_MINUTES,
    refreshExpirationDays: envVars.JWT_REFRESH_EXPIRATION_DAYS,
    resetPasswordExpirationMinutes: envVars.JWT_RESET_PASSWORD_EXPIRATION_MINUTES,
    verifyEmailExpirationMinutes: envVars.JWT_VERIFY_EMAIL_EXPIRATION_MINUTES,
  },
  email: {
    smtp: {
      host: envVars.SMTP_HOST,
      port: envVars.SMTP_PORT,
      auth: {
        user: envVars.SMTP_USERNAME,
        pass: envVars.SMTP_PASSWORD,
      },
    },
    from: envVars.EMAIL_FROM,
  },

  // AI services configuration
  openai: {
    apiKey: envVars.OPENAI_API_KEY,
  },

  deepl: {
    apiKey: envVars.DEEPL_API_KEY,
  },

  // Payment processing
  stripe: {
    secretKey: envVars.STRIPE_SECRET_KEY,
    webhookSecret: envVars.STRIPE_WEBHOOK_SECRET,
    plans: {
      basic: envVars.PRICING_BASIC_PLAN_ID,
      pro: envVars.PRICING_PRO_PLAN_ID,
      enterprise: envVars.PRICING_ENTERPRISE_PLAN_ID,
    },
  },

  // Storage configuration
  storage: {
    cloudflareR2: {
      endpoint: envVars.CLOUDFLARE_R2_ENDPOINT,
      accessKeyId: envVars.CLOUDFLARE_R2_ACCESS_KEY_ID,
      secretAccessKey: envVars.CLOUDFLARE_R2_SECRET_ACCESS_KEY,
      bucket: envVars.CLOUDFLARE_R2_BUCKET,
    },
  },

  // Logging and monitoring
  logging: {
    level: envVars.LOG_LEVEL,
    sentry: {
      dsn: envVars.SENTRY_DSN,
    },
  },

  // Supported languages for content
  languages: ['en', 'fr', 'de', 'es'],
};
