const crypto = require('crypto');
const httpStatus = require('http-status');
const ApiError = require('../utils/ApiError');
const logger = require('../config/logger');

/**
 * CSRF Protection Middleware
 * Protects against Cross-Site Request Forgery attacks
 * for state-changing operations (POST, PUT, PATCH, DELETE)
 */

// Store CSRF tokens in memory (in production, use Redis)
const csrfTokens = new Map();

// Token expiration time (15 minutes)
const TOKEN_EXPIRATION = 15 * 60 * 1000;

/**
 * Generate a secure CSRF token
 * @returns {string} CSRF token
 */
const generateCSRFToken = () => {
  return crypto.randomBytes(32).toString('hex');
};

/**
 * Generate CSRF token for a session
 * @param {string} sessionId - Session identifier
 * @returns {string} CSRF token
 */
const createCSRFToken = (sessionId) => {
  const token = generateCSRFToken();
  const expiresAt = Date.now() + TOKEN_EXPIRATION;
  csrfTokens.set(sessionId, {
    token,
    expiresAt,
    used: false,
  });

  // Clean up expired tokens
  cleanupExpiredTokens();

  logger.info(`CSRF token generated for session: ${sessionId}`);
  return token;
};

/**
 * Validate CSRF token
 * @param {string} sessionId - Session identifier
 * @param {string} token - CSRF token to validate
 * @returns {boolean} Token validity
 */
const validateCSRFToken = (sessionId, token) => {
  const storedToken = csrfTokens.get(sessionId);

  if (!storedToken) {
    logger.warn(`CSRF token not found for session: ${sessionId}`);
    return false;
  }

  if (Date.now() > storedToken.expiresAt) {
    csrfTokens.delete(sessionId);
    logger.warn(`CSRF token expired for session: ${sessionId}`);
    return false;
  }

  if (storedToken.used) {
    logger.warn(`CSRF token already used for session: ${sessionId}`);
    return false;
  }

  if (storedToken.token !== token) {
    logger.warn(`Invalid CSRF token for session: ${sessionId}`);
    return false;
  }

  // Mark token as used (one-time use)
  storedToken.used = true;

  logger.info(`CSRF token validated for session: ${sessionId}`);
  return true;
};

/**
 * Clean up expired tokens
 */
const cleanupExpiredTokens = () => {
  const now = Date.now();
  for (const [sessionId, tokenData] of csrfTokens.entries()) {
    if (now > tokenData.expiresAt) {
      csrfTokens.delete(sessionId);
    }
  }
};

/**
 * CSRF protection middleware
 * Validates CSRF tokens for state-changing operations
 */
const csrfProtection = (options = {}) => {
  const {
    methods = ['POST', 'PUT', 'PATCH', 'DELETE'],
    excludePaths = ['/webhooks', '/auth/login', '/auth/register'],
    headerName = 'x-csrf-token',
    cookieName = 'csrf-token',
  } = options;

  return (req, res, next) => {
    // Skip CSRF protection for safe methods
    if (!methods.includes(req.method)) {
      return next();
    }

    // Skip CSRF protection for excluded paths
    if (excludePaths.some((path) => req.path.startsWith(path))) {
      return next();
    }

    // Get session ID (from JWT or session)
    const sessionId = req.user?.id || req.sessionID || req.ip;

    if (!sessionId) {
      logger.warn('CSRF protection: No session ID found');
      return next(new ApiError(httpStatus.UNAUTHORIZED, 'Session required for CSRF protection'));
    }

    // Get CSRF token from header or body
    const csrfToken = req.headers[headerName] || req.body._csrf || req.cookies[cookieName];

    if (!csrfToken) {
      logger.warn(`CSRF protection: No CSRF token provided for ${req.method} ${req.path}`);
      return next(new ApiError(httpStatus.FORBIDDEN, 'CSRF token required'));
    }

    // Validate CSRF token
    if (!validateCSRFToken(sessionId, csrfToken)) {
      logger.warn(`CSRF protection: Invalid token for ${req.method} ${req.path}`);
      return next(new ApiError(httpStatus.FORBIDDEN, 'Invalid or expired CSRF token'));
    }

    next();
  };
};

/**
 * Endpoint to generate CSRF token
 */
const generateCSRFEndpoint = (req, res) => {
  const sessionId = req.user?.id || req.sessionID || req.ip;

  if (!sessionId) {
    return res.status(httpStatus.UNAUTHORIZED).json({
      error: 'Session required to generate CSRF token',
    });
  }

  const token = createCSRFToken(sessionId);

  // Set token in cookie for convenience
  res.cookie('csrf-token', token, {
    httpOnly: false, // Allow JavaScript access for AJAX requests
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: TOKEN_EXPIRATION,
  });

  res.json({
    csrfToken: token,
    expiresIn: TOKEN_EXPIRATION / 1000, // in seconds
  });
};

// Clean up expired tokens every 5 minutes
setInterval(cleanupExpiredTokens, 5 * 60 * 1000);

module.exports = {
  csrfProtection,
  generateCSRFEndpoint,
  createCSRFToken,
  validateCSRFToken,
};
