const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
  {
    fullName: {
      type: String,
      required: [true, 'Full name is required'],
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

<<<<<<< HEAD
<<<<<<< HEAD

    // Profile fields

=======
>>>>>>> origin/ritika
=======

    // Profile fields

>>>>>>> main
    location: {
      type: String,
      default: '',
    },

    skills: {
<<<<<<< HEAD
<<<<<<< HEAD
      type: String,
      default: '',
=======
      type: [String],
      default: [],
>>>>>>> origin/ritika
=======
      type: [String],
      default: [],
>>>>>>> main
    },

    bio: {
      type: String,
      default: '',
    },

    profileImage: {
      type: String,
      default: '',
<<<<<<< HEAD
<<<<<<< HEAD
    }

=======
    },
>>>>>>> origin/ritika
=======
    }

>>>>>>> main
  },
  {
    timestamps: true,
  }
);


module.exports = mongoose.model('User', userSchema, 'Users');