import { useState, useEffect } from 'react';
import { useLoaderData, useNavigate, useOutletContext } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { ChevronLeft, MessageSquare, Lock, Send, Heart, Trash2 } from 'lucide-react';
import CampusRating from '../components/CampusRating';
import UserBadges from '../components/UserBadges';
import MobileHeader from '../components/MobileHeader';
import { API_URL } from '../config/api';
import {
  setCommunityComments,
  updateCommunityComment,
  addCommunityComment,
  deleteCommunityComment,
  updateCommunityVote
} from '../store/slices/postsSlice';
import {
  setCommunityCommentInput,
  setEditingComment,
  clearEditingComment
} from '../store/slices/uiSlice';

/**
 * CommunityDetailPage - Displays community details, ratings, and comments
 */
export default function CommunityDetailPage() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { setIsMobileMenuOpen, setShowNotifications, unreadCount } = useOutletContext();

  // Loader data includes community details and comments
  const loaderData = useLoaderData();

  // Handle loader error (null data)
  if (!loaderData) {
    return (
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="text-center">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
            Topluluk Bulunamadı
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            Bu topluluk mevcut değil veya erişim hatası oluştu.
          </p>
          <button
            onClick={() => navigate('/topluluklar')}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
          >
            Topluluklara Dön
          </button>
        </div>
      </div>
    );
  }

  const { community: initialCommunity, comments: initialComments } = loaderData;

  const [community, setCommunity] = useState(initialCommunity);

  const { userId, token } = useSelector((state) => state.auth);
  const { communityComments } = useSelector((state) => state.posts);
  const { communityCommentInput, editingCommentId, editingContent } = useSelector((state) => state.ui);

  // Initialize comments from loader
  useEffect(() => {
    if (initialComments) {
      dispatch(setCommunityComments(initialComments));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only run on mount

  // Check if user has voted
  const hasUserVotedCommunity = communityComments.some((c) => c.author?._id === userId);

  // Get vote badge details
  const getVoteBadgeDetails = (voteType) => {
    switch (voteType) {
      case 'positive':
        return { label: 'Öneriyor', color: 'bg-green-100 text-green-700 border border-green-200', icon: '👍' };
      case 'neutral':
        return { label: 'Nötr', color: 'bg-blue-100 text-blue-700 border border-blue-200', icon: '😐' };
      case 'negative':
        return { label: 'Önermiyor', color: 'bg-red-100 text-red-700 border border-red-200', icon: '👎' };
      default:
        return null;
    }
  };

  // Handle community vote
  const handleCommunityVote = async (communityId, type) => {
    try {
      const res = await fetch(`${API_URL}/api/community/${communityId}/vote`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type, token })
      });

      if (res.status === 429) {
        const data = await res.json();
        alert(`⏱️ ${data.error}\n${data.remainingSeconds} saniye sonra tekrar deneyebilirsin.`);
        return;
      }

      const data = await res.json();
      if (res.ok) {
        // Update community data
        setCommunity(data.community);
        dispatch(updateCommunityVote({ communityId, counts: data.community }));

        // Refresh comments immediately (backend auto-creates system comment)
        const commentsRes = await fetch(`${API_URL}/api/community/${communityId}/comments`);
        const commentsData = await commentsRes.json();
        dispatch(setCommunityComments(commentsData));
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Handle send comment
  const handleCommunitySendComment = async () => {
    if (!communityCommentInput.trim()) return;
    try {
      const res = await fetch(`${API_URL}/api/community/${community._id}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ content: communityCommentInput })
      });

      if (res.status === 429) {
        const data = await res.json();
        alert(`⏱️ ${data.error}\n${data.remainingSeconds} saniye sonra tekrar deneyebilirsin.`);
        return;
      }

      if (res.ok) {
        const updatedComment = await res.json();

        // Check if comment exists (update) or new (add)
        const exists = communityComments.some((c) => c._id === updatedComment._id);

        if (exists) {
          dispatch(updateCommunityComment(updatedComment));
        } else {
          dispatch(addCommunityComment(updatedComment));
        }

        dispatch(setCommunityCommentInput(''));
      } else {
        // Check if response is JSON before parsing
        const contentType = res.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
          const errorData = await res.json();
          alert(errorData.error || 'Yorum yapılamadı');
        } else {
          alert(`Yorum yapılamadı (${res.status})`);
        }
      }
    } catch (err) {
      console.error(err);
      alert('Bir hata oluştu');
    }
  };

  // Handle comment like
  const handleCommunityCommentLike = async (commentId) => {
    try {
      const res = await fetch(`${API_URL}/api/community/comments/${commentId}/like`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });
      if (res.ok) {
        const updatedComment = await res.json();
        dispatch(updateCommunityComment(updatedComment));
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Handle edit comment
  const handleEditCommunityComment = async (commentId) => {
    if (!editingContent.trim()) return;
    try {
      const res = await fetch(`${API_URL}/api/community/comments/${commentId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ content: editingContent })
      });
      if (res.ok) {
        const updatedComment = await res.json();
        dispatch(updateCommunityComment(updatedComment));
        dispatch(clearEditingComment());
      } else {
        // Check if response is JSON before parsing
        const contentType = res.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
          const errorData = await res.json();
          alert(errorData.error || 'Yorum düzenlenemedi');
        } else {
          alert(`Yorum düzenlenemedi (${res.status})`);
        }
      }
    } catch (err) {
      console.error(err);
      alert('Bir hata oluştu');
    }
  };

  // Handle delete comment
  const handleDeleteCommunityComment = async (commentId) => {
    if (!window.confirm('Bu yorumu silmek istediğinize emin misiniz?')) return;
    try {
      const res = await fetch(`${API_URL}/api/community/comments/${commentId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        dispatch(deleteCommunityComment(commentId));
      } else {
        const contentType = res.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
          const errorData = await res.json();
          alert(errorData.error || 'Yorum silinemedi');
        } else {
          alert(`Yorum silinemedi (${res.status})`);
        }
      }
    } catch (err) {
      console.error(err);
      alert('Bir hata oluştu');
    }
  };

  return (
    <div className="animate-in slide-in-from-right duration-300">
      <MobileHeader
        onMenuClick={setIsMobileMenuOpen}
        onNotificationsClick={setShowNotifications}
        unreadCount={unreadCount}
      />

      <header className="sticky top-0 z-10 bg-white/100 backdrop-blur-md border-b border-gray-200 p-4 flex items-center gap-3">
        <button
          onClick={() => navigate(-1)}
          className="p-2 hover:bg-gray-100 rounded-full transition"
        >
          <ChevronLeft />
        </button>
        <h2 className="font-bold text-lg">{community.name}</h2>
      </header>

      <div className="p-4">
        <CampusRating data={community} onVote={handleCommunityVote} />

        <div className="my-6 border-t border-gray-100 pt-6">
          <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
            <MessageSquare size={20} className="text-blue-600" />
            Yorumlar ({communityComments.length})
          </h3>

          {/* Comment Input */}
          <div className="mb-6 relative">
            {!hasUserVotedCommunity && (
              <div className="absolute inset-0 bg-white/60 backdrop-blur-[2px] z-10 flex items-center justify-center rounded-xl border border-dashed border-gray-300">
                <div className="flex items-center gap-2 text-gray-500 font-medium text-sm">
                  <Lock size={16} />
                  <span>Yorum yapmak için önce oy verin</span>
                </div>
              </div>
            )}
            <div
              className={`flex gap-2 transition-opacity ${
                !hasUserVotedCommunity ? 'opacity-40' : 'opacity-100'
              }`}
            >
              <input
                type="text"
                disabled={!hasUserVotedCommunity}
                value={communityCommentInput}
                onChange={(e) => dispatch(setCommunityCommentInput(e.target.value))}
                onKeyDown={(e) => e.key === 'Enter' && handleCommunitySendComment()}
                placeholder="Deneyimlerini paylaş..."
                className="flex-1 bg-gray-100 rounded-full px-5 py-3 text-sm outline-none focus:ring-2 focus:ring-blue-100 transition disabled:cursor-not-allowed"
              />
              <button
                onClick={handleCommunitySendComment}
                disabled={!hasUserVotedCommunity}
                className="bg-blue-900 text-white p-3 rounded-full hover:bg-blue-800 transition shadow-lg shadow-blue-900/20 disabled:bg-gray-300 disabled:shadow-none"
              >
                <Send size={18} />
              </button>
            </div>
          </div>

          {/* Comments List */}
          <div className="divide-y divide-gray-100">
            {communityComments.length > 0 ? (
              communityComments.map((comment) => {
                const isEditing = editingCommentId === comment._id;
                const isOwnComment = comment.author?._id === userId;
                const badge = getVoteBadgeDetails(comment.voteType);

                return (
                  <div key={comment._id} className="p-5 hover:bg-gray-50 transition rounded-xl">
                    <div className="flex items-start gap-3 mb-2">
                      <img
                        src={comment.author?.profilePicture || 'https://via.placeholder.com/40'}
                        className="w-10 h-10 bg-gray-200 rounded-full object-cover border border-gray-200"
                        alt={comment.author?.username}
                      />
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2 flex-wrap">
                            <div className="font-bold text-sm text-gray-900">
                              {comment.author?.username || 'Anonim'}
                            </div>
                            {comment.author?.badges && comment.author.badges.length > 0 && (
                              <UserBadges badges={comment.author.badges} size="sm" />
                            )}
                            {badge && (
                              <span
                                className={`text-[10px] px-2 py-0.5 rounded-full font-medium flex items-center gap-1 shadow-sm ${badge.color}`}
                              >
                                {badge.icon} {badge.label}
                              </span>
                            )}
                          </div>
                          <div className="text-xs text-gray-400">
                            {new Date(comment.createdAt).toLocaleDateString('tr-TR')}
                          </div>
                        </div>

                        {isEditing ? (
                          <div className="mb-3 mt-2">
                            <textarea
                              value={editingContent}
                              onChange={(e) =>
                                dispatch(
                                  setEditingComment({ id: editingCommentId, content: e.target.value })
                                )
                              }
                              className="w-full bg-white border border-gray-300 rounded-lg px-4 py-2 text-sm outline-none resize-none"
                              rows={3}
                            />
                            <div className="flex gap-2 mt-2">
                              <button
                                onClick={() => handleEditCommunityComment(comment._id)}
                                className="bg-blue-900 text-white px-3 py-1.5 rounded-lg text-xs font-medium"
                              >
                                Kaydet
                              </button>
                              <button
                                onClick={() => dispatch(clearEditingComment())}
                                className="bg-gray-200 text-gray-700 px-3 py-1.5 rounded-lg text-xs font-medium"
                              >
                                İptal
                              </button>
                            </div>
                          </div>
                        ) : (
                          <p className="text-gray-800 text-sm mt-1 whitespace-pre-wrap">{comment.content}</p>
                        )}

                        <div className="flex items-center gap-4 mt-3">
                          <button
                            onClick={() => handleCommunityCommentLike(comment._id)}
                            className={`flex items-center gap-1.5 transition-colors ${
                              comment.likes?.includes(userId)
                                ? 'text-red-500'
                                : 'text-gray-400 hover:text-red-500'
                            }`}
                          >
                            <Heart
                              size={20}
                              className={comment.likes?.includes(userId) ? 'fill-current' : ''}
                            />
                            <span className="text-xs font-medium">{comment.likes?.length || 0}</span>
                          </button>
                          {isOwnComment && !isEditing && (
                            <>
                              <button
                                onClick={() =>
                                  dispatch(setEditingComment({ id: comment._id, content: comment.content }))
                                }
                                className="text-xs text-gray-500 hover:text-blue-600 font-medium"
                              >
                                Düzenle
                              </button>
                              <button
                                onClick={() => handleDeleteCommunityComment(comment._id)}
                                className="flex items-center gap-1 text-xs text-gray-500 hover:text-red-600 font-medium"
                              >
                                <Trash2 size={14} />
                                Sil
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="text-center text-gray-400 py-12 text-sm bg-gray-50/50 rounded-xl mt-4 border border-dashed border-gray-200">
                <MessageSquare size={32} className="mx-auto mb-3 opacity-30" />
                <p>Henüz yorum yok.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
