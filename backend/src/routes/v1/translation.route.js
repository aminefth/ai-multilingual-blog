const express = require('express');
const validate = require('../../middlewares/validate');
const auth = require('../../middlewares/auth');
const cacheMiddleware = require('../../middlewares/cache');
const { csrfProtection } = require('../../middlewares/csrf.middleware');
const translationValidation = require('../../validations/translation.validation');
const translationController = require('../../controllers/translation.controller');

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Translations
 *   description: Multilingual translation management
 */

/**
 * @swagger
 * /translations/languages:
 *   get:
 *     summary: Get available languages
 *     description: Get all supported languages (FR, EN, ES, DE, AR)
 *     tags: [Translations]
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
 *                   code:
 *                     type: string
 *                     example: "fr"
 *                   name:
 *                     type: string
 *                     example: "Français"
 *                   rtl:
 *                     type: boolean
 *                     example: false
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
  csrfProtection,
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
  csrfProtection,
  validate(translationValidation.updateTranslations),
  translationController.updateTranslations,
);

module.exports = router;
