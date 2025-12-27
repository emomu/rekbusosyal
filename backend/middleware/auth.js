const jwt = require('jsonwebtoken');
const User = require('../models/User');

// CRITICAL: JWT_SECRET must be loaded from environment variables for security
const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
    console.error('❌ FATAL ERROR: JWT_SECRET is not defined in environment variables!');
    process.exit(1);
}

const auth = async (req, res, next) => {
    try {
        const token = req.header('Authorization')?.replace('Bearer ', '');
        if (!token) {
            return res.status(401).send({ error: 'Lütfen giriş yapın.' });
        }

        // SECURITY: Specify algorithm to prevent algorithm confusion attacks
        const decoded = jwt.verify(token, JWT_SECRET, { algorithms: ['HS256'] });

        // CRITICAL SECURITY FIX: Always verify role from database, NEVER trust JWT payload
        // This prevents JWT manipulation attacks where attacker modifies role claim
        const user = await User.findById(decoded.id).select('role isBanned');

        if (!user) {
            return res.status(404).send({ error: 'Kullanıcı bulunamadı' });
        }

        // SECURITY: Check if user is banned
        if (user.isBanned) {
            return res.status(403).send({ error: 'Hesabınız yasaklandı' });
        }

        // Use role from DATABASE, not from JWT token
        req.userId = decoded.id;
        req.userRole = user.role; // ✅ From database
        req.user = { userId: decoded.id, role: user.role }; // ✅ From database
        next();
    } catch (error) {
        // Check if token expired
        if (error.name === 'TokenExpiredError') {
            return res.status(401).send({ error: 'Oturumunuz sona erdi. Lütfen tekrar giriş yapın.' });
        }
        res.status(401).send({ error: 'Kimlik doğrulama başarısız veya geçersiz token.' });
    }
};

module.exports = auth;
