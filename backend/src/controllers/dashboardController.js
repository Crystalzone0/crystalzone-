import asyncHandler from '../utils/asyncHandler.js';
import { getDashboardStats } from '../services/dashboardService.js';

/** GET /api/admin/dashboard */
export const getDashboard = asyncHandler(async (_req, res) => {
  res.json({ success: true, ...(await getDashboardStats()) });
});