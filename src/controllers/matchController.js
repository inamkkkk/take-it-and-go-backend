const httpStatus = require('http-status-codes');
const { matchService } = require('../services');
const { successResponse, errorResponse } = require('../utils/apiResponse');
const logger = require('../utils/logger');

const findMatches = async (req, res) => {
  // TODO: Implement route-based matching logic
  // Steps:
  // 1. Validate shipper's request (origin, destination, package size, weight, desired delivery time).
  // 2. Query available travelers whose routes overlap with the shipper's request.
  //    - Use Google Maps API for route calculations and spatial matching (integration: Google Maps API).
  // 3. Consider traveler's capacity, availability, and preferences.
  // 4. Apply business logic for optimal matching (e.g., shortest detour, best rating).
  // 5. Return a list of potential traveler matches to the shipper.
  logger.info(`Find matches request received: ${JSON.stringify(req.body)}`);
  const { origin, destination, packageDetails } = req.body;

  try {
    const matches = await matchService.findPotentialMatches({ origin, destination, packageDetails });
    res.status(httpStatus.OK).json(successResponse('Potential matches found', matches));
  } catch (error) {
    logger.error(`Find matches error: ${error.message}`);
    res.status(httpStatus.INTERNAL_SERVER_ERROR).json(errorResponse(error.message));
  }
};

module.exports = {
  findMatches,
};
