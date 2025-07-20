const express = require('express');
const { generateCSRFEndpoint } = require('../../middlewares/csrf.middleware');
const auth = require('../../middlewares/auth');

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Security
 *   description: Security endpoints for CSRF protection, API keys, and webhooks
 */

/**
 * @swagger
 * /csrf/token:
 *   get:
 *     summary: Generate CSRF token
 *     description: |
 *       Generate a secure CSRF token for protecting state-changing operations.
 *       This token must be included in subsequent POST, PUT, PATCH, and DELETE requests
 *       to prevent Cross-Site Request Forgery attacks.
 *
 *       **Usage:**
 *       - Include the token in the `X-CSRF-Token` header
 *       - Or include it in the request body as `_csrf`
 *       - Token expires after 1 hour
 *     tags: [Security]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       "200":
 *         description: CSRF token generated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 csrfToken:
 *                   type: string
 *                   description: CSRF token for request validation
 *                   example: "a1b2c3d4e5f6789012345678901234567890abcdef1234567890abcdef123456"
 *                 expiresIn:
 *                   type: integer
 *                   description: Token expiration time in seconds
 *                   example: 3600
 *       "401":
 *         $ref: '#/components/responses/Unauthorized'
 *     examples:
 *       -
 *         summary: Successful response with CSRF token
 *         value:
 *           csrfToken: "a1b2c3d4e5f6789012345678901234567890abcdef1234567890abcdef123456"
 *           expiresIn: 3600
 *       -
 *         summary: Error response with invalid authentication
 *         value:
 *           error: "Unauthorized"
 *           message: "Invalid authentication credentials"
 */
router.get('/token', auth(), generateCSRFEndpoint);

module.exports = router;
