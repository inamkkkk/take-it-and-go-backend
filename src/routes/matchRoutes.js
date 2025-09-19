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
  }),
};

router.post('/find', authenticate, authorize(['shipper']), validate(findMatchesSchema), matchController.findMatches);

module.exports = router;
