// Cooldown Middleware - Twitter tarzı içerik paylaşım sınırlaması
const jwt = require('jsonwebtoken');

// CRITICAL: JWT_SECRET must be loaded from environment variables for security
const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
    console.error('❌ FATAL ERROR: JWT_SECRET is not defined in environment variables!');
    process.exit(1);
}

const cooldowns = new Map();

// Cooldown süreleri (milisaniye cinsinden)
const COOLDOWN_TIMES = {
  post: 30000,        // 30 saniye - Normal postlar
  confession: 60000,  // 60 saniye - İtiraflar (daha hassas)
  comment: 20000,     // 20 saniye - Yorumlar
  vote: 5000          // 5 saniye - Oylar (spam önleme)
};

const cooldownMiddleware = (type) => {
  return (req, res, next) => {
    const userId = req.userId; // auth middleware'den gelen userId

    if (!userId) {
      return res.status(401).json({ error: "Oturum açmanız gerekiyor" });
    }

    const key = `${userId}-${type}`;
    const now = Date.now();
    const cooldownTime = COOLDOWN_TIMES[type] || 30000;

    if (cooldowns.has(key)) {
      const lastActionTime = cooldowns.get(key);
      const timePassed = now - lastActionTime;
      const remainingTime = cooldownTime - timePassed;

      if (remainingTime > 0) {
        const secondsLeft = Math.ceil(remainingTime / 1000);
        return res.status(429).json({
          error: "Çok hızlı hareket ediyorsun! Lütfen biraz bekle.",
          remainingSeconds: secondsLeft,
          cooldownType: type
        });
      }
    }

    // Cooldown süresini güncelle
    cooldowns.set(key, now);

    // 5 dakika sonra memory'den temizle (garbage collection)
    setTimeout(() => {
      cooldowns.delete(key);
    }, 300000);

    next();
  };
};

// Vote endpoint'leri için özel cooldown (token body'de)
const voteCooldown = (req, res, next) => {
  const { token } = req.body;

  if (!token) {
    return res.status(401).json({ error: "Oturum açmanız gerekiyor" });
  }

  try {
    // SECURITY: Specify algorithm to prevent algorithm confusion attacks
    const decoded = jwt.verify(token, JWT_SECRET, { algorithms: ['HS256'] });
    const userId = decoded.id;

    const key = `${userId}-vote`;
    const now = Date.now();
    const cooldownTime = COOLDOWN_TIMES.vote;

    if (cooldowns.has(key)) {
      const lastActionTime = cooldowns.get(key);
      const timePassed = now - lastActionTime;
      const remainingTime = cooldownTime - timePassed;

      if (remainingTime > 0) {
        const secondsLeft = Math.ceil(remainingTime / 1000);
        return res.status(429).json({
          error: "Çok hızlı oy veriyorsun! Lütfen biraz bekle.",
          remainingSeconds: secondsLeft,
          cooldownType: 'vote'
        });
      }
    }

    // Cooldown süresini güncelle
    cooldowns.set(key, now);

    // 5 dakika sonra memory'den temizle
    setTimeout(() => {
      cooldowns.delete(key);
    }, 300000);

    next();
  } catch (error) {
    return res.status(401).json({ error: "Geçersiz token" });
  }
};

module.exports = cooldownMiddleware;
module.exports.voteCooldown = voteCooldown;
