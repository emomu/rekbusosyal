import { useState } from 'react';
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
  const [imageError, setImageError] = useState(false);

  // Hata durumunda fallback göster
  if ((error || imageError) && fallback) {
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
        setImageError(true);
        if (onError) onError(e);
      }}
      {...props}
    />
  );
}
