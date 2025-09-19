const httpStatus = require('http-status-codes');
const { adminService } = require('../services');
const { successResponse, errorResponse } = require('../utils/apiResponse');
const logger = require('../utils/logger');
const jwt = require('jsonwebtoken'); // Import JWT for token generation
const bcrypt = require('bcryptjs'); // Import bcryptjs for password hashing

// TODO: Load JWT secret key and token expiration time from environment variables
const JWT_SECRET = process.env.JWT_SECRET || 'your_default_super_secret_key'; // Replace with a strong secret in production
const TOKEN_EXPIRATION = process.env.TOKEN_EXPIRATION || '1h';

const login = async (req, res) => {
  const { email, password } = req.body;

  // TODO: Implement admin login logic
  // Steps:
  // 1. Validate credentials (e.g., specific admin email/password or dedicated admin user role).
  // 2. If valid, generate a JWT token with admin role.
  // 3. Return the token.
  logger.info('Admin login request received');

  try {
    if (!email || !password) {
      return res.status(httpStatus.BAD_REQUEST).json(errorResponse('Email and password are required'));
    }

    // 1. Validate credentials
    // In a real application, you'd fetch the admin user from a database
    // and compare the hashed password. For this stub, we'll use hardcoded values.
    // TODO: Replace with actual database lookup and password verification
    const adminUser = {
      id: 'admin_123',
      email: 'admin@example.com',
      passwordHash: bcrypt.hashSync('admin_password', 10), // Example hashed password
      role: 'admin',
    };

    const isPasswordMatch = await bcrypt.compare(password, adminUser.passwordHash);

    if (email !== adminUser.email || !isPasswordMatch) {
      logger.warn('Admin login failed: Invalid credentials');
      return res.status(httpStatus.UNAUTHORIZED).json(errorResponse('Invalid email or password'));
    }

    // 2. Generate a JWT token
    const token = jwt.sign(
      { userId: adminUser.id, role: adminUser.role },
      JWT_SECRET,
      { expiresIn: TOKEN_EXPIRATION }
    );

    logger.info(`Admin login successful for ${email}`);
    // 3. Return the token
    res.status(httpStatus.OK).json(successResponse('Admin login successful', { token }));

  } catch (error) {
    logger.error(`Admin login error: ${error.message}`);
    res.status(httpStatus.INTERNAL_SERVER_ERROR).json(errorResponse('An error occurred during admin login'));
  }
};

const listVerifications = async (req, res) => {
  // TODO: Implement logic to list all pending/approved ID verifications.
  // Steps:
  // 1. Retrieve verification requests from the database (e.g., from a Verification model).
  // 2. Allow filtering by status (pending, approved, rejected) and user.
  // 3. Return a paginated list of verifications.
  logger.info('Admin list verifications request received');

  try {
    const { status, userId, page = 1, limit = 10 } = req.query;

    // 1. Retrieve verification requests from the database
    // TODO: Replace with actual database query using a Verification model
    const mockVerifications = [
      { id: 'v1', userId: 'user_abc', status: 'pending', createdAt: new Date() },
      { id: 'v2', userId: 'user_def', status: 'approved', createdAt: new Date() },
      { id: 'v3', userId: 'user_abc', status: 'rejected', createdAt: new Date() },
    ];

    let filteredVerifications = mockVerifications;

    // 2. Allow filtering
    if (status) {
      filteredVerifications = filteredVerifications.filter(v => v.status === status);
    }
    if (userId) {
      filteredVerifications = filteredVerifications.filter(v => v.userId === userId);
    }

    // 3. Return a paginated list
    const startIndex = (parseInt(page, 10) - 1) * parseInt(limit, 10);
    const endIndex = startIndex + parseInt(limit, 10);
    const paginatedVerifications = filteredVerifications.slice(startIndex, endIndex);

    res.status(httpStatus.OK).json(successResponse('Verification list retrieved successfully', {
      verifications: paginatedVerifications,
      currentPage: parseInt(page, 10),
      totalPages: Math.ceil(filteredVerifications.length / parseInt(limit, 10)),
      totalVerifications: filteredVerifications.length,
    }));

  } catch (error) {
    logger.error(`Admin list verifications error: ${error.message}`);
    res.status(httpStatus.INTERNAL_SERVER_ERROR).json(errorResponse('An error occurred while fetching verifications'));
  }
};

const listDisputes = async (req, res) => {
  // TODO: Implement logic to list all disputes.
  // Steps:
  // 1. Retrieve disputes from the database (Dispute model).
  // 2. Allow filtering by status (open, resolved, escalated), user, or trip.
  // 3. Return a paginated list of disputes.
  logger.info('Admin list disputes request received');

  try {
    const { status, userId, tripId, page = 1, limit = 10 } = req.query;

    // 1. Retrieve disputes from the database
    // TODO: Replace with actual database query using a Dispute model
    const mockDisputes = [
      { id: 'd1', userId: 'user_abc', tripId: 'trip_001', status: 'open', createdAt: new Date() },
      { id: 'd2', userId: 'user_def', tripId: 'trip_002', status: 'resolved', createdAt: new Date() },
      { id: 'd3', userId: 'user_abc', tripId: 'trip_001', status: 'escalated', createdAt: new Date() },
    ];

    let filteredDisputes = mockDisputes;

    // 2. Allow filtering
    if (status) {
      filteredDisputes = filteredDisputes.filter(d => d.status === status);
    }
    if (userId) {
      filteredDisputes = filteredDisputes.filter(d => d.userId === userId);
    }
    if (tripId) {
      filteredDisputes = filteredDisputes.filter(d => d.tripId === tripId);
    }

    // 3. Return a paginated list
    const startIndex = (parseInt(page, 10) - 1) * parseInt(limit, 10);
    const endIndex = startIndex + parseInt(limit, 10);
    const paginatedDisputes = filteredDisputes.slice(startIndex, endIndex);

    res.status(httpStatus.OK).json(successResponse('Dispute list retrieved successfully', {
      disputes: paginatedDisputes,
      currentPage: parseInt(page, 10),
      totalPages: Math.ceil(filteredDisputes.length / parseInt(limit, 10)),
      totalDisputes: filteredDisputes.length,
    }));

  } catch (error) {
    logger.error(`Admin list disputes error: ${error.message}`);
    res.status(httpStatus.INTERNAL_SERVER_ERROR).json(errorResponse('An error occurred while fetching disputes'));
  }
};

const listDeliveries = async (req, res) => {
  // TODO: Implement logic to list all deliveries/trips.
  // Steps:
  // 1. Retrieve delivery records from the database (Delivery model).
  // 2. Allow filtering by status, shipper, traveler, date range.
  // 3. Return a paginated list of deliveries.
  logger.info('Admin list deliveries request received');

  try {
    const { status, shipperId, travelerId, startDate, endDate, page = 1, limit = 10 } = req.query;

    // 1. Retrieve delivery records from the database
    // TODO: Replace with actual database query using a Delivery model
    const mockDeliveries = [
      { id: 'del1', shipperId: 'user_abc', travelerId: 'user_xyz', status: 'completed', createdAt: new Date('2023-10-26') },
      { id: 'del2', shipperId: 'user_def', travelerId: 'user_pqr', status: 'in_progress', createdAt: new Date('2023-10-25') },
      { id: 'del3', shipperId: 'user_abc', travelerId: 'user_xyz', status: 'completed', createdAt: new Date('2023-10-24') },
    ];

    let filteredDeliveries = mockDeliveries;

    // 2. Allow filtering
    if (status) {
      filteredDeliveries = filteredDeliveries.filter(d => d.status === status);
    }
    if (shipperId) {
      filteredDeliveries = filteredDeliveries.filter(d => d.shipperId === shipperId);
    }
    if (travelerId) {
      filteredDeliveries = filteredDeliveries.filter(d => d.travelerId === travelerId);
    }
    if (startDate) {
      const start = new Date(startDate);
      filteredDeliveries = filteredDeliveries.filter(d => d.createdAt >= start);
    }
    if (endDate) {
      const end = new Date(endDate);
      filteredDeliveries = filteredDeliveries.filter(d => d.createdAt <= end);
    }

    // 3. Return a paginated list
    const startIndex = (parseInt(page, 10) - 1) * parseInt(limit, 10);
    const endIndex = startIndex + parseInt(limit, 10);
    const paginatedDeliveries = filteredDeliveries.slice(startIndex, endIndex);

    res.status(httpStatus.OK).json(successResponse('Delivery list retrieved successfully', {
      deliveries: paginatedDeliveries,
      currentPage: parseInt(page, 10),
      totalPages: Math.ceil(filteredDeliveries.length / parseInt(limit, 10)),
      totalDeliveries: filteredDeliveries.length,
    }));

  } catch (error) {
    logger.error(`Admin list deliveries error: ${error.message}`);
    res.status(httpStatus.INTERNAL_SERVER_ERROR).json(errorResponse('An error occurred while fetching deliveries'));
  }
};

const paymentsOverview = async (req, res) => {
  // TODO: Implement logic to provide an overview of payments.
  // Steps:
  // 1. Aggregate payment data (Payment model).
  // 2. Show total amounts, pending payments, completed payments, refunds.
  // 3. Allow filtering by date range, status.
  // 4. Return summary statistics.
  logger.info('Admin payments overview request received');

  try {
    const { startDate, endDate, status } = req.query;

    // 1. Aggregate payment data
    // TODO: Replace with actual database aggregation for payments
    const mockPayments = [
      { id: 'p1', amount: 50.00, status: 'completed', createdAt: new Date('2023-10-26') },
      { id: 'p2', amount: 75.50, status: 'completed', createdAt: new Date('2023-10-25') },
      { id: 'p3', amount: 100.00, status: 'pending', createdAt: new Date('2023-10-25') },
      { id: 'p4', amount: 25.00, status: 'refunded', createdAt: new Date('2023-10-24') },
    ];

    let filteredPayments = mockPayments;

    // 3. Allow filtering
    if (startDate) {
      const start = new Date(startDate);
      filteredPayments = filteredPayments.filter(p => p.createdAt >= start);
    }
    if (endDate) {
      const end = new Date(endDate);
      filteredPayments = filteredPayments.filter(p => p.createdAt <= end);
    }
    if (status) {
      filteredPayments = filteredPayments.filter(p => p.status === status);
    }

    // 2. Show total amounts, pending payments, completed payments, refunds.
    let totalRevenue = 0;
    let pendingPayments = 0;
    let completedPayments = 0;
    let refundedAmount = 0;

    filteredPayments.forEach(payment => {
      if (payment.status === 'completed') {
        totalRevenue += payment.amount;
        completedPayments += payment.amount;
      } else if (payment.status === 'pending') {
        pendingPayments += payment.amount;
      } else if (payment.status === 'refunded') {
        refundedAmount += payment.amount;
      }
    });

    // 4. Return summary statistics
    res.status(httpStatus.OK).json(successResponse('Payments overview retrieved successfully', {
      summary: {
        totalRevenue: parseFloat(totalRevenue.toFixed(2)),
        pendingPayments: parseFloat(pendingPayments.toFixed(2)),
        completedPayments: parseFloat(completedPayments.toFixed(2)),
        refundedAmount: parseFloat(refundedAmount.toFixed(2)),
      },
      // Optionally, include the filtered list of payments if needed
      // payments: filteredPayments
    }));

  } catch (error) {
    logger.error(`Admin payments overview error: ${error.message}`);
    res.status(httpStatus.INTERNAL_SERVER_ERROR).json(errorResponse('An error occurred while fetching payments overview'));
  }
};

module.exports = {
  login,
  listVerifications,
  listDisputes,
  listDeliveries,
  paymentsOverview,
};