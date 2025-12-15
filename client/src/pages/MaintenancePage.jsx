import React from 'react';
import { Wrench, Clock, RefreshCw, Mail } from 'lucide-react';

/**
 * Maintenance Page
 * Diğer sayfalar (Login, 404, 403) ile birebir uyumlu "Split Screen" tasarımı.
 */
export default function MaintenancePage() {
  
  const handleRefresh = () => {
    window.location.reload();
  };

  return (
    <div className="min-h-screen flex bg-gray-50">

      {/* SOL TARAF - GÖRSEL */}
      <div className="hidden lg:flex w-1/2 bg-blue-900 items-center justify-center relative overflow-hidden">
        {/* Arka plan overlay - Standart */}
        <div className="absolute inset-0 bg-black/60 z-10"></div>

        {/* Dekoratif Efektler (Mavi/İndigo tonlar) */}
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-blue-400/30 rounded-full blur-3xl z-0 animate-pulse"></div>
        <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-indigo-500/20 rounded-full blur-3xl z-0"></div>

        <div className="relative z-20 text-white p-12 max-w-lg">
          <h1 className="text-8xl font-bold mb-4 tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-blue-200 to-white">
            🔧
          </h1>
          <h2 className="text-4xl font-bold mb-6 tracking-tight">
            Sistem Bakımda.
          </h2>
          <p className="text-xl font-light opacity-90 leading-relaxed border-l-4 border-blue-500 pl-4">
            Daha iyi bir deneyim sunmak için altyapımızı güçlendiriyoruz. Kısa bir mola verdik.
          </p>
        </div>
      </div>

      {/* SAĞ TARAF - İÇERİK */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-white">
        <div className="w-full max-w-md">

          {/* İkon ve Başlık */}
          <div className="mb-8 text-center sm:text-left">
            <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center mb-6 mx-auto sm:mx-0 border border-blue-100">
              <Wrench className="w-8 h-8 text-blue-600" strokeWidth={2} />
            </div>

            <h2 className="text-3xl font-bold text-gray-900 mb-2">
              Güncelleniyoruz
            </h2>
            <p className="text-gray-500 text-lg">
              KBÜ Sosyal şu anda planlı bakım çalışması nedeniyle hizmet veremiyor.
            </p>
          </div>

          {/* Bilgi Kartı (Süre) */}
          <div className="flex items-start gap-4 p-4 bg-blue-50/50 rounded-xl border border-blue-100 mb-6">
            <div className="p-2 bg-white rounded-lg shadow-sm shrink-0">
              <Clock className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h3 className="font-bold text-gray-900 text-sm mb-1">
                Tahmini Süre
              </h3>
              <p className="text-gray-600 text-sm leading-relaxed">
                Çalışmaların kısa sürede tamamlanması öngörülüyor. Lütfen biraz sonra tekrar kontrol edin.
              </p>
            </div>
          </div>

          {/* Aksiyon Butonu */}
          <div className="space-y-4">
            {/* Durumu Kontrol Et Butonu */}
            <button 
              onClick={handleRefresh}
              className="w-full bg-blue-900 text-white font-bold py-4 rounded-lg hover:bg-blue-800 transition transform active:scale-95 shadow-lg shadow-blue-900/20 flex items-center justify-center gap-3"
            >
              <RefreshCw size={20} />
              Durumu Kontrol Et
            </button>
          </div>

          {/* İletişim / Footer */}
          <div className="mt-8 pt-6 border-t border-gray-100 text-center sm:text-left flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2 text-gray-500 text-sm">
                <Mail size={16} />
                <span>infokbusosyal@gmail.com</span>
            </div>
             <p className="text-xs text-gray-400 font-medium">KBÜ Sosyal © 2025</p>
          </div>

        </div>
      </div>
    </div>
  );
}