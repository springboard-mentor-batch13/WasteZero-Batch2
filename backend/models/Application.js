const mongoose = require('mongoose');

const applicationSchema = new mongoose.Schema(
    {
        opportunityId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Opportunity',
            required: [true, 'Opportunity ID is required'],
        },

        volunteerId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: [true, 'Volunteer ID is required'],
        },

        fullName: {
            type: String,
            required: [true, 'Full name is required'],
            trim: true,
        },

        email: {
            type: String,
            required: [true, 'Email is required'],
            trim: true,
            lowercase: true,
        },

        phoneNumber: {
            type: String,
            required: [true, 'Phone number is required'],
        },

        reason: {
            type: String,
            required: [true, 'Reason is required'],
        },

        skills: {
            type: [String],
            default: [],
        },

        availability: {
            type: String,
            required: [true, 'Availability is required'],
        },

        status: {
            type: String,
            enum: ['Pending', 'Accepted', 'Rejected'],
            default: 'Pending',
        },
    },
    {
        timestamps: true,
    }
);

module.exports = mongoose.model(
    'Application',
    applicationSchema,
    'Applications'
);