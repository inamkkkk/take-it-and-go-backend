const Joi = require('joi');
const httpStatus = require('http-status-codes');
const { errorResponse } = require('../utils/apiResponse');

// TODO: Refactor the validation logic to handle different HTTP methods and their corresponding schemas more dynamically.
// Consider using a validation approach that maps request methods (GET, POST, PUT, DELETE) to specific Joi schemas.
const validate = (schemas) => (req, res, next) => {
  const method = req.method.toLowerCase();
  const schema = schemas[method];

  if (!schema) {
    // If no schema is defined for the method, proceed without validation.
    // TODO: Consider adding a warning or error if a schema is expected but not found.
    return next();
  }

  // TODO: Ensure that only relevant parts of the request (params, query, body) are validated based on the schema definition.
  // The current implementation merges all available parts if a schema for them exists.
  // We should be more selective and only validate what's defined in the schema.

  const validationTarget = {};
  if (schema.params) {
    validationTarget.params = req.params;
  }
  if (schema.query) {
    validationTarget.query = req.query;
  }
  if (schema.body) {
    validationTarget.body = req.body;
  }

  // TODO: Use Joi.alternatives() or Joi.object().concat() if schemas need to be combined.
  // For now, we'll validate each part separately if it exists in the schema definition.

  let validationErrors = [];
  let validatedValues = {};

  if (schema.params && validationTarget.params) {
    const { error, value } = Joi.object(schema.params).prefs({ errors: { label: 'key' } }).validate(validationTarget.params);
    if (error) {
      validationErrors = validationErrors.concat(error.details.map(detail => detail.message));
    } else {
      validatedValues = { ...validatedValues, ...value };
    }
  }

  if (schema.query && validationTarget.query) {
    const { error, value } = Joi.object(schema.query).prefs({ errors: { label: 'key' } }).validate(validationTarget.query);
    if (error) {
      validationErrors = validationErrors.concat(error.details.map(detail => detail.message));
    } else {
      validatedValues = { ...validatedValues, ...value };
    }
  }

  if (schema.body && validationTarget.body) {
    const { error, value } = Joi.object(schema.body).prefs({ errors: { label: 'key' } }).validate(validationTarget.body);
    if (error) {
      validationErrors = validationErrors.concat(error.details.map(detail => detail.message));
    } else {
      validatedValues = { ...validatedValues, ...value };
    }
  }


  if (validationErrors.length > 0) {
    const errorMessage = validationErrors.join(', ');
    return res.status(httpStatus.BAD_REQUEST).json(errorResponse(errorMessage));
  }

  // TODO: Assign validated values back to the request object.
  // Consider carefully where these values should be assigned to avoid conflicts and maintain clarity.
  // For now, we'll merge them directly, which might overwrite existing properties.
  // A more sophisticated approach might involve creating specific properties like req.validatedParams, req.validatedQuery, etc.
  Object.assign(req, validatedValues);
  return next();
};

module.exports = validate;