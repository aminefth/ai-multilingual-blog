const crypto = require('crypto');
const httpStatus = require('http-status');
const ApiError = require('../utils/ApiError');
const logger = require('../config/logger');

/**
 * API Key Management and Rotation System
 * Provides secure API key generation, validation, and rotation
 * for webhook authentication and third-party integrations
 */

// In-memory storage for API keys (in production, use Redis or database)
const apiKeys = new Map();

// API key configuration
const API_KEY_CONFIG = {
  keyLength: 64, // API key length in bytes
  rotationInterval: 30 * 24 * 60 * 60 * 1000, // 30 days in milliseconds
  gracePeriod: 7 * 24 * 60 * 60 * 1000, // 7 days grace period for old keys
  maxKeysPerClient: 2, // Maximum active keys per client
};

/**
 * Generate a cryptographically secure API key
 * @returns {string} Generated API key
 */
const generateSecureApiKey = () => {
  const prefix = 'ak_'; // API key prefix for identification
  const randomBytes = crypto.randomBytes(API_KEY_CONFIG.keyLength);
  const key = randomBytes.toString('hex');
  return `${prefix}${key}`;
};

/**
 * Generate API key metadata
 * @param {string} clientId - Client identifier
 * @param {string} purpose - Purpose of the API key
 * @returns {Object} API key metadata
 */
const createApiKeyMetadata = (clientId, purpose = 'general') => {
  const now = Date.now();
  return {
    clientId,
    purpose,
    createdAt: now,
    expiresAt: now + API_KEY_CONFIG.rotationInterval,
    isActive: true,
    lastUsed: null,
    usageCount: 0,
    permissions: ['read', 'write'], // Default permissions
    ipWhitelist: [], // IP restrictions (empty = no restrictions)
  };
};

/**
 * Create new API key for a client
 * @param {string} clientId - Client identifier
 * @param {string} purpose - Purpose of the API key
 * @param {Array} permissions - API permissions
 * @param {Array} ipWhitelist - Allowed IP addresses
 * @returns {Object} API key and metadata
 */
const createApiKey = (
  clientId,
  purpose = 'general',
  permissions = ['read', 'write'],
  ipWhitelist = [],
) => {
  const apiKey = generateSecureApiKey();
  const metadata = createApiKeyMetadata(clientId, purpose);

  metadata.permissions = permissions;
  metadata.ipWhitelist = ipWhitelist;

  // Store API key
  apiKeys.set(apiKey, metadata);

  // Clean up old keys for this client
  cleanupOldKeysForClient(clientId);

  logger.info(`API key created for client: ${clientId}, purpose: ${purpose}`);

  return {
    apiKey,
    metadata: {
      clientId,
      purpose,
      expiresAt: metadata.expiresAt,
      permissions,
    },
  };
};

/**
 * Validate API key and check permissions
 * @param {string} apiKey - API key to validate
 * @param {string} requiredPermission - Required permission
 * @param {string} clientIp - Client IP address
 * @returns {Object|null} Validation result
 */
const validateApiKey = (apiKey, requiredPermission = 'read', clientIp = null) => {
  const metadata = apiKeys.get(apiKey);

  if (!metadata) {
    logger.warn(`Invalid API key attempted: ${apiKey.substring(0, 10)}...`);
    return null;
  }

  // Check if key is active
  if (!metadata.isActive) {
    logger.warn(`Inactive API key used: ${apiKey.substring(0, 10)}...`);
    return null;
  }

  // Check expiration
  if (Date.now() > metadata.expiresAt) {
    logger.warn(`Expired API key used: ${apiKey.substring(0, 10)}...`);
    metadata.isActive = false;
    return null;
  }

  // Check permissions
  if (!metadata.permissions.includes(requiredPermission)) {
    logger.warn(`Insufficient permissions for API key: ${apiKey.substring(0, 10)}...`);
    return null;
  }

  // Check IP whitelist
  if (metadata.ipWhitelist.length > 0 && clientIp && !metadata.ipWhitelist.includes(clientIp)) {
    logger.warn(`IP not whitelisted for API key: ${clientIp}`);
    return null;
  }

  // Update usage statistics
  metadata.lastUsed = Date.now();
  metadata.usageCount += 1;

  logger.info(`API key validated for client: ${metadata.clientId}`);

  return {
    clientId: metadata.clientId,
    purpose: metadata.purpose,
    permissions: metadata.permissions,
  };
};

/**
 * Rotate API key for a client
 * @param {string} oldApiKey - Current API key
 * @returns {Object|null} New API key or null if failed
 */
const rotateApiKey = (oldApiKey) => {
  const oldMetadata = apiKeys.get(oldApiKey);

  if (!oldMetadata) {
    logger.error(`Cannot rotate non-existent API key: ${oldApiKey.substring(0, 10)}...`);
    return null;
  }

  // Create new API key with same metadata
  const newKey = createApiKey(
    oldMetadata.clientId,
    oldMetadata.purpose,
    oldMetadata.permissions,
    oldMetadata.ipWhitelist,
  );

  // Mark old key for grace period
  oldMetadata.isActive = false;
  oldMetadata.gracePeriodEnds = Date.now() + API_KEY_CONFIG.gracePeriod;

  logger.info(`API key rotated for client: ${oldMetadata.clientId}`);

  return newKey;
};

/**
 * Clean up old keys for a client
 * @param {string} clientId - Client identifier
 */
const cleanupOldKeysForClient = (clientId) => {
  const clientKeys = [];

  // Find all keys for this client
  for (const [key, metadata] of apiKeys.entries()) {
    if (metadata.clientId === clientId) {
      clientKeys.push({ key, metadata });
    }
  }

  // Sort by creation date (newest first)
  clientKeys.sort((a, b) => b.metadata.createdAt - a.metadata.createdAt);

  // Keep only the allowed number of keys
  const keysToRemove = clientKeys.slice(API_KEY_CONFIG.maxKeysPerClient);

  for (const { key } of keysToRemove) {
    apiKeys.delete(key);
    logger.info(`Old API key cleaned up for client: ${clientId}`);
  }
};

/**
 * Clean up expired keys and grace period keys
 */
const cleanupExpiredKeys = () => {
  const now = Date.now();
  const keysToDelete = [];

  for (const [key, metadata] of apiKeys.entries()) {
    // Remove expired keys that are past grace period
    if (!metadata.isActive && metadata.gracePeriodEnds && now > metadata.gracePeriodEnds) {
      keysToDelete.push(key);
    }
    // Remove very old active keys (safety cleanup)
    else if (metadata.isActive && now > metadata.expiresAt + API_KEY_CONFIG.gracePeriod) {
      keysToDelete.push(key);
    }
  }

  for (const key of keysToDelete) {
    const metadata = apiKeys.get(key);
    apiKeys.delete(key);
    logger.info(`Expired API key cleaned up for client: ${metadata.clientId}`);
  }

  logger.info(`Cleanup completed: ${keysToDelete.length} keys removed`);
};

/**
 * API key authentication middleware
 * @param {Array} requiredPermissions - Required permissions
 * @returns {Function} Express middleware
 */
const apiKeyAuth = (requiredPermissions = ['read']) => {
  return (req, res, next) => {
    const apiKey = req.headers['x-api-key'] || req.query.api_key;

    if (!apiKey) {
      return next(new ApiError(httpStatus.UNAUTHORIZED, 'API key required'));
    }

    // Check each required permission
    for (const permission of requiredPermissions) {
      const validation = validateApiKey(apiKey, permission, req.ip);

      if (!validation) {
        return next(new ApiError(httpStatus.FORBIDDEN, 'Invalid or insufficient API key'));
      }

      // Attach client info to request
      req.apiClient = validation;
    }

    next();
  };
};

/**
 * Get API key statistics for a client
 * @param {string} clientId - Client identifier
 * @returns {Object} API key statistics
 */
const getApiKeyStats = (clientId) => {
  const clientKeys = [];

  for (const [key, metadata] of apiKeys.entries()) {
    if (metadata.clientId === clientId) {
      clientKeys.push({
        keyId: key.substring(0, 10) + '...',
        purpose: metadata.purpose,
        createdAt: metadata.createdAt,
        expiresAt: metadata.expiresAt,
        isActive: metadata.isActive,
        lastUsed: metadata.lastUsed,
        usageCount: metadata.usageCount,
        permissions: metadata.permissions,
      });
    }
  }

  return {
    clientId,
    totalKeys: clientKeys.length,
    activeKeys: clientKeys.filter((k) => k.isActive).length,
    keys: clientKeys,
  };
};

// Schedule automatic cleanup every hour
setInterval(cleanupExpiredKeys, 60 * 60 * 1000);

module.exports = {
  createApiKey,
  validateApiKey,
  rotateApiKey,
  apiKeyAuth,
  getApiKeyStats,
  cleanupExpiredKeys,
  API_KEY_CONFIG,
};
