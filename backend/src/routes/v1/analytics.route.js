const express = require('express');
const validate = require('../../middlewares/validate');
const auth = require('../../middlewares/auth');
const analyticsValidation = require('../../validations/analytics.validation');
const analyticsController = require('../../controllers/analytics.controller');
const cacheMiddleware = require('../../middlewares/cache');

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Analytics
 *   description: Analytics tracking and reporting
 */

/**
 * @swagger
 * /analytics/track:
 *   post:
 *     summary: Track analytics event
 *     description: Track user behavior and business events for revenue optimization and user experience analysis
 *     tags: [Analytics]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - event
 *               - data
 *             properties:
 *               event:
 *                 type: string
 *                 enum: [page_view, affiliate_click, subscription_start, content_engagement, search, user_registration, premium_upgrade]
 *                 description: Type of analytics event
 *                 example: "affiliate_click"
 *               data:
 *                 type: object
 *                 description: Event-specific data payload
 *                 properties:
 *                   userId:
 *                     type: string
 *                     description: User ID (if authenticated)
 *                     example: "64a1b2c3d4e5f6789abcdef1"
 *                   sessionId:
 *                     type: string
 *                     description: Session identifier
 *                     example: "sess_64a1b2c3d4e5f6789abcdef2"
 *                   page:
 *                     type: string
 *                     description: Current page/route
 *                     example: "/blog/10-outils-ia-revenus"
 *                   referrer:
 *                     type: string
 *                     description: Referrer URL
 *                     example: "https://google.com/search?q=ai+tools"
 *                   userAgent:
 *                     type: string
 *                     description: User agent string
 *                     example: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
 *                   timestamp:
 *                     type: string
 *                     format: date-time
 *                     description: Event timestamp
 *                     example: "2024-01-15T10:30:00Z"
 *                   metadata:
 *                     type: object
 *                     description: Additional event-specific metadata
 *                     example:
 *                       affiliateUrl: "https://affiliate.openai.com/chatgpt-plus"
 *                       tool: "ChatGPT Plus"
 *                       expectedCommission: 25.00
 *               ipAddress:
 *                 type: string
 *                 description: Client IP address for geo-analytics
 *                 example: "192.168.1.1"
 *               country:
 *                 type: string
 *                 description: User country (auto-detected)
 *                 example: "FR"
 *               language:
 *                 type: string
 *                 description: User preferred language
 *                 example: "fr"
 *             example:
 *               event: "affiliate_click"
 *               data:
 *                 userId: "64a1b2c3d4e5f6789abcdef1"
 *                 sessionId: "sess_64a1b2c3d4e5f6789abcdef2"
 *                 page: "/blog/10-outils-ia-revenus"
 *                 referrer: "https://google.com/search?q=ai+tools"
 *                 timestamp: "2024-01-15T10:30:00Z"
 *                 metadata:
 *                   affiliateUrl: "https://affiliate.openai.com/chatgpt-plus"
 *                   tool: "ChatGPT Plus"
 *                   expectedCommission: 25.00
 *               ipAddress: "192.168.1.1"
 *               country: "FR"
 *               language: "fr"
 *     responses:
 *       "200":
 *         description: Analytics event tracked successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 eventId:
 *                   type: string
 *                   description: Unique event tracking ID
 *                   example: "evt_64a1b2c3d4e5f6789abcdef3"
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *                   example: "2024-01-15T10:30:00Z"
 *                 processed:
 *                   type: boolean
 *                   description: Whether event was processed immediately
 *                   example: true
 *       "400":
 *         description: Invalid event data
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             example:
 *               code: 400
 *               message: "event and data are required fields"
 *       "429":
 *         description: Rate limit exceeded
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             example:
 *               code: 429
 *               message: "Too many events from this IP. Please slow down."
 *
 * /analytics/dashboard:
 *   get:
 *     summary: Get analytics dashboard data
 *     description: Retrieve comprehensive analytics dashboard with revenue metrics, user behavior, and performance KPIs (admin only)
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: period
 *         schema:
 *           type: string
 *           enum: [today, 7d, 30d, 90d, 1y, all]
 *           default: 30d
 *         description: Time period for analytics data
 *       - in: query
 *         name: granularity
 *         schema:
 *           type: string
 *           enum: [hour, day, week, month]
 *           default: day
 *         description: Data granularity for time series
 *       - in: query
 *         name: metrics
 *         schema:
 *           type: array
 *           items:
 *             type: string
 *             enum: [revenue, traffic, conversions, engagement, subscriptions]
 *         description: Specific metrics to include (default all)
 *         style: form
 *         explode: false
 *         example: ["revenue", "traffic", "conversions"]
 *     responses:
 *       "200":
 *         description: Analytics dashboard data retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AnalyticsDashboard'
 *       "401":
 *         $ref: '#/components/responses/Unauthorized'
 *       "403":
 *         description: Admin permissions required
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             example:
 *               code: 403
 *               message: "Admin permissions required to access analytics dashboard"
 *
 * /analytics/revenue:
 *   get:
 *     summary: Get revenue analytics
 *     description: Detailed revenue analytics including affiliate commissions, subscription revenue, and conversion metrics (admin only)
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: period
 *         schema:
 *           type: string
 *           enum: [7d, 30d, 90d, 1y, all]
 *           default: 30d
 *         description: Revenue analysis period
 *       - in: query
 *         name: breakdown
 *         schema:
 *           type: string
 *           enum: [source, tool, category, country, subscription_plan]
 *           default: source
 *         description: Revenue breakdown dimension
 *       - in: query
 *         name: currency
 *         schema:
 *           type: string
 *           enum: [EUR, USD, GBP]
 *           default: EUR
 *         description: Currency for revenue display
 *     responses:
 *       "200":
 *         description: Revenue analytics retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/RevenueAnalytics'
 *       "401":
 *         $ref: '#/components/responses/Unauthorized'
 *       "403":
 *         description: Admin permissions required
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             example:
 *               code: 403
 *               message: "Admin permissions required to access revenue analytics"
 */

router.post('/track', validate(analyticsValidation.trackEvent), analyticsController.trackEvent);

// Note: Dashboard and revenue routes are defined below with proper middleware

/**
 * GET /v1/analytics/dashboard
 * Get overall analytics dashboard data
 * Private endpoint (requires admin permission)
 */
router.get(
  '/dashboard',
  auth('admin'),
  validate(analyticsValidation.getDashboardData),
  cacheMiddleware(300), // Cache for 5 minutes
  analyticsController.getDashboardData,
);

/**
 * GET /v1/analytics/content
 * Get content performance metrics
 * Private endpoint (requires manageBlogPosts permission)
 */
router.get(
  '/content',
  auth('manageBlogPosts'),
  validate(analyticsValidation.getContentPerformance),
  cacheMiddleware(300), // Cache for 5 minutes
  analyticsController.getContentPerformance,
);

/**
 * GET /v1/analytics/revenue
 * Get revenue metrics
 * Private endpoint (requires admin permission)
 */
router.get(
  '/revenue',
  auth('admin'),
  validate(analyticsValidation.getRevenueMetrics),
  cacheMiddleware(300), // Cache for 5 minutes
  analyticsController.getRevenueMetrics,
);

/**
 * GET /v1/analytics/engagement
 * Get user engagement metrics
 * Private endpoint (requires admin permission)
 */
router.get(
  '/engagement',
  auth('admin'),
  validate(analyticsValidation.getUserEngagement),
  cacheMiddleware(300), // Cache for 5 minutes
  analyticsController.getUserEngagement,
);

module.exports = router;
