class HttpError extends Error {
  constructor(status, message, details) {
    super(message);
    this.status = status;
    this.details = details;
  }
}

class BadRequestError extends HttpError {
  constructor(message, details) {
    super(400, message, details);
  }
}

class NotFoundError extends HttpError {
  constructor(message = 'Resource not found', details) {
    super(404, message, details);
  }
}

class TooManyRequestsError extends HttpError {
  constructor(message = 'Too many requests', details) {
    super(429, message, details);
  }
}

module.exports = {
  HttpError,
  BadRequestError,
  NotFoundError,
  TooManyRequestsError,
};
