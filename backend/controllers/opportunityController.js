const Opportunity = require('../models/Opportunity');

/**
 * Create a new opportunity.
 */
const createOpportunity = async (req, res) => {
  try {
    const { title, description, requiredSkills, duration, location, status } = req.body;

    // Validate required fields
    if (!title?.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Title is required',
      });
    }

    if (!description?.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Description is required',
      });
    }

    if (!duration?.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Duration is required',
      });
    }

    if (!location?.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Location is required',
      });
    }

    const opportunityData = {
      ngoId: req.user._id,
      title,
      description,
      duration,
      location,
    };
    if (requiredSkills) opportunityData.requiredSkills = requiredSkills;
    if (status) opportunityData.status = status;

    const opportunity = await Opportunity.create(opportunityData);

    res.status(201).json({
      success: true,
      message: 'Opportunity created successfully',
      data: opportunity,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error', error: error.message });
  }
};

/**
 * Get all opportunities.
 */
const getAllOpportunities = async (req, res) => {
  try {
    // Find all opportunities and sort by newest first
    const opportunities = await Opportunity.find().sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: opportunities,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error', error: error.message });
  }
};

/**
 * Search opportunities by title or description.
 */
const searchOpportunities = async (req, res) => {
  try {
    const { keyword } = req.query;

    if (!keyword || keyword.trim() === '') {
      return res.status(400).json({
        success: false,
        message: 'Search keyword is required',
      });
    }

    const opportunities = await Opportunity.find({
      $or: [
        {
          title: {
            $regex: keyword,
            $options: 'i',
          },
        },
        {
          description: {
            $regex: keyword,
            $options: 'i',
          },
        },
      ],
    })
      .sort({ createdAt: -1 })
      .lean();

    res.status(200).json({
      success: true,
      count: opportunities.length,
      data: opportunities,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message,
    });
  }
};
/**
 * Filter opportunities by location, status, and required skills.
 */
const filterOpportunities = async (req, res) => {
  try {
    const { location, status, skill } = req.query;

    const filter = {};

    // Filter by location
    if (location) {
      filter.location = {
        $regex: location,
        $options: 'i',
      };
    }

    // Filter by status
    if (status) {
      filter.status = status;
    }

    // Filter by required skill
    if (skill) {
      filter.requiredSkills = {
        $in: [new RegExp(skill, 'i')],
      };
    }

    const opportunities = await Opportunity.find(filter)
      .sort({ createdAt: -1 })
      .lean();

    res.status(200).json({
      success: true,
      count: opportunities.length,
      data: opportunities,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message,
    });
  }
};
/**
 * Get dashboard statistics.
 */
const getDashboardStatistics = async (req, res) => {
  try {
    const totalOpportunities = await Opportunity.countDocuments();

    const openOpportunities = await Opportunity.countDocuments({
      status: 'Open',
    });

    const closedOpportunities = await Opportunity.countDocuments({
      status: 'Closed',
    });

    const inProgressOpportunities = await Opportunity.countDocuments({
      status: 'In Progress',
    });

    res.status(200).json({
      success: true,
      data: {
        totalOpportunities,
        openOpportunities,
        closedOpportunities,
        inProgressOpportunities,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message,
    });
  }
};

/**
 * Get a single opportunity by its ID.
 */
const getOpportunityById = async (req, res) => {
  try {
    const opportunity = await Opportunity.findById(req.params.id);

    // Return 404 if not found
    if (!opportunity) {
      return res.status(404).json({ success: false, message: 'Opportunity not found' });
    }

    res.status(200).json({
      success: true,
      data: opportunity,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error', error: error.message });
  }
};

/**
 * Update an existing opportunity by ID.
 */
const updateOpportunity = async (req, res) => {
  try {
    const { title, description, requiredSkills, duration, location, status } = req.body;

    // Build update object based on provided fields
    const updateFields = {};
    if (title) updateFields.title = title;
    if (description) updateFields.description = description;
    if (requiredSkills) updateFields.requiredSkills = requiredSkills;
    if (duration) updateFields.duration = duration;
    if (location) updateFields.location = location;
    if (status) updateFields.status = status;

    const opportunity = await Opportunity.findByIdAndUpdate(
      req.params.id,
      { $set: updateFields },
      { new: true, runValidators: true } // Returns the modified document
    );

    // Return 404 if not found
    if (!opportunity) {
      return res.status(404).json({ success: false, message: 'Opportunity not found' });
    }

    res.status(200).json({
      success: true,
      message: 'Opportunity updated successfully',
      data: opportunity,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error', error: error.message });
  }
};

/**
 * Delete an opportunity by ID.
 */
const deleteOpportunity = async (req, res) => {
  try {
    const opportunity = await Opportunity.findByIdAndDelete(req.params.id);

    // Return 404 if not found
    if (!opportunity) {
      return res.status(404).json({ success: false, message: 'Opportunity not found' });
    }

    res.status(200).json({
      success: true,
      message: 'Opportunity deleted successfully',
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error', error: error.message });
  }
};

module.exports = {
  createOpportunity,
  getAllOpportunities,
  searchOpportunities,
  filterOpportunities,
getDashboardStatistics,
  getOpportunityById,
  updateOpportunity,
  deleteOpportunity,
};
