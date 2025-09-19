const { Delivery, User } = require('../models');
const logger = require('../utils/logger');
const httpStatus = require('http-status-codes');
const ApiError = require('../utils/ApiError');
const config = require('../config');

const findPotentialMatches = async ({ origin, destination, packageDetails }) => {
  // TODO: Implement comprehensive route-based matching logic
  // Steps:
  // 1. **Geospatial Query:** Find 'traveler' users who have active trips (Deliveries) that potentially pass near the shipper's origin and destination.
  //    - Use MongoDB's geospatial queries (e.g., $geoWithin, $near) on traveler's planned routes.
  // 2. **Google Maps API Integration:** For more precise matching and route deviation calculation:
  //    - Use Google Maps Directions API to calculate routes for both shipper's package and potential traveler's path.
  //    - Determine if a traveler's route can accommodate the package's route with minimal deviation.
  //    - Check for 'stops' or 'waypoints' in traveler's declared route.
  // 3. **Capacity & Preferences:** Filter travelers based on packageDetails (weight, dimensions) against traveler's declared capacity.
  // 4. **Availability:** Check traveler's availability (e.g., time window, current status).
  // 5. **Rating/Reputation:** Consider traveler's rating or reliability score.
  // 6. **Monetization Logic:** Calculate potential earnings for traveler and cost for shipper.
  // 7. Return a list of matched travelers with relevant trip details.

  logger.info(`Finding potential matches for package from ${origin.address} to ${destination.address}`);

  if (!config.integrations.googleMaps.apiKey) {
    logger.warn('Google Maps API key is not configured. Matching will be basic.');
  }

  // Placeholder: Simulate finding some travelers
  const potentialTravelers = await User.find({ role: 'traveler' });

  const matches = potentialTravelers.map(traveler => ({
    travelerId: traveler._id,
    travelerName: traveler.email, // Or actual name if available
    estimatedDetour: 'TODO: Calculate with Google Maps',
    estimatedCost: 'TODO: Calculate based on distance/package',
    // Further details about the traveler's active trip that matches
    matchingTrip: {
      id: 'mockTripId123',
      origin: 'Traveler current location',
      destination: 'Traveler final destination',
      // ... other trip details
    },
  }));

  // For now, returning a safe placeholder response.
  return matches.slice(0, 3); // Return a few mock matches
};

module.exports = {
  findPotentialMatches,
};
