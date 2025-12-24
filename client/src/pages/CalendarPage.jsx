import { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { Calendar, MapPin, Users, Clock, ChevronRight } from 'lucide-react';
import { api } from '../utils/apiClient';
import LoadingShimmer from '../components/LoadingShimmer';
import { useNavigate } from 'react-router-dom';

export default function CalendarPage() {
  const navigate = useNavigate();
  const { token, userId } = useSelector((state) => state.auth);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedFilter, setSelectedFilter] = useState('upcoming'); // 'upcoming' | 'all'

  useEffect(() => {
    fetchEvents();
  }, [selectedFilter]);

  const fetchEvents = async () => {
    try {
      setLoading(true);
      const res = await api.get('/api/events?page=1&limit=50');
      if (res.ok) {
        const data = await res.json();
        setEvents(data.events || []);
      }
    } catch (error) {
      console.error('Error fetching events:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAttendEvent = async (eventId) => {
    try {
      const res = await api.post(`/api/events/${eventId}/attend`);
      if (res.ok) {
        const updatedEvent = await res.json();
        setEvents(events.map(e => e._id === eventId ? updatedEvent : e));
      }
    } catch (error) {
      console.error('Error toggling attendance:', error);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('tr-TR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  const isUserAttending = (event) => {
    return event.attendees?.some(attendee =>
      typeof attendee === 'string' ? attendee === userId : attendee._id === userId
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white">
        <div className="sticky top-0 bg-white border-b border-gray-200 p-4 z-10">
          <h1 className="text-xl font-bold text-gray-900">Etkinlik Takvimi</h1>
        </div>
        <div className="p-4 space-y-4">
          {[1, 2, 3].map(i => <LoadingShimmer key={i} height="200px" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="sticky top-0 bg-white border-b border-gray-200 p-4 z-10">
        <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
          <Calendar size={24} className="text-blue-900" />
          Etkinlik Takvimi
        </h1>
        <p className="text-sm text-gray-500 mt-1">Kulüplerin düzenlediği etkinlikleri keşfedin</p>
      </div>

      {/* Filter Tabs */}
      <div className="border-b border-gray-200 px-4">
        <div className="flex gap-4">
          <button
            onClick={() => setSelectedFilter('upcoming')}
            className={`py-3 px-2 border-b-2 font-medium text-sm transition ${
              selectedFilter === 'upcoming'
                ? 'border-blue-900 text-blue-900'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Yaklaşan Etkinlikler
          </button>
          <button
            onClick={() => setSelectedFilter('all')}
            className={`py-3 px-2 border-b-2 font-medium text-sm transition ${
              selectedFilter === 'all'
                ? 'border-blue-900 text-blue-900'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Tüm Etkinlikler
          </button>
        </div>
      </div>

      {/* Events List */}
      <div className="p-4 space-y-4">
        {events.length === 0 ? (
          <div className="text-center py-12">
            <Calendar size={64} className="mx-auto text-gray-300 mb-4" />
            <h3 className="text-lg font-semibold text-gray-700 mb-2">Henüz Etkinlik Yok</h3>
            <p className="text-gray-500">Yakında etkinlikler burada görünecek!</p>
          </div>
        ) : (
          events.map((event) => (
            <div
              key={event._id}
              className="bg-white border border-gray-200 rounded-lg overflow-hidden hover:shadow-md transition"
            >
              {/* Event Image */}
              {event.imageUrl && (
                <img
                  src={event.imageUrl}
                  alt={event.title}
                  className="w-full h-48 object-cover"
                />
              )}

              <div className="p-4">
                {/* Community Badge */}
                <div className="flex items-center gap-2 mb-3">
                  {event.community?.imageUrl ? (
                    <img
                      src={event.community.imageUrl}
                      alt={event.community.name}
                      className="w-8 h-8 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                      <Users size={16} className="text-blue-900" />
                    </div>
                  )}
                  <span className="text-sm font-semibold text-blue-900">
                    {event.community?.name || 'Kulüp'}
                  </span>
                </div>

                {/* Event Title */}
                <h3 className="text-lg font-bold text-gray-900 mb-2">{event.title}</h3>

                {/* Event Description */}
                {event.description && (
                  <p className="text-gray-600 text-sm mb-3 line-clamp-2">{event.description}</p>
                )}

                {/* Event Details */}
                <div className="space-y-2 mb-4">
                  <div className="flex items-start gap-2 text-sm text-gray-600">
                    <Clock size={16} className="mt-0.5 flex-shrink-0" />
                    <div>
                      <div className="font-medium">Başlangıç: {formatDate(event.startDate)}</div>
                      <div>Bitiş: {formatDate(event.endDate)}</div>
                    </div>
                  </div>

                  {event.location && (
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <MapPin size={16} className="flex-shrink-0" />
                      <span>{event.location}</span>
                    </div>
                  )}

                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Users size={16} className="flex-shrink-0" />
                    <span>{event.attendees?.length || 0} kişi katılacak</span>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2">
                  <button
                    onClick={() => handleAttendEvent(event._id)}
                    className={`flex-1 py-2 px-4 rounded-lg font-medium transition ${
                      isUserAttending(event)
                        ? 'bg-green-100 text-green-700 hover:bg-green-200'
                        : 'bg-blue-900 text-white hover:bg-blue-800'
                    }`}
                  >
                    {isUserAttending(event) ? 'Katılıyorum' : 'Katıl'}
                  </button>
                  <button
                    onClick={() => navigate(`/topluluklar/${event.community?._id}`)}
                    className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
                  >
                    <ChevronRight size={20} />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
