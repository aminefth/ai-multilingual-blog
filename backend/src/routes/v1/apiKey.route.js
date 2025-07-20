const express = require('express');
const auth = require('../../middlewares/auth');
const {
  createApiKey,
  rotateApiKey,
  getApiKeyStats,
} = require('../../middlewares/apiKey.middleware');
const httpStatus = require('http-status');
const ApiError = require('../../utils/ApiError');

const router = express.Router();

/**
 * @swagger
 * /api-keys:
 *   post:
 *     summary: Create new API key
 *     description: Create a new API key for webhook authentication and third-party integrations (admin only)
 *     tags: [Security]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - clientId
 *               - purpose
 *             properties:
 *               clientId:
 *                 type: string
 *                 description: Client identifier
 *                 example: "stripe_webhooks"
 *               purpose:
 *                 type: string
 *                 description: Purpose of the API key
 *                 example: "webhook_authentication"
 *               permissions:
 *                 type: array
 *                 items:
 *                   type: string
 *                   enum: [read, write, admin]
 *                 description: API permissions
 *                 example: ["read", "write"]
 *               ipWhitelist:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: Allowed IP addresses (empty for no restrictions)
 *                 example: ["192.168.1.1", "10.0.0.1"]
 *     responses:
 *       "201":
 *         description: API key created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 apiKey:
 *                   type: string
 *                   description: Generated API key
 *                   example: "ak_1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef"
 *                 metadata:
 *                   type: object
 *                   properties:
 *                     clientId:
 *                       type: string
 *                       example: "stripe_webhooks"
 *                     purpose:
 *                       type: string
 *                       example: "webhook_authentication"
 *                     expiresAt:
 *                       type: integer
 *                       description: Expiration timestamp
 *                       example: 1706097600000
 *                     permissions:
 *                       type: array
 *                       items:
 *                         type: string
 *                       example: ["read", "write"]
 *       "400":
 *         description: Invalid request data
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       "401":
 *         $ref: '#/components/responses/Unauthorized'
 *       "403":
 *         description: Admin permissions required
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *
 *   get:
 *     summary: Get API key statistics
 *     description: Get API key statistics for the current user or client (admin only)
 *     tags: [Security]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: clientId
 *         schema:
 *           type: string
 *         description: Client identifier to get stats for
 *         example: "stripe_webhooks"
 *     responses:
 *       "200":
 *         description: API key statistics retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 clientId:
 *                   type: string
 *                   example: "stripe_webhooks"
 *                 totalKeys:
 *                   type: integer
 *                   example: 2
 *                 activeKeys:
 *                   type: integer
 *                   example: 1
 *                 keys:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       keyId:
 *                         type: string
 *                         example: "ak_1234567..."
 *                       purpose:
 *                         type: string
 *                         example: "webhook_authentication"
 *                       createdAt:
 *                         type: integer
 *                         example: 1704097600000
 *                       expiresAt:
 *                         type: integer
 *                         example: 1706097600000
 *                       isActive:
 *                         type: boolean
 *                         example: true
 *                       lastUsed:
 *                         type: integer
 *                         example: 1705097600000
 *                       usageCount:
 *                         type: integer
 *                         example: 1247
 *                       permissions:
 *                         type: array
 *                         items:
 *                           type: string
 *                         example: ["read", "write"]
 *       "401":
 *         $ref: '#/components/responses/Unauthorized'
 *       "403":
 *         description: Admin permissions required
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */

// Create new API key
router.post('/', auth('admin'), (req, res, next) => {
  try {
    const { clientId, purpose, permissions = ['read', 'write'], ipWhitelist = [] } = req.body;

    if (!clientId || !purpose) {
      return next(new ApiError(httpStatus.BAD_REQUEST, 'clientId and purpose are required'));
    }

    const result = createApiKey(clientId, purpose, permissions, ipWhitelist);

    res.status(httpStatus.CREATED).json(result);
  } catch (error) {
    next(error);
  }
});

// Get API key statistics
router.get('/', auth('admin'), (req, res, next) => {
  try {
    const { clientId } = req.query;

    if (!clientId) {
      return next(new ApiError(httpStatus.BAD_REQUEST, 'clientId is required'));
    }

    const stats = getApiKeyStats(clientId);

    res.json(stats);
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /api-keys/{keyId}/rotate:
 *   post:
 *     summary: Rotate API key
 *     description: Rotate an existing API key (admin only)
 *     tags: [Security]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: keyId
 *         required: true
 *         schema:
 *           type: string
 *         description: API key to rotate
 *         example: "ak_1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef"
 *     responses:
 *       "200":
 *         description: API key rotated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 apiKey:
 *                   type: string
 *                   description: New API key
 *                   example: "ak_abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890"
 *                 metadata:
 *                   type: object
 *                   properties:
 *                     clientId:
 *                       type: string
 *                       example: "stripe_webhooks"
 *                     purpose:
 *                       type: string
 *                       example: "webhook_authentication"
 *                     expiresAt:
 *                       type: integer
 *                       example: 1706097600000
 *                     permissions:
 *                       type: array
 *                       items:
 *                         type: string
 *                       example: ["read", "write"]
 *                 message:
 *                   type: string
 *                   example: "API key rotated successfully. Old key will remain valid for 7 days."
 *       "400":
 *         description: Invalid API key
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       "401":
 *         $ref: '#/components/responses/Unauthorized'
 *       "403":
 *         description: Admin permissions required
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       "404":
 *         description: API key not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */

// Rotate API key
router.post('/:keyId/rotate', auth('admin'), (req, res, next) => {
  try {
    const { keyId } = req.params;

    const result = rotateApiKey(keyId);

    if (!result) {
      return next(new ApiError(httpStatus.NOT_FOUND, 'API key not found or cannot be rotated'));
    }

    res.json({
      ...result,
      message: 'API key rotated successfully. Old key will remain valid for 7 days.',
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
