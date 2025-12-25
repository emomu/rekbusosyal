/**
 * Browser Notifications Utility
 * Handles browser push notifications for new app notifications
 */

const NOTIFICATION_PERMISSION_KEY = 'notification_permission_requested';
const LAST_NOTIFICATION_TIME_KEY = 'last_notification_time';

/**
 * Check if browser supports notifications
 */
export const isNotificationSupported = () => {
  return 'Notification' in window;
};

/**
 * Get current notification permission status
 */
export const getNotificationPermission = () => {
  if (!isNotificationSupported()) return 'unsupported';
  return Notification.permission;
};

/**
 * Check if we should show permission prompt
 * Returns true if we haven't asked before and permission is default
 */
export const shouldShowPermissionPrompt = () => {
  if (!isNotificationSupported()) return false;

  const hasAskedBefore = localStorage.getItem(NOTIFICATION_PERMISSION_KEY);
  const currentPermission = Notification.permission;

  // Show prompt if we haven't asked and permission is default
  return !hasAskedBefore && currentPermission === 'default';
};

/**
 * Request notification permission from user
 * @returns {Promise<string>} Permission status: 'granted', 'denied', or 'default'
 */
export const requestNotificationPermission = async () => {
  if (!isNotificationSupported()) {
    console.warn('Browser notifications not supported');
    return 'unsupported';
  }

  try {
    const permission = await Notification.requestPermission();

    // Mark that we've asked for permission
    localStorage.setItem(NOTIFICATION_PERMISSION_KEY, 'true');

    return permission;
  } catch (error) {
    console.error('Error requesting notification permission:', error);
    return 'denied';
  }
};

/**
 * Show a browser notification
 * @param {Object} options - Notification options
 * @param {string} options.title - Notification title
 * @param {string} options.body - Notification body text
 * @param {string} options.icon - Notification icon URL
 * @param {string} options.tag - Unique tag to prevent duplicates
 * @param {Object} options.data - Custom data to attach to notification
 * @returns {Notification|null} The notification instance or null
 */
export const showNotification = ({ title, body, icon, tag, data = {} }) => {
  console.log('🔔 showNotification called:', { title, body, icon, tag });

  if (!isNotificationSupported()) {
    console.warn('❌ Browser notifications not supported');
    return null;
  }

  const permission = Notification.permission;
  console.log('🔔 Notification permission:', permission);

  if (permission !== 'granted') {
    console.warn('❌ Notification permission not granted, current:', permission);
    return null;
  }

  try {
    console.log('✅ Creating browser notification...');
    const notification = new Notification(title, {
      body,
      icon: icon || window.location.origin + '/logo.svg',
      badge: window.location.origin + '/logo.svg',
      tag: tag || `notification-${Date.now()}`,
      data,
      requireInteraction: false, // Auto-close after a few seconds
      silent: false,
    });

    console.log('✅ Browser notification created successfully');

    // Store last notification time to prevent spam
    localStorage.setItem(LAST_NOTIFICATION_TIME_KEY, Date.now().toString());

    return notification;
  } catch (error) {
    console.error('❌ Error showing notification:', error);
    return null;
  }
};

/**
 * Show notification for app notification
 * @param {Object} notification - App notification object
 */
export const showNotificationForAppNotification = (notification) => {
  console.log('📱 showNotificationForAppNotification called:', notification);

  if (!notification) {
    console.warn('❌ No notification object provided');
    return null;
  }

  // Get notification title and body based on type
  const { title, body } = getNotificationContent(notification);
  console.log('📱 Notification content:', { title, body, type: notification.type });

  // Get sender profile picture or use default
  const icon = notification.sender?.profilePicture || window.location.origin + '/logo.svg';

  // Create unique tag to prevent duplicates
  const tag = `app-notification-${notification._id}`;

  const browserNotification = showNotification({
    title,
    body,
    icon,
    tag,
    data: {
      notificationId: notification._id,
      type: notification.type,
      postId: notification.post?._id,
      commentId: notification.comment?._id,
      username: notification.sender?.username,
    },
  });

  // Add click handler to navigate to relevant page
  if (browserNotification) {
    console.log('✅ Browser notification created, adding click handler');
    browserNotification.onclick = () => {
      window.focus();
      handleNotificationClick(notification);
      browserNotification.close();
    };
  } else {
    console.warn('❌ Browser notification was not created');
  }

  return browserNotification;
};

/**
 * Get notification content based on type
 */
const getNotificationContent = (notification) => {
  const senderName = notification.sender?.fullName || notification.sender?.username || 'Bir kullanıcı';

  switch (notification.type) {
    case 'like':
      return {
        title: 'Yeni Beğeni',
        body: `${senderName} gönderini beğendi`,
      };
    case 'comment':
      return {
        title: 'Yeni Yorum',
        body: `${senderName} gönderine yorum yaptı`,
      };
    case 'comment_reply':
      return {
        title: 'Yorum Yanıtı',
        body: `${senderName} yorumuna cevap verdi`,
      };
    case 'comment_like':
      return {
        title: 'Yorum Beğenisi',
        body: `${senderName} yorumunu beğendi`,
      };
    case 'follow_request':
      return {
        title: 'Takip İsteği',
        body: `${senderName} seni takip etmek istiyor`,
      };
    case 'follow_accept':
      return {
        title: 'Takip Kabul Edildi',
        body: `${senderName} takip isteğini kabul etti`,
      };
    case 'mention':
      return {
        title: 'Bahsedildin',
        body: `${senderName} seni bir gönderide bahsetti`,
      };
    case 'suggestion':
      return {
        title: 'Günün Önerisi',
        body: `${senderName} kullanıcısının popüler gönderisine göz at!`,
      };
    case 'version_update':
      return {
        title: 'Yeni Sürüm',
        body: notification.version ? `${notification.version} sürümündeki yenilikleri keşfet` : 'Yeni sürüm yayınlandı!',
      };
    case 'christmas_card':
      return {
        title: '🎄 Yılbaşı Kartı',
        body: `${senderName} sana yılbaşı kartı gönderdi!`,
      };
    case 'announcement_post':
      return {
        title: 'Yeni Duyuru',
        body: `${senderName} yeni bir duyuru paylaştı`,
      };
    default:
      return {
        title: 'KBÜ Sosyal',
        body: 'Yeni bir bildiriminiz var',
      };
  }
};

/**
 * Handle notification click - navigate to relevant page
 */
const handleNotificationClick = (notification) => {
  let url = '/';

  switch (notification.type) {
    case 'like':
    case 'comment':
    case 'mention':
    case 'suggestion':
      if (notification.post?._id) {
        url = `/gonderi/${notification.post._id}`;
      }
      break;

    case 'comment_reply':
    case 'comment_like':
      if (notification.comment?._id) {
        url = `/yorum/${notification.comment._id}`;
      }
      break;

    case 'follow_request':
    case 'follow_accept':
      if (notification.sender?.username) {
        url = `/profil/${notification.sender.username}`;
      }
      break;

    case 'version_update':
      url = '/surum-notlari';
      break;

    default:
      url = '/';
      break;
  }

  // Navigate to URL
  if (url) {
    window.location.href = url;
  }
};

/**
 * Check if enough time has passed since last notification
 * to prevent notification spam
 * @param {number} minInterval - Minimum interval in milliseconds (default: 3000ms = 3s)
 */
export const canShowNotification = (minInterval = 3000) => {
  const lastTime = localStorage.getItem(LAST_NOTIFICATION_TIME_KEY);
  if (!lastTime) return true;

  const now = Date.now();
  const elapsed = now - parseInt(lastTime, 10);

  return elapsed >= minInterval;
};

/**
 * Clear notification permission request flag
 * Useful for testing or resetting
 */
export const resetNotificationPermission = () => {
  localStorage.removeItem(NOTIFICATION_PERMISSION_KEY);
};
