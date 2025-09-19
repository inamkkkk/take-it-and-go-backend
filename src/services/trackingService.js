const { GPSLog, Delivery } = require('../models');
const logger = require('../utils/logger');
const httpStatus = require('http-status-codes');
const ApiError = require('../utils/ApiError');

const startTripTracking = async (tripId, userId) => {
  // TODO: Implement logic to mark a trip as actively tracked
  // - Update Delivery status (e.g., to 'in-transit')
  // - Optionally create an initial GPS log entry
  logger.info(`Initiating tracking for trip ${tripId} by user ${userId}`);
  const delivery = await Delivery.findById(tripId);
  if (!delivery) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Delivery not found');
  }
  if (delivery.travelerId.toString() !== userId) {
    throw new ApiError(httpStatus.FORBIDDEN, 'User is not the assigned traveler for this trip');
  }

  delivery.status = 'in-transit';
  await delivery.save();

  // Optionally create an initial GPS log (the app would send actual updates later)
  // const initialLocation = { type: 'Point', coordinates: [0, 0] }; // Placeholder
  // await GPSLog.create({ tripId, userId, location: initialLocation });

  return delivery;
};

const stopTripTracking = async (tripId, userId) => {
  // TODO: Implement logic to mark a trip as tracking stopped
  // - Update Delivery status (e.g., to 'delivered' or 'completed')
  logger.info(`Stopping tracking for trip ${tripId} by user ${userId}`);
  const delivery = await Delivery.findById(tripId);
  if (!delivery) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Delivery not found');
  }
  if (delivery.travelerId.toString() !== userId) {
    throw new ApiError(httpStatus.FORBIDDEN, 'User is not the assigned traveler for this trip');
  }

  delivery.status = 'delivered'; // Or another appropriate final status
  await delivery.save();

  return delivery;
};

const getTripTrackingLogs = async (tripId) => {
  // TODO: Implement retrieval of historical GPS logs for a trip
  // - Query GPSLog model for all entries related to tripId
  // - Sort by timestamp
  logger.info(`Fetching GPS tracking logs for trip ${tripId}`);
  const logs = await GPSLog.find({ tripId }).sort({ timestamp: 1 });
  return logs;
};

const recordGPSUpdate = async (tripId, userId, latitude, longitude) => {
  // This function would be called by a WebSocket handler or a frequent polling endpoint
  // TODO: Implement saving a new GPS coordinate for a trip
  logger.debug(`Recording GPS update for trip ${tripId}: ${latitude}, ${longitude}`);
  const newLog = await GPSLog.create({
    tripId,
    userId,
    location: { type: 'Point', coordinates: [longitude, latitude] },
    timestamp: Date.now(),
  });
  // Emit this update via Socket.io to listeners (shipper, admin)
  return newLog;
};

module.exports = {
  startTripTracking,
  stopTripTracking,
  getTripTrackingLogs,
  recordGPSUpdate,
};
