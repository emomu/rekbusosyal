import { Heart } from 'lucide-react';
import { useState } from 'react';

const LikeButton = ({ isLiked, likeCount, onClick }) => {
  const [isAnimating, setIsAnimating] = useState(false);
  const [particles, setParticles] = useState([]);

  const handleClick = (e) => {
    if (!isLiked) {
      setIsAnimating(true);

      // Parçacık efekti oluştur
      const newParticles = Array.from({ length: 8 }, (_, i) => ({
        id: Date.now() + i,
        angle: (i * 360) / 8,
      }));
      setParticles(newParticles);

      // Animasyonları temizle
      setTimeout(() => {
        setIsAnimating(false);
        setParticles([]);
      }, 600);
    }

    onClick();
  };

  return (
    <button
      onClick={handleClick}
      className="relative flex items-center gap-1.5 transition-colors group"
    >
      {/* Parçacık efektleri */}
      {particles.map((particle) => (
        <div
          key={particle.id}
          className="absolute pointer-events-none"
          style={{
            left: '50%',
            top: '50%',
            transform: 'translate(-50%, -50%)',
          }}
        >
          <div
            className="absolute w-1 h-1 bg-red-500 rounded-full animate-particle-burst"
            style={{
              '--angle': `${particle.angle}deg`,
              animation: 'particleBurst 0.6s ease-out forwards',
            }}
          />
        </div>
      ))}

      {/* Patlama dalgası */}
      {isAnimating && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="absolute w-8 h-8 bg-red-500/30 rounded-full animate-burst-wave" />
        </div>
      )}

      {/* Kalp ikonu */}
      <div className={`relative ${isAnimating ? 'animate-heart-pop' : ''}`}>
        <Heart
          size={18}
          className={`transition-all duration-300 ${
            isLiked
              ? 'fill-red-500 text-red-500 scale-100'
              : 'text-gray-400 group-hover:text-red-400 group-hover:scale-110'
          }`}
        />

        {/* Parlama efekti */}
        {isAnimating && (
          <>
            <div className="absolute inset-0 animate-heart-sparkle-1">
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-0.5 h-2 bg-yellow-300 rounded-full" />
            </div>
            <div className="absolute inset-0 animate-heart-sparkle-2">
              <div className="absolute top-1/2 right-0 -translate-y-1/2 w-2 h-0.5 bg-yellow-300 rounded-full" />
            </div>
            <div className="absolute inset-0 animate-heart-sparkle-3">
              <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-0.5 h-2 bg-yellow-300 rounded-full" />
            </div>
            <div className="absolute inset-0 animate-heart-sparkle-4">
              <div className="absolute top-1/2 left-0 -translate-y-1/2 w-2 h-0.5 bg-yellow-300 rounded-full" />
            </div>
          </>
        )}
      </div>

      {/* Like sayısı */}
      <span
        className={`text-xs font-medium transition-all duration-300 ${
          isLiked ? 'text-red-500' : 'text-gray-400 group-hover:text-red-400'
        } ${isAnimating ? 'animate-like-count-pop' : ''}`}
      >
        {likeCount}
      </span>

      <style jsx>{`
        @keyframes particleBurst {
          0% {
            transform: translate(0, 0) scale(1);
            opacity: 1;
          }
          100% {
            transform: translate(
              calc(cos(var(--angle)) * 30px),
              calc(sin(var(--angle)) * 30px)
            ) scale(0);
            opacity: 0;
          }
        }

        @keyframes burstWave {
          0% {
            transform: scale(0.5);
            opacity: 0.8;
          }
          100% {
            transform: scale(3);
            opacity: 0;
          }
        }

        @keyframes heartPop {
          0% {
            transform: scale(1);
          }
          25% {
            transform: scale(1.3) rotate(-10deg);
          }
          50% {
            transform: scale(1.4) rotate(10deg);
          }
          75% {
            transform: scale(1.2) rotate(-5deg);
          }
          100% {
            transform: scale(1) rotate(0deg);
          }
        }

        @keyframes heartSparkle1 {
          0%, 100% {
            transform: scale(0) translateY(0);
            opacity: 0;
          }
          50% {
            transform: scale(1) translateY(-8px);
            opacity: 1;
          }
        }

        @keyframes heartSparkle2 {
          0%, 100% {
            transform: scale(0) translateX(0);
            opacity: 0;
          }
          50% {
            transform: scale(1) translateX(8px);
            opacity: 1;
          }
        }

        @keyframes heartSparkle3 {
          0%, 100% {
            transform: scale(0) translateY(0);
            opacity: 0;
          }
          50% {
            transform: scale(1) translateY(8px);
            opacity: 1;
          }
        }

        @keyframes heartSparkle4 {
          0%, 100% {
            transform: scale(0) translateX(0);
            opacity: 0;
          }
          50% {
            transform: scale(1) translateX(-8px);
            opacity: 1;
          }
        }

        @keyframes likeCountPop {
          0%, 100% {
            transform: scale(1);
          }
          50% {
            transform: scale(1.2);
          }
        }

        .animate-particle-burst {
          animation: particleBurst 0.6s ease-out forwards;
        }

        .animate-burst-wave {
          animation: burstWave 0.6s ease-out forwards;
        }

        .animate-heart-pop {
          animation: heartPop 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275);
        }

        .animate-heart-sparkle-1 {
          animation: heartSparkle1 0.6s ease-out forwards;
        }

        .animate-heart-sparkle-2 {
          animation: heartSparkle2 0.6s ease-out forwards 0.1s;
        }

        .animate-heart-sparkle-3 {
          animation: heartSparkle3 0.6s ease-out forwards 0.2s;
        }

        .animate-heart-sparkle-4 {
          animation: heartSparkle4 0.6s ease-out forwards 0.15s;
        }

        .animate-like-count-pop {
          animation: likeCountPop 0.3s ease-out;
        }
      `}</style>
    </button>
  );
};

export default LikeButton;
