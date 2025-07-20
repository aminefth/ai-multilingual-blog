const express = require('express');
const validate = require('../../middlewares/validate');
const auth = require('../../middlewares/auth');
const { csrfProtection } = require('../../middlewares/csrf.middleware');
const affiliateValidation = require('../../validations/affiliate.validation');
const affiliateController = require('../../controllers/affiliate.controller');
const cacheMiddleware = require('../../middlewares/cache');

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Affiliate
 *   description: Affiliate marketing and monetization
 */

/**
 * @swagger
 * /affiliate/tools:
 *   get:
 *     summary: Get affiliate tools
 *     description: Get all available affiliate tools and products for monetization
 *     tags: [Affiliate]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       "200":
 *         description: OK
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: string
 *                   name:
 *                     type: string
 *                   category:
 *                     type: string
 *                   commission:
 *                     type: number
 *                   url:
 *                     type: string
 *       "401":
 *         description: Unauthorized
 *       "403":
 *         description: Forbidden
 */
router.get(
  '/tools',
  auth('manageBlogPosts'),
  cacheMiddleware(1800), // Cache for 30 minutes
  affiliateController.getAffiliateTools,
);

/**
 * POST /v1/affiliate/track
 * Track affiliate link click
 * Public endpoint for tracking clicks
 */
router.post(
  '/track',
  csrfProtection,
  validate(affiliateValidation.trackAffiliateClick),
  affiliateController.trackAffiliateClick,
);

/**
 * POST /v1/affiliate/conversion
 * Register a conversion for an affiliate link
 * Private endpoint (requires admin permission)
 */
router.post(
  '/conversion',
  auth('admin'),
  csrfProtection,
  validate(affiliateValidation.registerConversion),
  affiliateController.registerConversion,
);

/**
 * GET /v1/affiliate/report
 * Get affiliate performance report
 * Private endpoint (requires admin permission)
 */
router.get(
  '/report',
  auth('admin'),
  validate(affiliateValidation.getAffiliateReport),
  cacheMiddleware(1800), // Cache for 30 minutes
  affiliateController.getAffiliateReport,
);

/**
 * POST /v1/affiliate/links
 * Add affiliate link to blog post
 * Private endpoint (requires manageBlogPosts permission)
 */
router.post(
  '/links',
  auth('manageBlogPosts'),
  csrfProtection,
  validate(affiliateValidation.addAffiliateLink),
  affiliateController.addAffiliateLink,
);

module.exports = router;
