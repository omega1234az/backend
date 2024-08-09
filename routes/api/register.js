// routers/api/register.js

const express = require('express');
const router = express.Router();
const authController = require('../../controllers/authController');

router.post('/', authController.register);

module.exports = router;
