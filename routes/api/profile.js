// routers/api/register.js

const express = require('express');
const router = express.Router();
const authMiddleware = require('../../middleware/auth');
const profileController = require('../../controllers/profileController');

router.put('/', authMiddleware, profileController.upload.single('img'), profileController.editProfile);


module.exports = router;