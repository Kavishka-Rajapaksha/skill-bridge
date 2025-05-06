const express = require('express');
const router = express.Router();
const groupController = require('../main/java/com/example/backend/controller/groupController');
const { authenticateToken } = require('../middleware/authMiddleware');

// Create a new group (protected route)
router.post('/', authenticateToken, groupController.createGroup);

// Get all groups
router.get('/', groupController.getAllGroups);

// Get group by ID
router.get('/:id', groupController.getGroupById);

module.exports = router;
