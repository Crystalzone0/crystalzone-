import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import PageLoader from "../ui/PageLoader.jsx";
import { ROUTES } from '../../utils/constants.js';

/** Wrap customer-only pages: <Route element={<ProtectedRoute />}> ... </Route> */
export default function ProtectedRoute() {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) return <PageLoader />;
  if (!user) return <Navigate to={ROUTES.login} replace state={{ from: location }} />;
  return <Outlet />;
}