import { useEffect, useRef, useState } from 'react';

export function usePullToRefresh(onRefresh) {
  const [isPulling, setIsPulling] = useState(false);
  const [pullDistance, setPullDistance] = useState(0);
  const startY = useRef(0);
  const containerRef = useRef(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let touchStartY = 0;
    let isAtTop = false;

    const handleTouchStart = (e) => {
      // Sadece sayfa en üstteyken çalış
      isAtTop = container.scrollTop === 0;
      if (isAtTop) {
        touchStartY = e.touches[0].clientY;
        startY.current = touchStartY;
      }
    };

    const handleTouchMove = (e) => {
      if (!isAtTop) return;

      const touchY = e.touches[0].clientY;
      const distance = touchY - touchStartY;

      // Sadece aşağı çekiliyorsa
      if (distance > 0) {
        // Maksimum 120px çekilebilir, sonrası yavaşlar
        const maxPull = 120;
        const dampening = 0.5;
        const actualDistance = Math.min(distance * dampening, maxPull);

        setPullDistance(actualDistance);
        setIsPulling(actualDistance > 60); // 60px'den fazla çekilince aktif

        // Scroll'u engelle
        if (actualDistance > 10) {
          e.preventDefault();
        }
      }
    };

    const handleTouchEnd = () => {
      if (isPulling && pullDistance > 60) {
        // Yenileme tetiklendi
        onRefresh();
      }

      // Reset
      setPullDistance(0);
      setIsPulling(false);
      isAtTop = false;
    };

    container.addEventListener('touchstart', handleTouchStart, { passive: true });
    container.addEventListener('touchmove', handleTouchMove, { passive: false });
    container.addEventListener('touchend', handleTouchEnd, { passive: true });

    return () => {
      container.removeEventListener('touchstart', handleTouchStart);
      container.removeEventListener('touchmove', handleTouchMove);
      container.removeEventListener('touchend', handleTouchEnd);
    };
  }, [isPulling, pullDistance, onRefresh]);

  return { containerRef, isPulling, pullDistance };
}
