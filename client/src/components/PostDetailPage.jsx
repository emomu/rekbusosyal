import React, { useState, useEffect, useRef } from 'react';
import { useLoaderData, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { ChevronLeft, MessageSquare, User, MoreHorizontal, Trash2, Edit2, Share2, BarChart2, Heart, Film, ImagePlus, FileImage } from 'lucide-react';
import { API_URL } from '../config/api';
import { useToast } from '../hooks/useToast';
import { ToastContainer } from './Toast';
import { ensureHttps } from '../utils/imageUtils';
import UserBadges from './UserBadges';
import { setSelectedImage } from '../store/slices/uiSlice';
import { CommentsShimmer } from './LoadingShimmer';
import MediaUploadDialog from './MediaUploadDialog';
import GiphyPicker from './GiphyPicker';
import MediaDisplay from './MediaDisplay';
import SpotifyTrackDisplay from './SpotifyTrackDisplay';
import EventCard from './EventCard';
import LikeUsersModal from './LikeUsersModal';

// --- LIKE BUTONU BİLEŞENİ ---
const LikeButton = ({ isLiked, likeCount, onClick, onCountClick }) => {
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

  const handleCountClick = (e) => {
    if (e && e.stopPropagation) e.stopPropagation();
    if (onCountClick && likeCount > 0) {
      onCountClick(e);
    }
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
        onClick={handleCountClick}
        className={`text-sm font-medium transition-all duration-300 ${isLiked ? 'text-red-500' : 'text-gray-500 group-hover:text-red-500'
          } ${isAnimating ? 'animate-like-count-pop' : ''} ${
          likeCount > 0 && onCountClick ? 'cursor-pointer hover:underline' : ''
        }`}
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

export default function PostDetailPage() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const toast = useToast();
  const post = useLoaderData();
  const { userId: currentUserId, token } = useSelector((state) => state.auth);

  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [menuOpen, setMenuOpen] = useState(null);
  const [currentUserProfilePic, setCurrentUserProfilePic] = useState(null);

  // Yerel State
  const [isLiked, setIsLiked] = useState(post?.likes?.includes(currentUserId) || false);
  const [likeCount, setLikeCount] = useState(post?.likes?.length || 0);

  // Like modal states
  const [showPostLikeModal, setShowPostLikeModal] = useState(false);
  const [showCommentLikeModal, setShowCommentLikeModal] = useState(false);
  const [selectedCommentId, setSelectedCommentId] = useState(null);

  // Media upload states
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [uploadType, setUploadType] = useState(null);
  const [giphyPickerOpen, setGiphyPickerOpen] = useState(false);
  const [selectedMedia, setSelectedMedia] = useState(null);

  // Edit comment states
  const [editingCommentId, setEditingCommentId] = useState(null);
  const [editingContent, setEditingContent] = useState('');

  // Edit post states
  const [isEditingPost, setIsEditingPost] = useState(false);
  const [editingPostContent, setEditingPostContent] = useState('');
  const [postMenuOpen, setPostMenuOpen] = useState(false);

  const commentInputRef = useRef(null);

  useEffect(() => {
    fetchComments();
    window.scrollTo(0, 0);
  }, []);

  // Close menus when clicking outside
  useEffect(() => {
    const handleClickOutside = () => {
      setPostMenuOpen(false);
      setMenuOpen(null);
    };
    if (postMenuOpen || menuOpen) {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [postMenuOpen, menuOpen]);

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
  const handleLikeToggle = async () => {
    // 1. Yeni durumu hesapla
    const nextIsLiked = !isLiked;

    // 2. State'leri BAĞIMSIZ olarak güncelle (İç içe değil!)
    // Bu sayede React'in double-invocation (çift çalışma) sorunu engellenir.
    setIsLiked(nextIsLiked);

    // Eğer beğenildiyse +1, geri alındıysa -1
    setLikeCount((prev) => nextIsLiked ? prev + 1 : prev - 1);

    // 3. API çağrısı
    try {
      await fetch(`${API_URL}/api/posts/${post._id}/like`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });
    } catch (err) {
      console.error('Like error:', err);
      // Revert on error
      setIsLiked(!nextIsLiked);
      setLikeCount((prev) => nextIsLiked ? prev - 1 : prev + 1);
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

  const fetchComments = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_URL}/api/posts/${post._id}/comments`);
      const data = await res.json();
      if (res.ok) {
        console.log('Yorumlar:', data);
        setComments(data);
      }
    } catch (err) {
      console.error('Yorumlar yüklenemedi:', err);
    } finally {
      setLoading(false);
    }
  };

  // Media handlers
  const handleMediaSelect = (files) => {
    if (files && files.length > 0) {
      setSelectedMedia(files[0]); // Only first file since we allow max 1
    }
    setUploadDialogOpen(false);
  };

  const handleGiphySelect = (gifData) => {
    setSelectedMedia({
      url: gifData.url,
      preview: gifData.preview,
      type: 'gif',
      name: gifData.name,
      file: null // Giphy GIF'leri için file yok, URL kullanılacak
    });
    setGiphyPickerOpen(false);
  };

  const handleSubmitComment = async (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    try {
      setSubmitting(true);

      const formData = new FormData();
      formData.append('content', newComment);

      // Add media if selected
      if (selectedMedia) {
        if (selectedMedia.file) {
          // Normal file upload (image/video)
          formData.append('media', selectedMedia.file);
        } else if (selectedMedia.type === 'gif' && selectedMedia.url) {
          // Giphy GIF - send URL as JSON
          formData.append('giphyGifs', JSON.stringify([{
            url: selectedMedia.url,
            type: 'gif'
          }]));
        }
      }

      const res = await fetch(`${API_URL}/api/posts/${post._id}/comments`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      const data = await res.json();

      if (res.status === 429) {
        toast.error(`${data.error || 'Çok fazla istek'}. ${data.remainingSeconds || 60} saniye sonra tekrar dene.`);
        return;
      }

      if (res.ok) {
        setComments([data, ...comments]);
        setNewComment('');
        setSelectedMedia(null);
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

  const handleEditComment = (comment) => {
    setEditingCommentId(comment._id);
    setEditingContent(comment.content);
    setMenuOpen(null);
  };

  const handleCancelEdit = () => {
    setEditingCommentId(null);
    setEditingContent('');
  };

  const handleSaveEdit = async (commentId) => {
    if (!editingContent.trim()) return;
    try {
      const res = await fetch(`${API_URL}/api/comments/${commentId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ content: editingContent })
      });

      if (res.ok) {
        const updatedComment = await res.json();
        setComments(comments.map(c => c._id === commentId ? updatedComment : c));
        setEditingCommentId(null);
        setEditingContent('');
        toast.success('Yorum güncellendi');
      } else {
        toast.error('Yorum güncellenemedi');
      }
    } catch (err) {
      console.error(err);
      toast.error('Bir hata oluştu');
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

  // Post edit/delete handlers
  const handleEditPost = () => {
    setIsEditingPost(true);
    setEditingPostContent(post.content);
    setPostMenuOpen(false);
  };

  const handleCancelEditPost = () => {
    setIsEditingPost(false);
    setEditingPostContent('');
  };

  const handleSavePost = async () => {
    if (!editingPostContent.trim()) return;
    try {
      const res = await fetch(`${API_URL}/api/posts/${post._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ content: editingPostContent })
      });

      if (res.ok) {
        const updatedPost = await res.json();
        post.content = updatedPost.content;
        setIsEditingPost(false);
        setEditingPostContent('');
        toast.success('Post güncellendi');
      } else {
        const errorData = await res.json();
        toast.error(errorData.error || 'Post güncellenemedi');
      }
    } catch (err) {
      console.error(err);
      toast.error('Bir hata oluştu');
    }
  };

  const handleDeletePost = async () => {
    if (!window.confirm('Bu postu silmek istediğinize emin misiniz? Bu işlem geri alınamaz.')) return;
    try {
      const res = await fetch(`${API_URL}/api/posts/${post._id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        toast.success('Post silindi');
        setTimeout(() => navigate('/'), 1000);
      } else {
        const errorData = await res.json();
        toast.error(errorData.error || 'Post silinemedi');
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
          onClick={() => navigate(-1)}
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
                    if (post.author?.username) {
                      navigate(`/kullanici/${post.author.username}`);
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
              <div className="flex items-center gap-1 text-gray-500 text-sm flex-wrap">
                <span>@{post.author?.username}</span>
                <span>·</span>
                <span>{timeAgo(post.createdAt)} önce</span>
                {post.specialTag && (
                  <>
                    <span>·</span>
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold ${
                      post.specialTag === 'kayip' ? 'bg-red-100 text-red-700' :
                      post.specialTag === 'tavsiye' ? 'bg-blue-100 text-blue-700' :
                      post.specialTag === 'ariyorum' ? 'bg-green-100 text-green-700' :
                      'bg-gray-100 text-gray-700'
                    }`}>
                      {post.specialTag === 'kayip' && '🔍 Kayıp'}
                      {post.specialTag === 'tavsiye' && '💡 Tavsiye'}
                      {post.specialTag === 'ariyorum' && '🔎 Arıyorum'}
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>
          {post.author?._id === currentUserId && (
            <div className="relative">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setPostMenuOpen(!postMenuOpen);
                }}
                className="text-gray-400 hover:text-blue-500 transition p-1"
              >
                <MoreHorizontal size={20} />
              </button>
              {postMenuOpen && (
                <div className="absolute right-0 top-8 bg-white shadow-lg border border-gray-100 rounded-lg py-1 z-10 w-32">
                  <button
                    onClick={handleEditPost}
                    className="flex items-center gap-2 w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                  >
                    <Edit2 size={14} /> Düzenle
                  </button>
                  <button
                    onClick={handleDeletePost}
                    className="flex items-center gap-2 w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                  >
                    <Trash2 size={14} /> Sil
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Gönderi Metni - Editable or Display */}
        {isEditingPost ? (
          <div className="mb-4 space-y-2">
            <textarea
              value={editingPostContent}
              onChange={(e) => setEditingPostContent(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 text-base"
              rows={4}
              autoFocus
            />
            <div className="flex gap-2">
              <button
                onClick={handleSavePost}
                className="px-4 py-2 bg-blue-500 text-white rounded-full text-sm font-medium hover:bg-blue-600"
              >
                Kaydet
              </button>
              <button
                onClick={handleCancelEditPost}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-full text-sm font-medium hover:bg-gray-300"
              >
                İptal
              </button>
            </div>
          </div>
        ) : (
          <div className="text-gray-900 text-xl leading-normal whitespace-pre-wrap mb-4 font-normal">
            {renderWithMentions(post.content)}
          </div>
        )}

        {/* Spotify Track Display */}
        {post.spotifyTrack && (
          <div className="mb-4">
            <SpotifyTrackDisplay track={post.spotifyTrack} compact={false} />
          </div>
        )}

        {/* Event Card - SECURITY: Only shown if eventReference exists and is populated */}
        {post.eventReference && (
          <div className="mb-4">
            <EventCard event={post.eventReference} />
          </div>
        )}

        {/* Media Gallery */}
        {post.media && post.media.length > 0 && (
          <div className={`mb-4 rounded-2xl overflow-hidden ${
            post.media.length === 1 ? '' :
            post.media.length === 2 ? 'grid grid-cols-2 gap-1' :
            post.media.length === 3 ? 'grid grid-cols-2 gap-1' :
            'grid grid-cols-2 gap-1'
          }`}>
            {post.media.map((media, idx) => (
              <div
                key={idx}
                className={`relative ${
                  post.media.length === 3 && idx === 0 ? 'col-span-2' : ''
                } ${
                  post.media.length === 1 ? 'border border-gray-100' : ''
                }`}
              >
                {media.type === 'video' ? (
                  <div className="relative bg-black">
                    <video
                      src={media.url}
                      controls
                      className="w-full h-full object-contain max-h-[500px]"
                      playsInline
                    />
                  </div>
                ) : (
                  <img
                    src={media.url}
                    alt={`Media ${idx + 1}`}
                    className="w-full h-full object-cover cursor-pointer hover:opacity-95 transition"
                    onClick={() => dispatch(setSelectedImage(media.url))}
                    style={{
                      aspectRatio: post.media.length === 1 ? 'auto' : '1/1',
                      maxHeight: post.media.length === 1 ? '500px' : 'auto'
                    }}
                  />
                )}
              </div>
            ))}
          </div>
        )}

        {/* Legacy single image support */}
        {!post.media && post.imageUrl && (
          <div className="mb-4 rounded-2xl overflow-hidden border border-gray-100">
            <img
              src={post.imageUrl}
              alt="Post content"
              className="w-full h-auto cursor-pointer hover:opacity-95 transition"
              onClick={() => dispatch(setSelectedImage(post.imageUrl))}
            />
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
            onCountClick={(e) => {
              e?.stopPropagation();
              if (likeCount > 0) {
                setShowPostLikeModal(true);
              }
            }}
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
      <div className="px-4 py-3 border-b border-gray-100">
        <form onSubmit={handleSubmitComment} className="space-y-2">
          <div className="flex gap-3 items-start">
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
                onChange={(e) => {
                  if (e.target.value.length <= 256) {
                    setNewComment(e.target.value);
                  }
                }}
                placeholder="Yanıtını gönder"
                className="w-full py-1.5 text-base text-gray-900 placeholder:text-gray-500 bg-transparent outline-none"
                maxLength={256}
              />
              {/* Character Counter */}
              {newComment.length > 0 && (
                <div className="flex justify-end mt-1">
                  <span className={`text-xs font-medium ${
                    newComment.length > 240 ? 'text-red-600' :
                    newComment.length > 200 ? 'text-yellow-600' :
                    'text-gray-400'
                  }`}>
                    {newComment.length}/256
                  </span>
                </div>
              )}

              {/* Selected media preview */}
              {selectedMedia && (
                <div className="mt-2 relative inline-block">
                  <img
                    src={selectedMedia.preview}
                    alt="Preview"
                    className="max-w-[120px] max-h-[120px] rounded-lg object-cover border border-gray-200"
                  />
                  <button
                    type="button"
                    onClick={() => setSelectedMedia(null)}
                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-red-600"
                  >
                    ×
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Media buttons and submit */}
          <div className="flex items-center justify-end gap-2 pl-11">
            <button
              type="button"
              onClick={() => {
                setUploadType('image');
                setUploadDialogOpen(true);
              }}
              className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition"
              title="Fotoğraf ekle"
            >
              <ImagePlus size={20} />
            </button>
            <button
              type="button"
              onClick={() => setGiphyPickerOpen(true)}
              className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition"
              title="GIF ekle"
            >
              <FileImage size={20} />
            </button>

            <button
              type="submit"
              disabled={!newComment.trim() || submitting}
              className="px-4 py-1.5 bg-blue-500 text-white rounded-full font-bold text-sm hover:bg-blue-600 disabled:opacity-50 transition"
            >
              {submitting ? 'Gönderiliyor...' : 'Yanıtla'}
            </button>
          </div>
        </form>
      </div>

      {/* 4. YORUMLAR LİSTESİ */}
      <div className="pb-20">
        {loading ? (
          <CommentsShimmer count={3} />
        ) : comments.length === 0 ? (
          <div className="text-center py-10 text-gray-500 text-sm">
            İlk yanıtı sen ver!
          </div>
        ) : (
          comments.map((comment) => (
            <div
              key={comment._id}
              className="p-4 border-b border-gray-100 hover:bg-gray-50 transition cursor-pointer"
              onClick={() => navigate(`/yorum/${comment._id}`)}
            >
              <div className="flex gap-3">
                {/* Avatar */}
                <div
                  className="flex-shrink-0 cursor-pointer hover:opacity-80 transition"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (comment.author?.username) {
                      navigate(`/kullanici/${comment.author.username}`);
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
                    <div className="flex flex-col overflow-hidden">
                      <div className="flex items-center gap-2 overflow-hidden">
                        <span
                          onClick={(e) => {
                            e.stopPropagation();
                            if (comment.author?.username) {
                              navigate(`/kullanici/${comment.author.username}`);
                            }
                          }}
                          className="font-bold text-gray-900 truncate hover:underline cursor-pointer"
                        >
                          {comment.author?.fullName || comment.author?.username || 'Kullanıcı'}
                        </span>
                        {comment.author?.badges && comment.author.badges.length > 0 && (
                          <UserBadges badges={comment.author.badges} size="sm" />
                        )}
                      </div>
                      <div className="flex items-center gap-1 text-gray-500 text-sm">
                        <span>@{comment.author?.username || 'kullanıcı'}</span>
                        <span>·</span>
                        <span>{timeAgo(comment.createdAt)}</span>
                      </div>
                    </div>

                    {/* Yorum Menüsü */}
                    {comment.author?._id === currentUserId && (
                      <div className="relative">
                        <button onClick={(e) => { e.stopPropagation(); setMenuOpen(menuOpen === comment._id ? null : comment._id); }} className="text-gray-400 p-1 hover:text-blue-500">
                          <MoreHorizontal size={16} />
                        </button>
                        {menuOpen === comment._id && (
                          <div className="absolute right-0 top-6 bg-white shadow-lg border border-gray-100 rounded-lg py-1 z-10 w-32">
                            <button onClick={(e) => { e.stopPropagation(); handleEditComment(comment); }} className="flex items-center gap-2 w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"><Edit2 size={14} /> Düzenle</button>
                            <button onClick={(e) => { e.stopPropagation(); handleDeleteComment(comment._id); }} className="flex items-center gap-2 w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50"><Trash2 size={14} /> Sil</button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Comment Content - Editable or Display */}
                  {editingCommentId === comment._id ? (
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
                          onClick={(e) => { e.stopPropagation(); handleSaveEdit(comment._id); }}
                          className="px-3 py-1 bg-blue-500 text-white rounded-full text-sm font-medium hover:bg-blue-600"
                        >
                          Kaydet
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); handleCancelEdit(); }}
                          className="px-3 py-1 bg-gray-200 text-gray-700 rounded-full text-sm font-medium hover:bg-gray-300"
                        >
                          İptal
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="text-gray-900 mt-1 whitespace-pre-wrap text-base">
                      {renderWithMentions(comment.content)}
                    </div>
                  )}

                  {/* Comment Media */}
                  {comment.media && comment.media.url && (
                    <div className="mt-3">
                      <MediaDisplay
                        media={[comment.media]}
                        onImageClick={() => dispatch(setSelectedImage(ensureHttps(comment.media.url)))}
                      />
                    </div>
                  )}

                  {/* Yorum Altı Butonlar */}
                  <div className="flex items-center gap-6 mt-3">
                    <button className="flex items-center gap-1 text-gray-500 hover:text-blue-500 transition text-sm">
                      <MessageSquare size={18} />
                      <span>{comment.replyCount || 0}</span>
                    </button>

                    <div onClick={(e) => e.stopPropagation()}>
                      <LikeButton
                        isLiked={comment.likes?.includes(currentUserId)}
                        likeCount={comment.likes?.length || 0}
                        onClick={(e) => {
                          e?.stopPropagation();
                          handleLikeComment(comment._id);
                        }}
                        onCountClick={(e) => {
                          e?.stopPropagation();
                          if (comment.likes?.length > 0) {
                            setSelectedCommentId(comment._id);
                            setShowCommentLikeModal(true);
                          }
                        }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Toast Notifications */}
      <ToastContainer toasts={toast.toasts} removeToast={toast.removeToast} />

      {/* Media Upload Dialogs */}
      <MediaUploadDialog
        isOpen={uploadDialogOpen}
        onClose={() => setUploadDialogOpen(false)}
        type={uploadType}
        onMediaSelect={handleMediaSelect}
      />

      <GiphyPicker
        isOpen={giphyPickerOpen}
        onClose={() => setGiphyPickerOpen(false)}
        onSelect={handleGiphySelect}
      />

      {/* Like Modals */}
      <LikeUsersModal
        isOpen={showPostLikeModal}
        onClose={() => setShowPostLikeModal(false)}
        itemId={post._id}
        type="post"
      />

      <LikeUsersModal
        isOpen={showCommentLikeModal}
        onClose={() => setShowCommentLikeModal(false)}
        itemId={selectedCommentId}
        type="comment"
      />
    </div>
  );
}