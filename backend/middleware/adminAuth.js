const jwt = require('jsonwebtoken');
const User = require('../models/User');

// CRITICAL: JWT_SECRET must be loaded from environment variables for security
const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
    console.error('❌ FATAL ERROR: JWT_SECRET is not defined in environment variables!');
    process.exit(1);
}

// Admin veya Moderator kontrolü
const adminAuth = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];

    if (!token) {
      return res.status(401).json({ error: "Yetkilendirme token'ı bulunamadı" });
    }

    // SECURITY: Specify algorithm to prevent algorithm confusion attacks
    const decoded = jwt.verify(token, JWT_SECRET, { algorithms: ['HS256'] });
    const user = await User.findById(decoded.id);

    if (!user) {
      return res.status(404).json({ error: "Kullanıcı bulunamadı" });
    }

    if (user.role !== 'admin' && user.role !== 'moderator') {
      return res.status(403).json({ error: "Bu işlem için yetkiniz yok" });
    }

    req.userId = user._id;
    req.userRole = user.role;
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ error: "Oturumunuz sona erdi. Lütfen tekrar giriş yapın." });
    }
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

    // SECURITY: Specify algorithm to prevent algorithm confusion attacks
    const decoded = jwt.verify(token, JWT_SECRET, { algorithms: ['HS256'] });
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
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ error: "Oturumunuz sona erdi. Lütfen tekrar giriş yapın." });
    }
    return res.status(401).json({ error: "Geçersiz token" });
  }
};

module.exports = { adminAuth, strictAdminAuth };
