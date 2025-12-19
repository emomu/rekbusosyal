import React, { useEffect, useRef } from 'react';
import { PostShimmer } from './LoadingShimmer';

const LoadMoreButton = ({ onLoadMore, isLoading, hasMore }) => {
  const loaderRef = useRef(null);
  const loadedRef = useRef(false);

  // Intersection Observer ile otomatik yükleme
  useEffect(() => {
    if (!hasMore) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !isLoading && hasMore && !loadedRef.current) {
          loadedRef.current = true;
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
  }, [hasMore, isLoading, onLoadMore]);

  // Loading bitince yeni yüklemeye hazır ol
  useEffect(() => {
    if (!isLoading) {
      loadedRef.current = false;
    }
  }, [isLoading]);

  if (!hasMore) {
    return (
      <div className="py-8 text-center text-gray-400 text-sm">
        Tüm içerikleri gördün 🎉
      </div>
    );
  }

  return (
    <div ref={loaderRef}>
      {isLoading && (
        <div className="divide-y divide-gray-100">
          <PostShimmer />
          <PostShimmer />
        </div>
      )}
    </div>
  );
};

export default LoadMoreButton;
