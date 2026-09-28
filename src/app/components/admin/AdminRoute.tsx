import { Outlet } from 'react-router';
import { useAdminAuth } from '../../contexts/AdminAuthContext';
import { AdminLogin } from '../../pages/admin/AdminLogin';

export function AdminRoute() {
  const { isAuthenticated } = useAdminAuth();

  if (!isAuthenticated) {
    // Keep URL as /admin and show login page directly until authenticated
    return <AdminLogin />;
  }

  return <Outlet />;
}
