const mongoose = require('mongoose');

const CommunitySchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String, default: '' },
  category: {
    type: String,
    enum: ['Spor', 'Teknoloji', 'Sanat', 'Müzik', 'Bilim', 'Edebiyat', 'Sosyal', 'Diğer'],
    default: 'Sosyal'
  },
  imageUrl: { type: String },
  manager: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // Kulüp yöneticisi
  members: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }], // Üyeler

  // Kulübün özel announcement hesabı
  announcementAccount: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },

  votes: {
    positive: { type: Number, default: 0 },
    neutral: { type: Number, default: 0 },
    negative: { type: Number, default: 0 }
  },
  isActive: { type: Boolean, default: true },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Community', CommunitySchema);
