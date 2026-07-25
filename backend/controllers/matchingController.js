const Opportunity = require('../models/Opportunity');

/**
 * Normalize strings so matching is case-insensitive.
 */
const normalize = (value) =>
  typeof value === 'string' ? value.trim().toLowerCase() : '';

/**
 * GET /api/matches
 *
 * Returns matching opportunities for the currently
 * authenticated Volunteer.
 */
const getMatches = async (req, res) => {
  try {
    // protect middleware already provides the authenticated user
    const volunteer = req.user;

    // Matching is intended for Volunteers
    if (volunteer.role !== 'Volunteer') {
      return res.status(403).json({
        success: false,
        message: 'Match suggestions are available only for Volunteers',
      });
    }

    const preferredWasteTypes = Array.isArray(volunteer.preferredWasteTypes)
      ? volunteer.preferredWasteTypes
      : [];

    if (preferredWasteTypes.length === 0) {
      return res.status(200).json({
        success: true,
        count: 0,
        message: 'Add preferred waste types to your profile to get match suggestions',
        data: [],
      });
    }

    // Only currently Open opportunities are candidates
    const opportunities = await Opportunity.find({
      status: 'Open',
    })
      .populate('postedBy', 'fullName username role')
      .populate('ngoId', 'fullName username role')
      .lean();

    const normalizedPreferences = preferredWasteTypes.map(normalize);

    const matches = opportunities
      .map((opportunity) => {
        const opportunityWasteTypes = Array.isArray(opportunity.wasteTypes)
          ? opportunity.wasteTypes
          : [];

        // Find common waste types
        const matchedWasteTypes = opportunityWasteTypes.filter((wasteType) =>
          normalizedPreferences.includes(normalize(wasteType))
        );

        // Waste type is the primary matching requirement
        if (matchedWasteTypes.length === 0) {
          return null;
        }

        const sameCity =
          normalize(volunteer.city) !== '' &&
          normalize(volunteer.city) === normalize(opportunity.city);

        const sameState =
          normalize(volunteer.state) !== '' &&
          normalize(volunteer.state) === normalize(opportunity.state);

        let matchScore = 0;

        // Geographic score
        if (sameCity && sameState) {
          matchScore += 50;
        } else if (sameState) {
          matchScore += 25;
        }

        // Waste type score
        matchScore += matchedWasteTypes.length * 25;

        return {
          ...opportunity,

          matchScore,

          matchDetails: {
            locationMatch: sameCity && sameState,
            sameCity,
            sameState,
            matchedWasteTypes,
          },
        };
      })
      .filter(Boolean)
      .sort((a, b) => b.matchScore - a.matchScore);

    return res.status(200).json({
      success: true,
      count: matches.length,
      data: matches,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to generate match suggestions',
      error: error.message,
    });
  }
};

module.exports = {
  getMatches,
};