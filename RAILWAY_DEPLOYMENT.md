# Railway.app Deployment Rehberi

## Environment Variables (Ortam Değişkenleri)

Railway.app projenizde aşağıdaki environment variable'ları ayarlamanız gerekiyor:

### 🔐 Zorunlu Değişkenler

```bash
# MongoDB Connection
MONGO_URI=mongodb+srv://kullanici:sifre@cluster.mongodb.net/kbusosyal

# JWT Secret (Güvenlik için rastgele bir string)
JWT_SECRET=cok_gizli_ve_uzun_rastgele_bir_anahtar

# Email Settings (Gmail App Password gerekli)
EMAIL_USER=infokbusosyal@gmail.com
EMAIL_PASS=xxxxxxxxxxxxxxxx

# Backend URL (Railway'in size verdiği URL)
BACKEND_URL=https://your-backend-url.railway.app

# Frontend URL (Railway'in size verdiği URL - aynı olabilir)
FRONTEND_URL=https://your-backend-url.railway.app

# Node Environment
NODE_ENV=production
```

## 📧 Gmail App Password Alma

Email doğrulama sisteminin çalışması için Gmail App Password gereklidir:

1. Google Hesabınıza gidin: https://myaccount.google.com/
2. "Security" (Güvenlik) sekmesine tıklayın
3. "2-Step Verification" (2 Adımlı Doğrulama) açık olmalı
4. "App passwords" (Uygulama şifreleri) bölümüne gidin
5. "Mail" için yeni bir app password oluşturun
6. Oluşturulan 16 haneli şifreyi `EMAIL_PASS` olarak kullanın
   - **ÖNEMLİ:** Railway'de boşluksuz girin: `xxxxxxxxxxxxxxxx`
   - Örnek: `bfufcnuphlzkmcna` (boşluklar OLMADAN)

## 🚀 Deployment Adımları

1. **Railway.app'e Giriş Yapın**
   - GitHub hesabınızla giriş yapın

2. **New Project Oluşturun**
   - "Deploy from GitHub repo" seçeneğini seçin
   - Bu repository'yi seçin

3. **Environment Variables Ekleyin**
   - Settings > Variables bölümünden yukarıdaki tüm değişkenleri ekleyin
   - BACKEND_URL ve FRONTEND_URL'yi Railway'in size verdiği URL ile güncelleyin

4. **Deploy Edin**
   - Railway otomatik olarak deploy edecektir
   - Build loglarını kontrol edin

## ⚠️ Önemli Notlar

### Email Gönderme Sorunu
Eğer kayıt olduktan sonra "Mail gönderilemedi" veya "Connection timeout" hatası alıyorsanız:

1. **Environment Variables Kontrol Edin:**
   - `EMAIL_USER` doğru mu? (Örn: infokbusosyal@gmail.com)
   - `EMAIL_PASS` doğru App Password mi?
   - **BOŞLUKLAR OLMADAN** girdiniz mi? (Örn: `bfufcnuphlzkmcna`)
   - Railway'de tırnak işaretleri kullanmayın

2. **Gmail Ayarları:**
   - 2-Step Verification açık mı?
   - App Password oluşturuldu mu?
   - Doğru App Password'ü kopyaladınız mı?

3. **Railway Logs:**
   - Railway dashboard'dan "Deployments" > "View Logs" ile hataları kontrol edin
   - "✅ Mail server hazır" mesajını görüyor musunuz?
   - "❌ Mail server bağlantısı başarısız" görüyorsanız EMAIL_PASS yanlış

4. **Test Edin:**
   - Railway'de deploy sonrası "✅ Mail server hazır" logunu arayın
   - Bu log yoksa environment variables yanlış yapılandırılmış

### Backend URL ve Frontend URL
- Eğer monorepo (tek proje) kullanıyorsanız, her ikisi de aynı URL olabilir
- Railway otomatik olarak hem frontend hem backend'i aynı domain'den serve eder

### MongoDB Atlas
- MongoDB Atlas'ın IP Whitelist ayarlarını kontrol edin
- "Allow access from anywhere" (0.0.0.0/0) seçeneği aktif olmalı

## 🐛 Troubleshooting

### "Failed to load resource: 400" Hatası
Bu hata kayıt sırasında email gönderilemediğinde oluşur:
- Yukarıdaki Email Gönderme Sorunu adımlarını takip edin

### "CORS Error"
- `FRONTEND_URL` environment variable'ı doğru ayarlanmalı
- Railway URL'inizi kullanın

### "MongoDB Connection Failed"
- `MONGO_URI` doğru formatta olmalı
- MongoDB Atlas IP Whitelist ayarlarını kontrol edin

## 📝 Değişiklik Sonrası Deploy

Kod değişikliği yaptığınızda:
1. GitHub'a push edin
2. Railway otomatik olarak yeniden deploy edecektir
3. Environment variables değişmediyse tekrar ayarlamanıza gerek yok

## 🎯 Başarılı Deploy Kontrolü

1. Railway URL'inizi tarayıcıda açın
2. Kayıt olmayı deneyin
3. Email gelip gelmediğini kontrol edin (spam klasörünü de kontrol edin)
4. Email'deki doğrulama linkine tıklayın
5. Giriş yapabildiğinizi kontrol edin
