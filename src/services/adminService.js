const httpStatus = require('http-status-codes');
const ApiError = require('../utils/ApiError');
const logger = require('../utils/logger');
const { User, Verification, Dispute, Delivery, Payment } = require('../models');

const loginAdmin = async (email, password) => {
  // TODO: Implement admin-specific login logic
  // Could be a dedicated admin user, or a regular user with 'admin' role
  const user = await User.findOne({ email, role: 'admin' });
  if (!user || !(await user.isPasswordMatch(password))) {
    throw new ApiError(httpStatus.UNAUTHORIZED, 'Invalid credentials for admin');
  }
  return user;
};

const getAllVerifications = async (filter, options) => {
  // TODO: Implement logic to retrieve and filter verification requests
  // filter: { status: 'pending', userId: '...' }
  // options: { limit: 10, page: 1, sortBy: 'createdAt:desc' }
  logger.info('Retrieving all verifications (stub)');
  const verifications = await Verification.find(filter).limit(options.limit).skip((options.page - 1) * options.limit).sort(options.sortBy);
  // return { results: verifications, totalResults, limit, page };
  return verifications; // Placeholder
};

const getAllDisputes = async (filter, options) => {
  // TODO: Implement logic to retrieve and filter disputes
  logger.info('Retrieving all disputes (stub)');
  const disputes = await Dispute.find(filter).limit(options.limit).skip((options.page - 1) * options.limit).sort(options.sortBy);
  return disputes; // Placeholder
};

const getAllDeliveries = async (filter, options) => {
  // TODO: Implement logic to retrieve and filter delivery records
  logger.info('Retrieving all deliveries (stub)');
  const deliveries = await Delivery.find(filter).limit(options.limit).skip((options.page - 1) * options.limit).sort(options.sortBy);
  return deliveries; // Placeholder
};

const getPaymentsOverview = async (filter) => {
  // TODO: Implement logic to provide aggregated payment statistics
  logger.info('Retrieving payments overview (stub)');
  const totalCompleted = await Payment.countDocuments({ status: 'completed', ...filter });
  const totalPending = await Payment.countDocuments({ status: 'pending', ...filter });
  const totalAmount = (await Payment.aggregate([
    { $match: { status: 'completed', ...filter } },
    { $group: { _id: null, total: { $sum: '$amount' } } },
  ]))[0]?.total || 0;
  return { totalCompleted, totalPending, totalAmount };
};

module.exports = {
  loginAdmin,
  getAllVerifications,
  getAllDisputes,
  getAllDeliveries,
  getPaymentsOverview,
};
