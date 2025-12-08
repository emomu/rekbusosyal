const mongoose = require('mongoose');

const PostSchema = new mongoose.Schema({
  content: { type: String, required: true },
  author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', select: false }, // Anonimlik için select false
  isAnonymous: { type: Boolean, default: true },
  category: { type: String, enum: ['Geyik', 'İtiraf', 'Ders', 'Yemekhane'], default: 'Geyik' },
  likes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }], // Kimler beğendi
  viewCount: { type: Number, default: 0 },
  score: { type: Number, default: 0 }, // Algoritma için hesaplanmış skor
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Post', PostSchema);