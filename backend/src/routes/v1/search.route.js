const express = require('express');
const auth = require('../../middlewares/auth');
const validate = require('../../middlewares/validate');
const searchValidation = require('../../validations/search.validation');
const searchController = require('../../controllers/search.controller');

const router = express.Router();

router
  .route('/')
  .get(validate(searchValidation.search), searchController.search);

router
  .route('/suggestions')
  .get(validate(searchValidation.suggestions), searchController.getSuggestions);

router
  .route('/categories')
  .get(validate(searchValidation.searchCategories), searchController.searchCategories);

router
  .route('/stats')
  .get(auth('admin'), searchController.getStats);

router
  .route('/reindex')
  .post(auth('admin'), validate(searchValidation.reindex), searchController.reindex);

module.exports = router;
