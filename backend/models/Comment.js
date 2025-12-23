const mongoose = require('mongoose');

const CommentSchema = new mongoose.Schema({
  content: {
    type: String,
    required: true,
    maxlength: 500
  },
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  post: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Post',
    required: true
  },
  // Nested comments support - parentComment varsa bu bir reply'dir
  parentComment: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Comment',
    default: null
  },
  // Reply sayısını saklamak için
  replyCount: {
    type: Number,
    default: 0
  },
  likes: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  // Tek fotoğraf veya GIF yüklenebilir
  media: {
    url: { type: String },
    type: { type: String, enum: ['image', 'gif'] },
    publicId: { type: String } // Cloudinary public ID for deletion
  },
  spotifyTrack: {
    id: { type: String }, // Spotify track ID
    name: { type: String }, // Şarkı adı
    artist: { type: String }, // Sanatçı
    album: { type: String }, // Albüm
    albumArt: { type: String }, // Albüm kapağı URL
    previewUrl: { type: String }, // 30 saniyelik preview URL
    spotifyUrl: { type: String }, // Spotify'da açma linki
    duration: { type: Number } // Şarkı süresi (ms)
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Index for faster queries
CommentSchema.index({ post: 1, createdAt: -1 });
CommentSchema.index({ author: 1 });

module.exports = mongoose.model('Comment', CommentSchema);
