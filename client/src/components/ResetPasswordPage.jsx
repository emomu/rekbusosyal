import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { API_URL } from '../config/api';
import { ToastContainer } from './Toast';
import { useToast } from '../hooks/useToast';

const ResetPasswordPage = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const navigate = useNavigate();
  const { toasts, removeToast, success } = useToast();

  // Durum Yönetimi: 'idle' | 'loading' | 'success' | 'invalid_token'
  const [status, setStatus] = useState('idle'); 
  
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [formError, setFormError] = useState("");

  // Token URL'de yoksa direkt geçersiz moduna geç
  useEffect(() => {
    if (!token) {
      setStatus('invalid_token');
    }
  }, [token]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError("");

    if (password !== confirmPassword) {
      setFormError('Şifreler birbiriyle uyuşmuyor.');
      return;
    }

    if (password.length < 6) {
      setFormError('Şifre en az 6 karakter olmalıdır.');
      return;
    }

    setStatus('loading');

    try {
      const res = await fetch(`${API_URL}/api/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, newPassword: password })
      });

      const data = await res.json();

      if (res.ok) {
        setStatus('success');
        success('Şifreniz başarıyla güncellendi! Giriş sayfasına yönlendiriliyorsunuz...');
        setTimeout(() => navigate('/login'), 3000);
      } else {
        // Backend'den 400 veya 404 dönerse bu genellikle token hatasıdır
        if (res.status === 400 || res.status === 404 || (data.error && data.error.includes('bağlantı'))) {
          setStatus('invalid_token');
        } else {
          setFormError(data.error || 'Bir hata oluştu.');
          setStatus('idle');
        }
      }
    } catch (err) {
      setFormError('Sunucu hatası oluştu.');
      setStatus('idle');
    }
  };

  const inputStyle = "w-full p-3 bg-gray-50 border border-gray-200 rounded-lg text-gray-900 focus:bg-white focus:border-black outline-none transition placeholder:text-gray-500";

  // --- İÇERİK RENDER FONKSİYONU ---
  const renderContent = () => {
    
    // 1. DURUM: GEÇERSİZ BAĞLANTI / TOKEN
    if (status === 'invalid_token') {
      return (
        <div className="text-center animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Geçersiz Bağlantı</h2>
          <p className="text-gray-500 mb-8 px-4">
            Bu şifre sıfırlama bağlantısının süresi dolmuş veya bağlantı daha önce kullanılmış. Lütfen yeni bir şifre sıfırlama isteği gönderin.
          </p>
          <button 
            onClick={() => navigate('/login')}
            className="w-full bg-blue-900 text-white font-bold py-3 rounded-lg hover:bg-blue-800 transition shadow-lg shadow-blue-900/20"
          >
            Giriş Ekranına Dön
          </button>
        </div>
      );
    }

    // 2. DURUM: BAŞARILI
    if (status === 'success') {
      return (
        <div className="text-center animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Şifre Güncellendi!</h2>
          <p className="text-gray-500 mb-4">
            Hesabınızın şifresi başarıyla değiştirildi. Giriş ekranına yönlendiriliyorsunuz...
          </p>
        </div>
      );
    }

    // 3. DURUM: FORM (IDLE veya LOADING)
    return (
      <div className="animate-in fade-in slide-in-from-bottom-2">
        <h2 className="text-3xl font-bold text-gray-900 mb-2">
          Yeni Şifre Belirle
        </h2>
        <p className="text-gray-500 mb-6">
          Hesabın için yeni ve güçlü bir şifre oluştur.
        </p>

        {formError && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl mb-4 flex items-center gap-2 text-sm font-medium">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-red-500 shrink-0" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" /></svg>
            <span>{formError}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <input
              type="password"
              placeholder="Yeni Şifre"
              required
              className={inputStyle}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <div>
            <input
              type="password"
              placeholder="Yeni Şifre (Tekrar)"
              required
              className={inputStyle}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
            />
          </div>

          <button 
            type="submit" 
            disabled={status === 'loading'}
            className="w-full bg-blue-900 text-white font-bold py-3 mt-2 rounded-lg hover:bg-blue-800 transition transform active:scale-95 shadow-lg shadow-blue-900/20 disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {status === 'loading' ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin h-5 w-5 text-white" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                Güncelleniyor...
              </span>
            ) : (
              'Şifreyi Güncelle'
            )}
          </button>
        </form>

        <div className="mt-6 text-center text-sm text-gray-500">
          <button 
            onClick={() => navigate('/login')}
            className="text-gray-500 font-medium hover:text-gray-800 transition flex items-center justify-center gap-1 mx-auto"
          >
            <span>←</span> Giriş Ekranına Dön
          </button>
        </div>
      </div>
    );
  };

  return (
    <>
      <ToastContainer toasts={toasts} removeToast={removeToast} />
      <div className="min-h-screen flex bg-gray-50">
      
        {/* SOL TARAF - GÖRSEL (Sabit) */}
        <div className="hidden lg:flex w-1/2 bg-blue-900 items-center justify-center relative overflow-hidden">
          <div className="absolute inset-0 bg-black/60 z-10"></div>
          <div className="relative z-20 text-white p-12 max-w-lg">
            <h1 className=" text-6xl font-bold mb-6 tracking-tighter">KBÜ<span className="text-red-500">Sosyal</span>.</h1>
            <p className="text-xl font-light opacity-90 leading-relaxed">
              Sadece KBÜ öğrencilerine özel, güvenli ve anonim sosyal platform.
            </p>
          </div>
        </div>

        {/* SAĞ TARAF - DİNAMİK İÇERİK */}
        <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-white overflow-y-auto">
          <div className="w-full max-w-md">
            {renderContent()}
          </div>
        </div>
      </div>
    </>
  );
};

export default ResetPasswordPage;