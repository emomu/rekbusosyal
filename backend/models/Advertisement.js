const mongoose = require('mongoose');

const AdvertisementSchema = new mongoose.Schema({
  title: { type: String, required: true },
  content: { type: String, required: true },
  imageUrl: { type: String },
  profileImageUrl: { type: String }, // Reklam veren profil resmi
  targetUrl: { type: String }, // Reklama tıklandığında gidilecek link
  placement: {
    type: String,
    enum: ['sidebar', 'feed', 'header', 'footer'],
    default: 'sidebar'
  }, // Reklamın gösterileceği yer
  tags: [{
    type: String,
    enum: ['kahve', 'yemek', 'egitim', 'eglence']
  }], // Reklam etiketleri
  priority: { type: Number, default: 1, min: 1, max: 10 }, // Öncelik seviyesi (1-10)
  budget: { type: Number, default: 0 }, // Reklam bütçesi
  maxImpressions: { type: Number }, // Maksimum gösterim sayısı
  isActive: { type: Boolean, default: true },
  impressions: { type: Number, default: 0 }, // Gösterim sayısı
  clicks: { type: Number, default: 0 }, // Tıklanma sayısı
  startDate: { type: Date },
  endDate: { type: Date },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Advertisement', AdvertisementSchema);
