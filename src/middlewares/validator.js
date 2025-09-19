const Joi = require('joi');
const httpStatus = require('http-status-codes');
const { errorResponse } = require('../utils/apiResponse');

const validate = (schema) => (req, res, next) => {
  const validSchema = Joi.object().keys(schema);
  const obj = {};
  ['params', 'query', 'body'].forEach((key) => {
    if (schema[key]) {
      obj[key] = req[key];
    }
  });

  const { value, error } = validSchema.prefs({ errors: { label: 'key' } }).validate(obj);

  if (error) {
    const errorMessage = error.details.map((details) => details.message).join(', ');
    return res.status(httpStatus.BAD_REQUEST).json(errorResponse(errorMessage));
  }
  Object.assign(req, value);
  return next();
};

module.exports = validate;
