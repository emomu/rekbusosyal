import React from 'react';
import { Menu, Bell } from 'lucide-react';

export default function MobileHeader({ onMenuClick, onNotificationsClick, unreadCount = 0 }) {
  return (
    <div className="md:hidden sticky top-0 left-0 right-0 bg-white/95 backdrop-blur-md border-b border-gray-200 z-30 px-4 py-3">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold tracking-tighter text-blue-900">
          KBÜ<span className="text-red-600">Sosyal</span>.
        </h1>
        <div className="flex items-center gap-2">
          {/* Bildirimler Butonu */}
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onNotificationsClick();
            }}
            type="button"
            className="relative p-2 hover:bg-gray-100 rounded-lg transition"
            aria-label="Bildirimler"
          >
            <Bell size={22} className="text-gray-700" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold rounded-full w-5 h-5 flex items-center justify-center">
                {unreadCount > 99 ? '99+' : unreadCount}
              </span>
            )}
          </button>

          {/* Menü Butonu */}
          <button
            onClick={onMenuClick}
            className="p-2 hover:bg-gray-100 rounded-lg transition"
            aria-label="Menüyü aç"
          >
            <Menu size={24} className="text-gray-700" />
          </button>
        </div>
      </div>
    </div>
  );
}
