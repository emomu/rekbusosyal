const mongoose = require('mongoose');

const versionNoteSchema = new mongoose.Schema({
  version: {
    type: String,
    required: true,
    unique: true
  },
  title: {
    type: String,
    required: true
  },
  description: {
    type: String
  },
  features: [{
    type: String
  }],
  bugFixes: [{
    type: String
  }],
  improvements: [{
    type: String
  }],
  releaseDate: {
    type: Date,
    default: Date.now
  },
  isPublished: {
    type: Boolean,
    default: false
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

// Indexes
versionNoteSchema.index({ releaseDate: -1 }); // En yeni sürümler önce
versionNoteSchema.index({ isPublished: 1, releaseDate: -1 }); // Yayınlanmış sürümler

module.exports = mongoose.model('VersionNote', versionNoteSchema);
