const Pickup = require('../models/Pickup');
const User = require('../models/User');

/**
 * Create Pickup Request
 * Volunteer Only
 */
const createPickup = async (req, res) => {
  try {

    if (req.user.role !== 'Volunteer') {
      return res.status(403).json({
        success: false,
        message: 'Only volunteers can create pickup requests.',
      });
    }
    const {
  wasteType,
  pickupAddress,
  state,
  city,
  area,
  pickupDate,
  pickupTime,
} = req.body;

    if (
  !wasteType ||
  !pickupAddress ||
  !state ||
  !city ||
  !area ||
  !pickupDate ||
  !pickupTime
) {
      return res.status(400).json({
        success: false,
        message: 'Please provide all required fields.',
      });
    }

    const matchedNgos = await User.find({
  role: 'NGO',
  state,
  city,
  serviceAreas: { $in: [area] },
});

if (matchedNgos.length === 0) {
  return res.status(404).json({
    success: false,
    message: 'No NGO available for this location.',
  });
}

// Pick the nearest/best NGO.
// For now, use the first match.
// This can later be replaced with distance-based logic.
const matchedNgo = matchedNgos[0];

if (!matchedNgo) {
  return res.status(404).json({
    success: false,
    message: 'No NGO available for this location.',
  });
}

   

    const pickup = await Pickup.create({
      user: req.user._id,
      ngo: matchedNgo._id,
      wasteType,
      pickupAddress,
      state,
      city,
      area,
      pickupDate,
      pickupTime,
      status: 'Pending',
    });

    res.status(201).json({
      success: true,
      message: 'Pickup request created successfully.',
      data: pickup,
    });

  } catch (error) {

    console.error(error);

    res.status(500).json({
      success: false,
      message: 'Server Error',
    });

  }
};

/**
 * Volunteer Dashboard
 */
const getMyPickups = async (req, res) => {
  try {

    const pickups = await Pickup.find({
      user: req.user._id,
    })
      .populate('ngo', 'username fullName')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: pickups.length,
      data: pickups,
    });

  } catch (error) {

    console.error(error);

    res.status(500).json({
      success: false,
      message: 'Server Error',
    });

  }
};

/**
 * NGO Dashboard
 */
const getAssignedPickups = async (req, res) => {
  try {

    if (req.user.role !== 'NGO') {
      return res.status(403).json({
        success: false,
        message: 'Only NGOs can access assigned pickups.',
      });
    }

    const pickups = await Pickup.find({
      ngo: req.user._id,
    })
      .populate('user', 'fullName username email')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: pickups.length,
      data: pickups,
    });

  } catch (error) {

    console.error(error);

    res.status(500).json({
      success: false,
      message: 'Server Error',
    });

  }
};

/**
 * Get Pickup by ID
 */
const getPickupById = async (req, res) => {
  try {

    const pickup = await Pickup.findById(req.params.id)
      .populate('user', 'fullName username email')
      .populate('ngo', 'fullName username');

    if (!pickup) {
      return res.status(404).json({
        success: false,
        message: 'Pickup not found',
      });
    }

    res.status(200).json({
      success: true,
      data: pickup,
    });

  } catch (error) {

    console.error(error);

    res.status(500).json({
      success: false,
      message: 'Server Error',
    });

  }
};

/**
 * Update Pickup
 * Volunteer Only
 */
const updatePickup = async (req, res) => {
  try {

    const pickup = await Pickup.findById(req.params.id);

    if (!pickup) {
      return res.status(404).json({
        success: false,
        message: 'Pickup not found',
      });
    }

    if (req.user.role !== 'Volunteer') {
      return res.status(403).json({
        success: false,
        message: 'Only volunteers can update pickup requests.',
      });
    }

    if (pickup.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to update this pickup.',
      });
    }

    const {
      wasteType,
      pickupAddress,
      state,
      city,
      area,
      pickupDate,
      pickupTime,
    } = req.body;

    if (wasteType) pickup.wasteType = wasteType;
    if (pickupAddress) pickup.pickupAddress = pickupAddress;
    if (state) pickup.state = state;
    if (city) pickup.city = city;
    if (area) pickup.area = area;
    if (pickupDate) pickup.pickupDate = pickupDate;
    if (pickupTime) pickup.pickupTime = pickupTime;

    await pickup.save();

    res.status(200).json({
      success: true,
      message: 'Pickup updated successfully.',
      data: pickup,
    });

  } catch (error) {

    console.error(error);

    res.status(500).json({
      success: false,
      message: 'Server Error',
    });

  }
};

/**
 * Accept Pickup
 * NGO Only
 */
const acceptPickup = async (req, res) => {
  try {

    if (req.user.role !== 'NGO') {
      return res.status(403).json({
        success: false,
        message: 'Only NGOs can accept pickup requests.',
      });
    }

    const pickup = await Pickup.findById(req.params.id);

    if (!pickup) {
      return res.status(404).json({
        success: false,
        message: 'Pickup not found',
      });
    }

    if (pickup.ngo.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized',
      });
    }

    pickup.status = 'Accepted';

    await pickup.save();

    res.status(200).json({
      success: true,
      message: 'Pickup accepted successfully.',
      data: pickup,
    });

  } catch (error) {

    console.error(error);

    res.status(500).json({
      success: false,
      message: 'Server Error',
    });

  }
};

/**
 * Reject Pickup
 */
const rejectPickup = async (req, res) => {
  try {

    if (req.user.role !== 'NGO') {
      return res.status(403).json({
        success: false,
        message: 'Only NGOs can reject pickup requests.',
      });
    }

    const pickup = await Pickup.findById(req.params.id);

    if (!pickup) {
      return res.status(404).json({
        success: false,
        message: 'Pickup not found',
      });
    }

    if (pickup.ngo.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized',
      });
    }

    pickup.status = 'Rejected';

    await pickup.save();

    res.status(200).json({
      success: true,
      message: 'Pickup rejected successfully.',
      data: pickup,
    });

  } catch (error) {

    console.error(error);

    res.status(500).json({
      success: false,
      message: 'Server Error',
    });

  }
};

/**
 * Complete Pickup
 */
const completePickup = async (req, res) => {
  try {

    if (req.user.role !== 'NGO') {
      return res.status(403).json({
        success: false,
        message: 'Only NGOs can complete pickup requests.',
      });
    }

    const pickup = await Pickup.findById(req.params.id);

    if (!pickup) {
      return res.status(404).json({
        success: false,
        message: 'Pickup not found',
      });
    }

    if (pickup.ngo.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized',
      });
    }

    pickup.status = 'Completed';

    await pickup.save();

    res.status(200).json({
      success: true,
      message: 'Pickup marked as completed.',
      data: pickup,
    });

  } catch (error) {

    console.error(error);

    res.status(500).json({
      success: false,
      message: 'Server Error',
    });

  }
};

/**
 * Delete Pickup
 * Volunteer Only
 */
const deletePickup = async (req, res) => {
  try {

    const pickup = await Pickup.findById(req.params.id);

    if (!pickup) {
      return res.status(404).json({
        success: false,
        message: 'Pickup not found',
      });
    }

    if (req.user.role !== 'Volunteer') {
      return res.status(403).json({
        success: false,
        message: 'Only volunteers can delete pickup requests.',
      });
    }

    if (pickup.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to delete this pickup.',
      });
    }

    await pickup.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Pickup deleted successfully.',
    });

  } catch (error) {

    console.error(error);

    res.status(500).json({
      success: false,
      message: 'Server Error',
    });

  }
};
/**
 * Pickup Matching API
 */
const matchPickup = async (req, res) => {
  try {

    const pickup = await Pickup.findById(req.params.id);

    if (!pickup) {
      return res.status(404).json({
        success: false,
        message: 'Pickup not found',
      });
    }

    const ngo = await User.findOne({
      role: 'NGO',
      state: pickup.state,
      city: pickup.city,
      serviceAreas: pickup.area,
    }).select('fullName email state city serviceAreas');

    res.status(200).json({
      success: true,
      pickup,
      matchedNgo: ngo,
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
  createPickup,
  getMyPickups,
  getAssignedPickups,
  getPickupById,
  updatePickup,
  acceptPickup,
  rejectPickup,
  completePickup,
  deletePickup,
  matchPickup,
};