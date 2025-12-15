import React from 'react';
import { useNavigate } from 'react-router-dom';
import { FileQuestion, Home, ArrowLeft, Search } from 'lucide-react';

/**
 * 404 Not Found Page
 * LoginPage tasarım diline (Split Screen) uyarlanmıştır.
 */
export default function NotFoundPage() {
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
      
      {/* SOL TARAF - GÖRSEL (LoginPage ile aynı yapı) */}
      <div className="hidden lg:flex w-1/2 bg-blue-900 items-center justify-center relative overflow-hidden">
        {/* Arka plan overlay */}
        <div className="absolute inset-0 bg-black/60 z-10"></div>
        
        {/* Dekoratif Arka Plan Efekti (Opsiyonel) */}
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl z-0"></div>
        <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-red-500/20 rounded-full blur-3xl z-0"></div>

        <div className="relative z-20 text-white p-12 max-w-lg">
          <h1 className="text-8xl font-bold mb-4 tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-gray-200 to-white">
            404
          </h1>
          <h2 className="text-4xl font-bold mb-6 tracking-tight">
            Yolunu mu kaybettin?
          </h2>
          <p className="text-xl font-light opacity-90 leading-relaxed border-l-4 border-red-500 pl-4">
            Bazen kaybolmak, yeni yollar keşfetmenin başlangıcıdır. Ancak bu yol maalesef çıkmaz sokak.
          </p>
        </div>
      </div>

      {/* SAĞ TARAF - İÇERİK (LoginPage Form alanı yapısı) */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-white">
        <div className="w-full max-w-md">
          
          {/* İkon ve Başlık */}
          <div className="mb-8 text-center sm:text-left">
            <div className="w-16 h-16 bg-red-50 rounded-2xl flex items-center justify-center mb-6 mx-auto sm:mx-0">
              <FileQuestion className="w-8 h-8 text-red-600" strokeWidth={2} />
            </div>
            
            <h2 className="text-3xl font-bold text-gray-900 mb-2">
              Sayfa Bulunamadı
            </h2>
            <p className="text-gray-500 text-lg">
              Aradığın sayfa silinmiş, taşınmış veya bağlantı hatalı olabilir.
            </p>
          </div>

          {/* Aksiyon Butonları - Login Form Input/Button stili */}
          <div className="space-y-4">
            
            {/* Ana Sayfa Butonu (Login butonu ile aynı stil) */}
            <button 
              onClick={() => navigate('/')}
              className="w-full bg-blue-900 text-white font-bold py-4 rounded-lg hover:bg-blue-800 transition transform active:scale-95 shadow-lg shadow-blue-900/20 flex items-center justify-center gap-3"
            >
              <Home size={20} />
              Ana Akışa Dön
            </button>

            {/* Geri Dön Butonu (İkincil buton stili) */}
            <button
              onClick={handleGoBack}
              className="w-full bg-gray-50 text-gray-700 border border-gray-200 font-bold py-4 rounded-lg hover:bg-gray-100 hover:text-gray-900 transition flex items-center justify-center gap-3"
            >
              <ArrowLeft size={20} />
              Bir Önceki Sayfaya Git
            </button>
          </div>

          {/* Alt Bilgi / Arama İpucu */}
          <div className="mt-8 pt-8 border-t border-gray-100">
            <div className="flex items-start gap-3 p-4 bg-blue-50/50 rounded-xl border border-blue-100">
              <Search className="text-blue-600 shrink-0 mt-0.5" size={20} />
              <div className="text-sm text-gray-600">
                <span className="font-bold text-gray-900 block mb-1">Aradığını bulamadın mı?</span>
                Ana sayfadaki arama özelliğini kullanarak itiraflar, kullanıcılar veya konular arasında gezinebilirsin.
              </div>
            </div>
          </div>
          
          {/* Marka Footer (Login page altındaki gibi) */}
          <div className="mt-8 text-center">
             <p className="text-xs text-gray-400 font-medium">KBÜ Sosyal © 2025</p>
          </div>

        </div>
      </div>
    </div>
  );
}