const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  fullName: { type: String, required: true },
  username: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  birthDate: { type: Date, required: true },
  password: { type: String, required: true },
  profilePicture: { type: String, default: '' }, 
  role: { type: String, enum: ['user', 'moderator', 'club_manager', 'admin'], default: 'user' },
  
  // --- EKLENEN KISIM BAŞLANGIÇ ---
  isVerified: { type: Boolean, default: false }, // Hesap onaylı mı?
  verificationToken: { type: String }, // Onaylama linki için kod
  resetPasswordToken: { type: String },
  resetPasswordExpires: { type: Date },
  isBanned: { type: Boolean, default: false }, // Kullanıcı banlandı mı?
  banReason: { type: String, default: '' }, // Ban nedeni
  bannedAt: { type: Date }, // Ban tarihi
  // --- EKLENEN KISIM BİTİŞ ---

  votedCampuses: [{
    campusId: { type: mongoose.Schema.Types.ObjectId, ref: 'Campus' },
    voteType: { type: String, enum: ['negative', 'neutral', 'positive'] }
  }],
  votedCommunities: [{
    communityId: { type: mongoose.Schema.Types.ObjectId, ref: 'Community' },
    voteType: { type: String, enum: ['negative', 'neutral', 'positive'] }
  }],
  interests: [{
    type: String,
    enum: ['kahve', 'yemek', 'egitim', 'eglence']
  }],
  bio: { type: String, default: '', maxlength: 160 },
  isPrivate: { type: Boolean, default: false },
  followers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  following: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  followRequests: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  badges: [{
    type: String,
    enum: ['founder', 'developer', 'bug_hunter', 'admin', 'moderator', 'supporter', 'verified']
  }],

  // Beta Features
  betaFeatures: {
    spotifyIntegration: { type: Boolean, default: false } // Admin tarafından aktifleştirilebilir
  },

  // Spotify Integration
  spotify: {
    spotifyId: { type: String },
    accessToken: { type: String },
    refreshToken: { type: String },
    tokenExpiresAt: { type: Date },
    isConnected: { type: Boolean, default: false }
  },

  createdAt: { type: Date, default: Date.now }
});

// Indexes for performance optimization
UserSchema.index({ username: 'text', fullName: 'text' }); // Text search için (arama özelliği)
UserSchema.index({ createdAt: -1 }); // Yeni kullanıcıları sıralama

module.exports = mongoose.model('User', UserSchema);