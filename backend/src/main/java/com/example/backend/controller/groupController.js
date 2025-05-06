const Group = require('../models/Group');
const User = require('../models/User');

// Create a new group
exports.createGroup = async (req, res) => {
  try {
    const { name, description, members, admin } = req.body;
    
    if (!name || !admin) {
      return res.status(400).json({ message: 'Group name and admin are required' });
    }

    const newGroup = new Group({
      name,
      description,
      members: members || [],
      admin
    });

    // Add admin to members if not already included
    if (!newGroup.members.includes(admin)) {
      newGroup.members.push(admin);
    }

    const savedGroup = await newGroup.save();
    res.status(201).json(savedGroup);
  } catch (error) {
    console.error('Error creating group:', error);
    res.status(500).json({ message: 'Server error while creating group', error: error.message });
  }
};

// Get all groups
exports.getAllGroups = async (req, res) => {
  try {
    const groups = await Group.find();
    res.status(200).json(groups);
  } catch (error) {
    console.error('Error fetching groups:', error);
    res.status(500).json({ message: 'Server error while fetching groups' });
  }
};

// Get group by ID
exports.getGroupById = async (req, res) => {
  try {
    const group = await Group.findById(req.params.id);
    if (!group) {
      return res.status(404).json({ message: 'Group not found' });
    }
    res.status(200).json(group);
  } catch (error) {
    console.error('Error fetching group:', error);
    res.status(500).json({ message: 'Server error while fetching group' });
  }
};
