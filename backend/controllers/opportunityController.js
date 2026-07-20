const Opportunity = require('../models/Opportunity');

/**
 * Create a new opportunity.
 */
const createOpportunity = async (req, res) => {
  try {
    const {
      title,
      description,
      requiredSkills,
      duration,
      city,
      state,
      date,
      status,
    } = req.body;

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

    if (!city?.trim()) {
      return res.status(400).json({
        success: false,
        message: 'City is required',
      });
    }

    if (!state?.trim()) {
      return res.status(400).json({
        success: false,
        message: 'State is required',
      });
    }

    if (!date) {
      return res.status(400).json({
        success: false,
        message: 'Date is required',
      });
    }

    const opportunityData = {
      ngoId: req.user._id,
      title,
      description,
      duration,
      city,
      state,
      date,
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
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message,
    });
  }
};
/**
 * Get all opportunities.
 */
const getAllOpportunities = async (req, res) => {
  try {
    const opportunities = await Opportunity.find().sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
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
 * Get a single opportunity by ID.
 */
const getOpportunityById = async (req, res) => {
  try {
    const opportunity = await Opportunity.findById(req.params.id);

    if (!opportunity) {
      return res.status(404).json({
        success: false,
        message: 'Opportunity not found',
      });
    }

    res.status(200).json({
      success: true,
      data: opportunity,
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
 * Update an existing opportunity by ID.
 */
const updateOpportunity = async (req, res) => {
  try {
    const {
      title,
      description,
      requiredSkills,
      duration,
      city,
      state,
      date,
      status,
    } = req.body;

    // Build update object based on provided fields
    const updateFields = {};
    if (title) updateFields.title = title;
    if (description) updateFields.description = description;
    if (requiredSkills) updateFields.requiredSkills = requiredSkills;
    if (duration) updateFields.duration = duration;
    if (city) updateFields.city = city;
    if (state) updateFields.state = state;
    if (date) updateFields.date = date;
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
  getOpportunityById,
  updateOpportunity,
  deleteOpportunity,
};
