import React, { useState, useEffect } from 'react';
import { useLoaderData, useNavigate, useParams } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { ChevronLeft, Calendar, Lock, User, MessageSquare } from 'lucide-react';
import Lottie from 'lottie-react';
import loaderAnimation from '../assets/loader.json';
import FollowButton from './FollowButton';
import LoadMoreButton from './LoadMoreButton';
import LikeButton from './LikeButton';
import { setCurrentProfile, setUserPosts, appendUserPosts, setUserConfessions, appendUserConfessions, setPostsPagination, setConfessionsPagination, setIsFollowing, setFollowRequestPending, clearProfile } from '../store/slices/userProfileSlice';
import { API_URL } from '../config/api';
import { ensureHttps } from '../utils/imageUtils';
import UserBadges from './UserBadges';
import { useProfileNavigate } from '../hooks/useSmartNavigate';
import MediaDisplay from './MediaDisplay';
import SpotifyTrackDisplay from './SpotifyTrackDisplay';
import FollowersModal from './FollowersModal';

export default function PublicProfilePage() {
  const navigate = useNavigate();
  const navigateToProfile = useProfileNavigate();
  const { username } = useParams();
  const profileData = useLoaderData();
  const dispatch = useDispatch();
  const token = useSelector(state => state.auth.token);
  const currentUserId = useSelector(state => state.auth.userId);
  const currentUsername = useSelector(state => state.auth.username);
  const { currentProfile, userPosts, userConfessions, postsPagination, confessionsPagination, isFollowing, followRequestPending } = useSelector(state => state.userProfile);

  const [activeTab, setActiveTab] = useState('posts');
  const [loading, setLoading] = useState(true);
  const [loadingPosts, setLoadingPosts] = useState(false);
  const [loadingConfessions, setLoadingConfessions] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [selectedPost, setSelectedPost] = useState(null);
  const [spotifyData, setSpotifyData] = useState(null);
  const [loadingSpotify, setLoadingSpotify] = useState(true);
  const [listeningAlong, setListeningAlong] = useState([]);
  const [showFollowersModal, setShowFollowersModal] = useState(false);
  const [followersModalType, setFollowersModalType] = useState('followers');

  const isOwnProfile = currentUsername === username;

  // Kullanıcı profil linki tıklama handler'ı
  const handleProfileClick = (e, targetUsername) => {
    e.stopPropagation();
    navigateToProfile(targetUsername);
  };

  // --- Veri Çekme İşlemleri ---
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setLoading(true);
        setImageError(false);
        const res = await fetch(`${API_URL}/api/users/${username}`);
        const data = await res.json();

        if (res.ok) {
          dispatch(setCurrentProfile(data));
          if (currentUserId) {
            const following = data.followers.some(f => f._id === currentUserId);
            const pending = data.followRequests?.includes(currentUserId);
            dispatch(setIsFollowing(following));
            dispatch(setFollowRequestPending(pending));
          }

          if (!data.isPrivate || data.followers.some(f => f._id === currentUserId) || data._id === currentUserId) {
            fetchUserPosts(data._id, 1);
          }
        }
      } catch (err) {
        console.error('Profil yüklenemedi:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
    return () => {
      dispatch(clearProfile());
    };
  }, [username, currentUserId, dispatch]);

  const fetchUserPosts = async (userId, page = 1) => {
    try {
      setLoadingPosts(true);
      const res = await fetch(`${API_URL}/api/users/${userId}/posts?page=${page}&limit=10`);
      const data = await res.json();
      if (res.ok) {
        if (page === 1) dispatch(setUserPosts(data.posts));
        else dispatch(appendUserPosts(data.posts));
        dispatch(setPostsPagination({
          currentPage: data.currentPage || page,
          totalPages: data.totalPages || 1,
          hasMore: data.hasMore || false
        }));
      }
    } catch (err) {
      console.error('Postlar yüklenemedi:', err);
    } finally {
      setLoadingPosts(false);
    }
  };
  const renderWithMentions = (text) => {
    if (!text) return null;
    const parts = text.split(/(@[\w.-]+)/g);
    return parts.map((part, index) => {
      if (part.startsWith('@')) {
        const user = part.slice(1);
        return (
          <span
            key={index}
            onClick={(e) => {
              e.stopPropagation();
              navigateToProfile(user);
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

  const fetchUserConfessions = async (userId, page = 1) => {
    try {
      setLoadingConfessions(true);
      const res = await fetch(`${API_URL}/api/users/${userId}/confessions?page=${page}&limit=10`);
      const data = await res.json();
      if (res.ok) {
        if (page === 1) dispatch(setUserConfessions(data.posts));
        else dispatch(appendUserConfessions(data.posts));
        dispatch(setConfessionsPagination({
          currentPage: data.currentPage || page,
          totalPages: data.totalPages || 1,
          hasMore: data.hasMore || false
        }));
      }
    } catch (err) {
      console.error('İtiraflar yüklenemedi:', err);
    } finally {
      setLoadingConfessions(false);
    }
  };

  useEffect(() => {
    if (!currentProfile) return;
    if (currentProfile.isPrivate && !isFollowing && !isOwnProfile) return;

    if (activeTab === 'confessions' && userConfessions.length === 0) {
      fetchUserConfessions(currentProfile._id, 1);
    }
  }, [activeTab, currentProfile, isFollowing, isOwnProfile]);

  // Spotify şu an dinlenen şarkıyı çek
  useEffect(() => {
    const fetchSpotifyData = async (isInitial = false) => {
      if (!username) return;

      try {
        // Sadece ilk yüklemede loading göster
        if (isInitial) {
            setLoadingSpotify(true);
        }

        const res = await fetch(`${API_URL}/api/spotify/currently-playing/${username}`);
        const data = await res.json();

        if (data.isPlaying) {
          // Sadece şarkı değiştiyse veya ilk yüklemede state'i güncelle
          setSpotifyData(prev => {
            // Eğer önceki şarkı yoksa veya farklı bir şarkıya geçildiyse güncelle
            if (!prev || prev.name !== data.track.name || prev.artist !== data.track.artist) {
              return data.track;
            }
            // Aynı şarkı çalıyorsa sadece progress'i güncelle
            return { ...prev, progress: data.track.progress };
          });

          // Listening along bilgisini güncelle
          setListeningAlong(data.listeningAlong || []);
        } else {
          setSpotifyData(null);
          setListeningAlong([]);
        }
      } catch (err) {
        console.error('Spotify veri çekme hatası:', err);
        setSpotifyData(null);
      } finally {
        if (isInitial) {
            setLoadingSpotify(false);
        }
      }
    };

    fetchSpotifyData(true);

    // Her 5 saniyede bir güncelle (daha responsive)
    const interval = setInterval(() => fetchSpotifyData(false), 5000);

    return () => clearInterval(interval);
  }, [username]);

  // --- Takip İşlemleri ---
  const handleFollow = async (userId) => {
    try {
      const res = await fetch(`${API_URL}/api/users/${userId}/follow`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) {
        if (data.status === 'pending') {
          dispatch(setFollowRequestPending(true));
        } else {
          dispatch(setIsFollowing(true));
          const profileRes = await fetch(`${API_URL}/api/users/${username}`);
          const profileData = await profileRes.json();
          dispatch(setCurrentProfile(profileData));
        }
      }
    } catch (err) {
      console.error('Takip hatası:', err);
    }
  };

  const handleUnfollow = async (userId) => {
    try {
      const res = await fetch(`${API_URL}/api/users/${userId}/unfollow`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        dispatch(setIsFollowing(false));
        dispatch(setFollowRequestPending(false));
        const profileRes = await fetch(`${API_URL}/api/users/${username}`);
        const profileData = await profileRes.json();
        dispatch(setCurrentProfile(profileData));
      }
    } catch (err) {
      console.error('Unfollow hatası:', err);
    }
  };

  // --- YENİ EKLENEN: Beğeni (Like) Fonksiyonu ---
  const handleLike = async (postId, type) => {
    try {
      const res = await fetch(`${API_URL}/api/posts/${postId}/like`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
      });

      if (res.ok) {
        const updatedPost = await res.json();

        // Hangi listede (post veya itiraf) güncelleme yapacağımızı belirliyoruz
        if (type === 'post') {
          // Mevcut post listesini kopyalayıp ilgili postu güncelliyoruz
          const updatedList = userPosts.map(p =>
            p._id === postId ? { ...p, likes: updatedPost.likes } : p
          );
          dispatch(setUserPosts(updatedList));
        } else {
          // Mevcut itiraf listesini kopyalayıp ilgili itirafı güncelliyoruz
          const updatedList = userConfessions.map(c =>
            c._id === postId ? { ...c, likes: updatedPost.likes } : c
          );
          dispatch(setUserConfessions(updatedList));
        }
      }
    } catch (err) {
      console.error('Beğeni işlemi başarısız:', err);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-24 h-24">
          <Lottie animationData={loaderAnimation} loop={true} />
        </div>
      </div>
    );
  }

  if (!currentProfile) return <div className="flex items-center justify-center min-h-screen"><div className="text-gray-400">Kullanıcı bulunamadı</div></div>;

  const isPrivateAndNotFollowing = currentProfile.isPrivate && !isFollowing && !isOwnProfile;

  return (
    <div className="relative min-h-screen bg-white">
      <header className="sticky top-0 z-30 bg-white/100 backdrop-blur-md border-b border-gray-200 px-4 h-[60px] flex items-center">
        <div className="flex items-center gap-3 w-full">
          <button onClick={() => navigate(-1)} className="p-1.5 hover:bg-gray-100 rounded-full transition">
            <ChevronLeft size={20} />
          </button>
          <div className="font-bold text-lg truncate">{currentProfile.fullName}</div>
        </div>
      </header>

      <div className="bg-white p-5 border-b border-gray-100">
        <div className="flex items-start gap-4">
          {currentProfile.profilePicture && !imageError ? (
            <img
              src={ensureHttps(currentProfile.profilePicture)}
              alt={currentProfile.fullName}
              className="w-16 h-16 rounded-full object-cover shrink-0"
              onError={() => setImageError(true)}
            />
          ) : (
            <div className="w-16 h-16 bg-gray-200 rounded-full shrink-0 flex items-center justify-center">
              <User size={32} className="text-gray-400" />
            </div>
          )}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between mb-2 gap-2">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 max-w-full">
                  <h2 className="font-bold text-base text-gray-900 truncate shrink min-w-0">
                    {currentProfile.fullName}
                  </h2>
                  {currentProfile.badges && currentProfile.badges.length > 0 && (
                    <div className="shrink-0">
                      <UserBadges badges={currentProfile.badges} size="sm" />
                    </div>
                  )}
                </div>
                <p className="text-gray-500 text-sm truncate">@{currentProfile.username}</p>
              </div>
              {!isOwnProfile && (
                <div className="shrink-0">
                  <FollowButton
                    userId={currentProfile._id}
                    isFollowing={isFollowing}
                    isPending={followRequestPending}
                    onFollow={handleFollow}
                    onUnfollow={handleUnfollow}
                  />
                </div>
              )}
            </div>
            {currentProfile.bio && <p className="text-gray-700 text-sm mb-2 leading-relaxed whitespace-pre-wrap">{currentProfile.bio}</p>}

            {/* Spotify Şu An Dinleniyor - Gizli hesaplarda sadece takipçilere göster */}
            {!loadingSpotify && spotifyData && (!currentProfile.isPrivate || isFollowing || isOwnProfile) && (
              <div className="mt-2 mb-3">
                <SpotifyTrackDisplay
                    track={spotifyData}
                    compact={true}
                    initialProgress={spotifyData.progress}
                    listeningAlong={listeningAlong}
                />
              </div>
            )}

            <div className="flex items-center gap-3 text-xs text-gray-500 mb-2">
              <div className="flex items-center gap-1">
                <Calendar size={13} />
                <span>{new Date(currentProfile.createdAt).toLocaleDateString('tr-TR', { year: 'numeric', month: 'long' })}</span>
              </div>
              {currentProfile.isPrivate && (
                <div className="flex items-center gap-1"><Lock size={13} /><span>Gizli hesap</span></div>
              )}
            </div>
            <div className="flex gap-3 text-sm">
              <div
                onClick={() => {
                  setFollowersModalType('following');
                  setShowFollowersModal(true);
                }}
                className="cursor-pointer hover:underline"
              >
                <span className="font-bold text-gray-900">{currentProfile.following?.length || 0}</span>
                <span className="text-gray-500 ml-1">Takip</span>
              </div>
              <div
                onClick={() => {
                  setFollowersModalType('followers');
                  setShowFollowersModal(true);
                }}
                className="cursor-pointer hover:underline"
              >
                <span className="font-bold text-gray-900">{currentProfile.followers?.length || 0}</span>
                <span className="text-gray-500 ml-1">Takipçi</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {isPrivateAndNotFollowing ? (
        <div className="p-12 text-center bg-gray-50/50">
          <Lock size={40} className="mx-auto text-gray-300 mb-3" />
          <h3 className="text-base font-bold text-gray-900 mb-2">Bu Hesap Gizli</h3>
          <p className="text-gray-500 text-sm">Gönderileri görmek için @{currentProfile.username} kullanıcısını takip et.</p>
        </div>
      ) : (
        <>
          <div className="sticky top-[60px] z-20 bg-white flex border-b border-gray-200">
            <button
              onClick={() => setActiveTab('posts')}
              className={`flex-1 py-4 text-sm font-medium transition ${activeTab === 'posts' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500 hover:bg-gray-50'
                }`}
            >
              Gönderiler
            </button>
            <button
              onClick={() => setActiveTab('confessions')}
              className={`flex-1 py-4 text-sm font-medium transition ${activeTab === 'confessions' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500 hover:bg-gray-50'
                }`}
            >
              İtiraflar
            </button>
          </div>

          <div className="divide-y divide-gray-100 pb-10">
            {activeTab === 'posts' && (
              <>
                {userPosts.length === 0 && !loadingPosts ? (
                  <div className="p-12 text-center text-gray-400">Henüz gönderi yok</div>
                ) : (
                  <>
                    {userPosts.map((post) => (
                      <div key={post._id} className="p-5 hover:bg-gray-50/50 transition cursor-pointer" onClick={() => navigate(`/akis/${post._id}`)}>
                        <div className="flex items-center gap-3 mb-2">
                          <div onClick={(e) => handleProfileClick(e, currentProfile.username)} className="cursor-pointer hover:opacity-80 transition">
                            {currentProfile.profilePicture ? (
                              <img
                                src={ensureHttps(currentProfile.profilePicture)}
                                alt={currentProfile.fullName}
                                className="w-9 h-9 bg-gray-200 rounded-full object-cover"
                              />
                            ) : (
                              <div className="w-9 h-9 bg-gray-200 rounded-full flex items-center justify-center">
                                <User size={18} className="text-gray-400" />
                              </div>
                            )}
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2 max-w-full">
                              <div
                                className="font-bold text-sm text-gray-900 hover:underline cursor-pointer truncate shrink min-w-0"
                                onClick={(e) => handleProfileClick(e, currentProfile.username)}
                              >
                                {currentProfile.fullName}
                              </div>
                              {currentProfile.badges && currentProfile.badges.length > 0 && (
                                <div className="shrink-0">
                                  <UserBadges badges={currentProfile.badges} size="sm" />
                                </div>
                              )}
                            </div>
                            <div className="text-xs text-gray-400">@{currentProfile.username} · {new Date(post.createdAt).toLocaleDateString('tr-TR')}</div>
                          </div>
                        </div>
                        <div className="text-gray-800 mb-3 whitespace-pre-wrap">
                          {renderWithMentions(post.content)}
                        </div>
                        
                        {/* Spotify Track */}
                        {post.spotifyTrack && (
                          <div className="mb-3" onClick={(e) => e.stopPropagation()}>
                            <SpotifyTrackDisplay track={post.spotifyTrack} compact={true} />
                          </div>
                        )}

                        {/* Media Display */}
                        {post.media && post.media.length > 0 && (
                          <div className="mb-3" onClick={(e) => e.stopPropagation()}>
                            <MediaDisplay media={post.media} />
                          </div>
                        )}
                        {/* Post Beğeni ve Yorum Butonları */}
                        <div className="flex items-center gap-4" onClick={(e) => e.stopPropagation()}>
                          <button
                            className="flex items-center gap-1 text-gray-500 hover:text-blue-500 transition text-sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate(`/akis/${post._id}`);
                            }}
                          >
                            <MessageSquare size={18} />
                            <span>{post.commentCount || 0}</span>
                          </button>
                          <LikeButton
                            isLiked={post.likes?.includes(currentUserId)}
                            likeCount={post.likes?.length || 0}
                            onClick={() => handleLike(post._id, 'post')}
                          />
                        </div>
                      </div>
                    ))}
                    <LoadMoreButton onLoadMore={() => fetchUserPosts(currentProfile._id, postsPagination.currentPage + 1)} isLoading={loadingPosts} hasMore={postsPagination.hasMore} />
                  </>
                )}
              </>
            )}

            {activeTab === 'confessions' && (
              <>
                {userConfessions.length === 0 && !loadingConfessions ? (
                  <div className="p-12 text-center text-gray-400">Henüz itiraf yok</div>
                ) : (
                  <>
                    {userConfessions.map((confession) => (
                      <div key={confession._id} className="p-5 hover:bg-gray-50/50 transition cursor-pointer" onClick={() => navigate(`/itiraf/${confession._id}`)}>
                        <div className="flex items-center gap-3 mb-2">
                          <div onClick={(e) => handleProfileClick(e, currentProfile.username)} className="cursor-pointer hover:opacity-80 transition">
                            {currentProfile.profilePicture ? (
                              <img
                                src={ensureHttps(currentProfile.profilePicture)}
                                alt={currentProfile.fullName}
                                className="w-9 h-9 bg-gray-200 rounded-full object-cover"
                              />
                            ) : (
                              <div className="w-9 h-9 bg-gray-200 rounded-full flex items-center justify-center">
                                <User size={18} className="text-gray-400" />
                              </div>
                            )}
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2 max-w-full">
                              <div
                                className="font-bold text-sm text-gray-900 hover:underline cursor-pointer truncate shrink min-w-0"
                                onClick={(e) => handleProfileClick(e, currentProfile.username)}
                              >
                                {currentProfile.fullName}
                              </div>
                              {currentProfile.badges && currentProfile.badges.length > 0 && (
                                <div className="shrink-0">
                                  <UserBadges badges={currentProfile.badges} size="sm" />
                                </div>
                              )}
                            </div>
                            <div className="text-xs text-gray-400">@{currentProfile.username} · {new Date(confession.createdAt).toLocaleDateString('tr-TR')}</div>
                          </div>
                        </div>
                        <div className="text-gray-800 mb-3 whitespace-pre-wrap">
                          {renderWithMentions(confession.content)}
                        </div>
                        {/* Media Display */}
                        {confession.media && confession.media.length > 0 && (
                          <div className="mb-3" onClick={(e) => e.stopPropagation()}>
                            <MediaDisplay media={confession.media} />
                          </div>
                        )}
                        {/* İtiraf Beğeni ve Yorum Butonları */}
                        <div className="flex items-center gap-4" onClick={(e) => e.stopPropagation()}>
                          <button
                            className="flex items-center gap-1 text-gray-500 hover:text-blue-500 transition text-sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate(`/itiraf/${confession._id}`);
                            }}
                          >
                            <MessageSquare size={18} />
                            <span>{confession.commentCount || 0}</span>
                          </button>
                          <LikeButton
                            isLiked={confession.likes?.includes(currentUserId)}
                            likeCount={confession.likes?.length || 0}
                            onClick={() => handleLike(confession._id, 'confession')}
                          />
                        </div>
                      </div>
                    ))}
                    <LoadMoreButton onLoadMore={() => fetchUserConfessions(currentProfile._id, confessionsPagination.currentPage + 1)} isLoading={loadingConfessions} hasMore={confessionsPagination.hasMore} />
                  </>
                )}
              </>
            )}
          </div>
        </>
      )}

      {/* Followers/Following Modal */}
      <FollowersModal
        isOpen={showFollowersModal}
        onClose={() => setShowFollowersModal(false)}
        username={currentProfile?.username}
        type={followersModalType}
      />
    </div>
  );
}