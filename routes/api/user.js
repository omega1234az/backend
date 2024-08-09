const express = require('express');
const router = express.Router();
const userController = require('../../controllers/authController');
const authMiddleware = require('../../middleware/auth');

router.get('/me', authMiddleware, userController.getUser);

module.exports = router;
