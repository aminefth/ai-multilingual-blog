const express = require('express');
const validate = require('../../middlewares/validate');
const auth = require('../../middlewares/auth');
const affiliateValidation = require('../../validations/affiliate.validation');
const affiliateController = require('../../controllers/affiliate.controller');
const cacheMiddleware = require('../../middlewares/cache');

const router = express.Router();

/**
 * GET /v1/affiliate/tools
 * Get all affiliate tools
 * Private endpoint (requires manageBlogPosts permission)
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
  validate(affiliateValidation.addAffiliateLink),
  affiliateController.addAffiliateLink,
);

module.exports = router;
