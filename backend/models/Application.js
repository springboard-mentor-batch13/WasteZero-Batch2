const mongoose = require('mongoose');

const applicationSchema = new mongoose.Schema(
    {
        opportunityId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Opportunity',
            required: [true, 'Opportunity ID is required'],
        },

        opportunityTitle: {
            type: String,
            required: [true, 'Opportunity title is required'],
            trim: true,
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

applicationSchema.index({ opportunityId: 1, volunteerId: 1 }, { unique: true });

module.exports = mongoose.model(
    'Application',
    applicationSchema,
    'Applications'
);
