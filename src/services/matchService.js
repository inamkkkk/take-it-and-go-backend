const { Delivery, User } = require('../models');
const logger = require('../utils/logger');
const httpStatus = require('http-status-codes');
const ApiError = require('../utils/ApiError');
const config = require('../config');
const axios = require('axios'); // Import axios for API calls

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
    // Fallback to basic matching if API key is missing
    return await basicMatchingLogic({ origin, destination, packageDetails });
  }

  // 1. Geospatial Query: Find active traveler deliveries
  const travelerDeliveries = await Delivery.find({
    'traveler.userId': { $exists: true }, // Ensure it's a traveler's delivery
    status: 'active', // Assuming 'active' means the trip is in progress
    // TODO: Add geospatial query logic here based on traveler's route
    // Example: Find deliveries where the route passes near the shipper's origin or destination.
    // This would require storing traveler routes in a geospatial-friendly format (e.g., GeoJSON LineString).
    // For now, we'll fetch all active traveler deliveries and filter later.
  });

  if (travelerDeliveries.length === 0) {
    logger.info('No active traveler deliveries found.');
    return [];
  }

  const potentialMatches = [];

  for (const delivery of travelerDeliveries) {
    const traveler = await User.findById(delivery.traveler.userId);
    if (!traveler) {
      logger.warn(`Traveler not found for delivery: ${delivery._id}`);
      continue;
    }

    // 3. Capacity & Preferences Check
    if (!checkCapacity(traveler.capacity, packageDetails)) {
      continue;
    }

    // 4. Availability Check (simplified for now)
    if (!isTravelerAvailable(traveler, delivery)) {
      continue;
    }

    // 5. Rating/Reputation (simplified for now)
    const reliabilityScore = getReliabilityScore(traveler);
    if (reliabilityScore < config.matching.minReliabilityScore) {
      continue;
    }

    // 2. Google Maps API Integration for Route Analysis
    try {
      const { estimatedDetour, estimatedCost } = await analyzeRouteWithGoogleMaps({
        shipperOrigin: origin,
        shipperDestination: destination,
        travelerRoute: delivery.route, // Assuming delivery.route stores traveler's planned route
      });

      // 6. Monetization Logic (placeholder)
      const potentialEarnings = calculateEarnings(estimatedCost, delivery.fare);
      const shipperCost = calculateCost(estimatedCost, packageDetails);

      potentialMatches.push({
        travelerId: traveler._id,
        travelerName: traveler.name || traveler.email,
        estimatedDetour,
        estimatedCost,
        potentialEarnings,
        shipperCost,
        matchingTrip: {
          id: delivery._id,
          origin: delivery.origin.address,
          destination: delivery.destination.address,
          departureTime: delivery.departureTime,
          arrivalTime: delivery.arrivalTime,
        },
      });
    } catch (error) {
      logger.error(`Error analyzing route for delivery ${delivery._id}: ${error.message}`);
      // Continue to the next delivery even if one fails
    }
  }

  // Sort matches by some criteria, e.g., shortest detour or best value
  potentialMatches.sort((a, b) => {
    // TODO: Define a clear sorting logic. For now, sort by estimatedDetour if available.
    if (a.estimatedDetour === 'TODO: Calculate with Google Maps' && b.estimatedDetour !== 'TODO: Calculate with Google Maps') return 1;
    if (a.estimatedDetour !== 'TODO: Calculate with Google Maps' && b.estimatedDetour === 'TODO: Calculate with Google Maps') return -1;
    if (a.estimatedDetour === 'TODO: Calculate with Google Maps' && b.estimatedDetour === 'TODO: Calculate with Google Maps') return 0;

    // Assuming estimatedDetour is a string like "X km" or "Y miles"
    const distanceA = parseFloat(a.estimatedDetour.split(' ')[0]);
    const distanceB = parseFloat(b.estimatedDetour.split(' ')[0]);

    if (!isNaN(distanceA) && !isNaN(distanceB)) {
      return distanceA - distanceB;
    }
    return 0;
  });


  logger.info(`Found ${potentialMatches.length} potential matches.`);
  return potentialMatches;
};

// Placeholder functions - actual implementation will depend on data models and external services
const basicMatchingLogic = async ({ origin, destination, packageDetails }) => {
  logger.info('Performing basic matching logic.');
  // Simulate finding some travelers
  const potentialTravelers = await User.find({ role: 'traveler' });

  const matches = potentialTravelers.map(traveler => ({
    travelerId: traveler._id,
    travelerName: traveler.email, // Or actual name if available
    estimatedDetour: 'N/A (Google Maps not configured)',
    estimatedCost: 'N/A (Google Maps not configured)',
    potentialEarnings: 'N/A',
    shipperCost: 'N/A',
    matchingTrip: {
      id: 'mockTripId123',
      origin: 'Traveler current location',
      destination: 'Traveler final destination',
      // ... other trip details
    },
  }));
  return matches.slice(0, 3);
};

const checkCapacity = (travelerCapacity, packageDetails) => {
  // TODO: Implement detailed capacity check based on weight, dimensions, etc.
  // Example:
  // if (packageDetails.weight > travelerCapacity.maxWeight) return false;
  // if (packageDetails.volume > travelerCapacity.maxVolume) return false;
  return true; // Placeholder
};

const isTravelerAvailable = (traveler, delivery) => {
  // TODO: Implement availability check. This might involve checking traveler's current location, schedule, and the delivery's time window.
  // For now, assume active deliveries mean they are available.
  return delivery.status === 'active';
};

const getReliabilityScore = (traveler) => {
  // TODO: Implement logic to calculate or retrieve traveler's reliability score.
  // This could be based on past ratings, successful deliveries, etc.
  return traveler.rating || 0; // Placeholder
};

const analyzeRouteWithGoogleMaps = async ({ shipperOrigin, shipperDestination, travelerRoute }) => {
  const googleMapsApiKey = config.integrations.googleMaps.apiKey;
  const directionsBaseUrl = 'https://maps.googleapis.com/maps/api/directions/json';

  let estimatedDetour = '0 km';
  let estimatedCost = '0'; // Cost in a common currency unit

  try {
    // 1. Calculate shipper's direct route
    const shipperDirectionsResponse = await axios.get(directionsBaseUrl, {
      params: {
        origin: `${shipperOrigin.latitude},${shipperOrigin.longitude}`,
        destination: `${shipperDestination.latitude},${shipperDestination.longitude}`,
        key: googleMapsApiKey,
      },
    });

    if (shipperDirectionsResponse.data.routes && shipperDirectionsResponse.data.routes.length > 0) {
      const shipperRoute = shipperDirectionsResponse.data.routes[0];
      const shipperDistance = shipperRoute.legs[0].distance.value; // distance in meters
      const shipperDuration = shipperRoute.legs[0].duration.value; // duration in seconds

      // 2. Calculate traveler's route and check for detour
      // Assuming travelerRoute is an array of {lat, lng} points or a GeoJSON LineString
      let travelerRoutePoints = [];
      if (Array.isArray(travelerRoute)) {
        travelerRoutePoints = travelerRoute.map(point => `${point.lat},${point.lng}`).join('|');
      } else if (travelerRoute && travelerRoute.coordinates) {
        // Assuming GeoJSON LineString format
        travelerRoutePoints = travelerRoute.coordinates.map(coord => `${coord[1]},${coord[0]}`).join('|');
      }

      if (travelerRoutePoints.length > 0) {
        const travelerDirectionsResponse = await axios.get(directionsBaseUrl, {
          params: {
            origin: `${shipperOrigin.latitude},${shipperOrigin.longitude}`, // Start from shipper's origin to see how traveler's route deviates
            destination: `${shipperDestination.latitude},${shipperDestination.longitude}`, // End at shipper's destination
            waypoints: travelerRoutePoints, // Intermediate points from traveler's route
            optimize: 'false', // Don't reorder waypoints, we want to see the actual traveler's path
            key: googleMapsApiKey,
          },
        });

        if (travelerDirectionsResponse.data.routes && travelerDirectionsResponse.data.routes.length > 0) {
          const travelerRouteWithPackage = travelerDirectionsResponse.data.routes[0];
          const totalDistanceWithPackage = travelerRouteWithPackage.legs.reduce((sum, leg) => sum + leg.distance.value, 0);
          const detourDistance = Math.max(0, totalDistanceWithPackage - shipperDistance); // Ensure detour is not negative

          estimatedDetour = formatDistance(detourDistance);
          // Estimate cost based on detour distance and duration
          const detourDuration = travelerRouteWithPackage.legs.reduce((sum, leg) => sum + leg.duration.value, 0);
          estimatedCost = calculateCostFromMetrics(detourDistance, detourDuration);
        } else {
          logger.warn('Could not calculate traveler route with Google Maps Directions API.');
          estimatedDetour = 'Calculation failed';
          estimatedCost = '0';
        }
      } else {
        logger.warn('Traveler route is empty or invalid, cannot calculate detour.');
        estimatedDetour = 'Route not available';
        estimatedCost = '0';
      }
    } else {
      logger.warn('Could not calculate shipper route with Google Maps Directions API.');
      estimatedDetour = 'Calculation failed';
      estimatedCost = '0';
    }
  } catch (error) {
    logger.error(`Google Maps API error: ${error.message}`);
    // Return placeholders if API fails
    estimatedDetour = 'API Error';
    estimatedCost = '0';
  }

  return { estimatedDetour, estimatedCost };
};

const formatDistance = (meters) => {
  const km = meters / 1000;
  if (km < 1) {
    return `${Math.round(meters)} m`;
  }
  return `${km.toFixed(2)} km`;
};

const calculateCostFromMetrics = (distanceInMeters, durationInSeconds) => {
  // TODO: Implement a more sophisticated cost calculation based on distance, time, fuel, etc.
  const costPerKm = config.pricing.costPerKm || 0.5; // Example default
  const costPerMinute = config.pricing.costPerMinute || 0.2; // Example default

  const distanceCost = (distanceInMeters / 1000) * costPerKm;
  const timeCost = (durationInSeconds / 60) * costPerMinute;

  return (distanceCost + timeCost).toFixed(2);
};

const calculateEarnings = (estimatedCost, currentFare) => {
  // TODO: Define how traveler earnings are calculated. This might be a percentage of shipper cost or a fixed amount.
  const commissionRate = config.pricing.commissionRate || 0.1; // Example: 10% commission
  return (parseFloat(estimatedCost) * (1 - commissionRate)).toFixed(2);
};

const calculateCost = (estimatedCost, packageDetails) => {
  // TODO: Define how shipper cost is determined. This could be the estimatedCost directly, or include a markup.
  // For now, let's assume it's the estimated cost.
  return parseFloat(estimatedCost).toFixed(2);
};

module.exports = {
  findPotentialMatches,
};