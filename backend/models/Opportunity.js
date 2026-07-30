const mongoose = require('mongoose');

const opportunitySchema = new mongoose.Schema(
  {
    ngoId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'NGO ID is required'],
    },
    postedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Posted by user is required'],
    },
    title: {
      type: String,
      required: [true, 'Title is required'],
      trim: true,
    },
    category: {
      type: String,
      enum: ['Environment', 'Healthcare', 'Education', 'Animal Welfare', 'Community Service'],
      required: [true, 'Category is required'],
    },
    description: {
      type: String,
      required: [true, 'Description is required'],
    },
    requiredSkills: {
      type: [String],
      default: [],
    },
    // Milestone 3 - waste types used for volunteer-opportunity matching
wasteTypes: {
  type: [
    {
      type: String,
      enum: [
        'Plastic',
        'Organic',
        'E-Waste',
        'Paper',
        'Glass',
        'Metal',
        'Mixed',
      ],
    },
  ],
  default: [],
},
    duration: {
      type: String,
      required: [true, 'Duration is required'],
    },
    city: {
      type: String,
      required: [true, 'City is required'],
      trim: true,
    },
    state: {
      type: String,
      required: [true, 'State is required'],
      trim: true,
    },
    date: {
      type: Date,
      required: [true, 'Date is required'],
    },
    location: {
      type: String,
    },
    eventDate: {
      type: String,
    },
    requiredVolunteers: {
      type: Number,
      required: [true, 'Required volunteers is required'],
      min: [1, 'Required volunteers must be at least 1'],
    },
    imageUrl: {
      type: String,
      default: '',
    },
    status: {
      type: String,
      enum: ['Open', 'Closed', 'In Progress'],
      default: 'Open',
    },
  },
  {
    timestamps: true,
  }
);

// Milestone 3 - supports matching open opportunities
// by geographic location and waste type
opportunitySchema.index({
  status: 1,
  city: 1,
  state: 1,
  wasteTypes: 1,
});
module.exports = mongoose.model('Opportunity', opportunitySchema, 'Opportunities');
