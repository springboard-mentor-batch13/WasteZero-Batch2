const Application = require('../models/Application');

const applyForOpportunity = async (req, res) => {
    try {
        const {
            opportunityId,
            fullName,
            email,
            phoneNumber,
            reason,
            skills,
            availability,
        } = req.body;

        const volunteerId = req.user._id;

        const existingApplication = await Application.findOne({
            opportunityId,
            volunteerId,
        });

        if (existingApplication) {
            return res.status(400).json({
                success: false,
                message: 'You have already applied for this opportunity',
            });
        }

        const application = await Application.create({
            opportunityId,
            volunteerId,
            fullName,
            email,
            phoneNumber,
            reason,
            skills,
            availability,
        });

        res.status(201).json({
            success: true,
            message: 'Application submitted successfully',
            data: application,
        });
    } catch (error) {
        console.error(error);

        res.status(500).json({
            success: false,
            message: 'Server Error',
        });
    }
};

const getAllApplications = async (req, res) => {
    try {
        const applications = await Application.find()
            .populate('volunteerId', 'fullName email')
            .populate('opportunityId', 'title');

        res.status(200).json({
            success: true,
            data: applications,
        });
    } catch (error) {
        console.error(error);

        res.status(500).json({
            success: false,
            message: 'Server Error',
        });
    }
};

const acceptApplication = async (req, res) => {
    try {
        const application = await Application.findByIdAndUpdate(
            req.params.id,
            { status: 'Accepted' },
            { new: true }
        );

        res.status(200).json({
            success: true,
            message: 'Application accepted',
            data: application,
        });
    } catch (error) {
        console.error(error);

        res.status(500).json({
            success: false,
            message: 'Server Error',
        });
    }
};

const rejectApplication = async (req, res) => {
    try {
        const application = await Application.findByIdAndUpdate(
            req.params.id,
            { status: 'Rejected' },
            { new: true }
        );

        res.status(200).json({
            success: true,
            message: 'Application rejected',
            data: application,
        });
    } catch (error) {
        console.error(error);

        res.status(500).json({
            success: false,
            message: 'Server Error',
        });
    }
};

module.exports = {
    applyForOpportunity,
    getAllApplications,
    acceptApplication,
    rejectApplication,
};