import DOMPurify from 'isomorphic-dompurify';

/**
 * Sanitize user-generated content to prevent XSS attacks
 * @param {string} dirty - Unsanitized content
 * @returns {string} - Sanitized content
 */
export function sanitizeContent(dirty) {
  if (!dirty) return '';
  return DOMPurify.sanitize(dirty, {
    ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'a', 'p', 'br'],
    ALLOWED_ATTR: ['href', 'target', 'rel']
  });
}

/**
 * Sanitize username to prevent injection attacks
 * @param {string} username - Username to sanitize
 * @returns {string} - Sanitized username
 */
export function sanitizeUsername(username) {
  if (!username) return '';
  // Only allow alphanumeric, underscore, and hyphen
  return username.replace(/[^a-zA-Z0-9_-]/g, '');
}

/**
 * Validate MongoDB ObjectId format
 * @param {string} id - ID to validate
 * @returns {boolean} - True if valid ObjectId
 */
export function isValidObjectId(id) {
  if (!id) return false;
  // MongoDB ObjectId is 24 hex characters
  return /^[a-f\d]{24}$/i.test(id);
}

/**
 * Validate username format
 * @param {string} username - Username to validate
 * @returns {boolean} - True if valid username
 */
export function isValidUsername(username) {
  if (!username) return false;
  // Username: 3-20 chars, alphanumeric, underscore, hyphen
  return /^[a-zA-Z0-9_-]{3,20}$/.test(username);
}

/**
 * Safe navigation wrapper - prevents open redirect attacks
 * @param {Function} navigate - React Router navigate function
 * @param {string} url - URL to navigate to
 */
export function safeNavigate(navigate, url) {
  if (!url) {
    navigate('/');
    return;
  }

  try {
    // Check if URL is same-origin
    const urlObj = new URL(url, window.location.origin);

    if (urlObj.origin !== window.location.origin) {
      console.warn('[Security] Blocked external redirect:', url);
      navigate('/');
      return;
    }

    // Navigate to pathname only (no query params that could contain malicious data)
    navigate(urlObj.pathname);
  } catch (e) {
    // Invalid URL, navigate to home safely
    console.warn('[Security] Invalid URL blocked:', url);
    navigate('/');
  }
}

/**
 * Sanitize object containing user data
 * @param {Object} obj - Object with user-generated content
 * @param {Array<string>} fields - Fields to sanitize
 * @returns {Object} - Sanitized object
 */
export function sanitizeObject(obj, fields = ['content', 'bio', 'message']) {
  if (!obj) return obj;

  const sanitized = { ...obj };

  fields.forEach(field => {
    if (sanitized[field]) {
      sanitized[field] = sanitizeContent(sanitized[field]);
    }
  });

  return sanitized;
}

/**
 * Sanitize array of objects
 * @param {Array<Object>} arr - Array of objects
 * @param {Array<string>} fields - Fields to sanitize in each object
 * @returns {Array<Object>} - Sanitized array
 */
export function sanitizeArray(arr, fields = ['content', 'bio', 'message']) {
  if (!Array.isArray(arr)) return arr;
  return arr.map(item => sanitizeObject(item, fields));
}

/**
 * Remove sensitive data from error messages
 * @param {Error} error - Error object
 * @returns {string} - Generic error message
 */
export function sanitizeError(error) {
  // Never expose actual error details to users
  if (error.message?.includes('fetch') || error.message?.includes('network')) {
    return 'Bağlantı hatası oluştu. Lütfen tekrar deneyin.';
  }

  if (error.status === 404) {
    return 'İçerik bulunamadı.';
  }

  if (error.status === 401) {
    return 'Oturum süreniz dolmuş. Lütfen tekrar giriş yapın.';
  }

  if (error.status === 403) {
    return 'Bu içeriğe erişim yetkiniz yok.';
  }

  return 'Bir hata oluştu. Lütfen tekrar deneyin.';
}
