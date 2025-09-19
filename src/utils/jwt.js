const jwt = require('jsonwebtoken');
const config = require('../config');
const moment = require('moment');

/**
 * Generates a JWT token for a given user ID and role.
 * @param {string} userId - The user ID to include in the token.
 * @param {string} role - The user role to include in the token.
 * @returns {string} The generated JWT token.
 */
const generateToken = (userId, role) => {
  const payload = { sub: userId, role, iat: moment().unix() };
  const token = jwt.sign(payload, config.jwt.secret, { expiresIn: `${config.jwt.accessExpirationMinutes}m` });
  return token;
};

/**
 * Calculates the expiration date of an access token.
 * @returns {Date} The expiration date of the access token.
 */
const getAccessTokenExpires = () => {
  return moment().add(config.jwt.accessExpirationMinutes, 'minutes').toDate();
};

/**
 * Verifies a JWT token.
 * @param {string} token - The token to verify.
 * @returns {object | null} The decoded token payload if valid, otherwise null.
 */
const verifyToken = (token) => {
  try {
    return jwt.verify(token, config.jwt.secret);
  } catch (error) {
    // TODO: Log the error for debugging purposes
    // console.error('JWT Verification Error:', error.message);
    return null;
  }
};

module.exports = {
  generateToken,
  verifyToken,
  getAccessTokenExpires,
};