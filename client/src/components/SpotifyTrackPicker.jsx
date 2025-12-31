import React, { useState, useRef, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { Search, Music, X, Play, Pause, ExternalLink, Loader } from 'lucide-react';
import { API_URL } from '../config/api';

export default function SpotifyTrackPicker({ isOpen, onClose, onSelect }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [tracks, setTracks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [playingTrackId, setPlayingTrackId] = useState(null);
  const audioRef = useRef(null);
  const searchTimeoutRef = useRef(null);
  const token = useSelector((state) => state.auth.token);

  // Şarkı ara
  const searchTracks = async (query) => {
    if (!query || query.trim().length === 0) {
      setTracks([]);
      return;
    }

    try {
      setLoading(true);
      const res = await fetch(`${API_URL}/api/spotify/search?q=${encodeURIComponent(query)}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();

      if (res.ok) {
        setTracks(data.tracks);
      } else {
        console.error('Search error:', data.error);
      }
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setLoading(false);
    }
  };

  // Debounced search
  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    searchTimeoutRef.current = setTimeout(() => {
      searchTracks(searchQuery);
    }, 500);

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [searchQuery]);

  // Preview çal/durdur
  const togglePreview = (track) => {
    if (!track.previewUrl) return;

    if (playingTrackId === track.id) {
      audioRef.current?.pause();
      setPlayingTrackId(null);
    } else {
      if (audioRef.current) {
        audioRef.current.pause();
      }
      audioRef.current = new Audio(track.previewUrl);
      audioRef.current.play();
      setPlayingTrackId(track.id);

      audioRef.current.onended = () => {
        setPlayingTrackId(null);
      };
    }
  };

  // Modal kapandığında ses durdur
  useEffect(() => {
    if (!isOpen) {
      audioRef.current?.pause();
      setPlayingTrackId(null);
      setSearchQuery('');
      setTracks([]);
    }
  }, [isOpen]);

  // Cleanup
  useEffect(() => {
    return () => {
      audioRef.current?.pause();
    };
  }, []);

  const handleSelect = (track) => {
    audioRef.current?.pause();
    setPlayingTrackId(null);
    onSelect(track);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center">
                <Music className="w-5 h-5 text-green-600" />
              </div>
              <h2 className="text-xl font-bold text-gray-900">Spotify Şarkısı Ekle</h2>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition"
            >
              <X size={20} className="text-gray-500" />
            </button>
          </div>

          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Şarkı, sanatçı veya albüm ara..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-11 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-green-500 focus:bg-white transition"
              autoFocus
            />
          </div>
        </div>

        {/* Results */}
        <div className="flex-1 overflow-y-auto p-4">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader className="w-8 h-8 text-green-600 animate-spin" />
            </div>
          ) : tracks.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                <Music className="w-8 h-8 text-gray-400" />
              </div>
              <p className="text-gray-500">
                {searchQuery.trim().length === 0
                  ? 'Bir şarkı aramaya başla'
                  : 'Sonuç bulunamadı'}
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {tracks.map((track) => (
                <div
                  key={track.id}
                  className="group p-3 bg-gray-50 hover:bg-green-50 rounded-xl transition cursor-pointer border border-transparent hover:border-green-200"
                  onClick={() => handleSelect(track)}
                >
                  <div className="flex items-center gap-3">
                    {/* Album Art */}
                    <div className="relative shrink-0">
                      {track.albumArt ? (
                        <img
                          src={track.albumArt}
                          alt={track.album}
                          className="w-14 h-14 rounded-lg object-cover"
                        />
                      ) : (
                        <div className="w-14 h-14 bg-gray-200 rounded-lg flex items-center justify-center">
                          <Music size={24} className="text-gray-400" />
                        </div>
                      )}

                      {/* Preview Play Button */}
                      {track.previewUrl && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            togglePreview(track);
                          }}
                          className="absolute inset-0 bg-black/50 rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100 transition"
                        >
                          {playingTrackId === track.id ? (
                            <Pause size={20} className="text-white" fill="white" />
                          ) : (
                            <Play size={20} className="text-white" fill="white" />
                          )}
                        </button>
                      )}
                    </div>

                    {/* Track Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <div className="font-semibold text-gray-900 truncate group-hover:text-green-600 transition">
                          {track.name}
                        </div>
                        {!track.previewUrl && (
                          <span className="shrink-0 text-xs text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded">
                            Önizleme yok
                          </span>
                        )}
                      </div>
                      <div className="text-sm text-gray-600 truncate">{track.artist}</div>
                      <div className="text-xs text-gray-400 truncate">{track.album}</div>
                    </div>

                    {/* Spotify Link */}
                    <a
                      href={track.spotifyUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="shrink-0 p-2 hover:bg-green-100 rounded-lg transition opacity-0 group-hover:opacity-100"
                      title="Spotify'da Aç"
                    >
                      <ExternalLink size={18} className="text-green-600" />
                    </a>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-100">
          <p className="text-xs text-gray-500 text-center">
            Şarkılar Spotify tarafından sağlanmaktadır
          </p>
        </div>
      </div>
    </div>
  );
}
