const express = require('express');
const router = express.Router();
const projectController = require('../controllers/projectController');

router.post('/postsboard', projectController.postsboard);
router.get('/showfield', projectController.showfield);
router.get('/showMajorFields', projectController.showMajorFields);
router.get('/showMajorFields/:majorFieldId/subFields', projectController.showSubFields);
router.post('/createProjects', projectController.createProjects);
module.exports = router;