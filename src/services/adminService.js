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

const getAllVerifications = async (filter = {}, options = {}) => {
  // TODO: Implement logic to retrieve and filter verification requests
  // filter: { status: 'pending', userId: '...' }
  // options: { limit: 10, page: 1, sortBy: 'createdAt:desc' }
  logger.info('Retrieving all verifications');

  const { limit = 10, page = 1, sortBy } = options;
  const skip = (page - 1) * limit;

  let sortQuery = {};
  if (sortBy) {
    const [field, direction] = sortBy.split(':');
    sortQuery[field] = direction === 'desc' ? -1 : 1;
  } else {
    // Default sort by createdAt descending if not provided
    sortQuery = { createdAt: -1 };
  }

  const verificationsQuery = Verification.find(filter).skip(skip).limit(limit).sort(sortQuery);
  const totalResultsQuery = Verification.countDocuments(filter);

  const [verifications, totalResults] = await Promise.all([verificationsQuery, totalResultsQuery]);

  return {
    results: verifications,
    totalResults,
    limit,
    page,
  };
};

const getAllDisputes = async (filter = {}, options = {}) => {
  // TODO: Implement logic to retrieve and filter disputes
  logger.info('Retrieving all disputes');

  const { limit = 10, page = 1, sortBy } = options;
  const skip = (page - 1) * limit;

  let sortQuery = {};
  if (sortBy) {
    const [field, direction] = sortBy.split(':');
    sortQuery[field] = direction === 'desc' ? -1 : 1;
  } else {
    // Default sort by createdAt descending if not provided
    sortQuery = { createdAt: -1 };
  }

  const disputesQuery = Dispute.find(filter).skip(skip).limit(limit).sort(sortQuery);
  const totalResultsQuery = Dispute.countDocuments(filter);

  const [disputes, totalResults] = await Promise.all([disputesQuery, totalResultsQuery]);

  return {
    results: disputes,
    totalResults,
    limit,
    page,
  };
};

const getAllDeliveries = async (filter = {}, options = {}) => {
  // TODO: Implement logic to retrieve and filter delivery records
  logger.info('Retrieving all deliveries');

  const { limit = 10, page = 1, sortBy } = options;
  const skip = (page - 1) * limit;

  let sortQuery = {};
  if (sortBy) {
    const [field, direction] = sortBy.split(':');
    sortQuery[field] = direction === 'desc' ? -1 : 1;
  } else {
    // Default sort by createdAt descending if not provided
    sortQuery = { createdAt: -1 };
  }

  const deliveriesQuery = Delivery.find(filter).skip(skip).limit(limit).sort(sortQuery);
  const totalResultsQuery = Delivery.countDocuments(filter);

  const [deliveries, totalResults] = await Promise.all([deliveriesQuery, totalResultsQuery]);

  return {
    results: deliveries,
    totalResults,
    limit,
    page,
  };
};

const getPaymentsOverview = async (filter = {}) => {
  // TODO: Implement logic to provide aggregated payment statistics
  logger.info('Retrieving payments overview');

  const [totalCompleted, totalPending, totalAmountResult] = await Promise.all([
    Payment.countDocuments({ status: 'completed', ...filter }),
    Payment.countDocuments({ status: 'pending', ...filter }),
    Payment.aggregate([
      { $match: { status: 'completed', ...filter } },
      { $group: { _id: null, total: { $sum: '$amount' } } },
    ]),
  ]);

  const totalAmount = totalAmountResult.length > 0 ? totalAmountResult[0].total : 0;

  return {
    totalCompleted,
    totalPending,
    totalAmount,
  };
};

module.exports = {
  loginAdmin,
  getAllVerifications,
  getAllDisputes,
  getAllDeliveries,
  getPaymentsOverview,
};