const Pickup = require('../models/Pickup');
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
    const query =
      req.user.role === 'NGO' || req.user.role === 'Admin'
        ? {}
        : { user: req.user._id };

    const pickups = await populatePickupUser(
      Pickup.find(query).sort({ createdAt: -1 })
    );

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
    const pickup = await populatePickupUser(Pickup.findById(req.params.id));

    // Return 404 if not found
    if (!pickup) {
      return res.status(404).json({ success: false, message: 'Pickup not found' });
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
