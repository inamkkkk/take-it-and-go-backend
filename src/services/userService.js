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
  const user = await this.findOne({ email, _id: { $ne: excludeUserId } });
  return !!user;
};

// Add a static method to the User model for checking if phone is taken
User.isPhoneTaken = async function (phone, excludeUserId) {
  const user = await this.findOne({ phone, _id: { $ne: excludeUserId } });
  return !!user;
};

// TODO: Add functions for updating user profiles, managing roles (by admin), etc.

module.exports = {
  createUser,
  getUserById,
  getUserByEmail,
};
