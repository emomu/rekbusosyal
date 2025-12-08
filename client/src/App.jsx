import { useState, useEffect, useRef } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import LoginPage from './components/LoginPage';
import CampusRating from './components/CampusRating';
import ProfilePage from './components/ProfilePage';
import PublicProfilePage from './components/PublicProfilePage';
import AdminPanel from './components/AdminPanel';
import InitialLoadingScreen from './components/InitialLoadingScreen';
import LoadMoreButton from './components/LoadMoreButton';
import { FeedShimmer, GridShimmer, CommentsShimmer } from './components/LoadingShimmer';
import { Home, MessageSquare, User, ChevronLeft, Send, MapPin, Search, LogOut, Heart, Lock, Shield, Settings2Icon, Settings, MoreHorizontal } from 'lucide-react';

// Redux actions
import { logout, setUserRole, addInterests } from './store/slices/authSlice';
import { setPosts, addPost, deletePost, setConfessions, addConfession, deleteConfession, appendPosts, appendConfessions, setPostsPagination, setConfessionsPagination } from './store/slices/postsSlice';
import { setCampuses, setSelectedCampus, setCampusComments, addCampusComment, updateCampusComment, deleteCampusComment, updateCampusVote } from './store/slices/campusesSlice';
import { setCommunities, setSelectedCommunity, setCommunityComments, addCommunityComment, updateCommunityComment, deleteCommunityComment, updateCommunityVote } from './store/slices/communitiesSlice';
import { setAdvertisements, incrementAdImpression, incrementAdClick } from './store/slices/advertisementsSlice';
import { setActiveTab, setSelectedImage, setCommentInput, setCommunityCommentInput, setNewPostContent, setNewConfessionContent, setIsAnonymous, setEditingComment, clearEditingComment, setInitialLoading, setLoadingPosts, setLoadingConfessions, setLoadingCampuses, setLoadingCommunities, setLoadingComments } from './store/slices/uiSlice';

// Reklam Kartı Component (Twitter Tarzı)
function AdCard({ ad, onView, onClick, onImageClick }) {
  const adRef = useRef(null);
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
      {/* Üst kısım - Sponsorlu etiketi */}
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

      {/* İçerik */}
      <div className="cursor-pointer" onClick={onClick}>
        <p className="text-gray-800 text-sm mb-3 leading-relaxed whitespace-pre-wrap">{ad.content}</p>

        {/* Resim - Twitter tarzı */}
        {ad.imageUrl && (
          <div className="rounded-2xl overflow-hidden border border-gray-200 mt-3">
            <img
              src={ad.imageUrl}
              alt={ad.title}
              className="w-full h-auto object-cover cursor-zoom-in hover:opacity-95 transition"
              onClick={(e) => {
                e.stopPropagation();
                onImageClick(ad.imageUrl);
              }}
            />
          </div>
        )}

        {/* Etiketler */}
        {ad.tags && ad.tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-3">
            {ad.tags.map(tag => (
              <span key={tag} className="text-xs px-2 py-1 bg-blue-50 text-blue-600 rounded-full">
                #{tag}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default function App() {
  const dispatch = useDispatch();

  // Redux state'leri kullan
  const { token, userId, userRole, userInterests, isAuthenticated } = useSelector(state => state.auth);
  const { posts, confessions, postsPagination, confessionsPagination } = useSelector(state => state.posts);
  const { campuses, selectedCampus, campusComments } = useSelector(state => state.campuses);
  const { communities, selectedCommunity, communityComments } = useSelector(state => state.communities);
  const { advertisements } = useSelector(state => state.advertisements);
  const {
    activeTab,
    selectedImage,
    commentInput,
    communityCommentInput,
    newPostContent,
    newConfessionContent,
    isAnonymous,
    editingCommentId,
    editingContent,
    isInitialLoading,
    isLoadingPosts,
    isLoadingConfessions,
    isLoadingCampuses,
    isLoadingCommunities,
    isLoadingComments
  } = useSelector(state => state.ui);
  const [currentUserInfo, setCurrentUserInfo] = useState(null);
  // Profil görünümü state
  const [viewedProfile, setViewedProfile] = useState(null);

  // --- YARDIMCI FONKSİYONLAR ---

  // Rozet Detaylarını Getir
  const getVoteBadgeDetails = (voteType) => {
    switch (voteType) {
      case 'positive': return { label: 'Öneriyor', color: 'bg-green-100 text-green-700 border border-green-200', icon: '👍' };
      case 'neutral': return { label: 'Nötr', color: 'bg-blue-100 text-blue-700 border border-blue-200', icon: '😐' };
      case 'negative': return { label: 'Önermiyor', color: 'bg-red-100 text-red-700 border border-red-200', icon: '👎' };
      default: return null;
    }
  };

  // Reklamları içerik akışına ekle (Akıllı Algoritma + Kişiselleştirme)
  const mergeWithAds = (items) => {
    if (!advertisements.length) return items;

    // Reklamları filtrele ve sırala
    const eligibleAds = advertisements.filter(ad => {
      // Maksimum gösterim kontrolü
      if (ad.maxImpressions && ad.impressions >= ad.maxImpressions) return false;

      // Tarih kontrolü
      const now = new Date();
      if (ad.startDate && new Date(ad.startDate) > now) return false;
      if (ad.endDate && new Date(ad.endDate) < now) return false;

      if (!ad.isActive) return false;

      // KİŞİSELLEŞTİRME: Reklam etiketlerini kullanıcı ilgi alanlarıyla eşleştir
      // Eğer reklamın etiketi yoksa herkese göster
      if (!ad.tags || ad.tags.length === 0) return true;

      // Kullanıcının ilgi alanı yoksa tüm reklamları göster
      if (!userInterests || userInterests.length === 0) return true;

      // En az bir etiket eşleşmesi varsa göster
      return ad.tags.some(tag => userInterests.includes(tag));
    });

    if (!eligibleAds.length) return items;

    // Öncelik bazlı ağırlıklı sıralama
    const weightedAds = eligibleAds.map(ad => ({
      ...ad,
      // Öncelik + CTR (Click-Through Rate) + Düşük gösterim bonusu
      score: (ad.priority || 1) * 10 +
        (ad.clicks / Math.max(ad.impressions, 1)) * 100 +
        (ad.impressions < 10 ? 20 : 0) // Yeni reklamlara bonus
    })).sort((a, b) => b.score - a.score);

    const result = [];
    // Dinamik sıklık: İçerik sayısına göre ayarlanır (daha seyrek)
    const adInterval = items.length <= 10 ? 8 : items.length <= 25 ? 10 : 12;

    let adIndex = 0;
    let nextAdPosition = Math.floor(Math.random() * 3) + 5; // İlk reklam pozisyonunu randomize et (5-7)

    items.forEach((item, index) => {
      result.push(item);

      // Reklam ekleme pozisyonuna geldiysek
      if (index + 1 === nextAdPosition && adIndex < weightedAds.length) {
        result.push({
          ...weightedAds[adIndex],
          isAd: true,
          _id: `ad-${weightedAds[adIndex]._id}-${index}` // Her gösterim için benzersiz ID
        });

        // Bir sonraki reklam pozisyonunu hesapla (hafif varyasyon ile)
        adIndex = (adIndex + 1) % weightedAds.length;
        nextAdPosition += adInterval + Math.floor(Math.random() * 2); // ±1 varyasyon
      }
    });

    return result;
  };

  // Reklam gösterimini izle
  const trackAdImpression = async (adId) => {
    try {
      await fetch(`http://localhost:5001/api/advertisements/${adId}/track`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'impression' })
      });
    } catch (err) {
      console.error('Reklam gösterim izleme hatası:', err);
    }
  };

  // Reklam tıklamasını izle
  const trackAdClick = async (adId) => {
    try {
      await fetch(`http://localhost:5001/api/advertisements/${adId}/track`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'click' })
      });
    } catch (err) {
      console.error('Reklam tıklama izleme hatası:', err);
    }
  };

  // Reklam tıklama işleyici - Otomatik ilgi alanı öğrenme
  const handleAdClick = async (ad) => {
    trackAdClick(ad._id);

    // Reklam etiketlerini kullanıcının ilgi alanlarına otomatik ekle
    if (ad.tags && ad.tags.length > 0) {
      const newInterests = [...new Set([...userInterests, ...ad.tags])]; // Tekrar eden etiketleri kaldır

      if (newInterests.length !== userInterests.length) {
        setUserInterests(newInterests);
        localStorage.setItem('userInterests', JSON.stringify(newInterests));

        // Backend'e de kaydet
        try {
          await fetch('http://localhost:5001/api/profile/interests', {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ interests: newInterests })
          });
        } catch (err) {
          console.error('İlgi alanı güncelleme hatası:', err);
        }
      }
    }

    if (ad.targetUrl) {
      window.open(ad.targetUrl, '_blank');
    }
  };

  // Çıkış Yapma
  const handleLogout = () => {
    dispatch(logout());
  };

  // İlk yükleme - Tüm kritik verileri çek
  useEffect(() => {
    if (token && userId) {
      const loadInitialData = async () => {
        dispatch(setInitialLoading(true));
        dispatch(setLoadingPosts(true));
        dispatch(setLoadingCampuses(true));

        try {
          // Promise.all içine istekleri ekliyoruz
          // DİKKAT: En sona 'api/profile' eklendi (api/users/ID yerine)
          const [postsRes, campusesRes, roleRes, adsRes, communitiesRes, currentUserRes] = await Promise.all([
            fetch('http://localhost:5001/api/posts?page=1&limit=10', { headers: { 'Authorization': `Bearer ${token}` } }),
            fetch('http://localhost:5001/api/campus'),
            fetch('http://localhost:5001/api/admin/check-role', { headers: { 'Authorization': `Bearer ${token}` } }),
            fetch('http://localhost:5001/api/advertisements'),
            fetch('http://localhost:5001/api/communities', { headers: { 'Authorization': `Bearer ${token}` } }),
            fetch('http://localhost:5001/api/profile', { headers: { 'Authorization': `Bearer ${token}` } }) // <-- DÜZELTİLEN KISIM
          ]);

          // Gelen cevapları JSON'a çeviriyoruz
          // DİKKAT: Burada da currentUserRes.json() işlemini değişkene atıyoruz
          const [postsData, campusesData, roleData, adsData, communitiesData, currentUserData] = await Promise.all([
            postsRes.json(),
            campusesRes.json(),
            roleRes.json(),
            adsRes.json(),
            communitiesRes.json(),
            currentUserRes.json() // <-- DÜZELTİLEN KISIM
          ]);

          // --- Verileri Redux'a ve State'e Kaydetme ---

          // 1. Postlar
          if (postsData.posts) {
            dispatch(setPosts(postsData.posts));
            dispatch(setPostsPagination(postsData.pagination));
          } else {
            dispatch(setPosts(Array.isArray(postsData) ? postsData : []));
          }

          // 2. Diğer Veriler
          dispatch(setCampuses(Array.isArray(campusesData) ? campusesData : []));
          dispatch(setUserRole(roleData.role || 'user'));
          dispatch(setAdvertisements(Array.isArray(adsData) ? adsData.filter(ad => ad.isActive && ad.placement === 'feed') : []));
          dispatch(setCommunities(Array.isArray(communitiesData) ? communitiesData : []));

          // 3. Kullanıcı Bilgisi (Sidebar için)
          if (currentUserRes.ok) {
            setCurrentUserInfo(currentUserData);
          }

        } catch (err) {
          console.error('Veri yükleme hatası:', err);
        } finally {
          dispatch(setLoadingPosts(false));
          dispatch(setLoadingCampuses(false));
          setTimeout(() => dispatch(setInitialLoading(false)), 500);
        }
      };

      loadInitialData();

    }
  }, [token, userId, dispatch]);

  // İtiraflar Tabına Geçilince Veri Çek (Pagination ile)
  useEffect(() => {
    if (activeTab === 'itiraflar' && token && confessions.length === 0) {
      dispatch(setLoadingConfessions(true));
      fetch('http://localhost:5001/api/confessions?page=1&limit=10', { headers: { 'Authorization': `Bearer ${token}` } })
        .then(res => res.json())
        .then(data => {
          // Confessions pagination ile gelir
          if (data.posts) {
            dispatch(setConfessions(data.posts));
            dispatch(setConfessionsPagination(data.pagination));
          } else {
            dispatch(setConfessions(Array.isArray(data) ? data : []));
          }
          dispatch(setLoadingConfessions(false));
        })
        .catch(err => {
          console.error(err);
          dispatch(setLoadingConfessions(false));
        });
    }
  }, [activeTab, token, confessions.length, dispatch]);

  // Bu useEffect artık gereksiz - initial loading'de çekiliyor

  // Load More Posts Handler
  const handleLoadMorePosts = async () => {
    if (!token || isLoadingPosts || !postsPagination.hasMore) return;

    dispatch(setLoadingPosts(true));
    try {
      const nextPage = postsPagination.currentPage + 1;
      const res = await fetch(`http://localhost:5001/api/posts?page=${nextPage}&limit=10`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();

      if (data.posts) {
        dispatch(appendPosts(data.posts));
        dispatch(setPostsPagination(data.pagination));
      }
    } catch (err) {
      console.error('Posts yüklenirken hata:', err);
    } finally {
      dispatch(setLoadingPosts(false));
    }
  };

  // Load More Confessions Handler
  const handleLoadMoreConfessions = async () => {
    if (!token || isLoadingConfessions || !confessionsPagination.hasMore) return;

    dispatch(setLoadingConfessions(true));
    try {
      const nextPage = confessionsPagination.currentPage + 1;
      const res = await fetch(`http://localhost:5001/api/confessions?page=${nextPage}&limit=10`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();

      if (data.posts) {
        dispatch(appendConfessions(data.posts));
        dispatch(setConfessionsPagination(data.pagination));
      }
    } catch (err) {
      console.error('İtiraflar yüklenirken hata:', err);
    } finally {
      dispatch(setLoadingConfessions(false));
    }
  };

  // Yeni Post Oluştur
  const handleCreatePost = async () => {
    if (!newPostContent.trim()) return;
    try {
      const res = await fetch('http://localhost:5001/api/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ content: newPostContent })
      });

      if (res.status === 429) {
        const data = await res.json();
        alert(`⏱️ ${data.error}\n${data.remainingSeconds} saniye sonra tekrar deneyebilirsin.`);
        return;
      }

      if (res.ok) {
        const newPost = await res.json();
        dispatch(addPost(newPost));
        dispatch(setNewPostContent(""));
      }
    } catch (err) { console.error(err); }
  };

  // Yeni İtiraf Oluştur
  const handleCreateConfession = async () => {
    if (!newConfessionContent.trim()) return;
    try {
      const res = await fetch('http://localhost:5001/api/confessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ content: newConfessionContent, isAnonymous })
      });

      if (res.status === 429) {
        const data = await res.json();
        alert(`⏱️ ${data.error}\n${data.remainingSeconds} saniye sonra tekrar deneyebilirsin.`);
        return;
      }

      if (res.ok) {
        const newConfession = await res.json();
        dispatch(addConfession(newConfession));
        dispatch(setNewConfessionContent(""));
      }
    } catch (err) { console.error(err); }
  };

  // Beğeni (Like)
  const handleLike = async (postId, type) => {
    try {
      const res = await fetch(`http://localhost:5001/api/posts/${postId}/like`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      });
      if (res.ok) {
        const updatedItem = await res.json();
        if (type === 'post') {
          dispatch(setPosts(posts.map(p => p._id === postId ? {
            ...p,
            likes: updatedItem.likes,
            author: updatedItem.author || p.author
          } : p)));
        } else {
          dispatch(setConfessions(confessions.map(c => c._id === postId ? {
            ...c,
            likes: updatedItem.likes,
            author: updatedItem.author || c.author
          } : c)));
        }
      }
    } catch (err) { console.error(err); }
  };

  // Kampüs Detay & Yorum
  useEffect(() => {
    if (selectedCampus) {
      dispatch(setCampusComments([]));
      fetch(`http://localhost:5001/api/campus/${selectedCampus._id}/comments`)
        .then(res => res.json())
        .then(data => dispatch(setCampusComments(data)));
    }
  }, [selectedCampus, dispatch]);

  // Topluluk Detay & Yorum
  useEffect(() => {
    if (selectedCommunity) {
      dispatch(setCommunityComments([]));
      fetch(`http://localhost:5001/api/community/${selectedCommunity._id}/comments`)
        .then(res => res.json())
        .then(data => dispatch(setCommunityComments(data)));
    }
  }, [selectedCommunity, dispatch]);

  // ESC tuşu ile resim modalını kapat
  useEffect(() => {
    const handleEscKey = (event) => {
      if (event.key === 'Escape' && selectedImage) {
        dispatch(setSelectedImage(null));
      }
    };

    document.addEventListener('keydown', handleEscKey);
    return () => {
      document.removeEventListener('keydown', handleEscKey);
    };
  }, [selectedImage, dispatch]);

  const handleVote = async (campusId, type) => {
    try {
      const res = await fetch(`http://localhost:5001/api/campus/${campusId}/vote`, {
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
        // 1. Kampüs listesini güncelle
        dispatch(updateCampusVote({ campusId, counts: data.campus }));

        // 2. Seçili kampüs verisini güncelle
        if (selectedCampus && selectedCampus._id === campusId) {
          dispatch(setSelectedCampus(data.campus));

          // 3. Yorumları ANINDA yenile (Backend otomatik sistem yorumu eklediği/güncellediği için)
          // AWAIT kullanarak yorumların yüklenmesini bekle
          const commentsRes = await fetch(`http://localhost:5001/api/campus/${campusId}/comments`);
          const commentsData = await commentsRes.json();
          dispatch(setCampusComments(commentsData));
        }
      }
    } catch (err) { console.error(err); }
  };

  const handleSendComment = async () => {
    if (!commentInput.trim()) return;
    try {
      const res = await fetch(`http://localhost:5001/api/campus/${selectedCampus._id}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ content: commentInput })
      });

      if (res.status === 429) {
        const data = await res.json();
        alert(`⏱️ ${data.error}\n${data.remainingSeconds} saniye sonra tekrar deneyebilirsin.`);
        return;
      }

      if (res.ok) {
        const updatedComment = await res.json();

        // GÜNCELLEME MANTIĞI: Yeni yorum ekleme değil, mevcut yorumu güncelleme
        const exists = campusComments.some(c => c._id === updatedComment._id);

        if (exists) {
          // Varsa içeriğini güncelle
          dispatch(updateCampusComment(updatedComment));
        } else {
          // Yoksa (çok nadir durum) başa ekle
          dispatch(addCampusComment(updatedComment));
        }

        dispatch(setCommentInput("")); // Inputu temizle
      } else {
        const errorData = await res.json();
        alert(errorData.error || 'Yorum yapılamadı');
      }
    } catch (err) {
      console.error(err);
      alert('Bir hata oluştu');
    }
  };

  const handleCommentLike = async (commentId) => {
    try {
      const res = await fetch(`http://localhost:5001/api/campus/comments/${commentId}/like`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
      });
      if (res.ok) {
        const updatedComment = await res.json();
        dispatch(updateCampusComment(updatedComment));
      }
    } catch (err) { console.error(err); }
  };

  const handleEditComment = async (commentId) => {
    if (!editingContent.trim()) return;
    try {
      const res = await fetch(`http://localhost:5001/api/campus/comments/${commentId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ content: editingContent })
      });
      if (res.ok) {
        const updatedComment = await res.json();
        dispatch(updateCampusComment(updatedComment));
        dispatch(clearEditingComment());
      } else {
        const errorData = await res.json();
        alert(errorData.error || 'Yorum düzenlenemedi');
      }
    } catch (err) {
      console.error(err);
      alert('Bir hata oluştu');
    }
  };

  // TOPLULUK FONKSİYONLARI (KAMPÜS İLE AYNI MANTIK)
  const handleCommunityVote = async (communityId, type) => {
    try {
      const res = await fetch(`http://localhost:5001/api/community/${communityId}/vote`, {
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
        dispatch(updateCommunityVote({ communityId, counts: data.community }));

        if (selectedCommunity && selectedCommunity._id === communityId) {
          dispatch(setSelectedCommunity(data.community));

          const commentsRes = await fetch(`http://localhost:5001/api/community/${communityId}/comments`);
          const commentsData = await commentsRes.json();
          dispatch(setCommunityComments(commentsData));
        }
      }
    } catch (err) { console.error(err); }
  };

  const handleCommunitySendComment = async () => {
    if (!communityCommentInput.trim()) return;
    try {
      const res = await fetch(`http://localhost:5001/api/community/${selectedCommunity._id}/comments`, {
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

        const exists = communityComments.some(c => c._id === updatedComment._id);

        if (exists) {
          dispatch(updateCommunityComment(updatedComment));
        } else {
          dispatch(addCommunityComment(updatedComment));
        }

        dispatch(setCommunityCommentInput(""));
      } else {
        const errorData = await res.json();
        alert(errorData.error || 'Yorum yapılamadı');
      }
    } catch (err) {
      console.error(err);
      alert('Bir hata oluştu');
    }
  };

  const handleCommunityCommentLike = async (commentId) => {
    try {
      const res = await fetch(`http://localhost:5001/api/community/comments/${commentId}/like`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
      });
      if (res.ok) {
        const updatedComment = await res.json();
        setCommunityComments(communityComments.map(c => c._id === commentId ? {
          ...c,
          likes: updatedComment.likes,
          author: updatedComment.author || c.author,
          voteType: updatedComment.voteType
        } : c));
      }
    } catch (err) { console.error(err); }
  };

  const handleEditCommunityComment = async (commentId) => {
    if (!editingContent.trim()) return;
    try {
      const res = await fetch(`http://localhost:5001/api/community/comments/${commentId}`, {
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
        const errorData = await res.json();
        alert(errorData.error || 'Yorum düzenlenemedi');
      }
    } catch (err) {
      console.error(err);
      alert('Bir hata oluştu');
    }
  };

  const SidebarItem = ({ id, icon: Icon, label }) => (
    <div
      onClick={() => {
        dispatch(setActiveTab(id));
        dispatch(setSelectedCampus(null));
        dispatch(setSelectedCommunity(null));
        setViewedProfile(null); // <--- BU SATIRI EKLE (ÇOK ÖNEMLİ)
      }}
      className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-all ${activeTab === id ? 'bg-black text-white' : 'hover:bg-gray-100 text-gray-700'}`}
    >
      <Icon size={20} />
      <span className="font-medium text-sm">{label}</span>
    </div>
  );

  // Kullanıcının bu kampüse OYU var mı kontrol et
  const hasUserVoted = selectedCampus && campusComments.some(c => c.author?._id === userId);

  // Kullanıcının bu topluluğa OYU var mı kontrol et
  const hasUserVotedCommunity = selectedCommunity && communityComments.some(c => c.author?._id === userId);

  if (!isAuthenticated) {
    return <LoginPage onLogin={() => window.location.reload()} />;
  }

  // İlk yükleme ekranı
  if (isInitialLoading) {
    return <InitialLoadingScreen />;
  }

  // Eğer admin panelde ise, tam ekran admin panel göster
  if (activeTab === 'admin') {
    return <AdminPanel />;
  }

  return (
    <div className="min-h-screen bg-white text-gray-900 font-sans flex justify-center animate-fade-in">

      {/* SOL PANEL */}
      <aside className="w-64 hidden md:flex flex-col h-screen sticky top-0 border-r border-gray-200 p-6">
        <h1 className="text-2xl font-bold tracking-tighter mb-8 text-blue-900">KBÜ<span className="text-red-600">Sosyal</span>.</h1>
        <nav className="space-y-2">
          <SidebarItem id="akis" icon={Home} label="Akış" />
          <SidebarItem id="kampusler" icon={MapPin} label="Kampüsler" />
          <SidebarItem id="itiraflar" icon={MessageSquare} label="İtiraflar" />
          <SidebarItem id="topluluklar" icon={User} label="Topluluklar" />
          <SidebarItem id="profil" icon={Settings} label="Ayarlar" />
          {(userRole === 'admin' || userRole === 'moderator') && (
            <SidebarItem id="admin" icon={Shield} label="Admin Panel" />
          )}
        </nav>

        <div className="mt-auto pt-4 border-t border-gray-100">
         {/* Twitter Tarzı Profil Kartı - Sadeleştirilmiş */}
          <div 
            onClick={() => {
              dispatch(setActiveTab('publicProfil'));
              dispatch(setSelectedCampus(null));
              dispatch(setSelectedCommunity(null));
              setViewedProfile(null); // Hata almamak için bunu eklemeyi unutma
            }}
            className="flex items-center gap-3 mb-2 cursor-pointer transition-opacity hover:opacity-80"
          >
            <img 
              src={currentUserInfo?.profilePicture || 'https://via.placeholder.com/150'} 
              alt="Profil" 
              className="w-10 h-10 rounded-full object-cover bg-gray-200 border border-gray-200"
            />
            <div className="flex flex-col flex-1 min-w-0">
              <span className="font-bold text-sm text-gray-900 truncate">
                {currentUserInfo?.fullName || 'Kullanıcı'}
              </span>
              <span className="text-xs text-gray-500 truncate">
                @{currentUserInfo?.username || 'kullanici'}
              </span>
            </div>
          </div>
          <button onClick={handleLogout} className="flex items-center gap-3 text-red-500 font-bold text-sm hover:bg-red-50 p-2 rounded-lg w-full transition">
            <LogOut size={18} /> Çıkış Yap
          </button>
          <div className="pt-2 text-xs text-gray-400">© 2025 KBÜ Sosyal</div>
        </div>
      </aside>

      {/* ORTA PANEL */}
      <main className="flex-1 max-w-2xl w-full border-r border-gray-200 min-h-screen pb-20">

        {/* --- AKIŞ --- */}
        {activeTab === 'akis' && !viewedProfile && (
          <>
            <header className="sticky top-0 z-10 bg-white/100 backdrop-blur-md border-b border-gray-200 p-4 font-bold text-lg">
              Anasayfa
            </header>

            <div className="p-4 border-b border-gray-100 flex gap-3">
              <div className="w-10 h-10 bg-gray-200 rounded-full shrink-0"></div>
              <div className="flex-1">
                <textarea
                  className="w-full resize-none outline-none text-lg placeholder-gray-400 bg-transparent"
                  placeholder="Neler oluyor?" rows={2}
                  value={newPostContent} onChange={(e) => dispatch(setNewPostContent(e.target.value))}
                />
                <div className="flex justify-end mt-2">
                  <button onClick={handleCreatePost} disabled={!newPostContent.trim()} className="bg-blue-900 text-white px-4 py-1.5 rounded-full text-sm font-bold hover:bg-blue-800 disabled:opacity-50">Paylaş</button>
                </div>
              </div>
            </div>

            <div className="divide-y divide-gray-100">
              {isLoadingPosts && posts.length === 0 ? (
                <FeedShimmer count={5} />
              ) : (
                <>
                  {mergeWithAds(posts).map((item) => {
                    // Reklam mı kontrol et
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

                    // Normal post
                    return (
                      <div key={item._id} className="p-5">
                        <div className="flex items-center gap-3 mb-2">
                          <img
                            src={item.author?.profilePicture || 'https://via.placeholder.com/150'}
                            className="w-9 h-9 bg-gray-200 rounded-full object-cover cursor-pointer hover:opacity-80 transition"
                            onClick={() => setViewedProfile(item.author?.username)}
                          />
                          <div>
                            <div
                              className="font-bold text-sm text-gray-900 cursor-pointer hover:underline"
                              onClick={() => setViewedProfile(item.author?.username)}
                            >
                              {item.author?.username || 'Anonim'}
                            </div>
                            <div className="text-xs text-gray-400">{new Date(item.createdAt).toLocaleDateString()}</div>
                          </div>
                        </div>
                        <p className="text-gray-800 mb-3 whitespace-pre-wrap">{item.content}</p>
                        <div className="flex items-center gap-2">
                          <button onClick={() => handleLike(item._id, 'post')} className={`flex items-center gap-1.5 transition-colors ${item.likes.includes(userId) ? 'text-red-500' : 'text-gray-400 hover:text-red-500'}`}>
                            <Heart size={18} className={item.likes.includes(userId) ? 'fill-current' : ''} />
                            <span className="text-xs font-medium">{item.likes.length}</span>
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
          </>
        )}

        {/* --- İTİRAFLAR --- */}
        {activeTab === 'itiraflar' && !viewedProfile && (
          <>
            <header className="sticky top-0 z-10 bg-white/100 backdrop-blur-md border-b border-gray-200 p-4 font-bold text-lg">
              İtiraflar
            </header>
            <div className="p-4 border-b border-gray-100">
              <textarea className="w-full resize-none outline-none text-lg placeholder-gray-400 bg-transparent" placeholder="İtirafını yaz..." rows={3} value={newConfessionContent} onChange={(e) => dispatch(setNewConfessionContent(e.target.value))} />
              <div className="flex justify-between items-center mt-2">
                <label className="flex items-center gap-2 text-sm text-gray-500"><input type="checkbox" checked={isAnonymous} onChange={(e) => dispatch(setIsAnonymous(e.target.checked))} /> Anonim gönder</label>
                <button onClick={handleCreateConfession} disabled={!newConfessionContent.trim()} className="bg-red-600 text-white px-4 py-1.5 rounded-full text-sm font-bold hover:bg-red-700 disabled:opacity-50">İtiraf Et</button>
              </div>
            </div>
            <div className="divide-y divide-gray-100">
              {isLoadingConfessions && confessions.length === 0 ? (
                <FeedShimmer count={5} />
              ) : (
                <>
                  {mergeWithAds(confessions).map((item) => {
                    // Reklam mı kontrol et
                    if (item.isAd) {
                      return (
                        <AdCard
                          key={item._id}
                          ad={item}
                          onView={() => trackAdImpression(item._id.split('-')[1])}
                          onClick={() => handleAdClick({ _id: item._id.split('-')[1], targetUrl: item.targetUrl })}
                          onImageClick={(img) => dispatch(setSelectedImage(img))}
                        />
                      );
                    }

                    // Normal confession
                    return (
                      <div key={item._id} className="p-5">
                        <div className="flex items-center gap-3 mb-2">
                          {item.isAnonymous ? (
                            <div className="w-9 h-9 bg-gray-200 rounded-full flex items-center justify-center font-bold text-xs text-gray-500">?</div>
                          ) : (
                            <img
                              src={item.author?.profilePicture || 'https://via.placeholder.com/150'}
                              alt="Profile"
                              className="w-9 h-9 bg-gray-200 rounded-full object-cover cursor-pointer hover:opacity-80 transition"
                              onClick={() => setViewedProfile(item.author?.username)}
                            />
                          )}
                          <div>
                            <div
                              className={`font-bold text-sm text-gray-900 ${!item.isAnonymous ? 'cursor-pointer hover:underline' : ''}`}
                              onClick={() => !item.isAnonymous && setViewedProfile(item.author?.username)}
                            >
                              {item.isAnonymous ? 'Anonim' : item.author?.username}
                            </div>
                            <div className="text-xs text-gray-400">{new Date(item.createdAt).toLocaleDateString()}</div>
                          </div>
                        </div>
                        <p className="text-gray-800 mb-3">{item.content}</p>
                        <button onClick={() => handleLike(item._id, 'confession')} className={`flex items-center gap-1.5 transition-colors ${item.likes.includes(userId) ? 'text-red-500' : 'text-gray-400 hover:text-red-500'}`}>
                          <Heart size={18} className={item.likes.includes(userId) ? 'fill-current' : ''} />
                          <span className="text-xs font-medium">{item.likes.length}</span>
                        </button>
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
          </>
        )}

        {/* --- KAMPÜSLER --- */}
        {activeTab === 'kampusler' && !selectedCampus && !viewedProfile && (
          <>
            <header className="sticky top-0 z-10 bg-white/100 backdrop-blur-md border-b border-gray-200 p-4 font-bold text-lg">Kampüsler</header>
            {isLoadingCampuses ? (
              <GridShimmer count={4} />
            ) : (
              <div className="p-6 grid gap-5">
                {campuses.map(campus => {
                  const totalVotes = (campus.votes?.positive || 0) + (campus.votes?.neutral || 0) + (campus.votes?.negative || 0);
                  const positivePercent = totalVotes > 0 ? Math.round(((campus.votes?.positive || 0) / totalVotes) * 100) : 0;
                  const neutralPercent = totalVotes > 0 ? Math.round(((campus.votes?.neutral || 0) / totalVotes) * 100) : 0;
                  const negativePercent = totalVotes > 0 ? Math.round(((campus.votes?.negative || 0) / totalVotes) * 100) : 0;

                  return (
                    <div
                      key={campus._id}
                      onClick={() => dispatch(setSelectedCampus(campus))}
                      className="relative overflow-hidden border border-gray-200 p-6 rounded-2xl cursor-pointer bg-white"
                    >
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <h3 className="text-xl font-bold text-gray-900 mb-2">
                            {campus.name}
                          </h3>
                          <p className="text-sm text-gray-500">
                            {totalVotes} değerlendirme
                          </p>
                        </div>
                        <MapPin className="text-blue-600" size={28} />
                      </div>

                      {/* Oy Dağılımı */}
                      <div className="mb-3">
                        <div className="flex justify-between text-xs font-medium text-gray-600 mb-2">
                          <span>👍 {positivePercent}%</span>
                          <span>😐 {neutralPercent}%</span>
                          <span>👎 {negativePercent}%</span>
                        </div>
                        <div className="flex bg-gray-200 rounded-full h-3 overflow-hidden">
                          {positivePercent > 0 && (
                            <div className="bg-green-500" style={{ width: `${positivePercent}%` }}></div>
                          )}
                          {neutralPercent > 0 && (
                            <div className="bg-blue-700" style={{ width: `${neutralPercent}%` }}></div>
                          )}
                          {negativePercent > 0 && (
                            <div className="bg-red-500" style={{ width: `${negativePercent}%` }}></div>
                          )}
                        </div>
                      </div>

                      <div className="text-sm font-medium text-blue-600">
                        Detayları gör →
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}

        {/* --- KAMPÜS DETAY --- */}
        {activeTab === 'kampusler' && selectedCampus && !viewedProfile && (
          <div className="animate-in slide-in-from-right duration-300">
            <header className="sticky top-0 z-10 bg-white/100 backdrop-blur-md border-b border-gray-200 p-4 flex items-center gap-3">
              <button onClick={() => dispatch(setSelectedCampus(null))} className="p-2 hover:bg-gray-100 rounded-full transition"><ChevronLeft /></button>
              <h2 className="font-bold text-lg">{selectedCampus.name}</h2>
            </header>
            <div className="p-4">
              {/* OYLAMA BİLEŞENİ */}
              <CampusRating data={selectedCampus} onVote={handleVote} />

              <div className="my-6 border-t border-gray-100 pt-6">
                <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
                  <MessageSquare size={20} className="text-blue-600" />
                  Yorumlar ({campusComments.length})
                </h3>

                {/* YORUM YAPMA KISMI (OY KONTROLLÜ) */}
                <div className="mb-6 relative">
                  {/* Eğer oy verilmediyse üstüne BLUR atan katman */}
                  {!hasUserVoted && (
                    <div className="absolute inset-0 bg-white/60 backdrop-blur-[2px] z-10 flex items-center justify-center rounded-xl border border-dashed border-gray-300">
                      <div className="flex items-center gap-2 text-gray-500 font-medium text-sm">
                        <Lock size={16} />
                        <span>Yorum yapmak için önce oy verin</span>
                      </div>
                    </div>
                  )}

                  <div className={`flex gap-2 transition-opacity ${!hasUserVoted ? 'opacity-40' : 'opacity-100'}`}>
                    <input
                      type="text"
                      disabled={!hasUserVoted}
                      value={commentInput}
                      onChange={(e) => dispatch(setCommentInput(e.target.value))}
                      onKeyDown={(e) => e.key === 'Enter' && handleSendComment()}
                      placeholder="Deneyimlerini paylaş..."
                      className="flex-1 bg-gray-100 rounded-full px-5 py-3 text-sm outline-none focus:ring-2 focus:ring-blue-100 transition disabled:cursor-not-allowed"
                    />
                    <button
                      onClick={handleSendComment}
                      disabled={!hasUserVoted}
                      className="bg-blue-900 text-white p-3 rounded-full hover:bg-blue-800 transition shadow-lg shadow-blue-900/20 disabled:bg-gray-300 disabled:shadow-none"
                    >
                      <Send size={18} />
                    </button>
                  </div>
                </div>

                <div className="divide-y divide-gray-100">
                  {isLoadingComments ? (
                    <CommentsShimmer count={3} />
                  ) : campusComments.length > 0 ? campusComments.map((comment) => {
                    const isEditing = editingCommentId === comment._id;
                    const isOwnComment = comment.author?._id === userId;
                    const voteMessages = ['👍 Bu kampüsü beğendim!', '😐 İdare eder.', '👎 Pek beğenmedim.'];
                    const isAutoComment = voteMessages.includes(comment.content);

                    // Rozet Detaylarını Al (Backend'den voteType gelmesi şart)
                    const badge = getVoteBadgeDetails(comment.voteType);

                    return (
                      <div key={comment._id} className="p-5 hover:bg-gray-50 transition rounded-xl">
                        <div className="flex items-start gap-3 mb-2">
                          <img
                            src={comment.author?.profilePicture || 'https://via.placeholder.com/150'}
                            alt={comment.author?.username}
                            className="w-10 h-10 bg-gray-200 rounded-full object-cover border border-gray-200"
                          />
                          <div className="flex-1">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2 flex-wrap">
                                <div className="font-bold text-sm text-gray-900">{comment.author?.username || 'Anonim'}</div>

                                {/* --- ROZET (BADGE) GÖSTERİMİ --- */}
                                {badge && (
                                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium flex items-center gap-1 shadow-sm ${badge.color}`}>
                                    {badge.icon} {badge.label}
                                  </span>
                                )}
                              </div>
                              <div className="text-xs text-gray-400">{new Date(comment.createdAt).toLocaleDateString('tr-TR')}</div>
                            </div>

                            {isEditing ? (
                              <div className="mb-3 mt-2">
                                <textarea
                                  value={editingContent}
                                  onChange={(e) => dispatch(setEditingComment({ id: editingCommentId, content: e.target.value }))}
                                  className="w-full bg-white border border-gray-300 rounded-lg px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-100 resize-none"
                                  rows={3}
                                />
                                <div className="flex gap-2 mt-2">
                                  <button
                                    onClick={() => handleEditComment(comment._id)}
                                    className="bg-blue-900 text-white px-3 py-1.5 rounded-lg text-xs font-medium hover:bg-blue-800"
                                  >
                                    Kaydet
                                  </button>
                                  <button
                                    onClick={() => dispatch(clearEditingComment())}
                                    className="bg-gray-200 text-gray-700 px-3 py-1.5 rounded-lg text-xs font-medium hover:bg-gray-300"
                                  >
                                    İptal
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <p className="text-gray-800 text-sm mt-1 whitespace-pre-wrap leading-relaxed">{comment.content}</p>
                            )}

                            <div className="flex items-center gap-4 mt-3">
                              <button
                                onClick={() => handleCommentLike(comment._id)}
                                className={`flex items-center gap-1.5 transition-colors ${comment.likes?.includes(userId) ? 'text-red-500' : 'text-gray-400 hover:text-red-500'
                                  }`}
                              >
                                <Heart
                                  size={16}
                                  className={comment.likes?.includes(userId) ? 'fill-current' : ''}
                                />
                                <span className="text-xs font-medium">{comment.likes?.length || 0}</span>
                              </button>

                              {isOwnComment && !isAutoComment && !isEditing && (
                                <button
                                  onClick={() => dispatch(setEditingComment({ id: comment._id, content: comment.content }))}
                                  className="text-xs text-gray-500 hover:text-blue-600 font-medium"
                                >
                                  Düzenle
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  }) : (
                    <div className="text-center text-gray-400 py-12 text-sm bg-gray-50/50 rounded-xl mt-4 border border-dashed border-gray-200">
                      <MessageSquare size={32} className="mx-auto mb-3 opacity-30" />
                      <p>Henüz yorum yok.</p>
                      <p className="text-xs opacity-70">İlk oyu vererek yorumları başlat!</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* --- TOPLULUKLAR LİSTE --- */}
        {activeTab === 'topluluklar' && !selectedCommunity && !viewedProfile && (
          <>
            <header className="sticky top-0 z-10 bg-white/100 backdrop-blur-md border-b border-gray-200 p-4 font-bold text-lg">Topluluklar</header>
            <div className="p-6 grid gap-5">
              {communities.length > 0 ? communities.map(community => {
                const totalVotes = (community.votes?.positive || 0) + (community.votes?.neutral || 0) + (community.votes?.negative || 0);
                const positivePercent = totalVotes > 0 ? Math.round(((community.votes?.positive || 0) / totalVotes) * 100) : 0;
                const neutralPercent = totalVotes > 0 ? Math.round(((community.votes?.neutral || 0) / totalVotes) * 100) : 0;
                const negativePercent = totalVotes > 0 ? Math.round(((community.votes?.negative || 0) / totalVotes) * 100) : 0;

                return (
                  <div
                    key={community._id}
                    onClick={() => dispatch(setSelectedCommunity(community))}
                    className="relative overflow-hidden border border-gray-200 p-6 rounded-2xl cursor-pointer bg-white"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <h3 className="text-xl font-bold text-gray-900 mb-2">
                          {community.name}
                        </h3>
                        <p className="text-sm text-gray-500">
                          {totalVotes} değerlendirme
                        </p>
                      </div>
                      <User className="text-blue-600" size={28} />
                    </div>

                    {/* Oy Dağılımı */}
                    <div className="mb-3">
                      <div className="flex justify-between text-xs font-medium text-gray-600 mb-2">
                        <span>👍 {positivePercent}%</span>
                        <span>😐 {neutralPercent}%</span>
                        <span>👎 {negativePercent}%</span>
                      </div>
                      <div className="flex bg-gray-200 rounded-full h-3 overflow-hidden">
                        {positivePercent > 0 && (
                          <div className="bg-green-500" style={{ width: `${positivePercent}%` }}></div>
                        )}
                        {neutralPercent > 0 && (
                          <div className="bg-yellow-500" style={{ width: `${neutralPercent}%` }}></div>
                        )}
                        {negativePercent > 0 && (
                          <div className="bg-red-500" style={{ width: `${negativePercent}%` }}></div>
                        )}
                      </div>
                    </div>

                    <div className="text-sm font-medium text-blue-600">
                      Detayları gör →
                    </div>
                  </div>
                );
              }) : (
                <div className="text-center text-gray-400 py-12">
                  <p className="text-lg font-medium">Henüz topluluk bulunmuyor</p>
                  <p className="text-sm mt-2">Yeni topluluklar yakında eklenecek!</p>
                </div>
              )}
            </div>
          </>
        )}

        {/* --- TOPLULUK DETAY --- */}
        {activeTab === 'topluluklar' && selectedCommunity && !viewedProfile && (
          <div className="animate-in slide-in-from-right duration-300">
            <header className="sticky top-0 z-10 bg-white/100 backdrop-blur-md border-b border-gray-200 p-4 flex items-center gap-3">
              <button onClick={() => dispatch(setSelectedCommunity(null))} className="p-2 hover:bg-gray-100 rounded-full transition"><ChevronLeft /></button>
              <h2 className="font-bold text-lg">{selectedCommunity.name}</h2>
            </header>
            <div className="p-4">
              {/* OYLAMA BİLEŞENİ */}
              <CampusRating data={selectedCommunity} onVote={handleCommunityVote} />

              <div className="my-6 border-t border-gray-100 pt-6">
                <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
                  <MessageSquare size={20} className="text-blue-600" />
                  Yorumlar ({communityComments.length})
                </h3>

                {/* YORUM YAPMA KISMI */}
                <div className="mb-6 relative">
                  {!hasUserVotedCommunity && (
                    <div className="absolute inset-0 bg-white/60 backdrop-blur-[2px] z-10 flex items-center justify-center rounded-xl border border-dashed border-gray-300">
                      <div className="flex items-center gap-2 text-gray-500 font-medium text-sm">
                        <Lock size={16} />
                        <span>Yorum yapmak için önce oy verin</span>
                      </div>
                    </div>
                  )}

                  <div className={`flex gap-2 transition-opacity ${!hasUserVotedCommunity ? 'opacity-40' : 'opacity-100'}`}>
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

                <div className="divide-y divide-gray-100">
                  {communityComments.length > 0 ? communityComments.map((comment) => {
                    const isEditing = editingCommentId === comment._id;
                    const isOwnComment = comment.author?._id === userId;
                    const voteMessages = ['👍 Bu topluluğu beğendim!', '😐 İdare eder.', '👎 Pek beğenmedim.'];
                    const isAutoComment = voteMessages.includes(comment.content);

                    const badge = getVoteBadgeDetails(comment.voteType);

                    return (
                      <div key={comment._id} className="p-5 hover:bg-gray-50 transition rounded-xl">
                        <div className="flex items-start gap-3 mb-2">
                          <img
                            src={comment.author?.profilePicture || 'https://via.placeholder.com/150'}
                            alt={comment.author?.username}
                            className="w-10 h-10 bg-gray-200 rounded-full object-cover border border-gray-200"
                          />
                          <div className="flex-1">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2 flex-wrap">
                                <div className="font-bold text-sm text-gray-900">{comment.author?.username || 'Anonim'}</div>

                                {badge && (
                                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium flex items-center gap-1 shadow-sm ${badge.color}`}>
                                    {badge.icon} {badge.label}
                                  </span>
                                )}
                              </div>
                              <div className="text-xs text-gray-400">{new Date(comment.createdAt).toLocaleDateString('tr-TR')}</div>
                            </div>

                            {isEditing ? (
                              <div className="mb-3 mt-2">
                                <textarea
                                  value={editingContent}
                                  onChange={(e) => dispatch(setEditingComment({ id: editingCommentId, content: e.target.value }))}
                                  className="w-full bg-white border border-gray-300 rounded-lg px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-100 resize-none"
                                  rows={3}
                                />
                                <div className="flex gap-2 mt-2">
                                  <button
                                    onClick={() => handleEditCommunityComment(comment._id)}
                                    className="bg-blue-900 text-white px-3 py-1.5 rounded-lg text-xs font-medium hover:bg-blue-800"
                                  >
                                    Kaydet
                                  </button>
                                  <button
                                    onClick={() => dispatch(clearEditingComment())}
                                    className="bg-gray-200 text-gray-700 px-3 py-1.5 rounded-lg text-xs font-medium hover:bg-gray-300"
                                  >
                                    İptal
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <p className="text-gray-800 text-sm mt-1 whitespace-pre-wrap leading-relaxed">{comment.content}</p>
                            )}

                            <div className="flex items-center gap-4 mt-3">
                              <button
                                onClick={() => handleCommunityCommentLike(comment._id)}
                                className={`flex items-center gap-1.5 transition-colors ${comment.likes?.includes(userId) ? 'text-red-500' : 'text-gray-400 hover:text-red-500'
                                  }`}
                              >
                                <Heart
                                  size={16}
                                  className={comment.likes?.includes(userId) ? 'fill-current' : ''}
                                />
                                <span className="text-xs font-medium">{comment.likes?.length || 0}</span>
                              </button>

                              {isOwnComment && !isAutoComment && !isEditing && (
                                <button
                                  onClick={() => dispatch(setEditingComment({ id: comment._id, content: comment.content }))}
                                  className="text-xs text-gray-500 hover:text-blue-600 font-medium"
                                >
                                  Düzenle
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  }) : (
                    <div className="text-center text-gray-400 py-12 text-sm bg-gray-50/50 rounded-xl mt-4 border border-dashed border-gray-200">
                      <MessageSquare size={32} className="mx-auto mb-3 opacity-30" />
                      <p>Henüz yorum yok.</p>
                      <p className="text-xs opacity-70">İlk oyu vererek yorumları başlat!</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* --- PROFİL --- */}
        {activeTab === 'profil' && !viewedProfile && <ProfilePage />}

        {activeTab === 'publicProfil' && (
          <PublicProfilePage 
            username={currentUserInfo?.username} 
            onClose={() => dispatch(setActiveTab('akis'))} 
          />
        )}

        {/* --- MEVCUT viewedProfile KISMI --- */}
        {viewedProfile && (
          <PublicProfilePage
            username={viewedProfile}
            onClose={() => setViewedProfile(null)}
          />
        )}
      </main>

      {/* SAĞ PANEL */}
      <aside className="w-80 hidden lg:block p-6 sticky top-0 h-screen">
        <div className="relative mb-6">
          <Search className="absolute left-3 top-3 text-gray-400" size={18} />
          <input type="text" placeholder="Ara..." className="w-full bg-gray-100 p-2.5 pl-10 rounded-full text-sm outline-none focus:ring-2 focus:ring-blue-100" />
        </div>
        <div className="border border-gray-200 rounded-xl p-5 bg-white">
          <h3 className="font-bold mb-3 text-gray-800">Popüler Başlıklar</h3>
          <ul className="space-y-3">
            <li className="text-sm font-medium text-gray-500 hover:text-blue-600 cursor-pointer transition">#Finaller</li>
            <li className="text-sm font-medium text-gray-500 hover:text-blue-600 cursor-pointer transition">#Yemekhane</li>
            <li className="text-sm font-medium text-gray-500 hover:text-blue-600 cursor-pointer transition">#Mühendislik</li>
            <li className="text-sm font-medium text-gray-500 hover:text-blue-600 cursor-pointer transition">#Safranbolu</li>
          </ul>
        </div>
      </aside>

      {/* RESİM MODAL (LIGHTBOX) - Twitter Tarzı */}
      {selectedImage && (
        <div
          className="fixed inset-0 z-50 bg-black flex items-center justify-center"
          onClick={() => dispatch(setSelectedImage(null))}
        >
          {/* Üst Bar - Kapat Butonu */}
          <div className="absolute top-0 left-0 right-0 p-4 flex justify-between items-center z-10">
            <button
              onClick={() => dispatch(setSelectedImage(null))}
              className="bg-black bg-opacity-50 hover:bg-opacity-70 text-white rounded-full p-2 transition"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>
          </div>

          {/* Resim - Gerçek Boyutunda */}
          <img
            src={selectedImage}
            alt="Enlarged view"
            className="max-w-full max-h-full object-scale-down"
            onClick={(e) => e.stopPropagation()}
            style={{ cursor: 'default' }}
          />
        </div>
      )}

    </div>
  );
}

