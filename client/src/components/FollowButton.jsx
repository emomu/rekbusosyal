import React, { useState } from 'react';
import { UserPlus, UserCheck, Clock } from 'lucide-react';

const FollowButton = ({ userId, isFollowing, isPending, onFollow, onUnfollow }) => {
  const [isHovered, setIsHovered] = useState(false);

  const handleClick = () => {
    if (isFollowing) {
      onUnfollow(userId);
    } else {
      onFollow(userId);
    }
  };

  // Pending state - Takip isteği gönderilmiş
  if (isPending) {
    return (
      <button
        onClick={handleClick}
        className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-full text-sm font-medium hover:bg-gray-200 transition"
      >
        <Clock size={16} />
        <span>İstek Gönderildi</span>
      </button>
    );
  }

  // Following state
  if (isFollowing) {
    return (
      <button
        onClick={handleClick}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition ${
          isHovered
            ? 'bg-red-50 text-red-600 border border-red-200'
            : 'bg-gray-100 text-gray-700 border border-gray-200'
        }`}
      >
        <UserCheck size={16} />
        <span>{isHovered ? 'Takibi Bırak' : 'Takip Ediliyor'}</span>
      </button>
    );
  }

  // Not following - Default state
  return (
    <button
      onClick={handleClick}
      className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-full text-sm font-medium hover:bg-blue-700 transition shadow-sm"
    >
      <UserPlus size={16} />
      <span>Takip Et</span>
    </button>
  );
};

export default FollowButton;
