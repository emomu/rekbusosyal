const jwt = require('jsonwebtoken');
const User = require('../models/User');
const JWT_SECRET = "cok_gizli_anahtar_kelime";

// Admin veya Moderator kontrolü
const adminAuth = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];

    if (!token) {
      return res.status(401).json({ error: "Yetkilendirme token'ı bulunamadı" });
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    const user = await User.findById(decoded.id);

    if (!user) {
      return res.status(404).json({ error: "Kullanıcı bulunamadı" });
    }

    if (user.role !== 'admin' || user.role !== 'moderator') {
      return res.status(403).json({ error: "Bu işlem için yetkiniz yok" });
    }

    req.userId = user._id;
    req.userRole = user.role;
    next();
  } catch (err) {
    return res.status(401).json({ error: "Geçersiz token" });
  }
};

// Sadece Admin kontrolü
const strictAdminAuth = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];

    if (!token) {
      return res.status(401).json({ error: "Yetkilendirme token'ı bulunamadı" });
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    const user = await User.findById(decoded.id);

    if (!user) {
      return res.status(404).json({ error: "Kullanıcı bulunamadı" });
    }

    if (user.role !== 'admin') {
      return res.status(403).json({ error: "Bu işlem sadece adminler tarafından yapılabilir" });
    }

    req.userId = user._id;
    req.userRole = user.role;
    next();
  } catch (err) {
    return res.status(401).json({ error: "Geçersiz token" });
  }
};

module.exports = { adminAuth, strictAdminAuth };
