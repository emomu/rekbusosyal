import { useState, useEffect, useRef, Suspense } from 'react';
import { Outlet, useLocation, NavLink, useNavigate, useNavigation } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { Home, MessageSquare, User, MapPin, Search, LogOut, Settings, Shield, X, Bell, Calendar } from 'lucide-react';
import Lottie from 'lottie-react';
import Snowfall from 'react-snowfall';
import XmasTree from 'react-xmas-tree/react';
import { logout } from '../store/slices/authSlice';
import { API_URL } from '../config/api';
import { sanitizeUsername } from '../utils/security';
import { api } from '../utils/apiClient';
import NotificationsPage from '../components/NotificationsPage';
import NotificationPermissionPrompt from '../components/NotificationPermissionPrompt';
import { ToastContainer } from '../components/Toast';
import CookieConsent from '../components/CookieConsent';
import { setActiveTab, setSelectedImage, removeToast } from '../store/slices/uiSlice';
import { setUnreadCount, setNotifications, setPagination } from '../store/slices/notificationsSlice';
import loaderAnimation from '../assets/loader.json';
import {
  shouldShowPermissionPrompt,
  showNotificationForAppNotification,
  canShowNotification,
} from '../utils/browserNotifications';

/**
 * AppLayout - Main application layout with fixed sidebar, mobile menu, and search panel
 * Center content area uses <Outlet /> for route-based rendering
 */
export default function AppLayout() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const navigation = useNavigation();
  const location = useLocation();
  const { userId, token, userRole } = useSelector((state) => state.auth);
  const { selectedImage, toasts } = useSelector((state) => state.ui);
  const { unreadCount } = useSelector((state) => state.notifications);

  // Check if navigation is in loading state
  const isNavigating = navigation.state === 'loading';

  // Mobile menu state
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  // Notifications state
  const [showNotifications, setShowNotifications] = useState(false);
  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const searchTimeoutRef = useRef(null);
  // Current user info for sidebar and mobile menu
  const [currentUser, setCurrentUser] = useState(null);
  const [currentUserInfo, setCurrentUserInfo] = useState(null);
  // Browser notification permission prompt
  const [showPermissionPrompt, setShowPermissionPrompt] = useState(false);
  // Previous unread count for detecting new notifications
  const previousUnreadCountRef = useRef(0);

  // Close mobile menu when route changes
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location.pathname]);

  // Sync Redux activeTab with URL (for backward compatibility during migration)
  useEffect(() => {
    const pathToTab = {
      '/': 'akis',
      '/itiraflar': 'itiraflar',
      '/kampusler': 'kampusler',
      '/topluluklar': 'topluluklar',
      '/takvim': 'takvim',
      '/ayarlar': 'profil',
      '/admin': 'admin',
      '/surum-notlari': 'versionNotes'
    };

    const tab = pathToTab[location.pathname] || 'akis';
    dispatch(setActiveTab(tab));
  }, [location.pathname, dispatch]);

  // Fetch current user info for sidebar and mobile menu
  useEffect(() => {
    if (userId && token) {
      api.get('/api/profile')
        .then(res => res.ok ? res.json() : null)
        .then(data => {
          if (data) {
            setCurrentUser(data);
            setCurrentUserInfo(data);
          }
        })
        .catch(err => {
          // apiClient will handle token expiration automatically
          console.error('Error fetching user info:', err);
        });
    }
  }, [userId, token]);

  // Show notification permission prompt after a delay
  useEffect(() => {
    // Wait 10 seconds after mount, then check if we should show prompt
    const timer = setTimeout(() => {
      if (shouldShowPermissionPrompt()) {
        setShowPermissionPrompt(true);
      }
    }, 10000); // 10 seconds delay

    return () => clearTimeout(timer);
  }, []);

  // Fetch initial notifications and poll for updates
  useEffect(() => {
    if (!token) return;

    let isFirstFetch = true;

    // Fetch notifications with count
    const fetchNotifications = async () => {
      try {
        // Fetch both notifications list and unread count
        const [notifRes, countRes] = await Promise.all([
          api.get('/api/notifications?page=1&limit=20'),
          api.get('/api/notifications/unread-count')
        ]);

        const notifData = await notifRes.json();
        const countData = await countRes.json();
        const newCount = countData.unreadCount || 0;

        // İlk fetch'te bildirimleri Redux'a yükle
        if (isFirstFetch) {
          if (notifData.notifications) {
            dispatch(setNotifications(notifData.notifications));
            dispatch(setPagination(notifData.pagination));
          }
          previousUnreadCountRef.current = newCount;
          isFirstFetch = false;
        } else {
          // Sonraki fetch'lerde: yeni bildirim varsa göster
          const previousCount = previousUnreadCountRef.current;
          console.log('🔔 Notification check:', { newCount, previousCount, canShow: canShowNotification() });

          if (newCount > previousCount && newCount > 0 && canShowNotification()) {
            console.log('✅ New notification detected!');
            // New notification detected! Show browser notification
            if (notifData.notifications && notifData.notifications.length > 0) {
              const latestNotification = notifData.notifications[0];
              console.log('📬 Latest notification:', latestNotification);
              // Show browser notification only if it's unread
              if (!latestNotification.isRead) {
                console.log('✅ Showing browser notification for unread notification');
                showNotificationForAppNotification(latestNotification);
              } else {
                console.log('⏭️ Latest notification is already read, skipping');
              }
            }
          }
          // Bildirimleri her seferinde güncelle (yeni bildirimler için)
          if (notifData.notifications) {
            dispatch(setNotifications(notifData.notifications));
            dispatch(setPagination(notifData.pagination));
          }
          previousUnreadCountRef.current = newCount;
        }

        // Her zaman unread count'u güncelle
        dispatch(setUnreadCount(newCount));
      } catch (err) {
        console.error('Error polling notifications:', err);
      }
    };

    // Fetch immediately on mount
    fetchNotifications();

    // Poll every 10 seconds
    const pollInterval = setInterval(fetchNotifications, 10000);

    return () => clearInterval(pollInterval);
  }, [token, dispatch]);

  // Handle logout
  const handleLogout = () => {
    dispatch(logout());
    navigate('/giris', { replace: true });
  };

  // Handle search with debounce
  const handleSearch = (e) => {
    const query = e.target.value;
    setSearchQuery(query);

    // Clear previous timeout
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    // Don't search if query is empty or too short
    if (!query.trim() || query.length < 1) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);

    // Debounce search - wait 500ms
    searchTimeoutRef.current = setTimeout(async () => {
      try {
        if (!token) {
          setIsSearching(false);
          return;
        }

        const res = await fetch(
          `${API_URL}/api/search/users?q=${encodeURIComponent(query)}`,
          {
            method: 'GET',
            headers: { 'Authorization': `Bearer ${token}` }
          }
        );

        if (res.ok) {
          const data = await res.json();
          setSearchResults(Array.isArray(data) ? data : []);
        } else {
          setSearchResults([]);
        }
      } catch (error) {
        console.error('Search error:', error);
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    }, 500);
  };

  // Handle search result click
  const handleSearchResultClick = (username) => {
    const sanitized = sanitizeUsername(username);
    navigate(`/kullanici/${sanitized}`);
    setSearchQuery('');
    setSearchResults([]);
  };

  // Handle image modal close with ESC key
  useEffect(() => {
    const handleEscKey = (event) => {
      if (event.key === 'Escape' && selectedImage) {
        dispatch(setSelectedImage(null));
      }
    };
    window.addEventListener('keydown', handleEscKey);
    return () => window.removeEventListener('keydown', handleEscKey);
  }, [selectedImage, dispatch]);

  return (
    <div className="h-screen bg-white text-gray-900 font-sans flex justify-center overflow-hidden relative">
      {/* SNOWFALL EFFECT */}
      <Snowfall
        color="#fef3c7"
        snowflakeCount={200}
        radius={[0.5, 3.0]}
        speed={[0.5, 2.0]}
        wind={[-0.5, 1.0]}
        style={{
          position: 'fixed',
          width: '100vw',
          height: '100vh',
          zIndex: 9999,
          pointerEvents: 'none',
          opacity: 0.9
        }}
      />

      {/* CHRISTMAS DECORATIONS */}
      <div className="fixed top-0 left-0 right-0 h-20 pointer-events-none z-50">
        {/* Christmas Lights String - SVG */}
        <svg className="w-full h-full absolute top-0" preserveAspectRatio="xMidYMin meet">
          {/* String/Wire - Starts from top edge */}
          <path
            d="M 0,0 Q 60,15 120,0 T 240,0 T 360,0 T 480,0 T 600,0 T 720,0 T 840,0 T 960,0 T 1080,0 T 1200,0 T 1320,0 T 1440,0 T 1560,0 T 1680,0 T 1800,0 T 1920,0 T 2040,0 T 2160,0 T 2280,0 T 2400,0"
            stroke="#333"
            strokeWidth="2"
            fill="none"
            opacity="0.3"
          />
        </svg>

        {/* Colorful Lights - Responsive count: Mobile(10), Tablet(20), Desktop(30) */}
        <div className="absolute top-0 left-0 right-0 flex justify-around px-2">
          {[...Array(30)].map((_, i) => {
            const colors = [
              { bg: '#ff0000', glow: 'rgba(255, 0, 0, 0.8)' },      // Red
              { bg: '#00ff00', glow: 'rgba(0, 255, 0, 0.8)' },      // Green
              { bg: '#0066ff', glow: 'rgba(0, 102, 255, 0.8)' },    // Blue
              { bg: '#ffdd00', glow: 'rgba(255, 221, 0, 0.8)' },    // Yellow
              { bg: '#ff00ff', glow: 'rgba(255, 0, 255, 0.8)' },    // Magenta
              { bg: '#ff6600', glow: 'rgba(255, 102, 0, 0.8)' },    // Orange
              { bg: '#00ffff', glow: 'rgba(0, 255, 255, 0.8)' },    // Cyan
            ];
            const color = colors[i % colors.length];

            // Mobile: show only 10 lights (every 3rd light)
            // Tablet: show 20 lights (every other light + mobile)
            // Desktop: show all 30 lights
            let displayClass = '';
            if (i % 3 === 0) {
              displayClass = ''; // Mobile: show every 3rd (10 lights)
            } else if (i % 2 === 0) {
              displayClass = 'hidden md:flex'; // Tablet+: show every 2nd (20 lights total)
            } else {
              displayClass = 'hidden lg:flex'; // Desktop only: show remaining (30 lights total)
            }

            return (
              <div
                key={i}
                className={`relative flex-col items-center ${displayClass}`}
                style={{
                  animation: `twinkle ${3 + (i % 3) * 1}s ease-in-out infinite`,
                  animationDelay: `${i * 0.15}s`
                }}
              >
                {/* Wire connection from top */}
                <div
                  className="w-0.5 bg-gray-700 opacity-40"
                  style={{
                    height: `${Math.sin(i * 0.6) * 3 + 6}px`
                  }}
                />

                {/* LED Light - Modern flat design */}
                <div
                  className="w-2 h-3 rounded-sm relative overflow-hidden"
                  style={{
                    backgroundColor: color.bg,
                    boxShadow: `0 0 12px ${color.glow}, 0 0 20px ${color.glow}, 0 0 25px ${color.glow}`,
                    border: `1px solid ${color.bg}`,
                  }}
                >
                  {/* LED shine effect - diagonal gradient */}
                  <div
                    className="absolute inset-0"
                    style={{
                      background: `linear-gradient(135deg, rgba(255,255,255,0.6) 0%, transparent 50%)`,
                    }}
                  />
                  {/* LED bottom connector */}
                  <div className="absolute -bottom-0.5 left-0 right-0 h-0.5 bg-gray-800 rounded-b" />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* CSS Animations for Christmas decorations */}
      <style>{`
        @keyframes twinkle {
          0%, 100% {
            opacity: 1;
            transform: scale(1);
          }
          50% {
            opacity: 0.3;
            transform: scale(0.95);
          }
        }

        @keyframes gentle-bounce {
          0%, 100% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(-10px);
          }
        }

        @keyframes spin-slow {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }

        .animate-gentle-bounce {
          animation: gentle-bounce 3s ease-in-out infinite;
        }

        .animate-spin-slow {
          animation: spin-slow 4s linear infinite;
        }

        /* XmasTree z-index override - bildirimlerinin arkasında kalması için */
        .tree-container {
          z-index: 10 !important;
        }
      `}</style>

      {/* Christmas Tree - Using react-xmas-tree */}
      <div className="hidden lg:block" style={{ zIndex: 10 }}>
        <XmasTree
          containerClass="!fixed !bottom-5 !right-30 !left-auto"
          lightColors={['#004400ff', '#004400ff', '#004400ff', '#007000ff', '#007500ff']}
          starColor="#ffd700"
        />
      </div>

      {/* Mobile Christmas Tree - REMOVED */}

      {/* LEFT SIDEBAR - Fixed on desktop, hidden on mobile */}
      <aside className="w-64 hidden md:flex flex-col h-full border-r border-gray-200 p-6 flex-shrink-0 relative bg-white">
        <h1 className="text-2xl font-bold tracking-tighter mb-8 text-blue-900">
          KBÜ<span className="text-red-600">Sosyal</span>.
        </h1>

        <nav className="space-y-2">
          <NavLink
            to="/"
            className={({ isActive }) =>
              `flex items-center gap-3 p-3 rounded-lg transition ${
                isActive
                  ? 'bg-blue-900 text-white font-semibold'
                  : 'hover:bg-gray-100 text-gray-700'
              }`
            }
          >
            <Home size={22} />
            <span>Akış</span>
          </NavLink>

          <NavLink
            to="/kampusler"
            className={({ isActive }) =>
              `flex items-center gap-3 p-3 rounded-lg transition ${
                isActive
                  ? 'bg-blue-900 text-white font-semibold'
                  : 'hover:bg-gray-100 text-gray-700'
              }`
            }
          >
            <MapPin size={22} />
            <span>Kampüsler</span>
          </NavLink>

          <NavLink
            to="/itiraflar"
            className={({ isActive }) =>
              `flex items-center gap-3 p-3 rounded-lg transition ${
                isActive
                  ? 'bg-blue-900 text-white font-semibold'
                  : 'hover:bg-gray-100 text-gray-700'
              }`
            }
          >
            <MessageSquare size={22} />
            <span>İtiraflar</span>
          </NavLink>

          <NavLink
            to="/topluluklar"
            className={({ isActive }) =>
              `flex items-center gap-3 p-3 rounded-lg transition ${
                isActive
                  ? 'bg-blue-900 text-white font-semibold'
                  : 'hover:bg-gray-100 text-gray-700'
              }`
            }
          >
            <User size={22} />
            <span>Topluluklar</span>
          </NavLink>

          <NavLink
            to="/takvim"
            className={({ isActive }) =>
              `flex items-center gap-3 p-3 rounded-lg transition ${
                isActive
                  ? 'bg-blue-900 text-white font-semibold'
                  : 'hover:bg-gray-100 text-gray-700'
              }`
            }
          >
            <Calendar size={22} />
            <span>Takvim</span>
          </NavLink>

          <NavLink
            to="/ayarlar"
            className={({ isActive }) =>
              `flex items-center gap-3 p-3 rounded-lg transition ${
                isActive
                  ? 'bg-blue-900 text-white font-semibold'
                  : 'hover:bg-gray-100 text-gray-700'
              }`
            }
          >
            <Settings size={22} />
            <span>Ayarlar</span>
          </NavLink>

          {(userRole === 'club_manager' || userRole === 'admin') && (
            <NavLink
              to="/club-panel"
              className={({ isActive }) =>
                `flex items-center gap-3 p-3 rounded-lg transition ${
                  isActive
                    ? 'bg-blue-900 text-white font-semibold'
                    : 'hover:bg-gray-100 text-gray-700'
                }`
              }
            >
              <User size={22} />
              <span>Kulüp Paneli</span>
            </NavLink>
          )}

          {(userRole === 'admin' || userRole === 'moderator') && (
            <NavLink
              to="/admin"
              className={({ isActive }) =>
                `flex items-center gap-3 p-3 rounded-lg transition ${
                  isActive
                    ? 'bg-blue-900 text-white font-semibold'
                    : 'hover:bg-gray-100 text-gray-700'
                }`
              }
            >
              <Shield size={22} />
              <span>Admin Panel</span>
            </NavLink>
          )}
        </nav>

        {/* Profile Card & Actions */}
        <div className="mt-auto pt-4 border-t border-gray-200">
          {/* User Profile Card */}
          <div
            onClick={() => navigate(`/kullanici/${currentUser?.username || 'me'}`)}
            className="flex items-center gap-3 mb-3 cursor-pointer transition-opacity hover:opacity-80 p-2 rounded-lg hover:bg-gray-50"
          >
            {currentUser?.profilePicture ? (
              <img
                src={currentUser.profilePicture}
                alt="Profil"
                className="w-10 h-10 rounded-full object-cover border border-gray-200"
              />
            ) : (
              <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center border border-gray-200">
                <User size={20} className="text-gray-400" />
              </div>
            )}
            <div className="flex flex-col flex-1 min-w-0">
              <span className="font-bold text-sm text-gray-900 truncate">
                {currentUser?.fullName || 'Kullanıcı'}
              </span>
              <span className="text-xs text-gray-500 truncate">
                @{currentUser?.username || 'kullanici'}
              </span>
            </div>
            {/* Notifications Icon */}
            <div
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setShowNotifications(true);
              }}
              className="relative p-2 hover:bg-gray-200 rounded-lg transition cursor-pointer flex justify-center"
            >
              <Bell size={22} className="text-gray-700" />
              {unreadCount > 0 && (
                <span className="absolute top-0 right-0 bg-red-500 text-white text-[10px] font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1">
                  {unreadCount > 99 ? '99+' : unreadCount}
                </span>
              )}
            </div>
          </div>

          {/* Logout Button */}
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 p-3 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 transition font-medium"
          >
            <LogOut size={22} />
            <span>Çıkış Yap</span>
          </button>
          <div className="pt-2 text-xs text-gray-400">© 2025 KBÜ Sosyal</div>
        </div>
      </aside>

      {/* MOBILE SLIDE-IN MENU */}
      {isMobileMenuOpen && (
        <>
          {/* Backdrop */}
          <div
            className="md:hidden fixed inset-0 bg-black/50 z-40 animate-fade-in"
            onClick={() => setIsMobileMenuOpen(false)}
          />

          {/* Menu Panel */}
          <div className="md:hidden fixed top-0 right-0 bottom-0 w-80 bg-white z-50 shadow-2xl animate-slide-in-right overflow-y-auto">
            {/* Menu Header */}
            <div className="sticky top-0 bg-white/95 backdrop-blur border-b border-gray-200 p-4 flex items-center justify-between">
              <h2 className="text-lg font-bold text-gray-900">Menü</h2>
              <button
                onClick={() => setIsMobileMenuOpen(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition"
              >
                <X size={24} className="text-gray-700" />
              </button>
            </div>

            {/* User Profile Section */}
            {currentUserInfo && (
              <div
                onClick={() => navigate(`/kullanici/${currentUserInfo.username}`)}
                className="flex items-center gap-3 cursor-pointer hover:bg-gray-50 p-3 rounded-lg transition"
              >
                {currentUserInfo.profilePicture ? (
                  <img
                    src={currentUserInfo.profilePicture}
                    alt={currentUserInfo.username}
                    className="w-12 h-12 rounded-full object-cover border-2 border-blue-500"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center border-2 border-blue-500">
                    <User size={24} className="text-gray-500" />
                  </div>
                )}
                <div className="flex-1">
                  <div className="font-bold text-gray-900">{currentUserInfo.fullName}</div>
                  <div className="text-sm text-gray-500">@{currentUserInfo.username}</div>
                </div>
              </div>
            )}

            {/* Search Section */}
            <div className="p-4 border-b border-gray-100">
              <div className="relative">
                <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Kullanıcı ara..."
                  value={searchQuery}
                  onChange={handleSearch}
                  className="w-full pl-10 pr-4 py-2 bg-gray-100 rounded-full text-sm focus:outline-none focus:bg-white focus:ring-2 focus:ring-blue-500 transition"
                />

                {/* Search Results Dropdown */}
                {(searchResults.length > 0 || isSearching) && (
                  <div className="absolute top-full mt-2 w-full bg-white rounded-lg shadow-lg border border-gray-200 max-h-80 overflow-y-auto z-50">
                    {isSearching ? (
                      <div className="p-4 text-center text-gray-500 text-sm">
                        Aranıyor...
                      </div>
                    ) : (
                      searchResults.map((user) => (
                        <div
                          key={user._id}
                          onClick={() => {
                            handleSearchResultClick(user.username);
                            setIsMobileMenuOpen(false);
                          }}
                          className="p-3 hover:bg-gray-50 cursor-pointer flex items-center gap-3 transition"
                        >
                          {user.profilePicture ? (
                            <img
                              src={user.profilePicture}
                              alt={user.username}
                              className="w-10 h-10 rounded-full object-cover border border-gray-200"
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center border border-gray-300">
                              <User size={20} className="text-gray-500" />
                            </div>
                          )}
                          <div className="flex-1">
                            <div className="font-semibold text-gray-900 text-sm">{user.fullName}</div>
                            <span className="text-xs text-gray-500">@{user.username}</span>
                          </div>
                        </div>
                      ))
                    )}
                    {!isSearching && searchResults.length === 0 && searchQuery.length >= 2 && (
                      <div className="p-4 text-center text-gray-500 text-sm">
                        Sonuç bulunamadı.
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Navigation Links */}
            <nav className="p-4 space-y-2">
              <NavLink
                to="/"
                className={({ isActive }) =>
                  `w-full flex items-center gap-3 p-3 rounded-lg transition ${
                    isActive ? 'bg-blue-900 text-white' : 'hover:bg-gray-100 text-gray-700'
                  }`
                }
              >
                <Home size={22} />
                <span>Akış</span>
              </NavLink>

              <NavLink
                to="/kampusler"
                className={({ isActive }) =>
                  `w-full flex items-center gap-3 p-3 rounded-lg transition ${
                    isActive ? 'bg-blue-900 text-white' : 'hover:bg-gray-100 text-gray-700'
                  }`
                }
              >
                <MapPin size={22} />
                <span>Kampüsler</span>
              </NavLink>

              <NavLink
                to="/itiraflar"
                className={({ isActive }) =>
                  `w-full flex items-center gap-3 p-3 rounded-lg transition ${
                    isActive ? 'bg-blue-900 text-white' : 'hover:bg-gray-100 text-gray-700'
                  }`
                }
              >
                <MessageSquare size={22} />
                <span>İtiraflar</span>
              </NavLink>

              <NavLink
                to="/topluluklar"
                className={({ isActive }) =>
                  `w-full flex items-center gap-3 p-3 rounded-lg transition ${
                    isActive ? 'bg-blue-900 text-white' : 'hover:bg-gray-100 text-gray-700'
                  }`
                }
              >
                <User size={22} />
                <span>Topluluklar</span>
              </NavLink>

              <NavLink
                to="/takvim"
                className={({ isActive }) =>
                  `w-full flex items-center gap-3 p-3 rounded-lg transition ${
                    isActive ? 'bg-blue-900 text-white' : 'hover:bg-gray-100 text-gray-700'
                  }`
                }
              >
                <Calendar size={22} />
                <span>Takvim</span>
              </NavLink>

              <NavLink
                to="/ayarlar"
                className={({ isActive }) =>
                  `w-full flex items-center gap-3 p-3 rounded-lg transition ${
                    isActive ? 'bg-blue-900 text-white' : 'hover:bg-gray-100 text-gray-700'
                  }`
                }
              >
                <Settings size={22} />
                <span>Ayarlar</span>
              </NavLink>

              {(userRole === 'club_manager' || userRole === 'admin') && (
                <NavLink
                  to="/club-panel"
                  className={({ isActive }) =>
                    `w-full flex items-center gap-3 p-3 rounded-lg transition ${
                      isActive ? 'bg-blue-900 text-white' : 'hover:bg-gray-100 text-gray-700'
                    }`
                  }
                >
                  <User size={22} />
                  <span>Kulüp Paneli</span>
                </NavLink>
              )}

              {(userRole === 'admin' || userRole === 'moderator') && (
                <NavLink
                  to="/admin"
                  className={({ isActive }) =>
                    `w-full flex items-center gap-3 p-3 rounded-lg transition ${
                      isActive ? 'bg-blue-900 text-white' : 'hover:bg-gray-100 text-gray-700'
                    }`
                  }
                >
                  <Shield size={22} />
                  <span>Admin Panel</span>
                </NavLink>
              )}
            </nav>

            {/* Logout Button */}
            <div className="p-4 mt-auto border-t border-gray-100">
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-3 p-3 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 transition font-medium"
              >
                <LogOut size={22} />
                <span>Çıkış Yap</span>
              </button>
            </div>
          </div>
        </>
      )}

      {/* CENTER CONTENT AREA - Scrollable, changes with routes */}
      <main className="flex-1 max-w-2xl w-full border-r border-gray-200 h-full overflow-y-auto relative flex-shrink-0">
        {/* Global Navigation Loading Bar */}
        {isNavigating && (
          <div className="absolute top-0 left-0 right-0 z-50 h-1 bg-blue-100 overflow-hidden">
            <div className="h-full w-1/3 bg-gradient-to-r from-transparent via-blue-600 to-transparent animate-progress" />
          </div>
        )}

        {/* Render routes here */}
        <Suspense fallback={
          <div className="flex items-center justify-center h-screen">
            <div className="w-32 h-32">
              <Lottie animationData={loaderAnimation} loop={true} />
            </div>
          </div>
        }>
          <Outlet context={{ setIsMobileMenuOpen, setShowNotifications, unreadCount }} />
        </Suspense>
      </main>

      {/* RIGHT SEARCH PANEL - Fixed on large screens only */}
      <aside className="w-80 hidden lg:block p-6 h-full overflow-y-auto flex-shrink-0 relative bg-white">
        <div className="relative mb-6">
          <Search className="absolute left-3 top-3 text-gray-400" size={18} />
          <input
            type="text"
            placeholder="Ara..."
            className="w-full bg-gray-100 p-2.5 pl-10 rounded-full text-sm outline-none focus:ring-2 focus:ring-red-100"
            value={searchQuery}
            onChange={handleSearch}
          />

          {/* Search Results Dropdown */}
          {(searchResults.length > 0 || isSearching) && (
            <div className="absolute top-full mt-2 w-full bg-white rounded-lg shadow-lg border border-gray-200 max-h-96 overflow-y-auto z-50">
              {isSearching ? (
                <div className="p-4 text-center text-gray-500 text-sm">
                  Aranıyor...
                </div>
              ) : (
                searchResults.map((user) => (
                  <div
                    key={user._id}
                    onClick={() => handleSearchResultClick(user.username)}
                    className="p-3 hover:bg-gray-50 cursor-pointer flex items-center gap-3 transition"
                  >
                    {user.profilePicture ? (
                      <img
                        src={user.profilePicture}
                        alt={user.username}
                        className="w-10 h-10 rounded-full object-cover border border-gray-200"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center border border-gray-300">
                        <User size={20} className="text-gray-500" />
                      </div>
                    )}
                    <div className="flex-1">
                      <div className="font-semibold text-gray-900 text-sm">{user.fullName}</div>
                      <span className="text-xs text-gray-500">@{user.username}</span>
                    </div>
                  </div>
                ))
              )}
              {!isSearching && searchResults.length === 0 && searchQuery.length >= 2 && (
                <div className="p-4 text-center text-gray-500 text-sm">
                  Sonuç bulunamadı.
                </div>
              )}
            </div>
          )}
        </div>
      </aside>

      {/* NOTIFICATIONS OVERLAY */}
      {showNotifications && (
        <NotificationsPage
          onClose={() => setShowNotifications(false)}
          onNavigateToProfile={(username) => {
            navigate(`/profil/${username}`);
            setShowNotifications(false);
          }}
          onNavigateToPost={(postId) => {
            navigate(`/gonderi/${postId}`);
            setShowNotifications(false);
          }}
          onNavigateToComment={(commentId) => {
            navigate(`/yorum/${commentId}`);
            setShowNotifications(false);
          }}
          onNavigateToVersionNotes={() => {
            navigate('/surum-notlari');
            setShowNotifications(false);
          }}
        />
      )}

      {/* NOTIFICATION PERMISSION PROMPT */}
      {showPermissionPrompt && (
        <NotificationPermissionPrompt
          onClose={() => setShowPermissionPrompt(false)}
          onAccept={() => {
            console.log('✅ Browser notifications enabled!');
          }}
        />
      )}

      {/* IMAGE LIGHTBOX MODAL */}
      {selectedImage && (
        <div
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
          onClick={() => dispatch(setSelectedImage(null))}
        >
          <div className="relative max-w-4xl max-h-full">
            <button
              onClick={() => dispatch(setSelectedImage(null))}
              className="absolute -top-12 right-0 text-white hover:text-gray-300 transition"
            >
              <X size={32} />
            </button>
            <img
              src={selectedImage}
              alt="Enlarged"
              className="max-w-full max-h-[90vh] object-contain rounded-lg"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        </div>
      )}

      {/* TOAST NOTIFICATIONS */}
      <ToastContainer toasts={toasts} removeToast={(id) => dispatch(removeToast(id))} />

      {/* COOKIE CONSENT */}
      <CookieConsent />
    </div>
  );
}
