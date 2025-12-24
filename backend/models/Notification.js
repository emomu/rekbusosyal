const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  recipient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false  // version_update için sender gerekmeyebilir
  },
  type: {
    type: String,
    // YENİ TİPLER EKLENDİ: 'comment_like', 'suggestion', 'comment_reply', 'version_update', 'announcement_post'
    enum: ['follow_request', 'follow_accept', 'like', 'mention', 'comment', 'comment_like', 'comment_reply', 'suggestion', 'version_update', 'announcement_post'],
    required: true
  },
  post: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Post'
  },
  // YENİ ALAN: Yorum beğenileri için
  comment: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Comment'
  },
  // YENİ ALAN: Yoruma cevap için (reply)
  reply: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Comment'
  },
  // Sürüm güncellemeleri için title ve message
  title: {
    type: String
  },
  message: {
    type: String
  },
  link: {
    type: String
  },
  isRead: {
    type: Boolean,
    default: false
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Compound indexes for better query performance
notificationSchema.index({ recipient: 1, createdAt: -1 }); // Bildirimleri sırayla çekmek için
notificationSchema.index({ recipient: 1, isRead: 1 }); // Okunmamış bildirimleri filtrelemek için
notificationSchema.index({ recipient: 1, isRead: 1, createdAt: -1 }); // Hem okunmamış hem sıralı

// Type ve post alanları için index (suggestion bildirimlerinde aynı postu kontrol etmek için)
notificationSchema.index({ recipient: 1, type: 1, post: 1 }); // Duplicate bildirim önleme

// TTL Index: 90 gün sonra otomatik silme (opsiyonel - bellek tasarrufu için)
// İsteğe bağlı olarak aktif edilebilir:
// notificationSchema.index({ createdAt: 1 }, { expireAfterSeconds: 7776000 }); // 90 gün

module.exports = mongoose.model('Notification', notificationSchema);