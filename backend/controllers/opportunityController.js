const Opportunity = require('../models/Opportunity');

const parseRequiredSkills = (requiredSkills) => {
  if (Array.isArray(requiredSkills)) return requiredSkills;
  if (typeof requiredSkills !== 'string') return undefined;

  try {
    const parsed = JSON.parse(requiredSkills);
    return Array.isArray(parsed) ? parsed : undefined;
  } catch {
    return requiredSkills
      .split(',')
      .map((skill) => skill.trim())
      .filter(Boolean);
  }
};

const sendServerError = (res, error) => {
  res.status(500).json({
    success: false,
    message: 'Server Error',
    error: error.message,
  });
};

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
      location,
      city,
      state,
      date,
      status,
      category,
      eventDate,
      requiredVolunteers,
    } = req.body;
    const skills = parseRequiredSkills(requiredSkills);
    const opportunityDate = date || eventDate;
    const opportunityCity = city || location;
    const opportunityState = state || 'Not specified';

    if (!title?.trim()) {
      return res.status(400).json({ success: false, message: 'Title is required' });
    }

    if (!description?.trim()) {
      return res.status(400).json({ success: false, message: 'Description is required' });
    }

    if (!duration?.trim()) {
      return res.status(400).json({ success: false, message: 'Duration is required' });
    }

    if (!opportunityCity?.trim()) {
      return res.status(400).json({ success: false, message: 'City or location is required' });
    }

    if (!opportunityDate) {
      return res.status(400).json({ success: false, message: 'Date is required' });
    }

    const opportunityData = {
      ngoId: req.user._id,
      postedBy: req.user._id,
      title,
      description,
      duration,
      city: opportunityCity,
      state: opportunityState,
      date: opportunityDate,
      location,
      category,
      eventDate,
      requiredVolunteers,
      imageUrl: req.file?.path || '',
    };

    if (skills !== undefined) opportunityData.requiredSkills = skills;
    if (status) opportunityData.status = status;

    const opportunity = await Opportunity.create(opportunityData);

    res.status(201).json({
      success: true,
      message: 'Opportunity created successfully',
      data: opportunity,
    });
  } catch (error) {
    sendServerError(res, error);
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
    sendServerError(res, error);
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
        { title: { $regex: keyword, $options: 'i' } },
        { description: { $regex: keyword, $options: 'i' } },
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
    sendServerError(res, error);
  }
};

/**
 * Filter opportunities by location, status, and required skills.
 */
const filterOpportunities = async (req, res) => {
  try {
    const { location, status, skill } = req.query;
    const filter = {};

    if (location) {
      filter.$or = [
        { location: { $regex: location, $options: 'i' } },
        { city: { $regex: location, $options: 'i' } },
        { state: { $regex: location, $options: 'i' } },
      ];
    }

    if (status) {
      filter.status = status;
    }

    if (skill) {
      filter.requiredSkills = { $in: [new RegExp(skill, 'i')] };
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
    sendServerError(res, error);
  }
};

/**
 * Get dashboard statistics.
 */
const getDashboardStatistics = async (req, res) => {
  try {
    const totalOpportunities = await Opportunity.countDocuments();
    const openOpportunities = await Opportunity.countDocuments({ status: 'Open' });
    const closedOpportunities = await Opportunity.countDocuments({ status: 'Closed' });
    const inProgressOpportunities = await Opportunity.countDocuments({ status: 'In Progress' });

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
    sendServerError(res, error);
  }
};

/**
 * Get a single opportunity by ID.
 */
const getOpportunityById = async (req, res) => {
  try {
    const opportunity = await Opportunity.findById(req.params.id)
      .populate('postedBy', 'fullName email role')
      .populate('ngoId', 'fullName email role');

    if (!opportunity) {
      return res.status(404).json({ success: false, message: 'Opportunity not found' });
    }

    const data = opportunity.toObject();
    const isPopulatedUser = (user) => user && typeof user === 'object' && (user.fullName || user.email);
    const creator = isPopulatedUser(data.postedBy) ? data.postedBy : data.ngoId;
    const postedBy = isPopulatedUser(creator)
      ? {
        _id: creator._id,
        name: creator.fullName,
        email: creator.email,
      }
      : creator;

    res.status(200).json({
      success: true,
      data: { ...data, postedBy },
    });
  } catch (error) {
    sendServerError(res, error);
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
      location,
      city,
      state,
      date,
      status,
      category,
      eventDate,
      requiredVolunteers,
      removeImage,
    } = req.body;
    const skills = parseRequiredSkills(requiredSkills);

    const updateFields = {};
    if (title) updateFields.title = title;
    if (description) updateFields.description = description;
    if (skills !== undefined) updateFields.requiredSkills = skills;
    if (duration) updateFields.duration = duration;
    if (location) updateFields.location = location;
    if (city) updateFields.city = city;
    if (state) updateFields.state = state;
    if (date) updateFields.date = date;
    if (category !== undefined) updateFields.category = category;
    if (eventDate !== undefined) updateFields.eventDate = eventDate;
    if (requiredVolunteers !== undefined) updateFields.requiredVolunteers = requiredVolunteers;
    if (status) updateFields.status = status;
    if (req.file) updateFields.imageUrl = req.file.path;
    else if (removeImage === 'true') updateFields.imageUrl = '';

    const opportunity = await Opportunity.findByIdAndUpdate(
      req.params.id,
      { $set: updateFields },
      { new: true, runValidators: true }
    );

    if (!opportunity) {
      return res.status(404).json({ success: false, message: 'Opportunity not found' });
    }

    res.status(200).json({
      success: true,
      message: 'Opportunity updated successfully',
      data: opportunity,
    });
  } catch (error) {
    sendServerError(res, error);
  }
};

/**
 * Delete an opportunity by ID.
 */
const deleteOpportunity = async (req, res) => {
  try {
    const opportunity = await Opportunity.findByIdAndDelete(req.params.id);

    if (!opportunity) {
      return res.status(404).json({ success: false, message: 'Opportunity not found' });
    }

    res.status(200).json({
      success: true,
      message: 'Opportunity deleted successfully',
    });
  } catch (error) {
    sendServerError(res, error);
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
