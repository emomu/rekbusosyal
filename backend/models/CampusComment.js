const mongoose = require('mongoose');

const CampusCommentSchema = new mongoose.Schema({
  campusId: { type: mongoose.Schema.Types.ObjectId, ref: 'Campus', required: true },
  content: { type: String, required: true },
  author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  likes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  
  // --- BU SATIRI EKLEDİN Mİ? ---
  voteType: { type: String, enum: ['positive', 'neutral', 'negative'] }, 
  
  createdAt: { type: Date, default: Date.now }
});
module.exports = mongoose.model('CampusComment', CampusCommentSchema);