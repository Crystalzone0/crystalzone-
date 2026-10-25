import AppError from '../utils/AppError.js';

// Strict 24-hex check. (mongoose.isValidObjectId also accepts any 12-character string.)
const OBJECT_ID = /^[0-9a-fA-F]{24}$/;

export const isObjectId = (value) => OBJECT_ID.test(String(value ?? ''));

/** Rejects requests whose :param is not a valid MongoDB id (HTTP 400). */
export const validateObjectId =
  (param = 'id') =>
  (req, _res, next) => {
    if (!isObjectId(req.params[param])) return next(new AppError('Invalid ID', 400));
    return next();
  };