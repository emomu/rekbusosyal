import React, { useState, useEffect, useRef } from 'react';
import { X, Search, Loader2, TrendingUp, ImagePlay, AlertCircle } from 'lucide-react';

/**
 * GiphyPicker Component - Redesigned
 * Matches the KBÜ Sosyal design language (Blue/Red/Gray palette)
 */
const GiphyPicker = ({ isOpen, onClose, onSelect }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [gifs, setGifs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const searchInputRef = useRef(null);

  // NOT: Gerçek projede bu key'i .env dosyasından çekmelisiniz.
  const GIPHY_API_KEY = import.meta.env.VITE_GIPHY_API_KEY || 'your_giphy_api_key_here';
  const GIPHY_API_BASE = 'https://api.giphy.com/v1/gifs';

  console.log('Giphy API Key:', GIPHY_API_KEY);

  // Load trending on mount
  useEffect(() => {
    if (isOpen) {
      loadTrendingGifs();
      setTimeout(() => searchInputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  const loadTrendingGifs = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(
        `${GIPHY_API_BASE}/trending?api_key=${GIPHY_API_KEY}&limit=21&rating=g`
      );
      const data = await response.json();
      if (data.data) {
        setGifs(data.data);
      } else {
        throw new Error('GIF yüklenemedi');
      }
    } catch (err) {
      console.error(err);
      setError('Bağlantı hatası. API Key kontrol edin.');
    } finally {
      setLoading(false);
    }
  };

  const searchGifs = async () => {
    if (!searchQuery.trim()) {
      loadTrendingGifs();
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(
        `${GIPHY_API_BASE}/search?api_key=${GIPHY_API_KEY}&q=${encodeURIComponent(searchQuery)}&limit=21&rating=g`
      );
      const data = await response.json();
      if (data.data) {
        setGifs(data.data);
      } else {
        setError('GIF bulunamadı');
      }
    } catch (err) {
      setError('Arama yapılırken hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectGif = (gif) => {
    onSelect({
      url: gif.images.original.url,
      preview: gif.images.fixed_height.url,
      type: 'gif',
      name: gif.title || 'giphy.gif',
      file: null
    });
    onClose();
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') searchGifs();
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-blue-900/40 backdrop-blur-sm z-40 transition-opacity"
        onClick={onClose}
      />

      {/* Dialog Container */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
        <div
          className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[85vh] overflow-hidden pointer-events-auto flex flex-col animate-in slide-in-from-bottom-4 zoom-in-95 duration-200"
          onClick={(e) => e.stopPropagation()}
        >
          {/* 1. Header (KBÜ Sosyal Stili) */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-white">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center border border-blue-100 text-blue-900">
                <ImagePlay size={20} strokeWidth={2.5} />
              </div>
              <div>
                <h2 className="text-lg font-bold text-gray-900 leading-none">GIF Kütüphanesi</h2>
                <span className="text-xs text-gray-500 font-medium">Giphy tarafından desteklenmektedir</span>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors duration-200"
            >
              <X size={20} />
            </button>
          </div>

          {/* 2. Search Bar Area */}
          <div className="p-4 bg-white border-b border-gray-100">
            <div className="relative group">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 group-focus-within:text-blue-600 transition-colors" size={20} />
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Ne hissediyorsun? (örn: heyecanlı, komik)"
                className="w-full pl-10 pr-24 py-3.5 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 placeholder-gray-500 focus:bg-white focus:border-blue-900 focus:ring-4 focus:ring-blue-900/5 outline-none transition-all font-medium"
              />
              <button
                onClick={searchGifs}
                disabled={loading}
                className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-blue-900 text-white px-4 py-1.5 rounded-lg text-sm font-bold hover:bg-blue-800 transition shadow-md shadow-blue-900/10 disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {loading ? <Loader2 className="animate-spin" size={16} /> : 'Ara'}
              </button>
            </div>
          </div>

          {/* 3. Content Grid */}
          <div className="flex-1 overflow-y-auto p-4 bg-gray-50/50 min-h-[300px]">
            {error ? (
              /* Error State */
              <div className="flex flex-col items-center justify-center h-full text-center p-8">
                <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mb-4">
                  <AlertCircle size={32} className="text-red-500" />
                </div>
                <p className="text-gray-900 font-bold mb-1">{error}</p>
                <p className="text-sm text-gray-500 max-w-xs">
                  {error.includes('API key') 
                    ? "Geliştirici notu: .env dosyasında API anahtarı eksik."
                    : "İnternet bağlantınızı kontrol edip tekrar deneyin."}
                </p>
              </div>
            ) : loading ? (
              /* Loading State */
              <div className="flex flex-col items-center justify-center h-full gap-3">
                <Loader2 className="animate-spin text-blue-900" size={40} />
                <p className="text-sm text-gray-400 font-medium animate-pulse">GIF'ler yükleniyor...</p>
              </div>
            ) : gifs.length === 0 ? (
              /* Empty State */
              <div className="flex flex-col items-center justify-center h-full text-center p-8">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4 border border-gray-200">
                  <TrendingUp size={32} className="text-gray-400" />
                </div>
                <p className="text-gray-900 font-bold mb-1">Sonuç Bulunamadı</p>
                <p className="text-sm text-gray-500">Farklı anahtar kelimelerle şansını dene.</p>
              </div>
            ) : (
              /* Results */
              <>
                {!searchQuery && (
                  <div className="flex items-center gap-2 mb-4 px-1">
                    <span className="flex h-2 w-2 rounded-full bg-red-500"></span>
                    <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Trend Olanlar</span>
                  </div>
                )}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {gifs.map((gif) => (
                    <button
                      key={gif.id}
                      onClick={() => handleSelectGif(gif)}
                      className="relative aspect-square rounded-xl overflow-hidden group bg-gray-200 border border-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-offset-2"
                    >
                      <img
                        src={gif.images.fixed_height.url}
                        alt={gif.title}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                        loading="lazy"
                      />
                      {/* Hover Overlay */}
                      <div className="absolute inset-0 bg-blue-900/0 group-hover:bg-blue-900/20 transition-colors flex items-center justify-center">
                         <div className="opacity-0 group-hover:opacity-100 transform translate-y-4 group-hover:translate-y-0 transition-all duration-300">
                            <span className="bg-white/90 text-blue-900 text-xs font-bold px-3 py-1 rounded-full shadow-lg backdrop-blur-sm">
                              Seç
                            </span>
                         </div>
                      </div>
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* 4. Footer */}
          <div className="p-4 border-t border-gray-100 bg-white flex items-center justify-between">
            {/* Giphy Attribution (Required by TOS) */}
            <div className="flex items-center gap-1 opacity-60 hover:opacity-100 transition-opacity">
               <div className="h-3 w-3 bg-gradient-to-tr from-blue-500 to-red-500 rounded-sm"></div>
               <span className="text-[10px] font-bold text-gray-500 tracking-wide">POWERED BY GIPHY</span>
            </div>
            
            <button
              onClick={onClose}
              className="px-5 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition font-bold text-sm"
            >
              Vazgeç
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default GiphyPicker;