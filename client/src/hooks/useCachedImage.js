import { useState, useEffect } from 'react';
import { getCachedImage, cacheImage, isCacheEnabled } from '../utils/imageCache';
import { ensureHttps } from '../utils/imageUtils';

/**
 * Resmi cache'den yükleyen veya cache'e kaydeden custom hook
 * @param {string} imageUrl - Yüklenecek resim URL'i
 * @returns {Object} - { src, isLoading, error }
 */
export const useCachedImage = (imageUrl) => {
  const [src, setSrc] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!imageUrl) {
      setIsLoading(false);
      return;
    }

    const url = ensureHttps(imageUrl);

    // Cache kontrolü
    if (isCacheEnabled()) {
      const cachedData = getCachedImage(url);
      if (cachedData) {
        // Cache'de var, direkt kullan
        setSrc(cachedData);
        setIsLoading(false);
        return;
      }
    }

    // Cache'de yok, indir
    const loadImage = async () => {
      try {
        setIsLoading(true);

        // Resmi fetch et
        const response = await fetch(url, {
          mode: 'cors',
          credentials: 'same-origin'
        });
        if (!response.ok) {
          throw new Error('Resim yüklenemedi');
        }

        // Blob'a çevir
        const blob = await response.blob();

        // Base64'e çevir
        const reader = new FileReader();
        reader.onloadend = () => {
          const base64data = reader.result;
          setSrc(base64data);
          setIsLoading(false);

          // Cache'e kaydet (arka planda)
          if (isCacheEnabled()) {
            cacheImage(url, base64data);
          }
        };
        reader.onerror = () => {
          setError('Resim işlenemedi');
          setIsLoading(false);
          // Hata olursa direkt URL'i kullan
          setSrc(url);
        };
        reader.readAsDataURL(blob);

      } catch (err) {
        setError(err.message);
        setIsLoading(false);
        // Hata olursa direkt URL'i kullan
        setSrc(url);
      }
    };

    loadImage();
  }, [imageUrl]);

  return { src, isLoading, error };
};
