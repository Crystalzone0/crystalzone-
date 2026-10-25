/**
 * Operational error with an HTTP status code.
 * Thrown from controllers/services; the global error handler turns it into JSON.
 */
export default class AppError extends Error {
  constructor(message, statusCode = 500, errors = undefined) {
    super(message);
    this.name = 'AppError';
    this.statusCode = statusCode;
    this.errors = errors;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}