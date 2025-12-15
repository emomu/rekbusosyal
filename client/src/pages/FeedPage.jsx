import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate, useLoaderData, useOutletContext } from 'react-router-dom';
import { User, MessageSquare, RefreshCw } from 'lucide-react';
import { setPosts, addPost, appendPosts, setPostsPagination } from '../store/slices/postsSlice';
import { setNewPostContent } from '../store/slices/uiSlice';
import { setSelectedImage } from '../store/slices/uiSlice';
import { incrementAdImpression, incrementAdClick } from '../store/slices/advertisementsSlice';
import { addInterests } from '../store/slices/authSlice';
import { FeedShimmer } from '../components/LoadingShimmer';
import { usePullToRefresh } from '../hooks/usePullToRefresh';
import { useToast } from '../hooks/useToast';
import MobileHeader from '../components/MobileHeader';
import LikeButton from '../components/LikeButton';
import LoadMoreButton from '../components/LoadMoreButton';
import UserBadges from '../components/UserBadges';
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
  const { toast } = useToast();
  const { setIsMobileMenuOpen, setShowNotifications, unreadCount } = useOutletContext();
  const loaderData = useLoaderData();

  const { userId, token, userInterests } = useSelector((state) => state.auth);
  const { posts, postsPagination } = useSelector((state) => state.posts);
  const { advertisements } = useSelector((state) => state.advertisements);
  const { newPostContent, isLoadingPosts } = useSelector((state) => state.ui);

  const [currentUserInfo, setCurrentUserInfo] = useState(null);

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

      // Personalization: match ad tags with user interests
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

  // Handle ad click with auto interest learning
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

  // Create new post
  const handleCreatePost = async () => {
    if (!newPostContent.trim()) return;
    try {
      const res = await fetch(`${API_URL}/api/posts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ content: newPostContent })
      });

      if (res.status === 429) {
        const data = await res.json();
        toast.warning(`${data.error}. ${data.remainingSeconds} saniye sonra tekrar dene.`);
        return;
      }

      if (res.ok) {
        const newPost = await res.json();
        dispatch(addPost(newPost));
        dispatch(setNewPostContent(''));
        toast.success('Post paylaşıldı!');
      } else {
        toast.error('Post paylaşılamadı. Lütfen tekrar dene.');
      }
    } catch (err) {
      console.error(err);
      toast.error('Bir hata oluştu.');
    }
  };

  // Like post
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

  // Load more posts
  const handleLoadMorePosts = async () => {
    if (!postsPagination.hasMore || isLoadingPosts) return;

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
    }
  };

  // Render content with clickable mentions
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
        onMenuClick={setIsMobileMenuOpen}
        onNotificationsClick={setShowNotifications}
        unreadCount={unreadCount}
      />

      <header className="hidden md:block sticky top-0 z-10 bg-white/100 backdrop-blur-md border-b border-gray-200 p-4 font-bold text-lg">
        Anasayfa
      </header>

      {/* Create Post Area */}
      <div className="p-4 border-b border-gray-100 flex gap-3">
        {currentUserInfo?.profilePicture ? (
          <img
            src={currentUserInfo.profilePicture}
            alt="Profil"
            className="w-10 h-10 rounded-full object-cover border border-gray-200 shrink-0"
          />
        ) : (
          <div className="w-10 h-10 bg-gray-200 rounded-full shrink-0 flex items-center justify-center">
            <User size={20} className="text-gray-400" />
          </div>
        )}
        <div className="flex-1">
          <textarea
            className="w-full resize-none outline-none text-lg placeholder-gray-400 bg-transparent"
            placeholder="Neler oluyor?"
            rows={2}
            value={newPostContent}
            onChange={(e) => dispatch(setNewPostContent(e.target.value))}
          />
          <div className="flex justify-end mt-2">
            <button
              onClick={handleCreatePost}
              disabled={!newPostContent.trim()}
              className="bg-blue-900 text-white px-4 py-1.5 rounded-full text-sm font-bold hover:bg-blue-800 disabled:opacity-50"
            >
              Paylaş
            </button>
          </div>
        </div>
      </div>

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
                <div
                  key={item._id}
                  className="p-5 hover:bg-gray-50/50 transition cursor-pointer"
                  onClick={() => navigate(`/akis/${item._id}`)}
                >
                  <div className="flex items-center gap-3 mb-2">
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
                    <div>
                      <div className="flex items-center gap-2">
                        <div
                          className="font-bold text-sm text-gray-900 hover:underline"
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/kullanici/${item.author?.username}`);
                          }}
                        >
                          {item.author?.fullName || 'Anonim'}
                        </div>
                        {item.author?.badges && item.author.badges.length > 0 && (
                          <UserBadges badges={item.author.badges} size="sm" />
                        )}
                      </div>
                      <div className="text-xs text-gray-400">
                        @{item.author?.username} · {new Date(item.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                  </div>

                  <div className="text-gray-800 mb-3 whitespace-pre-wrap">
                    {renderContentWithMentions(item.content)}
                  </div>

                  <div className="flex items-center gap-4" onClick={(e) => e.stopPropagation()}>
                    <LikeButton
                      isLiked={item.likes.includes(userId)}
                      likeCount={item.likes.length}
                      onClick={() => handleLike(item._id)}
                    />
                    <button className="flex items-center gap-2 text-gray-600 hover:text-blue-600 transition">
                      <MessageSquare size={20} />
                      <span className="text-sm font-medium">Yorum yap</span>
                    </button>
                  </div>
                </div>
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
    </div>
  );
}
