const crypto = require('crypto');
const httpStatus = require('http-status');
const ApiError = require('../utils/ApiError');
const logger = require('../config/logger');

/**
 * Webhook Signature Verification System
 * Provides secure webhook authentication using HMAC signatures
 * Compatible with Stripe, GitHub, and other webhook providers
 */

// Webhook signature configuration
const WEBHOOK_CONFIG = {
  signatureHeader: 'x-webhook-signature',
  timestampHeader: 'x-webhook-timestamp',
  toleranceWindow: 5 * 60 * 1000, // 5 minutes tolerance for timestamp
  algorithm: 'sha256',
  encoding: 'hex',
};

// Webhook secrets storage (in production, use secure key management)
const webhookSecrets = new Map();

/**
 * Register webhook secret for a provider
 * @param {string} provider - Webhook provider (e.g., 'stripe', 'github')
 * @param {string} secret - Webhook secret
 * @param {Object} options - Additional configuration
 */
const registerWebhookSecret = (provider, secret, options = {}) => {
  webhookSecrets.set(provider, {
    secret,
    algorithm: options.algorithm || WEBHOOK_CONFIG.algorithm,
    encoding: options.encoding || WEBHOOK_CONFIG.encoding,
    toleranceWindow: options.toleranceWindow || WEBHOOK_CONFIG.toleranceWindow,
    signatureHeader: options.signatureHeader || WEBHOOK_CONFIG.signatureHeader,
    timestampHeader: options.timestampHeader || WEBHOOK_CONFIG.timestampHeader,
  });

  logger.info(`Webhook secret registered for provider: ${provider}`);
};

/**
 * Generate HMAC signature for webhook payload
 * @param {string} payload - Webhook payload
 * @param {string} secret - Webhook secret
 * @param {string} algorithm - Hash algorithm
 * @param {string} encoding - Encoding format
 * @returns {string} Generated signature
 */
const generateWebhookSignature = (payload, secret, algorithm = 'sha256', encoding = 'hex') => {
  const hmac = crypto.createHmac(algorithm, secret);
  hmac.update(payload, 'utf8');
  return hmac.digest(encoding);
};

/**
 * Generate Stripe-compatible signature
 * @param {string} payload - Webhook payload
 * @param {string} secret - Webhook secret
 * @param {number} timestamp - Unix timestamp
 * @returns {string} Stripe signature format
 */
const generateStripeSignature = (payload, secret, timestamp) => {
  const signedPayload = `${timestamp}.${payload}`;
  const signature = generateWebhookSignature(signedPayload, secret);
  return `t=${timestamp},v1=${signature}`;
};

/**
 * Verify webhook signature (internal function)
 * @param {string} payload - Webhook payload
 * @param {string} signature - Received signature
 * @param {string} secret - Webhook secret
 * @param {Object} options - Verification options
 * @returns {boolean} Signature validity
 */
const verifySignatureInternal = (payload, signature, secret, options = {}) => {
  const {
    algorithm = WEBHOOK_CONFIG.algorithm,
    encoding = WEBHOOK_CONFIG.encoding,
    format = 'simple', // 'simple' or 'stripe'
  } = options;

  try {
    if (format === 'stripe') {
      return verifyStripeSignature(payload, signature, secret, options);
    }

    // Simple HMAC verification
    const expectedSignature = generateWebhookSignature(payload, secret, algorithm, encoding);

    // Use timing-safe comparison to prevent timing attacks
    return crypto.timingSafeEqual(
      Buffer.from(signature, encoding),
      Buffer.from(expectedSignature, encoding),
    );
  } catch (error) {
    logger.error('Webhook signature verification error:', error);
    return false;
  }
};

/**
 * Verify Stripe webhook signature
 * @param {string} payload - Webhook payload
 * @param {string} stripeSignature - Stripe signature header
 * @param {string} secret - Webhook secret
 * @param {Object} options - Verification options
 * @returns {boolean} Signature validity
 */
const verifyStripeSignature = (payload, stripeSignature, secret, options = {}) => {
  const { toleranceWindow = WEBHOOK_CONFIG.toleranceWindow } = options;

  try {
    // Parse Stripe signature format: t=timestamp,v1=signature
    const elements = stripeSignature.split(',');
    const signature = {};

    for (const element of elements) {
      const [key, value] = element.split('=');
      signature[key] = value;
    }

    if (!signature.t || !signature.v1) {
      logger.warn('Invalid Stripe signature format');
      return false;
    }

    const timestamp = parseInt(signature.t, 10);
    const receivedSignature = signature.v1;

    // Check timestamp tolerance
    const now = Math.floor(Date.now() / 1000);
    if (Math.abs(now - timestamp) > toleranceWindow / 1000) {
      logger.warn(`Webhook timestamp outside tolerance window: ${timestamp}`);
      return false;
    }

    // Verify signature
    const signedPayload = `${timestamp}.${payload}`;
    const expectedSignature = generateWebhookSignature(signedPayload, secret);

    return crypto.timingSafeEqual(
      Buffer.from(receivedSignature, 'hex'),
      Buffer.from(expectedSignature, 'hex'),
    );
  } catch (error) {
    logger.error('Stripe signature verification error:', error);
    return false;
  }
};

/**
 * Webhook signature verification middleware
 * @param {string} provider - Webhook provider
 * @param {Object} options - Middleware options
 * @returns {Function} Express middleware
 */
const verifyWebhookSignature = (provider, _options = {}) => {
  return (req, res, next) => {
    const providerConfig = webhookSecrets.get(provider);

    if (!providerConfig) {
      logger.error(`No webhook secret configured for provider: ${provider}`);
      return next(new ApiError(httpStatus.INTERNAL_SERVER_ERROR, 'Webhook configuration error'));
    }

    // Get signature from headers
    const signature =
      req.headers[providerConfig.signatureHeader] ||
      req.headers['x-hub-signature-256'] || // GitHub
      req.headers['stripe-signature']; // Stripe

    if (!signature) {
      logger.warn(`Missing webhook signature for provider: ${provider}`);
      return next(new ApiError(httpStatus.UNAUTHORIZED, 'Webhook signature required'));
    }

    // Get raw payload (must be raw buffer for signature verification)
    const payload = req.rawBody || req.body;

    if (!payload) {
      logger.warn('Missing webhook payload for signature verification');
      return next(new ApiError(httpStatus.BAD_REQUEST, 'Webhook payload required'));
    }

    // Convert payload to string if it's a buffer
    const payloadString = Buffer.isBuffer(payload)
      ? payload.toString('utf8')
      : JSON.stringify(payload);

    // Determine signature format based on provider
    const format = provider === 'stripe' ? 'stripe' : 'simple';

    // Verify signature
    const isValid = verifySignatureInternal(payloadString, signature, providerConfig.secret, {
      algorithm: providerConfig.algorithm,
      encoding: providerConfig.encoding,
      format,
      toleranceWindow: providerConfig.toleranceWindow,
    });

    if (!isValid) {
      logger.warn(`Invalid webhook signature for provider: ${provider}`);
      return next(new ApiError(httpStatus.UNAUTHORIZED, 'Invalid webhook signature'));
    }

    // Attach provider info to request
    req.webhookProvider = provider;
    req.webhookVerified = true;

    logger.info(`Webhook signature verified for provider: ${provider}`);
    next();
  };
};

/**
 * Raw body parser middleware for webhook signature verification
 * Required to preserve raw payload for signature verification
 */
const rawBodyParser = (req, res, next) => {
  if (req.headers['content-type'] === 'application/json') {
    let data = '';

    req.on('data', (chunk) => {
      data += chunk;
    });

    req.on('end', () => {
      req.rawBody = Buffer.from(data, 'utf8');
      try {
        req.body = JSON.parse(data);
      } catch (error) {
        req.body = data;
      }
      next();
    });
  } else {
    next();
  }
};

/**
 * Initialize webhook secrets from environment variables
 */
const initializeWebhookSecrets = () => {
  // Stripe webhook secret
  if (process.env.STRIPE_WEBHOOK_SECRET) {
    registerWebhookSecret('stripe', process.env.STRIPE_WEBHOOK_SECRET, {
      format: 'stripe',
      signatureHeader: 'stripe-signature',
    });
  }

  // GitHub webhook secret
  if (process.env.GITHUB_WEBHOOK_SECRET) {
    registerWebhookSecret('github', process.env.GITHUB_WEBHOOK_SECRET, {
      signatureHeader: 'x-hub-signature-256',
    });
  }

  // Custom webhook secret
  if (process.env.CUSTOM_WEBHOOK_SECRET) {
    registerWebhookSecret('custom', process.env.CUSTOM_WEBHOOK_SECRET);
  }

  logger.info('Webhook secrets initialized from environment variables');
};

/**
 * Get webhook verification statistics
 * @returns {Object} Verification statistics
 */
const getWebhookStats = () => {
  const providers = Array.from(webhookSecrets.keys());

  return {
    configuredProviders: providers,
    totalProviders: providers.length,
    supportedFormats: ['simple', 'stripe', 'github'],
    securityFeatures: [
      'HMAC signature verification',
      'Timestamp validation',
      'Timing-safe comparison',
      'Multiple provider support',
    ],
  };
};

// Initialize webhook secrets on module load
initializeWebhookSecrets();

module.exports = {
  registerWebhookSecret,
  generateWebhookSignature,
  generateStripeSignature,
  verifyWebhookSignature,
  verifyStripeSignature,
  rawBodyParser,
  getWebhookStats,
  WEBHOOK_CONFIG,
};
