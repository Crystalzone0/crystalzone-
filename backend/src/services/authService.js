import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';

export const COOKIE_NAME = 'cz_token';

const secureCookie = env.APP_URL.startsWith('https://');

const cookieOptions = {
  httpOnly: true, // not readable from JavaScript (XSS cannot steal the session)
  sameSite: 'lax', // cross-site POST/PUT/DELETE requests do not carry the cookie (CSRF defence)
  secure: secureCookie,
  path: '/',
};

export function signToken(userId) {
  return jwt.sign({ id: String(userId) }, env.JWT_SECRET, {
    algorithm: 'HS256',
    expiresIn: env.JWT_EXPIRES_IN,
  });
}

export function verifyToken(token) {
  return jwt.verify(token, env.JWT_SECRET, { algorithms: ['HS256'] });
}

/** Creates a fresh session cookie for the user. */
export function attachSession(res, user) {
  res.cookie(COOKIE_NAME, signToken(user._id), {
    ...cookieOptions,
    maxAge: env.COOKIE_EXPIRES_DAYS * 24 * 60 * 60 * 1000,
  });
}

export function clearSession(res) {
  res.clearCookie(COOKIE_NAME, cookieOptions);
}