/**
 * Ensures image URLs are properly formatted
 * @param {string} url - The image URL to fix
 * @returns {string} - The fixed URL
 */
export function ensureHttps(url) {
  if (!url) return url;

  // If it's already a relative path (starts with /), return as-is
  // Browser will automatically use the current origin (http or https)
  if (url.startsWith('/')) {
    return url;
  }

  // If URL starts with http:// (not https://), replace it with https://
  // This handles legacy absolute URLs in the database
  if (url.startsWith('http://')) {
    return url.replace('http://', 'https://');
  }

  return url;
}
