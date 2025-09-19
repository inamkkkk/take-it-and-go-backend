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
    // userId: Joi.string().required().hex().length(24), // Current user confirming action (This is usually handled by the 'authenticate' middleware)
    reason: Joi.string().min(5).optional(), // For refunds
  }),
};

// TODO: Implement route for getting a specific payment by ID.
// This route should be protected by authentication and authorization.
// The user requesting the payment should be either the shipper, traveler, or admin.
const getPaymentByIdSchema = {
  params: Joi.object().keys({
    paymentId: Joi.string().required().hex().length(24), // ObjectId
  }),
};

router.get('/:paymentId', authenticate, authorize(['shipper', 'traveler', 'admin']), validate(getPaymentByIdSchema), paymentController.getPaymentById);

router.post('/escrow', authenticate, authorize(['shipper']), validate(createEscrowSchema), paymentController.createEscrow);
router.post('/release', authenticate, authorize(['shipper', 'admin']), validate(releaseRefundSchema), paymentController.releaseFunds);
router.post('/refund', authenticate, authorize(['admin']), validate(releaseRefundSchema), paymentController.refundPayment);

// TODO: Implement route for fetching all payments, with optional filtering by user role and status.
// This route should be protected by 'admin' authorization.
// The filter should allow fetching payments for shippers, travelers, or by status.
const getPaymentsSchema = {
  query: Joi.object().keys({
    userId: Joi.string().hex().length(24), // Optional user ID to filter payments for
    role: Joi.string().valid('shipper', 'traveler').optional(), // Optional role to filter by
    status: Joi.string().optional(), // Optional status to filter by (e.g., 'pending', 'completed', 'failed')
  }),
};

router.get('/', authenticate, authorize(['admin']), validate(getPaymentsSchema), paymentController.getPayments);


module.exports = router;