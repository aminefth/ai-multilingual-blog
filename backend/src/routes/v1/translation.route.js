const express = require('express');
const validate = require('../../middlewares/validate');
const auth = require('../../middlewares/auth');
const cacheMiddleware = require('../../middlewares/cache');
const translationValidation = require('../../validations/translation.validation');
const translationController = require('../../controllers/translation.controller');

const router = express.Router();

/**
 * GET /v1/translations/languages
 * Get all available languages
 * Public endpoint, cached for 1 day (86400 seconds)
 */
router.get('/languages', cacheMiddleware(86400), translationController.getLanguages);

/**
 * GET /v1/translations/namespaces
 * Get all translation namespaces with their keys
 * Public endpoint, cached for 1 hour (3600 seconds)
 */
router.get(
  '/namespaces',
  validate(translationValidation.getNamespaces),
  cacheMiddleware(3600),
  translationController.getNamespaces,
);

/**
 * POST /v1/translations/translate
 * Translate content using AI service
 * Private endpoint (requires manageBlogPosts permission)
 */
router.post(
  '/translate',
  auth('manageBlogPosts'),
  validate(translationValidation.translateContent),
  translationController.translateContent,
);

/**
 * GET /v1/translations/status/:postId
 * Get translation status for a blog post
 * Private endpoint (requires manageBlogPosts permission)
 */
router.get(
  '/status/:postId',
  auth('manageBlogPosts'),
  validate(translationValidation.getTranslationStatus),
  translationController.getTranslationStatus,
);

/**
 * PUT /v1/translations/:language
 * Update translation strings in a specific locale
 * Private endpoint (requires manageTranslations permission)
 */
router.put(
  '/:language',
  auth('manageTranslations'),
  validate(translationValidation.updateTranslations),
  translationController.updateTranslations,
);

module.exports = router;
