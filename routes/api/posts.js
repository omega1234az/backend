const express = require('express');
const router = express.Router();
const postsController = require('../../controllers/postsController');
const authMiddleware = require('../../middleware/auth');

// ดึงโพสต์ทั้งหมด
router.get('/', postsController.getAllPosts);

// ดึงโพสต์โดย ID
router.get('/:id', postsController.getPostById);

// สร้างโพสต์ใหม่
router.post('/', authMiddleware, postsController.createPost);

// อัปเดตโพสต์
router.put('/:id', authMiddleware, postsController.updatePost);

// ลบโพสต์
router.delete('/:id', authMiddleware, postsController.deletePost);

module.exports = router;
