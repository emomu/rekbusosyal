/**
 * Cookie yönetim fonksiyonları
 */

// Cookie ayarla
export const setCookie = (name, value, days = 365) => {
  const date = new Date();
  date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
  const expires = `expires=${date.toUTCString()}`;
  document.cookie = `${name}=${value};${expires};path=/;SameSite=Lax`;
};

// Cookie oku
export const getCookie = (name) => {
  const nameEQ = `${name}=`;
  const cookies = document.cookie.split(';');

  for (let i = 0; i < cookies.length; i++) {
    let cookie = cookies[i];
    while (cookie.charAt(0) === ' ') {
      cookie = cookie.substring(1, cookie.length);
    }
    if (cookie.indexOf(nameEQ) === 0) {
      return cookie.substring(nameEQ.length, cookie.length);
    }
  }
  return null;
};

// Cookie sil
export const deleteCookie = (name) => {
  document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:01 GMT;path=/`;
};

// Cookie tercihlerini kaydet
export const saveCookiePreferences = (preferences) => {
  setCookie('cookie_preferences', JSON.stringify(preferences), 365);
  setCookie('cookie_consent', 'true', 365);
};

// Cookie tercihlerini oku
export const getCookiePreferences = () => {
  const preferences = getCookie('cookie_preferences');
  return preferences ? JSON.parse(preferences) : null;
};

// Cookie consent durumunu kontrol et
export const hasConsentGiven = () => {
  return getCookie('cookie_consent') === 'true';
};

// Varsayılan cookie tercihleri
export const getDefaultPreferences = () => ({
  necessary: true, // Zorunlu - devre dışı bırakılamaz
  functional: true,
  analytics: false,
  marketing: false
});
