const express = require('express');
const router = express.Router();
const authMiddleware = require('../../middleware/auth');
const categoryController = require('../../controllers/categoriesController');

// GET หมวดหมู่หลักทั้งหมดและหมวดหมู่ย่อย
router.get('/', categoryController.getCategories);
router.get('/popular', categoryController.getPopularSubCategories);
router.get('/subcategories/:sub_cate_id', categoryController.getSubcategoryById);
// GET หมวดหมู่หลักตาม ID และหมวดหมู่ย่อย
router.get('/:id', categoryController.getCategories);

// ค้นหา subcategories
router.get('/search/:keyword', categoryController.searchCategoriesAndSubcategories);

// ค้นหา subcategories ที่ได้รับความนิยม


module.exports = router;
