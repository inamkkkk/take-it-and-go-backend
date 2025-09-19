const express = require('express');
const validate = require('../middlewares/validator');
const { trackingController } = require('../controllers');
const { authenticate, authorize } = require('../middlewares/auth');
const Joi = require('joi');

const router = express.Router();

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

router.post('/start', authenticate, authorize(['traveler']), validate(startStopTrackingSchema), trackingController.startTracking);
router.post('/stop', authenticate, authorize(['traveler']), validate(startStopTrackingSchema), trackingController.stopTracking);
router.get('/:tripId', authenticate, authorize(['shipper', 'traveler', 'admin']), validate(getTrackingSchema), trackingController.getTracking);

// TODO: Add WebSocket endpoint for real-time location updates (e.g., /tracking/live/:tripId)
// This could feed into the chatSocket setup or a separate socket handler.

module.exports = router;
