import React, { useState } from 'react';
import { useDispatch } from 'react-redux';
import { setCredentials } from '../store/slices/authSlice';
import { API_URL } from '../config/api';
import { ToastContainer } from './Toast';
import { useToast } from '../hooks/useToast';

const LoginPage = ({ onLogin }) => {
  const dispatch = useDispatch();
  
  // GÖRÜNÜM STATE'İ: 'login' | 'register' | 'forgot'
  const [view, setView] = useState('login'); 
  
  const [error, setError] = useState("");
  const { toasts, removeToast, success, error: showError, info } = useToast();

  // --- LOADING STATES ---
  const [resendLoading, setResendLoading] = useState(false);
  const [showResend, setShowResend] = useState(false);
  const [forgotLoading, setForgotLoading] = useState(false); // Şifremi unuttum için loading

  // --- FORM DATA (LOGIN & REGISTER) ---
  const [formData, setFormData] = useState({
    fullName: "",
    username: "",
    email: "",
    birthDate: "",
    password: "",
    confirmPassword: ""
  });

  // --- FORM DATA (FORGOT PASSWORD) ---
  const [forgotEmail, setForgotEmail] = useState("");

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // --- 1. FONKSİYON: ŞİFRE SIFIRLAMA MAİLİ GÖNDER ---
  const handleForgotPassword = async (e) => {
    e.preventDefault();
    setForgotLoading(true);
    setError("");

    try {
      const res = await fetch(`${API_URL}/api/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: forgotEmail })
      });

      // --- DEĞİŞİKLİK BURADA BAŞLIYOR ---
      // Gelen cevap JSON mu kontrol et (HTML gelirse patlamasın diye)
      const contentType = res.headers.get("content-type");
      let data;

      if (contentType && contentType.includes("application/json")) {
        data = await res.json();
      } else {
        // Eğer JSON gelmediyse (muhtemelen 404 HTML sayfasıdır), manuel hata oluştur
        // Bu sayede SyntaxError almazsın, 'error' state'ine düşer.
        throw new Error("Sunucu bağlantı hatası (Endpoint bulunamadı/404).");
      }
      // -----------------------------------

      if (res.ok) {
        success(data.message || "Sıfırlama bağlantısı gönderildi.");
        info("Lütfen mail kutunuzu (spam dahil) kontrol edin.", 7000);
        setView('login'); 
        setForgotEmail(""); 
      } else {
        setError(data.error || "Bir hata oluştu.");
      }
    } catch (err) {
      console.error(err);
      // Hata mesajını ekrana bas (HTML parse hatası yerine bunu göreceksin)
      setError(err.message || "Sunucuya bağlanılamadı.");
    } finally {
      setForgotLoading(false);
    }
  };

  // --- 2. FONKSİYON: DOĞRULAMA MAİLİNİ TEKRAR GÖNDER ---
  const handleResendEmail = async () => {
    setResendLoading(true);
    try {
      const identifier = formData.username; // Kullanıcı adını al

      const res = await fetch(`${API_URL}/api/resend-verification`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: identifier })
      });

      const data = await res.json();

      if (res.status === 429) {
         showError(`Lütfen bekleyin. ${data.error}`);
      } else if (res.ok) {
         success(data.message);
         setShowResend(false);
      } else {
         showError(data.error || "Mail gönderilemedi.");
      }
    } catch (err) {
      console.error(err);
      showError("Bir hata oluştu.");
    } finally {
      setResendLoading(false);
    }
  };

  // --- 3. FONKSİYON: GİRİŞ VE KAYIT OLMA ---
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setShowResend(false);

    // Register Validasyonları
    if (view === 'register') {
      if (formData.password !== formData.confirmPassword) {
        setError("Şifreler birbiriyle uyuşmuyor!");
        return;
      }
      if (!formData.email.endsWith('@ogrenci.karabuk.edu.tr')) {
        setError("Lütfen geçerli bir öğrenci maili giriniz (@ogrenci.karabuk.edu.tr)");
        return;
      }
    }

    const endpoint = view === 'login' ? '/api/login' : '/api/register';

    try {
      const res = await fetch(`${API_URL}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      const data = await res.json();

      if (!res.ok) {
        // Doğrulama hatası varsa butonu göster
        if (data.error && data.error.includes("doğrulayın")) {
          setShowResend(true);
        }
        throw new Error(data.error || "Bir hata oluştu");
      }

      if (view === 'login') {
        // Redux'a kaydet ve giriş yap
        dispatch(setCredentials({
          token: data.token,
          username: data.username,
          interests: data.interests || []
        }));
        onLogin();
      } else {
        // Kayıt başarılı
        success(data.message || "Kayıt başarılı! Lütfen mail adresinizi doğrulayın.", 5000);
        info("Doğrulama maili gönderildi. Lütfen okul mailinizi kontrol edin.", 5000);
        setView('login'); // Giriş ekranına yönlendir
        setFormData({
          fullName: "",
          username: "",
          email: "",
          birthDate: "",
          password: "",
          confirmPassword: ""
        });
      }
    } catch (err) {
      setError(err.message);
    }
  };

  // Ortak Input Stili
  const inputStyle = "w-full p-3 bg-gray-50 border border-gray-200 rounded-lg text-gray-900 focus:bg-white focus:border-black outline-none transition placeholder:text-gray-500";

  // Başlık ve Açıklamayı Dinamik Ayarla
  const getTitle = () => {
    if (view === 'login') return "Tekrar Hoşgeldin";
    if (view === 'register') return "Öğrenci Kaydı";
    return "Şifremi Unuttum";
  };

  const getSubtitle = () => {
    if (view === 'login') return "Kaldığın yerden devam et.";
    if (view === 'register') return "Kampüs kimliğinle aramıza katıl.";
    return "Mail adresini gir, sana sıfırlama linki gönderelim.";
  };

  return (
    <>
      <ToastContainer toasts={toasts} removeToast={removeToast} />
      <div className="min-h-screen flex bg-gray-50">
      
      {/* SOL TARAF - GÖRSEL (Aynı Kalıyor) */}
      <div className="hidden lg:flex w-1/2 bg-blue-900 items-center justify-center relative overflow-hidden">
        <div className="absolute inset-0 bg-black/60 z-10"></div>
        <div className="relative z-20 text-white p-12 max-w-lg">
          <h1 className=" text-6xl font-bold mb-6 tracking-tighter">KBÜ<span className="text-red-500">Sosyal</span>.</h1>
          <p className="text-xl font-light opacity-90 leading-relaxed">
            Sadece KBÜ öğrencilerine özel, güvenli ve anonim sosyal platform.
          </p>
        </div>
      </div>

      {/* SAĞ TARAF - FORM */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-white overflow-y-auto">
        <div className="w-full max-w-md">
          
          {/* Başlıklar */}
          <h2 className="text-3xl font-bold text-gray-900 mb-2">
            {getTitle()}
          </h2>
          <p className="text-gray-500 mb-6">
            {getSubtitle()}
          </p>

          {/* Hata Mesajı Alanı */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl mb-4 animate-in fade-in slide-in-from-top-2">
              <div className="flex items-center gap-2 text-sm font-medium">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-red-500 shrink-0" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" /></svg>
                <span>{error}</span>
              </div>
              
              {/* Mail Doğrulama Tekrar Gönder Butonu */}
              {showResend && view !== 'forgot' && (
                <div className="mt-3 pt-3 border-t border-red-100 flex items-center justify-between">
                  <button
                    type="button"
                    onClick={handleResendEmail}
                    disabled={resendLoading}
                    className="text-xs font-bold text-red-600 bg-white border border-red-200 hover:bg-red-50 hover:border-red-300 px-3 py-1.5 rounded-md transition-all disabled:opacity-70 disabled:cursor-not-allowed"
                  >
                    {resendLoading ? (
                      <span className="flex items-center gap-1">Gönderiliyor...</span>
                    ) : (
                      'Doğrulama Maili Gönder'
                    )}
                  </button>
                </div>
              )}
            </div>
          )}

          {/* --- VIEW 1: ŞİFREMİ UNUTTUM FORMU --- */}
          {view === 'forgot' ? (
            <form onSubmit={handleForgotPassword} className="space-y-4">
               <div>
                  <input
                    type="text"
                    name="forgotEmail"
                    placeholder="Kullanıcı Adı veya Okul Maili"
                    required
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                    className={inputStyle}
                  />
                  <p className="text-xs text-gray-400 mt-1 ml-1">
                    * Kayıtlı mail adresine link gönderilecektir.
                  </p>
               </div>

               <button 
                  type="submit" 
                  disabled={forgotLoading}
                  className="w-full bg-red-600 text-white font-bold py-3 rounded-lg hover:bg-red-700 transition transform active:scale-95 shadow-lg shadow-red-600/20 disabled:opacity-70"
                >
                  {forgotLoading ? "Gönderiliyor..." : "Sıfırlama Linki Gönder"}
                </button>

                <button 
                  type="button"
                  onClick={() => { setView('login'); setError(""); setShowResend(false); }}
                  className="w-full text-gray-500 font-medium py-2 hover:text-gray-800 text-sm transition"
                >
                  ← Giriş Ekranına Dön
                </button>
            </form>
          ) : (
            
            /* --- VIEW 2: LOGIN / REGISTER FORMU --- */
            <form onSubmit={handleSubmit} className="space-y-3">
              
              {/* Sadece Register Modunda Görünenler */}
              {view === 'register' && (
                <>
                  <input
                    type="text" name="fullName" placeholder="Ad Soyad" required
                    value={formData.fullName}
                    onChange={handleChange}
                    className={inputStyle}
                  />
                  
                  <div className="relative">
                    <input
                      type="email" name="email" placeholder="ogrenci.no@ogrenci.karabuk.edu.tr" required
                      value={formData.email}
                      onChange={handleChange}
                      className={inputStyle}
                    />
                    <div className="text-[10px] text-gray-400 mt-1 ml-1">* Sadece okul maili geçerlidir.</div>
                  </div>

                  <div className="flex flex-col">
                    <input
                      type="date" name="birthDate" required
                      value={formData.birthDate}
                      onChange={handleChange}
                      className={`${inputStyle} text-gray-600`}
                    />
                  </div>
                </>
              )}

              {/* Ortak Alanlar */}
              <input
                type="text" name="username" placeholder="Kullanıcı Adı" required
                value={formData.username}
                onChange={handleChange}
                className={inputStyle}
              />

              <input
                type="password" name="password" placeholder="Şifre" required
                value={formData.password}
                onChange={handleChange}
                className={inputStyle}
              />

              {view === 'register' && (
                <input
                  type="password" name="confirmPassword" placeholder="Şifreyi Tekrar Gir" required
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  className={inputStyle}
                />
              )}

              {/* Şifremi Unuttum Linki (Sadece Login modunda) */}
              {view === 'login' && (
                <div className="flex justify-end">
                  <button 
                    type="button" 
                    onClick={() => { setView('forgot'); setError(""); setShowResend(false); }}
                    className="text-sm text-blue-600 hover:text-blue-800 font-semibold hover:underline transition-colors"
                  >
                    Şifremi Unuttum?
                  </button>
                </div>
              )}

              <button 
                type="submit" 
                className="w-full bg-blue-900 text-white font-bold py-3 mt-2 rounded-lg hover:bg-blue-800 transition transform active:scale-95 shadow-lg shadow-blue-900/20"
              >
                {view === 'login' ? "Giriş Yap" : "Kayıt Ol"}
              </button>
            </form>
          )}

          {/* Login / Register Geçiş Alt Bilgisi (Forgot modunda gizli) */}
          {view !== 'forgot' && (
            <div className="mt-6 text-center text-sm text-gray-500">
              {view === 'login' ? "Hesabın yok mu? " : "Zaten hesabın var mı? "}
              <button 
                onClick={() => { 
                  setView(view === 'login' ? 'register' : 'login'); 
                  setError(""); 
                  setShowResend(false); 
                  setFormData({ ...formData, password: "", confirmPassword: "" }); // Şifre alanlarını temizle
                }} 
                className="text-blue-600 font-bold hover:underline"
              >
                {view === 'login' ? "Kayıt Ol" : "Giriş Yap"}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
    </>
  );
};

export default LoginPage;