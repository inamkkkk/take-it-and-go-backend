const express = require('express');
const validate = require('../middlewares/validator');
const { paymentController } = require('../controllers');
const { authenticate, authorize } = require('../middlewares/auth');
const Joi = require('joi');

const router = express.Router();

// Validation schemas
const createEscrowSchema = {
  body: Joi.object().keys({
    shipperId: Joi.string().required().hex().length(24), // ObjectId
    travelerId: Joi.string().required().hex().length(24), // ObjectId
    tripId: Joi.string().required().hex().length(24), // ObjectId
    amount: Joi.number().min(0.01).required(),
    currency: Joi.string().default('USD'),
  }),
};

const releaseRefundSchema = {
  body: Joi.object().keys({
    paymentId: Joi.string().required().hex().length(24), // ObjectId
    // userId: Joi.string().required().hex().length(24), // Current user confirming action
    reason: Joi.string().min(5).optional(), // For refunds
  }),
};

router.post('/escrow', authenticate, authorize(['shipper']), validate(createEscrowSchema), paymentController.createEscrow);
router.post('/release', authenticate, authorize(['shipper', 'admin']), validate(releaseRefundSchema), paymentController.releaseFunds);
router.post('/refund', authenticate, authorize(['admin']), validate(releaseRefundSchema), paymentController.refundPayment);

module.exports = router;
