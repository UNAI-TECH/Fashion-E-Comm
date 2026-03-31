import { Navigate, Outlet } from 'react-router';
import { useAdminAuth } from '../../contexts/AdminAuthContext';

export function AdminRoute() {
  const { isAuthenticated } = useAdminAuth();

  if (!isAuthenticated) {
    return <Navigate to="/admin/login" replace />;
  }

  return <Outlet />;
}
