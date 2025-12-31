import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, ChevronRight } from 'lucide-react';

const EventCard = ({ event }) => {
  const navigate = useNavigate();

  console.log('EventCard received event:', event);

  if (!event) return null;

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return dateString;
    return date.toLocaleDateString('tr-TR', {
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

  const startDate = formatDateShort(event.startDate);

  const handleClick = (e) => {
    e.stopPropagation();
    navigate(`/etkinlik/${event._id}`);
  };

  return (
    <div
      onClick={handleClick}
      className="border border-gray-200 rounded-lg overflow-hidden hover:border-blue-300 hover:shadow-md transition-all cursor-pointer bg-white"
    >
      {/* Header with Image */}
      {event.imageUrl ? (
        <div className="relative h-36 bg-gradient-to-br from-blue-50 to-indigo-50">
          <img
            src={event.imageUrl}
            alt={event.title}
            className="w-full h-full object-cover"
          />
          <div className="absolute top-2 left-2 bg-white rounded-lg shadow-md px-2.5 py-1.5 min-w-[50px] text-center">
            <div className="text-xl font-bold text-gray-900 leading-none">{startDate.day}</div>
            <div className="text-[10px] font-semibold text-gray-600 mt-0.5">{startDate.month}</div>
          </div>
        </div>
      ) : (
        <div className="relative h-24 bg-gradient-to-br from-blue-50 to-indigo-50">
          <div className="absolute top-2 left-2 bg-white rounded-lg shadow-md px-2.5 py-1.5 min-w-[50px] text-center">
            <div className="text-xl font-bold text-gray-900 leading-none">{startDate.day}</div>
            <div className="text-[10px] font-semibold text-gray-600 mt-0.5">{startDate.month}</div>
          </div>
        </div>
      )}

      {/* Body */}
      <div className="p-3">
        <h3 className="text-base font-bold text-gray-900 mb-2 line-clamp-1">
          {event.title}
        </h3>

        <div className="space-y-1.5 mb-2">
          <div className="flex items-center gap-1.5 text-xs text-gray-600">
            <span>📅</span>
            <span className="line-clamp-1">{formatDate(event.startDate)}</span>
          </div>

          {event.location && (
            <div className="flex items-center gap-1.5 text-xs text-gray-600">
              <span>📍</span>
              <span className="line-clamp-1">{event.location}</span>
            </div>
          )}
        </div>

        {event.description && (
          <p className="text-xs text-gray-600 mb-2 line-clamp-2">
            {event.description}
          </p>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between pt-2 border-t border-gray-100">
          <div className="flex items-center gap-1 text-xs text-gray-600">
            <Users size={14} />
            <span className="font-medium">{event.attendees?.length || 0} katılıyor</span>
          </div>
          <div className="flex items-center gap-0.5 text-xs font-semibold text-blue-600 hover:text-blue-700">
            <span>Detaylar</span>
            <ChevronRight size={14} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default EventCard;
