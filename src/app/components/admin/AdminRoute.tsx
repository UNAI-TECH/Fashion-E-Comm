import { Navigate, Outlet } from 'react-router';
import { useAdminAuth } from '../../contexts/AdminAuthContext';

export function AdminRoute() {
  const { isAuthenticated } = useAdminAuth();

  let hasLocalAdmin = false;
  try {
    const saved = localStorage.getItem('admin_info');
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed && (parsed.role === 'admin' || parsed.email)) {
        hasLocalAdmin = true;
      }
    }
  } catch (e) {}

  if (!isAuthenticated && !hasLocalAdmin) {
    return <Navigate to="/admin/login" replace />;
  }

  return <Outlet />;
}
