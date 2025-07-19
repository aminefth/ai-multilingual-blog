const express = require('express');
const validate = require('../../middlewares/validate');
const auth = require('../../middlewares/auth');
const cacheMiddleware = require('../../middlewares/cache');
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
 *   post:
 *     summary: Create a blog post
 *     description: Create a new blog post with multilingual support
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
 *               - language
 *             properties:
 *               title:
 *                 type: string
 *               content:
 *                 type: string
 *               language:
 *                 type: string
 *                 enum: [en, fr, es, de, ar]
 *               category:
 *                 type: string
 *               tags:
 *                 type: array
 *                 items:
 *                   type: string
 *               affiliateLinks:
 *                 type: array
 *                 items:
 *                   type: object
 *     responses:
 *       "201":
 *         description: Created
 *       "401":
 *         description: Unauthorized
 *       "403":
 *         description: Forbidden
 *   get:
 *     summary: Get blog posts
 *     description: Retrieve blog posts with pagination and filtering
 *     tags: [Blog Posts]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *         description: Maximum number of posts
 *       - in: query
 *         name: language
 *         schema:
 *           type: string
 *           enum: [en, fr, es, de, ar]
 *         description: Filter by language
 *     responses:
 *       "200":
 *         description: OK
 */

router
  .route('/')
  .post(auth('manageBlogPosts'), validate(blogValidation.createPost), blogController.createPost)
  .get(cacheMiddleware(300), validate(blogValidation.getPosts), blogController.getPosts);

/**
 * @swagger
 * /blog-posts/{id}:
 *   get:
 *     summary: Get blog post
 *     description: Get blog post by id
 *     tags: [Blog Posts]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Blog post id
 *     responses:
 *       "200":
 *         description: OK
 *       "404":
 *         description: Not found
 *   put:
 *     summary: Update blog post
 *     description: Update blog post by id
 *     tags: [Blog Posts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Blog post id
 *     responses:
 *       "200":
 *         description: OK
 *       "401":
 *         description: Unauthorized
 *       "403":
 *         description: Forbidden
 *       "404":
 *         description: Not found
 *   delete:
 *     summary: Delete blog post
 *     description: Delete blog post by id
 *     tags: [Blog Posts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Blog post id
 *     responses:
 *       "204":
 *         description: No content
 *       "401":
 *         description: Unauthorized
 *       "403":
 *         description: Forbidden
 *       "404":
 *         description: Not found
 */

router
  .route('/:id')
  .get(validate(blogValidation.getPost), blogController.getPost)
  .put(auth('manageBlogPosts'), validate(blogValidation.updatePost), blogController.updatePost)
  .delete(auth('manageBlogPosts'), validate(blogValidation.deletePost), blogController.deletePost);

// Special route for getting post by slug
router.get('/slug/:slug', validate(blogValidation.getPostBySlug), blogController.getPostBySlug);

// Route for translations
router.post(
  '/:id/translate',
  auth('manageTranslations'),
  validate(blogValidation.translatePost),
  blogController.translatePost,
);

// Route for SEO generation/update
router.put(
  '/:id/seo',
  auth('manageBlogPosts'),
  validate(blogValidation.updateSEO),
  blogController.updateSEO,
);

// Route for tracking affiliate link clicks
router.post(
  '/:id/affiliate-click',
  validate(blogValidation.trackAffiliateClick),
  blogController.trackAffiliateClick,
);

module.exports = router;
