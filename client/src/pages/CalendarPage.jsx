import { useState, useEffect, useRef } from 'react';
import { useSelector } from 'react-redux';
import { Calendar, MapPin, Users, Clock, ChevronRight, Loader2 } from 'lucide-react';
import { api } from '../utils/apiClient';
import LoadingShimmer from '../components/LoadingShimmer';
import { useNavigate, useSearchParams } from 'react-router-dom';

export default function CalendarPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const highlightedEventId = searchParams.get('eventId');
  const { userId } = useSelector((state) => state.auth);
  const [allEvents, setAllEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedFilter, setSelectedFilter] = useState('upcoming');
  const [loadingAttend, setLoadingAttend] = useState(null); // Track which event is being attended
  const eventRefs = useRef({});

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    try {
      setLoading(true);
      const res = await api.get('/api/events?page=1&limit=50');
      if (res.ok) {
        const data = await res.json();
        setAllEvents(data.events || []);
      } else {
        console.error('Failed to fetch events');
        setAllEvents([]);
      }
    } catch (error) {
      console.error('Error fetching events:', error);
      setAllEvents([]);
    } finally {
      setLoading(false);
    }
  };

  // Filter events based on selected tab
  const events = selectedFilter === 'upcoming'
    ? allEvents.filter(event => new Date(event.endDate) >= new Date())
    : allEvents;

  // Scroll to highlighted event after events are loaded
  useEffect(() => {
    if (highlightedEventId && events.length > 0 && eventRefs.current[highlightedEventId]) {
      setTimeout(() => {
        const element = eventRefs.current[highlightedEventId];
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 100);
    }
  }, [highlightedEventId, events.length]);

  const handleAttendEvent = async (eventId) => {
    if (loadingAttend === eventId) return; // Prevent double-click

    try {
      setLoadingAttend(eventId);

      // Optimistic update
      const isCurrentlyAttending = isUserAttending(allEvents.find(e => e._id === eventId));
      setAllEvents(allEvents.map(e => {
        if (e._id === eventId) {
          const updatedAttendees = isCurrentlyAttending
            ? e.attendees.filter(a => (typeof a === 'string' ? a : a._id) !== userId)
            : [...(e.attendees || []), userId];
          return { ...e, attendees: updatedAttendees };
        }
        return e;
      }));

      const res = await api.post(`/api/events/${eventId}/attend`);

      if (res.ok) {
        const updatedEvent = await res.json();
        setAllEvents(allEvents.map(e => e._id === eventId ? updatedEvent : e));
      } else {
        // Revert optimistic update on error
        fetchEvents();
      }
    } catch (error) {
      console.error('Error toggling attendance:', error);
      // Revert optimistic update on error
      fetchEvents();
    } finally {
      setLoadingAttend(null);
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
    if (!event) return false;
    return event.attendees?.some(attendee =>
      typeof attendee === 'string' ? attendee === userId : attendee._id === userId
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white">
        <div className="bg-white border-b border-gray-200 p-4">
          <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <Calendar size={24} className="text-blue-900" />
            Etkinlik Takvimi
          </h1>
          <p className="text-sm text-gray-500 mt-1">Kulüplerin düzenlediği etkinlikleri keşfedin</p>
        </div>
        <div className="p-4 space-y-4">
          {[1, 2, 3].map(i => <LoadingShimmer key={i} height="200px" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Header - Fixed content */}
      <div className="bg-white border-b border-gray-200 p-4">
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
            className={`py-3 px-2 font-medium text-sm transition relative ${
              selectedFilter === 'upcoming'
                ? 'text-blue-900'
                : 'text-gray-500'
            }`}
          >
            Yaklaşan Etkinlikler
            {selectedFilter === 'upcoming' && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-900" />
            )}
          </button>
          <button
            onClick={() => setSelectedFilter('all')}
            className={`py-3 px-2 font-medium text-sm transition relative ${
              selectedFilter === 'all'
                ? 'text-blue-900'
                : 'text-gray-500'
            }`}
          >
            Tüm Etkinlikler
            {selectedFilter === 'all' && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-900" />
            )}
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
          events.map((event) => {
            const isAttending = isUserAttending(event);
            const isLoading = loadingAttend === event._id;

            return (
              <div
                key={event._id}
                ref={(el) => (eventRefs.current[event._id] = el)}
                className={`bg-white border rounded-lg overflow-hidden transition-all ${
                  highlightedEventId === event._id
                    ? 'border-blue-500 shadow-lg ring-2 ring-blue-200'
                    : 'border-gray-200'
                }`}
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
                        className="w-8 h-8 rounded-full object-cover border border-gray-200"
                      />
                    ) : (
                      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center border border-gray-200">
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
                      disabled={isLoading}
                      className={`flex-1 py-2 px-4 rounded-lg font-medium transition flex items-center justify-center gap-2 ${
                        isAttending
                          ? 'bg-green-100 text-green-700 border border-green-300'
                          : 'bg-blue-900 text-white border border-blue-900'
                      } disabled:opacity-50 disabled:cursor-not-allowed`}
                    >
                      {isLoading ? (
                        <>
                          <Loader2 size={16} className="animate-spin" />
                          {isAttending ? 'Çıkılıyor...' : 'Katılınıyor...'}
                        </>
                      ) : (
                        isAttending ? 'Katılıyorum' : 'Katıl'
                      )}
                    </button>
                    <button
                      onClick={() => navigate(`/etkinlik/${event._id}`)}
                      className="p-2 border border-gray-300 rounded-lg transition"
                      title="Etkinlik Detayları"
                    >
                      <ChevronRight size={20} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
