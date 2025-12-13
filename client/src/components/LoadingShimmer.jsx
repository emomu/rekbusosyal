import React from 'react';

// Shimmer Base Component
const ShimmerBase = ({ className = "", width = "100%", height = "20px", borderRadius = "8px" }) => (
  <div
    className={`animate-pulse bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 ${className}`}
    style={{
      width,
      height,
      borderRadius,
      backgroundSize: '200% 100%',
    }}
  />
);

// Post/Confession Shimmer - Gerçek post boyutlarına uygun
export const PostShimmer = () => (
  <div className="p-5 hover:bg-gray-50/50 transition">
    <div className="flex items-center gap-3 mb-2">
      <ShimmerBase width="36px" height="36px" borderRadius="50%" />
      <div className="flex-1">
        <ShimmerBase width="110px" height="13px" className="mb-1.5" borderRadius="4px" />
        <ShimmerBase width="75px" height="11px" borderRadius="4px" />
      </div>
    </div>
    <ShimmerBase width="100%" height="14px" className="mb-2" borderRadius="4px" />
    <ShimmerBase width="92%" height="14px" className="mb-2" borderRadius="4px" />
    <ShimmerBase width="65%" height="14px" className="mb-3" borderRadius="4px" />
    <div className="flex items-center gap-2">
      <ShimmerBase width="50px" height="18px" borderRadius="6px" />
    </div>
  </div>
);

// Campus/Community Card Shimmer
export const CardShimmer = () => (
  <div className="border border-gray-200 p-6 rounded-2xl bg-white">
    <div className="flex items-start justify-between mb-4">
      <div className="flex-1">
        <ShimmerBase width="200px" height="22px" className="mb-2" borderRadius="6px" />
        <ShimmerBase width="130px" height="13px" borderRadius="4px" />
      </div>
      <ShimmerBase width="28px" height="28px" borderRadius="50%" />
    </div>
    <div className="mb-3">
      <div className="flex justify-between mb-2">
        <ShimmerBase width="50px" height="12px" borderRadius="4px" />
        <ShimmerBase width="50px" height="12px" borderRadius="4px" />
        <ShimmerBase width="50px" height="12px" borderRadius="4px" />
      </div>
      <ShimmerBase width="100%" height="12px" borderRadius="9999px" />
    </div>
    <ShimmerBase width="140px" height="13px" borderRadius="4px" />
  </div>
);

// Comment Shimmer
export const CommentShimmer = () => (
  <div className="p-5 hover:bg-gray-50 transition rounded-xl">
    <div className="flex items-start gap-3">
      <ShimmerBase width="40px" height="40px" borderRadius="50%" />
      <div className="flex-1">
        <div className="flex items-center justify-between mb-2">
          <ShimmerBase width="110px" height="13px" borderRadius="4px" />
          <ShimmerBase width="80px" height="11px" borderRadius="4px" />
        </div>
        <ShimmerBase width="100%" height="13px" className="mb-2" borderRadius="4px" />
        <ShimmerBase width="85%" height="13px" className="mb-3" borderRadius="4px" />
        <div className="flex items-center gap-4">
          <ShimmerBase width="45px" height="16px" borderRadius="6px" />
        </div>
      </div>
    </div>
  </div>
);

// Advertisement Shimmer
export const AdShimmer = () => (
  <div className="p-5 hover:bg-gray-50/50 transition">
    <div className="flex items-center justify-between mb-3">
      <div className="flex items-center gap-2">
        <ShimmerBase width="36px" height="36px" borderRadius="50%" />
        <div>
          <ShimmerBase width="120px" height="13px" className="mb-1" borderRadius="4px" />
          <ShimmerBase width="70px" height="11px" borderRadius="4px" />
        </div>
      </div>
      <ShimmerBase width="60px" height="20px" borderRadius="6px" />
    </div>
    <ShimmerBase width="100%" height="14px" className="mb-2" borderRadius="4px" />
    <ShimmerBase width="88%" height="14px" className="mb-3" borderRadius="4px" />
    <ShimmerBase width="100%" height="280px" borderRadius="16px" className="mb-3" />
    <div className="flex gap-2">
      <ShimmerBase width="70px" height="20px" borderRadius="9999px" />
      <ShimmerBase width="85px" height="20px" borderRadius="9999px" />
    </div>
  </div>
);

// Feed Shimmer (Multiple Posts)
export const FeedShimmer = ({ count = 3 }) => (
  <div className="divide-y divide-gray-100">
    {Array.from({ length: count }).map((_, i) => (
      <PostShimmer key={i} />
    ))}
  </div>
);

// Campus/Community Grid Shimmer
export const GridShimmer = ({ count = 4 }) => (
  <div className="p-6 grid gap-5">
    {Array.from({ length: count }).map((_, i) => (
      <CardShimmer key={i} />
    ))}
  </div>
);

// Comments List Shimmer
export const CommentsShimmer = ({ count = 3 }) => (
  <div className="divide-y divide-gray-100">
    {Array.from({ length: count }).map((_, i) => (
      <CommentShimmer key={i} />
    ))}
  </div>
);

export default ShimmerBase;