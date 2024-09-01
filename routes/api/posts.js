const express = require('express');
const router = express.Router();
const postsController = require('../../controllers/postsController');
const authMiddleware = require('../../middleware/auth');

// ดึงโพสต์ทั้งหมด
router.get('/', postsController.getAllPosts);
router.post('/save/:id',authMiddleware, postsController.savePost);
router.get('/category/:categoryId', postsController.getPostsByCategory);
router.get('/subcategory/:subcategoryId', postsController.getPostsBySubcategory);
router.get('/search/:query', postsController.searchPosts);

// ดึงโพสต์โดย ID
router.get('/:id', postsController.getPostById);

// สร้างโพสต์ใหม่
router.post('/', authMiddleware, postsController.createPost);

// อัปเดตโพสต์
router.put('/:id', authMiddleware, postsController.updatePost);

// ลบโพสต์
router.delete('/:id', authMiddleware, postsController.deletePost);

module.exports = router;
