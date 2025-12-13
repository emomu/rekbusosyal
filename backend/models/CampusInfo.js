const mongoose = require('mongoose');

// Kampüs, Hoca veya Yemekhane verisi
const InfoSchema = new mongoose.Schema({
  type: { type: String, enum: ['campus', 'professor', 'dorm'], required: true },
  name: { type: String, required: true },
  rating: { type: Number, default: 0 }, // 1-5 arası puan
  features: [String], // Özellikler (örn: "Manzara var", "Sıra çok")
});

module.exports = mongoose.model('Info', InfoSchema);