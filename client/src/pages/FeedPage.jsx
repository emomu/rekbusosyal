import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate, useLoaderData, useOutletContext } from 'react-router-dom';
import { User, MessageSquare, RefreshCw, Image, Film, FileImage, Send, Loader2, Play, X, Music } from 'lucide-react';
import { setPosts, addPost, appendPosts, setPostsPagination } from '../store/slices/postsSlice';
import { setNewPostContent, setLoadingPosts, setSelectedImage, addToast } from '../store/slices/uiSlice';
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
import Post from '../components/Post';
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
            <img
              src={ad.profileImageUrl}
              alt={ad.title}
              className="w-9 h-9 rounded-full object-cover border border-gray-200"
            />
          ) : (
            <div className="w-9 h-9 bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-full flex items-center justify-center font-bold text-xs shadow-sm">
              AD
            </div>
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
            <img
              src={ad.imageUrl}
              alt={ad.title}
              className="w-full h-auto object-cover cursor-pointer hover:opacity-95 transition"
              onClick={(e) => {
                e.stopPropagation();
                onImageClick(ad.imageUrl);
              }}
            />
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * FeedPage - Main feed showing posts with ads
 */
export default function FeedPage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { setIsMobileMenuOpen, setShowNotifications, unreadCount } = useOutletContext();
  const loaderData = useLoaderData();

  const { userId, token, userInterests } = useSelector((state) => state.auth);
  const { posts, postsPagination } = useSelector((state) => state.posts);
  const { advertisements } = useSelector((state) => state.advertisements);
  const { newPostContent, isLoadingPosts } = useSelector((state) => state.ui);

  const [currentUserInfo, setCurrentUserInfo] = useState(null);
  const [selectedMedia, setSelectedMedia] = useState([]);
  const [mediaDialogOpen, setMediaDialogOpen] = useState(false);
  const [mediaDialogType, setMediaDialogType] = useState(null); // 'image' | 'gif' | 'video'
  const [giphyPickerOpen, setGiphyPickerOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [spotifyPickerOpen, setSpotifyPickerOpen] = useState(false);
  const [selectedSpotifyTrack, setSelectedSpotifyTrack] = useState(null);

  // Autocomplete states
  const [showCommandSuggestions, setShowCommandSuggestions] = useState(false);
  const [showUserSuggestions, setShowUserSuggestions] = useState(false);
  const [userSuggestions, setUserSuggestions] = useState([]);
  const [mentionSearchQuery, setMentionSearchQuery] = useState('');
  const [cursorPosition, setCursorPosition] = useState(0);

  // Available commands
  const availableCommands = [
    {
      command: '/yilbasi',
      description: 'Kullanıcıya yılbaşı kartı gönder',
      usage: '/yilbasi @kullaniciadi mesaj',
      icon: '🎄'
    },
    {
      command: '/kayip',
      description: 'Kayıp eşya ilanı oluştur',
      usage: '/kayip Kırmızı çanta kaybettim...',
      icon: '🔍'
    },
    {
      command: '/tavsiye',
      description: 'Tavsiye iste (film, kitap, ders vb.)',
      usage: '/tavsiye Film önerir misiniz?',
      icon: '💡'
    },
    {
      command: '/ariyorum',
      description: 'Bir şey arıyorum (ders notu, kitap vb.)',
      usage: '/ariyorum Matematik 101 ders notları',
      icon: '🔎'
    }
  ];

  // Handle text input change with autocomplete
  const handleInputChange = (e) => {
    const text = e.target.value;
    const position = e.target.selectionStart;

    dispatch(setNewPostContent(text));
    setCursorPosition(position);

    // Check for command suggestions (/)
    if (text.startsWith('/') && !text.includes(' ')) {
      setShowCommandSuggestions(true);
      setShowUserSuggestions(false);
    } else if (text.startsWith('/')) {
      setShowCommandSuggestions(false);
    } else {
      setShowCommandSuggestions(false);
    }

    // Check for mention suggestions (@)
    const textBeforeCursor = text.substring(0, position);
    const lastAtSymbol = textBeforeCursor.lastIndexOf('@');

    if (lastAtSymbol !== -1) {
      const textAfterAt = textBeforeCursor.substring(lastAtSymbol + 1);

      // Only show suggestions if @ is at start of word (after space or at beginning)
      const charBeforeAt = lastAtSymbol > 0 ? textBeforeCursor[lastAtSymbol - 1] : ' ';
      const isValidMention = charBeforeAt === ' ' || lastAtSymbol === 0;

      if (isValidMention && !textAfterAt.includes(' ')) {
        setMentionSearchQuery(textAfterAt);
        setShowUserSuggestions(true);
        setShowCommandSuggestions(false);

        // Search for users
        if (textAfterAt.length >= 1) {
          searchUsers(textAfterAt);
        }
      } else {
        setShowUserSuggestions(false);
      }
    } else {
      setShowUserSuggestions(false);
    }
  };

  // Search users for mentions
  const searchUsers = async (query) => {
    try {
      const res = await fetch(`${API_URL}/api/search/users?q=${encodeURIComponent(query)}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (res.ok) {
        const data = await res.json();
        setUserSuggestions(Array.isArray(data) ? data.slice(0, 5) : []);
      }
    } catch (error) {
      console.error('User search error:', error);
    }
  };

  // Insert command
  const insertCommand = (command) => {
    dispatch(setNewPostContent(command.usage));
    setShowCommandSuggestions(false);
  };

  // Insert mention
  const insertMention = (username) => {
    const textBeforeCursor = newPostContent.substring(0, cursorPosition);
    const textAfterCursor = newPostContent.substring(cursorPosition);
    const lastAtSymbol = textBeforeCursor.lastIndexOf('@');

    const newText =
      textBeforeCursor.substring(0, lastAtSymbol + 1) +
      username + ' ' +
      textAfterCursor;

    dispatch(setNewPostContent(newText));
    setShowUserSuggestions(false);
  };

  // Load initial data from loader into Redux
  useEffect(() => {
    if (loaderData && loaderData.posts) {
      dispatch(setPosts(loaderData.posts));
      dispatch(setPostsPagination({
        currentPage: loaderData.currentPage || 1,
        totalPages: loaderData.totalPages || 1,
        hasMore: loaderData.hasMore || false
      }));
    }
  }, [loaderData, dispatch]);

  // Pull-to-refresh hook
  const postsRefresh = usePullToRefresh(async () => {
    try {
      const res = await fetch(`${API_URL}/api/posts?page=1&limit=10`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        dispatch(setPosts(data.posts || []));
        dispatch(setPostsPagination({
          currentPage: data.currentPage || 1,
          totalPages: data.totalPages || 1,
          hasMore: data.hasMore || false
        }));
      }
    } catch (err) {
      console.error('Refresh error:', err);
    }
  });

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

  // Merge posts with ads
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

  // Track ad impression
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

  // Track ad click
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

  // Create new post with media support
  // Handle Christmas card command
  const handleSendChristmasCard = async (username, message) => {
    try {
      const res = await fetch(`${API_URL}/api/christmas-cards/send`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          recipientUsername: username,
          message
        })
      });

      const data = await res.json();

      if (res.ok) {
        dispatch(addToast({ message: `🎄 ${data.message}`, type: 'success' }));
        dispatch(setNewPostContent(''));
        setShowCommandSuggestions(false);
        setShowUserSuggestions(false);
      } else {
        dispatch(addToast({ message: `❌ ${data.error}`, type: 'error' }));
      }
    } catch (err) {
      console.error('Christmas card send error:', err);
      dispatch(addToast({ message: 'Yılbaşı kartı gönderilirken bir hata oluştu', type: 'error' }));
    }
  };

  const handleCreatePost = async () => {
    if (!newPostContent.trim() || isSubmitting) return;

    // Check for /yilbasi command
    const christmasCardMatch = newPostContent.match(/^\/yilbasi\s+(@?\w+)\s+(.+)$/);
    if (christmasCardMatch) {
      const [, username, message] = christmasCardMatch;
      await handleSendChristmasCard(username, message);
      return;
    }

    // Check for special commands and add tags
    let postContent = newPostContent;
    let specialTag = null;

    if (newPostContent.startsWith('/kayip ')) {
      postContent = newPostContent.replace('/kayip ', '');
      specialTag = 'kayip';
    } else if (newPostContent.startsWith('/tavsiye ')) {
      postContent = newPostContent.replace('/tavsiye ', '');
      specialTag = 'tavsiye';
    } else if (newPostContent.startsWith('/ariyorum ')) {
      postContent = newPostContent.replace('/ariyorum ', '');
      specialTag = 'ariyorum';
    }

    setIsSubmitting(true);
    setUploadProgress(0);

    try {
      const formData = new FormData();
      formData.append('content', postContent);

      // Add special tag if exists
      if (specialTag) {
        formData.append('specialTag', specialTag);
      }

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

      // Spotify track ekle
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

        xhr.open('POST', `${API_URL}/api/posts`);
        xhr.setRequestHeader('Authorization', `Bearer ${token}`);
        xhr.send(formData);
      });

      if (response.status === 429) {
        const data = await response.json();
        dispatch(addToast({ message: `${data.error}. ${data.remainingSeconds} saniye sonra tekrar dene.`, type: 'warning' }));
        return;
      }

      if (response.ok) {
        const newPost = await response.json();
        dispatch(addPost(newPost));
        dispatch(setNewPostContent(''));
        setSelectedMedia([]);
        setSelectedSpotifyTrack(null);
        dispatch(addToast({ message: 'Post başarıyla paylaşıldı!', type: 'success' }));
      } else {
        const errorData = await response.json();
        dispatch(addToast({ message: errorData.error || 'Post paylaşılamadı. Lütfen tekrar dene.', type: 'error' }));
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
    const updated = selectedMedia.filter((_, i) => i !== index);
    setSelectedMedia(updated);
  };

  const getMediaCountByType = (type) => {
    return selectedMedia.filter(m => m.type === type).length;
  };

  const handleLike = async (postId) => {
    try {
      const res = await fetch(`${API_URL}/api/posts/${postId}/like`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const updatedItem = await res.json();
        dispatch(setPosts(posts.map(p => p._id === postId ? {
          ...p,
          likes: updatedItem.likes,
          author: updatedItem.author || p.author
        } : p)));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleLoadMorePosts = async () => {
    if (!postsPagination.hasMore || isLoadingPosts) return;

    dispatch(setLoadingPosts(true));

    try {
      const nextPage = postsPagination.currentPage + 1;
      const res = await fetch(`${API_URL}/api/posts?page=${nextPage}&limit=10`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        dispatch(appendPosts(data.posts || []));
        dispatch(setPostsPagination({
          currentPage: data.currentPage || nextPage,
          totalPages: data.totalPages || 1,
          hasMore: data.hasMore || false
        }));
      }
    } catch (err) {
      console.error('Load more error:', err);
    } finally {
      dispatch(setLoadingPosts(false));
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
    <div ref={postsRefresh.containerRef} className="relative overflow-y-auto h-full">
      {/* Pull-to-refresh indicator */}
      {postsRefresh.pullDistance > 0 && (
        <div
          className="absolute top-0 left-0 right-0 flex items-center justify-center transition-all z-50"
          style={{ height: `${postsRefresh.pullDistance}px` }}
        >
          <div className={`transition-transform ${postsRefresh.isPulling ? 'scale-100' : 'scale-75'}`}>
            <RefreshCw
              size={24}
              className={`text-blue-600 ${postsRefresh.isPulling ? 'animate-spin' : ''}`}
            />
          </div>
        </div>
      )}

      <MobileHeader
        onMenuClick={() => setIsMobileMenuOpen(true)}
        onNotificationsClick={() => setShowNotifications(true)}
        unreadCount={unreadCount}
      />

      <header className="hidden md:block sticky top-0 z-10 bg-white/100 backdrop-blur-md border-b border-gray-200 p-4 font-bold text-lg">
        Anasayfa
      </header>

      {/* --- CREATE POST AREA START --- */}
      <div className="group bg-white p-4 border-b border-gray-100 flex gap-4 transition-colors hover:bg-gray-50/30">
        
        {/* Avatar Area */}
        <div className="shrink-0">
          {currentUserInfo?.profilePicture ? (
            <img
              src={currentUserInfo.profilePicture}
              alt="Profil"
              className="w-11 h-11 rounded-full object-cover border border-gray-200 shadow-sm transition-transform hover:scale-105"
            />
          ) : (
            <div className="w-11 h-11 bg-blue-50 rounded-full flex items-center justify-center border border-blue-100 text-blue-900">
              <User size={20} strokeWidth={2.5} />
            </div>
          )}
        </div>

        {/* Input & Actions Area */}
        <div className="flex-1">
          
          {/* Text Input with Autocomplete */}
          <div className="relative">
            <textarea
              className="w-full resize-none outline-none text-lg text-gray-900 placeholder-gray-400 bg-transparent min-h-[60px] py-1"
              placeholder="Kampüste neler oluyor?  /komut , @kullaniciadi"
              rows={2}
              value={newPostContent}
              onChange={handleInputChange}
              style={{
                color: newPostContent.startsWith('/') ? '#dc2626' : newPostContent.includes('@') ? '#2563eb' : '#111827'
              }}
            />

            {/* Command Suggestions Dropdown */}
            {showCommandSuggestions && (
              <div className="absolute top-full left-0 mt-2 w-full max-w-md bg-white rounded-xl shadow-xl border border-gray-200 z-50 overflow-hidden animate-in fade-in slide-in-from-top-2">
                <div className="p-2 bg-gradient-to-r from-red-50 to-green-50 border-b border-gray-200">
                  <p className="text-xs font-semibold text-gray-700 flex items-center gap-2">
                    <span className="text-red-600">⚡</span>
                    Özel Komutlar
                  </p>
                </div>
                <div className="max-h-60 overflow-y-auto">
                  {availableCommands.map((cmd, index) => (
                    <button
                      key={index}
                      onClick={() => insertCommand(cmd)}
                      className="w-full p-3 hover:bg-gradient-to-r hover:from-red-50 hover:to-green-50 transition flex items-start gap-3 text-left border-b border-gray-100 last:border-0"
                    >
                      <span className="text-2xl flex-shrink-0">{cmd.icon}</span>
                      <div className="flex-1 min-w-0">
                        <div className="font-bold text-red-600 text-sm">{cmd.command}</div>
                        <div className="text-xs text-gray-600 mt-0.5">{cmd.description}</div>
                        <div className="text-xs text-gray-400 mt-1 font-mono bg-gray-100 px-2 py-1 rounded inline-block">
                          {cmd.usage}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* User Mentions Dropdown */}
            {showUserSuggestions && userSuggestions.length > 0 && (
              <div className="absolute top-full left-0 mt-2 w-full max-w-md bg-white rounded-xl shadow-xl border border-gray-200 z-50 overflow-hidden animate-in fade-in slide-in-from-top-2">
                <div className="p-2 bg-blue-50 border-b border-gray-200">
                  <p className="text-xs font-semibold text-gray-700 flex items-center gap-2">
                    <span className="text-blue-600">@</span>
                    Kullanıcı Önerileri
                  </p>
                </div>
                <div className="max-h-60 overflow-y-auto">
                  {userSuggestions.map((user) => (
                    <button
                      key={user._id}
                      onClick={() => insertMention(user.username)}
                      className="w-full p-3 hover:bg-blue-50 transition flex items-center gap-3 text-left border-b border-gray-100 last:border-0"
                    >
                      {user.profilePicture ? (
                        <img
                          src={user.profilePicture}
                          alt={user.username}
                          className="w-10 h-10 rounded-full object-cover border border-gray-200"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center border border-blue-200">
                          <User size={20} className="text-blue-600" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold text-gray-900 text-sm truncate">{user.fullName}</div>
                        <div className="text-xs text-blue-600">@{user.username}</div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Selected Media Preview - UPDATED: FLEX + SQUARE THUMBNAILS (w-28 h-28) */}
          {selectedMedia.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-3 mb-2 animate-in fade-in slide-in-from-bottom-2">
              {selectedMedia.map((media, index) => (
                <div 
                  key={index} 
                  className="relative group rounded-xl overflow-hidden border border-gray-200 w-28 h-28 bg-gray-100 shadow-sm"
                >
                  {media.type === 'video' ? (
                    <div className="relative w-full h-full bg-gray-900 flex items-center justify-center">
                      <video src={media.preview} className="w-full h-full object-cover opacity-80" muted />
                      {/* Play Icon Overlay */}
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-8 h-8 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center border border-white/40 shadow-lg">
                          <Play size={16} className="text-white ml-0.5" fill="currentColor" />
                        </div>
                      </div>
                    </div>
                  ) : (
                    <img 
                      src={media.preview} 
                      alt={media.name} 
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                    />
                  )}

                  {/* Remove Button - Top Right Floating */}
                  <button
                    onClick={() => handleRemoveMedia(index)}
                    className="absolute top-1 right-1 p-1 bg-black/60 hover:bg-black/80 text-white rounded-full backdrop-blur-sm transition-all duration-200 hover:scale-110 shadow-sm z-10"
                    title="Kaldır"
                  >
                    <X size={12} strokeWidth={2.5} />
                  </button>

                  {/* Info Badges */}
                  <div className="absolute bottom-1 left-1 flex gap-1 z-10">
                    {media.type === 'gif' && (
                      <div className="px-1.5 py-0.5 bg-purple-600/90 backdrop-blur-md text-white text-[9px] font-bold rounded-md shadow-sm">
                        GIF
                      </div>
                    )}
                     {media.type === 'video' && (
                      <div className="px-1.5 py-0.5 bg-blue-600/90 backdrop-blur-md text-white text-[9px] font-bold rounded-md shadow-sm">
                        VIDEO
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Spotify Track Preview */}
          {selectedSpotifyTrack && (
            <div className="mt-3">
              <SpotifyTrackDisplay track={selectedSpotifyTrack} compact={true} />
              <button
                onClick={() => setSelectedSpotifyTrack(null)}
                className="mt-2 text-xs text-red-600 hover:text-red-700 font-medium flex items-center gap-1"
              >
                <X size={14} /> Şarkıyı Kaldır
              </button>
            </div>
          )}

          {/* Actions Bar */}
          <div className="flex items-center justify-end gap-3 mt-2">
            
            {/* Media Type Buttons Group */}
            <div className="flex items-center gap-1">
              {/* Image Button */}
              <button
                onClick={() => openMediaDialog('image')}
                disabled={getMediaCountByType('image') >= 4}
                className="relative p-2.5 rounded-xl text-gray-500 hover:text-blue-600 hover:bg-blue-50 transition-all duration-200 group disabled:opacity-40 disabled:cursor-not-allowed"
                title="Fotoğraf Ekle (Max 4)"
              >
                <Image size={20} strokeWidth={2} className="group-hover:scale-110 transition-transform" />
                {getMediaCountByType('image') > 0 && (
                  <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-blue-600 text-[9px] font-bold text-white ring-2 ring-white">
                    {getMediaCountByType('image')}
                  </span>
                )}
              </button>

              {/* GIF Button */}
              <button
                onClick={() => openMediaDialog('gif')}
                disabled={getMediaCountByType('gif') >= 1}
                className="relative p-2.5 rounded-xl text-gray-500 hover:text-purple-600 hover:bg-purple-50 transition-all duration-200 group disabled:opacity-40 disabled:cursor-not-allowed"
                title="GIF Ekle (Max 1)"
              >
                <FileImage size={20} strokeWidth={2} className="group-hover:scale-110 transition-transform" />
                {getMediaCountByType('gif') > 0 && (
                  <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-purple-600 text-[9px] font-bold text-white ring-2 ring-white">
                    1
                  </span>
                )}
              </button>

              {/* Video Button */}
              <button
                onClick={() => openMediaDialog('video')}
                disabled={getMediaCountByType('video') >= 1}
                className="relative p-2.5 rounded-xl text-gray-500 hover:text-green-600 hover:bg-green-50 transition-all duration-200 group disabled:opacity-40 disabled:cursor-not-allowed"
                title="Video Ekle (Max 1)"
              >
                <Film size={20} strokeWidth={2} className="group-hover:scale-110 transition-transform" />
                {getMediaCountByType('video') > 0 && (
                  <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-green-600 text-[9px] font-bold text-white ring-2 ring-white">
                    1
                  </span>
                )}
              </button>

              {/* Spotify Button */}
              <button
                onClick={() => setSpotifyPickerOpen(true)}
                disabled={selectedSpotifyTrack !== null}
                className="relative p-2.5 rounded-xl text-gray-500 hover:text-green-600 hover:bg-green-50 transition-all duration-200 group disabled:opacity-40 disabled:cursor-not-allowed"
                title="Spotify Şarkısı Ekle"
              >
                <Music size={20} strokeWidth={2} className="group-hover:scale-110 transition-transform" />
                {selectedSpotifyTrack && (
                  <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-green-600 text-[9px] font-bold text-white ring-2 ring-white">
                    1
                  </span>
                )}
              </button>
            </div>

            {/* Share Button (Primary) */}
            <div className="flex flex-col gap-2">
              <button
                onClick={handleCreatePost}
                disabled={!newPostContent.trim() || isSubmitting}
                className="flex items-center gap-2 bg-blue-900 text-white px-6 py-2 rounded-xl text-sm font-bold hover:bg-blue-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-blue-900/20 hover:shadow-blue-900/30 active:scale-95"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    <span>Paylaşılıyor</span>
                  </>
                ) : (
                  <>
                    <span>Paylaş</span>
                    <Send size={16} strokeWidth={2.5} />
                  </>
                )}
              </button>

              {/* Upload Progress Bar */}
              {isSubmitting && uploadProgress > 0 && (
                <div className="w-full">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-gray-600">Yükleniyor...</span>
                    <span className="text-xs font-bold text-blue-900">{uploadProgress}%</span>
                  </div>
                  <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-blue-500 to-blue-900 transition-all duration-300 ease-out"
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      {/* --- CREATE POST AREA END --- */}

      {/* Posts List */}
      <div className="divide-y divide-gray-100">
        {isLoadingPosts && posts.length === 0 ? (
          <FeedShimmer count={5} />
        ) : (
          <>
            {mergeWithAds(posts).map((item) => {
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
                <Post
                  key={item._id}
                  post={item}
                  onLike={handleLike}
                  onDelete={(postId) => dispatch(setPosts(posts.filter(p => p._id !== postId)))}
                  onUpdate={(updatedPost) => dispatch(setPosts(posts.map(p => p._id === updatedPost._id ? updatedPost : p)))}
                />
              );
            })}
            <LoadMoreButton
              onLoadMore={handleLoadMorePosts}
              isLoading={isLoadingPosts}
              hasMore={postsPagination.hasMore}
            />
          </>
        )}
      </div>

      {/* Media Upload Dialog */}
      <MediaUploadDialog
        isOpen={mediaDialogOpen}
        onClose={() => setMediaDialogOpen(false)}
        type={mediaDialogType}
        onMediaSelect={handleMediaSelect}
        currentMedia={selectedMedia}
      />

      {/* Giphy Picker */}
      <GiphyPicker
        isOpen={giphyPickerOpen}
        onClose={() => setGiphyPickerOpen(false)}
        onSelect={handleGiphySelect}
      />

      {/* Spotify Track Picker */}
      <SpotifyTrackPicker
        isOpen={spotifyPickerOpen}
        onClose={() => setSpotifyPickerOpen(false)}
        onSelect={(track) => setSelectedSpotifyTrack(track)}
      />
    </div>
  );
}