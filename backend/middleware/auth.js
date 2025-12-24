const jwt = require('jsonwebtoken');

// CRITICAL: JWT_SECRET must be loaded from environment variables for security
const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
    console.error('❌ FATAL ERROR: JWT_SECRET is not defined in environment variables!');
    process.exit(1);
}

const auth = (req, res, next) => {
    try {
        const token = req.header('Authorization')?.replace('Bearer ', '');
        if (!token) {
            return res.status(401).send({ error: 'Lütfen giriş yapın.' });
        }

        // SECURITY: Specify algorithm to prevent algorithm confusion attacks
        const decoded = jwt.verify(token, JWT_SECRET, { algorithms: ['HS256'] });
        req.userId = decoded.id; // request objesine kullanıcı id'sini ekle
        req.userRole = decoded.role; // Role'ü de request'e ekle
        req.user = { userId: decoded.id, role: decoded.role }; // Tutarlılık için req.user objesi
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
