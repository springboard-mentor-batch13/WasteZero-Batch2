const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
  {
    fullName: {
      type: String,
      required: [true, 'Fullname is required'],
      trim: true,
    },

    username: {
      type: String,
      required: [true, 'Username is required'],
      trim: true,
      unique: true,
    },

    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email address'],
    },

    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [8, 'Password must be at least 8 characters'],
    },

    role: {
      type: String,
      enum: ['Volunteer', 'NGO', 'Admin'],
      default: 'Volunteer',
    },

    status: {
      type: String,
      enum: ['Active', 'Suspended'],
      default: 'Active',
},

    // Existing profile location field
    // Kept for backward compatibility with Milestones 1 and 2
    location: {
      type: String,
      default: '',
      trim: true,
    },

    // Milestone 3 - structured geographic location for matching
    city: {
      type: String,
      default: '',
      trim: true,
    },

    state: {
      type: String,
      default: '',
      trim: true,
    },

    // Service areas covered by NGO
latitude: {
  type: Number,
  default: null,
},

longitude: {
  type: Number,
  default: null,
},

    // Existing skills field
    skills: {
      type: [String],
      default: [],
    },

    // Milestone 3 - volunteer waste preferences used for matching
    preferredWasteTypes: {
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

    bio: {
      type: String,
      default: '',
    },

    profileImage: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

// Milestone 3 - supports volunteer geographic matching
// Milestone 3 - supports volunteer and pickup matching
userSchema.index({
  role: 1,
  state: 1,
  city: 1,
  latitude: 1,
  longitude: 1,
});
module.exports = mongoose.model('User', userSchema, 'Users');