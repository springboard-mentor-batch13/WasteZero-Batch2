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

const resolveOpportunityPlace = ({ city, state, location }) => {
  const parts = typeof location === 'string'
    ? location.split(',').map((part) => part.trim()).filter(Boolean)
    : [];

  return {
    city: city || parts[0] || location,
    state: state || parts[1] || 'Not specified',
    location: location || [city, state].filter(Boolean).join(', '),
  };
};

const createOpportunity = async (req, res) => {
  try {
    const {
      title,
      category,
      description,
      requiredSkills,
      duration,
      location,
      city,
      state,
      date,
      eventDate,
      requiredVolunteers,
      status,
    } = req.body;

    const skills = parseRequiredSkills(requiredSkills) || [];
    const opportunityDate = date || eventDate;
    const place = resolveOpportunityPlace({ city, state, location });

    if (!title?.trim()) {
      return res.status(400).json({ success: false, message: 'Title is required' });
    }

    if (!description?.trim()) {
      return res.status(400).json({ success: false, message: 'Description is required' });
    }

    if (!duration?.trim()) {
      return res.status(400).json({ success: false, message: 'Duration is required' });
    }

    if (!place.city?.trim()) {
      return res.status(400).json({ success: false, message: 'City or location is required' });
    }

    if (!opportunityDate) {
      return res.status(400).json({ success: false, message: 'Date is required' });
    }

    if (!category?.trim()) {
      return res.status(400).json({ success: false, message: 'Category is required' });
    }

    const volunteerCount = Number(requiredVolunteers);
    if (!Number.isFinite(volunteerCount) || volunteerCount < 1) {
      return res.status(400).json({
        success: false,
        message: 'Required volunteers must be at least 1',
      });
    }

    const opportunity = await Opportunity.create({
      ngoId: req.user._id,
      postedBy: req.user._id,
      title,
      category,
      description,
      requiredSkills: skills,
      duration,
      city: place.city,
      state: place.state,
      date: opportunityDate,
      location: place.location,
      eventDate: eventDate || opportunityDate,
      requiredVolunteers: volunteerCount,
      status: status || 'Open',
      imageUrl: req.file?.path || '',
    });

    res.status(201).json({
      success: true,
      message: 'Opportunity created successfully',
      data: opportunity,
    });
  } catch (error) {
    sendServerError(res, error);
  }
};

const getAllOpportunities = async (_req, res) => {
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
        { location: { $regex: keyword, $options: 'i' } },
        { city: { $regex: keyword, $options: 'i' } },
        { state: { $regex: keyword, $options: 'i' } },
        { category: { $regex: keyword, $options: 'i' } },
        { requiredSkills: { $in: [new RegExp(keyword, 'i')] } },
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

const filterOpportunities = async (req, res) => {
  try {
    const { location, status, skill, category } = req.query;
    const filter = {};

    if (location) {
      filter.$or = [
        { location: { $regex: location, $options: 'i' } },
        { city: { $regex: location, $options: 'i' } },
        { state: { $regex: location, $options: 'i' } },
      ];
    }

    if (status) filter.status = status;
    if (category) filter.category = category;
    if (skill) filter.requiredSkills = { $in: [new RegExp(skill, 'i')] };

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

const getDashboardStatistics = async (_req, res) => {
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

const updateOpportunity = async (req, res) => {
  try {
    const {
      title,
      category,
      description,
      requiredSkills,
      duration,
      location,
      city,
      state,
      date,
      eventDate,
      requiredVolunteers,
      status,
      removeImage,
    } = req.body;

    const skills = parseRequiredSkills(requiredSkills);
    const updateFields = {};
    const place = resolveOpportunityPlace({ city, state, location });

    if (title !== undefined) updateFields.title = title;
    if (category !== undefined) updateFields.category = category;
    if (description !== undefined) updateFields.description = description;
    if (skills !== undefined) updateFields.requiredSkills = skills;
    if (duration !== undefined) updateFields.duration = duration;
    if (location !== undefined || city !== undefined || state !== undefined) {
      if (place.location !== undefined) updateFields.location = place.location;
      if (place.city !== undefined) updateFields.city = place.city;
      if (place.state !== undefined) updateFields.state = place.state;
    }
    if (date !== undefined) updateFields.date = date;
    if (eventDate !== undefined) updateFields.eventDate = eventDate;
    if (requiredVolunteers !== undefined) updateFields.requiredVolunteers = Number(requiredVolunteers);
    if (status !== undefined) updateFields.status = status;
    if (req.file) updateFields.imageUrl = req.file.path;
    else if (removeImage === 'true') updateFields.imageUrl = '';

    const opportunity = await Opportunity.findByIdAndUpdate(
      req.params.id,
      { $set: updateFields },
      { new: true, runValidators: true }
    );

    if (!opportunity) {
      return res.status(404).json({
        success: false,
        message: 'Opportunity not found',
      });
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
