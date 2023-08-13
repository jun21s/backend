const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

router.get('/techStack', authController.getTechStack);
router.post('/register', authController.register);
router.post('/login', authController.login);
router.get('/checkLogin', authController.checkLogin); // Change to GET
router.post('/logout', authController.logout);
router.post('/searchId', authController.searchId); // Fix typo: serachId -> searchId
router.post('/searchPassword', authController.searchPassword); // Fix typo: serachPassword -> searchPassword
router.post('/updatePassword', authController.updatePassword);

module.exports = router;
