/**
 * Maintenance Mode Middleware
 * Returns 503 Service Unavailable when maintenance mode is enabled
 * Allows admin users to bypass maintenance mode
 */
const maintenanceMode = (req, res, next) => {
  // Check if maintenance mode is enabled
  const isMaintenanceMode = process.env.MAINTENANCE_MODE === 'true';

  if (!isMaintenanceMode) {
    return next();
  }

  // Allow certain endpoints even in maintenance mode
  const allowedPaths = [
    '/api/profile', // Allow profile check for admin detection
    '/api/auth/login', // Allow login
    '/api/auth/register', // Allow registration (if needed)
  ];

  if (allowedPaths.some(path => req.path.startsWith(path))) {
    return next();
  }

  // Check if user is admin (from auth token)
  if (req.userId && req.userRole === 'admin') {
    return next();
  }

  // Return maintenance mode response
  return res.status(503).json({
    error: 'Site bakım modunda',
    message: 'Sistemlerimizi güncelliyoruz. Kısa sürede tekrar hizmetinizdeyiz.',
    maintenance: true
  });
};

module.exports = maintenanceMode;
