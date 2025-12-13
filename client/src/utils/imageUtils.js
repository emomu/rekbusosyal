/**
 * Ensures image URLs use HTTPS protocol in production
 * @param {string} url - The image URL to fix
 * @returns {string} - The fixed URL with HTTPS protocol
 */
export function ensureHttps(url) {
  if (!url) return url;

  // If URL starts with http:// (not https://), replace it with https://
  if (url.startsWith('http://')) {
    return url.replace('http://', 'https://');
  }

  return url;
}
