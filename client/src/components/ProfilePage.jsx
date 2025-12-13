import React, { useState, useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { Camera, User, Lock, Mail, Calendar, Edit2, Check, X, Trash2, FileText } from 'lucide-react';
import Lottie from 'lottie-react';
import loaderAnimation from '../assets/loader.json';
import { API_URL } from '../config/api';
import MobileHeader from './MobileHeader';
import { setActiveTab } from '../store/slices/uiSlice';
import { useToast } from '../hooks/useToast';
import { ToastContainer } from './Toast';
import { ensureHttps } from '../utils/imageUtils';
import { compressImage } from '../utils/imageCompression';
import CachedImage from './CachedImage';

export default function ProfilePage({ onMenuClick }) {
  const dispatch = useDispatch();
  const toast = useToast();
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
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);

  const token = localStorage.getItem('token');

  // Profil bilgilerini çek
  useEffect(() => {
    fetch(`${API_URL}/api/profile`, {
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
  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Dosya boyutu en fazla 5MB olabilir');
      return;
    }

    if (!file.type.startsWith('image/')) {
      toast.error('Sadece resim dosyaları yüklenebilir');
      return;
    }

    try {
      setIsUploading(true);
      setUploadProgress(0);

      // Resmi sıkıştır
      const compressedFile = await compressImage(file, {
        maxWidth: 800,
        maxHeight: 800,
        quality: 0.85
      });

      // Sıkıştırılmış dosya boyutunu kontrol et
      console.log(`Orijinal boyut: ${(file.size / 1024).toFixed(2)} KB`);
      console.log(`Sıkıştırılmış boyut: ${(compressedFile.size / 1024).toFixed(2)} KB`);

      // Use FormData for file upload
      const formData = new FormData();
      formData.append('profilePicture', compressedFile);

      // XMLHttpRequest kullanarak progress tracking
      await new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();

        // Progress event listener
        xhr.upload.addEventListener('progress', (e) => {
          if (e.lengthComputable) {
            const percentComplete = Math.round((e.loaded / e.total) * 100);
            setUploadProgress(percentComplete);
          }
        });

        // Load event listener
        xhr.addEventListener('load', () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            const data = JSON.parse(xhr.responseText);
            setProfile({ ...profile, profilePicture: data.profilePicture });
            setIsEditingPicture(false);
            toast.success('Profil resmi başarıyla güncellendi!');
            resolve(data);
          } else {
            const data = JSON.parse(xhr.responseText);
            toast.error(data.error || 'Profil resmi güncellenemedi');
            reject(new Error(data.error));
          }
        });

        // Error event listener
        xhr.addEventListener('error', () => {
          toast.error('Yükleme sırasında bir hata oluştu');
          reject(new Error('Upload failed'));
        });

        // Abort event listener
        xhr.addEventListener('abort', () => {
          toast.error('Yükleme iptal edildi');
          reject(new Error('Upload aborted'));
        });

        // Open and send request
        xhr.open('POST', `${API_URL}/api/profile/picture`);
        xhr.setRequestHeader('Authorization', `Bearer ${token}`);
        xhr.send(formData);
      });

    } catch (err) {
      console.error('Profil resmi yükleme hatası:', err);
      toast.error('Bir hata oluştu. Lütfen tekrar dene.');
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  // Profil resmi URL ile güncelle
  const handleUpdatePicture = async () => {
    if (!profilePictureUrl.trim()) {
      setError('Lütfen bir URL girin');
      return;
    }

    try {
      const res = await fetch(`${API_URL}/api/profile/picture`, {
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

  // --- YENİ EKLENEN FONKSİYON: Profil Resmini Kaldır ---
  const handleRemovePicture = async () => {
    try {
      const res = await fetch(`${API_URL}/api/profile/picture`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ profilePicture: null }) // Resmi temizle
      });

      const data = await res.json();
      if (res.ok) {
        setProfile({ ...profile, profilePicture: null });
        setIsEditingPicture(false);
        setSuccess('Profil resmi kaldırıldı');
        setTimeout(() => setSuccess(''), 3000);
      } else {
        setError(data.error);
      }
    } catch (err) {
      setError('Bir hata oluştu');
    }
  };
  // ---------------------------------------------------

  const handleUpdateUsername = async () => {
    if (!newUsername.trim()) {
      setError('Kullanıcı adı boş olamaz');
      return;
    }

    try {
      const res = await fetch(`${API_URL}/api/profile/username`, {
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
      const res = await fetch(`${API_URL}/api/profile/password`, {
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

  const handleUpdateBio = async () => {
    try {
      const res = await fetch(`${API_URL}/api/profile/bio`, {
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

  const handleTogglePrivacy = async () => {
    try {
      const newPrivacy = !isPrivate;
      const res = await fetch(`${API_URL}/api/profile/privacy`, {
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
        <div className="w-24 h-24">
          <Lottie animationData={loaderAnimation} loop={true} />
        </div>
      </div>
    );
  }

  return (
    <>
      <MobileHeader onMenuClick={onMenuClick} />
      <header className="hidden md:block sticky top-0 z-10 bg-white/100 backdrop-blur-md border-b border-gray-200 p-4">
        <h1 className="font-bold text-lg">Ayarlar</h1>
      </header>

      <div className="p-5 max-w-2xl mx-auto">
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

        <div className="mb-6">
          <h2 className="text-sm font-semibold text-gray-900 mb-3 px-1">Profil</h2>

          <div className="bg-white border border-gray-100 rounded-xl p-6 mb-3">
            <div className="flex items-start gap-6">
              <div className="relative">
                <div className="w-20 h-20 rounded-full bg-gray-100 overflow-hidden border-2 border-gray-200">
                  {profile.profilePicture ? (
                    <CachedImage
                      src={profile.profilePicture}
                      alt="Profil"
                      className="w-full h-full object-cover"
                      fallback={
                        <div className="w-full h-full flex items-center justify-center text-gray-400">
                          <User size={32} />
                        </div>
                      }
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

              <div className="flex-1">
                <h3 className="text-xl font-bold text-gray-900">{profile.fullName}</h3>
                <p className="text-gray-500 text-sm">@{profile.username}</p>
                <p className="text-gray-400 text-xs mt-1">{profile.email}</p>
              </div>
            </div>

            {isEditingPicture && (
              <div className="mt-4 pt-4 border-t border-gray-100 space-y-3">
                <div>
                  <label className="text-xs text-gray-500 mb-2 block">Bilgisayardan Yükle</label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileUpload}
                    disabled={isUploading}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-600 hover:file:bg-blue-100 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                  />
                  <p className="text-xs text-gray-400 mt-1">Maksimum 5MB, JPG/PNG formatında</p>

                  {/* Upload Progress Bar */}
                  {isUploading && (
                    <div className="mt-3">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-medium text-blue-600">Yükleniyor...</span>
                        <span className="text-xs font-medium text-blue-600">{uploadProgress}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                        <div
                          className="bg-gradient-to-r from-blue-500 to-blue-600 h-full rounded-full transition-all duration-300 ease-out"
                          style={{ width: `${uploadProgress}%` }}
                        ></div>
                      </div>
                    </div>
                  )}
                </div>

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

                {/* --- YENİ EKLENEN KISIM: Profil Resmini Kaldır Butonu --- */}
                {profile.profilePicture && (
                  <div>
                    <div className="relative flex justify-center text-xs mb-3 mt-2">
                      <span className="bg-white px-2 text-gray-400">veya</span>
                    </div>
                    <button
                      onClick={handleRemovePicture}
                      className="w-full bg-red-50 text-red-600 py-2 rounded-lg text-sm font-medium hover:bg-red-100 transition flex items-center justify-center gap-2"
                    >
                      <Trash2 size={16} /> Profil Resmini Kaldır
                    </button>
                  </div>
                )}
                {/* ------------------------------------------------------- */}

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

        <div className="mb-6">
          <h2 className="text-sm font-semibold text-gray-900 mb-3 px-1">Hesap Bilgileri</h2>
          <div className="space-y-3">
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

            <div className="bg-gray-50 border border-gray-100 rounded-xl p-4">
              <div className="flex items-center gap-2 text-xs text-gray-500 mb-1">
                <Mail size={14} />
                <span>Email Adresi</span>
              </div>
              <div className="text-sm text-gray-700">{profile.email}</div>
              <div className="text-xs text-gray-400 mt-1">Email adresi değiştirilemez</div>
            </div>

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

        <div className="mb-6">
          <h2 className="text-sm font-semibold text-gray-900 mb-3 px-1">Gizlilik ve Güvenlik</h2>
          <div className="space-y-3">
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
         <div className="p-4 bg-blue-50 border border-blue-100 rounded-xl mt-6">
          <p className="text-xs text-blue-600">
            <strong>Güvenlik:</strong> Profil bilgileriniz güvenli şekilde saklanmaktadır.
            Şifrenizi kimseyle paylaşmayın.
          </p>
        </div>

        {/* Sürüm Notları Butonu */}
        <div className="mt-6">
          <button
            onClick={() => dispatch(setActiveTab('versionNotes'))}
            className="w-full flex items-center justify-between p-4 bg-gradient-to-r from-blue-50 to-blue-100 border border-blue-200 rounded-xl hover:from-blue-100 hover:to-blue-200 transition group"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-500 rounded-lg">
                <FileText size={20} className="text-white" />
              </div>
              <div className="text-left">
                <p className="font-semibold text-gray-900">Sürüm Notları</p>
                <p className="text-xs text-gray-600">Güncellemeleri ve yenilikleri görüntüle</p>
              </div>
            </div>
            <div className="text-blue-500 group-hover:translate-x-1 transition-transform">→</div>
          </button>
        </div>


      </div>

      {/* Toast Notifications */}
      <ToastContainer toasts={toast.toasts} removeToast={toast.removeToast} />
    </>
  );
}