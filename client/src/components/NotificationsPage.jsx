import { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { X, Heart, UserPlus, UserCheck, MessageSquare, Bell, Gift, Star, Sparkles } from 'lucide-react';
import ChristmasCardModal from './ChristmasCardModal';
import Lottie from 'lottie-react';
import loaderAnimation from '../assets/loader.json';
import { setNotifications, appendNotifications, setPagination, setUnreadCount, markAsRead, markAllAsRead, deleteNotification, setLoading } from '../store/slices/notificationsSlice';
import { API_URL } from '../config/api';
import CachedImage from './CachedImage';

export default function NotificationsPage({ onClose, onNavigateToProfile, onNavigateToPost, onNavigateToComment, onNavigateToVersionNotes }) {
  const dispatch = useDispatch();
  const token = useSelector(state => state.auth.token);
  const { notifications, unreadCount, pagination, loading } = useSelector(state => state.notifications);
  const [loadingMore, setLoadingMore] = useState(false);
  // İşlem yapılan bildirimlerin ID'lerini tutmak için (butonları disable etmek için)
  const [processingIds, setProcessingIds] = useState([]);
  // Yılbaşı kartı modal state
  const [selectedCardId, setSelectedCardId] = useState(null);

  useEffect(() => {
    // Sadece bildirimler yoksa fetch et (AppLayout zaten ilk yüklemeyi yapar)
    if (notifications.length === 0) {
      fetchNotifications(1);
    }
  }, []);

  const fetchNotifications = async (page = 1) => {
    try {
      // Sadece ilk sayfa ve bildirim yoksa loading göster
      if (page === 1) {
        if (notifications.length === 0) {
          dispatch(setLoading(true));
        }
      } else {
        setLoadingMore(true);
      }

      const res = await fetch(`${API_URL}/api/notifications?page=${page}&limit=20`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      const data = await res.json();

      if (res.ok) {
        if (page === 1) {
          dispatch(setNotifications(data.notifications));
        } else {
          dispatch(appendNotifications(data.notifications));
        }
        dispatch(setPagination(data.pagination));
        dispatch(setUnreadCount(data.unreadCount));
      }
    } catch (err) {
      console.error('Bildirimler yüklenemedi:', err);
    } finally {
      dispatch(setLoading(false));
      setLoadingMore(false);
    }
  };

  const handleMarkAsRead = async (notificationId) => {
    try {
      const res = await fetch(`${API_URL}/api/notifications/${notificationId}/read`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (res.ok) {
        dispatch(markAsRead(notificationId));
      }
    } catch (err) {
      console.error('Bildirim okundu işaretlenemedi:', err);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      const res = await fetch(`${API_URL}/api/notifications/read-all`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (res.ok) {
        dispatch(markAllAsRead());
      }
    } catch (err) {
      console.error('Tüm bildirimler okundu işaretlenemedi:', err);
    }
  };

  const handleDelete = async (notificationId) => {
    try {
      const res = await fetch(`${API_URL}/api/notifications/${notificationId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (res.ok) {
        dispatch(deleteNotification(notificationId));
      }
    } catch (err) {
      console.error('Bildirim silinemedi:', err);
    }
  };

  // --- YENİ EKLENEN: Takip İsteği Kabul Etme ---
  const handleAcceptFollow = async (e, senderId, notificationId) => {
    e.stopPropagation(); // Tıklamanın bildirimi "okundu" yapmasını engellemek için
    if(!senderId) return;

    setProcessingIds(prev => [...prev, notificationId]);

    try {
      const res = await fetch(`${API_URL}/api/users/${senderId}/accept-follow`, {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (res.ok) {
        // İsteği kabul edince bildirimi listeden silebiliriz çünkü artık işlevi bitti
        dispatch(deleteNotification(notificationId));
      }
    } catch (err) {
      console.error('Takip kabul hatası:', err);
    } finally {
      setProcessingIds(prev => prev.filter(id => id !== notificationId));
    }
  };

  // --- YENİ EKLENEN: Takip İsteği Reddetme ---
  const handleRejectFollow = async (e, senderId, notificationId) => {
    e.stopPropagation();
    if(!senderId) return;

    setProcessingIds(prev => [...prev, notificationId]);

    try {
      const res = await fetch(`${API_URL}/api/users/${senderId}/reject-follow`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (res.ok) {
        // Reddedince de bildirimi siliyoruz
        dispatch(deleteNotification(notificationId));
      }
    } catch (err) {
      console.error('Takip red hatası:', err);
    } finally {
      setProcessingIds(prev => prev.filter(id => id !== notificationId));
    }
  };

  // --- YENİ EKLENEN: Bildirime Tıklama İşlemi ---
  const handleNotificationClick = (notification) => {
    // follow_request için tıklamayı devre dışı bırak (çünkü butonlar var)
    if (notification.type === 'follow_request') {
      return;
    }

    // Bildirimi okundu işaretle
    if (!notification.isRead) {
      handleMarkAsRead(notification._id);
    }

    // Bildirim tipine göre yönlendirme
    switch (notification.type) {
      case 'like':
      case 'comment':
      case 'mention':
        // Post'a git
        if (notification.post?._id) {
          onNavigateToPost(notification.post._id);
          onClose(); // Bildirim panelini kapat
        }
        break;

      case 'comment_reply':
        // Yoruma git (CommentDetailPage aç)
        if (notification.comment) {
          onNavigateToComment(notification.comment);
          onClose(); // Bildirim panelini kapat
        }
        break;

      case 'comment_like':
        // Yorum beğenisi - yoruma git
        if (notification.comment) {
          onNavigateToComment(notification.comment);
          onClose();
        }
        break;

      case 'follow_accept':
        // DÜZELTME BURADA: _id yerine username gönderiyoruz
        if (notification.sender?.username) {
          onNavigateToProfile(notification.sender.username);
          onClose(); // Bildirim panelini kapat
        } else if (notification.sender?._id) {
          // Yedek plan: Eğer username yoksa (nadir durum) ID deneyelim ama
          // asıl çözüm username olmasıdır.
          onNavigateToProfile(notification.sender._id);
          onClose();
        }
        break;

      case 'suggestion':
        // Öneri bildirimi - önerilen post'a git
        if (notification.post?._id) {
          onNavigateToPost(notification.post._id);
          onClose(); // Bildirim panelini kapat
        }
        break;

      case 'version_update':
        onNavigateToVersionNotes();
        onClose();
        break;

      case 'announcement_post':
        // Duyuru bildirimi - ilgili post'a git
        if (notification.post?._id) {
          onNavigateToPost(notification.post._id);
          onClose(); // Bildirim panelini kapat
        }
        break;

      case 'christmas_card':
        // Yılbaşı kartı - modal aç
        if (notification.christmasCard) {
          setSelectedCardId(notification.christmasCard);
          handleMarkAsRead(notification._id);
        }
        break;

      default:
        break;
    }
  };
 const getNotificationIcon = (type) => {
    switch (type) {
      case 'like':
        return <Heart size={20} className="text-red-500" />;
      case 'comment_like': // YENİ: Yorum beğenisi
        return <Heart size={20} className="text-pink-500" />;
      case 'follow_request':
        return <UserPlus size={20} className="text-blue-500" />;
      case 'follow_accept':
        return <UserCheck size={20} className="text-green-500" />;
      case 'comment':
        return <MessageSquare size={20} className="text-purple-500" />;
      case 'comment_reply': // YENİ: Yoruma cevap
        return <MessageSquare size={20} className="text-blue-500" />;
      case 'mention':
        return <Bell size={20} className="text-orange-500" />;
      case 'suggestion': // YENİ: Öneri
        return <Star size={20} className="text-yellow-500" />;
      case 'version_update':
        return <Gift size={20} className="text-indigo-500" />;
      case 'announcement_post': // YENİ: Duyuru gönderisi
        return <Bell size={20} className="text-blue-600" />;
      case 'christmas_card': // YENİ: Yılbaşı kartı
        return <Sparkles size={20} className="text-red-600" />;
      default:
        return <Bell size={20} className="text-gray-500" />;
    }
  };
 const getNotificationText = (notification) => {
    const senderName = notification.sender?.fullName || 'Bir kullanıcı';

    switch (notification.type) {
      case 'like':
        return `${senderName} gönderini beğendi`;
      case 'comment_like': // YENİ
        return `${senderName} yorumunu beğendi`;
      case 'follow_request':
        return `${senderName} seni takip etmek istiyor`;
      case 'follow_accept':
        return `${senderName} takip isteğini kabul etti`;
      case 'comment':
        return `${senderName} gönderine yorum yaptı`;
      case 'comment_reply': // YENİ
        return `${senderName} yorumuna cevap verdi`;
      case 'mention':
        return `${senderName} seni bir gönderide bahsetti`;
      case 'suggestion': // YENİ
        return `Günün önerisi: ${senderName} kullanıcısının popüler gönderisine göz at!`;
      case 'version_update':
        return `Yeni sürüm geldi! ${notification.version || ''} sürümündeki yenilikleri keşfet.`;
      case 'announcement_post': // YENİ
        return `${senderName} yeni bir duyuru paylaştı`;
      case 'christmas_card': // YENİ
        return `${senderName} sana yılbaşı kartı gönderdi! 🎄`;
      default:
        return 'Yeni bir bildirim';
    }
  };
  const formatTime = (date) => {
    const now = new Date();
    const notifDate = new Date(date);
    const diffMs = now - notifDate;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Şimdi';
    if (diffMins < 60) return `${diffMins} dk önce`;
    if (diffHours < 24) return `${diffHours} saat önce`;
    if (diffDays < 7) return `${diffDays} gün önce`;
    return notifDate.toLocaleDateString('tr-TR');
  };

  return (
    <>
      {/* Backdrop - Sadece desktop'ta görünür */}
      <div
        className="hidden md:block fixed inset-0 bg-black/30 z-40 animate-fade-in"
        onClick={onClose}
      />

      {/* Notifications Panel */}
      <div className="fixed inset-0 md:inset-y-0 md:right-0 md:left-auto md:w-[420px] bg-white z-50 flex flex-col shadow-2xl animate-slide-in-right">
        {/* Header */}
        <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-gray-200 px-4 h-[60px] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={onClose} className="p-1.5 hover:bg-gray-100 rounded-full transition">
              <X size={20} />
            </button>
            <h1 className="font-bold text-lg">Bildirimler</h1>
          </div>

          {unreadCount > 0 && (
            <button
              onClick={handleMarkAllAsRead}
              className="text-sm text-blue-600 hover:text-blue-700 font-medium"
            >
              Tümünü okundu işaretle
            </button>
          )}
        </header>

      {/* Notifications List */}
      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="w-16 h-16">
              <Lottie animationData={loaderAnimation} loop={true} />
            </div>
          </div>
        ) : notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full p-8 text-center">
            <Bell size={48} className="text-gray-300 mb-3" />
            <h2 className="text-lg font-semibold text-gray-900 mb-1">Henüz bildirim yok</h2>
            <p className="text-sm text-gray-500">Yeni bildirimleriniz burada görünecek</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {notifications.map((notification) => (
              <div
                key={notification._id}
                className={`p-4 hover:bg-gray-50 transition cursor-pointer ${
                  !notification.isRead ? 'bg-blue-50/50' : ''
                }`}
                onClick={() => handleNotificationClick(notification)}
              >
                <div className="flex items-start gap-3">
                  {/* Sender Profile Picture */}
                  <div className="relative">
                    {notification.type === 'version_update' ? (
                      <div className="w-12 h-12 bg-gradient-to-br from-green-400 to-emerald-600 rounded-full flex items-center justify-center">
                        <Gift size={24} className="text-white" />
                      </div>
                    ) : notification.sender?.profilePicture ? (
                      <CachedImage
                        src={notification.sender.profilePicture}
                        alt={notification.sender.fullName}
                        className="w-12 h-12 rounded-full object-cover"
                        fallback={
                          <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center">
                            <UserPlus size={24} className="text-gray-400" />
                          </div>
                        }
                      />
                    ) : (
                      <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center">
                        <UserPlus size={24} className="text-gray-400" />
                      </div>
                    )}
                    {/* Notification Type Icon */}
                    {notification.type !== 'version_update' && (
                      <div className="absolute -bottom-1 -right-1 bg-white rounded-full p-1 shadow-sm">
                        {getNotificationIcon(notification.type)}
                      </div>
                    )}
                  </div>

                  {/* Notification Content */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-900">
                      {notification.type === 'version_update' ? (
                        <span className="text-gray-900">{getNotificationText(notification)}</span>
                      ) : (
                        <>
                          <span className="font-semibold">{notification.sender?.username || 'Kullanıcı'}</span>
                          {' '}
                          <span className="text-gray-600">
                            {/* Eğer follow_request ise özel metni basıyoruz, değilse standart fonksiyonu kullanıyoruz */}
                            {notification.type === 'follow_request'
                              ? 'seni takip etmek istiyor'
                              : getNotificationText(notification).split(notification.sender?.fullName || '')[1]}
                          </span>
                        </>
                      )}
                    </p>

                    {notification.post?.content && (
                      <p className="text-sm text-gray-500 mt-1 line-clamp-2">
                        "{notification.post.content}"
                      </p>
                    )}

                    <p className="text-xs text-gray-400 mt-1">{formatTime(notification.createdAt)}</p>

                    {/* --- DÜZELTİLEN KISIM: Takip İsteği Butonları --- */}
                    {notification.type === 'follow_request' && (
                      <div className="flex gap-2 mt-3">
                        <button 
                          onClick={(e) => handleAcceptFollow(e, notification.sender?._id, notification._id)}
                          disabled={processingIds.includes(notification._id)}
                          className="flex items-center gap-1 bg-blue-600 text-white px-4 py-1.5 rounded-lg text-sm font-medium hover:bg-blue-700 transition disabled:opacity-50"
                        >
                          {processingIds.includes(notification._id) ? '...' : 'Onayla'}
                        </button>
                        <button 
                          onClick={(e) => handleRejectFollow(e, notification.sender?._id, notification._id)}
                          disabled={processingIds.includes(notification._id)}
                          className="flex items-center gap-1 bg-gray-200 text-gray-700 px-4 py-1.5 rounded-lg text-sm font-medium hover:bg-gray-300 transition disabled:opacity-50"
                        >
                          Sil
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Unread Indicator (Sadece buton yoksa ve okunmadıysa gösterelim ki karışmasın) */}
                  {!notification.isRead && notification.type !== 'follow_request' && (
                    <div className="w-2 h-2 bg-blue-600 rounded-full mt-2"></div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Load More */}
        {pagination.hasMore && (
          <div className="p-4">
            <button
              onClick={() => fetchNotifications(pagination.currentPage + 1)}
              disabled={loadingMore}
              className="w-full py-3 text-sm font-medium text-blue-600 hover:bg-blue-50 rounded-lg transition disabled:opacity-50"
            >
              {loadingMore ? 'Yükleniyor...' : 'Daha fazla yükle'}
            </button>
          </div>
        )}
      </div>
      </div>

      {/* Christmas Card Modal */}
      {selectedCardId && (
        <ChristmasCardModal
          cardId={selectedCardId}
          onClose={() => setSelectedCardId(null)}
        />
      )}
    </>
  );
}