const express = require('express');
const router = express.Router();
const projectController = require('../controllers/projectController');

router.post('/postsboard', projectController.postsboard);

module.exports = router;