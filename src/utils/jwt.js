const jwt = require('jsonwebtoken');
const config = require('../config');
const moment = require('moment');

const generateToken = (userId, role) => {
  const payload = { sub: userId, role, iat: moment().unix() };
  const token = jwt.sign(payload, config.jwt.secret, { expiresIn: `${config.jwt.accessExpirationMinutes}m` });
  return token;
};

const getAccessTokenExpires = () => {
  return moment().add(config.jwt.accessExpirationMinutes, 'minutes').toDate();
};

const verifyToken = (token) => {
  return jwt.verify(token, config.jwt.secret);
};

module.exports = {
  generateToken,
  verifyToken,
  getAccessTokenExpires,
};
