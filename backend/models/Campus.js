const mongoose = require('mongoose');

const CampusSchema = new mongoose.Schema({
  name: { type: String, required: true }, // Örn: "Demir Çelik Kampüsü"
  votes: {
    negative: { type: Number, default: 0 }, // Şiddetle Önermiyorum (Kırmızı)
    neutral: { type: Number, default: 0 },  // Ne İyi Ne Kötü (Mavi)
    positive: { type: Number, default: 0 }  // Kesinlikle Öneriyorum (Yeşil)
  }
});

module.exports = mongoose.model('Campus', CampusSchema);