const express = require('express');
const validate = require('../middlewares/validator');
const { trackingController } = require('../controllers');
const { authenticate, authorize } = require('../middlewares/auth');
const Joi = require('joi');
const { Server } = require('socket.io'); // Import Socket.IO server

const router = express.Router();

// TODO: Initialize and configure WebSocket server here if not done globally.
// Assuming socket.io is initialized in app.js and passed or accessible.
// For this file's responsibility, we will assume 'io' is available globally or passed in.
// If not, this would typically be handled in the main app setup.
// Example: const io = new Server(httpServer); // where httpServer is your Node.js server instance

// Validation schemas
const startStopTrackingSchema = {
  body: Joi.object().keys({
    tripId: Joi.string().required().hex().length(24), // ObjectId
    userId: Joi.string().required().hex().length(24), // ObjectId of the traveler reporting location
  }),
};

const getTrackingSchema = {
  params: Joi.object().keys({
    tripId: Joi.string().required().hex().length(24), // ObjectId
  }),
};

// TODO: Implement route for starting tracking
router.post('/start', authenticate, authorize(['traveler']), validate(startStopTrackingSchema), trackingController.startTracking);

// TODO: Implement route for stopping tracking
router.post('/stop', authenticate, authorize(['traveler']), validate(startStopTrackingSchema), trackingController.stopTracking);

// TODO: Implement route to get tracking status/history for a trip
router.get('/:tripId', authenticate, authorize(['shipper', 'traveler', 'admin']), validate(getTrackingSchema), trackingController.getTracking);

// TODO: Add WebSocket endpoint for real-time location updates (e.g., /tracking/live/:tripId)
// This endpoint will listen for location updates and broadcast them to relevant clients.
// Assuming 'io' is accessible, e.g., through a global variable or passed from app.js
// If `io` is not globally available, it might need to be passed as an argument or initialized here.
// For demonstration, we'll assume `io` is available. If it's not, this section would need adjustment
// to how the Socket.IO server is managed.
router.ws('/live/:tripId', authenticate, authorize(['traveler']), (ws, req) => {
  const { tripId } = req.params;
  const userId = req.user.id; // Assuming user ID is attached to request by authenticate middleware

  console.log(`WebSocket connected for live tracking of trip: ${tripId} by user: ${userId}`);

  // Subscribe this client to the specific trip's location updates
  // This logic would depend on your WebSocket implementation.
  // If using socket.io directly within express routes (less common), you might access `io` here.
  // A more typical approach is to have a separate WebSocket server instance.

  // Example using a hypothetical `subscribeToTripLocation` function
  // This function would handle associating the WebSocket with the trip and
  // receiving updates to forward.
  // e.g., trackingService.subscribeToTripLocation(tripId, ws);

  ws.on('message', (msg) => {
    try {
      const data = JSON.parse(msg);
      // Assuming the traveler sends location updates
      if (data.latitude && data.longitude) {
        console.log(`Received location update for trip ${tripId}:`, data);
        // Broadcast the location update to all clients subscribed to this trip
        // This part relies on your WebSocket server's broadcasting mechanism.
        // If using socket.io, you'd do something like:
        // io.to(tripId).emit('locationUpdate', { tripId, userId, ...data });
        // For direct ws:
        // Consider broadcasting to other connected clients subscribed to this trip.
        // This usually involves maintaining a map of tripId -> list of ws connections.
        // For simplicity here, we'll log and assume a broadcast mechanism exists.
      }
    } catch (error) {
      console.error('Failed to parse message or invalid data:', error);
      ws.send(JSON.stringify({ error: 'Invalid message format' }));
    }
  });

  ws.on('close', () => {
    console.log(`WebSocket disconnected for live tracking of trip: ${tripId} by user: ${userId}`);
    // Unsubscribe this client
    // e.g., trackingService.unsubscribeFromTripLocation(tripId, ws);
  });

  ws.on('error', (error) => {
    console.error(`WebSocket error for trip ${tripId}:`, error);
  });

  // Acknowledge connection and potentially send initial state if needed
  ws.send(JSON.stringify({ status: 'connected', message: `Subscribed to live tracking for trip ${tripId}` }));
});


module.exports = router;