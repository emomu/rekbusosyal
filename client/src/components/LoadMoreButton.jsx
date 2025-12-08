import React, { useEffect, useRef, useState } from 'react';
import Lottie from 'lottie-react';
import loaderAnimation from '../assets/loader.json';

const LoadMoreButton = ({ onLoadMore, isLoading, hasMore }) => {
  const loaderRef = useRef(null);
  const [hasTriggered, setHasTriggered] = useState(false);

  // Intersection Observer ile otomatik yükleme
  useEffect(() => {
    if (!hasMore || isLoading || hasTriggered) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !isLoading && !hasTriggered) {
          setHasTriggered(true);
          onLoadMore();
        }
      },
      { threshold: 0.1 }
    );

    if (loaderRef.current) {
      observer.observe(loaderRef.current);
    }

    return () => {
      if (loaderRef.current) {
        observer.unobserve(loaderRef.current);
      }
    };
  }, [hasMore, isLoading, onLoadMore, hasTriggered]);

  // Loading bitince trigger'ı resetle
  useEffect(() => {
    if (!isLoading && hasTriggered) {
      setHasTriggered(false);
    }
  }, [isLoading, hasTriggered]);

  if (!hasMore) {
    return (
      <div className="py-8 text-center text-gray-400 text-sm">
        Tüm içerikleri gördün 🎉
      </div>
    );
  }

  return (
    <div ref={loaderRef} className="py-8 flex justify-center">
      {isLoading && (
        <div className="w-16 h-16">
          <Lottie animationData={loaderAnimation} loop={true} />
        </div>
      )}
    </div>
  );
};

export default LoadMoreButton;
