const express = require('express');
const User = require('../models/User');
const { auth, authorize } = require('../middleware/auth');

const router = express.Router();

// Get all users (admin only)
router.get('/', auth, authorize('admin'), async (req, res) => {
  try {
    const users = await User.find().select('-password');
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get user by ID
router.get('/:id', auth, async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Update user profile (user can update own profile, admin can update any)
router.put('/:id', auth, async (req, res) => {
  try {
    const { name, lastName, dob, age, address, phoneNumber, profilePhoto, role } = req.body;
    const user = await User.findById(req.params.id);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Users can only update their own profile (except role)
    // Admins can update any user's profile including role
    if (user._id.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to update this profile' });
    }

    // Only admin can change roles
    if (role && req.user.role === 'admin' && ['user', 'casting', 'admin'].includes(role)) {
      if (user._id.toString() === req.user.id) {
        return res.status(400).json({ message: 'Cannot modify your own role' });
      }
      user.role = role;
    }

    // Update profile fields
    if (name !== undefined) user.name = name;
    if (lastName !== undefined) user.lastName = lastName;
    if (dob !== undefined) user.dob = dob || null;
    if (age !== undefined) user.age = age || null;
    if (address !== undefined) user.address = address || '';
    if (phoneNumber !== undefined) user.phoneNumber = phoneNumber || '';
    if (profilePhoto !== undefined) user.profilePhoto = profilePhoto || null;

    await user.save();

    res.json({ message: 'Profile updated successfully', user });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Delete user (admin only)
router.delete('/:id', auth, authorize('admin'), async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (user._id.toString() === req.user.id) {
      return res.status(400).json({ message: 'Cannot delete your own account' });
    }

    await user.deleteOne();
    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;

