const mongoose = require('mongoose');

const opportunitySchema = new mongoose.Schema(
  {
    ngoId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'NGO ID is required'],
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
    category: {
      type: String,
      enum: ['Environment', 'Healthcare', 'Education', 'Animal Welfare', 'Community Service'],
      required: [true, 'Category is required'],
    },
    imageUrl: {
    type: String,
    default: "",
},
    requiredVolunteers: {
      type: Number,
      required: [true, 'Required volunteers is required'],
      min: [1, 'Required volunteers must be at least 1'],
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
