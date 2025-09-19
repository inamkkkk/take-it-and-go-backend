const httpStatus = require('http-status-codes');
const { paymentService } = require('../services');
const { successResponse, errorResponse } = require('../utils/apiResponse');
const logger = require('../utils/logger');

const createEscrow = async (req, res) => {
  try {
    // TODO: Implement logic to create an escrow payment.
    // Steps:
    // 1. Validate input (shipperId, travelerId, amount, tripId).
    // 2. Initiate payment with a payment gateway (integration: Razorpay/Stripe).
    // 3. Hold funds in escrow. Create a Payment record with 'pending' status.
    // 4. Return payment gateway details for client-side completion or confirmation.
    logger.info(`Create escrow request: ${JSON.stringify(req.body)}`);
    const { shipperId, travelerId, amount, tripId } = req.body;
    const payment = await paymentService.initiateEscrowPayment({ shipperId, travelerId, amount, tripId });
    res.status(httpStatus.CREATED).json(successResponse('Escrow payment initiated', payment));
  } catch (error) {
    logger.error(`Create escrow error: ${error.message}`);
    res.status(httpStatus.BAD_REQUEST).json(errorResponse(error.message));
  }
};

const releaseFunds = async (req, res) => {
  try {
    // TODO: Implement logic to release funds from escrow.
    // Steps:
    // 1. Validate input (paymentId, userId_confirming_delivery).
    // 2. Check if the delivery associated with the payment is completed and confirmed.
    // 3. Instruct payment gateway to release funds from escrow to the traveler.
    // 4. Update the Payment record status to 'completed'.
    logger.info(`Release funds request: ${JSON.stringify(req.body)}`);
    const { paymentId, userId } = req.body; // userId might be current user confirming delivery
    await paymentService.releaseEscrowFunds(paymentId, userId);
    res.status(httpStatus.OK).json(successResponse('Funds released successfully'));
  } catch (error) {
    logger.error(`Release funds error: ${error.message}`);
    res.status(httpStatus.BAD_REQUEST).json(errorResponse(error.message));
  }
};

const refundPayment = async (req, res) => {
  try {
    // TODO: Implement logic to refund a payment.
    // Steps:
    // 1. Validate input (paymentId, reason).
    // 2. Check payment status (must be pending or completed, depending on refund policy).
    // 3. Instruct payment gateway to process a refund.
    // 4. Update the Payment record status to 'refunded' or create a new refund record.
    logger.info(`Refund payment request: ${JSON.stringify(req.body)}`);
    const { paymentId, reason } = req.body;
    await paymentService.refundPayment(paymentId, reason);
    res.status(httpStatus.OK).json(successResponse('Payment refunded successfully'));
  } catch (error) {
    logger.error(`Refund payment error: ${error.message}`);
    res.status(httpStatus.BAD_REQUEST).json(errorResponse(error.message));
  }
};

module.exports = {
  createEscrow,
  releaseFunds,
  refundPayment,
};
