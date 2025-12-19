const mongoose = require('mongoose');

const PostSchema = new mongoose.Schema({
  content: { type: String, required: true },
  author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', select: false }, // Anonimlik için select false
  isAnonymous: { type: Boolean, default: true },
  category: { type: String, enum: ['Geyik', 'İtiraf', 'Ders', 'Yemekhane'], default: 'Geyik' },
  likes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }], // Kimler beğendi
  viewCount: { type: Number, default: 0 },
  score: { type: Number, default: 0 }, // Algoritma için hesaplanmış skor
  media: [{
    url: { type: String, required: true },
    type: { type: String, enum: ['image', 'video'], required: true },
    publicId: { type: String } // Cloudinary public ID for deletion
  }],
  createdAt: { type: Date, default: Date.now }
});

// Indexes for performance optimization
PostSchema.index({ createdAt: -1 }); // Yeni postları hızlı çekmek için
PostSchema.index({ category: 1, createdAt: -1 }); // Kategoriye göre sıralama
PostSchema.index({ createdAt: -1, isAnonymous: 1, category: 1 }); // Cron job için compound index
PostSchema.index({ author: 1 }); // Yazara göre postları çekmek için

module.exports = mongoose.model('Post', PostSchema);