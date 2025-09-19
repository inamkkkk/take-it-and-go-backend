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

router.post('/report', authenticate, validate(reportIssueSchema), disputeController.reportIssue);
router.get('/:id', authenticate, validate(getDisputeSchema), disputeController.getDispute);

module.exports = router;
