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
  logger.info(`Start tracking request for trip: ${req.body.tripId}`);
  try {
    const { tripId, userId } = req.body;
    await trackingService.startTripTracking(tripId, userId);
    res.status(httpStatus.OK).json(successResponse('Tracking started', { tripId }));
  } catch (error) {
    logger.error(`Start tracking error: ${error.message}`);
    res.status(httpStatus.BAD_REQUEST).json(errorResponse(error.message));
  }
};

const stopTracking = async (req, res) => {
  // TODO: Implement logic to stop GPS tracking for a trip.
  // Steps:
  // 1. Validate input (tripId, userId_traveler).
  // 2. Mark the trip as 'completed' or 'tracking-inactive'.
  // 3. This endpoint primarily signals the end. No more GPS updates expected after this.
  logger.info(`Stop tracking request for trip: ${req.body.tripId}`);
  try {
    const { tripId, userId } = req.body;
    await trackingService.stopTripTracking(tripId, userId);
    res.status(httpStatus.OK).json(successResponse('Tracking stopped', { tripId }));
  } catch (error) {
    logger.error(`Stop tracking error: ${error.message}`);
    res.status(httpStatus.BAD_REQUEST).json(errorResponse(error.message));
  }
};

const getTracking = async (req, res) => {
  // TODO: Implement logic to retrieve historical GPS tracking data for a trip.
  // Steps:
  // 1. Validate tripId from params.
  // 2. Retrieve GPS logs from the database for the given tripId (GPSLog model).
  // 3. Ensure authorized user can view tracking (shipper, traveler, admin).
  // 4. Return a list of GPS coordinates and timestamps.
  logger.info(`Get tracking request for trip: ${req.params.tripId}`);
  try {
    const logs = await trackingService.getTripTrackingLogs(req.params.tripId);
    res.status(httpStatus.OK).json(successResponse('Tracking data retrieved', logs));
  } catch (error) {
    logger.error(`Get tracking error: ${error.message}`);
    res.status(httpStatus.INTERNAL_SERVER_ERROR).json(errorResponse(error.message));
  }
};

module.exports = {
  startTracking,
  stopTracking,
  getTracking,
};
