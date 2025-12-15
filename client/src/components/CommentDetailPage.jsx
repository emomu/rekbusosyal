import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLoaderData } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { ChevronLeft, MessageSquare, User, MoreHorizontal, Trash2, Share2, Heart } from 'lucide-react';
import { API_URL } from '../config/api';
import { useToast } from '../hooks/useToast';
import { ToastContainer } from './Toast';
import { ensureHttps } from '../utils/imageUtils';
import UserBadges from './UserBadges';

// --- LIKE BUTONU BİLEŞENİ ---
const LikeButton = ({ isLiked, likeCount, onClick }) => {
  const [isAnimating, setIsAnimating] = useState(false);
  const [particles, setParticles] = useState([]);

  const handleClick = (e) => {
    if (e && e.stopPropagation) e.stopPropagation();

    if (!isLiked) {
      setIsAnimating(true);
      const newParticles = Array.from({ length: 8 }, (_, i) => ({
        id: Date.now() + i,
        angle: (i * 360) / 8,
      }));
      setParticles(newParticles);

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
      className="relative flex items-center gap-1.5 transition-colors group p-2"
    >
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

      {isAnimating && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="absolute w-8 h-8 bg-red-500/30 rounded-full animate-burst-wave" />
        </div>
      )}

      <div className={`relative ${isAnimating ? 'animate-heart-pop' : ''}`}>
        <Heart
          size={22}
          className={`transition-all duration-300 ${isLiked
            ? 'fill-red-500 text-red-500 scale-100'
            : 'text-gray-500 group-hover:text-red-500 group-hover:scale-110'
            }`}
        />
        {isAnimating && (
          <>
            <div className="absolute inset-0 animate-heart-sparkle-1"><div className="absolute top-0 left-1/2 -translate-x-1/2 w-0.5 h-2 bg-yellow-300 rounded-full" /></div>
            <div className="absolute inset-0 animate-heart-sparkle-2"><div className="absolute top-1/2 right-0 -translate-y-1/2 w-2 h-0.5 bg-yellow-300 rounded-full" /></div>
            <div className="absolute inset-0 animate-heart-sparkle-3"><div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-0.5 h-2 bg-yellow-300 rounded-full" /></div>
            <div className="absolute inset-0 animate-heart-sparkle-4"><div className="absolute top-1/2 left-0 -translate-y-1/2 w-2 h-0.5 bg-yellow-300 rounded-full" /></div>
          </>
        )}
      </div>

      <span
        className={`text-sm font-medium transition-all duration-300 ${isLiked ? 'text-red-500' : 'text-gray-500 group-hover:text-red-500'
          } ${isAnimating ? 'animate-like-count-pop' : ''}`}
      >
        {likeCount > 0 ? likeCount : ''}
      </span>

      <style>{`

        @keyframes burstWave {
          0% { transform: scale(0.5); opacity: 0.8; }
          100% { transform: scale(3); opacity: 0; }
        }
        @keyframes heartPop {
          0% { transform: scale(1); }
          25% { transform: scale(1.3) rotate(-10deg); }
          50% { transform: scale(1.4) rotate(10deg); }
          75% { transform: scale(1.2) rotate(-5deg); }
          100% { transform: scale(1) rotate(0deg); }
        }
        @keyframes heartSparkle1 { 0%, 100% { transform: scale(0) translateY(0); opacity: 0; } 50% { transform: scale(1) translateY(-8px); opacity: 1; } }
        @keyframes heartSparkle2 { 0%, 100% { transform: scale(0) translateX(0); opacity: 0; } 50% { transform: scale(1) translateX(8px); opacity: 1; } }
        @keyframes heartSparkle3 { 0%, 100% { transform: scale(0) translateY(0); opacity: 0; } 50% { transform: scale(1) translateY(8px); opacity: 1; } }
        @keyframes heartSparkle4 { 0%, 100% { transform: scale(0) translateX(0); opacity: 0; } 50% { transform: scale(1) translateX(-8px); opacity: 1; } }
        @keyframes likeCountPop { 0%, 100% { transform: scale(1); } 50% { transform: scale(1.2); } }
        .animate-particle-burst { animation: particleBurst 0.6s ease-out forwards; }
        .animate-burst-wave { animation: burstWave 0.6s ease-out forwards; }
        .animate-heart-pop { animation: heartPop 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275); }
        .animate-heart-sparkle-1 { animation: heartSparkle1 0.6s ease-out forwards; }
        .animate-heart-sparkle-2 { animation: heartSparkle2 0.6s ease-out forwards 0.1s; }
        .animate-heart-sparkle-3 { animation: heartSparkle3 0.6s ease-out forwards 0.2s; }
        .animate-heart-sparkle-4 { animation: heartSparkle4 0.6s ease-out forwards 0.15s; }
        .animate-like-count-pop { animation: likeCountPop 0.3s ease-out; }
        @keyframes particleBurst {
    0% { transform: translate(0, 0) scale(1); opacity: 1; }
    100% { transform: translate(calc(cos(var(--angle)) * 30px), calc(sin(var(--angle)) * 30px)) scale(0); opacity: 0; }
  }
      `}</style>
    </button>
  );
};

// --- ANA COMPONENT (COMMENT DETAIL PAGE) ---

export default function CommentDetailPage() {
  const navigate = useNavigate();
  const toast = useToast();
  const initialComment = useLoaderData();
  const { userId: currentUserId, token } = useSelector((state) => state.auth);

  const [comment, setComment] = useState(initialComment);
  const [replies, setReplies] = useState([]);
  const [newReply, setNewReply] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [menuOpen, setMenuOpen] = useState(null);
  const [currentUserProfilePic, setCurrentUserProfilePic] = useState(null);

  // Yerel State - Ana yorum için
  const [isLiked, setIsLiked] = useState(comment?.likes?.includes(currentUserId) || false);
  const [likeCount, setLikeCount] = useState(comment?.likes?.length || 0);

  const replyInputRef = useRef(null);

  // Fetch current user profile picture
  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        const res = await fetch(`${API_URL}/api/profile`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          setCurrentUserProfilePic(data.profilePicture);
        }
      } catch (err) {
        console.error('Error fetching profile:', err);
      }
    };

    if (token) {
      fetchUserProfile();
    }
  }, [token]);

  useEffect(() => {
    fetchReplies();
    window.scrollTo(0, 0);
  }, []);

  // Ana yorumun like durumunu senkronize et
  useEffect(() => {
    if (comment) {
      setIsLiked(comment.likes?.includes(currentUserId) || false);
      setLikeCount(comment.likes?.length || 0);
    }
  }, [comment, currentUserId]);

  const handleLikeToggle = () => {
    const nextIsLiked = !isLiked;
    setIsLiked(nextIsLiked);
    setLikeCount((prev) => nextIsLiked ? prev + 1 : prev - 1);

    // API çağrısı
    handleLikeComment(comment._id);
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
      return part;
    });
  };

  const fetchReplies = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_URL}/api/comments/${comment._id}/replies`);
      const data = await res.json();
      if (res.ok) {
        setReplies(data);
      }
    } catch (err) {
      console.error('Cevaplar yüklenemedi:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitReply = async (e) => {
    e.preventDefault();
    if (!newReply.trim()) return;

    try {
      setSubmitting(true);
      const res = await fetch(`${API_URL}/api/comments/${comment._id}/replies`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ content: newReply })
      });

      const data = await res.json();

      if (res.status === 429) {
        toast.error(`${data.error || 'Çok fazla istek'}. ${data.remainingSeconds || 60} saniye sonra tekrar dene.`);
        return;
      }

      if (res.ok) {
        setReplies([data, ...replies]);
        setNewReply('');
        // Update reply count locally
        setComment({ ...comment, replyCount: (comment.replyCount || 0) + 1 });
        toast.success('Cevap gönderildi!');
      } else {
        toast.error(data.message || 'Cevap gönderilemedi');
      }
    } catch (err) {
      console.error('Cevap gönderme hatası:', err);
      toast.error('Bir hata oluştu. Lütfen tekrar dene.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleLikeComment = async (commentId) => {
    try {
      const res = await fetch(`${API_URL}/api/comments/${commentId}/like`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) {
        // Ana yorum mu yoksa reply mı kontrol et
        if (commentId === comment._id) {
          setComment(data);
        } else {
          setReplies(replies.map(r => r._id === commentId ? data : r));
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteReply = async (replyId) => {
    if (!window.confirm('Bu cevabı silmek istediğinize emin misiniz?')) return;
    try {
      const res = await fetch(`${API_URL}/api/comments/${replyId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        setReplies(replies.filter(r => r._id !== replyId));
        // Update reply count
        setComment({ ...comment, replyCount: Math.max(0, (comment.replyCount || 0) - 1) });
        toast.success('Cevap silindi');
      } else {
        toast.error('Cevap silinemedi');
      }
    } catch (err) {
      console.error(err);
      toast.error('Bir hata oluştu');
    }
  };

  const handleShare = async () => {
    const shareData = {
      title: 'Kbü Sosyal Yorumu',
      text: comment.content,
      url: window.location.href,
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        await navigator.clipboard.writeText(shareData.url);
        toast.success('Yorum bağlantısı kopyalandı!');
      }
    } catch (err) {
      console.error('Paylaşım hatası:', err);
      if (err.name !== 'AbortError') {
        toast.error('Paylaşım başarısız oldu');
      }
    }
  };

  const timeAgo = (date) => {
    const seconds = Math.floor((new Date() - new Date(date)) / 1000);
    let interval = seconds / 31536000;
    if (interval > 1) return Math.floor(interval) + " yıl";
    interval = seconds / 2592000;
    if (interval > 1) return Math.floor(interval) + " ay";
    interval = seconds / 86400;
    if (interval > 1) return Math.floor(interval) + " gün";
    interval = seconds / 3600;
    if (interval > 1) return Math.floor(interval) + " sa";
    interval = seconds / 60;
    if (interval > 1) return Math.floor(interval) + " dk";
    return "Şimdi";
  };

  const formatTime = (dateString) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('tr-TR', {
      hour: 'numeric',
      minute: 'numeric',
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    }).format(date);
  };

  // Loading or error check
  if (!comment || !comment.author) {
    return (
      <div className="bg-white min-h-screen">
        <div className="sticky top-0 z-20 bg-white/100 backdrop-blur-md border-b border-gray-100 px-4 py-3 flex items-center gap-6">
          <button
            onClick={() => navigate(-1)}
            className="p-2 -ml-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <ChevronLeft size={20} className="text-gray-900" />
          </button>
          <h2 className="text-lg font-bold text-gray-900">Yorum</h2>
        </div>
        <div className="flex items-center justify-center h-64">
          <p className="text-gray-500">Yorum yükleniyor...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white min-h-screen animate-in slide-in-from-right duration-300">

      {/* 1. HEADER (Sticky) */}
      <div className="sticky top-0 z-20 bg-white/100 backdrop-blur-md border-b border-gray-100 px-4 py-3 flex items-center gap-6">
        <button
          onClick={() => navigate(-1)}
          className="p-2 -ml-2 hover:bg-gray-100 rounded-full transition-colors"
        >
          <ChevronLeft size={20} className="text-gray-900" />
        </button>
        <h2 className="text-lg font-bold text-gray-900">Yorum</h2>
      </div>

      {/* 2. ANA YORUM İÇERİĞİ */}
      <div className="px-4 pt-3 pb-0">
        {/* Yazar Bilgisi */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div
              onClick={(e) => {
                e.stopPropagation();
                if (comment.author?.username) {
                  navigate(`/kullanici/${comment.author.username}`);
                }
              }}
              className="cursor-pointer hover:opacity-80 transition"
            >
              {comment.author?.profilePicture ? (
                <img
                  src={ensureHttps(comment.author.profilePicture)}
                  alt={comment.author.username}
                  className="w-10 h-10 rounded-full object-cover border border-gray-100"
                />
              ) : (
                <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center text-gray-500">
                  <User size={20} />
                </div>
              )}
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                <span
                  onClick={(e) => {
                    e.stopPropagation();
                    if (comment.author?.username) {
                      navigate(`/kullanici/${comment.author.username}`);
                    }
                  }}
                  className="font-bold text-gray-900 text-base hover:underline cursor-pointer"
                >
                  {comment.author?.fullName || comment.author?.username || 'Anonim'}
                </span>
                {comment.author?.badges && comment.author.badges.length > 0 && (
                  <UserBadges badges={comment.author.badges} size="sm" />
                )}
              </div>
              <span className="text-gray-500 text-sm">@{comment.author?.username} · {timeAgo(comment.createdAt)} önce</span>
            </div>
          </div>
          <button className="text-gray-400 hover:text-blue-500 transition">
            <MoreHorizontal size={20} />
          </button>
        </div>

        {/* Yorum Metni */}
        <div className="text-gray-900 text-xl leading-normal whitespace-pre-wrap mb-4 font-normal">
          {renderWithMentions(comment.content)}
        </div>

        {/* Tarih */}
        <div className="border-b border-gray-100 pb-3 mb-3">
          <span className="text-gray-500 text-sm hover:underline cursor-pointer">
            {formatTime(comment.createdAt)}
          </span>
        </div>

        {/* Aksiyon Butonları */}
        <div className="flex items-center justify-between border-b border-gray-100 pb-3 mb-0 px-2">

          <button
            className="flex items-center gap-1.5 text-gray-500 hover:text-blue-500 p-2 rounded-full transition group"
            onClick={() => replyInputRef.current?.focus()}
          >
            <MessageSquare size={22} className="group-hover:stroke-blue-500" />
            {replies.length > 0 && (
              <span className="text-sm font-medium group-hover:text-blue-500">{replies.length}</span>
            )}
          </button>

          <LikeButton
            isLiked={isLiked}
            likeCount={likeCount}
            onClick={handleLikeToggle}
          />

          <button
            onClick={handleShare}
            className="text-gray-500 hover:text-blue-500 hover:bg-blue-50 p-2 rounded-full transition group"
          >
            <Share2 size={22} className="group-hover:stroke-blue-500" />
          </button>
        </div>
      </div>

      {/* 3. CEVAP YAZMA ALANI */}
      <div className="px-4 py-2 border-b border-gray-100">
        <form onSubmit={handleSubmitReply} className="flex gap-3 items-center">
          {currentUserProfilePic ? (
            <img
              src={currentUserProfilePic}
              alt="Profil"
              className="w-8 h-8 rounded-full object-cover flex-shrink-0 border border-gray-100"
            />
          ) : (
            <div className="w-8 h-8 bg-gray-100 rounded-full flex-shrink-0 flex items-center justify-center">
              <User size={18} className="text-gray-400" />
            </div>
          )}
          <div className="flex-1">
            <input
              ref={replyInputRef}
              type="text"
              value={newReply}
              onChange={(e) => setNewReply(e.target.value)}
              placeholder="Cevabını gönder"
              className="w-full py-1.5 text-base text-gray-900 placeholder:text-gray-500 bg-transparent outline-none"
            />
          </div>
          <button
            type="submit"
            disabled={!newReply.trim() || submitting}
            className="px-4 py-1.5 bg-blue-500 text-white rounded-full font-bold text-sm hover:bg-blue-600 disabled:opacity-50 transition"
          >
            Cevapla
          </button>
        </form>
      </div>

      {/* 4. CEVAPLAR LİSTESİ */}
      <div className="pb-20">
        {loading ? (
          <div className="py-8 flex justify-center"><div className="w-6 h-6 border-2 border-blue-500 rounded-full animate-spin border-t-transparent"></div></div>
        ) : replies.length === 0 ? (
          <div className="text-center py-10 text-gray-500 text-sm">
            İlk cevabı sen ver!
          </div>
        ) : (
          replies.map((reply) => (
            <div key={reply._id} className="p-4 border-b border-gray-100 hover:bg-gray-50 transition">
              <div className="flex gap-3">
                {/* Avatar */}
                <div
                  className="flex-shrink-0 cursor-pointer hover:opacity-80 transition"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (reply.author?.username) {
                      navigate(`/kullanici/${reply.author.username}`);
                    }
                  }}
                >
                  {reply.author?.profilePicture ? (
                    <img src={ensureHttps(reply.author.profilePicture)} alt="" className="w-10 h-10 rounded-full object-cover" />
                  ) : (
                    <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center"><User size={18} className="text-gray-500" /></div>
                  )}
                </div>

                {/* İçerik */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 overflow-hidden">
                      <span
                        onClick={(e) => {
                          e.stopPropagation();
                          if (reply.author?.username) {
                            navigate(`/kullanici/${reply.author.username}`);
                          }
                        }}
                        className="font-bold text-gray-900 truncate hover:underline cursor-pointer"
                      >
                        {reply.author?.fullName || reply.author?.username || 'Kullanıcı'}
                      </span>
                      {reply.author?.badges && reply.author.badges.length > 0 && (
                        <UserBadges badges={reply.author.badges} size="sm" />
                      )}
                      <span className="text-gray-500 text-sm">· {timeAgo(reply.createdAt)}</span>
                    </div>

                    {/* Cevap Menüsü */}
                    {reply.author?._id === currentUserId && (
                      <div className="relative">
                        <button onClick={(e) => { e.stopPropagation(); setMenuOpen(menuOpen === reply._id ? null : reply._id); }} className="text-gray-400 p-1 hover:text-blue-500">
                          <MoreHorizontal size={16} />
                        </button>
                        {menuOpen === reply._id && (
                          <div className="absolute right-0 top-6 bg-white shadow-lg border border-gray-100 rounded-lg py-1 z-10 w-32">
                            <button onClick={() => handleDeleteReply(reply._id)} className="flex items-center gap-2 w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50"><Trash2 size={14} /> Sil</button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="text-gray-900 mt-1 whitespace-pre-wrap text-base">
                    {renderWithMentions(reply.content)}
                  </div>

                  {/* Cevap Altı Butonlar */}
                  <div className="flex items-center gap-6 mt-3 max-w-md">
                    <button
                      onClick={() => handleLikeComment(reply._id)}
                      className={`flex items-center gap-1 text-sm group ${reply.likes?.includes(currentUserId) ? 'text-red-500' : 'text-gray-500 hover:text-red-500'}`}
                    >
                      <Heart size={16} className={`group-hover:stroke-red-500 ${reply.likes?.includes(currentUserId) ? 'fill-current' : ''}`} />
                      {reply.likes?.length > 0 && <span>{reply.likes.length}</span>}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Toast Notifications */}
      <ToastContainer toasts={toast.toasts} removeToast={toast.removeToast} />
    </div>
  );
}
