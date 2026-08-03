const Pickup = require('../models/Pickup');
const User = require('../models/User');
const Notification = require('../models/Notification');

const populatePickupUser = (query) =>
  query.populate('user', 'fullName username email phone contact mobile');

const createPickupNotification = async ({
  recipientId = null,
  recipientRole,
  sourceRole,
  title,
  message,
  redirectUrl,
}) => {
  return Notification.create({
    recipientId,
    recipientRole,
    sourceRole,
    title,
    message,
    type: 'System',
    redirectUrl,
  });
};

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
      ngo,
      wasteType,
      pickupAddress,
      state,
      city,
      area,
      pickupDate,
      pickupTime,
    } = req.body;

    if (
      !ngo ||
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

    const ngoUser = await User.findOne({
      _id: ngo,
      role: 'NGO',
    });

    if (!ngoUser) {
      return res.status(404).json({
        success: false,
        message: 'Selected NGO not found.',
      });
    }

    const pickup = await Pickup.create({
      user: req.user._id,
      ngo,
      wasteType,
      pickupAddress,
      state,
      city,
      area,
      pickupDate,
      pickupTime,
      status: 'Pending',
    });

    await createPickupNotification({
      recipientRole: 'NGO',
      sourceRole: 'Volunteer',
      title: 'Pickup Scheduled',
      message: `${req.user.fullName || req.user.username || 'A volunteer'} scheduled a pickup for ${wasteType}.`,
      redirectUrl: '/ngo/pickup-requests',
    });

    // Return success response
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
    const pickup = await populatePickupUser(Pickup.findById(req.params.id));

    const pickup = await Pickup.findById(req.params.id)
      .populate('user', 'fullName username email')
      .populate('ngo', 'fullName username');

    if (!pickup) {
      return res.status(404).json({
        success: false,
        message: 'Pickup not found',
      });
    }

    const isOwner = pickup.user?._id?.toString() === req.user._id.toString();
    const canManagePickups = req.user.role === 'NGO' || req.user.role === 'Admin';

    if (!isOwner && !canManagePickups) {
      return res.status(403).json({ success: false, message: 'Forbidden: insufficient role' });
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
    const { wasteType, pickupAddress, pickupDate, status } = req.body;

    // Build update object based on provided fields
    const updateFields = {};
    if (wasteType) updateFields.wasteType = wasteType;
    if (pickupAddress) updateFields.pickupAddress = pickupAddress;
    if (pickupDate) updateFields.pickupDate = pickupDate;
    if (status) updateFields.status = status;

    const existingPickup = await Pickup.findById(req.params.id);

    if (!existingPickup) {
      return res.status(404).json({ success: false, message: 'Pickup not found' });
    }

    const isOwner = existingPickup.user.toString() === req.user._id.toString();
    const canManagePickups = req.user.role === 'NGO' || req.user.role === 'Admin';

    if (!isOwner && !canManagePickups) {
      return res.status(403).json({ success: false, message: 'Forbidden: insufficient role' });
    }

    if (status && !canManagePickups) {
      return res.status(403).json({ success: false, message: 'Only NGOs or Admins can update pickup status' });
    }

    const pickup = await populatePickupUser(Pickup.findByIdAndUpdate(
      req.params.id,
      { $set: updateFields },
      { new: true, runValidators: true } // Returns the modified document
    ));

    if (status && status !== existingPickup.status) {
      const statusTitle =
        status === 'Assigned'
          ? 'Pickup Accepted'
          : status === 'Cancelled'
            ? 'Pickup Rejected'
            : 'Pickup Status Updated';
      const statusMessage =
        status === 'Assigned'
          ? 'Your pickup request has been accepted by the NGO.'
          : status === 'Cancelled'
            ? 'Your pickup request has been rejected by the NGO.'
            : `Your pickup request status changed to ${status}.`;

      await createPickupNotification({
        recipientId: existingPickup.user,
        recipientRole: 'Volunteer',
        sourceRole: req.user.role,
        title: statusTitle,
        message: statusMessage,
        redirectUrl: '/notifications',
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
};
