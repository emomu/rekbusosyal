import React, { useState, useEffect, useRef } from 'react';
import { ChevronLeft, MessageSquare, User, MoreHorizontal, Trash2, Share2, BarChart2, Heart } from 'lucide-react';
import { API_URL } from '../config/api';
import { useToast } from '../hooks/useToast';
import { ToastContainer } from './Toast';
import { ensureHttps } from '../utils/imageUtils';
import UserBadges from './UserBadges';

// --- LIKE BUTONU BİLEŞENİ (Dokunulmadı, aynen korundu) ---
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

// --- ANA SAYFA BİLEŞENİ (POST DETAIL PAGE) ---

export default function PostDetailPage({ post, onClose, token, currentUserId, onLike, currentUserProfilePic, onMentionClick, onCommentClick }) {
  const toast = useToast();
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [menuOpen, setMenuOpen] = useState(null);

  // Yerel State
  const [isLiked, setIsLiked] = useState(post.likes?.includes(currentUserId) || false);
  const [likeCount, setLikeCount] = useState(post.likes?.length || 0);

  const commentInputRef = useRef(null);

  useEffect(() => {
    fetchComments();
    window.scrollTo(0, 0);
  }, []);

  // --- SORUNU ÇÖZEN KISIM 1: Veri Senkronizasyonu ---
  // Eğer post prop'u değişirse (örneğin parent component güncellerse), 
  // yerel state'i güncelle ki veriler tutarlı kalsın.
  useEffect(() => {
    if (post) {
      setIsLiked(post.likes?.includes(currentUserId) || false);
      setLikeCount(post.likes?.length || 0);
    }
  }, [post, currentUserId]);

  // --- SORUNU ÇÖZEN KISIM 2: Temiz Toggle Mantığı ---
  const handleLikeToggle = () => {
    // 1. Yeni durumu hesapla
    const nextIsLiked = !isLiked;

    // 2. State'leri BAĞIMSIZ olarak güncelle (İç içe değil!)
    // Bu sayede React'in double-invocation (çift çalışma) sorunu engellenir.
    setIsLiked(nextIsLiked);

    // Eğer beğenildiyse +1, geri alındıysa -1
    setLikeCount((prev) => nextIsLiked ? prev + 1 : prev - 1);

    // 3. API çağrısı
    if (onLike) {
      onLike(post._id);
    }
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
              if (onMentionClick) onMentionClick(username);
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

  const fetchComments = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_URL}/api/posts/${post._id}/comments`);
      const data = await res.json();
      if (res.ok) {
        setComments(data);
      }
    } catch (err) {
      console.error('Yorumlar yüklenemedi:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitComment = async (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    try {
      setSubmitting(true);
      const res = await fetch(`${API_URL}/api/posts/${post._id}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ content: newComment })
      });

      const data = await res.json();

      if (res.status === 429) {
        toast.error(`${data.error || 'Çok fazla istek'}. ${data.remainingSeconds || 60} saniye sonra tekrar dene.`);
        return;
      }

      if (res.ok) {
        setComments([data, ...comments]);
        setNewComment('');
        toast.success('Yorum gönderildi!');
      } else {
        toast.error(data.message || 'Yorum gönderilemedi');
      }
    } catch (err) {
      console.error('Yorum gönderme hatası:', err);
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
        setComments(comments.map(c => c._id === commentId ? data : c));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteComment = async (commentId) => {
    if (!window.confirm('Bu yorumu silmek istediğinize emin misiniz?')) return;
    try {
      const res = await fetch(`${API_URL}/api/comments/${commentId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        setComments(comments.filter(c => c._id !== commentId));
        toast.success('Yorum silindi');
      } else {
        toast.error('Yorum silinemedi');
      }
    } catch (err) {
      console.error(err);
      toast.error('Bir hata oluştu');
    }
  };

  const handleShare = async () => {
    const shareData = {
      title: 'Kbü Sosyal Gönderisi',
      text: post.content,
      url: window.location.href,
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        await navigator.clipboard.writeText(shareData.url);
        toast.success('Gönderi bağlantısı kopyalandı!');
      }
    } catch (err) {
      console.error('Paylaşım hatası:', err);
    }
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

  return (
    <div className="bg-white min-h-screen animate-in slide-in-from-right duration-300">

      {/* 1. HEADER (Sticky) */}
      <div className="sticky top-0 z-20 bg-white/100 backdrop-blur-md border-b border-gray-100 px-4 py-3 flex items-center gap-6">
        <button
          onClick={onClose}
          className="p-2 -ml-2 hover:bg-gray-100 rounded-full transition-colors"
        >
          <ChevronLeft size={20} className="text-gray-900" />
        </button>
        <h2 className="text-lg font-bold text-gray-900">Gönderi</h2>
      </div>

      {/* 2. ANA GÖNDERİ İÇERİĞİ */}
      <div className="px-4 pt-3 pb-0">
        {/* Yazar Bilgisi */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div
              onClick={(e) => {
                e.stopPropagation();
                if (post.author?.username && onMentionClick) {
                  onMentionClick(post.author.username);
                }
              }}
              className="cursor-pointer hover:opacity-80 transition"
            >
              {post.author?.profilePicture ? (
                <img
                  src={ensureHttps(post.author.profilePicture)}
                  alt={post.author.username}
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
                    if (post.author?.username && onMentionClick) {
                      onMentionClick(post.author.username);
                    }
                  }}
                  className="font-bold text-gray-900 text-base hover:underline cursor-pointer"
                >
                  {post.author?.fullName || post.author?.username || 'Anonim'}
                </span>
                {post.author?.badges && post.author.badges.length > 0 && (
                  <UserBadges badges={post.author.badges} size="sm" />
                )}
              </div>
              <span className="text-gray-500 text-sm">@{post.author?.username} · {timeAgo(post.createdAt)} önce</span>
            </div>
          </div>
          <button className="text-gray-400 hover:text-blue-500 transition">
            <MoreHorizontal size={20} />
          </button>
        </div>

        {/* Gönderi Metni */}
        <div className="text-gray-900 text-xl leading-normal whitespace-pre-wrap mb-4 font-normal">
          {renderWithMentions(post.content)}
        </div>

        {/* Resim Varsa */}
        {post.imageUrl && (
          <div className="mb-4 rounded-2xl overflow-hidden border border-gray-100">
            <img src={post.imageUrl} alt="Post content" className="w-full h-auto" />
          </div>
        )}

        {/* Tarih */}
        <div className="border-b border-gray-100 pb-3 mb-3">
          <span className="text-gray-500 text-sm hover:underline cursor-pointer">
            {formatTime(post.createdAt)}
          </span>
        </div>

        {/* Aksiyon Butonları */}
        <div className="flex items-center justify-between border-b border-gray-100 pb-3 mb-0 px-2">

          <button
            className="flex items-center gap-1.5 text-gray-500 hover:text-blue-500  p-2 rounded-full transition group"
            onClick={() => commentInputRef.current?.focus()}
          >
            <MessageSquare size={22} className="group-hover:stroke-blue-500" />
            {comments.length > 0 && (
              <span className="text-sm font-medium group-hover:text-blue-500">{comments.length}</span>
            )}
          </button>

          <LikeButton
            isLiked={isLiked}
            likeCount={likeCount}
            onClick={handleLikeToggle}
          />

          <button className="text-gray-500 hover:text-green-500 hover:bg-green-50 p-2 rounded-full transition group">
            <BarChart2 size={22} className="group-hover:stroke-green-500" />
          </button>

          <button
            onClick={handleShare}
            className="text-gray-500 hover:text-blue-500 hover:bg-blue-50 p-2 rounded-full transition group"
          >
            <Share2 size={22} className="group-hover:stroke-blue-500" />
          </button>
        </div>
      </div>

      {/* 3. YORUM YAZMA ALANI */}
      <div className="px-4 py-2 border-b border-gray-100">
        <form onSubmit={handleSubmitComment} className="flex gap-3 items-center">
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
              ref={commentInputRef}
              type="text"
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Yanıtını gönder"
              className="w-full py-1.5 text-base text-gray-900 placeholder:text-gray-500 bg-transparent outline-none"
            />
          </div>
          <button
            type="submit"
            disabled={!newComment.trim() || submitting}
            className="px-4 py-1.5 bg-blue-500 text-white rounded-full font-bold text-sm hover:bg-blue-600 disabled:opacity-50 transition"
          >
            Yanıtla
          </button>
        </form>
      </div>

      {/* 4. YORUMLAR LİSTESİ */}
      <div className="pb-20">
        {loading ? (
          <div className="py-8 flex justify-center"><div className="w-6 h-6 border-2 border-blue-500 rounded-full animate-spin border-t-transparent"></div></div>
        ) : comments.length === 0 ? (
          <div className="text-center py-10 text-gray-500 text-sm">
            İlk yanıtı sen ver!
          </div>
        ) : (
          comments.map((comment) => (
            <div
              key={comment._id}
              className="p-4 border-b border-gray-100 hover:bg-gray-50 transition cursor-pointer"
              onClick={() => onCommentClick && onCommentClick(comment)}
            >
              <div className="flex gap-3">
                {/* Avatar */}
                <div
                  className="flex-shrink-0 cursor-pointer hover:opacity-80 transition"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (comment.author?.username && onMentionClick) {
                      onMentionClick(comment.author.username);
                    }
                  }}
                >
                  {comment.author?.profilePicture ? (
                    <img src={ensureHttps(comment.author.profilePicture)} alt="" className="w-10 h-10 rounded-full object-cover" />
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
                          if (comment.author?.username && onMentionClick) {
                            onMentionClick(comment.author.username);
                          }
                        }}
                        className="font-bold text-gray-900 truncate hover:underline cursor-pointer"
                      >
                        {comment.author?.fullName || comment.author?.username || 'Kullanıcı'}
                      </span>
                      {comment.author?.badges && comment.author.badges.length > 0 && (
                        <UserBadges badges={comment.author.badges} size="sm" />
                      )}
                      <span className="text-gray-500 text-sm">· {timeAgo(comment.createdAt)}</span>
                    </div>

                    {/* Yorum Menüsü */}
                    {comment.author?._id === currentUserId && (
                      <div className="relative">
                        <button onClick={(e) => { e.stopPropagation(); setMenuOpen(menuOpen === comment._id ? null : comment._id); }} className="text-gray-400 p-1 hover:text-blue-500">
                          <MoreHorizontal size={16} />
                        </button>
                        {menuOpen === comment._id && (
                          <div className="absolute right-0 top-6 bg-white shadow-lg border border-gray-100 rounded-lg py-1 z-10 w-32">
                            <button onClick={(e) => { e.stopPropagation(); handleDeleteComment(comment._id); }} className="flex items-center gap-2 w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50"><Trash2 size={14} /> Sil</button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="text-gray-900 mt-1 whitespace-pre-wrap text-base">
                    {renderWithMentions(comment.content)}
                  </div>

                  {/* Yorum Altı Butonlar */}
                  <div className="flex items-center gap-6 mt-3 max-w-md">
                    <button className="flex items-center gap-1 text-gray-500 hover:text-blue-500 text-sm group">
                      <MessageSquare size={16} className="group-hover:stroke-blue-500" />
                      {comment.replyCount > 0 && (
                        <span className="group-hover:text-blue-500">{comment.replyCount}</span>
                      )}
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); handleLikeComment(comment._id); }}
                      className={`flex items-center gap-1 text-sm group ${comment.likes?.includes(currentUserId) ? 'text-red-500' : 'text-gray-500 hover:text-red-500'}`}
                    >
                      <Heart size={16} className={`group-hover:stroke-red-500 ${comment.likes?.includes(currentUserId) ? 'fill-current' : ''}`} />
                      {comment.likes?.length > 0 && <span>{comment.likes.length}</span>}
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