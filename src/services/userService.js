const httpStatus = require('http-status-codes');
const { User } = require('../models');
const ApiError = require('../utils/ApiError');
const logger = require('../utils/logger');

const createUser = async (userBody) => {
  if (await User.isEmailTaken(userBody.email)) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Email already taken');
  }
  if (await User.isPhoneTaken(userBody.phone)) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Phone number already taken');
  }
  const user = await User.create(userBody);
  return user;
};

const getUserById = async (id) => {
  return User.findById(id);
};

const getUserByEmail = async (email) => {
  return User.findOne({ email });
};

// Add a static method to the User model for checking if email is taken (or implement directly here)
User.isEmailTaken = async function (email, excludeUserId) {
  const query = { email };
  if (excludeUserId) {
    query._id = { $ne: excludeUserId };
  }
  const user = await this.findOne(query);
  return !!user;
};

// Add a static method to the User model for checking if phone is taken
User.isPhoneTaken = async function (phone, excludeUserId) {
  const query = { phone };
  if (excludeUserId) {
    query._id = { $ne: excludeUserId };
  }
  const user = await this.findOne(query);
  return !!user;
};

/**
 * Update user profile
 * @param {ObjectId} userId
 * @param {Object} updateBody
 * @returns {Promise<User>}
 */
const updateUserProfile = async (userId, updateBody) => {
  const user = await getUserById(userId);
  if (!user) {
    throw new ApiError(httpStatus.NOT_FOUND, 'User not found');
  }
  if (updateBody.email && (await User.isEmailTaken(updateBody.email, userId))) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Email already taken');
  }
  if (updateBody.phone && (await User.isPhoneTaken(updateBody.phone, userId))) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Phone number already taken');
  }

  Object.assign(user, updateBody);
  await user.save();
  return user;
};

/**
 * Get all users
 * @param {Object} filter - Filter criteria for users
 * @param {Object} options - Pagination and sorting options
 * @returns {Promise<User[]>}
 */
const getAllUsers = async (filter, options) => {
  const users = await User.paginate(filter, options);
  return users;
};

/**
 * Assign role to a user (admin function)
 * @param {ObjectId} userId
 * @param {string} role - The role to assign
 * @returns {Promise<User>}
 */
const assignUserRole = async (userId, role) => {
  const user = await getUserById(userId);
  if (!user) {
    throw new ApiError(httpStatus.NOT_FOUND, 'User not found');
  }
  // TODO: Add validation for allowed roles if necessary
  user.role = role;
  await user.save();
  return user;
};


// TODO: Add functions for updating user profiles, managing roles (by admin), etc.

module.exports = {
  createUser,
  getUserById,
  getUserByEmail,
  updateUserProfile,
  getAllUsers,
  assignUserRole,
};