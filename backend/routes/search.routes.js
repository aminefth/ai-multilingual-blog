const express = require('express');
const router = express.Router();
const searchService = require('../services/search.service');
const { auth } = require('../middlewares/auth.middleware');
const { validate } = require('../middlewares/validation.middleware');
const Joi = require('joi');

// Validation schemas
const searchSchema = Joi.object({
  q: Joi.string().required().min(1).max(200),
  limit: Joi.number().integer().min(1).max(50).default(20),
  offset: Joi.number().integer().min(0).default(0),
  language: Joi.string().valid('en', 'fr', 'es', 'de', 'ar').optional(),
  category: Joi.string().optional(),
  tags: Joi.string().optional(),
  sort: Joi.string()
    .valid('publishedAt:desc', 'publishedAt:asc', 'views:desc', 'likes:desc')
    .default('publishedAt:desc'),
  isPremium: Joi.boolean().optional(),
});

const suggestionsSchema = Joi.object({
  q: Joi.string().required().min(1).max(100),
  limit: Joi.number().integer().min(1).max(10).default(5),
  language: Joi.string().valid('en', 'fr', 'es', 'de', 'ar').optional(),
});

const reindexSchema = Joi.object({
  type: Joi.string().valid('posts', 'categories', 'all').required(),
});

/**
 * @swagger
 * /search:
 *   get:
 *     summary: Search blog posts and content
 *     tags: [Search]
 *     parameters:
 *       - in: query
 *         name: q
 *         required: true
 *         schema:
 *           type: string
 *           minLength: 1
 *           maxLength: 200
 *         description: Search query
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 50
 *           default: 20
 *         description: Number of results to return
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *           minimum: 0
 *           default: 0
 *         description: Number of results to skip
 *       - in: query
 *         name: language
 *         schema:
 *           type: string
 *           enum: [en, fr, es, de, ar]
 *         description: Filter by language
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *         description: Filter by category slug
 *       - in: query
 *         name: tags
 *         schema:
 *           type: string
 *         description: Filter by tags (comma-separated)
 *       - in: query
 *         name: sort
 *         schema:
 *           type: string
 *           enum: [publishedAt:desc, publishedAt:asc, views:desc, likes:desc]
 *           default: publishedAt:desc
 *         description: Sort order
 *       - in: query
 *         name: isPremium
 *         schema:
 *           type: boolean
 *         description: Filter by premium content
 *     responses:
 *       200:
 *         description: Search results
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     hits:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/SearchResult'
 *                     totalHits:
 *                       type: integer
 *                     query:
 *                       type: string
 *                     processingTimeMs:
 *                       type: integer
 *                     limit:
 *                       type: integer
 *                     offset:
 *                       type: integer
 *       400:
 *         description: Invalid search parameters
 *       500:
 *         description: Search service error
 */
router.get('/', validate(searchSchema, 'query'), async (req, res) => {
  try {
    const { q, limit, offset, language, category, tags, sort, isPremium } = req.query;

    // Build filters
    let filters = 'status = "published"';

    if (category) {
      filters += ` AND categorySlug = "${category}"`;
    }

    if (tags) {
      const tagList = tags.split(',').map((tag) => tag.trim());
      const tagFilters = tagList.map((tag) => `tags = "${tag}"`).join(' OR ');
      filters += ` AND (${tagFilters})`;
    }

    if (isPremium !== undefined) {
      filters += ` AND isPremium = ${isPremium}`;
    }

    const results = await searchService.searchBlogPosts(q, {
      limit: parseInt(limit),
      offset: parseInt(offset),
      language,
      filters,
      sort: [sort],
    });

    res.json({
      success: true,
      data: results,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Search failed',
      error: error.message,
    });
  }
});

/**
 * @swagger
 * /search/suggestions:
 *   get:
 *     summary: Get search suggestions
 *     tags: [Search]
 *     parameters:
 *       - in: query
 *         name: q
 *         required: true
 *         schema:
 *           type: string
 *           minLength: 1
 *           maxLength: 100
 *         description: Search query for suggestions
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 10
 *           default: 5
 *         description: Number of suggestions to return
 *       - in: query
 *         name: language
 *         schema:
 *           type: string
 *           enum: [en, fr, es, de, ar]
 *         description: Filter by language
 *     responses:
 *       200:
 *         description: Search suggestions
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/SearchSuggestion'
 *       400:
 *         description: Invalid parameters
 *       500:
 *         description: Service error
 */
router.get('/suggestions', validate(suggestionsSchema, 'query'), async (req, res) => {
  try {
    const { q, limit } = req.query;

    const suggestions = await searchService.getSuggestions(q, parseInt(limit));

    res.json({
      success: true,
      data: suggestions,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to get suggestions',
      error: error.message,
    });
  }
});

/**
 * @swagger
 * /search/categories:
 *   get:
 *     summary: Search categories
 *     tags: [Search]
 *     parameters:
 *       - in: query
 *         name: q
 *         required: true
 *         schema:
 *           type: string
 *           minLength: 1
 *           maxLength: 100
 *         description: Search query
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 20
 *           default: 10
 *         description: Number of results to return
 *       - in: query
 *         name: language
 *         schema:
 *           type: string
 *           enum: [en, fr, es, de, ar]
 *         description: Filter by language
 *     responses:
 *       200:
 *         description: Category search results
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     hits:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/CategorySearchResult'
 *                     totalHits:
 *                       type: integer
 *       500:
 *         description: Search service error
 */
router.get('/categories', async (req, res) => {
  try {
    const { q, limit = 10, language } = req.query;

    if (!q || q.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Search query is required',
      });
    }

    const results = await searchService.searchCategories(q, {
      limit: parseInt(limit),
      language,
    });

    res.json({
      success: true,
      data: results,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Category search failed',
      error: error.message,
    });
  }
});

/**
 * @swagger
 * /search/stats:
 *   get:
 *     summary: Get search index statistics
 *     tags: [Search]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Search index statistics
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/SearchStats'
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Admin access required
 *       500:
 *         description: Service error
 */
router.get('/stats', auth(['admin']), async (req, res) => {
  try {
    const stats = await searchService.getIndexStats();

    res.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to get search stats',
      error: error.message,
    });
  }
});

/**
 * @swagger
 * /search/reindex:
 *   post:
 *     summary: Reindex search data
 *     tags: [Search]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               type:
 *                 type: string
 *                 enum: [posts, categories, all]
 *                 description: Type of data to reindex
 *             required:
 *               - type
 *     responses:
 *       200:
 *         description: Reindexing completed
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     message:
 *                       type: string
 *                     results:
 *                       type: object
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Admin access required
 *       500:
 *         description: Reindexing failed
 */
router.post('/reindex', auth(['admin']), validate(reindexSchema), async (req, res) => {
  try {
    const { type } = req.body;
    let results = {};

    switch (type) {
      case 'posts':
        results.posts = await searchService.reindexAllBlogPosts();
        break;
      case 'categories':
        results.categories = await searchService.reindexAllCategories();
        break;
      case 'all':
        results.posts = await searchService.reindexAllBlogPosts();
        results.categories = await searchService.reindexAllCategories();
        break;
      default:
        return res.status(400).json({
          success: false,
          message: 'Invalid reindex type',
        });
    }

    res.json({
      success: true,
      data: {
        message: `Successfully reindexed ${type}`,
        results,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Reindexing failed',
      error: error.message,
    });
  }
});

module.exports = router;
