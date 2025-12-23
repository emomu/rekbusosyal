import React, { useState, useRef, useEffect } from 'react';
import { Music, Play, Pause, ExternalLink } from 'lucide-react';

export default function SpotifyTrackDisplay({ track, compact = false, initialProgress = null, listeningAlong = [] }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const audioRef = useRef(null);
  const startTimeRef = useRef(null);
  const trackIdRef = useRef(null);

  // Track değiştiğinde veya ilk yükleme
  useEffect(() => {
    if (track?.previewUrl && audioRef.current) {
      audioRef.current.src = track.previewUrl;
    }

    // Duration'ı track'ten al (API ms cinsinden veriyor)
    if (track?.duration) {
      setDuration(track.duration / 1000);
    }

    // Şarkı değiştiyse zamanı resetle
    const trackId = track?.name + track?.artist;
    if (trackId !== trackIdRef.current) {
      trackIdRef.current = trackId;
      if (initialProgress !== null) {
        setCurrentTime(initialProgress / 1000);
        startTimeRef.current = Date.now() - initialProgress;
      }
    }

    return () => {
      audioRef.current?.pause();
    };
  }, [track]);

  // initialProgress değiştiğinde sadece referans zamanını güncelle
  useEffect(() => {
    if (initialProgress !== null && !isPlaying) {
      startTimeRef.current = Date.now() - initialProgress;
    }
  }, [initialProgress, isPlaying]);

  // Her saniye progress'i güncelle (Discord gibi smooth)
  useEffect(() => {
    let interval;
    if (initialProgress !== null && !isPlaying && duration > 0 && startTimeRef.current) {
      interval = setInterval(() => {
        const elapsed = (Date.now() - startTimeRef.current) / 1000;
        if (elapsed >= duration) {
          setCurrentTime(duration);
        } else {
          setCurrentTime(elapsed);
        }
      }, 100); // 100ms'de bir güncelle (daha smooth)
    }
    return () => clearInterval(interval);
  }, [initialProgress, isPlaying, duration]);

  const togglePlay = () => {
    if (!audioRef.current) return;

    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    if (audioRef.current && !track.duration) { // Eğer track objesinde duration yoksa audio'dan al
      setDuration(audioRef.current.duration);
    }
  };

  const handleEnded = () => {
    setIsPlaying(false);
    setCurrentTime(0);
  };

  const handleSeek = (e) => {
    // Sadece preview varsa seek yapılabilir
    if (!track.previewUrl) return;
    
    const progressBar = e.currentTarget;
    const clickX = e.nativeEvent.offsetX;
    const width = progressBar.offsetWidth;
    const seekTime = (clickX / width) * duration;

    if (audioRef.current) {
      audioRef.current.currentTime = seekTime;
      setCurrentTime(seekTime);
    }
  };

  const formatTime = (seconds) => {
    if (!seconds && seconds !== 0) return "0:00";
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  if (!track) return null;

  // Compact mode (post kartlarında ve profil status)
  if (compact) {
    return (
      <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg p-3 w-full">
        <audio
          ref={audioRef}
          onTimeUpdate={handleTimeUpdate}
          onLoadedMetadata={handleLoadedMetadata}
          onEnded={handleEnded}
        />

        {/* Başlık - Sadece initialProgress varsa göster (profilde çalan şarkı) */}
        {initialProgress !== null && (
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-1.5">
              <Music size={12} className="text-green-600" />
              <span className="text-xs text-green-700 font-semibold">Şu an dinliyor</span>
            </div>

            {/* Listening Along - Discord gibi */}
            {listeningAlong && listeningAlong.length > 0 && (
              <div className="flex items-center gap-1">
                <div className="flex -space-x-2">
                  {listeningAlong.slice(0, 3).map((user, idx) => (
                    <img
                      key={idx}
                      src={user.profilePicture || '/default-avatar.png'}
                      alt={user.fullName}
                      className="w-5 h-5 rounded-full border-2 border-green-50 object-cover"
                      title={user.fullName}
                    />
                  ))}
                </div>
                <span className="text-[10px] text-green-600 font-medium">
                  +{listeningAlong.length} dinliyor
                </span>
              </div>
            )}
          </div>
        )}

        <div className="flex items-center gap-3">
          {/* Album Art & Play Button */}
          <div className="relative shrink-0">
            {track.albumArt ? (
              <img
                src={track.albumArt}
                alt={track.album}
                className="w-12 h-12 rounded object-cover"
              />
            ) : (
              <div className="w-12 h-12 bg-green-200 rounded flex items-center justify-center">
                <Music size={20} className="text-green-600" />
              </div>
            )}

            {track.previewUrl && (
              <button
                onClick={togglePlay}
                className="absolute inset-0 bg-black/40 rounded flex items-center justify-center hover:bg-black/50 transition"
              >
                {isPlaying ? (
                  <Pause size={16} className="text-white" fill="white" />
                ) : (
                  <Play size={16} className="text-white" fill="white" />
                )}
              </button>
            )}
          </div>

          {/* Track Info */}
          <div className="flex-1 min-w-0 overflow-hidden">
            <div className="flex items-center gap-1 mb-1">
              <Music size={12} className="text-green-600 shrink-0" />
              <span className="font-semibold text-sm text-gray-900 truncate block w-full">
                {track.name}
              </span>
            </div>
            <div className="text-xs text-gray-600 truncate block w-full">{track.artist}</div>

            {/* Progress Bar */}
            {(track.previewUrl || initialProgress !== null) ? (
              <div className="mt-2">
                <div
                  className={`h-1 bg-green-200 rounded-full overflow-hidden ${track.previewUrl ? 'cursor-pointer' : ''}`}
                  onClick={handleSeek}
                >
                  <div
                    className="h-full bg-green-600 transition-all duration-100"
                    style={{ width: `${progress}%` }}
                  />
                </div>
                <div className="flex justify-between items-center mt-1">
                  <span className="text-[10px] text-gray-500 font-mono">
                    {formatTime(currentTime)}
                  </span>
                  <span className="text-[10px] text-gray-500 font-mono">
                    {formatTime(duration || 30)}
                  </span>
                </div>
              </div>
            ) : (
              <div className="mt-2 text-xs text-amber-600 bg-amber-50 px-2 py-1 rounded inline-block">
                Önizleme yok
              </div>
            )}
          </div>

          {/* Spotify Link */}
          <a
            href={track.spotifyUrl || track.url}
            target="_blank"
            rel="noopener noreferrer"
            className="shrink-0 p-2 hover:bg-green-100 rounded-lg transition"
            title="Spotify'da Dinle"
          >
            <ExternalLink size={16} className="text-green-600" />
          </a>
        </div>
      </div>
    );
  }

  // Full mode
  return (
    <div className="bg-gradient-to-r from-green-50 via-emerald-50 to-green-50 border border-green-200 rounded-xl p-4 mb-4 w-full">
      <audio
        ref={audioRef}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onEnded={handleEnded}
      />

      <div className="flex items-start gap-4">
        {/* Album Art & Play Button */}
        <div className="relative shrink-0">
          {track.albumArt ? (
            <img
              src={track.albumArt}
              alt={track.album}
              className="w-20 h-20 rounded-lg object-cover shadow-md"
            />
          ) : (
            <div className="w-20 h-20 bg-green-200 rounded-lg flex items-center justify-center shadow-md">
              <Music size={32} className="text-green-600" />
            </div>
          )}

          {track.previewUrl && (
            <button
              onClick={togglePlay}
              className="absolute inset-0 bg-black/40 rounded-lg flex items-center justify-center hover:bg-black/50 transition"
            >
              {isPlaying ? (
                <Pause size={28} className="text-white" fill="white" />
              ) : (
                <Play size={28} className="text-white" fill="white" />
              )}
            </button>
          )}
        </div>

        {/* Track Info */}
        <div className="flex-1 min-w-0 overflow-hidden">
          <div className="flex items-center gap-2 mb-1">
            <Music size={16} className="text-green-600 shrink-0" />
            <span className="text-xs font-medium text-green-600 uppercase tracking-wide">
              Spotify
            </span>
          </div>
          <h3 className="font-bold text-lg text-gray-900 mb-1 truncate block w-full">
            {track.name}
          </h3>
          <p className="text-sm text-gray-600 mb-1 truncate block w-full">{track.artist}</p>
          <p className="text-xs text-gray-500 truncate block w-full">{track.album}</p>

          {/* Progress Bar */}
          {(track.previewUrl || initialProgress !== null) ? (
            <div className="mt-3">
              <div
                className={`h-2 bg-green-200 rounded-full overflow-hidden ${track.previewUrl ? 'cursor-pointer' : ''}`}
                onClick={handleSeek}
              >
                <div
                  className="h-full bg-gradient-to-r from-green-500 to-green-600 transition-all duration-100"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <div className="flex justify-between items-center mt-2">
                <span className="text-sm text-gray-600 font-medium font-mono">
                  {formatTime(currentTime)}
                </span>
                <span className="text-sm text-gray-500 font-mono">
                  {formatTime(duration || 30)}
                </span>
              </div>
            </div>
          ) : (
            <div className="mt-3 text-xs text-amber-600 bg-amber-50 px-3 py-2 rounded-lg inline-block">
              Preview mevcut değil
            </div>
          )}
        </div>

        {/* Spotify Link */}
        <a
          href={track.spotifyUrl || track.url}
          target="_blank"
          rel="noopener noreferrer"
          className="shrink-0 p-3 bg-green-600 hover:bg-green-700 text-white rounded-xl transition shadow-md hover:shadow-lg"
          title="Spotify'da Dinle"
        >
          <ExternalLink size={20} />
        </a>
      </div>
    </div>
  );
}
