/**
 * Input Validation Utilities
 * Provides security validation for user inputs
 */

/**
 * Validate password strength
 * @param {string} password - Password to validate
 * @returns {Object} { valid: boolean, error: string }
 */
const validatePassword = (password) => {
  if (!password || typeof password !== 'string') {
    return { valid: false, error: 'Şifre gereklidir' };
  }

  if (password.length < 8) {
    return { valid: false, error: 'Şifre en az 8 karakter olmalıdır' };
  }

  if (password.length > 128) {
    return { valid: false, error: 'Şifre çok uzun (maksimum 128 karakter)' };
  }

  // Check for at least one letter and one number
  const hasLetter = /[a-zA-Z]/.test(password);
  const hasNumber = /[0-9]/.test(password);

  if (!hasLetter || !hasNumber) {
    return { valid: false, error: 'Şifre en az bir harf ve bir rakam içermelidir' };
  }

  return { valid: true };
};

/**
 * Validate email format
 * @param {string} email - Email to validate
 * @returns {Object} { valid: boolean, error: string }
 */
const validateEmail = (email) => {
  if (!email || typeof email !== 'string') {
    return { valid: false, error: 'Email gereklidir' };
  }

  // RFC 5322 compliant email regex (simplified)
  const emailRegex = /^[a-zA-Z0-9.!#$%&'*+\/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;

  if (!emailRegex.test(email)) {
    return { valid: false, error: 'Geçersiz email formatı' };
  }

  if (email.length > 254) {
    return { valid: false, error: 'Email adresi çok uzun' };
  }

  // KBU email kontrolü
  if (!email.endsWith('@ogrenci.karabuk.edu.tr')) {
    return { valid: false, error: 'Sadece @ogrenci.karabuk.edu.tr uzantılı emailler kabul edilir' };
  }

  return { valid: true };
};

/**
 * Validate username
 * @param {string} username - Username to validate
 * @returns {Object} { valid: boolean, error: string }
 */
const validateUsername = (username) => {
  if (!username || typeof username !== 'string') {
    return { valid: false, error: 'Kullanıcı adı gereklidir' };
  }

  if (username.length < 3) {
    return { valid: false, error: 'Kullanıcı adı en az 3 karakter olmalıdır' };
  }

  if (username.length > 30) {
    return { valid: false, error: 'Kullanıcı adı en fazla 30 karakter olabilir' };
  }

  // Only allow English letters, numbers, underscore, and dot
  const usernameRegex = /^[a-zA-Z0-9._]+$/;
  if (!usernameRegex.test(username)) {
    return { valid: false, error: 'Kullanıcı adı sadece İngilizce harf, rakam, nokta ve alt çizgi içerebilir' };
  }

  // Check for Turkish characters or other non-English characters
  const hasTurkishChars = /[ğüşıöçĞÜŞİÖÇ]/.test(username);
  if (hasTurkishChars) {
    return { valid: false, error: 'Kullanıcı adında Türkçe karakter kullanılamaz. Lütfen sadece İngilizce karakterler kullanın' };
  }

  return { valid: true };
};

/**
 * Sanitize string input (prevent XSS)
 * @param {string} input - Input to sanitize
 * @returns {string} Sanitized string
 */
const sanitizeString = (input) => {
  if (typeof input !== 'string') return input;

  // Replace HTML special characters
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
};

module.exports = {
  validatePassword,
  validateEmail,
  validateUsername,
  sanitizeString
};
