const { Payment, User, Delivery } = require('../models');
const logger = require('../utils/logger');
const httpStatus = require('http-status-codes');
const ApiError = require('../utils/ApiError');
const config = require('../config');
// const Razorpay = require('razorpay'); // if using Razorpay
// const stripe = require('stripe')(config.integrations.stripe.secretKey); // if using Stripe

const initiateEscrowPayment = async ({ shipperId, travelerId, amount, tripId }) => {
  // TODO: Implement payment gateway integration (Razorpay/Stripe) to create an escrow
  // Steps:
  // 1. Validate shipperId, travelerId, amount, tripId exist and are valid.
  // 2. Create a 'pending' Payment record in the database.
  // 3. Interact with the chosen payment gateway (Razorpay/Stripe) to create a payment intent/order.
  //    - The funds should be held in an escrow account, not directly disbursed to the traveler.
  // 4. Store the payment gateway's transaction ID and relevant details in the Payment record.
  // 5. Return necessary details (e.g., order ID, client secret) to the frontend for payment completion.

  logger.info(`Initiating escrow payment for trip ${tripId}, amount ${amount}`);

  // Placeholder: Simulate payment gateway interaction
  const mockTransactionId = `txn_${Date.now()}`;
  const paymentGateway = config.integrations.razorpay.keyId ? 'razorpay' : config.integrations.stripe.secretKey ? 'stripe' : 'mock_gateway';

  if (paymentGateway === 'razorpay') {
    // TODO: Implement Razorpay order creation
    // const instance = new Razorpay({ key_id: config.integrations.razorpay.keyId, key_secret: config.integrations.razorpay.keySecret });
    // const order = await instance.orders.create({ amount: amount * 100, currency: 'INR', receipt: `rcpt_${tripId}`, payment_capture: 1 });
    // mockTransactionId = order.id;
    logger.warn('Razorpay integration is stubbed. No actual payment processing.');
  } else if (paymentGateway === 'stripe') {
    // TODO: Implement Stripe Payment Intent creation
    // const paymentIntent = await stripe.paymentIntents.create({
    //   amount: amount * 100, // in cents
    //   currency: 'usd',
    //   transfer_data: { destination: 'traveler_stripe_account_id' }, // For future payout
    //   capture_method: 'manual', // Hold funds
    // });
    // mockTransactionId = paymentIntent.id;
    logger.warn('Stripe integration is stubbed. No actual payment processing.');
  } else {
    logger.warn('No payment gateway configured. Using mock transaction ID.');
  }

  const payment = await Payment.create({
    shipperId,
    travelerId,
    tripId,
    amount,
    status: 'pending',
    transactionId: mockTransactionId,
    paymentGateway,
    paymentDetails: { /* gateway specific details */ },
  });
  return payment;
};

const releaseEscrowFunds = async (paymentId, confirmingUserId) => {
  // TODO: Implement releasing funds from escrow to the traveler
  // Steps:
  // 1. Find the Payment record by paymentId.
  // 2. Verify that the confirmingUserId is authorized (e.g., the shipper or an admin).
  // 3. Ensure the associated Delivery is marked as 'completed'.
  // 4. Instruct the payment gateway to disburse the funds to the traveler's linked account.
  // 5. Update the Payment record status to 'completed'.

  logger.info(`Releasing funds for payment ${paymentId}`);
  const payment = await Payment.findById(paymentId);
  if (!payment) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Payment record not found');
  }
  if (payment.status !== 'pending' && payment.status !== 'disputed') {
    throw new ApiError(httpStatus.BAD_REQUEST, `Funds cannot be released for payment in status: ${payment.status}`);
  }

  const delivery = await Delivery.findById(payment.tripId);
  if (!delivery || delivery.status !== 'delivered') {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Delivery not confirmed as complete.');
  }

  // TODO: Implement actual fund release via payment gateway
  logger.warn(`Fund release for payment ${paymentId} is stubbed. No actual disbursement.`);

  payment.status = 'completed';
  await payment.save();
  return payment;
};

const refundPayment = async (paymentId, reason) => {
  // TODO: Implement refunding a payment
  // Steps:
  // 1. Find the Payment record by paymentId.
  // 2. Check if a refund is possible based on payment status and policy.
  // 3. Instruct the payment gateway to process the refund.
  // 4. Update the Payment record status to 'refunded'.

  logger.info(`Refunding payment ${paymentId} for reason: ${reason}`);
  const payment = await Payment.findById(paymentId);
  if (!payment) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Payment record not found');
  }
  if (payment.status === 'refunded' || payment.status === 'failed') {
    throw new ApiError(httpStatus.BAD_REQUEST, `Payment already ${payment.status}.`);
  }

  // TODO: Implement actual refund via payment gateway
  logger.warn(`Refund for payment ${paymentId} is stubbed. No actual refund processed.`);

  payment.status = 'refunded';
  payment.paymentDetails.refundReason = reason;
  payment.updatedAt = Date.now();
  await payment.save();
  return payment;
};

module.exports = {
  initiateEscrowPayment,
  releaseEscrowFunds,
  refundPayment,
};
