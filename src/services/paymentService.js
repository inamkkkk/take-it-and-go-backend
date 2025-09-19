const { Payment, User, Delivery } = require('../models');
const logger = require('../utils/logger');
const httpStatus = require('http-status-codes');
const ApiError = require('../utils/ApiError');
const config = require('../config');
const Razorpay = require('razorpay');
const stripe = require('stripe')(config.integrations.stripe.secretKey);

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

  // 1. Validate inputs
  if (!shipperId || !travelerId || !amount || !tripId) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Missing required payment details.');
  }
  if (amount <= 0) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Payment amount must be positive.');
  }

  let paymentGateway = 'mock_gateway';
  let transactionId = `mock_txn_${Date.now()}`;
  let paymentDetails = {};

  try {
    if (config.integrations.razorpay.keyId && config.integrations.razorpay.keySecret) {
      paymentGateway = 'razorpay';
      const instance = new Razorpay({
        key_id: config.integrations.razorpay.keyId,
        key_secret: config.integrations.razorpay.keySecret,
      });
      // Razorpay amounts are in paisa (100 times the base currency unit)
      const order = await instance.orders.create({
        amount: amount * 100,
        currency: 'INR', // Assuming INR for Razorpay, adjust if needed
        receipt: `trip_${tripId}_receipt`,
        payment_capture: 1, // Auto capture funds
      });
      transactionId = order.id;
      paymentDetails = { razorpayOrderId: order.id, status: order.status };
      logger.info(`Razorpay order created: ${order.id}`);
    } else if (config.integrations.stripe.secretKey) {
      paymentGateway = 'stripe';
      // For Stripe escrow, we might use setup intents or payment intents with manual capture.
      // A more robust escrow might involve a dedicated platform account or Connect.
      // For this stub, we'll create a payment intent with manual capture.
      // Destination account ID is a placeholder and needs to be dynamically determined for the traveler.
      // This requires traveler to have a Stripe account linked.
      const paymentIntent = await stripe.paymentIntents.create({
        amount: amount * 100, // Stripe amounts are in cents
        currency: 'usd', // Assuming USD for Stripe, adjust if needed
        capture_method: 'manual', // Hold funds until explicitly captured
        // transfer_data: { destination: 'traveler_stripe_account_id' }, // This is for direct payouts, not escrow
        // For escrow, we typically hold funds in our platform account and then transfer.
        // A more complex setup might be needed for true escrow with Stripe.
      });
      transactionId = paymentIntent.id;
      paymentDetails = { stripePaymentIntentId: paymentIntent.id, clientSecret: paymentIntent.client_secret };
      logger.info(`Stripe payment intent created: ${paymentIntent.id}`);
    } else {
      logger.warn('No payment gateway configured. Using mock transaction.');
    }
  } catch (error) {
    logger.error(`Payment gateway integration failed: ${error.message}`);
    throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, 'Payment gateway error.');
  }

  // 2. Create a 'pending' Payment record in the database.
  const payment = await Payment.create({
    shipperId,
    travelerId,
    tripId,
    amount,
    status: 'pending',
    transactionId: transactionId,
    paymentGateway,
    paymentDetails,
  });

  logger.info(`Payment record created with ID: ${payment.id}, Status: ${payment.status}`);

  // 5. Return necessary details
  return {
    paymentId: payment.id,
    transactionId: payment.transactionId,
    paymentGateway: payment.paymentGateway,
    paymentDetails: payment.paymentDetails, // e.g., client secret for Stripe, order ID for Razorpay
  };
};

const releaseEscrowFunds = async (paymentId, confirmingUserId) => {
  // TODO: Implement releasing funds from escrow to the traveler
  // Steps:
  // 1. Find the Payment record by paymentId.
  // 2. Verify that the confirmingUserId is authorized (e.g., the shipper or an admin).
  // 3. Ensure the associated Delivery is marked as 'completed'.
  // 4. Instruct the payment gateway to disburse the funds to the traveler's linked account.
  // 5. Update the Payment record status to 'completed'.

  logger.info(`Attempting to release funds for payment ${paymentId} by user ${confirmingUserId}`);

  // 1. Find the Payment record by paymentId.
  const payment = await Payment.findById(paymentId);
  if (!payment) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Payment record not found.');
  }

  // Basic authorization check (can be expanded to check user roles)
  // For now, assuming shipperId or travelerId can confirm, or an admin.
  // This logic might need to be more sophisticated based on app requirements.
  // if (payment.shipperId !== confirmingUserId && payment.travelerId !== confirmingUserId /* && !isAdmin(confirmingUserId) */) {
  //   throw new ApiError(httpStatus.UNAUTHORIZED, 'User not authorized to release funds.');
  // }

  // 2. Verify authorization (simplified for this task)
  // This assumes the request comes from an authenticated user who is either the shipper or traveler.
  // A more robust check would involve user roles or specific permissions.
  const user = await User.findById(confirmingUserId);
  if (!user) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Confirming user not found.');
  }
  // Check if the confirming user is involved in the payment
  if (payment.shipperId !== confirmingUserId && payment.travelerId !== confirmingUserId) {
    throw new ApiError(httpStatus.UNAUTHORIZED, 'User not authorized to release funds for this payment.');
  }


  // 3. Ensure the associated Delivery is marked as 'completed'.
  const delivery = await Delivery.findOne({ tripId: payment.tripId }); // Assuming Delivery has a tripId field
  if (!delivery || delivery.status !== 'completed') {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Delivery associated with this payment is not marked as completed.');
  }

  // Check if payment is in a state that allows release (pending or disputed might be scenarios to resolve)
  if (payment.status !== 'pending') {
    throw new ApiError(httpStatus.BAD_REQUEST, `Funds cannot be released for payment in status: ${payment.status}. Expected 'pending'.`);
  }

  try {
    // 4. Instruct the payment gateway to disburse the funds to the traveler's linked account.
    if (payment.paymentGateway === 'razorpay') {
      // For Razorpay, funds are captured into your account upon order creation (if payment_capture: 1).
      // Releasing to traveler usually involves a separate transfer/payout operation.
      // This requires the traveler's bank details or Razorpay account.
      // This part is complex and depends on how payouts are managed.
      // Assuming here we are 'confirming' the capture and finalization.
      // A real implementation would involve a Razorpay payout API call.
      // For simplicity, we'll just mark it as released if capture was successful.
      logger.warn(`Razorpay fund release simulation: Marking payment ${paymentId} as released.`);
      // Example for actual payout (requires traveler's UTR/account details)
      // const payout = await instance.payouts.create({
      //   amount: payment.amount * 100,
      //   currency: 'INR',
      //   account_number: 'traveler_bank_account_number',
      //   fund_account_type: 'bank_account',
      //   // ... other details
      // });
      // logger.info(`Razorpay payout initiated: ${payout.id}`);
    } else if (payment.paymentGateway === 'stripe') {
      // If capture_method was 'manual', we need to capture the payment intent.
      // Then, we can create a transfer to the traveler's connected account.
      if (payment.paymentDetails.stripePaymentIntentId) {
        const existingPaymentIntent = await stripe.paymentIntents.retrieve(payment.transactionId);

        if (existingPaymentIntent.status === 'requires_capture') {
          await stripe.paymentIntents.capture(payment.transactionId);
          logger.info(`Stripe payment intent ${payment.transactionId} captured.`);

          // Now, create a transfer to the traveler's Stripe account.
          // This requires the traveler's Stripe account ID (destination account).
          // This ID should be stored when the traveler links their account.
          // For this example, we'll use a placeholder.
          const travelerStripeAccountId = await getTravelerStripeAccountId(payment.travelerId); // Assume this function exists
          if (!travelerStripeAccountId) {
            throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, 'Traveler Stripe account not linked.');
          }

          await stripe.transfers.create({
            amount: payment.amount * 100, // Amount in cents
            currency: 'usd',
            destination: travelerStripeAccountId,
            source_transaction: payment.transactionId, // Link transfer to the captured payment intent
          });
          logger.info(`Stripe transfer created for traveler ${payment.travelerId}.`);
        } else {
          logger.warn(`Stripe payment intent ${payment.transactionId} is not in 'requires_capture' state. Current state: ${existingPaymentIntent.status}.`);
          // If already captured or succeeded, we might still proceed with transfer if not done.
          // This logic can get complex depending on state machine.
        }
      } else {
        throw new ApiError(httpStatus.BAD_REQUEST, 'Stripe payment intent ID missing in payment details.');
      }
    } else {
      logger.warn(`No specific release logic for payment gateway: ${payment.paymentGateway}. Marking as released.`);
    }
  } catch (error) {
    logger.error(`Error during payment gateway fund release for payment ${paymentId}: ${error.message}`);
    throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, 'Failed to release funds via payment gateway.');
  }

  // 5. Update the Payment record status to 'completed'.
  payment.status = 'completed';
  payment.completedAt = new Date();
  await payment.save();

  logger.info(`Funds successfully released for payment ${paymentId}. New status: ${payment.status}`);
  return payment;
};


// Helper function to get traveler's Stripe account ID (placeholder)
const getTravelerStripeAccountId = async (travelerId) => {
  // In a real application, you would fetch this from your User model or a dedicated
  // integration model linking users to their Stripe Connect accounts.
  // Example:
  // const user = await User.findById(travelerId);
  // return user ? user.stripeConnectAccountId : null;
  // For now, returning a dummy value or throwing an error.
  logger.warn(`getTravelerStripeAccountId is a placeholder. Traveler ID: ${travelerId}`);
  // Replace with actual logic to fetch traveler's Stripe Connect Account ID
  // For testing, you might have a mock user with a Stripe ID.
  if (travelerId === 'mock_traveler_id_with_stripe_account') {
      return 'acct_xxxxxxxxxxxxxxxxx'; // Replace with a valid test Stripe Connect account ID
  }
  return null;
};


const refundPayment = async (paymentId, reason) => {
  // TODO: Implement refunding a payment
  // Steps:
  // 1. Find the Payment record by paymentId.
  // 2. Check if a refund is possible based on payment status and policy.
  // 3. Instruct the payment gateway to process the refund.
  // 4. Update the Payment record status to 'refunded'.

  logger.info(`Initiating refund for payment ${paymentId} with reason: ${reason}`);

  // 1. Find the Payment record by paymentId.
  const payment = await Payment.findById(paymentId);
  if (!payment) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Payment record not found.');
  }

  // 2. Check if a refund is possible.
  // Typically, refunds are possible for 'completed' or 'pending' payments that haven't been finalized.
  // 'refunded' or 'failed' statuses usually mean no refund is applicable or possible.
  if (payment.status === 'refunded') {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Payment has already been refunded.');
  }
  if (payment.status === 'failed') {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Payment failed and cannot be refunded.');
  }
  // Depending on your business logic, you might allow refunds for 'pending' payments.
  // For 'completed' payments, a refund is usually straightforward.
  // If there are specific time limits for refunds, they should be checked here.

  try {
    // 3. Instruct the payment gateway to process the refund.
    if (payment.paymentGateway === 'razorpay') {
      // For Razorpay, if the order was captured, you can initiate a refund.
      // You might need the Razorpay order ID or a specific transaction ID from the payment.
      // The `payment.transactionId` should be the Razorpay Order ID.
      const instance = new Razorpay({
        key_id: config.integrations.razorpay.keyId,
        key_secret: config.integrations.razorpay.keySecret,
      });

      // To refund a Razorpay order, you typically refund one of its payments.
      // If you have the specific payment ID (rzp_pay_id), use that. Otherwise, refund the order.
      // A simpler approach is to refund the order, which might refund all associated payments.
      // For full refund:
      const refund = await instance.refunds.create({
        order_id: payment.transactionId, // Using the order ID for refund
        // payment_id: 'pay_xxxxxxxxxxxxxx', // Use specific payment ID if available and needed
        amount: payment.amount * 100, // Amount in paisa
        currency: 'INR', // Ensure currency matches
        notes: {
          reason: reason || 'Customer request',
        },
      });
      logger.info(`Razorpay refund initiated for order ${payment.transactionId}: ${refund.id}`);
    } else if (payment.paymentGateway === 'stripe') {
      // For Stripe, you refund the payment intent or charge.
      // The `payment.transactionId` is the Payment Intent ID.
      if (payment.paymentDetails.stripePaymentIntentId) {
        // If payment intent was already captured, we refund it.
        // If it was manual capture and not yet captured, refunding might not be applicable or different.
        // Stripe refunds can be partial or full. Here we assume full refund.
        const refund = await stripe.refunds.create({
          payment_intent: payment.transactionId,
          amount: payment.amount * 100, // Amount in cents
          reason: reason || 'requested_by_customer',
        });
        logger.info(`Stripe refund initiated for payment intent ${payment.transactionId}: ${refund.id}`);
      } else {
        throw new ApiError(httpStatus.BAD_REQUEST, 'Stripe payment intent ID missing for refund.');
      }
    } else {
      logger.warn(`No specific refund logic for payment gateway: ${payment.paymentGateway}. Marking as refunded.`);
    }
  } catch (error) {
    logger.error(`Error during payment gateway refund for payment ${paymentId}: ${error.message}`);
    // Depending on error, you might want to mark payment as 'refund_failed' instead of throwing.
    throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, 'Failed to process refund via payment gateway.');
  }

  // 4. Update the Payment record status to 'refunded'.
  payment.status = 'refunded';
  payment.refundedAt = new Date();
  // Store refund details if available
  payment.paymentDetails = {
    ...payment.paymentDetails,
    refundReason: reason,
    // Add gateway-specific refund IDs if returned by API
  };
  await payment.save();

  logger.info(`Payment ${paymentId} successfully refunded. New status: ${payment.status}`);
  return payment;
};

module.exports = {
  initiateEscrowPayment,
  releaseEscrowFunds,
  refundPayment,
};