import { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { Users, Calendar, PlusCircle, Trash2, Eye, UserPlus, Menu, X, ArrowLeft, Shield } from 'lucide-react';
import { api } from '../utils/apiClient';
import LoadingShimmer from '../components/LoadingShimmer';
import { useNavigate } from 'react-router-dom';

export default function ClubManagerPanel() {
  const navigate = useNavigate();
  const { userId, userRole } = useSelector((state) => state.auth);
  const [managedCommunity, setManagedCommunity] = useState(null);
  const [announcementAccount, setAnnouncementAccount] = useState(null);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview'); // 'overview' | 'events' | 'announcement'
  const [showMobileMenu, setShowMobileMenu] = useState(false);

  // Create Event Modal State
  const [showCreateEventModal, setShowCreateEventModal] = useState(false);
  const [eventForm, setEventForm] = useState({
    title: '',
    description: '',
    startDate: '',
    endDate: '',
    location: '',
    category: 'Sosyal',
    imageUrl: ''
  });

  // Create Announcement Account Modal State
  const [showCreateAccountModal, setShowCreateAccountModal] = useState(false);
  const [accountForm, setAccountForm] = useState({
    username: '',
    password: ''
  });

  // Create Community Modal State
  const [showCreateCommunityModal, setShowCreateCommunityModal] = useState(false);
  const [communityForm, setCommunityForm] = useState({
    name: '',
    description: '',
    category: 'Sosyal',
    imageUrl: ''
  });

  useEffect(() => {
    if (userRole !== 'club_manager' && userRole !== 'admin') {
      return;
    }
    fetchManagedCommunity();
  }, [userId, userRole]);

  useEffect(() => {
    if (managedCommunity) {
      fetchCommunityEvents();
      fetchAnnouncementAccount();
    }
  }, [managedCommunity]);

  const fetchManagedCommunity = async () => {
    try {
      setLoading(true);
      const res = await api.get('/api/communities');
      if (res.ok) {
        const data = await res.json();
        // communities array veya direkt object olabilir
        const communitiesArray = Array.isArray(data) ? data : (data.communities || []);
        const community = communitiesArray.find(c => c.manager?._id === userId || c.manager === userId);
        setManagedCommunity(community || null);
      }
    } catch (error) {
      console.error('Error fetching managed community:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCommunityEvents = async () => {
    try {
      const res = await api.get(`/api/events?communityId=${managedCommunity._id}`);
      if (res.ok) {
        const data = await res.json();
        setEvents(data.events || []);
      }
    } catch (error) {
      console.error('Error fetching events:', error);
    }
  };

  const fetchAnnouncementAccount = async () => {
    try {
      const res = await api.get(`/api/communities/${managedCommunity._id}/announcement-account`);
      if (res.ok) {
        const data = await res.json();
        setAnnouncementAccount(data);
      } else {
        setAnnouncementAccount(null);
      }
    } catch (error) {
      console.error('Error fetching announcement account:', error);
      setAnnouncementAccount(null);
    }
  };

  const handleCreateEvent = async (e) => {
    e.preventDefault();
    try {
      const res = await api.post('/api/events', {
        ...eventForm,
        communityId: managedCommunity._id
      });

      if (res.ok) {
        const newEvent = await res.json();
        setEvents([newEvent, ...events]);
        setShowCreateEventModal(false);
        setEventForm({
          title: '',
          description: '',
          startDate: '',
          endDate: '',
          location: '',
          category: 'Sosyal',
          imageUrl: ''
        });
        alert('Etkinlik başarıyla oluşturuldu!');
      } else {
        const error = await res.json();
        alert(error.error || 'Etkinlik oluşturulamadı');
      }
    } catch (error) {
      console.error('Error creating event:', error);
      alert('Etkinlik oluşturulurken bir hata oluştu');
    }
  };

  const handleDeleteEvent = async (eventId) => {
    if (!confirm('Bu etkinliği silmek istediğinizden emin misiniz?')) return;

    try {
      const res = await api.delete(`/api/events/${eventId}`);
      if (res.ok) {
        setEvents(events.filter(e => e._id !== eventId));
        alert('Etkinlik silindi');
      }
    } catch (error) {
      console.error('Error deleting event:', error);
      alert('Etkinlik silinirken bir hata oluştu');
    }
  };

  const handleCreateCommunity = async (e) => {
    e.preventDefault();
    try {
      const res = await api.post('/api/communities/create', communityForm);

      if (res.ok) {
        const newCommunity = await res.json();
        setManagedCommunity(newCommunity);
        setShowCreateCommunityModal(false);
        setCommunityForm({
          name: '',
          description: '',
          category: 'Sosyal',
          imageUrl: ''
        });
        alert('Kulüp başarıyla oluşturuldu!');
      } else {
        const error = await res.json();
        alert(error.error || 'Kulüp oluşturulamadı');
      }
    } catch (error) {
      console.error('Error creating community:', error);
      alert('Kulüp oluşturulurken bir hata oluştu');
    }
  };

  const handleCreateAnnouncementAccount = async (e) => {
    e.preventDefault();
    try {
      const res = await api.post(`/api/communities/${managedCommunity._id}/create-announcement-account`, accountForm);

      if (res.ok) {
        const data = await res.json();
        setAnnouncementAccount(data.account);
        setShowCreateAccountModal(false);
        setAccountForm({ username: '', password: '' });
        alert('Announcement hesabı oluşturuldu!');
      } else {
        const error = await res.json();
        alert(error.error || 'Hesap oluşturulamadı');
      }
    } catch (error) {
      console.error('Error creating announcement account:', error);
      alert('Hesap oluşturulurken bir hata oluştu');
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('tr-TR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <>
      {loading && (
        <div className="min-h-screen bg-white p-4">
          <LoadingShimmer height="100px" />
          <div className="mt-4 space-y-4">
            {[1, 2, 3].map(i => <LoadingShimmer key={i} height="150px" />)}
          </div>
        </div>
      )}

      {!loading && (userRole === 'club_manager' || userRole === 'admin') && !managedCommunity && (
        <div className="min-h-screen bg-white flex items-center justify-center p-4">
          <div className="text-center max-w-md">
            <Users size={64} className="mx-auto text-gray-300 mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Henüz Kulüp Yönetmiyorsunuz</h2>
            <p className="text-gray-600 mb-6">Kulüp yöneticisi olarak bir kulüp oluşturabilirsiniz.</p>
            <button
              onClick={() => setShowCreateCommunityModal(true)}
              className="bg-blue-900 text-white px-6 py-3 rounded-lg hover:bg-blue-800 transition font-medium flex items-center gap-2 mx-auto"
            >
              <PlusCircle size={20} />
              Kulüp Oluştur
            </button>
          </div>
        </div>
      )}

      {!loading && (userRole === 'club_manager' || userRole === 'admin') && managedCommunity && (
    <div className="flex h-screen bg-gray-50">
      {/* Mobil Overlay */}
      {showMobileMenu && (
        <div
          className="fixed inset-0 bg-black/30 backdrop-blur-sm z-40 md:hidden"
          onClick={() => setShowMobileMenu(false)}
        />
      )}

      {/* Sol Panel */}
      <aside className={`
        fixed md:static inset-y-0 left-0 z-50
        w-64 bg-white border-r border-gray-200 p-6
        transform transition-transform duration-300 ease-in-out
        ${showMobileMenu ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
      `}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            {managedCommunity.imageUrl ? (
              <img
                src={managedCommunity.imageUrl}
                alt={managedCommunity.name}
                className="w-8 h-8 rounded-full object-cover"
              />
            ) : (
              <Users size={24} className="text-blue-600" />
            )}
            <h1 className="text-lg font-bold text-gray-900 truncate">{managedCommunity.name}</h1>
          </div>
          <button
            onClick={() => setShowMobileMenu(false)}
            className="md:hidden text-gray-500 hover:text-gray-700"
          >
            <X size={24} />
          </button>
        </div>

        <button
          onClick={() => navigate('/')}
          className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 mb-6 transition-colors"
        >
          <ArrowLeft size={16} />
          <span>Ana Sayfaya Dön</span>
        </button>

        {/* Stats */}
        <div className="space-y-3 mb-6 pb-6 border-b border-gray-200">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">Üye Sayısı</span>
            <span className="font-bold text-gray-900">{managedCommunity.members?.length || 0}</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">Etkinlik</span>
            <span className="font-bold text-gray-900">{events.length}</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">Duyuru Hesabı</span>
            <span className="font-bold text-gray-900">{announcementAccount ? '✓' : '✗'}</span>
          </div>
        </div>

        <nav className="space-y-2">
          <button
            onClick={() => setActiveTab('overview')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
              activeTab === 'overview'
                ? 'bg-blue-50 text-blue-900 font-medium'
                : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            <Shield size={20} />
            <span>Genel Bakış</span>
          </button>
          <button
            onClick={() => setActiveTab('events')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
              activeTab === 'events'
                ? 'bg-blue-50 text-blue-900 font-medium'
                : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            <Calendar size={20} />
            <span>Etkinlikler</span>
            <span className="ml-auto bg-gray-200 text-gray-700 text-xs px-2 py-1 rounded-full">{events.length}</span>
          </button>
          <button
            onClick={() => setActiveTab('announcement')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
              activeTab === 'announcement'
                ? 'bg-blue-50 text-blue-900 font-medium'
                : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            <UserPlus size={20} />
            <span>Duyuru Hesabı</span>
          </button>
        </nav>
      </aside>

      {/* Ana İçerik */}
      <main className="flex-1 overflow-y-auto w-full md:w-auto">
        <header className="bg-white border-b border-gray-200 p-4 md:p-6 sticky top-0 z-30">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowMobileMenu(true)}
                className="md:hidden text-gray-700 hover:text-gray-900"
              >
                <Menu size={24} />
              </button>
              <h2 className="text-lg md:text-2xl font-bold text-gray-900 truncate">
                {activeTab === 'overview' && 'Genel Bakış'}
                {activeTab === 'events' && 'Etkinlikler'}
                {activeTab === 'announcement' && 'Duyuru Hesabı'}
              </h2>
            </div>
            {activeTab === 'events' && (
              <button
                onClick={() => setShowCreateEventModal(true)}
                className="flex items-center gap-2 bg-blue-900 text-white px-4 py-2 rounded-lg hover:bg-blue-800 transition text-sm md:text-base"
              >
                <PlusCircle size={20} />
                <span className="hidden md:inline">Yeni Etkinlik</span>
              </button>
            )}
          </div>
        </header>

        {/* Content */}
        <div className="p-4 md:p-6">
        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-2">Hoş Geldiniz!</h2>
              <p className="text-gray-600">
                {managedCommunity.name} kulübü yönetim panelindesiniz. Buradan etkinliklerinizi yönetebilir
                ve duyuru hesabınızı oluşturabilirsiniz.
              </p>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <div className="bg-white rounded-xl shadow-sm p-6 border-l-4 border-blue-500">
                <div className="flex items-center gap-3">
                  <div className="bg-blue-50 p-3 rounded-lg">
                    <Users size={24} className="text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Toplam Üye</p>
                    <p className="text-2xl font-bold text-gray-900">{managedCommunity.members?.length || 0}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-sm p-6 border-l-4 border-green-500">
                <div className="flex items-center gap-3">
                  <div className="bg-green-50 p-3 rounded-lg">
                    <Calendar size={24} className="text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Etkinlikler</p>
                    <p className="text-2xl font-bold text-gray-900">{events.length}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-sm p-6 border-l-4 border-purple-500">
                <div className="flex items-center gap-3">
                  <div className="bg-purple-50 p-3 rounded-lg">
                    <UserPlus size={24} className="text-purple-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Duyuru Hesabı</p>
                    <p className="text-2xl font-bold text-gray-900">{announcementAccount ? '✓' : '✗'}</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm p-6">
              <h3 className="font-bold text-gray-900 mb-4 text-lg">Kulüp Bilgileri</h3>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Kategori</p>
                  <p className="font-medium text-gray-900">{managedCommunity.category}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 mb-1">Açıklama</p>
                  <p className="font-medium text-gray-900">{managedCommunity.description || 'Açıklama yok'}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Events Tab */}
        {activeTab === 'events' && (
          <div>
            {events.length === 0 ? (
              <div className="text-center py-12 bg-white rounded-xl shadow-sm">
                <Calendar size={64} className="mx-auto text-gray-300 mb-4" />
                <h3 className="text-lg font-semibold text-gray-700 mb-2">Henüz Etkinlik Yok</h3>
                <p className="text-gray-500 mb-4">İlk etkinliğinizi oluşturun!</p>
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2">
                {events.map(event => (
                  <div key={event._id} className="bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition">
                    <div className="flex justify-between items-start mb-3">
                      <h3 className="font-bold text-gray-900 text-lg">{event.title}</h3>
                      <button
                        onClick={() => handleDeleteEvent(event._id)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                    {event.description && <p className="text-sm text-gray-600 mb-4">{event.description}</p>}
                    <div className="space-y-2 text-sm text-gray-600">
                      <div className="flex items-center gap-2">
                        <Calendar size={16} className="text-gray-400" />
                        <span>{formatDate(event.startDate)}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Calendar size={16} className="text-gray-400" />
                        <span>{formatDate(event.endDate)}</span>
                      </div>
                      {event.location && (
                        <div className="flex items-center gap-2">
                          <Eye size={16} className="text-gray-400" />
                          <span>{event.location}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-2 pt-2 border-t border-gray-200">
                        <Users size={16} className="text-blue-600" />
                        <span className="font-medium text-blue-900">{event.attendees?.length || 0} katılımcı</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Announcement Tab */}
        {activeTab === 'announcement' && (
          <div>
            {announcementAccount ? (
              <div className="bg-white rounded-xl shadow-sm p-6">
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center">
                    <UserPlus size={32} className="text-white" />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900 text-lg">{announcementAccount.fullName}</h3>
                    <p className="text-sm text-gray-500">@{announcementAccount.username}</p>
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <p className="text-sm text-blue-900">
                      <strong>ℹ️ Bilgi:</strong> Bu hesap kulübünüzün resmi duyuru hesabıdır. Sadece post atma yetkisine sahiptir.
                    </p>
                  </div>
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <p className="text-sm text-green-900">
                      <strong>✓ Aktif:</strong> Bu hesaba giriş yapmak için kullanıcı adı ve şifrenizi kullanabilirsiniz.
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-12 bg-white rounded-xl shadow-sm">
                <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <UserPlus size={48} className="text-gray-400" />
                </div>
                <h3 className="text-lg font-semibold text-gray-700 mb-2">Duyuru Hesabı Yok</h3>
                <p className="text-gray-500 mb-6">Kulübünüz için bir duyuru hesabı oluşturun</p>
                <button
                  onClick={() => setShowCreateAccountModal(true)}
                  className="bg-blue-900 text-white px-6 py-3 rounded-lg hover:bg-blue-800 transition font-medium"
                >
                  Hesap Oluştur
                </button>
              </div>
            )}
          </div>
        )}
        </div>
      </main>
    </div>
      )}

      {/* Create Event Modal */}
      {showCreateEventModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6 max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Yeni Etkinlik Oluştur</h2>
            <form onSubmit={handleCreateEvent} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Başlık</label>
                <input
                  type="text"
                  required
                  value={eventForm.title}
                  onChange={(e) => setEventForm({ ...eventForm, title: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Açıklama</label>
                <textarea
                  value={eventForm.description}
                  onChange={(e) => setEventForm({ ...eventForm, description: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                  rows="3"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Başlangıç Tarihi</label>
                <input
                  type="datetime-local"
                  required
                  value={eventForm.startDate}
                  onChange={(e) => setEventForm({ ...eventForm, startDate: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Bitiş Tarihi</label>
                <input
                  type="datetime-local"
                  required
                  value={eventForm.endDate}
                  onChange={(e) => setEventForm({ ...eventForm, endDate: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Konum</label>
                <input
                  type="text"
                  value={eventForm.location}
                  onChange={(e) => setEventForm({ ...eventForm, location: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Kategori</label>
                <select
                  value={eventForm.category}
                  onChange={(e) => setEventForm({ ...eventForm, category: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                >
                  <option value="Spor">Spor</option>
                  <option value="Teknoloji">Teknoloji</option>
                  <option value="Sanat">Sanat</option>
                  <option value="Müzik">Müzik</option>
                  <option value="Bilim">Bilim</option>
                  <option value="Edebiyat">Edebiyat</option>
                  <option value="Sosyal">Sosyal</option>
                  <option value="Eğitim">Eğitim</option>
                  <option value="Diğer">Diğer</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Görsel URL (Opsiyonel)</label>
                <input
                  type="url"
                  value={eventForm.imageUrl}
                  onChange={(e) => setEventForm({ ...eventForm, imageUrl: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                />
              </div>

              <div className="flex gap-2 pt-4">
                <button
                  type="submit"
                  className="flex-1 bg-blue-900 text-white py-2 rounded-lg hover:bg-blue-800 transition"
                >
                  Oluştur
                </button>
                <button
                  type="button"
                  onClick={() => setShowCreateEventModal(false)}
                  className="flex-1 bg-gray-200 text-gray-700 py-2 rounded-lg hover:bg-gray-300 transition"
                >
                  İptal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Create Community Modal */}
      {showCreateCommunityModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6 max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Kulüp Oluştur</h2>
            <form onSubmit={handleCreateCommunity} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Kulüp Adı</label>
                <input
                  type="text"
                  required
                  value={communityForm.name}
                  onChange={(e) => setCommunityForm({ ...communityForm, name: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                  placeholder="Örnek Kulübü"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Açıklama</label>
                <textarea
                  required
                  value={communityForm.description}
                  onChange={(e) => setCommunityForm({ ...communityForm, description: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                  rows="3"
                  placeholder="Kulübünüzü tanıtın..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Kategori</label>
                <select
                  value={communityForm.category}
                  onChange={(e) => setCommunityForm({ ...communityForm, category: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                >
                  <option value="Spor">Spor</option>
                  <option value="Teknoloji">Teknoloji</option>
                  <option value="Sanat">Sanat</option>
                  <option value="Müzik">Müzik</option>
                  <option value="Bilim">Bilim</option>
                  <option value="Edebiyat">Edebiyat</option>
                  <option value="Sosyal">Sosyal</option>
                  <option value="Diğer">Diğer</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Görsel URL (Opsiyonel)</label>
                <input
                  type="url"
                  value={communityForm.imageUrl}
                  onChange={(e) => setCommunityForm({ ...communityForm, imageUrl: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                  placeholder="https://example.com/image.jpg"
                />
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm text-blue-900">
                Her kulüp yöneticisi sadece 1 kulüp oluşturabilir.
              </div>

              <div className="flex gap-2 pt-4">
                <button
                  type="submit"
                  className="flex-1 bg-blue-900 text-white py-2 rounded-lg hover:bg-blue-800 transition"
                >
                  Oluştur
                </button>
                <button
                  type="button"
                  onClick={() => setShowCreateCommunityModal(false)}
                  className="flex-1 bg-gray-200 text-gray-700 py-2 rounded-lg hover:bg-gray-300 transition"
                >
                  İptal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Create Announcement Account Modal */}
      {showCreateAccountModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Duyuru Hesabı Oluştur</h2>
            <form onSubmit={handleCreateAnnouncementAccount} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Kullanıcı Adı</label>
                <input
                  type="text"
                  required
                  value={accountForm.username}
                  onChange={(e) => setAccountForm({ ...accountForm, username: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                  placeholder="ornek_kulubu"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Şifre</label>
                <input
                  type="password"
                  required
                  value={accountForm.password}
                  onChange={(e) => setAccountForm({ ...accountForm, password: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                  minLength="6"
                />
                <p className="text-xs text-gray-500 mt-1">En az 6 karakter</p>
              </div>

              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-sm text-yellow-900">
                Bu bilgileri not edin! Kulübünüzün announcement hesabına giriş yapmak için kullanacaksınız.
              </div>

              <div className="flex gap-2 pt-4">
                <button
                  type="submit"
                  className="flex-1 bg-blue-900 text-white py-2 rounded-lg hover:bg-blue-800 transition"
                >
                  Oluştur
                </button>
                <button
                  type="button"
                  onClick={() => setShowCreateAccountModal(false)}
                  className="flex-1 bg-gray-200 text-gray-700 py-2 rounded-lg hover:bg-gray-300 transition"
                >
                  İptal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
