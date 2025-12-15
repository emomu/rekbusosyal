require('dotenv').config(); // Load environment variables
const mongoose = require('mongoose');

// Modellerini çağır (Dosya yollarının doğru olduğundan emin ol)
const CampusComment = require('./models/CampusComment');
const Campus = require('./models/Campus');
const User = require('./models/User');
const Post = require('./models/Post');

// CRITICAL: MongoDB URI must be loaded from environment variables for security
const MONGODB_URI = process.env.MONGODB_URI || process.env.DATABASE_URL;

if (!MONGODB_URI) {
    console.error('❌ FATAL ERROR: MONGODB_URI is not defined in environment variables!');
    console.error('Please set MONGODB_URI or DATABASE_URL in your .env file');
    process.exit(1);
}

// MongoDB Bağlantısı
mongoose.connect(MONGODB_URI)
  .then(() => {
    console.log('MongoDB Bağlandı. Temizlik başlıyor...');
    resetData();
  })
  .catch(err => console.error('Bağlantı Hatası:', err));

const resetData = async () => {
  try {
    // 1. TÜM KAMPÜS YORUMLARINI SİL
    await CampusComment.deleteMany({});
    console.log('✅ Tüm kampüs yorumları silindi.');

    // 2. KAMPÜS OY SAYILARINI SIFIRLA (Positive/Neutral/Negative -> 0)
    await Campus.updateMany({}, { 
      $set: { 
        "votes.positive": 0, 
        "votes.neutral": 0, 
        "votes.negative": 0 
      } 
    });
    console.log('✅ Kampüs oy sayaçları sıfırlandı.');

    // 3. KULLANICILARIN VERDİĞİ OYLARI SİL (votedCampuses dizisini boşalt)
    await User.updateMany({}, { 
      $set: { votedCampuses: [] } 
    });
    console.log('✅ Kullanıcıların oy geçmişi temizlendi.');

    // (İsteğe Bağlı) Postları ve İtirafları da silmek istersen yorumu kaldır:
    // await Post.deleteMany({});
    // console.log('✅ Tüm postlar ve itiraflar silindi.');

    console.log('--- TEMİZLİK TAMAMLANDI ---');
    process.exit(); // İşlem bitince scripti kapat
  } catch (err) {
    console.error('Hata oluştu:', err);
    process.exit(1);
  }
};