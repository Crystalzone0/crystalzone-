import { ZodError } from 'zod';
import AppError from '../utils/AppError.js';
import { env } from '../config/env.js';

export const notFound = (req, _res, next) => {
  next(new AppError(`Route not found: ${req.method} ${req.originalUrl}`, 404));
};

// eslint-disable-next-line no-unused-vars
export const errorHandler = (err, req, res, _next) => {
  let statusCode = err.statusCode || 500;
  let message = err.message || 'Something went wrong';
  let errors = err.errors;
  let operational = Boolean(err.isOperational);

  if (err instanceof ZodError) {
    statusCode = 400;
    message = 'Validation failed';
    errors = err.issues.map((i) => ({ field: i.path.join('.'), message: i.message }));
    operational = true;
  } else if (err.name === 'ValidationError' && err.errors) {
    statusCode = 400;
    message = 'Validation failed';
    errors = Object.values(err.errors).map((e) => ({ field: e.path, message: e.message }));
    operational = true;
  } else if (err.name === 'CastError') {
    statusCode = 400;
    message = `Invalid value for ${err.path}`;
    operational = true;
  } else if (err.code === 11000) {
    statusCode = 409;
    const field = Object.keys(err.keyPattern || err.keyValue || {})[0] || 'value';
    message = `${field.charAt(0).toUpperCase()}${field.slice(1)} already exists`;
    operational = true;
  } else if (err.name === 'JsonWebTokenError') {
    statusCode = 401;
    message = 'Invalid session. Please log in again.';
    operational = true;
  } else if (err.name === 'TokenExpiredError') {
    statusCode = 401;
    message = 'Your session has expired. Please log in again.';
    operational = true;
  } else if (err.name === 'MulterError') {
    statusCode = 400;
    message = err.code === 'LIMIT_FILE_SIZE' ? 'Image is too large (maximum 5 MB).' : err.message;
    operational = true;
  } else if (err.type === 'entity.parse.failed') {
    statusCode = 400;
    message = 'Invalid JSON in request body';
    operational = true;
  } else if (err.type === 'entity.too.large') {
    statusCode = 413;
    message = 'Request body is too large';
    operational = true;
  }

  if (statusCode >= 500) {
    console.error(`[${req.method}] ${req.originalUrl}`, err);
    if (env.isProd && !operational) {
      message = 'Something went wrong on our side. Please try again.';
    }
  }

  res.status(statusCode).json({
    success: false,
    message,
    ...(errors ? { errors } : {}),
    ...(!env.isProd && statusCode >= 500 ? { stack: err.stack } : {}),
  });
};