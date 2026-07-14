const User = require('../models/User');
const bcrypt = require('bcrypt');

// Fetch user profile
const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    res.status(200).json({
      success: true,
      message: 'Profile fetched successfully',
      data: user,
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      message: 'Server Error',
    });
  }
};

// Update user profile
const updateProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    const {
      fullName,
      location,
      skills,
      bio,
      profileImage,
    } = req.body;

    if (fullName) user.fullName = fullName;
    if (location) user.location = location;
    if (skills) user.skills = skills;
    if (bio) user.bio = bio;
    if (profileImage) user.profileImage = profileImage;

    const updatedUser = await user.save();

    const userObj = updatedUser.toObject();
    delete userObj.password;

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      data: userObj,
    });
  } catch (error) {
    console.error('Profile update error:', error);

    res.status(500).json({
      success: false,
      message: 'Server Error',
    });
  }
};

// Change Password
const changePassword = async (req, res) => {
  try {
    const {
      currentPassword,
      newPassword,
      confirmPassword,
    } = req.body;

    if (!currentPassword || !newPassword || !confirmPassword) {
      return res.status(400).json({
        success: false,
        message: 'All password fields required',
      });
    }

    if (newPassword !== confirmPassword) {
      return res.status(400).json({
        success: false,
        message: 'Passwords do not match',
      });
    }

    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    const match = await bcrypt.compare(currentPassword, user.password);

    if (!match) {
      return res.status(400).json({
        success: false,
        message: 'Current password incorrect',
      });
    }

    user.password = await bcrypt.hash(newPassword, 10);

    await user.save();

    res.status(200).json({
      success: true,
      message: 'Password changed successfully',
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      message: 'Server Error',
    });
  }
};

module.exports = {
  getProfile,
  updateProfile,
  changePassword,
};