const express = require('express');
const router = express.Router();
const projectController = require('../controllers/projectController');

router.post('/postsboard', projectController.postsboard);
<<<<<<< HEAD

module.exports = router;

=======
router.post('/create', projectController.createProjects);
module.exports = router;
>>>>>>> d1ba96076da5b6faeda49ceb94a67334a0df3202
