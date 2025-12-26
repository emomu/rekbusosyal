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

  // SECURITY: Check for Unicode escape sequences (e.g., \u0041 for 'A')
  if (username.includes('\\u') || username.includes('\\x') || username.includes('%')) {
    return { valid: false, error: 'Kullanıcı adında escape karakterleri kullanılamaz' };
  }

  // SECURITY: Check for null bytes (potential injection)
  if (username.includes('\0') || username.includes('\x00')) {
    return { valid: false, error: 'Geçersiz karakter tespit edildi' };
  }

  // SECURITY: Normalize Unicode to prevent lookalike character attacks
  const normalized = username.normalize('NFKC');
  if (normalized !== username) {
    return { valid: false, error: 'Kullanıcı adında normalize edilemeyen karakterler var' };
  }

  if (username.length < 3) {
    return { valid: false, error: 'Kullanıcı adı en az 3 karakter olmalıdır' };
  }

  if (username.length > 30) {
    return { valid: false, error: 'Kullanıcı adı en fazla 30 karakter olabilir' };
  }

  // SECURITY: Strict whitelist - only ASCII alphanumeric, underscore, and dot
  // This prevents homograph attacks and special unicode characters
  const usernameRegex = /^[a-zA-Z0-9._]+$/;
  if (!usernameRegex.test(username)) {
    return { valid: false, error: 'Kullanıcı adı sadece İngilizce harf, rakam, nokta ve alt çizgi içerebilir' };
  }

  // SECURITY: Check for Turkish characters or other non-ASCII characters
  const hasTurkishChars = /[ğüşıöçĞÜŞİÖÇ]/.test(username);
  if (hasTurkishChars) {
    return { valid: false, error: 'Kullanıcı adında Türkçe karakter kullanılamaz. Lütfen sadece İngilizce karakterler kullanın' };
  }

  // SECURITY: Check for control characters (0x00-0x1F, 0x7F-0x9F)
  // eslint-disable-next-line no-control-regex
  if (/[\x00-\x1F\x7F-\x9F]/.test(username)) {
    return { valid: false, error: 'Geçersiz kontrol karakterleri tespit edildi' };
  }

  // SECURITY: Prevent homograph attacks (lookalike characters)
  // Check if username contains only ASCII range (U+0000 to U+007F)
  for (let i = 0; i < username.length; i++) {
    const charCode = username.charCodeAt(i);
    if (charCode > 127) {
      return { valid: false, error: 'Sadece ASCII karakterler kullanılabilir' };
    }
  }

  // SECURITY: Block reserved usernames
  const reservedUsernames = [
    'admin', 'root', 'moderator', 'system', 'official',
    'api', 'www', 'mail', 'support', 'help', 'kbusosyal',
    'null', 'undefined', 'true', 'false'
  ];

  if (reservedUsernames.includes(username.toLowerCase())) {
    return { valid: false, error: 'Bu kullanıcı adı rezerve edilmiştir' };
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
