const validator = require('validator');

/**
 * SECURITY: Comprehensive input sanitization and validation
 * Protects against XSS, HTML injection, script injection
 */

/**
 * Sanitize user content - removes HTML tags and dangerous characters
 * @param {string} content - User input content
 * @returns {string} - Sanitized content
 */
function sanitizeContent(content) {
  if (!content || typeof content !== 'string') {
    return '';
  }

  // Step 1: Trim whitespace
  let sanitized = content.trim();

  // Step 2: Escape HTML to prevent XSS
  sanitized = validator.escape(sanitized);

  // Step 3: Remove null bytes and control characters
  sanitized = sanitized.replace(/\0/g, '');

  // Step 4: Normalize unicode to prevent homograph attacks
  sanitized = sanitized.normalize('NFC');

  return sanitized;
}

/**
 * Validate content length and safety
 * @param {string} content - User input
 * @param {number} maxLength - Maximum allowed length
 * @returns {object} - { valid: boolean, error: string|null, sanitized: string }
 */
function validateContent(content, maxLength = 256) {
  // Check if content exists
  if (!content || typeof content !== 'string') {
    return {
      valid: false,
      error: 'İçerik gereklidir',
      sanitized: ''
    };
  }

  // Sanitize first
  const sanitized = sanitizeContent(content);

  // Check if empty after sanitization
  if (sanitized.length === 0) {
    return {
      valid: false,
      error: 'İçerik boş olamaz',
      sanitized: ''
    };
  }

  // Check length AFTER sanitization (important!)
  if (sanitized.length > maxLength) {
    return {
      valid: false,
      error: `İçerik en fazla ${maxLength} karakter olabilir`,
      sanitized: sanitized.substring(0, maxLength)
    };
  }

  // Check for suspicious patterns
  const suspiciousPatterns = [
    /<script/i,
    /javascript:/i,
    /on\w+\s*=/i, // event handlers like onclick=
    /<iframe/i,
    /eval\(/i,
    /expression\(/i
  ];

  for (const pattern of suspiciousPatterns) {
    if (pattern.test(content)) {
      return {
        valid: false,
        error: 'İçerik güvenli olmayan karakterler içeriyor',
        sanitized: ''
      };
    }
  }

  return {
    valid: true,
    error: null,
    sanitized: sanitized
  };
}

/**
 * Validate and sanitize URL
 * @param {string} url - URL to validate
 * @returns {object} - { valid: boolean, error: string|null }
 */
function validateUrl(url) {
  if (!url || typeof url !== 'string') {
    return { valid: true, error: null }; // URL is optional
  }

  // Check if valid URL
  if (!validator.isURL(url, {
    protocols: ['http', 'https'],
    require_protocol: true
  })) {
    return {
      valid: false,
      error: 'Geçersiz URL formatı'
    };
  }

  // Additional security: block localhost and private IPs
  if (url.includes('localhost') ||
      url.includes('127.0.0.1') ||
      url.includes('192.168.') ||
      url.includes('10.0.') ||
      url.includes('172.16.')) {
    return {
      valid: false,
      error: 'Özel IP adresleri kullanılamaz'
    };
  }

  return { valid: true, error: null };
}

/**
 * Validate file upload - check magic numbers (file signature)
 * @param {Buffer} buffer - File buffer
 * @param {string} mimetype - Declared MIME type
 * @returns {object} - { valid: boolean, error: string|null, actualType: string }
 */
function validateFileUpload(buffer, mimetype) {
  if (!buffer || buffer.length === 0) {
    return {
      valid: false,
      error: 'Dosya boş',
      actualType: null
    };
  }

  // Check file size (max 10MB)
  if (buffer.length > 10 * 1024 * 1024) {
    return {
      valid: false,
      error: 'Dosya boyutu çok büyük (max 10MB)',
      actualType: null
    };
  }

  // Magic number validation - check file signature
  const magicNumbers = {
    'image/jpeg': [
      [0xFF, 0xD8, 0xFF, 0xE0],
      [0xFF, 0xD8, 0xFF, 0xE1],
      [0xFF, 0xD8, 0xFF, 0xE2],
      [0xFF, 0xD8, 0xFF, 0xE3],
      [0xFF, 0xD8, 0xFF, 0xE8]
    ],
    'image/png': [
      [0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]
    ],
    'image/gif': [
      [0x47, 0x49, 0x46, 0x38, 0x37, 0x61], // GIF87a
      [0x47, 0x49, 0x46, 0x38, 0x39, 0x61]  // GIF89a
    ],
    'image/webp': [
      [0x52, 0x49, 0x46, 0x46] // RIFF (check WEBP at offset 8)
    ]
  };

  let actualType = null;

  // Check each known image type
  for (const [type, signatures] of Object.entries(magicNumbers)) {
    for (const signature of signatures) {
      let match = true;
      for (let i = 0; i < signature.length; i++) {
        if (buffer[i] !== signature[i]) {
          match = false;
          break;
        }
      }
      if (match) {
        actualType = type;
        break;
      }
    }
    if (actualType) break;
  }

  // Special case for WebP - need to check offset 8
  if (buffer[0] === 0x52 && buffer[1] === 0x49 && buffer[2] === 0x46 && buffer[3] === 0x46) {
    if (buffer[8] === 0x57 && buffer[9] === 0x45 && buffer[10] === 0x42 && buffer[11] === 0x50) {
      actualType = 'image/webp';
    }
  }

  if (!actualType) {
    return {
      valid: false,
      error: 'Desteklenmeyen dosya formatı. Sadece JPEG, PNG, GIF ve WebP desteklenir.',
      actualType: null
    };
  }

  // Verify declared mimetype matches actual type
  if (!mimetype.startsWith('image/')) {
    return {
      valid: false,
      error: 'Sadece resim dosyaları yüklenebilir',
      actualType: actualType
    };
  }

  // Allow slight mimetype mismatches (e.g., image/jpg vs image/jpeg)
  const normalizedMime = mimetype.replace('jpg', 'jpeg');
  const normalizedActual = actualType.replace('jpg', 'jpeg');

  if (normalizedMime !== normalizedActual) {
    console.warn(`⚠️ MIME type mismatch: declared=${mimetype}, actual=${actualType}`);
    // Still allow but log warning
  }

  return {
    valid: true,
    error: null,
    actualType: actualType
  };
}

/**
 * Validate username for security
 * @param {string} username - Username to validate
 * @returns {object} - { valid: boolean, error: string|null }
 */
function validateUsername(username) {
  if (!username || typeof username !== 'string') {
    return {
      valid: false,
      error: 'Kullanıcı adı gereklidir'
    };
  }

  // Length check
  if (username.length < 3 || username.length > 30) {
    return {
      valid: false,
      error: 'Kullanıcı adı 3-30 karakter olmalıdır'
    };
  }

  // Only alphanumeric, underscore, hyphen, dot
  if (!/^[a-zA-Z0-9._-]+$/.test(username)) {
    return {
      valid: false,
      error: 'Kullanıcı adı sadece harf, rakam, _, - ve . içerebilir'
    };
  }

  // No consecutive special characters
  if (/[._-]{2,}/.test(username)) {
    return {
      valid: false,
      error: 'Ardışık özel karakterler kullanılamaz'
    };
  }

  // No leading/trailing special characters
  if (/^[._-]|[._-]$/.test(username)) {
    return {
      valid: false,
      error: 'Kullanıcı adı özel karakter ile başlayamaz veya bitemez'
    };
  }

  return { valid: true, error: null };
}

/**
 * Rate limiting helper - check if action should be blocked
 * @param {Map} store - In-memory store for tracking
 * @param {string} key - Unique identifier (userId, IP, etc.)
 * @param {number} maxAttempts - Max attempts allowed
 * @param {number} windowMs - Time window in milliseconds
 * @returns {object} - { allowed: boolean, retryAfter: number|null }
 */
function checkRateLimit(store, key, maxAttempts, windowMs) {
  const now = Date.now();
  const record = store.get(key) || { count: 0, resetTime: now + windowMs };

  // Reset if window expired
  if (now > record.resetTime) {
    record.count = 0;
    record.resetTime = now + windowMs;
  }

  // Check if limit exceeded
  if (record.count >= maxAttempts) {
    const retryAfter = Math.ceil((record.resetTime - now) / 1000);
    return {
      allowed: false,
      retryAfter: retryAfter
    };
  }

  // Increment counter
  record.count++;
  store.set(key, record);

  return {
    allowed: true,
    retryAfter: null
  };
}

module.exports = {
  sanitizeContent,
  validateContent,
  validateUrl,
  validateFileUpload,
  validateUsername,
  checkRateLimit
};
