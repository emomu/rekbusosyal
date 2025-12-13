const jwt = require('jsonwebtoken');
const JWT_SECRET = "cok_gizli_anahtar_kelime"; // Gerçek projede bunu .env dosyasına koyarız

const auth = (req, res, next) => {
    try {
        const token = req.header('Authorization')?.replace('Bearer ', '');
        if (!token) {
            return res.status(401).send({ error: 'Lütfen giriş yapın.' });
        }
        
        const decoded = jwt.verify(token, JWT_SECRET);
        req.userId = decoded.id; // request objesine kullanıcı id'sini ekle
        next();
    } catch (error) {
        res.status(401).send({ error: 'Kimlik doğrulama başarısız veya geçersiz token.' });
    }
};

module.exports = auth;
