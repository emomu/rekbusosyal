// API Base URL Configuration
// Development: http://localhost:5001
// Production: Same domain as frontend (Railway serves both from same URL)

export const API_URL = import.meta.env.VITE_API_URL || (typeof window !== 'undefined' ? window.location.origin : '');

// Debug log (production'da da görmek için)
if (typeof window !== 'undefined') {
  console.log('🔗 API_URL:', API_URL);
  console.log('🌍 ENV VITE_API_URL:', import.meta.env.VITE_API_URL);
  console.log('📍 window.location.origin:', window.location.origin);
}

// Helper function to create API endpoints
export const createApiUrl = (path) => {
  // Remove leading slash if exists to avoid double slashes
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  return `${API_URL}${cleanPath}`;
};
