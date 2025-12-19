import React from 'react';
import { Play } from 'lucide-react';

/**
 * VideoPreview - Simple video thumbnail with play button
 */
const VideoPreview = ({ url, onClick }) => {
  return (
    <div
      className="relative w-full h-full bg-black cursor-pointer"
      onClick={onClick}
      style={{ minHeight: '200px', overflow: 'visible', position: 'relative' }}
    >
      {/* Video thumbnail */}
      <video
        src={`${url}#t=0.1`}
        className="w-full h-full object-contain"
        muted
        playsInline
        preload="metadata"
        style={{
          display: 'block',
          width: '100%',
          height: '100%'
        }}
      />

      {/* Play button overlay - ALWAYS ON TOP */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 10,
          pointerEvents: 'none'
        }}
      >
        <div
          style={{
            width: '64px',
            height: '64px',
            backgroundColor: 'rgba(255, 255, 255, 0.95)',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.4)'
          }}
        >
          <Play
            size={28}
            fill="currentColor"
            className="text-gray-900"
            style={{ marginLeft: '3px' }}
          />
        </div>
      </div>

      {/* VIDEO badge */}
      <div
        style={{
          position: 'absolute',
          bottom: '12px',
          right: '12px',
          padding: '6px 12px',
          backgroundColor: 'rgba(0, 0, 0, 0.8)',
          borderRadius: '6px',
          fontSize: '12px',
          fontWeight: 'bold',
          color: 'white',
          zIndex: 99999
        }}
      >
        VIDEO
      </div>
    </div>
  );
};

export default VideoPreview;
