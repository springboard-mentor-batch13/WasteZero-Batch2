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
    description: {
      type: String,
      required: [true, 'Description is required'],
    },
    requiredSkills: {
      type: [String],
      default: [],
    },
    duration: {
      type: String,
      required: [true, 'Duration is required'],
    },
    location: {
      type: String,
      required: [true, 'Location is required'],
    },
    // Optional listing fields. Keeping these optional preserves existing records.
    category: { type: String },
    eventDate: { type: String },
    requiredVolunteers: { type: Number },
    imageUrl: { type: String, default: '' },
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

module.exports = mongoose.model('Opportunity', opportunitySchema, 'Opportunities');
