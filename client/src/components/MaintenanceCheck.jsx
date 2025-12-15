import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';

/**
 * MaintenanceCheck - Checks if the site is in maintenance mode
 * Redirects to maintenance page unless user is admin
 * NOTE: This must be used INSIDE RouterProvider
 */
export default function MaintenanceCheck({ children }) {
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
      navigate('/bakim', { replace: true });
    } else if (!isMaintenanceMode && isOnMaintenancePage) {
      // If maintenance mode is off but user is on maintenance page, redirect to home
      navigate('/', { replace: true });
    }
  }, [navigate, location.pathname, userRole]);

  return children;
}
