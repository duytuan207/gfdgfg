const express = require('express');
const authController = require('../controllers/auth.controller');
const { isAuth, loggedIn } = require('../middlewares/auth.middleware');
const router = express.Router();

router.get('/login', isAuth, (req, res) => {
    res.render('auth/login', { title: 'Đăng Nhập Quản Trị' })
});

router.post('/login', authController.login);

router.post('/register', authController.register);

router.get('/logout', loggedIn, authController.logout)


module.exports = router;