import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldAlert, Home, ArrowLeft, Lock } from 'lucide-react';

/**
 * 403 Unauthorized Page
 * Diğer hata sayfalarıyla (Split Screen) uyumlu tasarım.
 */
export default function UnauthorizedPage() {
  const navigate = useNavigate();

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
      
      {/* SOL TARAF - GÖRSEL */}
      <div className="hidden lg:flex w-1/2 bg-blue-900 items-center justify-center relative overflow-hidden">
        {/* Arka plan overlay */}
        <div className="absolute inset-0 bg-black/60 z-10"></div>
        
        {/* Dekoratif Efektler (403 uyarısı için Amber/Sarı tonlar) */}
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-amber-500/30 rounded-full blur-3xl z-0"></div>
        <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-yellow-600/20 rounded-full blur-3xl z-0"></div>

        <div className="relative z-20 text-white p-12 max-w-lg">
          <h1 className="text-8xl font-bold mb-4 tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-white">
            403
          </h1>
          <h2 className="text-4xl font-bold mb-6 tracking-tight">
            Giriş İzni Yok.
          </h2>
          <p className="text-xl font-light opacity-90 leading-relaxed border-l-4 border-amber-500 pl-4">
            Bu alan sadece yetkili personele veya özel izinlere sahip kullanıcılara açıktır.
          </p>
        </div>
      </div>

      {/* SAĞ TARAF - İÇERİK */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-white">
        <div className="w-full max-w-md">
          
          {/* İkon ve Başlık */}
          <div className="mb-8 text-center sm:text-left">
            <div className="w-16 h-16 bg-amber-50 rounded-2xl flex items-center justify-center mb-6 mx-auto sm:mx-0 border border-amber-100">
              <ShieldAlert className="w-8 h-8 text-amber-600" strokeWidth={2} />
            </div>
            
            <h2 className="text-3xl font-bold text-gray-900 mb-2">
              Erişim Reddedildi
            </h2>
            <p className="text-gray-500 text-lg">
              Bu sayfayı görüntülemek için gerekli yetkilere sahip değilsiniz.
            </p>
          </div>

          {/* Aksiyon Butonları */}
          <div className="space-y-4">
            
            {/* Ana Sayfa Butonu (Primary) */}
            <button 
              onClick={() => navigate('/')}
              className="w-full bg-blue-900 text-white font-bold py-4 rounded-lg hover:bg-blue-800 transition transform active:scale-95 shadow-lg shadow-blue-900/20 flex items-center justify-center gap-3"
            >
              <Home size={20} />
              Ana Akışa Dön
            </button>

            {/* Geri Dön Butonu (Secondary) */}
            <button
              onClick={handleGoBack}
              className="w-full bg-white text-gray-700 border border-gray-200 font-bold py-4 rounded-lg hover:bg-gray-50 hover:text-gray-900 transition flex items-center justify-center gap-3"
            >
              <ArrowLeft size={20} />
              Bir Önceki Sayfaya Git
            </button>
          </div>

          {/* Bilgi Kutusu */}
          <div className="mt-8 pt-6 border-t border-gray-100">
            <div className="flex items-start gap-3 p-4 bg-amber-50/50 rounded-xl border border-amber-100/50">
              <Lock className="text-amber-600 shrink-0 mt-0.5" size={18} />
              <div className="text-sm text-gray-600">
                <span className="font-bold text-gray-900 block mb-1">Neden bu hatayı alıyorum?</span>
                Bu sayfa yönetici onayı veya farklı bir kullanıcı rolü gerektiriyor olabilir. Hesabınızın yetkilerini kontrol ediniz.
              </div>
            </div>
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