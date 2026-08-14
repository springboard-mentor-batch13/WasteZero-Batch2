const Application = require('../models/Application');
const Opportunity = require('../models/Opportunity');
const Notification = require('../models/Notification'); // 👈 Import Notification Model
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

        // Check if user is suspended
        if (req.user.status === 'Suspended') {
            return res.status(403).json({
                success: false,
                message: 'You are suspended!'
            });
        }

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

        // Fetch opportunity title along with createdBy / ngoId for notification routing
        const opportunity = await Opportunity.findById(opportunityId).select('title createdBy ngoId');

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

        // ----------------------------------------------------
        // 🔔 1. NOTIFICATION TRIGGER: FOR NGO & ADMIN
        // ----------------------------------------------------
        const ngoRecipientId = opportunity.createdBy || opportunity.ngoId;

        // Trigger Notification for the NGO owner of the opportunity
        if (ngoRecipientId) {
            await Notification.create({
                recipientId: ngoRecipientId,
                recipientRole: 'NGO',
                sourceRole: 'Volunteer',
                title: 'New Application Received',
                message: `${fullName} applied for your opportunity "${opportunity.title}".`,
                type: 'Opportunity',
                redirectUrl: '/admin/applications'
            });
        }

        // Trigger Broadcast Notification for Admin monitors
        await Notification.create({
            recipientId: null,
            recipientRole: 'Admin',
            sourceRole: 'Volunteer',
            title: 'Volunteer Applied',
            message: `${fullName} applied for "${opportunity.title}".`,
            type: 'Opportunity',
            redirectUrl: '/admin/applications'
        });

        res.status(201).json({
            success: true,
            message: 'Application submitted successfully',
            data: application,
        });
    } catch (error) {
        console.error('Apply for opportunity error:', error);

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
        ).populate('opportunityId', 'title');

        if (!application) {
            return res.status(404).json({
                success: false,
                message: 'Application not found',
            });
        }

        // ----------------------------------------------------
        // 🔔 2. NOTIFICATION TRIGGER: FOR VOLUNTEER (ACCEPTED)
        // ----------------------------------------------------
        const oppTitle = application.opportunityTitle || application.opportunityId?.title || 'the opportunity';
        
        await Notification.create({
            recipientId: application.volunteerId,
            recipientRole: 'Volunteer',
            sourceRole: 'NGO',
            title: 'Application Accepted',
            message: `Your application for "${oppTitle}" has been accepted!`,
            type: 'Opportunity',
            redirectUrl: '/opportunities'
        });

        res.status(200).json({
            success: true,
            message: 'Application accepted',
            data: application,
        });
    } catch (error) {
        console.error('Accept application error:', error);

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
        ).populate('opportunityId', 'title');

        if (!application) {
            return res.status(404).json({
                success: false,
                message: 'Application not found',
            });
        }

        // ----------------------------------------------------
        // 🔔 3. NOTIFICATION TRIGGER: FOR VOLUNTEER (REJECTED)
        // ----------------------------------------------------
        const oppTitle = application.opportunityTitle || application.opportunityId?.title || 'the opportunity';

        await Notification.create({
            recipientId: application.volunteerId,
            recipientRole: 'Volunteer',
            sourceRole: 'NGO',
            title: 'Application Rejected',
            message: `Your application for "${oppTitle}" was not selected this time.`,
            type: 'Opportunity',
            redirectUrl: '/opportunities'
        });

        res.status(200).json({
            success: true,
            message: 'Application rejected',
            data: application,
        });
    } catch (error) {
        console.error('Reject application error:', error);

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

        const availableOpportunities = await Opportunity.countDocuments();

        const myApplicationsList = await Application.find({
            volunteerId
        })
        .select('status opportunityId')
        .populate('opportunityId', 'date eventDate');

        const myApplications = myApplicationsList.length;

        let completedOpportunities = 0;
        let pendingOpportunities = 0;

        for (const application of myApplicationsList) {
            if (application.status !== 'Accepted') {
                continue;
            }

            const opportunity = application.opportunityId;

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

const getMyApplications = async (req, res) => {
    try {
        const volunteerId = req.user._id;

        const applications = await Application.find({
            volunteerId
        })
        .populate(
            'opportunityId',
            'title category description city state location date eventDate duration status imageUrl'
        )
        .sort({ createdAt: -1 });

        return res.status(200).json({
            success: true,
            count: applications.length,
            data: applications
        });

    } catch (error) {
        console.error(
            'Get volunteer applications error:',
            error
        );

        return res.status(500).json({
            success: false,
            message: 'Unable to load your applications'
        });
    }
};

module.exports = {
    applyForOpportunity,
    getAllApplications,
    getMyApplicationForOpportunity,
    getMyApplications,
    getVolunteerDashboardStats,
    acceptApplication,
    rejectApplication,
};