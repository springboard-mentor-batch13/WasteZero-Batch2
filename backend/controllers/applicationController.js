const Application = require('../models/Application');
const Opportunity = require('../models/Opportunity');
const mongoose = require('mongoose');

const deletedOpportunityTitle = 'Opportunity no longer exists';
const isMissingTitle = (value) => !value || value === 'title' || value === 'Unknown Opportunity';

const backfillOpportunityTitles = async () => {
    const applications = await Application.find({
        $or: [
            { opportunityTitle: { $exists: false } },
            { opportunityTitle: '' },
            { opportunityTitle: 'title' },
            { opportunityTitle: 'Unknown Opportunity' },
        ],
    }).populate('opportunityId', 'title');

    await Promise.all(applications.map((application) => {
        if (!isMissingTitle(application.opportunityTitle)) return Promise.resolve();
        application.opportunityTitle = application.opportunityId?.title || deletedOpportunityTitle;
        return application.save();
    }));
};

const applyForOpportunity = async (req, res) => {
    try {
        const { opportunityId } = req.body;

        const volunteerId = req.user._id;
        const fullName = req.user.fullName;
        const email = req.user.email;

        if (!opportunityId) {
            return res.status(400).json({
                success: false,
                message: 'Opportunity ID is required',
            });
        }

        if (!mongoose.Types.ObjectId.isValid(opportunityId)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid opportunity ID',
            });
        }

        const opportunity = await Opportunity.findById(opportunityId).select('title');

        if (!opportunity) {
            return res.status(404).json({
                success: false,
                message: 'Opportunity not found',
            });
        }

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
            opportunityTitle: opportunity.title,
            volunteerId,
            fullName,
            email,
        });

        res.status(201).json({
            success: true,
            message: 'Application submitted successfully',
            data: application,
        });
    } catch (error) {
        console.error(error);

        if (error.code === 11000) {
            return res.status(400).json({
                success: false,
                message: 'You have already applied for this opportunity',
            });
        }

        res.status(500).json({
            success: false,
            message: 'Server Error',
        });
    }
};

const getAllApplications = async (req, res) => {
    try {
        await backfillOpportunityTitles();

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

const getMyApplicationForOpportunity = async (req, res) => {
    try {
        if (!mongoose.Types.ObjectId.isValid(req.params.opportunityId)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid opportunity ID',
            });
        }

        const application = await Application.findOne({
            opportunityId: req.params.opportunityId,
            volunteerId: req.user._id,
        });

        res.status(200).json({
            success: true,
            data: {
                applied: !!application,
                application,
            },
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

        if (!application) {
            return res.status(404).json({
                success: false,
                message: 'Application not found',
            });
        }

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

        if (!application) {
            return res.status(404).json({
                success: false,
                message: 'Application not found',
            });
        }

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

const getVolunteerDashboardStats = async (req, res) => {
    try {
        const volunteerId = req.user._id;
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        // Total opportunities available in the system
        const availableOpportunities = await Opportunity.countDocuments();

        // Get every application submitted by this volunteer
        // and populate the corresponding opportunity date
        const myApplicationsList = await Application.find({
            volunteerId
        })
        .select('status opportunityId')
        .populate('opportunityId', 'date eventDate');

        // Pending + Accepted + Rejected
        const myApplications = myApplicationsList.length;

        let completedOpportunities = 0;
        let pendingOpportunities = 0;

        for (const application of myApplicationsList) {

            // Only accepted applications count as
            // completed/pending opportunities
            if (application.status !== 'Accepted') {
                continue;
            }

            const opportunity = application.opportunityId;

            // Ignore application if its opportunity was deleted
            if (!opportunity) {
                continue;
            }

            const opportunityDate =
                opportunity.date || opportunity.eventDate;

            if (!opportunityDate) {
                continue;
            }

            const eventDate = new Date(opportunityDate);
            eventDate.setHours(0, 0, 0, 0);

            if (eventDate < today) {
                completedOpportunities++;
            } else {
                pendingOpportunities++;
            }
        }

        res.status(200).json({
            success: true,
            data: {
                availableOpportunities,
                myApplications,
                completedOpportunities,
                pendingOpportunities
            }
        });

    } catch (error) {
        console.error(
            'Volunteer dashboard statistics error:',
            error
        );

        res.status(500).json({
            success: false,
            message: 'Server Error'
        });
    }
};

module.exports = {
    applyForOpportunity,
    getAllApplications,
    getMyApplicationForOpportunity,
    getVolunteerDashboardStats,
    acceptApplication,
    rejectApplication,
};
