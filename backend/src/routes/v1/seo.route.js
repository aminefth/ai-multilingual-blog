const express = require('express');
const validate = require('../../middlewares/validate');
const auth = require('../../middlewares/auth');
const cacheMiddleware = require('../../middlewares/cache');
const seoValidation = require('../../validations/seo.validation');
const seoController = require('../../controllers/seo.controller');

const router = express.Router();

/**
 * POST /v1/seo/generate/:postId
 * Generate SEO metadata for a blog post
 * Private endpoint (requires manageBlogPosts permission)
 */
router.post(
  '/generate/:postId',
  auth('manageBlogPosts'),
  validate(seoValidation.generateSEOMetadata),
  seoController.generateSEOMetadata
);

/**
 * PUT /v1/seo/:postId
 * Update SEO metadata for a blog post
 * Private endpoint (requires manageBlogPosts permission)
 */
router.put(
  '/:postId',
  auth('manageBlogPosts'),
  validate(seoValidation.updateSEOMetadata),
  seoController.updateSEOMetadata
);

/**
 * GET /v1/seo/:postId
 * Get SEO metadata for a blog post
 * Private endpoint (requires manageBlogPosts permission)
 */
router.get(
  '/:postId',
  auth('manageBlogPosts'),
  validate(seoValidation.getSEOMetadata),
  cacheMiddleware(300), // Cache for 5 minutes
  seoController.getSEOMetadata
);

/**
 * GET /v1/seo/site-settings
 * Get site-wide SEO settings
 * Private endpoint (requires admin permission)
 */
router.get(
  '/site-settings',
  auth('admin'),
  cacheMiddleware(3600), // Cache for 1 hour
  seoController.getSiteSEOSettings
);

/**
 * PUT /v1/seo/site-settings
 * Update site-wide SEO settings
 * Private endpoint (requires admin permission)
 */
router.put(
  '/site-settings',
  auth('admin'),
  validate(seoValidation.updateSiteSEOSettings),
  seoController.updateSiteSEOSettings
);

module.exports = router;
