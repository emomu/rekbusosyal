import React, { useState, useEffect, useCallback } from 'react';
import { Play, X, ChevronLeft, ChevronRight, Share2, Loader2 } from 'lucide-react';

// --- ALT BİLEŞEN: TEKİL MEDYA ÖĞESİ (Video/Resim) ---
const MediaItem = ({ item, onClick, isLarge }) => {
  const isVideo = item.type === 'video';
  const [imageLoaded, setImageLoaded] = useState(false);

  return (
    <div
      className="relative w-full h-full bg-gray-900 cursor-pointer overflow-hidden group isolate"
      onClick={onClick}
    >
      {isVideo ? (
        <>
          {/* KATMAN 0: Medya (En altta ve kapsayıcıya sabitlenmiş) */}
          <div className="absolute inset-0 z-0 flex items-center justify-center bg-black">
             {/* Thumbnail varsa onu göster, yoksa videonun 1. saniyesini al */}
             {item.preview || item.thumbnail ? (
                 <>
                   {!imageLoaded && (
                     <div className="absolute inset-0 flex items-center justify-center bg-gray-900">
                       <Loader2 className="animate-spin text-blue-500" size={isLarge ? 40 : 24} />
                     </div>
                   )}
                   <img
                    src={item.preview || item.thumbnail}
                    className="w-full h-full object-cover opacity-90"
                    alt="cover"
                    onLoad={() => setImageLoaded(true)}
                   />
                 </>
             ) : (
                <video
                  src={`${item.url}#t=1.0`}
                  className="w-full h-full object-cover"
                  preload="metadata"
                  muted
                  playsInline
                />
             )}
          </div>

          {/* KATMAN 1: Hafif Karanlık Overlay */}
          <div className="absolute inset-0 z-10 bg-black/10 group-hover:bg-black/30 transition-colors duration-300 pointer-events-none" />

          {/* KATMAN 2: Play Butonu (Ortada ve en üstte) */}
          <div className="absolute inset-0 z-20 flex items-center justify-center pointer-events-none">
            <div className={`
              flex items-center justify-center bg-white/20 backdrop-blur-md rounded-full border border-white/30 shadow-xl group-hover:scale-110 group-hover:bg-white/30 transition-all duration-300
              ${isLarge ? 'w-16 h-16' : 'w-12 h-12'} 
            `}>
              <Play size={isLarge ? 32 : 20} className="text-white ml-1 fill-white" />
            </div>
          </div>

          {/* KATMAN 3: Video Rozeti (Sağ alt) */}
          <div className="absolute bottom-2 right-2 z-30 px-2 py-0.5 bg-black/60 backdrop-blur-md rounded text-[10px] font-bold text-white flex items-center gap-1 pointer-events-none">
             VIDEO
          </div>
        </>
      ) : (
        // RESİM GÖRÜNÜMÜ
        <div className="absolute inset-0 z-0">
          {!imageLoaded && (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-900">
              <Loader2 className="animate-spin text-blue-500" size={isLarge ? 40 : 24} />
            </div>
          )}
          <img
            src={item.preview || item.url}
            alt="Media"
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            loading="lazy"
            onLoad={() => setImageLoaded(true)}
          />
          {item.type === 'gif' && (
            <div className="absolute bottom-2 left-2 z-10 px-2 py-1 bg-black/50 backdrop-blur-sm rounded text-[10px] font-bold text-white">
              GIF
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// --- ANA BİLEŞEN ---
const MediaDisplay = ({ media = [] }) => {
  const [lightboxIndex, setLightboxIndex] = useState(-1);
  const [fullImageLoaded, setFullImageLoaded] = useState(false);

  // Lightbox Navigasyon
  const navigate = useCallback((direction) => {
    setFullImageLoaded(false);
    setLightboxIndex((prev) => {
      if (prev === -1) return prev;
      const newIndex = prev + direction;
      if (newIndex < 0) return media.length - 1;
      if (newIndex >= media.length) return 0;
      return newIndex;
    });
  }, [media.length]);

  // Klavye Kontrolü
  const handleKeyDown = useCallback((e) => {
    if (lightboxIndex === -1) return;
    switch (e.key) {
      case 'Escape': setLightboxIndex(-1); break;
      case 'ArrowLeft': navigate(-1); break;
      case 'ArrowRight': navigate(1); break;
      default: break;
    }
  }, [lightboxIndex, navigate]);

  useEffect(() => {
    if (lightboxIndex !== -1) {
      window.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'auto';
    };
  }, [lightboxIndex, handleKeyDown]);

  const handleShare = async (e, item) => {
    e.stopPropagation();
    // Share logic...
  };

  if (!media || media.length === 0) return null;

  const isOpen = lightboxIndex !== -1;
  const currentMedia = media[lightboxIndex];
  const count = media.length;

  // --- TWITTER GRID HESAPLAMALARI ---
  // Grid container sınıfını dinamik oluşturuyoruz.
  // gap-0.5 = 2px boşluk (Twitter stili)
  let gridClass = "grid gap-0.5 mt-3 mb-1 rounded-2xl overflow-hidden bg-black border border-gray-800 shadow-sm select-none w-full ";

  if (count === 1) {
    gridClass += "grid-cols-1 aspect-[16/9] md:aspect-[2/1] max-h-[500px]"; 
  } else if (count === 2) {
    gridClass += "grid-cols-2 aspect-[2/1]";
  } else if (count === 3) {
    // 3'lü yapı: Sol büyük, sağ iki küçük
    gridClass += "grid-cols-2 grid-rows-2 aspect-[3/2]";
  } else {
    // 4'lü yapı: 2x2 kare
    gridClass += "grid-cols-2 grid-rows-2 aspect-[3/2]"; // 16/9 veya 3/2 tercih edilebilir
  }

  return (
    <>
      {/* Grid Container */}
      <div className={gridClass}>
        {media.slice(0, 4).map((item, index) => {
          // Hücre Sınıfları
          let cellClass = "relative w-full h-full";
          
          // 3 Medya varsa: İlk eleman sol tarafı (2 satırı) kaplar
          if (count === 3 && index === 0) {
            cellClass += " row-span-2";
          }

          return (
            <div key={index} className={cellClass}>
              <MediaItem 
                item={item} 
                onClick={(e) => { e.stopPropagation(); setLightboxIndex(index); }}
                isLarge={count === 1 || (count === 3 && index === 0)}
              />
              
              {/* +More Badge (Sadece 4. karede ve sayı 4'ten büyükse) */}
              {index === 3 && count > 4 && (
                <div 
                  className="absolute inset-0 z-40 bg-black/60 backdrop-blur-sm flex items-center justify-center cursor-pointer group hover:bg-black/70 transition-colors"
                  onClick={(e) => { e.stopPropagation(); setLightboxIndex(3); }}
                >
                  <span className="text-white text-3xl font-bold tracking-tighter">
                    +{count - 4}
                  </span>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* --- LIGHTBOX (DEĞİŞMEDİ) --- */}
      {isOpen && currentMedia && (
        <div 
          className="fixed inset-0 z-[100] bg-black flex items-center justify-center animate-in fade-in duration-200"
          onClick={() => setLightboxIndex(-1)}
        >
          {/* Top Bar */}
          <div className="absolute top-0 left-0 right-0 p-4 flex justify-between items-center z-50 pointer-events-none">
             <span className="text-white/90 font-medium text-sm px-3 py-1 bg-white/10 rounded-full backdrop-blur-md border border-white/10 pointer-events-auto">
              {lightboxIndex + 1} / {media.length}
            </span>
            <button
              onClick={(e) => { e.stopPropagation(); setLightboxIndex(-1); }}
              className="p-2 text-white/80 hover:text-red-400 transition bg-black/20 hover:bg-white/10 rounded-full pointer-events-auto backdrop-blur-md"
            >
              <X size={28} />
            </button>
          </div>

          {/* Navigation Arrows */}
          {media.length > 1 && (
            <>
              <button
                onClick={(e) => { e.stopPropagation(); navigate(-1); }}
                className="absolute left-2 md:left-4 p-3 rounded-full bg-white/10 hover:bg-white/20 text-white backdrop-blur-md transition border border-white/10 z-50 pointer-events-auto"
              >
                <ChevronLeft size={32} />
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); navigate(1); }}
                className="absolute right-2 md:right-4 p-3 rounded-full bg-white/10 hover:bg-white/20 text-white backdrop-blur-md transition border border-white/10 z-50 pointer-events-auto"
              >
                <ChevronRight size={32} />
              </button>
            </>
          )}

          {/* Full Screen Content */}
          <div
            className="w-full h-full flex items-center justify-center p-0 md:p-8 relative"
            onClick={(e) => e.stopPropagation()}
          >
            {!fullImageLoaded && currentMedia.type !== 'video' && (
              <div className="absolute inset-0 flex items-center justify-center">
                <Loader2 className="animate-spin text-blue-500" size={48} />
              </div>
            )}
            {currentMedia.type === 'video' ? (
              <video
                src={currentMedia.url}
                controls
                autoPlay
                className="max-w-full max-h-full outline-none bg-black shadow-2xl"
              />
            ) : (
              <img
                src={currentMedia.url}
                alt="Full View"
                className="max-w-full max-h-full object-contain shadow-2xl"
                onLoad={() => setFullImageLoaded(true)}
              />
            )}
          </div>
        </div>
      )}
    </>
  );
};

export default MediaDisplay;