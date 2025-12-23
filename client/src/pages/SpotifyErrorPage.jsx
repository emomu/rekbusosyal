import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Music, Home, Settings, ArrowLeft, Copy, CheckCircle } from 'lucide-react';

/**
 * Spotify Connection Error Page
 * ErrorPage ile aynı "Split Screen" tasarım diline sahiptir.
 */
export default function SpotifyErrorPage() {
  const navigate = useNavigate();
  const [copied, setCopied] = React.useState(false);
  const redirectUri = 'http://localhost:5001/api/spotify/callback';

  const handleCopy = () => {
    navigator.clipboard.writeText(redirectUri);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen flex bg-gray-50">

      {/* SOL TARAF - GÖRSEL */}
      <div className="hidden lg:flex w-1/2 bg-gradient-to-br from-green-900 via-emerald-800 to-green-900 items-center justify-center relative overflow-hidden">
        {/* Arka plan overlay */}
        <div className="absolute inset-0 bg-black/40 z-10"></div>

        {/* Dekoratif Efektler (Spotify yeşili temalı) */}
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-green-500/30 rounded-full blur-3xl z-0"></div>
        <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-emerald-600/20 rounded-full blur-3xl z-0"></div>

        <div className="relative z-20 text-white p-12 max-w-lg">
          <div className="w-20 h-20 bg-white/10 backdrop-blur-sm rounded-3xl flex items-center justify-center mb-6 border border-white/20">
            <Music className="w-10 h-10 text-green-400" strokeWidth={2} />
          </div>
          <h1 className="text-7xl font-bold mb-4 tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-white">
            SPOTIFY
          </h1>
          <h2 className="text-4xl font-bold mb-6 tracking-tight">
            Bağlantı Kurulmadı
          </h2>
          <p className="text-xl font-light opacity-90 leading-relaxed border-l-4 border-green-500 pl-4">
            Spotify entegrasyonu için gerekli ayarları tamamlaman gerekiyor.
          </p>
        </div>
      </div>

      {/* SAĞ TARAF - İÇERİK */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-white">
        <div className="w-full max-w-md">

          {/* İkon ve Başlık */}
          <div className="mb-8 text-center sm:text-left">
            <div className="w-16 h-16 bg-green-50 rounded-2xl flex items-center justify-center mb-6 mx-auto sm:mx-0 border border-green-100">
              <Music className="w-8 h-8 text-green-600" strokeWidth={2} />
            </div>

            <h2 className="text-3xl font-bold text-gray-900 mb-2">
              Spotify Bağlantı Hatası
            </h2>
            <p className="text-gray-500 text-lg">
              Redirect URI eksik veya hatalı yapılandırılmış.
            </p>
          </div>

          {/* Hata Açıklaması */}
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6">
            <p className="text-sm text-amber-800 leading-relaxed">
              <strong className="font-bold">Ne oldu?</strong> Spotify Developer Dashboard'da Redirect URI ayarı eksik veya yanlış yapılandırılmış.
            </p>
          </div>

          {/* Çözüm Adımları */}
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-5 mb-6">
            <p className="font-bold text-gray-900 text-sm mb-3 uppercase tracking-wider">Nasıl Düzeltilir:</p>

            <ol className="space-y-3 text-sm text-gray-700">
              <li className="flex gap-2">
                <span className="font-bold text-green-600 shrink-0">1.</span>
                <span><a href="https://developer.spotify.com/dashboard" target="_blank" rel="noopener noreferrer" className="text-green-600 hover:underline font-medium">Spotify Developer Dashboard</a>'a git</span>
              </li>
              <li className="flex gap-2">
                <span className="font-bold text-green-600 shrink-0">2.</span>
                <span>Uygulamanı seç ve <strong>Settings</strong>'e tıkla</span>
              </li>
              <li className="flex gap-2">
                <span className="font-bold text-green-600 shrink-0">3.</span>
                <span><strong>Redirect URIs</strong> bölümünde <strong>Edit</strong> butonuna tıkla</span>
              </li>
              <li className="flex gap-2">
                <span className="font-bold text-green-600 shrink-0">4.</span>
                <div className="flex-1">
                  <span className="block mb-2">Aşağıdaki URI'yi ekle:</span>
                  <div className="bg-white border border-gray-300 rounded-lg p-3 font-mono text-xs text-gray-800 flex items-center justify-between gap-2 group">
                    <code className="flex-1 break-all">{redirectUri}</code>
                    <button
                      onClick={handleCopy}
                      className="shrink-0 p-1.5 hover:bg-gray-100 rounded transition"
                      title="Kopyala"
                    >
                      {copied ? (
                        <CheckCircle size={16} className="text-green-600" />
                      ) : (
                        <Copy size={16} className="text-gray-400 group-hover:text-gray-600" />
                      )}
                    </button>
                  </div>
                </div>
              </li>
              <li className="flex gap-2">
                <span className="font-bold text-green-600 shrink-0">5.</span>
                <span><strong>Save</strong> butonuna tıkla</span>
              </li>
              <li className="flex gap-2">
                <span className="font-bold text-green-600 shrink-0">6.</span>
                <span>Ayarlar sayfasına dön ve tekrar dene</span>
              </li>
            </ol>
          </div>

          {/* Aksiyon Butonları */}
          <div className="space-y-4">

            {/* Ayarlara Git Butonu (Primary) */}
            <button
              onClick={() => navigate('/ayarlar')}
              className="w-full bg-green-600 text-white font-bold py-4 rounded-lg hover:bg-green-700 transition transform active:scale-95 shadow-lg shadow-green-600/20 flex items-center justify-center gap-3"
            >
              <Settings size={20} />
              Ayarlar Sayfasına Dön
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
              onClick={() => navigate(-1)}
              className="w-full text-gray-400 font-medium py-2 hover:text-gray-600 text-sm transition flex items-center justify-center gap-2"
            >
              <ArrowLeft size={16} />
              Bir önceki sayfaya dön
            </button>
          </div>

          {/* Yardım Linki */}
          <div className="mt-6 p-4 bg-blue-50 border border-blue-100 rounded-lg">
            <p className="text-xs text-blue-700">
              <strong>Hala sorun mu yaşıyorsun?</strong> <a href="https://github.com/anthropics/claude-code/issues" className="underline hover:text-blue-800" target="_blank" rel="noopener noreferrer">SPOTIFY_SETUP.md</a> dosyasına göz at.
            </p>
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
