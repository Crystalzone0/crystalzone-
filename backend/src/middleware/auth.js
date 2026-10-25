import User from '../models/User.js';
import AppError from '../utils/AppError.js';
import asyncHandler from '../utils/asyncHandler.js';
import { COOKIE_NAME, verifyToken } from '../services/authService.js';

function getToken(req) {
  const cookieToken = req.cookies?.[COOKIE_NAME];
  if (cookieToken) return cookieToken;

  // Bearer header is accepted too, handy for API testing tools.
  const header = req.headers.authorization;
  if (header && header.startsWith('Bearer ')) return header.slice(7).trim();
  return null;
}

/** Returns { user } when the request carries a valid session, otherwise { reason }. */
async function authenticate(req) {
  const token = getToken(req);
  if (!token) return { reason: 'missing' };

  let decoded;
  try {
    decoded = verifyToken(token);
  } catch {
    return { reason: 'invalid' };
  }

  const user = await User.findById(decoded.id);
  if (!user) return { reason: 'invalid' };
  if (!user.isActive) return { reason: 'disabled' };
  if (user.changedPasswordAfter(decoded.iat)) return { reason: 'invalid' };

  return { user };
}

/** Requires a logged-in, active user. Sets req.user. */
export const protect = asyncHandler(async (req, _res, next) => {
  const { user, reason } = await authenticate(req);

  if (user) {
    req.user = user;
    return next();
  }
  if (reason === 'disabled') {
    throw new AppError('This account has been disabled. Please contact support.', 403);
  }
  if (reason === 'invalid') {
    throw new AppError('Your session is invalid or has expired. Please log in again.', 401);
  }
  throw new AppError('Please log in to continue.', 401);
});

/** Sets req.user when a valid session exists, but never blocks the request. */
export const optionalAuth = asyncHandler(async (req, _res, next) => {
  const { user } = await authenticate(req);
  if (user) req.user = user;
  next();
});

/** Use AFTER protect: restrictTo('admin'). */
export const restrictTo = (...roles) => (req, _res, next) => {
  if (!req.user || !roles.includes(req.user.role)) {
    return next(new AppError('You do not have permission to perform this action.', 403));
  }
  return next();
};

/** Shortcut for every admin route: logged in AND role === 'admin', enforced on the server. */
export const adminOnly = [protect, restrictTo('admin')];