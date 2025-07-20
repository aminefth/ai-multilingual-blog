const express = require('express');
const validate = require('../../middlewares/validate');
const auth = require('../../middlewares/auth');
const cacheMiddleware = require('../../middlewares/cache');
const { csrfProtection } = require('../../middlewares/csrf.middleware');
const blogValidation = require('../../validations/blog.validation');
const blogController = require('../../controllers/blog.controller');

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Blog Posts
 *   description: Blog post management and retrieval
 */

/**
 * @swagger
 * /blog-posts:
 *   get:
 *     summary: Get blog posts
 *     description: Retrieve paginated blog posts with filtering and monetization data
 *     tags: [Blog Posts]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *         description: Page number for pagination
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 10
 *         description: Number of posts per page
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [draft, published, archived]
 *         description: Filter by publication status
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *         description: Filter by category slug
 *       - in: query
 *         name: isPremium
 *         schema:
 *           type: boolean
 *         description: Filter premium content
 *       - in: query
 *         name: language
 *         schema:
 *           type: string
 *           enum: [en, fr, de, es]
 *         description: Language for multilingual content
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           enum: [publishedAt, views, revenueGenerated, updatedAt]
 *           default: publishedAt
 *         description: Sort field
 *       - in: query
 *         name: sortOrder
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *           default: desc
 *         description: Sort order
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search in title and content
 *     responses:
 *       "200":
 *         description: Blog posts retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/PaginatedBlogPosts'
 *       "400":
 *         description: Invalid query parameters
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             example:
 *               code: 400
 *               message: Invalid sortBy parameter
 *
 *   post:
 *     summary: Create a blog post
 *     description: Create a new blog post with monetization features (requires author permissions)
 *     tags: [Blog Posts]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - content
 *             properties:
 *               title:
 *                 type: string
 *                 maxLength: 200
 *                 example: "10 Outils IA qui Génèrent 1000€/mois"
 *               content:
 *                 type: string
 *                 example: "# Introduction\n\nDécouvrez ces outils révolutionnaires..."
 *               excerpt:
 *                 type: string
 *                 maxLength: 500
 *                 example: "Guide complet des outils IA les plus rentables"
 *               slug:
 *                 type: string
 *                 pattern: "^[a-z0-9-]+$"
 *                 example: "10-outils-ia-revenus"
 *               category:
 *                 type: string
 *                 example: "cat_ai_tools"
 *               tags:
 *                 type: array
 *                 items:
 *                   type: string
 *                 example: ["IA", "revenus", "outils"]
 *               isPremium:
 *                 type: boolean
 *                 default: false
 *                 example: true
 *               status:
 *                 type: string
 *                 enum: [draft, published]
 *                 default: draft
 *                 example: "published"
 *               metaTitle:
 *                 type: string
 *                 maxLength: 100
 *                 example: "10 Outils IA Rentables - Guide Complet 2025"
 *               metaDescription:
 *                 type: string
 *                 maxLength: 160
 *                 example: "Découvrez les 10 outils IA les plus rentables avec stratégies détaillées"
 *               keywords:
 *                 type: array
 *                 items:
 *                   type: string
 *                 example: ["IA", "outils", "revenus", "automation"]
 *               affiliateLinks:
 *                 type: array
 *                 items:
 *                   type: object
 *                   required:
 *                     - text
 *                     - url
 *                     - tool
 *                   properties:
 *                     text:
 *                       type: string
 *                       example: "Découvrir ChatGPT Plus"
 *                     url:
 *                       type: string
 *                       format: uri
 *                       example: "https://affiliate.openai.com/chatgpt-plus?ref=blog123"
 *                     tool:
 *                       type: string
 *                       example: "ChatGPT Plus"
 *                     commission:
 *                       type: number
 *                       format: float
 *                       example: 25.00
 *               featuredImage:
 *                 type: object
 *                 properties:
 *                   url:
 *                     type: string
 *                     format: uri
 *                     example: "https://cdn.example.com/images/ai-tools.jpg"
 *                   alt:
 *                     type: string
 *                     example: "Outils IA pour générer des revenus"
 *     responses:
 *       "201":
 *         description: Blog post created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/BlogPost'
 *       "400":
 *         description: Invalid input data
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             example:
 *               code: 400
 *               message: Title is required and must be less than 200 characters
 *       "401":
 *         $ref: '#/components/responses/Unauthorized'
 *       "403":
 *         description: Insufficient permissions
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             example:
 *               code: 403
 *               message: Author permissions required to create blog posts
 */

router
  .route('/')
  .post(auth('manageBlogPosts'), validate(blogValidation.createPost), blogController.createPost)
  .get(cacheMiddleware(300), validate(blogValidation.getPosts), blogController.getPosts);

/**
 * @swagger
 * /blog-posts/{slug}:
 *   get:
 *     summary: Get blog post by slug
 *     description: Retrieve a single blog post. Premium content requires subscription.
 *     tags: [Blog Posts]
 *     parameters:
 *       - in: path
 *         name: slug
 *         required: true
 *         schema:
 *           type: string
 *         description: Blog post slug
 *         example: "10-outils-ia-revenus"
 *       - in: query
 *         name: language
 *         schema:
 *           type: string
 *           enum: [en, fr, de, es]
 *         description: Preferred language for multilingual content
 *       - in: query
 *         name: trackView
 *         schema:
 *           type: boolean
 *           default: true
 *         description: Whether to increment view count
 *     responses:
 *       "200":
 *         description: Blog post retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/BlogPost'
 *       "402":
 *         description: Premium subscription required
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             example:
 *               code: 402
 *               message: Premium subscription required to access this content
 *       "404":
 *         description: Blog post not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             example:
 *               code: 404
 *               message: Blog post not found
 *
 *   patch:
 *     summary: Update blog post
 *     description: Update an existing blog post (requires author permissions or ownership)
 *     tags: [Blog Posts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: slug
 *         required: true
 *         schema:
 *           type: string
 *         description: Blog post slug
 *         example: "10-outils-ia-revenus"
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *                 maxLength: 200
 *               content:
 *                 type: string
 *               excerpt:
 *                 type: string
 *                 maxLength: 500
 *               category:
 *                 type: string
 *               tags:
 *                 type: array
 *                 items:
 *                   type: string
 *               isPremium:
 *                 type: boolean
 *               status:
 *                 type: string
 *                 enum: [draft, published, archived]
 *               metaTitle:
 *                 type: string
 *                 maxLength: 100
 *               metaDescription:
 *                 type: string
 *                 maxLength: 160
 *               keywords:
 *                 type: array
 *                 items:
 *                   type: string
 *               affiliateLinks:
 *                 type: array
 *                 items:
 *                   $ref: '#/components/schemas/AffiliateLink'
 *             example:
 *               title: "12 Outils IA qui Génèrent 1500€/mois (Mis à jour)"
 *               isPremium: true
 *               status: "published"
 *     responses:
 *       "200":
 *         description: Blog post updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/BlogPost'
 *       "400":
 *         description: Invalid update data
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       "401":
 *         $ref: '#/components/responses/Unauthorized'
 *       "403":
 *         description: Not authorized to update this post
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             example:
 *               code: 403
 *               message: You can only update your own posts
 *       "404":
 *         description: Blog post not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             example:
 *               code: 404
 *               message: Blog post not found
 *
 *   delete:
 *     summary: Delete blog post
 *     description: Delete a blog post (requires admin permissions or ownership)
 *     tags: [Blog Posts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: slug
 *         required: true
 *         schema:
 *           type: string
 *         description: Blog post slug
 *         example: "10-outils-ia-revenus"
 *     responses:
 *       "204":
 *         description: Blog post deleted successfully
 *       "401":
 *         $ref: '#/components/responses/Unauthorized'
 *       "403":
 *         description: Not authorized to delete this post
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             example:
 *               code: 403
 *               message: Admin permissions required to delete posts
 *       "404":
 *         description: Blog post not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             example:
 *               code: 404
 *               message: Blog post not found
 */

router
  .route('/:id')
  .get(validate(blogValidation.getPost), blogController.getPost)
  .put(
    auth('manageBlogPosts'),
    csrfProtection,
    validate(blogValidation.updatePost),
    blogController.updatePost,
  )
  .delete(
    auth('manageBlogPosts'),
    csrfProtection,
    validate(blogValidation.deletePost),
    blogController.deletePost,
  );

// Special route for getting post by slug
router.get('/slug/:slug', validate(blogValidation.getPostBySlug), blogController.getPostBySlug);

// Route for translations
router.post(
  '/:id/translate',
  auth('manageTranslations'),
  csrfProtection,
  validate(blogValidation.translatePost),
  blogController.translatePost,
);

// Route for SEO generation/update
router.put(
  '/:id/seo',
  auth('manageBlogPosts'),
  csrfProtection,
  validate(blogValidation.updateSEO),
  blogController.updateSEO,
);

/**
 * @swagger
 * /blog-posts/{id}/affiliate-click:
 *   post:
 *     summary: Track affiliate link click
 *     description: Track affiliate link clicks for revenue analytics and commission calculation
 *     tags: [Blog Posts]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Blog post ID
 *         example: "64a1b2c3d4e5f6789abcdef0"
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - affiliateUrl
 *               - tool
 *             properties:
 *               affiliateUrl:
 *                 type: string
 *                 format: uri
 *                 description: The affiliate URL that was clicked
 *                 example: "https://affiliate.openai.com/chatgpt-plus?ref=blog123"
 *               tool:
 *                 type: string
 *                 description: Name of the tool/product
 *                 example: "ChatGPT Plus"
 *               userAgent:
 *                 type: string
 *                 description: User agent for analytics
 *                 example: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
 *               referrer:
 *                 type: string
 *                 description: Referrer URL
 *                 example: "https://google.com/search?q=ai+tools"
 *     responses:
 *       "200":
 *         description: Affiliate click tracked successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 trackingId:
 *                   type: string
 *                   description: Unique tracking ID for this click
 *                   example: "track_64a1b2c3d4e5f6789abcdef3"
 *                 redirectUrl:
 *                   type: string
 *                   format: uri
 *                   description: Final redirect URL with tracking parameters
 *                   example: "https://affiliate.openai.com/chatgpt-plus?ref=blog123&track=track_64a1b2c3d4e5f6789abcdef3"
 *                 expectedCommission:
 *                   type: number
 *                   format: float
 *                   description: Expected commission if conversion occurs
 *                   example: 25.00
 *       "400":
 *         description: Invalid tracking data
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             example:
 *               code: 400
 *               message: affiliateUrl and tool are required
 *       "404":
 *         description: Blog post not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             example:
 *               code: 404
 *               message: Blog post not found
 */

// Route for tracking affiliate link clicks
router.post(
  '/:id/affiliate-click',
  csrfProtection,
  validate(blogValidation.trackAffiliateClick),
  blogController.trackAffiliateClick,
);

/**
 * @swagger
 * /blog-posts/{id}/analytics:
 *   get:
 *     summary: Get blog post analytics
 *     description: Retrieve detailed analytics for a blog post including views, revenue, and affiliate performance (admin/author only)
 *     tags: [Blog Posts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Blog post ID
 *         example: "64a1b2c3d4e5f6789abcdef0"
 *       - in: query
 *         name: period
 *         schema:
 *           type: string
 *           enum: [7d, 30d, 90d, 1y, all]
 *           default: 30d
 *         description: Analytics time period
 *       - in: query
 *         name: granularity
 *         schema:
 *           type: string
 *           enum: [day, week, month]
 *           default: day
 *         description: Data granularity for time series
 *     responses:
 *       "200":
 *         description: Analytics data retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/BlogPostAnalytics'
 *       "401":
 *         $ref: '#/components/responses/Unauthorized'
 *       "403":
 *         description: Not authorized to view analytics
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             example:
 *               code: 403
 *               message: Admin or author permissions required
 *       "404":
 *         description: Blog post not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             example:
 *               code: 404
 *               message: Blog post not found
 */

// Route for getting blog post analytics (if implemented)
// router.get(
//   '/:id/analytics',
//   auth('viewAnalytics'),
//   validate(blogValidation.getAnalytics),
//   blogController.getAnalytics,
// );

module.exports = router;
