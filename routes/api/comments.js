const express = require('express');
const router = express.Router();
const commentsController = require('../../controllers/commentsController');
const authMiddleware = require('../../middleware/auth');

// ดึงคอมเมนต์ทั้งหมดสำหรับโพสต์
router.get('/:postId', commentsController.getCommentsByPostId);

// ดึงการตอบกลับทั้งหมดสำหรับคอมเมนต์
router.get('/replies/:commentId/', commentsController.getRepliesByCommentId);

// เพิ่มคอมเมนต์ใหม่
router.post('/:postId', authMiddleware, commentsController.addComment);

// เพิ่มการตอบกลับใหม่
router.post('/:commentId/replies', authMiddleware, commentsController.addReply);

// แก้ไขคอมเมนต์
router.put('/:commentId', authMiddleware, commentsController.updateComment);

// แก้ไขการตอบกลับ
router.put('/reply/:replyId', authMiddleware, commentsController.updateReply);

// ลบคอมเมนต์
router.delete('/:commentId', authMiddleware, commentsController.deleteComment);

// ลบการตอบกลับ
router.delete('/reply/:replyId', authMiddleware, commentsController.deleteReply);

module.exports = router;
