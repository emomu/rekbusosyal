import { useEffect } from 'react';
import { useNavigate, useLocation, Outlet } from 'react-router-dom';
import { useSelector } from 'react-redux';

/**
 * MaintenanceWrapper - Global maintenance mode checker
 * Wraps all routes and redirects to maintenance page if enabled
 * Only admins can bypass
 */
export default function MaintenanceWrapper() {
  const navigate = useNavigate();
  const location = useLocation();
  const { userRole } = useSelector((state) => state.auth);

  useEffect(() => {
    // Check if maintenance mode is enabled via environment variable
    const isMaintenanceMode = import.meta.env.VITE_MAINTENANCE_MODE === 'true';

    // Allow admins to bypass maintenance mode
    const isAdmin = userRole === 'admin';

    // Don't redirect if already on maintenance page
    const isOnMaintenancePage = location.pathname === '/bakim';

    if (isMaintenanceMode && !isAdmin && !isOnMaintenancePage) {
      // Redirect to maintenance page
      navigate('/bakim', { replace: true });
    } else if (!isMaintenanceMode && isOnMaintenancePage) {
      // If maintenance mode is off but user is on maintenance page, redirect to home
      navigate('/', { replace: true });
    }
  }, [navigate, location.pathname, userRole]);

  return <Outlet />;
}
