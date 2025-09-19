const httpStatus = require('http-status-codes');
const { trackingService } = require('../services');
const { successResponse, errorResponse } = require('../utils/apiResponse');
const logger = require('../utils/logger');

const startTracking = async (req, res) => {
  // TODO: Implement logic to start GPS tracking for a trip.
  // Steps:
  // 1. Validate input (tripId, userId_traveler).
  // 2. Mark the trip as 'in-progress' or 'tracking-active'.
  // 3. This endpoint primarily signals the start. Actual GPS updates will likely come from a separate WebSocket or frequent polling from the traveler's app.
  // 4. Create an initial GPS log entry.
  logger.info(`Start tracking request received.`);
  try {
    const { tripId, userId } = req.body;

    // 1. Validate input (tripId, userId_traveler).
    if (!tripId || !userId) {
      logger.warn('Missing tripId or userId in start tracking request.');
      return res.status(httpStatus.BAD_REQUEST).json(errorResponse('tripId and userId are required.'));
    }

    // 2. Mark the trip as 'in-progress' or 'tracking-active'.
    // 3. This endpoint primarily signals the start. Actual GPS updates will likely come from a separate WebSocket or frequent polling from the traveler's app.
    // 4. Create an initial GPS log entry.
    await trackingService.startTripTracking(tripId, userId);

    logger.info(`Tracking started for trip: ${tripId} by user: ${userId}.`);
    res.status(httpStatus.OK).json(successResponse('Tracking started successfully.', { tripId }));
  } catch (error) {
    logger.error(`Start tracking error for trip: ${req.body.tripId}, User: ${req.body.userId}. Error: ${error.message}`);
    // Use appropriate status code based on the error, e.g., 400 for validation, 500 for server errors.
    // For now, using BAD_REQUEST as a general catch-all for expected service errors.
    res.status(httpStatus.BAD_REQUEST).json(errorResponse(error.message || 'An error occurred while starting tracking.'));
  }
};

const stopTracking = async (req, res) => {
  // TODO: Implement logic to stop GPS tracking for a trip.
  // Steps:
  // 1. Validate input (tripId, userId_traveler).
  // 2. Mark the trip as 'completed' or 'tracking-inactive'.
  // 3. This endpoint primarily signals the end. No more GPS updates expected after this.
  logger.info(`Stop tracking request received.`);
  try {
    const { tripId, userId } = req.body;

    // 1. Validate input (tripId, userId_traveler).
    if (!tripId || !userId) {
      logger.warn('Missing tripId or userId in stop tracking request.');
      return res.status(httpStatus.BAD_REQUEST).json(errorResponse('tripId and userId are required.'));
    }

    // 2. Mark the trip as 'completed' or 'tracking-inactive'.
    await trackingService.stopTripTracking(tripId, userId);

    logger.info(`Tracking stopped for trip: ${tripId} by user: ${userId}.`);
    res.status(httpStatus.OK).json(successResponse('Tracking stopped successfully.', { tripId }));
  } catch (error) {
    logger.error(`Stop tracking error for trip: ${req.body.tripId}, User: ${req.body.userId}. Error: ${error.message}`);
    res.status(httpStatus.BAD_REQUEST).json(errorResponse(error.message || 'An error occurred while stopping tracking.'));
  }
};

const getTracking = async (req, res) => {
  // TODO: Implement logic to retrieve historical GPS tracking data for a trip.
  // Steps:
  // 1. Validate tripId from params.
  // 2. Retrieve GPS logs from the database for the given tripId (GPSLog model).
  // 3. Ensure authorized user can view tracking (shipper, traveler, admin).
  // 4. Return a list of GPS coordinates and timestamps.
  logger.info(`Get tracking request received for trip: ${req.params.tripId}.`);
  try {
    const tripId = req.params.tripId;

    // 1. Validate tripId from params.
    if (!tripId) {
      logger.warn('Missing tripId in get tracking request parameters.');
      return res.status(httpStatus.BAD_REQUEST).json(errorResponse('tripId is required in the URL parameters.'));
    }

    // 3. Ensure authorized user can view tracking (shipper, traveler, admin).
    // This step requires authentication and authorization middleware.
    // For now, assuming authentication is handled before this controller.
    // Example placeholder:
    // if (!isAuthorized(req.user, tripId)) {
    //   logger.warn(`Unauthorized access attempt for trip: ${tripId}`);
    //   return res.status(httpStatus.UNAUTHORIZED).json(errorResponse('Unauthorized to view this tracking data.'));
    // }

    // 2. Retrieve GPS logs from the database for the given tripId (GPSLog model).
    const logs = await trackingService.getTripTrackingLogs(tripId);

    if (!logs || logs.length === 0) {
      logger.info(`No tracking data found for trip: ${tripId}.`);
      return res.status(httpStatus.NOT_FOUND).json(errorResponse('No tracking data found for this trip.'));
    }

    // 4. Return a list of GPS coordinates and timestamps.
    logger.info(`Successfully retrieved ${logs.length} tracking logs for trip: ${tripId}.`);
    res.status(httpStatus.OK).json(successResponse('Tracking data retrieved successfully.', logs));
  } catch (error) {
    logger.error(`Get tracking error for trip: ${req.params.tripId}. Error: ${error.message}`);
    // Use INTERNAL_SERVER_ERROR for unexpected server-side issues during data retrieval.
    res.status(httpStatus.INTERNAL_SERVER_ERROR).json(errorResponse(error.message || 'An error occurred while retrieving tracking data.'));
  }
};

module.exports = {
  startTracking,
  stopTracking,
  getTracking,
};