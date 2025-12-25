const mongoose = require('mongoose');

const christmasCardSchema = new mongoose.Schema({
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  recipient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  message: {
    type: String,
    required: true,
    maxlength: 500
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

// Indexes for better query performance
christmasCardSchema.index({ recipient: 1, createdAt: -1 });
christmasCardSchema.index({ sender: 1, createdAt: -1 });
christmasCardSchema.index({ recipient: 1, isRead: 1 });

module.exports = mongoose.model('ChristmasCard', christmasCardSchema);
