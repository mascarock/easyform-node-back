const { HttpError } = require('../lib/errors');

function errorHandler(err, req, res, next) { // eslint-disable-line no-unused-vars
  if (res.headersSent) {
    return next(err);
  }

  if (err instanceof HttpError) {
    const response = {
      success: false,
      message: err.message,
    };

    if (err.details) {
      response.errors = Array.isArray(err.details) ? err.details : [err.details];
    }

    return res.status(err.status).json(response);
  }

  if (err && err.name === 'ValidationError') {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: Object.values(err.errors).map((validationError) => validationError.message),
    });
  }

  console.error('Unexpected error:', err);

  return res.status(500).json({
    success: false,
    message: 'Internal server error',
  });
}

module.exports = errorHandler;
