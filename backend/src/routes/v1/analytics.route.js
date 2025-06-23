const express = require('express');
const validate = require('../../middlewares/validate');
const auth = require('../../middlewares/auth');
const analyticsValidation = require('../../validations/analytics.validation');
const analyticsController = require('../../controllers/analytics.controller');
const cacheMiddleware = require('../../middlewares/cache');

const router = express.Router();

/**
 * POST /v1/analytics/track
 * Track an analytics event
 * Public endpoint but can include authenticated user data
 */
router.post('/track', validate(analyticsValidation.trackEvent), analyticsController.trackEvent);

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
