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
 *
 * Matching rules:
 * 1. State is mandatory - only opportunities from the
 *    volunteer's selected state are considered.
 * 2. Same city contributes 50%.
 * 3. Waste preference matching contributes the remaining 50%.
 * 4. Results are sorted from highest to lowest match.
 */
const getMatches = async (req, res) => {
  try {
    const volunteer = req.user;

    // Matching is available only for Volunteers
    if (volunteer.role !== 'Volunteer') {
      return res.status(403).json({
        success: false,
        message:
          'Match suggestions are available only for Volunteers',
      });
    }

    const volunteerState = normalize(volunteer.state);
    const volunteerCity = normalize(volunteer.city);

    const preferredWasteTypes =
      Array.isArray(volunteer.preferredWasteTypes)
        ? volunteer.preferredWasteTypes.filter(
            (type) => normalize(type) !== ''
          )
        : [];

    /**
     * All three preference fields are required.
     */
    if (
      !volunteerState ||
      !volunteerCity ||
      preferredWasteTypes.length === 0
    ) {
      return res.status(200).json({
        success: true,
        count: 0,
        message:
          'Set your state, city and preferred waste types to get match suggestions',
        data: [],
      });
    }

    /**
     * STATE IS THE MANDATORY BOUNDARY.
     *
     * Fetch Open opportunities and then keep only those
     * belonging to the volunteer's selected state.
     *
     * Filtering after retrieval keeps the comparison
     * case-insensitive and whitespace-safe.
     */
    const opportunities = await Opportunity.find({
      status: 'Open',
    })
      .populate('postedBy', 'fullName username role')
      .populate('ngoId', 'fullName username role')
      .lean();

    const stateOpportunities = opportunities.filter(
      (opportunity) =>
        normalize(opportunity.state) === volunteerState
    );

    const normalizedPreferences =
      preferredWasteTypes.map(normalize);

    const matches = stateOpportunities
      .map((opportunity) => {
        const opportunityWasteTypes =
          Array.isArray(opportunity.wasteTypes)
            ? opportunity.wasteTypes
            : [];

        /**
         * Find waste types common to the volunteer
         * preferences and opportunity.
         */
        const matchedWasteTypes =
          opportunityWasteTypes.filter((wasteType) =>
            normalizedPreferences.includes(
              normalize(wasteType)
            )
          );

        const sameCity =
          volunteerCity === normalize(opportunity.city);

        // State is guaranteed because it was filtered above
        const sameState = true;

        /**
         * MATCH SCORE
         *
         * City       = 50%
         * Waste Type = 50%
         */

        const cityScore = sameCity ? 50 : 0;

        /**
         * Example:
         *
         * Volunteer selected 4 waste types.
         * Opportunity matches 2.
         *
         * 2 / 4 * 50 = 25%
         */
        const wasteScore =
          (matchedWasteTypes.length /
            normalizedPreferences.length) *
          50;

        const matchScore = Math.round(
          cityScore + wasteScore
        );

        return {
          ...opportunity,

          matchScore,

          matchDetails: {
            locationMatch: sameCity,
            sameCity,
            sameState,
            matchedWasteTypes,
          },
        };
      })

      // Don't show completely unrelated opportunities
      .filter((opportunity) => opportunity.matchScore > 0)

      // Highest match first
      .sort((a, b) => b.matchScore - a.matchScore);

    return res.status(200).json({
      success: true,
      count: matches.length,
      data: matches,
    });
  } catch (error) {
    console.error(
      'Opportunity matching error:',
      error
    );

    return res.status(500).json({
      success: false,
      message:
        'Failed to generate match suggestions',
      error: error.message,
    });
  }
};

module.exports = {
  getMatches,
};