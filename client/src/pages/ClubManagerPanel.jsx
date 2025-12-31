import { useState, useEffect, useRef } from 'react';
import { useSelector } from 'react-redux';
import { Users, Calendar, PlusCircle, Trash2, ArrowLeft, Image as ImageIcon, X, Loader2 } from 'lucide-react';
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
  const [activeTab, setActiveTab] = useState('events');

  // Create Event Modal State
  const [showCreateEventModal, setShowCreateEventModal] = useState(false);
  const [eventForm, setEventForm] = useState({
    title: '',
    description: '',
    startDate: '',
    endDate: '',
    location: '',
    category: 'Sosyal'
  });
  const [selectedPoster, setSelectedPoster] = useState(null);
  const [posterPreview, setPosterPreview] = useState(null);
  const [isCreatingEvent, setIsCreatingEvent] = useState(false);
  const fileInputRef = useRef(null);

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

  const handlePosterSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedPoster(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPosterPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCreateEvent = async (e) => {
    e.preventDefault();
    setIsCreatingEvent(true);
    try {
      const formData = new FormData();
      formData.append('title', eventForm.title);
      formData.append('description', eventForm.description);
      formData.append('startDate', eventForm.startDate);
      formData.append('endDate', eventForm.endDate);
      formData.append('location', eventForm.location);
      formData.append('category', eventForm.category);
      formData.append('communityId', managedCommunity._id);

      if (selectedPoster) {
        formData.append('poster', selectedPoster);
      }

      const res = await api.upload('/api/events', formData);

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
          category: 'Sosyal'
        });
        setSelectedPoster(null);
        setPosterPreview(null);
        alert('✅ Etkinlik ve post başarıyla oluşturuldu!');
      } else {
        const error = await res.json();
        alert(error.error || 'Etkinlik oluşturulamadı');
      }
    } catch (error) {
      console.error('Error creating event:', error);
      alert('Etkinlik oluşturulurken bir hata oluştu');
    } finally {
      setIsCreatingEvent(false);
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
        alert('Duyuru hesabı oluşturuldu!');
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

  if (loading) {
    return (
      <div className="min-h-screen bg-white p-4">
        <LoadingShimmer height="100px" />
        <div className="mt-4 space-y-4">
          {[1, 2, 3].map(i => <LoadingShimmer key={i} height="150px" />)}
        </div>
      </div>
    );
  }

  if ((userRole === 'club_manager' || userRole === 'admin') && !managedCommunity) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <Users size={64} className="mx-auto text-gray-300 mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Henüz Kulüp Yönetmiyorsunuz</h2>
          <p className="text-gray-600 mb-6">Kulüp yöneticisi olarak bir kulüp oluşturabilirsiniz.</p>
          <button
            onClick={() => setShowCreateCommunityModal(true)}
            className="bg-blue-500 text-white px-6 py-2 rounded-lg font-medium flex items-center gap-2 mx-auto border border-blue-500"
          >
            <PlusCircle size={20} />
            Kulüp Oluştur
          </button>
        </div>

        {/* Create Community Modal */}
        {showCreateCommunityModal && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg max-w-md w-full p-6">
              <h3 className="text-xl font-bold mb-4">Yeni Kulüp Oluştur</h3>
              <form onSubmit={handleCreateCommunity} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Kulüp Adı</label>
                  <input
                    type="text"
                    value={communityForm.name}
                    onChange={(e) => setCommunityForm({...communityForm, name: e.target.value})}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 outline-none focus:border-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Açıklama</label>
                  <textarea
                    value={communityForm.description}
                    onChange={(e) => setCommunityForm({...communityForm, description: e.target.value})}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 outline-none focus:border-blue-500"
                    rows={3}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Kategori</label>
                  <select
                    value={communityForm.category}
                    onChange={(e) => setCommunityForm({...communityForm, category: e.target.value})}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 outline-none focus:border-blue-500"
                  >
                    <option value="Sosyal">Sosyal</option>
                    <option value="Spor">Spor</option>
                    <option value="Bilim">Bilim</option>
                    <option value="Sanat">Sanat</option>
                    <option value="Teknoloji">Teknoloji</option>
                  </select>
                </div>
                <div className="flex gap-2 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowCreateCommunityModal(false)}
                    className="flex-1 border border-gray-300 text-gray-700 px-4 py-2 rounded-lg"
                  >
                    İptal
                  </button>
                  <button
                    type="submit"
                    className="flex-1 bg-blue-500 text-white px-4 py-2 rounded-lg border border-blue-500"
                  >
                    Oluştur
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-2 text-sm text-gray-600 mb-3"
          >
            <ArrowLeft size={16} />
            Ana Sayfaya Dön
          </button>

          <div className="flex items-center gap-4">
            {managedCommunity.imageUrl ? (
              <img
                src={managedCommunity.imageUrl}
                alt={managedCommunity.name}
                className="w-16 h-16 rounded-full object-cover border border-gray-200"
              />
            ) : (
              <div className="w-16 h-16 rounded-full bg-gray-100 border border-gray-200 flex items-center justify-center">
                <Users size={32} className="text-gray-400" />
              </div>
            )}
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{managedCommunity.name}</h1>
              <p className="text-sm text-gray-500">{managedCommunity.members?.length || 0} üye · {events.length} etkinlik</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex gap-8">
            <button
              onClick={() => setActiveTab('events')}
              className={`py-4 font-medium text-sm relative ${
                activeTab === 'events' ? 'text-blue-500' : 'text-gray-600'
              }`}
            >
              Etkinlikler
              {activeTab === 'events' && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-500" />
              )}
            </button>
            <button
              onClick={() => setActiveTab('announcement')}
              className={`py-4 font-medium text-sm relative ${
                activeTab === 'announcement' ? 'text-blue-500' : 'text-gray-600'
              }`}
            >
              Duyuru Hesabı
              {activeTab === 'announcement' && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-500" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-6xl mx-auto px-4 py-6">
        {activeTab === 'events' && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900">Etkinlikler</h2>
              <button
                onClick={() => setShowCreateEventModal(true)}
                className="flex items-center gap-2 bg-blue-500 text-white px-4 py-2 rounded-lg text-sm font-medium border border-blue-500"
              >
                <PlusCircle size={18} />
                Yeni Etkinlik
              </button>
            </div>

            {events.length === 0 ? (
              <div className="text-center py-16 border border-gray-200 rounded-lg">
                <Calendar size={48} className="mx-auto text-gray-300 mb-3" />
                <p className="text-gray-500">Henüz etkinlik oluşturulmamış</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {events.map((event) => (
                  <div key={event._id} className="border border-gray-200 rounded-lg overflow-hidden">
                    {event.imageUrl && (
                      <img
                        src={event.imageUrl}
                        alt={event.title}
                        className="w-full h-40 object-cover"
                      />
                    )}
                    <div className="p-4">
                      <h3 className="font-bold text-gray-900 mb-2">{event.title}</h3>
                      <p className="text-sm text-gray-600 mb-3 line-clamp-2">{event.description}</p>
                      <div className="space-y-1 mb-3">
                        <p className="text-xs text-gray-500">📅 {formatDate(event.startDate)}</p>
                        {event.location && <p className="text-xs text-gray-500">📍 {event.location}</p>}
                      </div>
                      <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                        <span className="text-xs text-gray-500">{event.attendees?.length || 0} katılıyor</span>
                        <button
                          onClick={() => handleDeleteEvent(event._id)}
                          className="text-red-500 text-sm flex items-center gap-1"
                        >
                          <Trash2 size={14} />
                          Sil
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'announcement' && (
          <div>
            <h2 className="text-xl font-bold text-gray-900 mb-6">Duyuru Hesabı</h2>

            {announcementAccount ? (
              <div className="border border-gray-200 rounded-lg p-6">
                <div className="flex items-center gap-4 mb-4">
                  {announcementAccount.profilePicture ? (
                    <img
                      src={announcementAccount.profilePicture}
                      alt={announcementAccount.username}
                      className="w-16 h-16 rounded-full object-cover border border-gray-200"
                    />
                  ) : (
                    <div className="w-16 h-16 rounded-full bg-gray-100 border border-gray-200 flex items-center justify-center">
                      <Users size={32} className="text-gray-400" />
                    </div>
                  )}
                  <div>
                    <p className="font-bold text-gray-900">{announcementAccount.fullName}</p>
                    <p className="text-sm text-gray-500">@{announcementAccount.username}</p>
                  </div>
                </div>
                <p className="text-sm text-gray-600">
                  Bu hesap kulübünüz adına otomatik duyurular yapar. Etkinlik oluşturduğunuzda bu hesaptan otomatik post atılır.
                </p>
              </div>
            ) : (
              <div className="border border-gray-200 rounded-lg p-6">
                <p className="text-gray-600 mb-4">
                  Henüz duyuru hesabınız yok. Duyuru hesabı oluşturarak kulübünüz adına otomatik postlar atabilirsiniz.
                </p>
                <button
                  onClick={() => setShowCreateAccountModal(true)}
                  className="bg-blue-500 text-white px-4 py-2 rounded-lg text-sm font-medium border border-blue-500"
                >
                  Duyuru Hesabı Oluştur
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Create Event Modal */}
      {showCreateEventModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-lg max-w-2xl w-full p-6 my-8">
            <h3 className="text-xl font-bold mb-4">Yeni Etkinlik Oluştur</h3>
            <form onSubmit={handleCreateEvent} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Etkinlik Adı</label>
                <input
                  type="text"
                  value={eventForm.title}
                  onChange={(e) => setEventForm({...eventForm, title: e.target.value})}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 outline-none focus:border-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Açıklama</label>
                <textarea
                  value={eventForm.description}
                  onChange={(e) => setEventForm({...eventForm, description: e.target.value})}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 outline-none focus:border-blue-500"
                  rows={3}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Etkinlik Afişi</label>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handlePosterSelect}
                  className="hidden"
                />
                {posterPreview ? (
                  <div className="relative">
                    <img
                      src={posterPreview}
                      alt="Poster preview"
                      className="w-full h-48 object-cover rounded-lg border border-gray-200"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedPoster(null);
                        setPosterPreview(null);
                      }}
                      className="absolute top-2 right-2 bg-red-500 text-white p-2 rounded-full"
                    >
                      <X size={16} />
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full h-48 border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center text-gray-500"
                  >
                    <ImageIcon size={48} className="mb-2" />
                    <span className="text-sm">Afiş yüklemek için tıklayın</span>
                  </button>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Başlangıç Tarihi</label>
                  <input
                    type="datetime-local"
                    value={eventForm.startDate}
                    onChange={(e) => setEventForm({...eventForm, startDate: e.target.value})}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 outline-none focus:border-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Bitiş Tarihi</label>
                  <input
                    type="datetime-local"
                    value={eventForm.endDate}
                    onChange={(e) => setEventForm({...eventForm, endDate: e.target.value})}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 outline-none focus:border-blue-500"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Konum</label>
                <input
                  type="text"
                  value={eventForm.location}
                  onChange={(e) => setEventForm({...eventForm, location: e.target.value})}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 outline-none focus:border-blue-500"
                  placeholder="Örn: Kampüs Konferans Salonu"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Kategori</label>
                <select
                  value={eventForm.category}
                  onChange={(e) => setEventForm({...eventForm, category: e.target.value})}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 outline-none focus:border-blue-500"
                >
                  <option value="Sosyal">Sosyal</option>
                  <option value="Spor">Spor</option>
                  <option value="Bilim">Bilim</option>
                  <option value="Sanat">Sanat</option>
                  <option value="Teknoloji">Teknoloji</option>
                </select>
              </div>

              <div className="flex gap-2 pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateEventModal(false);
                    setSelectedPoster(null);
                    setPosterPreview(null);
                  }}
                  disabled={isCreatingEvent}
                  className="flex-1 border border-gray-300 text-gray-700 px-4 py-2 rounded-lg disabled:opacity-50"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  disabled={isCreatingEvent}
                  className="flex-1 bg-blue-500 text-white px-4 py-2 rounded-lg border border-blue-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isCreatingEvent ? (
                    <>
                      <Loader2 size={18} className="animate-spin" />
                      Oluşturuluyor...
                    </>
                  ) : (
                    'Oluştur'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Create Announcement Account Modal */}
      {showCreateAccountModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h3 className="text-xl font-bold mb-4">Duyuru Hesabı Oluştur</h3>
            <form onSubmit={handleCreateAnnouncementAccount} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Kullanıcı Adı</label>
                <input
                  type="text"
                  value={accountForm.username}
                  onChange={(e) => setAccountForm({...accountForm, username: e.target.value})}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 outline-none focus:border-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Şifre</label>
                <input
                  type="password"
                  value={accountForm.password}
                  onChange={(e) => setAccountForm({...accountForm, password: e.target.value})}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 outline-none focus:border-blue-500"
                  required
                />
              </div>
              <div className="flex gap-2 pt-4">
                <button
                  type="button"
                  onClick={() => setShowCreateAccountModal(false)}
                  className="flex-1 border border-gray-300 text-gray-700 px-4 py-2 rounded-lg"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-blue-500 text-white px-4 py-2 rounded-lg border border-blue-500"
                >
                  Oluştur
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
