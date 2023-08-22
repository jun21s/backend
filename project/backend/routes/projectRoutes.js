const express = require('express');
const router = express.Router();
const projectController = require('../controllers/projectController');

router.post('/postsboard', projectController.postsboard);
router.post('/create', projectController.createProjects);
module.exports = router;