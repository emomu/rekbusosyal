import { useState } from 'react';
import { Bell, X } from 'lucide-react';
import { requestNotificationPermission } from '../utils/browserNotifications';

/**
 * NotificationPermissionPrompt
 * Shows a friendly prompt asking user to enable browser notifications
 */
export default function NotificationPermissionPrompt({ onClose, onAccept }) {
  const [isRequesting, setIsRequesting] = useState(false);

  const handleAccept = async () => {
    setIsRequesting(true);

    try {
      const permission = await requestNotificationPermission();

      if (permission === 'granted') {
        onAccept?.();
        onClose();
      } else if (permission === 'denied') {
        // User denied permission
        onClose();
      }
    } catch (error) {
      console.error('Error requesting permission:', error);
    } finally {
      setIsRequesting(false);
    }
  };

  const handleDismiss = () => {
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={handleDismiss}
      />

      {/* Modal */}
      <div
        className="relative bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 animate-scale-in"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={handleDismiss}
          className="absolute top-4 right-4 p-1.5 hover:bg-gray-100 rounded-full transition"
        >
          <X size={20} className="text-gray-500" />
        </button>

        {/* Icon */}
        <div className="flex justify-center mb-4">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
            <Bell size={32} className="text-blue-600" />
          </div>
        </div>

        {/* Title */}
        <h2 className="text-xl font-bold text-gray-900 text-center mb-2">
          Bildirimlere İzin Ver
        </h2>

        {/* Description */}
        <p className="text-gray-600 text-center mb-6">
          Yeni beğeniler, yorumlar ve mesajlar hakkında anında bildirim almak için
          tarayıcı bildirimlerine izin verin.
        </p>

        {/* Features List */}
        <div className="bg-gray-50 rounded-xl p-4 mb-6 space-y-2">
          <div className="flex items-center gap-3">
            <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
            <p className="text-sm text-gray-700">Yeni beğeni ve yorumlardan haberdar olun</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
            <p className="text-sm text-gray-700">Takip isteklerini anında görün</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
            <p className="text-sm text-gray-700">Önemli güncellemelerden geri kalmayın</p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3">
          <button
            onClick={handleDismiss}
            className="flex-1 px-4 py-3 bg-gray-100 text-gray-700 rounded-xl font-semibold hover:bg-gray-200 transition"
          >
            Şimdi Değil
          </button>
          <button
            onClick={handleAccept}
            disabled={isRequesting}
            className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isRequesting ? 'İzin İsteniyor...' : 'İzin Ver'}
          </button>
        </div>

        {/* Privacy Note */}
        <p className="text-xs text-gray-500 text-center mt-4">
          İstediğiniz zaman tarayıcı ayarlarından bildirimleri kapatabilirsiniz.
        </p>
      </div>
    </div>
  );
}
