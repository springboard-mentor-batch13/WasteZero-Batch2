// const mongoose = require('mongoose');

// const opportunitySchema = new mongoose.Schema(
//   {
//     ngoId: {
//       type: mongoose.Schema.Types.ObjectId,
//       ref: 'User',
//       required: [true, 'NGO ID is required'],
//     },
//     title: {
//       type: String,
//       required: [true, 'Title is required'],
//       trim: true,
//     },
//     description: {
//       type: String,
//       required: [true, 'Description is required'],

//     title: {
//       type: String,
//       required: [true, 'Title is required'],
//       trim: true,
//     },
//     description: {
//       type: String,
//       required: [true, 'Description is required'],
//     },
//     requiredSkills: {
//       type: [String],
//       default: [],
//     },
//     duration: {
//       type: String,
//       required: [true, 'Duration is required'],
//     },
//     city: {
//       type: String,
//       required: [true, 'City is required'],
//       trim: true,
//     },

//     state: {
//       type: String,
//       required: [true, 'State is required'],
//       trim: true,
//     },

//     date: {
//       type: Date,
//       required: [true, 'Date is required'],
//     },
  
//     status: {
//       type: String,
//       enum: ['Open', 'Closed', 'In Progress'],
//       default: 'Open',
//     },
//   },
//   {
//     timestamps: true,
//   }
// );

// module.exports = mongoose.model('Opportunity', opportunitySchema, 'Opportunities');

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

    // New fields added by Ritika
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

    // Existing fields (keep them if the frontend still uses them)
    location: {
      type: String,
    },
category: {
  type: String,
},

eventDate: {
  type: String,
},

requiredVolunteers: {
  type: Number,
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

module.exports = mongoose.model('Opportunity', opportunitySchema, 'Opportunities');
