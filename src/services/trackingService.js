const { GPSLog, Delivery } = require('../models');
const logger = require('../utils/logger');
const httpStatus = require('http-status-codes');
const ApiError = require('../utils/ApiError');
const socketIo = require('socket.io'); // Importing socket.io for emitting updates

// Assume io is initialized elsewhere and made available globally or passed as an argument
// For this example, we'll assume a global `io` instance is available or passed.
// In a real application, you'd typically initialize Socket.IO in your main app file
// and pass the `io` instance around or use a module to manage it.
// For demonstration, let's assume `io` is globally accessible after its initialization.

// If you need to initialize socket.io here, you would do it like this:
// const http = require('http');
// const server = http.createServer(); // Assuming you have an HTTP server instance
// const io = socketIo(server);

// Let's assume `io` is passed to relevant functions or managed by a singleton pattern.
// For now, we'll use a placeholder and mention where it should be used.

/**
 * Starts tracking a delivery trip.
 * Updates the delivery status to 'in-transit' and optionally creates an initial GPS log.
 * @param {string} tripId - The ID of the delivery trip.
 * @param {string} userId - The ID of the user initiating the tracking.
 * @returns {Promise<Delivery>} The updated delivery object.
 * @throws {ApiError} If the delivery is not found or the user is not authorized.
 */
const startTripTracking = async (tripId, userId) => {
  logger.info(`Initiating tracking for trip ${tripId} by user ${userId}`);
  const delivery = await Delivery.findById(tripId);
  if (!delivery) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Delivery not found');
  }
  if (delivery.travelerId.toString() !== userId) {
    throw new ApiError(httpStatus.FORBIDDEN, 'User is not the assigned traveler for this trip');
  }

  // TODO: Ensure status transitions are handled gracefully.
  // If the delivery is already 'in-transit' or 'delivered', what should happen?
  // For now, we allow overriding. Consider adding checks if needed.
  delivery.status = 'in-transit';
  await delivery.save();

  // Optionally create an initial GPS log (the app would send actual updates later)
  // This placeholder log might be useful for the client to know tracking has started.
  // However, actual real-time updates are handled by `recordGPSUpdate`.
  // We can skip creating a dummy log here and rely on the first actual update.
  // const initialLocation = { type: 'Point', coordinates: [0, 0] }; // Placeholder
  // await GPSLog.create({ tripId, userId, location: initialLocation, timestamp: Date.now() });

  // TODO: Emit an event to notify relevant parties (e.g., shipper) that tracking has started.
  // Example: io.to(delivery.shipperId).emit('trip_started', { tripId, userId });

  return delivery;
};

/**
 * Stops tracking a delivery trip.
 * Updates the delivery status to 'delivered' (or another appropriate final status).
 * @param {string} tripId - The ID of the delivery trip.
 * @param {string} userId - The ID of the user initiating the stop.
 * @returns {Promise<Delivery>} The updated delivery object.
 * @throws {ApiError} If the delivery is not found or the user is not authorized.
 */
const stopTripTracking = async (tripId, userId) => {
  logger.info(`Stopping tracking for trip ${tripId} by user ${userId}`);
  const delivery = await Delivery.findById(tripId);
  if (!delivery) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Delivery not found');
  }
  if (delivery.travelerId.toString() !== userId) {
    throw new ApiError(httpStatus.FORBIDDEN, 'User is not the assigned traveler for this trip');
  }

  // TODO: Implement a more robust status transition logic.
  // For example, prevent stopping tracking if status is already 'delivered'.
  // Consider different final statuses like 'completed', 'cancelled', etc.
  delivery.status = 'delivered'; // Or another appropriate final status
  await delivery.save();

  // TODO: Emit an event to notify relevant parties (e.g., shipper) that tracking has stopped.
  // Example: io.to(delivery.shipperId).emit('trip_stopped', { tripId, userId, status: delivery.status });

  return delivery;
};

/**
 * Retrieves historical GPS logs for a given trip.
 * @param {string} tripId - The ID of the delivery trip.
 * @returns {Promise<GPSLog[]>} An array of GPS log entries, sorted by timestamp.
 */
const getTripTrackingLogs = async (tripId) => {
  logger.info(`Fetching GPS tracking logs for trip ${tripId}`);
  // Ensure that the query is scoped to the correct trip.
  // Ensure the sort order is ascending for chronological display.
  const logs = await GPSLog.find({ tripId: tripId }).sort({ timestamp: 1 });
  return logs;
};

/**
 * Records a new GPS coordinate update for a trip.
 * This function is intended to be called frequently, e.g., via a WebSocket connection
 * or a highly available API endpoint.
 * @param {string} tripId - The ID of the delivery trip.
 * @param {string} userId - The ID of the user providing the update (likely the traveler).
 * @param {number} latitude - The latitude coordinate.
 * @param {number} longitude - The longitude coordinate.
 * @returns {Promise<GPSLog>} The newly created GPS log entry.
 */
const recordGPSUpdate = async (tripId, userId, latitude, longitude) => {
  // TODO: Implement saving a new GPS coordinate for a trip.
  // Validate latitude and longitude ranges.
  if (typeof latitude !== 'number' || latitude < -90 || latitude > 90) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Invalid latitude value');
  }
  if (typeof longitude !== 'number' || longitude < -180 || longitude > 180) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Invalid longitude value');
  }

  logger.debug(`Recording GPS update for trip ${tripId}: ${latitude}, ${longitude}`);
  const newLog = await GPSLog.create({
    tripId: tripId, // Explicitly assigning properties for clarity
    userId: userId,
    location: { type: 'Point', coordinates: [longitude, latitude] }, // GeoJSON standard: [longitude, latitude]
    timestamp: new Date(), // Using Date.now() is fine, but new Date() is often more explicit for timestamps
  });

  // TODO: Emit this update via Socket.io to listeners (shipper, admin, potentially other travelers).
  // This allows real-time tracking on a map for the shipper or admin.
  // Example: io.to(delivery.shipperId).emit('gps_update', { tripId, userId, location: newLog.location, timestamp: newLog.timestamp });
  // Ensure you have the `delivery` object available to get the shipperId or other relevant recipients.
  // A common pattern is to emit to a room named after the tripId:
  // io.to(`trip_${tripId}`).emit('gps_update', { userId, location: newLog.location, timestamp: newLog.timestamp });

  return newLog;
};

module.exports = {
  startTripTracking,
  stopTripTracking,
  getTripTrackingLogs,
  recordGPSUpdate,
};