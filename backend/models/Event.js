const mongoose = require('mongoose');

const EventSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, default: '' },
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },
  location: { type: String, default: '' },

  // Hangi kulüp oluşturdu
  community: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Community',
    required: true
  },

  // Kimler görüntüledi (view tracking için)
  views: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],

  // Kimler katılacak dedi
  attendees: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],

  // Etkinlik kategorisi
  category: {
    type: String,
    enum: ['Spor', 'Teknoloji', 'Sanat', 'Müzik', 'Bilim', 'Edebiyat', 'Sosyal', 'Eğitim', 'Diğer'],
    default: 'Sosyal'
  },

  // Görsel URL (opsiyonel)
  imageUrl: { type: String },

  // Etkinlik aktif mi?
  isActive: { type: Boolean, default: true },

  // Kim oluşturdu (kulüp yöneticisi veya admin)
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },

  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Indexes for performance
EventSchema.index({ startDate: 1, endDate: 1 }); // Tarih aralığı sorguları için
EventSchema.index({ community: 1, startDate: 1 }); // Kulüp bazlı etkinlikler için
EventSchema.index({ isActive: 1, startDate: 1 }); // Aktif etkinlikleri listelemek için

module.exports = mongoose.model('Event', EventSchema);
