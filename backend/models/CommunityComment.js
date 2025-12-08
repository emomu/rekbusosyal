const mongoose = require('mongoose');

const CommunityCommentSchema = new mongoose.Schema({
  community: { type: mongoose.Schema.Types.ObjectId, ref: 'Community', required: true },
  author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  content: { type: String, required: true },
  voteType: { type: String, enum: ['positive', 'neutral', 'negative'], required: true },
  likes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('CommunityComment', CommunityCommentSchema);
