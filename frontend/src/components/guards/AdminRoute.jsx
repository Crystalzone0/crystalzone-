import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import PageLoader from '../ui/PageLoader.jsx';
import { ROUTES } from '../../utils/constants.js';

/**
 * Wrap admin pages. This only decides what the browser shows: every admin API call is
 * checked again on the server, so a customer can never read or change admin data.
 */
export default function AdminRoute() {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) return <PageLoader fullScreen />;
  if (!user) return <Navigate to={ROUTES.admin.login} replace state={{ from: location }} />;
  if (user.role !== 'admin') return <Navigate to={ROUTES.unauthorized} replace />;
  return <Outlet />;
}