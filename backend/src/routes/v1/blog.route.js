const express = require('express');
const validate = require('../../middlewares/validate');
const auth = require('../../middlewares/auth');
const cacheMiddleware = require('../../middlewares/cache');
const blogValidation = require('../../validations/blog.validation');
const blogController = require('../../controllers/blog.controller');

const router = express.Router();

router
  .route('/')
  .post(auth('manageBlogPosts'), validate(blogValidation.createPost), blogController.createPost)
  .get(cacheMiddleware(300), validate(blogValidation.getPosts), blogController.getPosts);

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
