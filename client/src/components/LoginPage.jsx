import React, { useState } from 'react';
import { useDispatch } from 'react-redux';
import { setCredentials } from '../store/slices/authSlice';

const LoginPage = ({ onLogin }) => {
  const dispatch = useDispatch();
  const [isLogin, setIsLogin] = useState(true);
  const [error, setError] = useState("");
  
  // --- YENİ EKLENEN STATE'LER ---
  const [showResend, setShowResend] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);

  const [formData, setFormData] = useState({
    fullName: "",
    username: "",
    email: "",
    birthDate: "",
    password: "",
    confirmPassword: ""
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // --- YENİ FONKSİYON: MAİL TEKRAR GÖNDER ---
  const handleResendEmail = async () => {
    setResendLoading(true);
    try {
      // Backend hem username hem email kabul edecek şekilde ayarlandıysa
      // Login formundaki 'username' alanını gönderiyoruz.
      const identifier = formData.username; 

      const res = await fetch('http://localhost:5001/api/resend-verification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: identifier }) 
      });
      
      const data = await res.json();
      
      if (res.status === 429) {
         alert(`Lütfen bekleyin. ${data.error}`);
      } else if (res.ok) {
         alert(data.message);
         setShowResend(false); // Başarılıysa butonu gizle
      } else {
         alert(data.error || "Mail gönderilemedi.");
      }
    } catch (err) {
      console.error(err);
      alert("Bir hata oluştu.");
    } finally {
      setResendLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setShowResend(false); // Her denemede butonu sıfırla

    if (!isLogin) {
      if (formData.password !== formData.confirmPassword) {
        setError("Şifreler birbiriyle uyuşmuyor!");
        return;
      }
      if (!formData.email.endsWith('@ogrenci.karabuk.edu.tr')) {
        setError("Lütfen geçerli bir öğrenci maili giriniz (@ogrenci.karabuk.edu.tr)");
        return;
      }
    }

    const endpoint = isLogin ? '/api/login' : '/api/register';

    try {
      const res = await fetch(`http://localhost:5001${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      const data = await res.json();

      if (!res.ok) {
        // --- DOĞRULAMA HATASI KONTROLÜ ---
        if (data.error && data.error.includes("doğrulayın")) {
          setShowResend(true);
        }
        throw new Error(data.error || "Bir hata oluştu");
      }

      if (isLogin) {
        // Redux'a kaydet
        dispatch(setCredentials({
          token: data.token,
          username: data.username,
          interests: data.interests || []
        }));
        onLogin();
      } else {
        // Kayıt başarılı olduğunda (Backend mail gönderildi mesajı döner)
        alert(data.message || "Kayıt başarılı! Lütfen mail adresinizi doğrulayın.");
        setIsLogin(true); // Giriş ekranına yönlendir
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

  // Orijinal Input Tasarımı
  const inputStyle = "w-full p-3 bg-gray-50 border border-gray-200 rounded-lg text-gray-900 focus:bg-white focus:border-black outline-none transition placeholder:text-gray-500";

  return (
    <div className="min-h-screen flex bg-gray-50">
      
      {/* SOL TARAF - GÖRSEL */}
      <div className="hidden lg:flex w-1/2 bg-blue-900 items-center justify-center relative overflow-hidden">
        <div className="absolute inset-0 bg-black/60 z-10"></div>
        <img 
          src="https://i.hizliresim.com/22fuec9.png" 
          alt="Campus Life" 
          className="absolute inset-0 w-full h-full object-cover"
        />
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
          <h2 className="text-3xl font-bold text-gray-900 mb-2">
            {isLogin ? "Tekrar Hoşgeldin" : "Öğrenci Kaydı"}
          </h2>
          <p className="text-gray-500 mb-6">
            {isLogin ? "Kaldığın yerden devam et." : "Kampüs kimliğinle aramıza katıl."}
          </p>

{error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl mb-4 animate-in fade-in slide-in-from-top-2">
              <div className="flex items-center gap-2 text-sm font-medium">
                {/* İstersen buraya bir ünlem ikonu da koyabilirsin */}
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-red-500 shrink-0" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" /></svg>
                <span>{error}</span>
              </div>
              
              {/* --- GÜNCELLENEN TASARIM --- */}
              {showResend && (
                <div className="mt-3 pt-3 border-t border-red-100 flex items-center justify-between">
                  <span className="text-xs text-red-600/80 font-medium ml-1">
                    E-posta ulaşmadı mı?
                  </span>
                  <button
                    type="button"
                    onClick={handleResendEmail}
                    disabled={resendLoading}
                    className="text-xs font-bold text-red-600 bg-white border border-red-200 hover:bg-red-50 hover:border-red-300 px-3 py-1.5 rounded-md transition-all disabled:opacity-70 disabled:cursor-not-allowed"
                  >
                    {resendLoading ? (
                      <span className="flex items-center gap-1">
                        <svg className="animate-spin h-3 w-3" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                        Gönderiliyor...
                      </span>
                    ) : (
                      'Tekrar Gönder'
                    )}
                  </button>
                </div>
              )}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-3">
            
            {!isLogin && (
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

            {!isLogin && (
              <input
                type="password" name="confirmPassword" placeholder="Şifreyi Tekrar Gir" required
                value={formData.confirmPassword}
                onChange={handleChange}
                className={inputStyle}
              />
            )}

            <button 
              type="submit" 
              className="w-full bg-blue-900 text-white font-bold py-3 mt-2 rounded-lg hover:bg-blue-800 transition transform active:scale-95 shadow-lg shadow-blue-900/20"
            >
              {isLogin ? "Giriş Yap" : "Kayıt Ol"}
            </button>
          </form>

          <div className="mt-6 text-center text-sm text-gray-500">
            {isLogin ? "Hesabın yok mu? " : "Zaten hesabın var mı? "}
            <button 
              onClick={() => { setIsLogin(!isLogin); setError(""); setShowResend(false); }} 
              className="text-blue-600 font-bold hover:underline"
            >
              {isLogin ? "Kayıt Ol" : "Giriş Yap"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;