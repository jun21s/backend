const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
router.post('/checkLogin', authController.checkLogin);
router.get('/techStack', authController.getTechStack);
router.post('/register', authController.register);
router.post('/login', authController.login);
router.get('/checkLogin', authController.checkLogin);
router.post('/logout', authController.logout);
router.post('/findId', authController.findId);
router.post('/findPassword', authController.findPassword);



module.exports = router;