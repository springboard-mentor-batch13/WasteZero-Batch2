const mongoose = require('mongoose');

const pickupSchema = new mongoose.Schema(
  {
    // Volunteer who created the pickup request
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User reference is required'],
    },

    // NGO assigned to handle the pickup
    ngo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },

    // Waste type
    wasteType: {
      type: String,
      enum: [
        'Plastic',
        'Paper',
        'Glass',
        'Metal',
        'Organic',
        'E-Waste',
        'Mixed',
      ],
      required: [true, 'Waste type is required'],
      trim: true,
    },

    // Complete pickup address
    pickupAddress: {
      type: String,
      required: [true, 'Pickup address is required'],
      trim: true,
    },

    // State
    state: {
      type: String,
      required: [true, 'State is required'],
      trim: true,
    },

    // City
    city: {
      type: String,
      required: [true, 'City is required'],
      trim: true,
    },

    // Area (used for NGO matching)
    area: {
      type: String,
      required: [true, 'Area is required'],
      trim: true,
    },

   



    // Pickup Date
    pickupDate: {
      type: Date,
      required: [true, 'Pickup date is required'],
    },

    // Preferred Pickup Time
    pickupTime: {
      type: String,
      required: [true, 'Pickup time is required'],
    },

    // Pickup Status
    status: {
      type: String,
      enum: [
  'Pending',
  'Accepted',
  'Rejected',
  'Completed',
  'Cancelled'
],
      default: 'Pending',
    },
  },
  {
    timestamps: true,
  }
);

// Index for faster NGO matching
pickupSchema.index({
    state:1,
    city:1,
   
    wasteType:1,
    status:1
});

module.exports = mongoose.model('Pickup', pickupSchema);
