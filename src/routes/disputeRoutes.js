const express = require('express');
const validate = require('../middlewares/validator');
const { disputeController } = require('../controllers');
const { authenticate, authorize } = require('../middlewares/auth');
const Joi = require('joi');

const router = express.Router();

// Validation schemas
const reportIssueSchema = {
  body: Joi.object().keys({
    userId: Joi.string().required().hex().length(24), // ObjectId
    tripId: Joi.string().required().hex().length(24), // ObjectId
    type: Joi.string().valid('payment_issue', 'delivery_issue', 'item_damage', 'behavioral', 'other').required(),
    description: Joi.string().min(10).required(),
    evidence: Joi.array().items(Joi.string().uri()).optional(),
  }),
};

const getDisputeSchema = {
  params: Joi.object().keys({
    id: Joi.string().required().hex().length(24), // ObjectId
  }),
};

// TODO: Add a route to list all disputes, with optional filtering by userId and tripId.
// This route should be protected by authenticate and authorize middleware to ensure only authenticated and authorized users can access it.
const listDisputesSchema = {
  query: Joi.object().keys({
    userId: Joi.string().hex().length(24).optional(), // ObjectId
    tripId: Joi.string().hex().length(24).optional(), // ObjectId
  }),
};

router.post('/report', authenticate, validate(reportIssueSchema), disputeController.reportIssue);
router.get('/:id', authenticate, validate(getDisputeSchema), disputeController.getDispute);
router.get('/', authenticate, authorize(['admin', 'user']), validate(listDisputesSchema), disputeController.listDisputes);

module.exports = router;