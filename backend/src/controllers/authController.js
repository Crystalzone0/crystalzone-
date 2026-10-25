import bcrypt from 'bcryptjs';
import User from '../models/User.js';
import AppError from '../utils/AppError.js';
import asyncHandler from '../utils/asyncHandler.js';
import { attachSession, clearSession } from '../services/authService.js';

// Compared against when the email is unknown, so response time doesn't reveal whether an account exists.
const DUMMY_HASH = bcrypt.hashSync('crystal-zone-dummy-password-1', 12);

async function loginUser(req, res, { adminOnly = false } = {}) {
  const { email, password } = req.body;

  const user = await User.findOne({ email }).select('+password');

  let passwordOk = false;
  if (user) {
    passwordOk = await user.comparePassword(password);
  } else {
    await bcrypt.compare(password, DUMMY_HASH);
  }

  // One generic message for: unknown email, wrong password, or (admin login) a non-admin account.
  if (!passwordOk || (adminOnly && user.role !== 'admin')) {
    throw new AppError('Invalid email or password', 401);
  }
  if (!user.isActive) {
    throw new AppError('This account has been disabled. Please contact support.', 403);
  }

  const now = new Date();
  await User.updateOne({ _id: user._id }, { lastLoginAt: now });
  user.lastLoginAt = now;

  attachSession(res, user);
  res.json({ success: true, message: 'Login successful', user });
}

/** POST /api/auth/register: public sign-up. Always creates a "customer". */
export const register = asyncHandler(async (req, res) => {
  const { name, email, phone, password } = req.body;

  if (await User.exists({ email })) {
    throw new AppError('An account with this email already exists', 409);
  }

  const user = await User.create({ name, email, phone, password, role: 'customer' });

  attachSession(res, user);
  res.status(201).json({ success: true, message: 'Account created successfully', user });
});

/** POST /api/auth/login */
export const login = asyncHandler((req, res) => loginUser(req, res));

/** POST /api/auth/admin-login: succeeds only for accounts with role "admin". */
export const adminLogin = asyncHandler((req, res) => loginUser(req, res, { adminOnly: true }));

/** POST /api/auth/logout */
export const logout = asyncHandler(async (_req, res) => {
  clearSession(res);
  res.json({ success: true, message: 'Logged out successfully' });
});

/** GET /api/auth/me: the current user, or null for visitors who are not logged in. */
export const getMe = asyncHandler(async (req, res) => {
  res.json({ success: true, user: req.user || null });
});

/** PUT /api/auth/profile: name and phone. */
export const updateProfile = asyncHandler(async (req, res) => {
  const { name, phone } = req.body;

  req.user.set({ name, phone });
  await req.user.save();

  res.json({ success: true, message: 'Profile updated', user: req.user });
});

/** PUT /api/auth/password: requires the current password, then rotates the session. */
export const changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  const user = await User.findById(req.user._id).select('+password');
  if (!user || !(await user.comparePassword(currentPassword))) {
    throw new AppError('Current password is incorrect', 400);
  }

  user.password = newPassword; // hashed by the pre-save hook; passwordChangedAt is set there too
  await user.save();

  // Older sessions on other devices are now invalid; this device gets a fresh cookie.
  attachSession(res, user);
  res.json({ success: true, message: 'Password changed successfully' });
});