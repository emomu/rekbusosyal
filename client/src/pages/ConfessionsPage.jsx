import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate, useLoaderData, useOutletContext } from 'react-router-dom';
import { User, MessageSquare, RefreshCw, Image, Film, FileImage, Ghost, Send, X, Play, Loader2, MoreHorizontal, Edit2, Trash2, Music } from 'lucide-react';
import { setConfessions, addConfession, appendConfessions, setConfessionsPagination } from '../store/slices/postsSlice';
import { setNewConfessionContent, setIsAnonymous, setSelectedImage, setLoadingConfessions, addToast } from '../store/slices/uiSlice';
import { incrementAdImpression, incrementAdClick } from '../store/slices/advertisementsSlice';
import { addInterests } from '../store/slices/authSlice';
import { FeedShimmer } from '../components/LoadingShimmer';
import { usePullToRefresh } from '../hooks/usePullToRefresh';
import MobileHeader from '../components/MobileHeader';
import LikeButton from '../components/LikeButton';
import LoadMoreButton from '../components/LoadMoreButton';
import UserBadges from '../components/UserBadges';
import MediaUploadDialog from '../components/MediaUploadDialog';
import MediaDisplay from '../components/MediaDisplay';
import GiphyPicker from '../components/GiphyPicker';
import SpotifyTrackPicker from '../components/SpotifyTrackPicker';
import SpotifyTrackDisplay from '../components/SpotifyTrackDisplay';
import { API_URL } from '../config/api';

// AdCard Component
function AdCard({ ad, onView, onClick, onImageClick }) {
  const adRef = React.useRef(null);
  const [hasViewed, setHasViewed] = useState(false);

  useEffect(() => {
    if (!adRef.current || hasViewed) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !hasViewed) {
            onView();
            setHasViewed(true);
          }
        });
      },
      { threshold: 0.5 }
    );

    observer.observe(adRef.current);
    return () => {
      if (adRef.current) observer.unobserve(adRef.current);
    };
  }, [hasViewed, onView]);

  return (
    <div ref={adRef} className="p-5 hover:bg-gray-50/50 transition">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          {ad.profileImageUrl ? (
            <img src={ad.profileImageUrl} alt={ad.title} className="w-9 h-9 rounded-full object-cover border border-gray-200" />
          ) : (
            <div className="w-9 h-9 bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-full flex items-center justify-center font-bold text-xs shadow-sm">AD</div>
          )}
          <div className="flex flex-col">
            <span className="font-bold text-sm text-gray-900">{ad.title}</span>
            <span className="text-xs text-gray-500">Sponsorlu</span>
          </div>
        </div>
        <span className="text-xs text-gray-400 px-2 py-1 bg-gray-100 rounded">#reklam</span>
      </div>

      <div className="cursor-pointer" onClick={onClick}>
        <p className="text-gray-800 text-sm mb-3 leading-relaxed whitespace-pre-wrap">{ad.content}</p>
        {ad.imageUrl && (
          <div className="rounded-2xl overflow-hidden border border-gray-200 mt-3">
            <img src={ad.imageUrl} alt={ad.title} className="w-full h-auto object-cover cursor-pointer hover:opacity-95 transition"
              onClick={(e) => { e.stopPropagation(); onImageClick(ad.imageUrl); }}
            />
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * ConfessionsPage - Anonymous confessions feed
 */
export default function ConfessionsPage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { setIsMobileMenuOpen, setShowNotifications, unreadCount } = useOutletContext();
  const loaderData = useLoaderData();

  const { userId, token, userInterests } = useSelector((state) => state.auth);
  const { confessions, confessionsPagination } = useSelector((state) => state.posts);
  const { advertisements } = useSelector((state) => state.advertisements);
  const { newConfessionContent, isAnonymous, isLoadingConfessions } = useSelector((state) => state.ui);

  const [selectedMedia, setSelectedMedia] = useState([]);
  const [mediaDialogOpen, setMediaDialogOpen] = useState(false);
  const [mediaDialogType, setMediaDialogType] = useState(null);
  const [giphyPickerOpen, setGiphyPickerOpen] = useState(false);
  const [spotifyPickerOpen, setSpotifyPickerOpen] = useState(false);
  const [selectedSpotifyTrack, setSelectedSpotifyTrack] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [currentUserInfo, setCurrentUserInfo] = useState(null);

  // Post edit/delete states
  const [postMenuOpen, setPostMenuOpen] = useState(null);
  const [editingPostId, setEditingPostId] = useState(null);
  const [editingPostContent, setEditingPostContent] = useState('');

  const currentUserAvatar = currentUserInfo?.profilePicture;

  useEffect(() => {
    if (loaderData && loaderData.confessions) {
      dispatch(setConfessions(loaderData.confessions));
      dispatch(setConfessionsPagination({
        currentPage: loaderData.currentPage || 1,
        totalPages: loaderData.totalPages || 1,
        hasMore: loaderData.hasMore || false
      }));
    }
  }, [loaderData, dispatch]);

  // Fetch current user info
  useEffect(() => {
    if (userId && token) {
      fetch(`${API_URL}/api/profile`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
        .then(res => res.ok ? res.json() : null)
        .then(data => data && setCurrentUserInfo(data))
        .catch(err => console.error('Error fetching user info:', err));
    }
  }, [userId, token]);

  const confessionsRefresh = usePullToRefresh(async () => {
    try {
      const res = await fetch(`${API_URL}/api/confessions?page=1&limit=10`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        dispatch(setConfessions(data.posts || []));
        dispatch(setConfessionsPagination({
          currentPage: data.currentPage || 1,
          totalPages: data.totalPages || 1,
          hasMore: data.hasMore || false
        }));
      }
    } catch (err) {
      console.error('Refresh error:', err);
    }
  });

  const mergeWithAds = (items) => {
    if (!advertisements.length) return items;

    const eligibleAds = advertisements.filter(ad => {
      if (ad.maxImpressions && ad.impressions >= ad.maxImpressions) return false;
      const now = new Date();
      if (ad.startDate && new Date(ad.startDate) > now) return false;
      if (ad.endDate && new Date(ad.endDate) < now) return false;
      if (!ad.isActive) return false;
      if (!ad.tags || ad.tags.length === 0) return true;
      if (!userInterests || userInterests.length === 0) return true;
      return ad.tags.some(tag => userInterests.includes(tag));
    });

    if (!eligibleAds.length) return items;

    const adInterval = Math.floor(items.length / (eligibleAds.length + 1)) || 3;
    const merged = [...items];

    eligibleAds.forEach((ad, idx) => {
      const insertAt = (idx + 1) * adInterval;
      if (insertAt <= merged.length) {
        merged.splice(insertAt, 0, { ...ad, isAd: true, _id: `ad-${ad._id}` });
      }
    });

    return merged;
  };

  const trackAdImpression = async (adId) => {
    try {
      await fetch(`${API_URL}/api/advertisements/${adId}/track`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'impression' })
      });
      dispatch(incrementAdImpression(adId));
    } catch (err) {
      console.error('Ad impression tracking error:', err);
    }
  };

  const trackAdClick = async (adId) => {
    try {
      await fetch(`${API_URL}/api/advertisements/${adId}/track`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'click' })
      });
      dispatch(incrementAdClick(adId));
    } catch (err) {
      console.error('Ad click tracking error:', err);
    }
  };

  const handleAdClick = async (ad) => {
    trackAdClick(ad._id);

    if (ad.tags && ad.tags.length > 0) {
      const newInterests = [...new Set([...userInterests, ...ad.tags])];
      if (newInterests.length !== userInterests.length) {
        dispatch(addInterests(ad.tags));
        try {
          await fetch(`${API_URL}/api/profile/interests`, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ interests: newInterests })
          });
        } catch (err) {
          console.error('Interest update error:', err);
        }
      }
    }

    if (ad.targetUrl) {
      window.open(ad.targetUrl, '_blank', 'noopener,noreferrer');
    }
  };

  const openMediaDialog = (type) => {
    if (type === 'gif') {
      setGiphyPickerOpen(true);
    } else {
      setMediaDialogType(type);
      setMediaDialogOpen(true);
    }
  };

  const handleMediaSelect = (newMedia) => {
    setSelectedMedia([...selectedMedia, ...newMedia]);
  };

  const handleGiphySelect = (gifData) => {
    setSelectedMedia([...selectedMedia, gifData]);
  };

  const handleRemoveMedia = (index) => {
    setSelectedMedia(selectedMedia.filter((_, i) => i !== index));
  };

  const getMediaCountByType = (type) => {
    return selectedMedia.filter(m => m.type === type).length;
  };

  const handleCreateConfession = async () => {
    if (!newConfessionContent.trim() || isSubmitting) return;

    setIsSubmitting(true);
    setUploadProgress(0);

    try {
      const formData = new FormData();
      formData.append('content', newConfessionContent);
      formData.append('isAnonymous', isAnonymous);

      selectedMedia.forEach((media) => {
        if (media.file) {
          formData.append('media', media.file);
        }
      });

      const giphyGifs = selectedMedia.filter(m => m.type === 'gif' && !m.file);
      if (giphyGifs.length > 0) {
        formData.append('giphyGifs', JSON.stringify(giphyGifs.map(g => ({
          url: g.url,
          type: 'gif'
        }))));
      }

      if (selectedSpotifyTrack) {
        formData.append('spotifyTrack', JSON.stringify(selectedSpotifyTrack));
      }

      // Use XMLHttpRequest for real-time upload progress tracking
      const response = await new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();

        // Real-time upload progress (0-50% for network upload)
        xhr.upload.addEventListener('progress', (e) => {
          if (e.lengthComputable) {
            // Network upload takes 0-50% of progress
            const percentComplete = Math.round((e.loaded / e.total) * 50);
            setUploadProgress(percentComplete);
          }
        });

        // Upload başladığında progress'i başlat
        xhr.upload.addEventListener('loadstart', () => {
          setUploadProgress(1);
        });

        // Upload tamamlandı, şimdi backend processing (Cloudinary upload) başlıyor
        xhr.upload.addEventListener('loadend', () => {
          setUploadProgress(50); // Network upload bitti, backend processing başladı

          // Backend'de Cloudinary upload simülasyonu (50-90%)
          let backendProgress = 50;
          const backendInterval = setInterval(() => {
            backendProgress += 5;
            if (backendProgress >= 90) {
              backendProgress = 90;
              clearInterval(backendInterval);
            }
            setUploadProgress(backendProgress);
          }, 200);

          // Cleanup when response arrives
          xhr.addEventListener('load', () => clearInterval(backendInterval));
        });

        xhr.addEventListener('load', () => {
          setUploadProgress(100); // Tamamlandı

          if (xhr.status >= 200 && xhr.status < 300) {
            resolve({
              ok: true,
              status: xhr.status,
              json: async () => JSON.parse(xhr.responseText)
            });
          } else {
            resolve({
              ok: false,
              status: xhr.status,
              json: async () => JSON.parse(xhr.responseText)
            });
          }
        });

        xhr.addEventListener('error', () => {
          reject(new Error('Network error'));
        });

        xhr.addEventListener('abort', () => {
          reject(new Error('Upload aborted'));
        });

        xhr.open('POST', `${API_URL}/api/confessions`);
        xhr.setRequestHeader('Authorization', `Bearer ${token}`);

        // SECURITY: Send Spotify token for verification
        if (selectedSpotifyTrack) {
          const spotifyToken = localStorage.getItem('spotify_access_token');
          if (spotifyToken) {
            xhr.setRequestHeader('X-Spotify-Token', spotifyToken);
          }
        }

        xhr.send(formData);
      });

      if (response.status === 429) {
        const data = await response.json();
        dispatch(addToast({ message: `${data.error}. ${data.remainingSeconds} saniye sonra tekrar dene.`, type: 'warning' }));
        return;
      }

      if (response.ok) {
        const newConfession = await response.json();
        console.log('Yeni itiraf:', newConfession); // Debug için
        dispatch(addConfession(newConfession));
        dispatch(setNewConfessionContent(''));
        setSelectedMedia([]);
        setSelectedSpotifyTrack(null);
        dispatch(addToast({ message: 'İtiraf başarıyla paylaşıldı!', type: 'success' }));
      } else {
        const errorData = await response.json();
        dispatch(addToast({ message: errorData.error || 'İtiraf paylaşılamadı. Lütfen tekrar dene.', type: 'error' }));
      }
    } catch (err) {
      console.error(err);
      dispatch(addToast({ message: 'Bir hata oluştu. Lütfen tekrar dene.', type: 'error' }));
    } finally {
      setIsSubmitting(false);
      // Progress bar'ı kısa bir süre daha göster, sonra gizle
      setTimeout(() => {
        setUploadProgress(0);
      }, 500);
    }
  };

  const handleLike = async (postId) => {
    try {
      const res = await fetch(`${API_URL}/api/posts/${postId}/like`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const updatedItem = await res.json();
        dispatch(setConfessions(confessions.map(c => c._id === postId ? {
          ...c,
          likes: updatedItem.likes,
          author: updatedItem.author || c.author
        } : c)));
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Post edit/delete handlers
  const handleEditPost = (post) => {
    setEditingPostId(post._id);
    setEditingPostContent(post.content);
    setPostMenuOpen(null);
  };

  const handleCancelEdit = () => {
    setEditingPostId(null);
    setEditingPostContent('');
  };

  const handleSaveEdit = async (postId) => {
    if (!editingPostContent.trim()) {
      dispatch(addToast({ message: 'İtiraf içeriği boş olamaz', type: 'error' }));
      return;
    }
    try {
      const res = await fetch(`${API_URL}/api/posts/${postId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ content: editingPostContent })
      });

      if (res.ok) {
        const updatedPost = await res.json();
        dispatch(setConfessions(confessions.map(c => c._id === postId ? updatedPost : c)));
        setEditingPostId(null);
        setEditingPostContent('');
        dispatch(addToast({ message: 'İtiraf başarıyla güncellendi', type: 'success' }));
      } else {
        const errorData = await res.json();
        dispatch(addToast({ message: errorData.error || 'İtiraf güncellenemedi', type: 'error' }));
      }
    } catch (err) {
      console.error(err);
      dispatch(addToast({ message: 'Bir hata oluştu', type: 'error' }));
    }
  };

  const handleDeletePost = async (postId) => {
    if (!window.confirm('Bu itirafı silmek istediğinize emin misiniz? Bu işlem geri alınamaz.')) return;
    try {
      const res = await fetch(`${API_URL}/api/posts/${postId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        dispatch(setConfessions(confessions.filter(c => c._id !== postId)));
        dispatch(addToast({ message: 'İtiraf başarıyla silindi', type: 'success' }));
      } else {
        const errorData = await res.json();
        dispatch(addToast({ message: errorData.error || 'İtiraf silinemedi', type: 'error' }));
      }
    } catch (err) {
      console.error(err);
      dispatch(addToast({ message: 'Bir hata oluştu', type: 'error' }));
    }
  };

  const handleLoadMoreConfessions = async () => {
    if (!confessionsPagination.hasMore || isLoadingConfessions) return;

    dispatch(setLoadingConfessions(true));

    try {
      const nextPage = confessionsPagination.currentPage + 1;
      const res = await fetch(`${API_URL}/api/confessions?page=${nextPage}&limit=10`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (res.ok) {
        const data = await res.json();
        dispatch(appendConfessions(data.posts || []));
        dispatch(setConfessionsPagination({
          currentPage: data.currentPage || nextPage,
          totalPages: data.totalPages || 1,
          hasMore: data.hasMore || false
        }));
      }
    } catch (err) {
      console.error('Load more error:', err);
    } finally {
      dispatch(setLoadingConfessions(false));
    }
  };

  const renderContentWithMentions = (text) => {
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

  return (
    <div ref={confessionsRefresh.containerRef} className="relative overflow-y-auto h-full">
      {/* Pull-to-refresh indicator */}
      {confessionsRefresh.pullDistance > 0 && (
        <div
          className="absolute top-0 left-0 right-0 flex items-center justify-center transition-all z-50"
          style={{ height: `${confessionsRefresh.pullDistance}px` }}
        >
          <div className={`transition-transform ${confessionsRefresh.isPulling ? 'scale-100' : 'scale-75'}`}>
            <RefreshCw
              size={24}
              className={`text-red-600 ${confessionsRefresh.isPulling ? 'animate-spin' : ''}`}
            />
          </div>
        </div>
      )}

      <MobileHeader
        onMenuClick={setIsMobileMenuOpen}
        onNotificationsClick={setShowNotifications}
        unreadCount={unreadCount}
      />

      <header className="hidden md:block sticky top-0 z-10 bg-white/100 backdrop-blur-md border-b border-gray-200 p-4 font-bold text-lg">
        İtiraflar
      </header>

      {/* --- CREATE CONFESSION AREA (FeedPage Style) --- */}
      <div className="group bg-white p-4 border-b border-gray-100 flex gap-4 transition-colors hover:bg-gray-50/30">
        
        {/* Avatar Area - Logic: Ghost vs Real User */}
        <div className="shrink-0 pt-1">
          <div 
            className={`
              w-11 h-11 rounded-full flex items-center justify-center overflow-hidden border border-gray-200 shadow-sm transition-all duration-300
              ${isAnonymous ? 'bg-gray-900 border-gray-800' : 'bg-gray-200'}
            `}
          >
            {isAnonymous ? (
              <Ghost size={22} className="text-white animate-pulse" strokeWidth={2} />
            ) : (
              currentUserAvatar ? (
                <img src={currentUserAvatar} alt="User" className="w-full h-full object-cover" />
              ) : (
                <User size={22} className="text-gray-500" strokeWidth={2.5} />
              )
            )}
          </div>
        </div>

        {/* Input & Actions Area */}
        <div className="flex-1 min-w-0">
          
          {/* Text Area */}
          <textarea
            className="w-full resize-none outline-none text-lg text-gray-900 placeholder-gray-400 bg-transparent min-h-[60px] py-1"
            placeholder={isAnonymous ? "Kimse bilmeden içini dök..." : "Kampüste neler oluyor?"}
            value={newConfessionContent}
            onChange={(e) => dispatch(setNewConfessionContent(e.target.value))}
            rows={2}
          />

          {/* --- SPOTIFY TRACK PREVIEW --- */}
          {selectedSpotifyTrack && (
            <div className="mt-3 mb-2 animate-in fade-in slide-in-from-bottom-2">
              <div className="relative">
                <SpotifyTrackDisplay track={selectedSpotifyTrack} compact={true} />
                <button
                  onClick={() => setSelectedSpotifyTrack(null)}
                  className="absolute top-2 right-2 p-1.5 bg-black/60 hover:bg-black/80 text-white rounded-full backdrop-blur-sm transition-all duration-200 hover:scale-110 shadow-sm z-10"
                  title="Kaldır"
                >
                  <X size={14} strokeWidth={2.5} />
                </button>
              </div>
            </div>
          )}

          {/* --- MEDIA PREVIEW (SQUARE THUMBNAIL) --- */}
          {selectedMedia.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-3 mb-2 animate-in fade-in slide-in-from-bottom-2">
              {selectedMedia.map((media, index) => (
                <div 
                  key={index} 
                  className="relative group rounded-xl overflow-hidden border border-gray-200 w-28 h-28 bg-gray-100 shadow-sm"
                >
                  {/* Media Content */}
                  {media.type === 'video' ? (
                    <div className="relative w-full h-full bg-gray-900 flex items-center justify-center">
                      <video src={media.preview} className="w-full h-full object-cover opacity-80" muted />
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-8 h-8 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center border border-white/40 shadow-lg">
                           <Play size={16} className="text-white ml-0.5" fill="currentColor" />
                        </div>
                      </div>
                    </div>
                  ) : (
                    <img 
                      src={media.preview} 
                      alt="preview" 
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" 
                    />
                  )}

                  {/* Remove Button */}
                  <button
                    onClick={() => handleRemoveMedia(index)}
                    className="absolute top-1 right-1 p-1 bg-black/60 hover:bg-black/80 text-white rounded-full backdrop-blur-sm transition-all duration-200 hover:scale-110 shadow-sm z-10"
                    title="Kaldır"
                  >
                    <X size={12} strokeWidth={2.5} />
                  </button>

                  {/* Badge Info */}
                  <div className="absolute bottom-1 left-1 flex gap-1 z-10">
                    {media.type === 'gif' && (
                      <div className="px-1.5 py-0.5 bg-purple-600/90 backdrop-blur-md text-white text-[9px] font-bold rounded-md shadow-sm">GIF</div>
                    )}
                    {media.type === 'video' && (
                      <div className="px-1.5 py-0.5 bg-blue-600/90 backdrop-blur-md text-white text-[9px] font-bold rounded-md shadow-sm">VIDEO</div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* --- ACTIONS TOOLBAR --- */}
          <div className="flex items-center justify-between mt-2 pt-1">
            
            {/* Left: Media Buttons */}
            <div className="flex items-center gap-1 -ml-2">
              <button
                onClick={() => openMediaDialog('image')}
                disabled={getMediaCountByType('image') >= 4}
                className="relative p-2.5 rounded-xl text-gray-500 hover:text-sky-600 hover:bg-sky-50 transition-all duration-200 group disabled:opacity-40 disabled:cursor-not-allowed"
                title="Fotoğraf Ekle"
              >
                <Image size={20} strokeWidth={2} className="group-hover:scale-110 transition-transform" />
                {getMediaCountByType('image') > 0 && (
                   <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-sky-600 text-[9px] font-bold text-white ring-2 ring-white">
                     {getMediaCountByType('image')}
                   </span>
                )}
              </button>

              <button
                onClick={() => openMediaDialog('gif')}
                disabled={getMediaCountByType('gif') >= 1}
                className="relative p-2.5 rounded-xl text-gray-500 hover:text-purple-600 hover:bg-purple-50 transition-all duration-200 group disabled:opacity-40 disabled:cursor-not-allowed"
                title="GIF Ekle"
              >
                <FileImage size={20} strokeWidth={2} className="group-hover:scale-110 transition-transform" />
                {getMediaCountByType('gif') > 0 && (
                  <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-purple-600 text-[9px] font-bold text-white ring-2 ring-white">1</span>
                )}
              </button>

              <button
                onClick={() => openMediaDialog('video')}
                disabled={getMediaCountByType('video') >= 1}
                className="relative p-2.5 rounded-xl text-gray-500 hover:text-emerald-600 hover:bg-emerald-50 transition-all duration-200 group disabled:opacity-40 disabled:cursor-not-allowed"
                title="Video Ekle"
              >
                <Film size={20} strokeWidth={2} className="group-hover:scale-110 transition-transform" />
                {getMediaCountByType('video') > 0 && (
                  <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-emerald-600 text-[9px] font-bold text-white ring-2 ring-white">1</span>
                )}
              </button>

              <button
                onClick={() => setSpotifyPickerOpen(true)}
                disabled={selectedSpotifyTrack !== null}
                className="relative p-2.5 rounded-xl text-gray-500 hover:text-green-600 hover:bg-green-50 transition-all duration-200 group disabled:opacity-40 disabled:cursor-not-allowed"
                title="Spotify Şarkısı Ekle"
              >
                <Music size={20} strokeWidth={2} className="group-hover:scale-110 transition-transform" />
                {selectedSpotifyTrack && (
                  <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-green-600 text-[9px] font-bold text-white ring-2 ring-white">1</span>
                )}
              </button>
            </div>

            {/* Right: Anonymous & Submit */}
            <div className="flex items-center gap-3">
              
              {/* Anonim Toggle Button */}
              <button
                onClick={() => dispatch(setIsAnonymous(!isAnonymous))}
                className={`
                  flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold transition-all duration-200 border select-none
                  ${isAnonymous 
                    ? 'bg-gray-900 text-white border-gray-900 shadow-lg shadow-gray-900/20' 
                    : 'bg-white text-gray-500 border-gray-200 hover:bg-gray-50 hover:text-gray-700'
                  }
                `}
                title="Anonim Modu Aç/Kapa"
              >
                <Ghost size={16} strokeWidth={2.5} className={isAnonymous ? "animate-pulse" : ""} />
                <span className="hidden sm:inline">{isAnonymous ? 'Gizli' : 'Açık'}</span>
              </button>
              
              {/* Divider */}
              <div className="h-6 w-px bg-gray-200 hidden sm:block"></div>

              {/* Submit Button */}
              <div className="flex flex-col gap-2">
                <button
                  onClick={handleCreateConfession}
                  disabled={!newConfessionContent.trim() || isSubmitting}
                  className="flex items-center gap-2 bg-rose-600 text-white px-5 py-2 rounded-xl text-sm font-bold hover:bg-rose-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-rose-600/20 hover:shadow-rose-600/30 active:scale-95"
                >
                   {isSubmitting ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      <span>...</span>
                    </>
                  ) : (
                    <>
                      <span>İtiraf Et</span>
                      <Send size={16} strokeWidth={2.5} />
                    </>
                  )}
                </button>

                {/* Upload Progress Bar */}
                {isSubmitting && uploadProgress > 0 && (
                  <div className="w-full min-w-[120px]">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs text-gray-600">Yükleniyor...</span>
                      <span className="text-xs font-bold text-rose-600">{uploadProgress}%</span>
                    </div>
                    <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-rose-500 to-rose-600 transition-all duration-300 ease-out"
                        style={{ width: `${uploadProgress}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* Confessions List */}
      <div className="divide-y divide-gray-100">
        {isLoadingConfessions && confessions.length === 0 ? (
          <FeedShimmer count={5} />
        ) : (
          <>
            {mergeWithAds(confessions).map((item) => {
              if (item.isAd) {
                return (
                  <AdCard
                    key={item._id}
                    ad={item}
                    onView={() => trackAdImpression(item._id.split('-')[1])}
                    onClick={() => handleAdClick({ _id: item._id.split('-')[1], targetUrl: item.targetUrl, tags: item.tags })}
                    onImageClick={(img) => dispatch(setSelectedImage(img))}
                  />
                );
              }

              return (
                <div
                  key={item._id}
                  className="p-5 hover:bg-gray-50/50 transition cursor-pointer"
                  onClick={() => navigate(`/itiraf/${item._id}`)}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                      {item.isAnonymous ? (
                        <div className="w-9 h-9 bg-gray-200 rounded-full flex items-center justify-center font-bold text-xs text-gray-500">
                          ?
                        </div>
                      ) : (
                        <div
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/kullanici/${item.author?.username}`);
                          }}
                        >
                          {item.author?.profilePicture ? (
                            <img
                              src={item.author.profilePicture}
                              className="w-9 h-9 bg-gray-200 rounded-full object-cover hover:opacity-80 transition"
                              alt={item.author.username}
                            />
                          ) : (
                            <div className="w-9 h-9 bg-gray-200 rounded-full flex items-center justify-center hover:opacity-80 transition">
                              <User size={16} className="text-gray-400" />
                            </div>
                          )}
                        </div>
                      )}
                      <div>
                        {item.isAnonymous ? (
                          <div>
                            <div className="font-bold text-sm text-gray-900">Anonim</div>
                            <div className="text-xs text-gray-400">{new Date(item.createdAt).toLocaleDateString()}</div>
                          </div>
                        ) : (
                          <div>
                            <div className="flex items-center gap-2">
                              <div
                                className="font-bold text-sm text-gray-900 hover:underline"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  navigate(`/kullanici/${item.author?.username}`);
                                }}
                              >
                                {item.author?.fullName}
                              </div>
                              {item.author?.badges && item.author.badges.length > 0 && (
                                <UserBadges badges={item.author.badges} size="sm" />
                              )}
                            </div>
                            <div className="text-xs text-gray-400">
                              @{item.author?.username} · {new Date(item.createdAt).toLocaleDateString()}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* More Menu - Only for own posts */}
                    {item.author?._id === userId && (
                      <div className="relative" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setPostMenuOpen(postMenuOpen === item._id ? null : item._id);
                          }}
                          className="text-gray-400 hover:text-blue-500 transition p-1"
                        >
                          <MoreHorizontal size={20} />
                        </button>
                        {postMenuOpen === item._id && (
                          <div className="absolute right-0 top-8 bg-white shadow-lg border border-gray-100 rounded-lg py-1 z-10 w-32">
                            <button
                              onClick={() => handleEditPost(item)}
                              className="flex items-center gap-2 w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                            >
                              <Edit2 size={14} /> Düzenle
                            </button>
                            <button
                              onClick={() => handleDeletePost(item._id)}
                              className="flex items-center gap-2 w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                            >
                              <Trash2 size={14} /> Sil
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Content - Editable or Display */}
                  {editingPostId === item._id ? (
                    <div className="mb-3 space-y-2" onClick={(e) => e.stopPropagation()}>
                      <textarea
                        value={editingPostContent}
                        onChange={(e) => setEditingPostContent(e.target.value)}
                        className="w-full p-2 border border-gray-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                        rows={3}
                        autoFocus
                      />
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleSaveEdit(item._id)}
                          className="px-3 py-1 bg-blue-500 text-white rounded-full text-sm font-medium hover:bg-blue-600"
                        >
                          Kaydet
                        </button>
                        <button
                          onClick={handleCancelEdit}
                          className="px-3 py-1 bg-gray-200 text-gray-700 rounded-full text-sm font-medium hover:bg-gray-300"
                        >
                          İptal
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="text-gray-800 mb-3 whitespace-pre-wrap">
                      {renderContentWithMentions(item.content)}
                    </div>
                  )}

                  {/* Spotify Track Display */}
                  {item.spotifyTrack && (
                    <div className="mb-3" onClick={(e) => e.stopPropagation()}>
                      <SpotifyTrackDisplay track={item.spotifyTrack} compact={true} />
                    </div>
                  )}

                  {/* Media Display */}
                  {item.media && item.media.length > 0 && (
                    <MediaDisplay media={item.media} />
                  )}

                  <div className="flex items-center gap-4" onClick={(e) => e.stopPropagation()}>
                    <LikeButton
                      isLiked={item.likes.includes(userId)}
                      likeCount={item.likes.length}
                      onClick={() => handleLike(item._id)}
                    />
                    <button
                      onClick={() => navigate(`/itiraf/${item._id}`)}
                      className="flex items-center gap-2 text-gray-600 hover:text-blue-600 transition"
                    >
                      <MessageSquare size={20} />
                      <span className="text-sm font-medium">Yorum yap</span>
                    </button>
                  </div>
                </div>
              );
            })}
            <LoadMoreButton
              onLoadMore={handleLoadMoreConfessions}
              isLoading={isLoadingConfessions}
              hasMore={confessionsPagination.hasMore}
            />
          </>
        )}
      </div>

      <MediaUploadDialog
        isOpen={mediaDialogOpen}
        onClose={() => setMediaDialogOpen(false)}
        type={mediaDialogType}
        onMediaSelect={handleMediaSelect}
        currentMedia={selectedMedia}
      />

      <GiphyPicker
        isOpen={giphyPickerOpen}
        onClose={() => setGiphyPickerOpen(false)}
        onSelect={handleGiphySelect}
      />

      <SpotifyTrackPicker
        isOpen={spotifyPickerOpen}
        onClose={() => setSpotifyPickerOpen(false)}
        onSelect={(track) => {
          setSelectedSpotifyTrack(track);
          setSpotifyPickerOpen(false);
        }}
      />
    </div>
  );
}