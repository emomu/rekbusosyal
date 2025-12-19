import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { User, MessageSquare, MoreHorizontal, Edit2, Trash2, Loader2 } from 'lucide-react';
import LikeButton from './LikeButton';
import UserBadges from './UserBadges';
import MediaDisplay from './MediaDisplay';
import { setSelectedImage, addToast } from '../store/slices/uiSlice';
import { API_URL } from '../config/api';
import { ensureHttps } from '../utils/imageUtils';

export default function Post({ post, onLike, onDelete, onUpdate, showMoreHorizontal = true, postUrlPrefix = '/akis' }) {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { userId: currentUserId, token } = useSelector((state) => state.auth);

  const [menuOpen, setMenuOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingContent, setEditingContent] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const isOwnPost = post.author?._id === currentUserId;

  const timeAgo = (date) => {
    const seconds = Math.floor((new Date() - new Date(date)) / 1000);
    let interval = seconds / 31536000;
    if (interval > 1) return Math.floor(interval) + ' yıl';
    interval = seconds / 2592000;
    if (interval > 1) return Math.floor(interval) + ' ay';
    interval = seconds / 86400;
    if (interval > 1) return Math.floor(interval) + ' gün';
    interval = seconds / 3600;
    if (interval > 1) return Math.floor(interval) + ' saat';
    interval = seconds / 60;
    if (interval > 1) return Math.floor(interval) + ' dakika';
    return Math.floor(seconds) + ' saniye';
  };

  const renderWithMentions = (text) => {
    if (!text) return null;
    const parts = text.split(/(@[\w.-]+)/g);
    return parts.map((part, index) => {
      if (part.startsWith('@')) {
        const username = part.slice(1);
        return (
          <span
            key={index}
            onClick={(e) => {
              e.stopPropagation();
              navigate(`/kullanici/${username}`);
            }}
            className="text-blue-600 font-bold hover:underline cursor-pointer"
          >
            {part}
          </span>
        );
      }
      return <span key={index}>{part}</span>;
    });
  };

  const handleEditPost = () => {
    setIsEditing(true);
    setEditingContent(post.content);
    setMenuOpen(false);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditingContent('');
  };

  const handleSaveEdit = async () => {
    if (!editingContent.trim()) {
      dispatch(addToast({ message: 'Post içeriği boş olamaz', type: 'error' }));
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/posts/${post._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ content: editingContent })
      });

      if (res.ok) {
        const updatedPost = await res.json();
        if (onUpdate) onUpdate(updatedPost);
        setIsEditing(false);
        setEditingContent('');
        dispatch(addToast({ message: 'Post başarıyla güncellendi', type: 'success' }));
      } else {
        const error = await res.json();
        dispatch(addToast({ message: error.error || 'Post güncellenemedi', type: 'error' }));
      }
    } catch (err) {
      console.error(err);
      dispatch(addToast({ message: 'Bir hata oluştu', type: 'error' }));
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeletePost = async () => {
    if (!window.confirm('Bu postu silmek istediğinize emin misiniz? Bu işlem geri alınamaz.')) return;

    setIsLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/posts/${post._id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (res.ok) {
        if (onDelete) onDelete(post._id);
        dispatch(addToast({ message: 'Post başarıyla silindi', type: 'success' }));
      } else {
        const error = await res.json();
        dispatch(addToast({ message: error.error || 'Post silinemedi', type: 'error' }));
      }
    } catch (err) {
      console.error(err);
      dispatch(addToast({ message: 'Bir hata oluştu', type: 'error' }));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white border-b border-gray-100 hover:bg-gray-50 transition cursor-pointer">
      <div
        onClick={() => navigate(`${postUrlPrefix}/${post._id}`)}
        className="p-4"
      >
        {/* Header */}
        <div className="flex items-start gap-3 mb-3">
          <div
            onClick={(e) => {
              e.stopPropagation();
              if (post.author?.username) {
                navigate(`/kullanici/${post.author.username}`);
              }
            }}
            className="cursor-pointer hover:opacity-80 transition"
          >
            {post.author?.profilePicture ? (
              <img
                src={ensureHttps(post.author.profilePicture)}
                alt={post.author.username}
                className="w-10 h-10 rounded-full object-cover"
              />
            ) : (
              <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                <User size={20} className="text-gray-500" />
              </div>
            )}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 overflow-hidden">
                <span
                  onClick={(e) => {
                    e.stopPropagation();
                    if (post.author?.username) {
                      navigate(`/kullanici/${post.author.username}`);
                    }
                  }}
                  className="font-bold text-gray-900 truncate hover:underline"
                >
                  {post.author?.fullName || post.author?.username || 'Anonim'}
                </span>
                {post.author?.badges && post.author.badges.length > 0 && (
                  <UserBadges badges={post.author.badges} size="sm" />
                )}
                <span className="text-gray-500 text-sm">· {timeAgo(post.createdAt)}</span>
              </div>

              {isOwnPost && showMoreHorizontal && (
                <div className="relative" onClick={(e) => e.stopPropagation()}>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setMenuOpen(!menuOpen);
                    }}
                    className="text-gray-400 hover:text-blue-500 transition p-1"
                  >
                    <MoreHorizontal size={20} />
                  </button>
                  {menuOpen && (
                    <div className="absolute right-0 top-8 bg-white shadow-lg border border-gray-100 rounded-lg py-1 z-10 w-32">
                      <button
                        onClick={handleEditPost}
                        disabled={isLoading}
                        className="flex items-center gap-2 w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <Edit2 size={14} /> Düzenle
                      </button>
                      <button
                        onClick={handleDeletePost}
                        disabled={isLoading}
                        className="flex items-center gap-2 w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {isLoading ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                        {isLoading ? 'Siliniyor...' : 'Sil'}
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Content */}
            {isEditing ? (
              <div className="mt-2 space-y-2" onClick={(e) => e.stopPropagation()}>
                <textarea
                  value={editingContent}
                  onChange={(e) => setEditingContent(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={3}
                  autoFocus
                />
                <div className="flex gap-2">
                  <button
                    onClick={handleSaveEdit}
                    disabled={isLoading}
                    className="px-3 py-1 bg-blue-500 text-white rounded-full text-sm font-medium hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
                  >
                    {isLoading && <Loader2 size={14} className="animate-spin" />}
                    {isLoading ? 'Kaydediliyor...' : 'Kaydet'}
                  </button>
                  <button
                    onClick={handleCancelEdit}
                    disabled={isLoading}
                    className="px-3 py-1 bg-gray-200 text-gray-700 rounded-full text-sm font-medium hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    İptal
                  </button>
                </div>
              </div>
            ) : (
              <div className="text-gray-900 mt-1 whitespace-pre-wrap text-base break-words">
                {renderWithMentions(post.content)}
              </div>
            )}

            {/* Media */}
            {!isEditing && post.media && post.media.length > 0 && (
              <div className="mt-3" onClick={(e) => e.stopPropagation()}>
                <MediaDisplay media={post.media} onImageClick={(url) => dispatch(setSelectedImage(url))} />
              </div>
            )}

            {/* Actions */}
            {!isEditing && (
              <div className="flex items-center gap-6 mt-3">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    if (onLike) onLike(post._id);
                  }}
                  className="flex items-center gap-1 text-gray-500 hover:text-blue-500 text-sm"
                >
                  <MessageSquare size={18} />
                  {post.commentCount > 0 && <span>{post.commentCount}</span>}
                </button>

                <div onClick={(e) => e.stopPropagation()}>
                  <LikeButton
                    isLiked={post.likes?.includes(currentUserId)}
                    likeCount={post.likes?.length || 0}
                    onClick={(e) => {
                      e?.stopPropagation();
                      if (onLike) onLike(post._id);
                    }}
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
