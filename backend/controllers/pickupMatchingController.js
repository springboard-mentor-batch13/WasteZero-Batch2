const User = require('../models/User');

// Get NGOs matching volunteer location
const getMatchingNGOs = async (req, res) => {
  try {
    const { state, city, area } = req.query;

    if (!state || !city || !area) {
      return res.status(400).json({
        success: false,
        message: 'State, city and area are required.',
      });
    }

    const ngos = await User.find({
      role: 'NGO',
      state,
      city,
      serviceAreas: area,
    }).select('_id fullName username city state serviceAreas');

    res.status(200).json({
      success: true,
      count: ngos.length,
      data: ngos,
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
  getMatchingNGOs,
};
