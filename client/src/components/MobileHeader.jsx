import React from 'react';
import { Menu } from 'lucide-react';

export default function MobileHeader({ onMenuClick }) {
  return (
    <div className="md:hidden sticky top-0 left-0 right-0 bg-white/95 backdrop-blur-md border-b border-gray-200 z-30 px-4 py-3">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold tracking-tighter text-blue-900">
          KBÜ<span className="text-red-600">Sosyal</span>.
        </h1>
        <button
          onClick={onMenuClick}
          className="p-2 hover:bg-gray-100 rounded-lg transition"
          aria-label="Menüyü aç"
        >
          <Menu size={24} className="text-gray-700" />
        </button>
      </div>
    </div>
  );
}
