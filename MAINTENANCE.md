# Bakım Modu Kullanım Kılavuzu

KBÜ Sosyal platformu için bakım modu sistemi kurulmuştur. Bu sistem, gerektiğinde siteyi geçici olarak kapatmanıza ve kullanıcılara bilgilendirme sayfası göstermenize olanak tanır.

## 🔧 Bakım Modunu Aktifleştirme

### Frontend (Client)

1. `.env` dosyasını açın (yoksa `.env.example`'dan kopyalayın)
2. Şu satırı ekleyin veya güncelleyin:
   ```env
   VITE_MAINTENANCE_MODE=true
   ```
3. Uygulamayı yeniden başlatın:
   ```bash
   npm run dev
   ```

### Backend (API)

1. `backend/.env` dosyasını açın
2. Şu satırı ekleyin veya güncelleyin:
   ```env
   MAINTENANCE_MODE=true
   ```
3. Sunucuyu yeniden başlatın:
   ```bash
   node server.js
   ```

## ✅ Bakım Modunu Kapatma

Yukarıdaki adımları tekrarlayın ama değeri `false` yapın:

```env
# Client .env
VITE_MAINTENANCE_MODE=false

# Backend .env
MAINTENANCE_MODE=false
```

## 🎭 Özellikler

### Frontend Bakım Modu
- Tüm kullanıcılara bakım sayfası gösterilir
- **Admin kullanıcılar** bakım modunu bypass edebilir (normal şekilde siteye erişir)
- Güzel tasarlanmış, split-screen bakım sayfası
- Otomatik yönlendirme sistemi

### Backend Bakım Modu
- API istekleri **503 Service Unavailable** kodu ile yanıtlanır
- Admin kullanıcılar API'ye erişmeye devam edebilir
- Login ve profil endpoint'leri bakım modunda da çalışır (admin kontrolü için)

## 🚀 Production Deployment

### Railway (Otomatik Deploy)

1. **Railway Dashboard**'a gidin
2. Projenizi seçin
3. **Variables** sekmesine tıklayın
4. Yeni variable ekleyin:
   - Key: `VITE_MAINTENANCE_MODE` (Client için)
   - Value: `true`
   - Key: `MAINTENANCE_MODE` (Backend için)
   - Value: `true`
5. Railway otomatik olarak yeniden deploy edecektir

### Manuel Deploy

```bash
# Client build
cd client
npm run build

# Backend restart
cd ../backend
pm2 restart kbu-sosyal
# veya
systemctl restart kbu-sosyal
```

## 📋 Bakım Sayfası Özellikleri

### Görsel Tasarım
- Modern split-screen layout
- Gradient arka plan efektleri
- Responsive design (mobil uyumlu)
- LoginPage ile uyumlu tasarım dili

### İçerik
- Bakım durumu açıklaması
- Tahmini süre bilgisi
- İletişim bilgileri
- Veri güvenliği garantisi

## 🔐 Güvenlik

- Admin kullanıcılar `userRole === 'admin'` kontrolü ile belirlenir
- Bakım modunda bile admin paneline erişim vardır
- Normal kullanıcılar hiçbir endpoint'e erişemez (login hariç)

## 📝 Örnek Kullanım Senaryoları

### Senaryo 1: Database Bakımı
```bash
# 1. Bakım modunu aktifleştir
echo "MAINTENANCE_MODE=true" >> backend/.env
echo "VITE_MAINTENANCE_MODE=true" >> client/.env

# 2. Uygulamayı yeniden başlat
pm2 restart all

# 3. Database işlemlerini yap
mongodump --uri="mongodb://..."
# ... bakım işlemleri ...

# 4. Bakım modunu kapat
# .env dosyalarını düzenle ve false yap
pm2 restart all
```

### Senaryo 2: Acil Güncelleme
```bash
# Railway environment variables üzerinden
# MAINTENANCE_MODE=true olarak ayarla
# Kod değişikliklerini deploy et
# Test et (admin olarak giriş yaparak)
# MAINTENANCE_MODE=false yap
```

## 🎨 Bakım Sayfasını Özelleştirme

Bakım sayfası şurada bulunur:
- `client/src/pages/MaintenancePage.jsx`

Değiştirebileceğiniz öğeler:
- Başlık ve açıklama metinleri
- Tahmini süre bilgisi
- İletişim bilgileri
- Renkler ve tasarım

## ❓ Sık Sorulan Sorular

**S: Admin nasıl bypass eder?**
C: Admin kullanıcı token'ında `userRole: 'admin'` olduğu için `MaintenanceCheck` komponenti onları yönlendirmez.

**S: Bakım modunda login yapılabilir mi?**
C: Evet, login endpoint'i bakım modunda da çalışır (admin girişi yapabilmek için).

**S: Railway'de değişiklik yapmadan nasıl aktifleştirilir?**
C: Railway dashboard'dan environment variable değiştirerek.

**S: Moderatorler bypass edebilir mi?**
C: Hayır, sadece admin (`userRole === 'admin'`) bypass edebilir.

## 🔗 İlgili Dosyalar

### Frontend
- `client/src/pages/MaintenancePage.jsx` - Bakım sayfası
- `client/src/components/MaintenanceCheck.jsx` - Bakım modu kontrolü
- `client/src/routes/index.jsx` - Route tanımı
- `client/src/main.jsx` - MaintenanceCheck wrapper

### Backend
- `backend/middleware/maintenanceMode.js` - Bakım modu middleware
- `backend/server.js` - Middleware entegrasyonu
- `backend/.env.example` - Environment variable örneği

---

**Not:** Bakım modunu aktifleştirmeden önce kullanıcıları sosyal medya veya email ile bilgilendirmeniz önerilir.
