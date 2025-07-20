const express = require('express');
const validate = require('../../middlewares/validate');
const auth = require('../../middlewares/auth');
const cacheMiddleware = require('../../middlewares/cache');
const { csrfProtection } = require('../../middlewares/csrf.middleware');
const seoValidation = require('../../validations/seo.validation');
const seoController = require('../../controllers/seo.controller');

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: SEO
 *   description: SEO optimization and metadata management
 */

/**
 * @swagger
 * /seo/generate/{postId}:
 *   post:
 *     summary: Generate SEO metadata
 *     description: Auto-generate SEO metadata for a blog post using AI
 *     tags: [SEO]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: postId
 *         required: true
 *         schema:
 *           type: string
 *         description: Blog post ID
 *     responses:
 *       "200":
 *         description: SEO metadata generated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 title:
 *                   type: string
 *                 description:
 *                   type: string
 *                 keywords:
 *                   type: array
 *                   items:
 *                     type: string
 *       "401":
 *         description: Unauthorized
 *       "403":
 *         description: Forbidden
 *       "404":
 *         description: Post not found
 */
router.post(
  '/generate/:postId',
  auth('manageBlogPosts'),
  csrfProtection,
  validate(seoValidation.generateSEOMetadata),
  seoController.generateSEOMetadata,
);

/**
 * PUT /v1/seo/:postId
 * Update SEO metadata for a blog post
 * Private endpoint (requires manageBlogPosts permission)
 */
router.put(
  '/:postId',
  auth('manageBlogPosts'),
  csrfProtection,
  validate(seoValidation.updateSEOMetadata),
  seoController.updateSEOMetadata,
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
  seoController.getSEOMetadata,
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
  seoController.getSiteSEOSettings,
);

/**
 * PUT /v1/seo/site-settings
 * Update site-wide SEO settings
 * Private endpoint (requires admin permission)
 */
router.put(
  '/site-settings',
  auth('admin'),
  csrfProtection,
  validate(seoValidation.updateSiteSEOSettings),
  seoController.updateSiteSEOSettings,
);

module.exports = router;
