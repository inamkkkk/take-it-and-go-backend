const express = require('express');
const validate = require('../middlewares/validator');
const { matchController } = require('../controllers');
const { authenticate, authorize } = require('../middlewares/auth');
const Joi = require('joi');

const router = express.Router();

// Validation schemas
const findMatchesSchema = {
  body: Joi.object().keys({
    origin: Joi.object({
      address: Joi.string().required(),
      latitude: Joi.number().min(-90).max(90).required(),
      longitude: Joi.number().min(-180).max(180).required(),
    }).required(),
    destination: Joi.object({
      address: Joi.string().required(),
      latitude: Joi.number().min(-90).max(90).required(),
      longitude: Joi.number().min(-180).max(180).required(),
    }).required(),
    packageDetails: Joi.object({
      weight: Joi.number().min(0.1).required(), // in kg
      dimensions: Joi.object({
        length: Joi.number().min(1),
        width: Joi.number().min(1),
        height: Joi.number().min(1),
      }).optional(),
      type: Joi.string().optional(),
    }).required(),
    // Optional: preferredDeliveryDate, maxBudget, etc.
    preferredDeliveryDate: Joi.date().optional(),
    maxBudget: Joi.number().min(0).optional(),
  }),
};

// TODO: Add route for fetching a specific match by ID
router.get('/:id', authenticate, authorize(['shipper', 'driver']), matchController.getMatchById);

// TODO: Add route for accepting/rejecting a match (for drivers)
router.put('/:id/status', authenticate, authorize(['driver']), matchController.updateMatchStatus);

// TODO: Add route for getting a list of matches for a shipper
router.get('/shipper', authenticate, authorize(['shipper']), matchController.getShipperMatches);

// TODO: Add route for getting a list of matches for a driver
router.get('/driver', authenticate, authorize(['driver']), matchController.getDriverMatches);

router.post('/find', authenticate, authorize(['shipper']), validate(findMatchesSchema), matchController.findMatches);

module.exports = router;