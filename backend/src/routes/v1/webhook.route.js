const express = require('express');
const auth = require('../../middlewares/auth');
const {
  verifyWebhookSignature,
  rawBodyParser,
  getWebhookStats,
} = require('../../middlewares/webhookSignature.middleware');
const { apiKeyAuth } = require('../../middlewares/apiKey.middleware');
const httpStatus = require('http-status');
const logger = require('../../config/logger');

const router = express.Router();

/**
 * @swagger
 * /webhooks/stripe:
 *   post:
 *     summary: Handle Stripe webhook events
 *     description: Process Stripe webhook events with signature verification for subscription management
 *     tags: [Webhooks]
 *     security:
 *       - webhookSignature: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               id:
 *                 type: string
 *                 description: Stripe event ID
 *                 example: "evt_1234567890abcdef"
 *               type:
 *                 type: string
 *                 description: Stripe event type
 *                 example: "invoice.payment_succeeded"
 *               data:
 *                 type: object
 *                 description: Event data object
 *               created:
 *                 type: integer
 *                 description: Event creation timestamp
 *                 example: 1704097600
 *     responses:
 *       "200":
 *         description: Webhook processed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 received:
 *                   type: boolean
 *                   example: true
 *                 eventId:
 *                   type: string
 *                   example: "evt_1234567890abcdef"
 *                 processed:
 *                   type: boolean
 *                   example: true
 *       "400":
 *         description: Invalid webhook payload
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       "401":
 *         description: Invalid webhook signature
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             example:
 *               code: 401
 *               message: "Invalid webhook signature"
 */

// Stripe webhook endpoint with signature verification
router.post('/stripe', rawBodyParser, verifyWebhookSignature('stripe'), (req, res) => {
  try {
    const event = req.body;

    logger.info(`Stripe webhook received: ${event.type} (${event.id})`);

    // Process different Stripe events
    switch (event.type) {
      case 'invoice.payment_succeeded':
        // Handle successful payment
        logger.info(`Payment succeeded for customer: ${event.data.object.customer}`);
        break;

      case 'invoice.payment_failed':
        // Handle failed payment
        logger.warn(`Payment failed for customer: ${event.data.object.customer}`);
        break;

      case 'customer.subscription.created':
        // Handle new subscription
        logger.info(`New subscription created: ${event.data.object.id}`);
        break;

      case 'customer.subscription.updated':
        // Handle subscription update
        logger.info(`Subscription updated: ${event.data.object.id}`);
        break;

      case 'customer.subscription.deleted':
        // Handle subscription cancellation
        logger.info(`Subscription cancelled: ${event.data.object.id}`);
        break;

      default:
        logger.info(`Unhandled Stripe event type: ${event.type}`);
    }

    res.json({
      received: true,
      eventId: event.id,
      processed: true,
    });
  } catch (error) {
    logger.error('Stripe webhook processing error:', error);
    res.status(httpStatus.INTERNAL_SERVER_ERROR).json({
      received: true,
      processed: false,
      error: 'Internal processing error',
    });
  }
});

/**
 * @swagger
 * /webhooks/github:
 *   post:
 *     summary: Handle GitHub webhook events
 *     description: Process GitHub webhook events with signature verification for repository updates
 *     tags: [Webhooks]
 *     security:
 *       - webhookSignature: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               action:
 *                 type: string
 *                 description: GitHub action type
 *                 example: "opened"
 *               repository:
 *                 type: object
 *                 description: Repository information
 *               sender:
 *                 type: object
 *                 description: Event sender information
 *     responses:
 *       "200":
 *         description: Webhook processed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 received:
 *                   type: boolean
 *                   example: true
 *                 action:
 *                   type: string
 *                   example: "opened"
 *                 processed:
 *                   type: boolean
 *                   example: true
 *       "401":
 *         description: Invalid webhook signature
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */

// GitHub webhook endpoint with signature verification
router.post('/github', rawBodyParser, verifyWebhookSignature('github'), (req, res) => {
  try {
    const event = req.body;
    const eventType = req.headers['x-github-event'];

    logger.info(`GitHub webhook received: ${eventType} (${event.action})`);

    // Process different GitHub events
    switch (eventType) {
      case 'push':
        // Handle repository push
        logger.info(`Repository push to ${event.repository.full_name}`);
        break;

      case 'pull_request':
        // Handle pull request events
        logger.info(`Pull request ${event.action}: ${event.pull_request.title}`);
        break;

      case 'issues':
        // Handle issue events
        logger.info(`Issue ${event.action}: ${event.issue.title}`);
        break;

      default:
        logger.info(`Unhandled GitHub event type: ${eventType}`);
    }

    res.json({
      received: true,
      action: event.action,
      processed: true,
    });
  } catch (error) {
    logger.error('GitHub webhook processing error:', error);
    res.status(httpStatus.INTERNAL_SERVER_ERROR).json({
      received: true,
      processed: false,
      error: 'Internal processing error',
    });
  }
});

/**
 * @swagger
 * /webhooks/custom:
 *   post:
 *     summary: Handle custom webhook events
 *     description: Process custom webhook events with API key and signature verification
 *     tags: [Webhooks]
 *     security:
 *       - apiKeyAuth: []
 *       - webhookSignature: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               event:
 *                 type: string
 *                 description: Custom event type
 *                 example: "user.subscription.upgraded"
 *               data:
 *                 type: object
 *                 description: Event data
 *               timestamp:
 *                 type: integer
 *                 description: Event timestamp
 *                 example: 1704097600
 *     responses:
 *       "200":
 *         description: Webhook processed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 received:
 *                   type: boolean
 *                   example: true
 *                 event:
 *                   type: string
 *                   example: "user.subscription.upgraded"
 *                 processed:
 *                   type: boolean
 *                   example: true
 *       "401":
 *         description: Invalid API key or webhook signature
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */

// Custom webhook endpoint with API key and signature verification
router.post(
  '/custom',
  apiKeyAuth(['write']),
  rawBodyParser,
  verifyWebhookSignature('custom'),
  (req, res) => {
    try {
      const event = req.body;

      logger.info(`Custom webhook received: ${event.event} from client: ${req.apiClient.clientId}`);

      // Process custom events
      switch (event.event) {
        case 'user.subscription.upgraded':
          logger.info(`User subscription upgraded: ${event.data.userId}`);
          break;

        case 'content.published':
          logger.info(`Content published: ${event.data.contentId}`);
          break;

        case 'analytics.milestone':
          logger.info(`Analytics milestone reached: ${event.data.milestone}`);
          break;

        default:
          logger.info(`Unhandled custom event type: ${event.event}`);
      }

      res.json({
        received: true,
        event: event.event,
        processed: true,
        client: req.apiClient.clientId,
      });
    } catch (error) {
      logger.error('Custom webhook processing error:', error);
      res.status(httpStatus.INTERNAL_SERVER_ERROR).json({
        received: true,
        processed: false,
        error: 'Internal processing error',
      });
    }
  },
);

/**
 * @swagger
 * /webhooks/stats:
 *   get:
 *     summary: Get webhook statistics
 *     description: Get webhook configuration and processing statistics (admin only)
 *     tags: [Webhooks]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       "200":
 *         description: Webhook statistics retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 configuredProviders:
 *                   type: array
 *                   items:
 *                     type: string
 *                   example: ["stripe", "github", "custom"]
 *                 totalProviders:
 *                   type: integer
 *                   example: 3
 *                 supportedFormats:
 *                   type: array
 *                   items:
 *                     type: string
 *                   example: ["simple", "stripe", "github"]
 *                 securityFeatures:
 *                   type: array
 *                   items:
 *                     type: string
 *                   example: ["HMAC signature verification", "Timestamp validation", "Timing-safe comparison"]
 *       "401":
 *         $ref: '#/components/responses/Unauthorized'
 *       "403":
 *         description: Admin permissions required
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */

// Get webhook statistics
router.get('/stats', auth('admin'), (req, res) => {
  try {
    const stats = getWebhookStats();
    res.json(stats);
  } catch (error) {
    logger.error('Webhook stats error:', error);
    res.status(httpStatus.INTERNAL_SERVER_ERROR).json({
      error: 'Failed to retrieve webhook statistics',
    });
  }
});

module.exports = router;
