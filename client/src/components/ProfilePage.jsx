import React, { useState, useEffect } from 'react';
import { Camera, User, Lock, Mail, Calendar, Edit2, Check, X } from 'lucide-react';
import { API_URL } from '../config/api';

export default function ProfilePage() {
  const [profile, setProfile] = useState(null);
  const [isEditingUsername, setIsEditingUsername] = useState(false);
  const [isEditingPassword, setIsEditingPassword] = useState(false);
  const [isEditingPicture, setIsEditingPicture] = useState(false);
  const [isEditingBio, setIsEditingBio] = useState(false);
  const [newUsername, setNewUsername] = useState('');
  const [profilePictureUrl, setProfilePictureUrl] = useState('');
  const [bio, setBio] = useState('');
  const [isPrivate, setIsPrivate] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const token = localStorage.getItem('token');

  // Profil bilgilerini çek
  useEffect(() => {
    fetch('${API_URL}/api/profile', {
      headers: { 'Authorization': `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => {
        if (data.error) {
          setError(data.error);
        } else {
          setProfile(data);
          setNewUsername(data.username);
          setBio(data.bio || '');
          setIsPrivate(data.isPrivate || false);
        }
      })
      .catch(err => setError('Profil yüklenemedi'));
  }, [token]);

  // Profil resmi dosyadan yükle
  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Dosya boyutu kontrolü (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError('Dosya boyutu en fazla 5MB olabilir');
      return;
    }

    // Dosya tipi kontrolü
    if (!file.type.startsWith('image/')) {
      setError('Sadece resim dosyaları yüklenebilir');
      return;
    }

    // FileReader ile base64'e çevir
    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64String = reader.result;

      try {
        const res = await fetch('${API_URL}/api/profile/picture', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ profilePicture: base64String })
        });

        const data = await res.json();
        if (res.ok) {
          setProfile({ ...profile, profilePicture: data.profilePicture });
          setIsEditingPicture(false);
          setSuccess('Profil resmi güncellendi');
          setTimeout(() => setSuccess(''), 3000);
        } else {
          setError(data.error);
        }
      } catch (err) {
        setError('Bir hata oluştu');
      }
    };
    reader.readAsDataURL(file);
  };

  // Profil resmi URL ile güncelle
  const handleUpdatePicture = async () => {
    if (!profilePictureUrl.trim()) {
      setError('Lütfen bir URL girin');
      return;
    }

    try {
      const res = await fetch('${API_URL}/api/profile/picture', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ profilePicture: profilePictureUrl })
      });

      const data = await res.json();
      if (res.ok) {
        setProfile({ ...profile, profilePicture: data.profilePicture });
        setProfilePictureUrl('');
        setIsEditingPicture(false);
        setSuccess('Profil resmi güncellendi');
        setTimeout(() => setSuccess(''), 3000);
      } else {
        setError(data.error);
      }
    } catch (err) {
      setError('Bir hata oluştu');
    }
  };

  // Kullanıcı adı güncelle
  const handleUpdateUsername = async () => {
    if (!newUsername.trim()) {
      setError('Kullanıcı adı boş olamaz');
      return;
    }

    try {
      const res = await fetch('${API_URL}/api/profile/username', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ newUsername })
      });

      const data = await res.json();
      if (res.ok) {
        setProfile({ ...profile, username: data.username });
        localStorage.setItem('token', data.token);
        localStorage.setItem('username', data.username);
        setIsEditingUsername(false);
        setSuccess('Kullanıcı adı güncellendi');
        setTimeout(() => setSuccess(''), 3000);
      } else {
        setError(data.error);
      }
    } catch (err) {
      setError('Bir hata oluştu');
    }
  };

  // Şifre güncelle
  const handleUpdatePassword = async () => {
    setError('');

    if (!currentPassword || !newPassword || !confirmPassword) {
      setError('Tüm alanları doldurun');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Yeni şifreler eşleşmiyor');
      return;
    }

    if (newPassword.length < 6) {
      setError('Yeni şifre en az 6 karakter olmalı');
      return;
    }

    try {
      const res = await fetch('${API_URL}/api/profile/password', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ currentPassword, newPassword })
      });

      const data = await res.json();
      if (res.ok) {
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
        setIsEditingPassword(false);
        setSuccess('Şifre güncellendi');
        setTimeout(() => setSuccess(''), 3000);
      } else {
        setError(data.error);
      }
    } catch (err) {
      setError('Bir hata oluştu');
    }
  };

  // Bio güncelle
  const handleUpdateBio = async () => {
    try {
      const res = await fetch('${API_URL}/api/profile/bio', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ bio })
      });

      const data = await res.json();
      if (res.ok) {
        setProfile({ ...profile, bio: data.bio });
        setIsEditingBio(false);
        setSuccess('Bio güncellendi');
        setTimeout(() => setSuccess(''), 3000);
      } else {
        setError(data.error);
      }
    } catch (err) {
      setError('Bir hata oluştu');
    }
  };

  // Privacy ayarını değiştir
  const handleTogglePrivacy = async () => {
    try {
      const newPrivacy = !isPrivate;
      const res = await fetch('${API_URL}/api/profile/privacy', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ isPrivate: newPrivacy })
      });

      const data = await res.json();
      if (res.ok) {
        setIsPrivate(newPrivacy);
        setProfile({ ...profile, isPrivate: newPrivacy });
        setSuccess(newPrivacy ? 'Hesap gizli yapıldı' : 'Hesap herkese açık yapıldı');
        setTimeout(() => setSuccess(''), 3000);
      } else {
        setError(data.error);
      }
    } catch (err) {
      setError('Bir hata oluştu');
    }
  };

  if (!profile) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-gray-400">Yükleniyor...</div>
      </div>
    );
  }

  return (
    <>
      {/* Header - Site temasına uygun */}
      <header className="sticky top-0 z-10 bg-white/100 backdrop-blur-md border-b border-gray-200 p-4">
        <h1 className="font-bold text-lg">Ayarlar</h1>
      </header>

      <div className="p-5 max-w-2xl mx-auto">
        {/* Bildirimler */}
        {error && (
          <div className="bg-red-50 text-red-600 p-3 rounded-lg mb-4 text-sm border border-red-100">
            {error}
          </div>
        )}

        {success && (
          <div className="bg-green-50 text-green-600 p-3 rounded-lg mb-4 text-sm border border-green-100">
            {success}
          </div>
        )}

        {/* PROFİL BÖLÜMÜ */}
        <div className="mb-6">
          <h2 className="text-sm font-semibold text-gray-900 mb-3 px-1">Profil</h2>

          {/* Profil Kartı */}
          <div className="bg-white border border-gray-100 rounded-xl p-6 mb-3">
            <div className="flex items-start gap-6">
              {/* Profil Resmi */}
              <div className="relative">
                <div className="w-20 h-20 rounded-full bg-gray-100 overflow-hidden border-2 border-gray-200">
                  {profile.profilePicture ? (
                    <img
                      src={profile.profilePicture}
                      alt="Profil"
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.target.style.display = 'none';
                        e.target.parentElement.innerHTML = '<div class="w-full h-full flex items-center justify-center text-gray-400"><svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg></div>';
                      }}
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400">
                      <User size={32} />
                    </div>
                  )}
                </div>
                <button
                  onClick={() => setIsEditingPicture(!isEditingPicture)}
                  className="absolute -bottom-1 -right-1 bg-blue-600 text-white p-1.5 rounded-full hover:bg-blue-700 transition shadow-md"
                >
                  <Camera size={14} />
                </button>
              </div>

              {/* Kullanıcı Bilgileri */}
              <div className="flex-1">
                <h3 className="text-xl font-bold text-gray-900">{profile.fullName}</h3>
                <p className="text-gray-500 text-sm">@{profile.username}</p>
                <p className="text-gray-400 text-xs mt-1">{profile.email}</p>
              </div>
            </div>

            {/* Profil Resmi Düzenleme */}
            {isEditingPicture && (
              <div className="mt-4 pt-4 border-t border-gray-100 space-y-3">
                {/* Dosyadan Yükle */}
                <div>
                  <label className="text-xs text-gray-500 mb-2 block">Bilgisayardan Yükle</label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileUpload}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-600 hover:file:bg-blue-100 cursor-pointer"
                  />
                  <p className="text-xs text-gray-400 mt-1">Maksimum 5MB, JPG/PNG formatında</p>
                </div>

                {/* Veya URL ile */}
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-200"></div>
                  </div>
                  <div className="relative flex justify-center text-xs">
                    <span className="bg-white px-2 text-gray-400">veya</span>
                  </div>
                </div>

                <div>
                  <label className="text-xs text-gray-500 mb-2 block">URL ile Ekle</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="https://example.com/foto.jpg"
                      value={profilePictureUrl}
                      onChange={(e) => setProfilePictureUrl(e.target.value)}
                      className="flex-1 px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm outline-none focus:border-blue-500 focus:bg-white transition placeholder:text-gray-400"
                    />
                    <button
                      onClick={handleUpdatePicture}
                      className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition flex items-center gap-1"
                    >
                      <Check size={16} /> Kaydet
                    </button>
                  </div>
                </div>

                <button
                  onClick={() => {
                    setIsEditingPicture(false);
                    setProfilePictureUrl('');
                  }}
                  className="w-full bg-gray-100 text-gray-700 py-2 rounded-lg text-sm hover:bg-gray-200 transition"
                >
                  İptal
                </button>
              </div>
            )}
          </div>

          {/* Bio */}
          <div className="bg-white border border-gray-100 rounded-xl p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2 text-xs text-gray-500">
                <User size={14} />
                <span>Bio</span>
              </div>
              {!isEditingBio && (
                <button
                  onClick={() => setIsEditingBio(true)}
                  className="text-blue-600 hover:text-blue-700 text-xs font-medium flex items-center gap-1"
                >
                  <Edit2 size={12} /> Düzenle
                </button>
              )}
            </div>

            {isEditingBio ? (
              <div className="space-y-2">
                <textarea
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  maxLength={160}
                  rows={3}
                  placeholder="Kendinizden bahsedin..."
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm outline-none focus:border-blue-500 focus:bg-white transition placeholder:text-gray-400 resize-none"
                />
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-400">{bio.length}/160</span>
                  <div className="flex gap-2">
                    <button
                      onClick={handleUpdateBio}
                      className="px-3 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-medium hover:bg-blue-700 transition"
                    >
                      Kaydet
                    </button>
                    <button
                      onClick={() => {
                        setIsEditingBio(false);
                        setBio(profile.bio || '');
                      }}
                      className="px-3 py-1.5 bg-gray-100 text-gray-700 rounded-lg text-xs hover:bg-gray-200 transition"
                    >
                      İptal
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-sm text-gray-700">
                {profile.bio || <span className="text-gray-400 italic">Bio eklenmemiş</span>}
              </div>
            )}
          </div>
        </div>

        {/* HESAP BİLGİLERİ BÖLÜMÜ */}
        <div className="mb-6">
          <h2 className="text-sm font-semibold text-gray-900 mb-3 px-1">Hesap Bilgileri</h2>
          <div className="space-y-3">
            {/* Kullanıcı Adı */}
            <div className="bg-white border border-gray-100 rounded-xl p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <User size={14} />
                  <span>Kullanıcı Adı</span>
                </div>
                {!isEditingUsername && (
                  <button
                    onClick={() => setIsEditingUsername(true)}
                    className="text-blue-600 hover:text-blue-700 text-xs font-medium flex items-center gap-1"
                  >
                    <Edit2 size={12} /> Düzenle
                  </button>
                )}
              </div>

              {isEditingUsername ? (
                <div className="space-y-2">
                  <input
                    type="text"
                    value={newUsername}
                    onChange={(e) => setNewUsername(e.target.value)}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm outline-none focus:border-blue-500 focus:bg-white transition placeholder:text-gray-400"
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={handleUpdateUsername}
                      className="flex-1 bg-blue-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition"
                    >
                      Kaydet
                    </button>
                    <button
                      onClick={() => {
                        setIsEditingUsername(false);
                        setNewUsername(profile.username);
                      }}
                      className="flex-1 bg-gray-100 text-gray-700 py-2 rounded-lg text-sm hover:bg-gray-200 transition"
                    >
                      İptal
                    </button>
                  </div>
                </div>
              ) : (
                <div className="text-sm text-gray-900 font-medium">@{profile.username}</div>
              )}
            </div>

            {/* Email */}
            <div className="bg-gray-50 border border-gray-100 rounded-xl p-4">
              <div className="flex items-center gap-2 text-xs text-gray-500 mb-1">
                <Mail size={14} />
                <span>Email Adresi</span>
              </div>
              <div className="text-sm text-gray-700">{profile.email}</div>
              <div className="text-xs text-gray-400 mt-1">Email adresi değiştirilemez</div>
            </div>

            {/* Doğum Tarihi */}
            <div className="bg-gray-50 border border-gray-100 rounded-xl p-4">
              <div className="flex items-center gap-2 text-xs text-gray-500 mb-1">
                <Calendar size={14} />
                <span>Doğum Tarihi</span>
              </div>
              <div className="text-sm text-gray-700">
                {new Date(profile.birthDate).toLocaleDateString('tr-TR', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </div>
              <div className="text-xs text-gray-400 mt-1">Doğum tarihi değiştirilemez</div>
            </div>
          </div>
        </div>

        {/* GİZLİLİK VE GÜVENLİK BÖLÜMÜ */}
        <div className="mb-6">
          <h2 className="text-sm font-semibold text-gray-900 mb-3 px-1">Gizlilik ve Güvenlik</h2>
          <div className="space-y-3">
            {/* Gizli Hesap */}
            <div className="bg-white border border-gray-100 rounded-xl p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2 text-sm font-medium text-gray-900 mb-1">
                    <Lock size={16} />
                    <span>Gizli Hesap</span>
                  </div>
                  <p className="text-xs text-gray-500">
                    {isPrivate
                      ? 'Sadece takipçileriniz gönderilerinizi görebilir'
                      : 'Herkes gönderilerinizi görebilir'}
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isPrivate}
                    onChange={handleTogglePrivacy}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>
            </div>

            {/* Şifre Değiştir */}
            <div className="bg-white border border-gray-100 rounded-xl p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <Lock size={14} />
                  <span>Şifre</span>
                </div>
                {!isEditingPassword && (
                  <button
                    onClick={() => setIsEditingPassword(true)}
                    className="text-blue-600 hover:text-blue-700 text-xs font-medium flex items-center gap-1"
                  >
                    <Edit2 size={12} /> Değiştir
                  </button>
                )}
              </div>

              {isEditingPassword ? (
                <div className="space-y-3">
                  <input
                    type="password"
                    placeholder="Mevcut şifre"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm outline-none focus:border-blue-500 focus:bg-white transition placeholder:text-gray-400"
                  />
                  <input
                    type="password"
                    placeholder="Yeni şifre"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm outline-none focus:border-blue-500 focus:bg-white transition placeholder:text-gray-400"
                  />
                  <input
                    type="password"
                    placeholder="Yeni şifre tekrar"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm outline-none focus:border-blue-500 focus:bg-white transition placeholder:text-gray-400"
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={handleUpdatePassword}
                      className="flex-1 bg-blue-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition"
                    >
                      Şifreyi Güncelle
                    </button>
                    <button
                      onClick={() => {
                        setIsEditingPassword(false);
                        setCurrentPassword('');
                        setNewPassword('');
                        setConfirmPassword('');
                        setError('');
                      }}
                      className="flex-1 bg-gray-100 text-gray-700 py-2 rounded-lg text-sm hover:bg-gray-200 transition"
                    >
                      İptal
                    </button>
                  </div>
                </div>
              ) : (
                <div className="text-sm text-gray-400">••••••••</div>
              )}
            </div>
          </div>
        </div>

        {/* Güvenlik Notu */}
        <div className="p-4 bg-blue-50 border border-blue-100 rounded-xl">
          <p className="text-xs text-blue-600">
            <strong>Güvenlik:</strong> Profil bilgileriniz güvenli şekilde saklanmaktadır.
            Şifrenizi kimseyle paylaşmayın.
          </p>
        </div>
      </div>
    </>
  );
}
