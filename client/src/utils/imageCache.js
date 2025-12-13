import { getCookiePreferences } from './cookieManager';

/**
 * Resim cache yönetimi
 * Functional cookies kabul edildiyse resimleri localStorage'da cache'ler
 */

const CACHE_PREFIX = 'img_cache_';
const CACHE_METADATA_KEY = 'img_cache_metadata';
const MAX_CACHE_SIZE_MB = 50; // Maksimum 50MB cache
const CACHE_EXPIRY_DAYS = 7; // Cache 7 gün geçerli

// Cache'in aktif olup olmadığını kontrol et
export const isCacheEnabled = () => {
  const preferences = getCookiePreferences();
  return preferences && (preferences.necessary || preferences.functional);
};

// Cache metadata'sını al
const getCacheMetadata = () => {
  if (!isCacheEnabled()) return {};

  try {
    const metadata = localStorage.getItem(CACHE_METADATA_KEY);
    return metadata ? JSON.parse(metadata) : {};
  } catch (e) {
    return {};
  }
};

// Cache metadata'sını kaydet
const saveCacheMetadata = (metadata) => {
  if (!isCacheEnabled()) return;

  try {
    localStorage.setItem(CACHE_METADATA_KEY, JSON.stringify(metadata));
  } catch (e) {
    console.error('Cache metadata kaydedilemedi:', e);
  }
};

// Base64 boyutunu hesapla (MB)
const getBase64SizeMB = (base64String) => {
  const sizeInBytes = (base64String.length * 3) / 4;
  return sizeInBytes / (1024 * 1024);
};

// Toplam cache boyutunu hesapla
const getTotalCacheSizeMB = (metadata) => {
  return Object.values(metadata).reduce((total, item) => total + (item.size || 0), 0);
};

// Eski cache'leri temizle
const cleanExpiredCache = () => {
  if (!isCacheEnabled()) return;

  const metadata = getCacheMetadata();
  const now = Date.now();
  const expiryTime = CACHE_EXPIRY_DAYS * 24 * 60 * 60 * 1000;

  let hasChanges = false;

  Object.keys(metadata).forEach(key => {
    const item = metadata[key];
    if (now - item.timestamp > expiryTime) {
      // Süresi dolmuş, sil
      try {
        localStorage.removeItem(CACHE_PREFIX + key);
        delete metadata[key];
        hasChanges = true;
      } catch (e) {
        console.error('Eski cache silinirken hata:', e);
      }
    }
  });

  if (hasChanges) {
    saveCacheMetadata(metadata);
  }
};

// En eski cache'leri sil (boyut sınırı aşıldığında)
const removeOldestCache = (metadata) => {
  const sortedKeys = Object.keys(metadata).sort((a, b) =>
    metadata[a].timestamp - metadata[b].timestamp
  );

  if (sortedKeys.length > 0) {
    const oldestKey = sortedKeys[0];
    try {
      localStorage.removeItem(CACHE_PREFIX + oldestKey);
      delete metadata[oldestKey];
      saveCacheMetadata(metadata);
    } catch (e) {
      console.error('En eski cache silinirken hata:', e);
    }
  }
};

// URL'den hash oluştur (cache key için)
const hashUrl = (url) => {
  let hash = 0;
  for (let i = 0; i < url.length; i++) {
    const char = url.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash).toString(36);
};

/**
 * Resmi cache'e kaydet
 */
export const cacheImage = async (url, base64Data) => {
  if (!isCacheEnabled()) return;

  try {
    // Eski cache'leri temizle
    cleanExpiredCache();

    const key = hashUrl(url);
    const metadata = getCacheMetadata();
    const size = getBase64SizeMB(base64Data);

    // Boyut kontrolü
    let totalSize = getTotalCacheSizeMB(metadata);

    // Eğer yeni resim eklenince limit aşılacaksa, eski resimleri sil
    while (totalSize + size > MAX_CACHE_SIZE_MB && Object.keys(metadata).length > 0) {
      removeOldestCache(metadata);
      totalSize = getTotalCacheSizeMB(metadata);
    }

    // Cache'e kaydet
    localStorage.setItem(CACHE_PREFIX + key, base64Data);

    // Metadata'yı güncelle
    metadata[key] = {
      url,
      timestamp: Date.now(),
      size
    };
    saveCacheMetadata(metadata);

  } catch (e) {
    console.error('Resim cache\'lenemedi:', e);
    // LocalStorage dolu olabilir, eski cache'leri temizle
    if (e.name === 'QuotaExceededError') {
      const metadata = getCacheMetadata();
      removeOldestCache(metadata);
    }
  }
};

/**
 * Cache'den resmi al
 */
export const getCachedImage = (url) => {
  if (!isCacheEnabled()) return null;

  try {
    const key = hashUrl(url);
    const metadata = getCacheMetadata();

    // Cache'de var mı ve süresi dolmamış mı kontrol et
    if (metadata[key]) {
      const expiryTime = CACHE_EXPIRY_DAYS * 24 * 60 * 60 * 1000;
      if (Date.now() - metadata[key].timestamp < expiryTime) {
        return localStorage.getItem(CACHE_PREFIX + key);
      } else {
        // Süresi dolmuş, sil
        localStorage.removeItem(CACHE_PREFIX + key);
        delete metadata[key];
        saveCacheMetadata(metadata);
      }
    }
  } catch (e) {
    console.error('Cache\'den resim alınamadı:', e);
  }

  return null;
};

/**
 * Tüm cache'i temizle
 */
export const clearImageCache = () => {
  try {
    const metadata = getCacheMetadata();
    Object.keys(metadata).forEach(key => {
      localStorage.removeItem(CACHE_PREFIX + key);
    });
    localStorage.removeItem(CACHE_METADATA_KEY);
  } catch (e) {
    console.error('Cache temizlenirken hata:', e);
  }
};

/**
 * Cache istatistikleri
 */
export const getCacheStats = () => {
  if (!isCacheEnabled()) {
    return { enabled: false, count: 0, size: 0 };
  }

  const metadata = getCacheMetadata();
  return {
    enabled: true,
    count: Object.keys(metadata).length,
    size: getTotalCacheSizeMB(metadata).toFixed(2),
    maxSize: MAX_CACHE_SIZE_MB
  };
};
