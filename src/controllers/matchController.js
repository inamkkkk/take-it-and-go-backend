const httpStatus = require('http-status-codes');
const { matchService } = require('../services');
const { successResponse, errorResponse } = require('../utils/apiResponse');
const logger = require('../utils/logger');
const Joi = require('joi'); // Import Joi for validation

// TODO: Define Joi schemas for request validation
const findMatchesSchema = Joi.object({
  origin: Joi.object({
    lat: Joi.number().required(),
    lng: Joi.number().required(),
    address: Joi.string().optional(),
  }).required(),
  destination: Joi.object({
    lat: Joi.number().required(),
    lng: Joi.number().required(),
    address: Joi.string().optional(),
  }).required(),
  packageDetails: Joi.object({
    size: Joi.string().valid('small', 'medium', 'large').required(),
    weight: Joi.number().min(0.1).required(), // Assuming weight in kg
    // TODO: Add other relevant package details if needed (e.g., fragile, temperature-sensitive)
  }).required(),
  // TODO: Add fields for desired delivery time if applicable
  desiredDeliveryTime: Joi.date().optional(),
});

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

  // 1. Validate shipper's request
  const { error, value } = findMatchesSchema.validate(req.body);
  if (error) {
    logger.warn(`Find matches validation error: ${error.details[0].message}`);
    return res.status(httpStatus.BAD_REQUEST).json(errorResponse(error.details[0].message));
  }

  const { origin, destination, packageDetails, desiredDeliveryTime } = value;

  try {
    // 2. Query available travelers whose routes overlap with the shipper's request.
    //    - Use Google Maps API for route calculations and spatial matching (integration: Google Maps API).
    // 3. Consider traveler's capacity, availability, and preferences.
    // 4. Apply business logic for optimal matching (e.g., shortest detour, best rating).
    const matches = await matchService.findPotentialMatches({
      origin,
      destination,
      packageDetails,
      desiredDeliveryTime, // Pass desired delivery time if provided
    });

    // 5. Return a list of potential traveler matches to the shipper.
    logger.info(`Found ${matches.length} potential matches.`);
    res.status(httpStatus.OK).json(successResponse('Potential matches found', matches));
  } catch (error) {
    logger.error(`Find matches error: ${error.message}`);
    // Ensure that generic errors are not leaked to the client, only the message
    res.status(httpStatus.INTERNAL_SERVER_ERROR).json(errorResponse('An unexpected error occurred while finding matches. Please try again later.'));
  }
};

module.exports = {
  findMatches,
};