# Railway.app Deployment Kılavuzu

## Ön Hazırlık

### 1. MongoDB Atlas Kurulumu
1. [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) hesabı oluşturun
2. Yeni bir cluster oluşturun (ücretsiz tier yeterli)
3. Database Access'ten yeni kullanıcı oluşturun (username ve password)
4. Network Access'ten `0.0.0.0/0` IP adresini ekleyin (tüm IP'lerden erişim)
5. Connect > Connect your application'dan connection string'i kopyalayın
   - Format: `mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/kbu-sosyal`

### 2. Gmail App Password Oluşturma
1. Gmail hesabınızda 2FA (2-Factor Authentication) aktif olmalı
2. [Google App Passwords](https://myaccount.google.com/apppasswords) sayfasına gidin
3. Yeni bir app password oluşturun
4. Oluşturulan 16 haneli şifreyi kaydedin

## Railway Deployment Adımları

### 1. Railway Hesabı ve Proje Oluşturma
1. [Railway.app](https://railway.app) sitesine gidin ve GitHub ile giriş yapın
2. "New Project" > "Deploy from GitHub repo" seçin
3. Bu repository'yi seçin

### 2. Environment Variables Ayarlama
Railway dashboard'dan "Variables" sekmesine gidin ve şu değişkenleri ekleyin:

```
NODE_ENV=production
PORT=5001
MONGO_URI=mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/kbu-sosyal
JWT_SECRET=<güçlü-rastgele-bir-string>
EMAIL_USER=<gmail-adresiniz>
EMAIL_PASS=<gmail-app-password>
BACKEND_URL=https://<your-app-name>.up.railway.app
FRONTEND_URL=https://<your-app-name>.up.railway.app
```

**Önemli Notlar:**
- `MONGO_URI`: MongoDB Atlas'tan aldığınız connection string
- `JWT_SECRET`: Güçlü bir rastgele string (örn: openssl ile: `openssl rand -base64 32`)
- `EMAIL_USER`: Gmail adresiniz (örn: infokbusosyal@gmail.com)
- `EMAIL_PASS`: Google App Password (16 haneli, boşluksuz)
- `BACKEND_URL` ve `FRONTEND_URL`: Railway size otomatik verdiği domain (örn: https://kbu-sosyal-production.up.railway.app)

### 3. Deploy İşlemi
1. Railway otomatik olarak deploy işlemini başlatacak
2. Build logs'u kontrol edin:
   - `npm run install:all` - Tüm bağımlılıklar yükleniyor
   - `npm run build:client` - Frontend build ediliyor
   - `npm start` - Backend başlatılıyor

3. Deploy başarılı olduğunda, Railway size bir URL verecek
   - Bu URL'i kopyalayın (örn: `https://kbu-sosyal-production.up.railway.app`)
   - Environment Variables'a geri dönün
   - `BACKEND_URL` ve `FRONTEND_URL` değerlerini bu URL ile güncelleyin
   - Railway otomatik olarak yeniden deploy edecek

### 4. İlk Kullanıcı Oluşturma (Admin)
1. Deployment tamamlandıktan sonra sitenize gidin
2. Normal kayıt işlemi yapın
3. MongoDB Atlas'a bağlanın:
   - Atlas Console > Clusters > Browse Collections
   - Database: `kbu-sosyal` > Collection: `users`
   - İlk kullanıcınızı bulun ve `role` alanını `"admin"` olarak değiştirin

## Deployment Kontrolü

### Başarılı Deployment Kontrolleri:
- [ ] Site açılıyor mu? (FRONTEND_URL'e gidin)
- [ ] API çalışıyor mu? (`<URL>/api/posts` endpoint'ini test edin)
- [ ] Kayıt işlemi çalışıyor mu?
- [ ] Mail gönderimi çalışıyor mu?
- [ ] Mail doğrulama linki çalışıyor mu?
- [ ] Giriş yapılabiliyor mu?
- [ ] Post atılabiliyor mu?

### Sık Karşılaşılan Sorunlar:

#### 1. Build Hatası
**Hata:** `Cannot find module` veya `npm ERR!`
**Çözüm:**
- `package.json` dosyalarını kontrol edin
- Railway logs'unda hangi modülün eksik olduğunu bulun
- Gerekli bağımlılığı ilgili `package.json`'a ekleyin

#### 2. MongoDB Bağlantı Hatası
**Hata:** `MongoServerError: Authentication failed`
**Çözüm:**
- `MONGO_URI` değişkenini kontrol edin
- Username ve password'ün doğru olduğundan emin olun
- MongoDB Atlas'ta Network Access ayarlarını kontrol edin (`0.0.0.0/0` ekli mi?)

#### 3. Mail Gönderilemiyor
**Hata:** `Mail hatası` veya `Invalid login`
**Çözüm:**
- Gmail hesabında 2FA aktif mi?
- Google App Password doğru mu?
- `EMAIL_USER` ve `EMAIL_PASS` environment variables doğru girilmiş mi?

#### 4. CORS Hatası
**Çözüm:**
- `FRONTEND_URL` environment variable'ının Railway domain'i ile eşleştiğinden emin olun
- Backend `server.js` dosyasında CORS ayarlarını kontrol edin

#### 5. Static Files Bulunamıyor (404)
**Çözüm:**
- `NODE_ENV=production` environment variable'ı eklenmiş mi?
- Frontend build işlemi başarılı mı? (Railway logs'unda kontrol edin)
- `client/dist` klasörü oluşturulmuş mu?

## Güncelleme (Re-deploy)

Kod değişikliklerinden sonra:
1. GitHub'a push yapın
2. Railway otomatik olarak yeni deploy başlatacak
3. Ya da Railway dashboard'dan manuel "Deploy" butonuna basın

## Domain Bağlama (Opsiyonel)

Kendi domain'inizi bağlamak için:
1. Railway dashboard > Settings > Domains
2. "Add Custom Domain" butonuna tıklayın
3. Domain'inizi girin (örn: `kbusosyal.com`)
4. DNS kayıtlarını domain sağlayıcınızda ayarlayın
5. SSL sertifikası otomatik olarak oluşturulacak

## Yedekleme ve Monitoring

### MongoDB Yedekleme:
- MongoDB Atlas otomatik yedekleme yapıyor (ücretsiz tier'da 1 günlük)
- Manuel yedek almak için: Atlas Console > Clusters > Backup

### Logs İzleme:
- Railway dashboard > Logs sekmesinden real-time logları görebilirsiniz
- Hatalar için: `console.error` ve `console.log` çıktılarını kontrol edin

## Performans İyileştirmeleri

1. **MongoDB İndeksleme:**
   - Sık kullanılan sorgular için index oluşturun
   - Örnek: `db.posts.createIndex({ createdAt: -1 })`

2. **Railway Scaling:**
   - Railway otomatik olarak scale ediyor
   - Daha fazla performans için "Pro" plana geçebilirsiniz

3. **CDN Kullanımı:**
   - Görseller için Cloudinary veya imgbb gibi servisleri kullanın
   - Static asset'ler için Cloudflare CDN ekleyin

## Destek ve Yardım

- Railway Docs: https://docs.railway.app
- MongoDB Atlas Docs: https://docs.atlas.mongodb.com
- Sorun durumunda Railway Discord: https://discord.gg/railway

## Güvenlik Önerileri

1. **Environment Variables:**
   - Hassas bilgileri asla kod içine yazmayın
   - `.env` dosyasını git'e eklemeyin (`.gitignore` kontrol edildi ✓)

2. **JWT Secret:**
   - Güçlü, rastgele bir string kullanın
   - Periyodik olarak değiştirin

3. **MongoDB:**
   - Sadece gerekli IP'lerden erişim açın (production'da Railway IP'si)
   - Database kullanıcısına minimum yetki verin

4. **Rate Limiting:**
   - Backend'de cooldown middleware'leri mevcut ✓
   - Gerekirse ek rate limiting ekleyin

## Lisans ve Yasal

- Okul projesi olarak kullanılıyor
- Kullanıcı verileri KVKK uyumlu saklanmalı
- Mail gönderimi için kullanıcı onayı alınmalı

---

**Son Güncelleme:** 2025-12-09
**Hazırlayan:** Claude Code (Anthropic)
