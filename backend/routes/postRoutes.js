const express = require('express');
const router = express.Router();
const postController = require('../controllers/postController');
const { authenticateToken } = require('../middleware/authMiddleware');

// Create a new post (protected route)
router.post('/', authenticateToken, postController.createPost);

// Get all posts
router.get('/', postController.getAllPosts);

// Get posts by group
router.get('/group/:groupId', postController.getPostsByGroup);

module.exports = router;
