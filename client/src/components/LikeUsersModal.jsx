import React, { useState, useEffect } from 'react';
import { X, Heart } from 'lucide-react';
import { API_URL } from '../config/api';
import { ensureHttps } from '../utils/imageUtils';
import UserBadges from './UserBadges';
import { useNavigate } from 'react-router-dom';

export default function LikeUsersModal({ isOpen, onClose, itemId, type }) {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const token = localStorage.getItem('token');

  useEffect(() => {
    if (!isOpen || !itemId) return;

    const fetchLikeUsers = async () => {
      try {
        setLoading(true);
        const endpoint = type === 'post'
          ? `/api/posts/${itemId}/likes`
          : `/api/comments/${itemId}/likes`;

        const res = await fetch(`${API_URL}${endpoint}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });

        const data = await res.json();
        setUsers(data.users || []);
      } catch (err) {
        console.error('Like kullanıcıları getirme hatası:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchLikeUsers();
  }, [isOpen, itemId, type, token]);

  const handleUserClick = (username) => {
    navigate(`/${username}`);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-md w-full max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-gray-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Heart size={20} className="text-red-500" fill="currentColor" />
            <h3 className="text-lg font-bold text-gray-900">Beğenenler</h3>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition"
          >
            <X size={20} className="text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : users.length === 0 ? (
            <div className="text-center py-12">
              <Heart size={48} className="text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">Henüz kimse beğenmedi</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {users.map((user) => (
                <div
                  key={user._id}
                  onClick={() => handleUserClick(user.username)}
                  className="p-4 hover:bg-gray-50 cursor-pointer transition flex items-center gap-3"
                >
                  {user.profilePicture ? (
                    <img
                      src={ensureHttps(user.profilePicture)}
                      alt={user.fullName}
                      className="w-12 h-12 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                      <span className="text-white font-bold text-lg">
                        {user.fullName?.charAt(0)?.toUpperCase() || 'U'}
                      </span>
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-semibold text-gray-900 truncate">{user.fullName}</p>
                      {user.badges && user.badges.length > 0 && (
                        <UserBadges badges={user.badges} size="sm" />
                      )}
                    </div>
                    <p className="text-sm text-gray-500 truncate">@{user.username}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
