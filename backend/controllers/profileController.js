const User = require('../models/User');
const bcrypt = require('bcrypt');

// =========================
// Fetch User Profile
// =========================
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

// =========================
// Update User Profile
// =========================
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
      city,
      state,
      preferredWasteTypes,
    } = req.body;

    user.fullName = fullName ?? user.fullName;
    user.location = location ?? user.location;
    user.skills = skills ?? user.skills;
    user.bio = bio ?? user.bio;
    user.profileImage = profileImage ?? user.profileImage;
    user.city = city ?? user.city;
    user.state = state ?? user.state;
    user.preferredWasteTypes =
      preferredWasteTypes ?? user.preferredWasteTypes;

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

// =========================
// Get NGO Service Areas
// =========================
const getServiceAreas = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select(
      'state city serviceAreas role'
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    if (user.role !== 'NGO') {
      return res.status(403).json({
        success: false,
        message: 'Only NGOs can access service areas.',
      });
    }

    res.status(200).json({
      success: true,
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

// =========================
// Update NGO Service Areas
// =========================
const updateServiceAreas = async (req, res) => {
  try {
    const { state, city, serviceAreas } = req.body;

    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    if (user.role !== 'NGO') {
      return res.status(403).json({
        success: false,
        message: 'Only NGOs can update service areas.',
      });
    }

    user.state = state ?? user.state;
    user.city = city ?? user.city;
    user.serviceAreas = serviceAreas ?? user.serviceAreas;

    const updatedUser = await user.save();

    res.status(200).json({
      success: true,
      message: 'Service areas updated successfully.',
      data: updatedUser,
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      message: 'Server Error',
    });
  }
};

// =========================
// Change Password
// =========================
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
  getServiceAreas,
  updateServiceAreas,
  changePassword,
};
