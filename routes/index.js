const express = require('express');
const app = express();

const router = express.Router();
const loginRoutes = require('./api/login');
const registerRoutes = require('./api/register');
const postsRoutes = require('./api/posts');
const userRoutes = require('./api/user');
const profileRoutes = require('./api/profile');
const commentsRoutes = require('./api/comments');
const cateRoutes = require('./api/categories');
const auth = require('../middleware/auth');




router.use('/login', loginRoutes);
router.use('/user', userRoutes);
router.use('/profile', profileRoutes);
router.use('/comments', commentsRoutes);
router.use('/register', registerRoutes);
router.use('/posts', postsRoutes);

router.use('/categories',cateRoutes)
router.use('/auth', auth, (req, res) => {
  res.send({ status: true });
});


module.exports = router;
