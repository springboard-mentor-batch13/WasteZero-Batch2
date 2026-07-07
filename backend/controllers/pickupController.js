const Pickup = require('../models/Pickup');

/**
 * Create a new pickup request for the authenticated user.
 */
const createPickup = async (req, res) => {
  try {
    const { wasteType, pickupAddress, pickupDate } = req.body;

    // Validate required fields
    if (!wasteType || !pickupAddress || !pickupDate) {
      return res.status(400).json({
        success: false,
        message: 'Please provide wasteType, pickupAddress, and pickupDate',
      });
    }

    // Create the pickup document
    const pickup = await Pickup.create({
      user: req.user._id,
      wasteType,
      pickupAddress,
      pickupDate,
    });

    // Return success response
    res.status(201).json({
      success: true,
      message: 'Pickup request created successfully',
      data: pickup,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error', error: error.message });
  }
};

/**
 * Get all pickups belonging to the authenticated user.
 */
const getMyPickups = async (req, res) => {
  try {
    // Find all pickups for the logged-in user and sort by newest first
    const pickups = await Pickup.find({ user: req.user._id }).sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: pickups,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error', error: error.message });
  }
};

/**
 * Get a single pickup by its ID.
 */
const getPickupById = async (req, res) => {
  try {
    const pickup = await Pickup.findById(req.params.id);

    // Return 404 if not found
    if (!pickup) {
      return res.status(404).json({ success: false, message: 'Pickup not found' });
    }

    res.status(200).json({
      success: true,
      data: pickup,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error', error: error.message });
  }
};

/**
 * Update an existing pickup by ID.
 */
const updatePickup = async (req, res) => {
  try {
    const { wasteType, pickupAddress, pickupDate, status } = req.body;

    // Build update object based on provided fields
    const updateFields = {};
    if (wasteType) updateFields.wasteType = wasteType;
    if (pickupAddress) updateFields.pickupAddress = pickupAddress;
    if (pickupDate) updateFields.pickupDate = pickupDate;
    if (status) updateFields.status = status;

    const pickup = await Pickup.findByIdAndUpdate(
      req.params.id,
      { $set: updateFields },
      { new: true, runValidators: true } // Returns the modified document
    );

    // Return 404 if not found
    if (!pickup) {
      return res.status(404).json({ success: false, message: 'Pickup not found' });
    }

    res.status(200).json({
      success: true,
      message: 'Pickup updated successfully',
      data: pickup,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error', error: error.message });
  }
};

/**
 * Delete a pickup by ID.
 */
const deletePickup = async (req, res) => {
  try {
    const pickup = await Pickup.findByIdAndDelete(req.params.id);

    // Return 404 if not found
    if (!pickup) {
      return res.status(404).json({ success: false, message: 'Pickup not found' });
    }

    res.status(200).json({
      success: true,
      message: 'Pickup deleted successfully',
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error', error: error.message });
  }
};

module.exports = {
  createPickup,
  getMyPickups,
  getPickupById,
  updatePickup,
  deletePickup,
};
