import { Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';

/**
 * ProtectedRoute component - Wrapper for routes requiring authentication/authorization
 * @param {Object} props
 * @param {React.ReactNode} props.children - Child components to render if authorized
 * @param {string|string[]} props.requiredRole - Required user role(s) ('admin', 'moderator', ['admin', 'moderator'])
 * @returns {React.ReactNode}
 */
export default function ProtectedRoute({ children, requiredRole }) {
  const { isAuthenticated, userRole } = useSelector((state) => state.auth);

  // Check authentication
  if (!isAuthenticated) {
    // Redirect to login page
    return <Navigate to="/giris" replace />;
  }

  // Check authorization (role-based access control)
  if (requiredRole) {
    // Admin always has access to everything
    const isAdmin = userRole === 'admin';

    if (!isAdmin) {
      // Check if user has one of the required roles
      const allowedRoles = Array.isArray(requiredRole) ? requiredRole : [requiredRole];
      const hasRequiredRole = allowedRoles.includes(userRole);

      if (!hasRequiredRole) {
        // User doesn't have required role - redirect to unauthorized page
        return <Navigate to="/yetkisiz" replace />;
      }
    }
  }

  // User is authenticated and authorized
  return children;
}
