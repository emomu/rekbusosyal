import React from 'react';
import { useNavigate, useRouteError } from 'react-router-dom';
import { AlertTriangle, Home, RefreshCw, ArrowLeft } from 'lucide-react';
import { sanitizeError } from '../utils/security';

/**
 * Generic Error Page
 * NotFoundPage ve LoginPage ile aynı "Split Screen" tasarım diline sahiptir.
 */
export default function ErrorPage() {
  const navigate = useNavigate();
  const error = useRouteError();
  const errorMessage = sanitizeError(error);

  const handleRefresh = () => {
    window.location.reload();
  };

  const handleGoBack = () => {
    // Check if there's history to go back to
    if (window.history.length > 1) {
      navigate(-1);
    } else {
      // If no history, go to home
      navigate('/');
    }
  };

  return (
    <div className="min-h-screen flex bg-gray-50">
      
      {/* SOL TARAF - GÖRSEL (Diğer sayfalarla aynı yapı) */}
      <div className="hidden lg:flex w-1/2 bg-blue-900 items-center justify-center relative overflow-hidden">
        {/* Arka plan overlay */}
        <div className="absolute inset-0 bg-black/60 z-10"></div>
        
        {/* Dekoratif Efektler (Hata hissiyatı için kırmızı yoğunluklu) */}
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-red-600/30 rounded-full blur-3xl z-0"></div>
        <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl z-0"></div>

        <div className="relative z-20 text-white p-12 max-w-lg">
          <h1 className="text-8xl font-bold mb-4 tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-red-400 to-white">
            OOPS!
          </h1>
          <h2 className="text-4xl font-bold mb-6 tracking-tight">
            Beklenmedik bir durum.
          </h2>
          <p className="text-xl font-light opacity-90 leading-relaxed border-l-4 border-red-500 pl-4">
            Bazen kodlar da yorulur. Endişelenme, bu geçici bir durum olabilir.
          </p>
        </div>
      </div>

      {/* SAĞ TARAF - İÇERİK */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-white">
        <div className="w-full max-w-md">
          
          {/* İkon ve Başlık */}
          <div className="mb-8 text-center sm:text-left">
            <div className="w-16 h-16 bg-red-50 rounded-2xl flex items-center justify-center mb-6 mx-auto sm:mx-0 border border-red-100">
              <AlertTriangle className="w-8 h-8 text-red-600" strokeWidth={2} />
            </div>
            
            <h2 className="text-3xl font-bold text-gray-900 mb-2">
              Bir Hata Oluştu
            </h2>
            <p className="text-gray-500 text-lg">
              İsteğini işlerken bir sorunla karşılaştık.
            </p>
          </div>

          {/* Hata Mesajı Kutusu (Terminal Görünümü) */}
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-8 font-mono text-sm text-red-700 break-words shadow-inner">
             <p className="font-bold text-gray-700 text-xs mb-1 uppercase tracking-wider">Hata Raporu:</p>
             {errorMessage || "Bilinmeyen bir hata oluştu."}
          </div>

          {/* Aksiyon Butonları */}
          <div className="space-y-4">
            
            {/* Yenile Butonu (Primary) */}
            <button 
              onClick={handleRefresh}
              className="w-full bg-blue-900 text-white font-bold py-4 rounded-lg hover:bg-blue-800 transition transform active:scale-95 shadow-lg shadow-blue-900/20 flex items-center justify-center gap-3"
            >
              <RefreshCw size={20} />
              Sayfayı Yenile
            </button>

            {/* Ana Sayfa Butonu (Secondary) */}
            <button 
              onClick={() => navigate('/')}
              className="w-full bg-white text-gray-700 border border-gray-200 font-bold py-4 rounded-lg hover:bg-gray-50 hover:text-gray-900 transition flex items-center justify-center gap-3"
            >
              <Home size={20} />
              Ana Akışa Dön
            </button>
            
            {/* Geri Dön Linki */}
            <button
              onClick={handleGoBack}
              className="w-full text-gray-400 font-medium py-2 hover:text-gray-600 text-sm transition flex items-center justify-center gap-2"
            >
              <ArrowLeft size={16} />
              Bir önceki sayfaya dön
            </button>
          </div>
          
          {/* Footer */}
          <div className="mt-8 text-center">
             <p className="text-xs text-gray-400 font-medium">KBÜ Sosyal © 2025</p>
          </div>

        </div>
      </div>
    </div>
  );
}