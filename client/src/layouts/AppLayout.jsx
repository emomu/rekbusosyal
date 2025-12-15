import { useState, useEffect, useRef, Suspense } from 'react';
import { Outlet, useLocation, NavLink, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { Home, MessageSquare, User, MapPin, Search, LogOut, Settings, Shield, X, Bell } from 'lucide-react';
import Lottie from 'lottie-react';
import { logout } from '../store/slices/authSlice';
import { API_URL } from '../config/api';
import { sanitizeUsername } from '../utils/security';
import MobileHeader from '../components/MobileHeader';
import NotificationsPage from '../components/NotificationsPage';
import { ToastContainer } from '../components/Toast';
import { useToast } from '../hooks/useToast';
import CookieConsent from '../components/CookieConsent';
import { setActiveTab, setSelectedImage } from '../store/slices/uiSlice';
import { setUnreadCount } from '../store/slices/notificationsSlice';
import loaderAnimation from '../assets/loader.json';

/**
 * AppLayout - Main application layout with fixed sidebar, mobile menu, and search panel
 * Center content area uses <Outlet /> for route-based rendering
 */
export default function AppLayout() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const toast = useToast();
  const { userId, token, userRole } = useSelector((state) => state.auth);
  const { selectedImage } = useSelector((state) => state.ui);
  const { unreadCount } = useSelector((state) => state.notifications);

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
      fetch(`${API_URL}/api/profile`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
        .then(res => res.ok ? res.json() : null)
        .then(data => {
          if (data) {
            setCurrentUser(data);
            setCurrentUserInfo(data);
          }
        })
        .catch(err => console.error('Error fetching user info:', err));
    }
  }, [userId, token]);

  // Fetch unread notifications count
  useEffect(() => {
    if (token) {
      fetch(`${API_URL}/api/notifications/unread-count`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
        .then(res => res.json())
        .then(data => dispatch(setUnreadCount(data.count)))
        .catch(() => dispatch(setUnreadCount(0)));
    }
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
    <div className="min-h-screen bg-white text-gray-900 font-sans flex justify-center">
      {/* LEFT SIDEBAR - Fixed on desktop, hidden on mobile */}
      <aside className="w-64 hidden md:flex flex-col h-screen sticky top-0 border-r border-gray-200 p-6">
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
            <div className="sticky top-0 bg-white border-b border-gray-200 p-4 flex items-center justify-between">
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
                <img
                  src={currentUserInfo.profilePicture || 'https://via.placeholder.com/150'}
                  alt={currentUserInfo.username}
                  className="w-12 h-12 rounded-full object-cover border-2 border-blue-500"
                />
                <div className="flex-1">
                  <div className="font-bold text-gray-900">{currentUserInfo.fullName}</div>
                  <div className="text-sm text-gray-500">@{currentUserInfo.username}</div>
                </div>
              </div>
            )}

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
      <main className="flex-1 max-w-2xl w-full border-r border-gray-200 min-h-screen overflow-y-auto">
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
      <aside className="w-80 hidden lg:block p-6 sticky top-0 h-screen">
        <div className="relative mb-6">
          <Search className="absolute left-3 top-3 text-gray-400" size={18} />
          <input
            type="text"
            placeholder="Ara..."
            className="w-full bg-gray-100 p-2.5 pl-10 rounded-full text-sm outline-none focus:ring-2 focus:ring-blue-100"
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
                    <img
                      src={user.profilePicture || 'https://via.placeholder.com/150'}
                      alt={user.username}
                      className="w-10 h-10 rounded-full object-cover border border-gray-200"
                    />
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
        <NotificationsPage onClose={() => setShowNotifications(false)} />
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
      <ToastContainer toasts={toast.toasts} removeToast={toast.removeToast} />

      {/* COOKIE CONSENT */}
      <CookieConsent />
    </div>
  );
}
