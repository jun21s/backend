const express = require('express');
const router = express.Router();
const projectController = require('../controllers/projectController');

router.post('/postsboard', projectController.postsboard);
router.post('/showfield', projectController.showfield)
router.post('/create', projectController.createProjects);
module.exports = router;