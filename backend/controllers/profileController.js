/**
 * Profile Controller
 * 
 * This controller handles logic related to user profiles.
 * Currently, it contains placeholder functions for fetching and updating
 * the profile, which will later integrate with the User model and database.
 */
const User = require('../models/User');

// Fetch the authenticated user's profile
const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select("-password");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }

    res.status(200).json({
      success: true,
      message: "Profile fetched successfully",
      data: user
    });
  } catch (error) {
    console.error(`Error in getProfile: ${error.message}`);
    res.status(500).json({
      success: false,
      message: "Server Error"
    });
  }
};

// Update user profile
const updateProfile = async (req, res) => {
  try {
    // Fetch the user document using the ID from the protect middleware
    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }

    // Extract only the allowed fields from the request body
    // email, password, and role are ignored if sent
    const {
      fullName,
      location,
      skills,
      bio,
      profileImage
    } = req.body;

    if (fullName) user.fullName = fullName;
    if (location) user.location = location;
    if (skills) user.skills = skills;
    if (bio) user.bio = bio;
    if (profileImage) user.profileImage = profileImage;

    // Save the updated user document
    const updatedUser = await user.save();

    // Convert the Mongoose document to a plain JavaScript object
    // so we can delete the password field before sending it in the response
    const userObj = updatedUser.toObject();
    delete userObj.password;

    res.status(200).json({
      success: true,
      message: "Profile updated successfully",
      data: userObj
    });
  } catch (error) {
    console.error(`Error in updateProfile: ${error.message}`);
    res.status(500).json({
      success: false,
      message: "Server Error"
    });
  }
};

module.exports = {
  getProfile,
  updateProfile
};
