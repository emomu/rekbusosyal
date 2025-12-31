import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { Calendar, MapPin, Users, ChevronLeft, Clock } from 'lucide-react';
import { api } from '../utils/apiClient';
import LoadingShimmer from '../components/LoadingShimmer';

export default function EventDetailPage() {
  const { eventId } = useParams();
  const navigate = useNavigate();
  const { token, userId } = useSelector((state) => state.auth);
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAttending, setIsAttending] = useState(false);

  useEffect(() => {
    fetchEvent();
  }, [eventId]);

  const fetchEvent = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/api/events/${eventId}`);
      if (res.ok) {
        const data = await res.json();
        setEvent(data);
        setIsAttending(data.attendees?.some(attendee =>
          typeof attendee === 'string' ? attendee === userId : attendee._id === userId
        ));
      }
    } catch (error) {
      console.error('Error fetching event:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAttendEvent = async () => {
    try {
      const res = await api.post(`/api/events/${eventId}/attend`);
      if (res.ok) {
        const updatedEvent = await res.json();
        setEvent(updatedEvent);
        setIsAttending(updatedEvent.attendees?.some(attendee =>
          typeof attendee === 'string' ? attendee === userId : attendee._id === userId
        ));
      }
    } catch (error) {
      console.error('Error toggling attendance:', error);
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

  const formatDateShort = (dateString) => {
    if (!dateString) return { day: '-', month: '-' };
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return { day: '-', month: '-' };
    return {
      day: date.getDate(),
      month: date.toLocaleDateString('tr-TR', { month: 'short' }).toUpperCase()
    };
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white">
        <div className="border-b border-gray-200 p-4">
          <LoadingShimmer height="40px" />
        </div>
        <div className="p-4 space-y-4">
          <LoadingShimmer height="300px" />
          <LoadingShimmer height="200px" />
        </div>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <Calendar size={64} className="mx-auto text-gray-300 mb-4" />
          <p className="text-gray-500">Etkinlik bulunamadı</p>
        </div>
      </div>
    );
  }

  const startDate = formatDateShort(event.startDate);

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-sm text-gray-600 mb-4"
          >
            <ChevronLeft size={16} />
            Geri Dön
          </button>

          {event.imageUrl ? (
            <div className="relative rounded-lg overflow-hidden border border-gray-200 mb-4">
              <img
                src={event.imageUrl}
                alt={event.title}
                className="w-full h-64 md:h-96 object-cover"
              />
              <div className="absolute top-4 left-4 bg-white rounded-lg shadow-md px-3 py-2 min-w-[60px] text-center">
                <div className="text-2xl font-bold text-gray-900 leading-none">{startDate.day}</div>
                <div className="text-xs font-semibold text-gray-600 mt-1">{startDate.month}</div>
              </div>
            </div>
          ) : (
            <div className="relative h-48 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg border border-gray-200 mb-4">
              <div className="absolute top-4 left-4 bg-white rounded-lg shadow-md px-3 py-2 min-w-[60px] text-center">
                <div className="text-2xl font-bold text-gray-900 leading-none">{startDate.day}</div>
                <div className="text-xs font-semibold text-gray-600 mt-1">{startDate.month}</div>
              </div>
            </div>
          )}

          <h1 className="text-3xl font-bold text-gray-900 mb-2">{event.title}</h1>

          {event.community && (
            <div className="flex items-center gap-2 mb-4">
              {event.community.imageUrl ? (
                <img
                  src={event.community.imageUrl}
                  alt={event.community.name}
                  className="w-8 h-8 rounded-full object-cover border border-gray-200"
                />
              ) : (
                <div className="w-8 h-8 rounded-full bg-gray-100 border border-gray-200 flex items-center justify-center">
                  <Users size={16} className="text-gray-400" />
                </div>
              )}
              <span className="text-sm font-medium text-gray-700">{event.community.name}</span>
            </div>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 py-6">
        <div className="grid md:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="md:col-span-2">
            <div className="border border-gray-200 rounded-lg p-6 mb-4">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Etkinlik Detayları</h2>

              <div className="space-y-4 mb-6">
                <div className="flex items-start gap-3">
                  <Calendar size={20} className="text-gray-400 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-gray-700">Başlangıç</p>
                    <p className="text-sm text-gray-600">{formatDate(event.startDate)}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Clock size={20} className="text-gray-400 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-gray-700">Bitiş</p>
                    <p className="text-sm text-gray-600">{formatDate(event.endDate)}</p>
                  </div>
                </div>

                {event.location && (
                  <div className="flex items-start gap-3">
                    <MapPin size={20} className="text-gray-400 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-gray-700">Konum</p>
                      <p className="text-sm text-gray-600">{event.location}</p>
                    </div>
                  </div>
                )}

                <div className="flex items-start gap-3">
                  <Users size={20} className="text-gray-400 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-gray-700">Katılımcılar</p>
                    <p className="text-sm text-gray-600">{event.attendees?.length || 0} kişi katılıyor</p>
                  </div>
                </div>
              </div>

              <div className="border-t border-gray-200 pt-4">
                <h3 className="font-bold text-gray-900 mb-2">Açıklama</h3>
                <p className="text-sm text-gray-600 whitespace-pre-wrap leading-relaxed">
                  {event.description}
                </p>
              </div>
            </div>

            {/* Attendees Section */}
            {event.attendees && event.attendees.length > 0 && (
              <div className="border border-gray-200 rounded-lg p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4">Katılımcılar</h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  {event.attendees.slice(0, 12).map((attendee) => (
                    <div
                      key={attendee._id || attendee}
                      className="flex items-center gap-2"
                    >
                      {attendee.profilePicture ? (
                        <img
                          src={attendee.profilePicture}
                          alt={attendee.fullName}
                          className="w-8 h-8 rounded-full object-cover border border-gray-200"
                        />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-gray-100 border border-gray-200 flex items-center justify-center">
                          <Users size={16} className="text-gray-400" />
                        </div>
                      )}
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {attendee.fullName || attendee.username || 'Kullanıcı'}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
                {event.attendees.length > 12 && (
                  <p className="text-sm text-gray-500 mt-4">
                    +{event.attendees.length - 12} kişi daha
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="md:col-span-1">
            <div className="border border-gray-200 rounded-lg p-6 sticky top-4">
              <button
                onClick={handleAttendEvent}
                className={`w-full px-4 py-3 rounded-lg font-medium text-sm border transition ${
                  isAttending
                    ? 'bg-white text-gray-700 border-gray-300'
                    : 'bg-blue-500 text-white border-blue-500'
                }`}
              >
                {isAttending ? 'Katılımdan Vazgeç' : 'Katıl'}
              </button>

              {event.category && (
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <p className="text-xs font-medium text-gray-500 mb-2">Kategori</p>
                  <span className="inline-block px-3 py-1 bg-gray-100 text-gray-700 text-xs font-medium rounded-full border border-gray-200">
                    {event.category}
                  </span>
                </div>
              )}

              {event.createdBy && (
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <p className="text-xs font-medium text-gray-500 mb-3">Düzenleyen</p>
                  <div className="flex items-center gap-2">
                    {event.createdBy.profilePicture ? (
                      <img
                        src={event.createdBy.profilePicture}
                        alt={event.createdBy.fullName}
                        className="w-10 h-10 rounded-full object-cover border border-gray-200"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-gray-100 border border-gray-200 flex items-center justify-center">
                        <Users size={20} className="text-gray-400" />
                      </div>
                    )}
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {event.createdBy.fullName}
                      </p>
                      <p className="text-xs text-gray-500 truncate">
                        @{event.createdBy.username}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
