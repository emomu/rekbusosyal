import React, { useState, useEffect } from 'react';
import { Cookie, Settings, X, Check } from 'lucide-react';
import { hasConsentGiven, saveCookiePreferences, getDefaultPreferences, getCookiePreferences } from '../utils/cookieManager';

export default function CookieConsent() {
  const [showBanner, setShowBanner] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [preferences, setPreferences] = useState(getDefaultPreferences());

  useEffect(() => {
    // Eğer daha önce onay verilmemişse banner'ı göster
    if (!hasConsentGiven()) {
      setShowBanner(true);
    } else {
      // Mevcut tercihleri yükle
      const savedPreferences = getCookiePreferences();
      if (savedPreferences) {
        setPreferences(savedPreferences);
      }
    }
  }, []);

  const handleAcceptAll = () => {
    const allAccepted = {
      necessary: true,
      functional: true,
      analytics: true,
      marketing: true
    };
    saveCookiePreferences(allAccepted);
    setPreferences(allAccepted);
    setShowBanner(false);
    setShowSettings(false);
    // Sayfayı yenile ki cache sistemi aktif olsun
    window.location.reload();
  };

  const handleAcceptNecessary = () => {
    const necessaryOnly = {
      necessary: true,
      functional: false,
      analytics: false,
      marketing: false
    };
    saveCookiePreferences(necessaryOnly);
    setPreferences(necessaryOnly);
    setShowBanner(false);
    setShowSettings(false);
    // Sayfayı yenile
    window.location.reload();
  };

  const handleSavePreferences = () => {
    saveCookiePreferences(preferences);
    setShowBanner(false);
    setShowSettings(false);
    // Sayfayı yenile ki ayarlar aktif olsun
    window.location.reload();
  };

  const togglePreference = (key) => {
    if (key === 'necessary') return; // Zorunlu cookie'ler kapatılamaz
    setPreferences(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  if (!showBanner) return null;

  return (
    <>
      {/* Backdrop */}
      {showSettings && (
        <div
          className="fixed inset-0 bg-black/50 z-[100] animate-fade-in"
          onClick={() => setShowSettings(false)}
        />
      )}

      {/* Cookie Settings Modal */}
      {showSettings && (
        <div className="fixed inset-0 z-[101] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto animate-scale-in">
            {/* Header */}
            <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                  <Settings size={20} className="text-blue-600" />
                </div>
                <h2 className="text-xl font-bold text-gray-900">Cookie Ayarları</h2>
              </div>
              <button
                onClick={() => setShowSettings(false)}
                className="p-2 hover:bg-gray-100 rounded-full transition"
              >
                <X size={20} className="text-gray-500" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 space-y-6">
              {/* Necessary Cookies */}
              <div className="border border-gray-200 rounded-xl p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900 mb-1">Zorunlu Çerezler</h3>
                    <p className="text-sm text-gray-600">
                      Bu çerezler web sitesinin çalışması için gereklidir ve devre dışı bırakılamaz.
                      Kimlik doğrulama, güvenlik ve temel site fonksiyonları için kullanılır.
                    </p>
                  </div>
                  <div className="ml-4">
                    <div className="w-12 h-6 bg-blue-600 rounded-full flex items-center justify-end px-1">
                      <div className="w-4 h-4 bg-white rounded-full"></div>
                    </div>
                  </div>
                </div>
                <div className="text-xs text-gray-500">
                  <span className="font-medium">Örnekler:</span> Oturum yönetimi, güvenlik token'ları
                </div>
              </div>

              {/* Functional Cookies */}
              <div className="border border-gray-200 rounded-xl p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900 mb-1">Fonksiyonel Çerezler</h3>
                    <p className="text-sm text-gray-600">
                      Gelişmiş özellikler ve kişiselleştirme sağlar. Tercihlerinizi hatırlar ve
                      deneyiminizi iyileştirir.
                    </p>
                  </div>
                  <div className="ml-4">
                    <button
                      onClick={() => togglePreference('functional')}
                      className={`w-12 h-6 rounded-full transition-colors duration-200 flex items-center ${
                        preferences.functional ? 'bg-blue-600 justify-end' : 'bg-gray-300 justify-start'
                      } px-1`}
                    >
                      <div className="w-4 h-4 bg-white rounded-full"></div>
                    </button>
                  </div>
                </div>
                <div className="text-xs text-gray-500">
                  <span className="font-medium">Örnekler:</span> Dil tercihi, tema ayarları
                </div>
              </div>

              {/* Analytics Cookies */}
              <div className="border border-gray-200 rounded-xl p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900 mb-1">Analiz Çerezleri</h3>
                    <p className="text-sm text-gray-600">
                      Sitenin nasıl kullanıldığını anlamamıza yardımcı olur. Ziyaretçi istatistikleri
                      ve kullanım analizleri için kullanılır.
                    </p>
                  </div>
                  <div className="ml-4">
                    <button
                      onClick={() => togglePreference('analytics')}
                      className={`w-12 h-6 rounded-full transition-colors duration-200 flex items-center ${
                        preferences.analytics ? 'bg-blue-600 justify-end' : 'bg-gray-300 justify-start'
                      } px-1`}
                    >
                      <div className="w-4 h-4 bg-white rounded-full"></div>
                    </button>
                  </div>
                </div>
                <div className="text-xs text-gray-500">
                  <span className="font-medium">Örnekler:</span> Google Analytics, kullanım metrikleri
                </div>
              </div>

              {/* Marketing Cookies */}
              <div className="border border-gray-200 rounded-xl p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900 mb-1">Pazarlama Çerezleri</h3>
                    <p className="text-sm text-gray-600">
                      İlgi alanlarınıza uygun içerik göstermek için kullanılır. Kişiselleştirilmiş
                      reklamlar ve öneriler sağlar.
                    </p>
                  </div>
                  <div className="ml-4">
                    <button
                      onClick={() => togglePreference('marketing')}
                      className={`w-12 h-6 rounded-full transition-colors duration-200 flex items-center ${
                        preferences.marketing ? 'bg-blue-600 justify-end' : 'bg-gray-300 justify-start'
                      } px-1`}
                    >
                      <div className="w-4 h-4 bg-white rounded-full"></div>
                    </button>
                  </div>
                </div>
                <div className="text-xs text-gray-500">
                  <span className="font-medium">Örnekler:</span> Hedefli reklamlar, içerik önerileri
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="sticky bottom-0 bg-white border-t border-gray-200 p-6 flex gap-3">
              <button
                onClick={handleSavePreferences}
                className="flex-1 bg-blue-600 text-white py-3 rounded-xl font-medium hover:bg-blue-700 transition flex items-center justify-center gap-2"
              >
                <Check size={18} /> Tercihleri Kaydet
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Cookie Banner */}
      <div className="fixed bottom-0 left-0 right-0 z-50 p-4 md:p-6 animate-slide-up">
        <div className="max-w-6xl mx-auto bg-white rounded-2xl shadow-2xl border border-gray-200">
          <div className="p-6 md:p-8">
            <div className="flex flex-col md:flex-row items-start gap-6">
              {/* Icon */}
              <div className="hidden md:flex w-12 h-12 bg-blue-100 rounded-full items-center justify-center flex-shrink-0">
                <Cookie size={24} className="text-blue-600" />
              </div>

              {/* Content */}
              <div className="flex-1">
                <h3 className="text-lg font-bold text-gray-900 mb-2">
                  Bu site çerezleri kullanıyor
                </h3>
                <p className="text-sm text-gray-600 leading-relaxed">
                  Deneyiminizi geliştirmek, içeriği kişiselleştirmek ve site trafiğini analiz etmek için çerezler kullanıyoruz.
                  Siteyi kullanmaya devam ederek çerez kullanımımızı kabul etmiş olursunuz.
                </p>
              </div>

              {/* Actions */}
              <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
                <button
                  onClick={() => setShowSettings(true)}
                  className="px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-xl font-medium hover:bg-gray-50 transition whitespace-nowrap"
                >
                  Ayarlar
                </button>
                <button
                  onClick={handleAcceptNecessary}
                  className="px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-xl font-medium hover:bg-gray-50 transition whitespace-nowrap"
                >
                  Sadece Zorunlu
                </button>
                <button
                  onClick={handleAcceptAll}
                  className="px-6 py-3 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition whitespace-nowrap"
                >
                  Tümünü Kabul Et
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
