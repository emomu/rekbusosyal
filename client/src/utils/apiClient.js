import { API_URL } from '../config/api';

/**
 * API Client with automatic JWT expiration handling
 * Automatically logs out user if token is expired (401/403)
 */

/**
 * Custom fetch wrapper with JWT error handling
 * @param {string} url - API endpoint URL
 * @param {object} options - Fetch options
 * @returns {Promise<Response>}
 */
export const apiFetch = async (url, options = {}) => {
  try {
    const response = await fetch(url, options);

    // Check for authentication errors
    if (response.status === 401 || response.status === 403) {
      const data = await response.json().catch(() => ({}));

      // Check if it's a token expiration error
      const isTokenError =
        data.error?.includes('token') ||
        data.error?.includes('Token') ||
        data.error?.includes('authentication') ||
        data.error?.includes('Oturum') ||
        response.status === 401;

      if (isTokenError) {
        console.warn('🚫 JWT token geçersiz veya süresi dolmuş. Otomatik çıkış yapılıyor...');
        handleLogout();
        throw new Error('Token geçersiz. Lütfen tekrar giriş yapın.');
      }
    }

    return response;
  } catch (error) {
    // Network errors or other fetch errors
    if (error.message === 'Token geçersiz. Lütfen tekrar giriş yapın.') {
      throw error;
    }
    throw error;
  }
};

/**
 * Helper function to create authenticated fetch requests
 * @param {string} endpoint - API endpoint (e.g., '/api/posts')
 * @param {object} options - Fetch options
 * @returns {Promise<Response>}
 */
export const authenticatedFetch = async (endpoint, options = {}) => {
  const token = localStorage.getItem('token');

  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const url = endpoint.startsWith('http') ? endpoint : `${API_URL}${endpoint}`;

  return apiFetch(url, {
    ...options,
    headers,
  });
};

/**
 * Logout handler - clears token and redirects to login
 */
export const handleLogout = () => {
  // Clear all auth-related data from localStorage
  localStorage.removeItem('token');
  localStorage.removeItem('username');
  localStorage.removeItem('profilePicture');
  localStorage.removeItem('interests');
  localStorage.removeItem('role');

  // Clear sessionStorage if any
  sessionStorage.clear();

  // Redirect to login page
  window.location.href = '/login';
};

/**
 * Check if user is authenticated
 * @returns {boolean}
 */
export const isAuthenticated = () => {
  return !!localStorage.getItem('token');
};

/**
 * Get current user token
 * @returns {string|null}
 */
export const getToken = () => {
  return localStorage.getItem('token');
};

/**
 * Convenience methods for common HTTP methods
 */
export const api = {
  get: (endpoint, options = {}) => {
    return authenticatedFetch(endpoint, {
      ...options,
      method: 'GET',
    });
  },

  post: (endpoint, data, options = {}) => {
    return authenticatedFetch(endpoint, {
      ...options,
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  put: (endpoint, data, options = {}) => {
    return authenticatedFetch(endpoint, {
      ...options,
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  delete: (endpoint, options = {}) => {
    return authenticatedFetch(endpoint, {
      ...options,
      method: 'DELETE',
    });
  },

  // For multipart/form-data uploads (don't set Content-Type, browser will set it)
  upload: (endpoint, formData, options = {}) => {
    const token = localStorage.getItem('token');
    const headers = {
      ...options.headers,
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const url = endpoint.startsWith('http') ? endpoint : `${API_URL}${endpoint}`;

    return apiFetch(url, {
      ...options,
      method: 'POST',
      headers,
      body: formData,
    });
  },
};

export default api;
