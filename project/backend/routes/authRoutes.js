const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

router.get('/techStack', authController.getTechStack);
router.post('/register', authController.register);
router.post('/login', authController.login);
router.get('/checkLogin', authController.checkLogin);
router.post('/logout', authController.logout);
<<<<<<< HEAD
router.post('/findId', authController.findId);
router.post('/findPassword', authController.findPassword);



module.exports = router;
=======
router.post('/searchId', authController.searchId);
router.post('/searchPassword', authController.searchPassword);
router.get('/verifyToken/:token', authController.verifyToken);
router.post('/updatePassword', authController.updatePassword);

module.exports = router;
>>>>>>> d1ba96076da5b6faeda49ceb94a67334a0df3202
