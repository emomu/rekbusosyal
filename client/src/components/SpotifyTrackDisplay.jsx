import React, { useState, useRef, useEffect } from 'react';
import { Music, Play, Pause, ExternalLink } from 'lucide-react';

export default function SpotifyTrackDisplay({ track, compact = false }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const audioRef = useRef(null);

  useEffect(() => {
    if (track?.previewUrl && audioRef.current) {
      audioRef.current.src = track.previewUrl;
    }

    return () => {
      audioRef.current?.pause();
    };
  }, [track]);

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
    if (audioRef.current) {
      setDuration(audioRef.current.duration);
    }
  };

  const handleEnded = () => {
    setIsPlaying(false);
    setCurrentTime(0);
  };

  const handleSeek = (e) => {
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
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  if (!track) return null;

  // Compact mode (post kartlarında)
  if (compact) {
    return (
      <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg p-3 mb-3">
        <audio
          ref={audioRef}
          onTimeUpdate={handleTimeUpdate}
          onLoadedMetadata={handleLoadedMetadata}
          onEnded={handleEnded}
        />

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
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1 mb-1">
              <Music size={12} className="text-green-600 shrink-0" />
              <span className="font-semibold text-sm text-gray-900 truncate">
                {track.name}
              </span>
            </div>
            <div className="text-xs text-gray-600 truncate">{track.artist}</div>

            {/* Progress Bar */}
            {track.previewUrl ? (
              <div className="mt-2">
                <div
                  className="h-1 bg-green-200 rounded-full cursor-pointer overflow-hidden"
                  onClick={handleSeek}
                >
                  <div
                    className="h-full bg-green-600 transition-all duration-100"
                    style={{ width: `${progress}%` }}
                  />
                </div>
                <div className="flex justify-between items-center mt-1">
                  <span className="text-xs text-gray-500">
                    {formatTime(currentTime)}
                  </span>
                  <span className="text-xs text-gray-500">
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
            href={track.spotifyUrl}
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
    <div className="bg-gradient-to-r from-green-50 via-emerald-50 to-green-50 border border-green-200 rounded-xl p-4 mb-4">
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
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <Music size={16} className="text-green-600 shrink-0" />
            <span className="text-xs font-medium text-green-600 uppercase tracking-wide">
              Spotify
            </span>
          </div>
          <h3 className="font-bold text-lg text-gray-900 mb-1 truncate">
            {track.name}
          </h3>
          <p className="text-sm text-gray-600 mb-1 truncate">{track.artist}</p>
          <p className="text-xs text-gray-500 truncate">{track.album}</p>

          {/* Progress Bar */}
          {track.previewUrl && (
            <div className="mt-3">
              <div
                className="h-2 bg-green-200 rounded-full cursor-pointer overflow-hidden"
                onClick={handleSeek}
              >
                <div
                  className="h-full bg-gradient-to-r from-green-500 to-green-600 transition-all duration-100"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <div className="flex justify-between items-center mt-2">
                <span className="text-sm text-gray-600 font-medium">
                  {formatTime(currentTime)}
                </span>
                <span className="text-sm text-gray-500">
                  {formatTime(duration || 30)}
                </span>
              </div>
            </div>
          )}

          {!track.previewUrl && (
            <div className="mt-3 text-xs text-amber-600 bg-amber-50 px-3 py-2 rounded-lg inline-block">
              Preview mevcut değil
            </div>
          )}
        </div>

        {/* Spotify Link */}
        <a
          href={track.spotifyUrl}
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
