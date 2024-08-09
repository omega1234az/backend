

const express = require('express');
const router = express.Router();
const authMiddleware = require('../../middleware/auth');
const categoryController = require('../../controllers/categoriesController');

// GET all posts

router.get('/popular', categoryController.getPopularSubCategories);
router.get('/search', categoryController.searchSubCategories);
router.get('/:id?', categoryController.getCategories);


module.exports = router;
