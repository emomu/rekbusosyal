import React from 'react';
import { useCachedImage } from '../hooks/useCachedImage';

/**
 * Cache destekli resim komponenti
 * Functional cookies kabul edildiyse resimleri cache'ler
 */
export default function CachedImage({
  src,
  alt,
  className,
  fallback = null,
  showLoader = true,
  onError,
  ...props
}) {
  const { src: cachedSrc, isLoading, error } = useCachedImage(src);

  // Hata durumunda fallback göster
  if (error && fallback) {
    return fallback;
  }

  // Yükleme durumunda placeholder
  if (isLoading && showLoader) {
    return (
      <div className={`bg-gray-200 animate-pulse ${className}`}>
        <div className="w-full h-full flex items-center justify-center">
          <div className="w-6 h-6 border-2 border-gray-400 border-t-transparent rounded-full animate-spin"></div>
        </div>
      </div>
    );
  }

  return (
    <img
      src={cachedSrc || src}
      alt={alt}
      className={className}
      onError={(e) => {
        // Fallback görseli varsa onu göster
        if (fallback && e.target) {
          e.target.style.display = 'none';
          if (e.target.parentElement) {
            e.target.parentElement.innerHTML = '';
            if (typeof fallback === 'string') {
              e.target.parentElement.innerHTML = fallback;
            }
          }
        }
        // Kullanıcı tanımlı onError callback'i varsa çağır
        if (onError) onError(e);
      }}
      {...props}
    />
  );
}
