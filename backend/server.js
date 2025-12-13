require('dotenv').config(); // EKLENDİ: .env dosyasını okumak için
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { Resend } = require('resend'); // Resend
const crypto = require('crypto'); // EKLENDİ
const User = require('./models/User');
const cron = require('node-cron'); // En üste ekle
const { SitemapStream, streamToPromise } = require('sitemap');
const { createGzip } = require('zlib');
const JWT_SECRET = process.env.JWT_SECRET; // .env'den çekiliyor

const auth = require('./middleware/auth');
const { adminAuth, strictAdminAuth } = require('./middleware/adminAuth');
const cooldown = require('./middleware/cooldown');
const { voteCooldown } = require('./middleware/cooldown');

// Multer configuration for file uploads
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Ensure uploads directory exists
const uploadDir = path.join(__dirname, 'uploads/profiles');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Storage configuration
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/profiles/');
  },
  filename: function (req, file, cb) {
    // Unique filename: userId-timestamp.extension
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'profile-' + uniqueSuffix + path.extname(file.originalname));
  }
});

// File filter - only images
const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|gif|webp/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);

  if (mimetype && extname) {
    return cb(null, true);
  } else {
    cb(new Error('Sadece resim dosyaları yüklenebilir!'));
  }
};

// Multer upload configuration
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  },
  fileFilter: fileFilter
});

// Modelleri Çağır
const Post = require('./models/Post');
const Campus = require('./models/Campus');
const CampusComment = require('./models/CampusComment');
const Advertisement = require('./models/Advertisement');
const Community = require('./models/Community');
const CommunityComment = require('./models/CommunityComment');
const Comment = require('./models/Comment');
const Notification = require('./models/Notification');
const VersionNote = require('./models/VersionNote');

const versionNotesRouter = require('./routes/versionNotes');

const app = express();

// CORS ayarları
app.use(cors({
  origin: [process.env.FRONTEND_URL, 'http://localhost:5173'],
  credentials: true
}));

app.use(express.json({ limit: '50mb' }));

// Serve uploaded files statically
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// --- Resend Email Servisi ---
const resend = new Resend(process.env.RESEND_API_KEY);
app.use('/api/version-notes', versionNotesRouter);
// Email servis kontrolü
if (!process.env.RESEND_API_KEY) {
  console.log('⚠️ RESEND_API_KEY bulunamadı. Email gönderilemeyecek.');
} else {
  console.log('✅ Resend email servisi hazır');
}
// -------------------------------------

// MongoDB Bağlantısı (Kendi linkin varsa burayı değiştir)
mongoose.connect(process.env.MONGO_URI) // .env'den çekiliyor
  .then(() => console.log('MongoDB Bağlandı'))
  .catch(err => console.error('Bağlantı Hatası:', err));

app.get('/api/search/users', auth, async (req, res) => {
  try {
    let { q } = req.query;
    console.log(`🔎 Arama İsteği Alındı: "${q}"`); // Terminalde bu logu görmelisin

    if (!q || q.trim().length < 1) {
      return res.json([]);
    }

    // @ işaretini temizle
    if (q.startsWith('@')) {
      q = q.substring(1);
    }

    // Özel karakterleri escape et (Regex güvenliği)
    const safeQuery = q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

    const users = await User.find({
      $and: [
        { _id: { $ne: req.userId } }, // Kendini arama sonuçlarında gösterme
        {
          $or: [
            { username: { $regex: safeQuery, $options: 'i' } }, // Case-insensitive arama
            { fullName: { $regex: safeQuery, $options: 'i' } }
          ]
        }
      ]
    })
    .select('username fullName profilePicture') // Sadece gerekli alanları al
    .limit(10); // Max 10 sonuç

    res.json(users);
  } catch (err) {
    console.error('❌ Kullanıcı arama hatası:', err);
    res.status(500).json({ error: "Arama sırasında bir hata oluştu" });
  }
});
// --- ROTALAR ---
app.get('/sitemap.xml', async (req, res) => {
  res.header('Content-Type', 'application/xml');
  res.header('Content-Encoding', 'gzip');

  try {
    const smStream = new SitemapStream({ hostname: 'https://www.kbusosyal.com' });
    const pipeline = smStream.pipe(createGzip());

    // 1. STATİK SAYFALAR
    smStream.write({ url: '/', changefreq: 'daily', priority: 1.0 });
    smStream.write({ url: '/login', changefreq: 'monthly', priority: 0.5 });
    smStream.write({ url: '/register', changefreq: 'monthly', priority: 0.6 });

    // 2. DİNAMİK: POSTLAR
    const posts = await Post.find({ isAnonymous: false, category: 'Geyik' })
                            .select('_id updatedAt')
                            .sort({ createdAt: -1 })
                            .limit(1000);
    
    posts.forEach(post => {
      smStream.write({
        url: `/post/${post._id}`,
        changefreq: 'weekly',
        priority: 0.8,
        lastmod: post.updatedAt ? post.updatedAt.toISOString() : new Date().toISOString()
      });
    });

    // 3. DİNAMİK: KULLANICI PROFİLLERİ
    const users = await User.find({ isPrivate: false })
                            .select('username updatedAt')
                            .limit(500);

    users.forEach(user => {
        smStream.write({
            url: `/user/${user.username}`,
            changefreq: 'weekly',
            priority: 0.7,
            lastmod: user.updatedAt ? user.updatedAt.toISOString() : new Date().toISOString()
        });
    });

    // 4. DİNAMİK: KAMPÜSLER
    const campuses = await Campus.find().select('_id name');
    campuses.forEach(campus => {
      smStream.write({
        url: `/campus/${campus._id}`,
        changefreq: 'monthly',
        priority: 0.6
      });
    });

    smStream.end();
    pipeline.pipe(res).on('error', (e) => { throw e });

  } catch (e) {
    console.error('Sitemap Hatası:', e);
    res.status(500).end();
  }
});

// 1. GENEL AKIŞ (POSTLAR)
// Postları getir (Yazar bilgisiyle birlikte) - Pagination destekli
app.get('/api/posts', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const [posts, totalCount] = await Promise.all([
      Post.find({ isAnonymous: false, category: 'Geyik' })
        .populate('author', 'username profilePicture')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Post.countDocuments({ isAnonymous: false, category: 'Geyik' })
    ]);

    res.json({
      posts,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(totalCount / limit),
        totalCount,
        hasMore: skip + posts.length < totalCount
      }
    });
  } catch (err) {
    res.status(500).json(err);
  }
});

// Post Atma (Sadece giriş yapmış kullanıcılar) - 30 saniye cooldown
app.post('/api/posts', auth, cooldown('post'), async (req, res) => {
  try {
    const newPost = new Post({
      content: req.body.content,
      author: req.userId, // middleware'den gelen kullanıcı ID'si
      isAnonymous: false, // Normal postlar anonim değildir
      category: 'Geyik' // Varsayılan kategori
    });
    
    let savedPost = await newPost.save();
    // Kaydedilen postu yazar bilgisiyle birlikte geri döndür
    savedPost = await savedPost.populate('author', 'username profilePicture');
    
    res.status(201).json(savedPost);
  } catch (err) {
    console.error("Post oluşturma hatası:", err);
    res.status(500).json({ error: "Post oluşturulurken bir hata oluştu." });
  }
});

// 2. İTİRAFLAR
// İtirafları getir - Pagination destekli
app.get('/api/confessions', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const [confessions, totalCount] = await Promise.all([
      Post.find({ category: 'İtiraf' })
        .populate('author', 'username profilePicture')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Post.countDocuments({ category: 'İtiraf' })
    ]);

    res.json({
      posts: confessions,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(totalCount / limit),
        totalCount,
        hasMore: skip + confessions.length < totalCount
      }
    });
  } catch (err) {
    res.status(500).json(err);
  }
});

// İtiraf Gönderme (Sadece giriş yapmış kullanıcılar) - 60 saniye cooldown
app.post('/api/confessions', auth, cooldown('confession'), async (req, res) => {
  const { content, isAnonymous } = req.body;
  try {
    const newConfession = new Post({
      content,
      isAnonymous,
      category: 'İtiraf',
      author: isAnonymous ? null : req.userId,
    });

    let savedConfession = await newConfession.save();
    
    // Eğer anonim değilse, yazar bilgisiyle birlikte geri döndür
    if (!savedConfession.isAnonymous) {
      savedConfession = await savedConfession.populate('author', 'username profilePicture');
    }
    
    res.status(201).json(savedConfession);
  } catch (err) {
    console.error("İtiraf oluşturma hatası:", err);
    res.status(500).json({ error: "İtiraf oluşturulurken bir hata oluştu." });
  }
});

app.post('/api/posts/:id/like', auth, async (req, res) => {
  try {
    // DÜZELTME: author field'ı select: false olduğu için +author ile dahil ediyoruz
    const post = await Post.findById(req.params.id).select('+author');
    if (!post) return res.status(404).json({ error: 'Post bulunamadı' });

    const userId = req.userId;
    const isLiked = post.likes.includes(userId);

    if (isLiked) {
      // 1. Beğeniyi geri al
      post.likes.pull(userId);

      // 2. SPAM KORUMASI: Bildirimi sil
      await Notification.deleteOne({
        recipient: post.author,
        sender: userId,
        post: post._id,
        type: 'like'
      });
    } else {
      // 1. Beğen
      post.likes.push(userId);

      // 2. Bildirim Oluştur
      // DÜZELTME: !post.isAnonymous kontrolü kaldırıldı.
      // Artık post anonim olsa bile sahibine bildirim gider.
      console.log(`[LIKE] Post ID: ${post._id}, Author: ${post.author}, Current User: ${userId}, isAnonymous: ${post.isAnonymous}`);

      if (post.author && userId.toString() !== post.author.toString()) {

        // Çift kayıt kontrolü
        const existingNotif = await Notification.findOne({
           recipient: post.author,
           sender: userId,
           post: post._id,
           type: 'like'
        });

        if (!existingNotif) {
            const notification = await Notification.create({
              recipient: post.author,
              sender: userId,
              type: 'like',
              post: post._id
            });
            console.log(`🔔 Post Like Bildirimi OLUŞTURULDU -> Alıcı: ${post.author}, Bildirim ID: ${notification._id}`);
        } else {
            console.log(`⚠️ Post Like Bildirimi zaten var, atlanıyor`);
        }
      } else {
        console.log(`⚠️ Bildirim OLUŞTURULAMADI - Sebep: ${!post.author ? 'Post author yok' : 'Kendi postunu beğendin'}`);
      }
    }

    let updatedPost = await post.save();
    
    // Frontend için yazar bilgisini populate et
    // Not: Anonim post ise frontend'de yazar gizlenmeli ama veri dolu gitmeli
    if (updatedPost.author) { 
      updatedPost = await updatedPost.populate('author', 'username profilePicture');
    }

    res.json(updatedPost);

  } catch (err) {
    console.error("Beğenme hatası:", err);
    res.status(500).json({ error: "İşlem hatası." });
  }
});

// --- GET SINGLE POST ---
app.get('/api/posts/:id', auth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id)
      .select('+author') // author field'ı dahil et
      .populate('author', 'username profilePicture');

    if (!post) {
      return res.status(404).json({ error: 'Post bulunamadı' });
    }

    res.json(post);
  } catch (err) {
    console.error('Post getirme hatası:', err);
    res.status(500).json({ error: 'Post yüklenemedi' });
  }
});

// 2. KAMPÜSLER VE OYLAMA
app.get('/api/campus', async (req, res) => {
  try {
    const campuses = await Campus.find();
    res.json(campuses);
  } catch (err) {
    res.status(500).json(err);
  }
});


// 1. OYLAMA ENDPOINT'İ (GÜNCELLENMİŞ) - 5 saniye cooldown
// 1. OYLAMA ENDPOINT'İ (TERMINATÖR MODU: Eskileri temizler)
app.post('/api/campus/:id/vote', voteCooldown, async (req, res) => {
  const { type, token } = req.body;
  try {
    if (!token) return res.status(401).json({ error: "Oturum açmanız gerekiyor" });

    const decoded = jwt.verify(token, JWT_SECRET);
    const userId = decoded.id;

    const campus = await Campus.findById(req.params.id);
    const user = await User.findById(userId);
    if (!campus || !user) return res.status(404).json({ error: "Bulunamadı" });

    // --- OY HESAPLAMA ---
    const existingVote = user.votedCampuses.find(v => v.campusId.toString() === req.params.id);
    
    if (existingVote) {
      campus.votes[existingVote.voteType]--;
      campus.votes[type]++;
      existingVote.voteType = type;
    } else {
      campus.votes[type]++;
      user.votedCampuses.push({ campusId: req.params.id, voteType: type });
    }

    await campus.save();
    await user.save();

    // --- TEMİZLİK VE TEKİL YORUM İŞLEMİ ---
    const voteMessages = {
      positive: '👍 Bu kampüsü beğendim!',
      neutral: '😐 İdare eder.',
      negative: '👎 Pek beğenmedim.'
    };

    // 1. Bu kullanıcıya ait bu kampüsteki TÜM yorumları bul
    const existingComments = await CampusComment.find({ campusId: req.params.id, author: userId });

    let finalComment;

    if (existingComments.length > 0) {
      // İlk yorumu al, güncelle
      finalComment = existingComments[0];

      // ÖNEMLI: Eğer yorum otomatik mesajlardan biriyse, oy değişince içeriği güncelle
      // Ama kullanıcı manuel yorum yazmışsa içeriği KORU, sadece voteType'ı güncelle
      const autoMessages = Object.values(voteMessages);
      const isAutoComment = autoMessages.includes(finalComment.content);

      if (isAutoComment) {
        finalComment.content = voteMessages[type]; // Otomatik yorumu güncelle
      }
      // Manuel yorumsa içeriği koru, sadece voteType'ı güncelle
      finalComment.voteType = type;
      await finalComment.save();

      // VARSA DİĞER FAZLALIKLARI SİL (Duplicate temizliği)
      if (existingComments.length > 1) {
        const idsToDelete = existingComments.slice(1).map(c => c._id);
        await CampusComment.deleteMany({ _id: { $in: idsToDelete } });
      }
    } else {
      // Hiç yorum yoksa yeni oluştur
      finalComment = new CampusComment({
        campusId: req.params.id,
        content: voteMessages[type],
        author: userId,
        voteType: type
      });
      await finalComment.save();
    }

    res.json({ campus, userVote: type });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Sunucu hatası" });
  }
});

// Kampüs yorumlarını getir
app.get('/api/campus/:id/comments', async (req, res) => {
  try {
    const comments = await CampusComment.find({ campusId: req.params.id })
      .populate('author', 'username profilePicture')
      .sort({ createdAt: -1 });
    res.json(comments);
  } catch (err) {
    console.error("Yorumları getirme hatası:", err);
    res.status(500).json({ error: "Yorumlar getirilemedi" });
  }
});

// 2. YORUM YAPMA ENDPOINT'İ (TERMINATÖR MODU: Eskileri temizler) - 20 saniye cooldown
// --- YORUM YAPMA (BİLDİRİMLİ) ---
app.post('/api/posts/:postId/comments', auth, cooldown('comment'), async (req, res) => {
  try {
    const { content } = req.body;
    const postId = req.params.postId;
    const userId = req.userId;

    if (!content || content.trim().length === 0) return res.status(400).json({ message: 'Boş olamaz' });
    if (content.length > 500) return res.status(400).json({ message: 'Yorum çok uzun' });

    // DÜZELTME: author field'ı select: false olduğu için +author ile dahil ediyoruz
    const post = await Post.findById(postId).select('+author');
    if (!post) return res.status(404).json({ message: 'Post bulunamadı' });

    const comment = new Comment({ content, author: userId, post: postId });
    await comment.save();
    await comment.populate('author', 'username profilePicture fullName');

    // 1. Post Sahibine Bildirim
    // DÜZELTME: !post.isAnonymous kontrolü kaldırıldı.
    console.log(`[YORUM] Post ID: ${postId}, Author: ${post.author}, Current User: ${userId}, isAnonymous: ${post.isAnonymous}`);

    if (post.author && userId.toString() !== post.author.toString()) {
      const notification = await Notification.create({
        recipient: post.author,
        sender: userId,
        type: 'comment',
        post: postId,
        comment: comment._id
      });
      console.log(`💬 Yorum Bildirimi OLUŞTURULDU -> Alıcı: ${post.author}, Bildirim ID: ${notification._id}`);
    } else {
      console.log(`⚠️ Yorum Bildirimi OLUŞTURULAMADI - Sebep: ${!post.author ? 'Post author yok' : 'Kendi postuna yorum yaptın'}`);
    }

    // 2. Mention Bildirimleri
    const mentions = extractMentions(content);
    console.log(`[MENTION] Bulunan mention'lar:`, mentions);
    if (mentions.length > 0) {
      const mentionedUsers = await User.find({ username: { $in: mentions }, _id: { $ne: userId } }).select('_id');
      console.log(`[MENTION] Mention edilen kullanıcılar:`, mentionedUsers.map(u => u._id));
      const mentionNotifs = mentionedUsers.map(user => ({
        recipient: user._id,
        sender: userId,
        type: 'mention',
        post: postId,
        comment: comment._id
      }));
      if (mentionNotifs.length > 0) {
        await Notification.insertMany(mentionNotifs);
        console.log(`📢 ${mentionNotifs.length} Mention Bildirimi OLUŞTURULDU`);
      }
    }

    res.status(201).json(comment);
  } catch (err) {
    console.error('Yorum hatası:', err);
    res.status(500).json({ message: 'Yorum yapılamadı' });
  }
});

// Kampüs yorumunu beğenme
app.post('/api/campus/comments/:id/like', auth, async (req, res) => {
  try {
    const comment = await CampusComment.findById(req.params.id);
    if (!comment) {
      return res.status(404).json({ error: 'Yorum bulunamadı' });
    }

    const userId = req.userId;
    const isLiked = comment.likes.includes(userId);

    if (isLiked) {
      comment.likes.pull(userId);
    } else {
      comment.likes.push(userId);
    }

    let updatedComment = await comment.save();
    updatedComment = await updatedComment.populate('author', 'username profilePicture');
    res.json(updatedComment);
  } catch (err) {
    console.error("Yorum beğenme hatası:", err);
    res.status(500).json({ error: "İşlem sırasında bir hata oluştu." });
  }
});

// Kampüs yorumu düzenle
app.put('/api/campus/comments/:id', auth, async (req, res) => {
  try {
    const comment = await CampusComment.findById(req.params.id);
    if (!comment) {
      return res.status(404).json({ error: 'Yorum bulunamadı' });
    }

    // Yalnızca yorum sahibi düzenleyebilir
    if (comment.author.toString() !== req.userId) {
      return res.status(403).json({ error: 'Bu yorumu düzenleme yetkiniz yok' });
    }

    // Otomatik yorumlar düzenlenemez
    const voteMessages = ['👍 Bu kampüsü beğendim!', '😐 İdare eder.', '👎 Pek beğenmedim.'];
    if (voteMessages.includes(comment.content)) {
      return res.status(403).json({ error: 'Otomatik yorumlar düzenlenemez' });
    }

    comment.content = req.body.content;
    let updatedComment = await comment.save();
    updatedComment = await updatedComment.populate('author', 'username profilePicture');
    res.json(updatedComment);
  } catch (err) {
    console.error("Yorum düzenleme hatası:", err);
    res.status(500).json({ error: "İşlem sırasında bir hata oluştu." });
  }
});

// --- KULLANICI İŞLEMLERİ (AUTH) ---

// Kayıt Ol (GÜNCELLENMİŞ - MAİL DOĞRULAMA EKLENDİ)
app.post('/api/register', async (req, res) => {
  const { fullName, username, email, birthDate, password } = req.body;

  try {
    // 1. Email Kontrolü (Domain Doğrulama)
    if (!email.endsWith('@ogrenci.karabuk.edu.tr')) {
      return res.status(400).json({ error: "Sadece @ogrenci.karabuk.edu.tr mail adresi ile kayıt olunabilir." });
    }

    // 2. Kullanıcı Adı veya Email daha önce alınmış mı?
    const existingUser = await User.findOne({ $or: [{ username }, { email }] });
    if (existingUser) {
      return res.status(400).json({ error: "Bu kullanıcı adı veya email zaten kullanılıyor." });
    }

    // 3. Şifreleme ve Token Oluşturma
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    const verificationToken = crypto.randomBytes(32).toString('hex'); // EKLENDİ

    // 4. Mail Gönderme (Resend ile)
    const verificationLink = `${process.env.BACKEND_URL}/api/verify-email?token=${verificationToken}`;

    try {
      const { data, error } = await resend.emails.send({
        from: 'KBÜ Sosyal <onboarding@resend.dev>',
        to: email,
        subject: '🎓 Hoş Geldin! Hesabını Doğrula - KBÜ Sosyal',
        html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Hesabını Doğrula</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f3f4f6; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f3f4f6; padding: 40px 20px;">
    <tr>
      <td align="center">
        <!-- Main Container -->
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">

          <!-- Header with Logo and Background -->
          <tr>
            <td style="background: linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%); padding: 40px 30px; text-align: center;">
              <div style="background-color: white; display: inline-block; padding: 15px 30px; border-radius: 12px; margin-bottom: 20px;">
                <h1 style="margin: 0; font-size: 32px; font-weight: 800; letter-spacing: -1px; color: #1e3a8a;">
                  KBÜ<span style="color: #dc2626;">Sosyal</span>
                </h1>
              </div>
              <h2 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 600;">
                Hesabını Doğrula
              </h2>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding: 40px 30px;">
              <h1 style="color: #1f2937; font-size: 28px; margin: 0 0 20px 0; font-weight: 700;">
                Merhaba ${fullName}! 👋
              </h1>

              <p style="color: #4b5563; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
                KBÜ Sosyal'e hoş geldin! Karabük Üniversitesi öğrencilerine özel platformumuza katıldığın için çok mutluyuz.
              </p>

              <p style="color: #4b5563; font-size: 16px; line-height: 1.6; margin: 0 0 30px 0;">
                Hesabını aktif etmek ve aramıza katılmak için aşağıdaki butona tıklaman yeterli:
              </p>

              <!-- CTA Button -->
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center" style="padding: 20px 0;">
                    <a href="${verificationLink}" style="background: linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%); color: #ffffff; text-decoration: none; padding: 16px 40px; border-radius: 8px; font-weight: 600; font-size: 16px; display: inline-block; box-shadow: 0 4px 6px rgba(59, 130, 246, 0.3);">
                      ✓ Hesabımı Doğrula
                    </a>
                  </td>
                </tr>
              </table>

              <!-- Features Box -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-top: 30px; background-color: #f9fafb; border-radius: 12px; padding: 20px;">
                <tr>
                  <td>
                    <p style="color: #1f2937; font-size: 14px; font-weight: 600; margin: 0 0 15px 0;">
                      📱 Seni Neler Bekliyor?
                    </p>
                    <ul style="color: #6b7280; font-size: 14px; line-height: 1.8; margin: 0; padding-left: 20px;">
                      <li>Kampüs hayatını paylaş</li>
                      <li>Öğrenci topluluklarına katıl</li>
                      <li>Kampüsler hakkında görüş bildir</li>
                      <li>Anonim itiraflar yap</li>
                    </ul>
                  </td>
                </tr>
              </table>

              <!-- Alternative Link -->
              <p style="color: #9ca3af; font-size: 13px; line-height: 1.6; margin: 30px 0 0 0; padding-top: 20px; border-top: 1px solid #e5e7eb;">
                Buton çalışmıyorsa, aşağıdaki linki tarayıcına kopyala:<br>
                <a href="${verificationLink}" style="color: #3b82f6; word-break: break-all;">${verificationLink}</a>
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #f9fafb; padding: 30px; text-align: center; border-top: 1px solid #e5e7eb;">
              <p style="color: #6b7280; font-size: 13px; margin: 0 0 10px 0;">
                Bu maili sen talep etmediysen, güvenle görmezden gelebilirsin.
              </p>
              <p style="color: #9ca3af; font-size: 12px; margin: 0;">
                © 2024 KBÜ Sosyal • Karabük Üniversitesi Öğrenci Platformu
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
        `
      });

      if (error) {
        console.error("❌ Resend error:", error);
        return res.status(500).json({
          error: "Mail gönderilemedi. Lütfen daha sonra tekrar deneyin.",
          details: process.env.NODE_ENV === 'development' ? error : undefined
        });
      }

      console.log('✅ Doğrulama maili başarıyla gönderildi:', email);
      console.log('📧 Resend Mail ID:', data?.id);
    } catch (mailError) {
      console.error("❌ Mail gönderme hatası (catch):", mailError);
      return res.status(500).json({
        error: "Mail gönderilemedi. Lütfen daha sonra tekrar deneyin.",
        details: process.env.NODE_ENV === 'development' ? mailError.message : undefined
      });
    }

    // 5. Kaydetme (Mail başarılıysa)
    const newUser = new User({
      fullName,
      username,
      email,
      birthDate,
      password: hashedPassword,
      verificationToken: verificationToken,
      isVerified: false
    });

    await newUser.save();
    res.json({ message: "Kayıt başarılı! Lütfen okul mailine gelen linke tıkla." });

  } catch (err) {
    console.log(err);
    res.status(500).json({ error: "Sunucu hatası oluştu." });
  }
});

// Mail Doğrulama Endpoint'i (YENİ EKLENDİ)
// Mail Doğrulama Endpoint'i (GÖRSEL TASARIM GÜNCELLENDİ)
 // Mail Doğrulama Endpoint'i (LOGIN PAGE TASARIMI İLE BİREBİR)
// Mail Doğrulama Endpoint'i (GÖRSEL TASARIM - ERROR & SUCCESS)
app.get('/api/verify-email', async (req, res) => {
  const { token } = req.query;
  const frontendURL = process.env.FRONTEND_URL; // .env'den çekiliyor

  // --- ORTAK CSS STİLLERİ ---
  const commonStyles = `
    /* Reset ve Temel Fontlar */
    * { box-sizing: border-box; }
    body { margin: 0; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif; background-color: #f9fafb; }
    .container { display: flex; min-height: 100vh; }
    
    /* SOL TARAF (Görsel Alanı) */
    .left-side {
      display: none;
      width: 50%;
      background-color: #1e3a8a; 
      position: relative;
      align-items: center;
      justify-content: center;
      overflow: hidden;
    }
    .left-overlay { position: absolute; inset: 0; background-color: rgba(0,0,0,0.6); z-index: 10; }
    .bg-image { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; }
    .left-content { position: relative; z-index: 20; color: white; padding: 3rem; max-width: 32rem; }
    
    .brand-title { font-size: 3.75rem; font-weight: 700; margin-bottom: 1.5rem; letter-spacing: -0.05em; line-height: 1; }
    .text-red { color: #ef4444; }
    .brand-desc { font-size: 1.25rem; font-weight: 300; opacity: 0.9; line-height: 1.6; }

    /* SAĞ TARAF (İçerik Alanı) */
    .right-side {
      width: 100%;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 2rem;
      background-color: white;
    }
    .card { width: 100%; max-width: 28rem; text-align: center; }

    /* İkon Yuvarlağı */
    .icon-circle { 
      width: 7rem; height: 7rem;
      border-radius: 50%; 
      display: flex; align-items: center; justify-content: center; 
      margin: 0 auto 2rem auto;
    }
    /* Başarılı İkon Rengi */
    .icon-success { background-color: #dcfce7; color: #16a34a; }
    /* Hatalı İkon Rengi */
    .icon-error { background-color: #fee2e2; color: #dc2626; }

    /* Yazı Stilleri */
    .title { 
      font-size: 2.25rem; 
      font-weight: 700;
      color: #111827;
      margin: 0 0 0.5rem 0;
      letter-spacing: -0.025em;
    }
    .desc { 
      color: #6b7280;
      margin-bottom: 2.5rem; 
      font-size: 1.1rem; 
      font-weight: 400;
      line-height: 1.5;
    }

    /* Buton */
    .login-btn {
      display: block;
      width: 100%;
      background-color: #1e3a8a;
      color: white;
      font-weight: 700;
      padding: 0.85rem 0;
      border-radius: 0.5rem;
      text-decoration: none;
      font-size: 1rem;
      border: none;
      cursor: pointer;
    }
    
    @media (min-width: 1024px) {
      .left-side { display: flex; }
      .right-side { width: 50%; }
    }
  `;

  // --- SOL TARAF HTML (ORTAK) ---
  const leftSideHTML = `
    <div class="left-side">
      <div class="left-overlay"></div>
      <img src="https://i.hizliresim.com/22fuec9.png" alt="Campus Life" class="bg-image">
      <div class="left-content">
        <div class="brand-title">KBÜ<span class="text-red">Sosyal</span>.</div>
        <p class="brand-desc">Sadece KBÜ öğrencilerine özel, güvenli ve anonim sosyal platform.</p>
      </div>
    </div>
  `;

  try {
    const user = await User.findOne({ verificationToken: token });

    // --- HATA SAYFASI (Eğer token geçersizse) ---
    if (!user) {
      return res.status(400).send(`
        <!DOCTYPE html>
        <html lang="tr">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Geçersiz Bağlantı - KBÜ Sosyal</title>
          <style>${commonStyles}</style>
        </head>
        <body>
          <div class="container">
            ${leftSideHTML}
            <div class="right-side">
              <div class="card">
                <div class="icon-circle icon-error">
                  <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
                    <line x1="18" y1="6" x2="6" y2="18"></line>
                    <line x1="6" y1="6" x2="18" y2="18"></line>
                  </svg>
                </div>
                <h2 class="title">Geçersiz Bağlantı</h2>
                <p class="desc">Bu doğrulama bağlantısı hatalı veya süresi dolmuş.<br>Lütfen tekrar giriş yaparak yeni mail isteyin.</p>
                <a href="${frontendURL}" class="login-btn">Giriş Ekranına Dön</a>
              </div>
            </div>
          </div>
        </body>
        </html>
      `);
    }

    // --- BAŞARILI DURUM ---
    user.isVerified = true;
    user.verificationToken = undefined;
    await user.save();

    res.send(`
      <!DOCTYPE html>
      <html lang="tr">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Hesap Doğrulandı - KBÜ Sosyal</title>
        <style>${commonStyles}</style>
      </head>
      <body>
        <div class="container">
          ${leftSideHTML}
          <div class="right-side">
            <div class="card">
              <div class="icon-circle icon-success">
                <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
                  <polyline points="20 6 9 17 4 12"></polyline>
                </svg>
              </div>
              <h2 class="title">Hesabın Doğrulandı!</h2>
              <p class="desc">Mail adresin başarıyla onaylandı. Aramıza hoş geldin!<br>Artık giriş yapabilirsin.</p>
              <a href="${frontendURL}" class="login-btn">Giriş Yap</a>
            </div>
          </div>
        </div>
      </body>
      </html>
    `);

  } catch (err) {
    console.log(err);
    res.status(500).send("Sunucu hatası");
  }
});
// Giriş Yap (GÜNCELLENMİŞ)
app.post('/api/login', async (req, res) => {
  const { username, password } = req.body;
  try {
    const user = await User.findOne({ username });
    if (!user) return res.status(404).json({ error: "Kullanıcı bulunamadı" });

    // Şifre kontrolü
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ error: "Şifre yanlış" });

    // --- EKLENDİ: DOĞRULAMA KONTROLÜ ---
    if (!user.isVerified) {
      return res.status(400).json({ error: "Lütfen önce mail adresinize gelen link ile hesabınızı doğrulayın." });
    }
    // -----------------------------------

    // Giriş bileti (Token) oluştur
    const token = jwt.sign({ id: user._id, username: user.username }, JWT_SECRET);
    res.json({
      token,
      username: user.username,
      profilePicture: user.profilePicture,
      interests: user.interests || [] // Kullanıcı ilgi alanlarını da gönder
    });
  } catch (err) {
    res.status(500).json(err);
  }
});

// --- PROFİL İŞLEMLERİ ---

// Profil bilgilerini getir
app.get('/api/profile', async (req, res) => {
  const token = req.headers.authorization?.split(' ')[1];
  try {
    if (!token) return res.status(401).json({ error: "Oturum açmanız gerekiyor" });

    const decoded = jwt.verify(token, JWT_SECRET);
    const user = await User.findById(decoded.id).select('-password');
    if (!user) return res.status(404).json({ error: "Kullanıcı bulunamadı" });

    res.json(user);
  } catch (err) {
    res.status(500).json({ error: "Sunucu hatası" });
  }
});

// Profil resmi güncelle (Multer ile dosya upload)
app.post('/api/profile/picture', auth, (req, res) => {
  upload.single('profilePicture')(req, res, async (err) => {
    try {
      // Handle multer errors
      if (err instanceof multer.MulterError) {
        console.error('Multer error:', err);
        if (err.code === 'LIMIT_FILE_SIZE') {
          return res.status(400).json({ error: "Dosya boyutu en fazla 5MB olabilir" });
        }
        return res.status(400).json({ error: "Dosya yükleme hatası: " + err.message });
      } else if (err) {
        console.error('Upload error:', err);
        return res.status(400).json({ error: err.message || "Dosya yüklenemedi" });
      }

      if (!req.file) {
        return res.status(400).json({ error: "Dosya yüklenmedi" });
      }

      const user = await User.findById(req.userId);
      if (!user) {
        return res.status(404).json({ error: "Kullanıcı bulunamadı" });
      }

      // Delete old profile picture if exists (optional)
      // TODO: Implement old file deletion with fs.unlink if needed

      // Save new profile picture URL
      // Use HTTPS in production, HTTP in development
      const protocol = process.env.NODE_ENV === 'production' ? 'https' : req.protocol;
      const profilePictureUrl = `${protocol}://${req.get('host')}/uploads/profiles/${req.file.filename}`;
      user.profilePicture = profilePictureUrl;
      await user.save();

      res.json({
        message: "Profil resmi güncellendi",
        profilePicture: user.profilePicture
      });
    } catch (err) {
      console.error('Profile picture upload error:', err);
      res.status(500).json({ error: "Sunucu hatası: " + err.message });
    }
  });
});

// Kullanıcı adı güncelle
app.put('/api/profile/username', async (req, res) => {
  const token = req.headers.authorization?.split(' ')[1];
  const { newUsername } = req.body;

  try {
    if (!token) return res.status(401).json({ error: "Oturum açmanız gerekiyor" });

    const decoded = jwt.verify(token, JWT_SECRET);
    const user = await User.findById(decoded.id);
    if (!user) return res.status(404).json({ error: "Kullanıcı bulunamadı" });

    // Kullanıcı adı daha önce alınmış mı?
    const existingUser = await User.findOne({ username: newUsername });
    if (existingUser && existingUser._id.toString() !== user._id.toString()) {
      return res.status(400).json({ error: "Bu kullanıcı adı zaten kullanılıyor" });
    }

    user.username = newUsername;
    await user.save();

    // Yeni token oluştur
    const newToken = jwt.sign({ id: user._id, username: user.username }, JWT_SECRET);
    res.json({ message: "Kullanıcı adı güncellendi", token: newToken, username: user.username });
  } catch (err) {
    res.status(500).json({ error: "Sunucu hatası" });
  }
});

// Şifre güncelle
app.put('/api/profile/password', async (req, res) => {
  const token = req.headers.authorization?.split(' ')[1];
  const { currentPassword, newPassword } = req.body;

  try {
    if (!token) return res.status(401).json({ error: "Oturum açmanız gerekiyor" });

    const decoded = jwt.verify(token, JWT_SECRET);
    const user = await User.findById(decoded.id);
    if (!user) return res.status(404).json({ error: "Kullanıcı bulunamadı" });

    // Mevcut şifre doğru mu?
    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) return res.status(400).json({ error: "Mevcut şifre yanlış" });

    // Yeni şifreyi hashle
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);
    await user.save();

    res.json({ message: "Şifre güncellendi" });
  } catch (err) {
    res.status(500).json({ error: "Sunucu hatası" });
  }
});

// İlgi alanlarını güncelle (Kişiselleştirilmiş reklamlar için)
app.put('/api/profile/interests', async (req, res) => {
  const token = req.headers.authorization?.split(' ')[1];
  const { interests } = req.body;

  try {
    if (!token) return res.status(401).json({ error: "Oturum açmanız gerekiyor" });

    const decoded = jwt.verify(token, JWT_SECRET);
    const user = await User.findById(decoded.id);
    if (!user) return res.status(404).json({ error: "Kullanıcı bulunamadı" });

    // İlgi alanlarını güncelle
    user.interests = interests;
    await user.save();

    res.json({ message: "İlgi alanları güncellendi", interests: user.interests });
  } catch (err) {
    res.status(500).json({ error: "Sunucu hatası" });
  }
});

// Bio güncelle
app.put('/api/profile/bio', async (req, res) => {
  const token = req.headers.authorization?.split(' ')[1];
  const { bio } = req.body;

  try {
    if (!token) return res.status(401).json({ error: "Oturum açmanız gerekiyor" });

    const decoded = jwt.verify(token, JWT_SECRET);
    const user = await User.findById(decoded.id);
    if (!user) return res.status(404).json({ error: "Kullanıcı bulunamadı" });

    // Bio max 160 karakter
    if (bio && bio.length > 160) {
      return res.status(400).json({ error: "Bio en fazla 160 karakter olabilir" });
    }

    user.bio = bio;
    await user.save();

    res.json({ message: "Bio güncellendi", bio: user.bio });
  } catch (err) {
    res.status(500).json({ error: "Sunucu hatası" });
  }
});

// Hesap gizliliğini değiştir
app.put('/api/profile/privacy', async (req, res) => {
  const token = req.headers.authorization?.split(' ')[1];
  const { isPrivate } = req.body;

  try {
    if (!token) return res.status(401).json({ error: "Oturum açmanız gerekiyor" });

    const decoded = jwt.verify(token, JWT_SECRET);
    const user = await User.findById(decoded.id);
    if (!user) return res.status(404).json({ error: "Kullanıcı bulunamadı" });

    user.isPrivate = isPrivate;
    await user.save();

    res.json({ message: "Gizlilik ayarları güncellendi", isPrivate: user.isPrivate });
  } catch (err) {
    res.status(500).json({ error: "Sunucu hatası" });
  }
});

// ============================================
// KULLANICI PROFİLİ VE TAKİP SİSTEMİ
// ============================================


// 1. SIRADA: ARAMA (Search) - MUTLAKA ÜSTTE OLMALI


// 2. SIRADA: PROFİL (:username) - MUTLAKA ARAMADAN SONRA OLMALI
app.get('/api/users/:username', async (req, res) => {
  try {
    // Eğer kod buraya giriyorsa, username "search" değildir.
    const user = await User.findOne({ username: req.params.username })
      .select('-password -votedCampuses -votedCommunities')
      .populate('followers', 'username fullName profilePicture')
      .populate('following', 'username fullName profilePicture');

    if (!user) return res.status(404).json({ error: "Kullanıcı bulunamadı" });

    res.json(user);
  } catch (err) {
    res.status(500).json({ error: "Sunucu hatası" });
  }
});

// Kullanıcının postlarını getir
app.get('/api/users/:userId/posts', async (req, res) => {
  try {
    const { userId } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    // Kullanıcıyı kontrol et
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ error: "Kullanıcı bulunamadı" });

    // Kullanıcının postlarını çek (Geyik kategorisi, anonim olmayanlar)
    const [posts, totalCount] = await Promise.all([
      Post.find({ author: userId, isAnonymous: false, category: 'Geyik' })
        .populate('author', 'username profilePicture')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Post.countDocuments({ author: userId, isAnonymous: false, category: 'Geyik' })
    ]);

    res.json({
      posts,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(totalCount / limit),
        totalCount,
        hasMore: skip + posts.length < totalCount
      }
    });
  } catch (err) {
    res.status(500).json({ error: "Sunucu hatası" });
  }
});

// Kullanıcının itiraflarını getir (sadece anonim olmayanlar)
app.get('/api/users/:userId/confessions', async (req, res) => {
  try {
    const { userId } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ error: "Kullanıcı bulunamadı" });

    const [confessions, totalCount] = await Promise.all([
      Post.find({ author: userId, isAnonymous: false, category: 'İtiraf' })
        .populate('author', 'username profilePicture')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Post.countDocuments({ author: userId, isAnonymous: false, category: 'İtiraf' })
    ]);

    res.json({
      posts: confessions,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(totalCount / limit),
        totalCount,
        hasMore: skip + confessions.length < totalCount
      }
    });
  } catch (err) {
    res.status(500).json({ error: "Sunucu hatası" });
  }
});

// Kullanıcıyı takip et
app.post('/api/users/:userId/follow', async (req, res) => {
  const token = req.headers.authorization?.split(' ')[1];

  try {
    if (!token) return res.status(401).json({ error: "Oturum açmanız gerekiyor" });

    const decoded = jwt.verify(token, JWT_SECRET);
    const currentUserId = decoded.id;
    const { userId } = req.params;

    // Kendini takip etmeye çalışma
    if (currentUserId === userId) {
      return res.status(400).json({ error: "Kendinizi takip edemezsiniz" });
    }

    const [currentUser, targetUser] = await Promise.all([
      User.findById(currentUserId),
      User.findById(userId)
    ]);

    if (!currentUser || !targetUser) {
      return res.status(404).json({ error: "Kullanıcı bulunamadı" });
    }

    // Zaten takip ediyor mu?
    if (currentUser.following.includes(userId)) {
      return res.status(400).json({ error: "Zaten takip ediyorsunuz" });
    }

    // Gizli hesap mı?
    if (targetUser.isPrivate) {
      // Takip isteği gönder
      if (!targetUser.followRequests.includes(currentUserId)) {
        targetUser.followRequests.push(currentUserId);
        await targetUser.save();

        // Takip isteği bildirimi oluştur
        await Notification.create({
          recipient: userId,
          sender: currentUserId,
          type: 'follow_request'
        });
      }
      return res.json({ message: "Takip isteği gönderildi", status: "pending" });
    }

    // Açık hesap - direkt takip et
    currentUser.following.push(userId);
    targetUser.followers.push(currentUserId);

    await Promise.all([currentUser.save(), targetUser.save()]);

    // Takip bildirimi oluştur (açık hesaplar için)
    await Notification.create({
      recipient: userId,
      sender: currentUserId,
      type: 'follow_accept' // Açık hesaplarda direkt takip, yani "kabul edilmiş" gibi
    });

    res.json({ message: "Takip edildi", status: "following" });
  } catch (err) {
    res.status(500).json({ error: "Sunucu hatası" });
  }
});

// Takibi bırak
app.post('/api/users/:userId/unfollow', async (req, res) => {
  const token = req.headers.authorization?.split(' ')[1];

  try {
    if (!token) return res.status(401).json({ error: "Oturum açmanız gerekiyor" });

    const decoded = jwt.verify(token, JWT_SECRET);
    const currentUserId = decoded.id;
    const { userId } = req.params;

    const [currentUser, targetUser] = await Promise.all([
      User.findById(currentUserId),
      User.findById(userId)
    ]);

    if (!currentUser || !targetUser) {
      return res.status(404).json({ error: "Kullanıcı bulunamadı" });
    }

    // Takip ediyorsan kaldır
    currentUser.following = currentUser.following.filter(id => id.toString() !== userId);
    targetUser.followers = targetUser.followers.filter(id => id.toString() !== currentUserId);

    // Bekleyen istek varsa kaldır
    targetUser.followRequests = targetUser.followRequests.filter(id => id.toString() !== currentUserId);

    await Promise.all([currentUser.save(), targetUser.save()]);

    // İlgili bildirimleri sil
    await Notification.deleteMany({
      recipient: userId,
      sender: currentUserId,
      type: { $in: ['follow_request', 'follow_accept'] }
    });

    res.json({ message: "Takip bırakıldı" });
  } catch (err) {
    res.status(500).json({ error: "Sunucu hatası" });
  }
});

// Takip isteğini kabul et
app.post('/api/users/:userId/accept-follow', async (req, res) => {
  const token = req.headers.authorization?.split(' ')[1];

  try {
    if (!token) return res.status(401).json({ error: "Oturum açmanız gerekiyor" });

    const decoded = jwt.verify(token, JWT_SECRET);
    const currentUserId = decoded.id;
    const { userId } = req.params; // Takip isteği gönderen kullanıcı

    const [currentUser, requesterUser] = await Promise.all([
      User.findById(currentUserId),
      User.findById(userId)
    ]);

    if (!currentUser || !requesterUser) {
      return res.status(404).json({ error: "Kullanıcı bulunamadı" });
    }

    // İstek var mı?
    if (!currentUser.followRequests.includes(userId)) {
      return res.status(400).json({ error: "Takip isteği bulunamadı" });
    }

    // İsteği kaldır ve takip et
    currentUser.followRequests = currentUser.followRequests.filter(id => id.toString() !== userId);
    currentUser.followers.push(userId);
    requesterUser.following.push(currentUserId);

    await Promise.all([currentUser.save(), requesterUser.save()]);

    // Takip isteği bildirimini sil ve kabul bildirimi oluştur
    await Notification.deleteOne({
      recipient: currentUserId,
      sender: userId,
      type: 'follow_request'
    });

    await Notification.create({
      recipient: userId,
      sender: currentUserId,
      type: 'follow_accept'
    });

    res.json({ message: "Takip isteği kabul edildi" });
  } catch (err) {
    res.status(500).json({ error: "Sunucu hatası" });
  }
});

// Takip isteğini reddet
app.post('/api/users/:userId/reject-follow', async (req, res) => {
  const token = req.headers.authorization?.split(' ')[1];

  try {
    if (!token) return res.status(401).json({ error: "Oturum açmanız gerekiyor" });

    const decoded = jwt.verify(token, JWT_SECRET);
    const currentUserId = decoded.id;
    const { userId } = req.params;

    const currentUser = await User.findById(currentUserId);
    if (!currentUser) return res.status(404).json({ error: "Kullanıcı bulunamadı" });

    // İsteği kaldır
    currentUser.followRequests = currentUser.followRequests.filter(id => id.toString() !== userId);
    await currentUser.save();

    // Takip isteği bildirimini sil
    await Notification.deleteOne({
      recipient: currentUserId,
      sender: userId,
      type: 'follow_request'
    });

    res.json({ message: "Takip isteği reddedildi" });
  } catch (err) {
    res.status(500).json({ error: "Sunucu hatası" });
  }
});

// Takipçileri listele
app.get('/api/users/:userId/followers', async (req, res) => {
  try {
    const user = await User.findById(req.params.userId)
      .populate('followers', 'username fullName profilePicture bio');

    if (!user) return res.status(404).json({ error: "Kullanıcı bulunamadı" });

    res.json(user.followers);
  } catch (err) {
    res.status(500).json({ error: "Sunucu hatası" });
  }
});

// Takip edilenleri listele
app.get('/api/users/:userId/following', async (req, res) => {
  try {
    const user = await User.findById(req.params.userId)
      .populate('following', 'username fullName profilePicture bio');

    if (!user) return res.status(404).json({ error: "Kullanıcı bulunamadı" });

    res.json(user.following);
  } catch (err) {
    res.status(500).json({ error: "Sunucu hatası" });
  }
});

// ============================================
// ADMIN PANELİ API ENDPOINTS
// ============================================

// Kullanıcı rolünü kontrol et
app.get('/api/admin/check-role', auth, async (req, res) => {
  try {
    const user = await User.findById(req.userId).select('role username');
    res.json({ role: user.role, username: user.username });
  } catch (err) {
    res.status(500).json({ error: "Sunucu hatası" });
  }
});

// --- KULLANICI YÖNETİMİ ---
// Tüm kullanıcıları listele
app.get('/api/admin/users', adminAuth, async (req, res) => {
  try {
    const users = await User.find()
      .select('-password')
      .sort({ createdAt: -1 });
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: "Kullanıcılar getirilemedi" });
  }
});

// Kullanıcı rolünü güncelle
app.put('/api/admin/users/:id/role', strictAdminAuth, async (req, res) => {
  try {
    const { role } = req.body;
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { role },
      { new: true }
    ).select('-password');
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: "Rol güncellenemedi" });
  }
});

// Kullanıcı doğrulama durumu değiştir
app.put('/api/admin/users/:id/verify', adminAuth, async (req, res) => {
  try {
    const { isVerified } = req.body;
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { isVerified },
      { new: true }
    ).select('-password');
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: "Doğrulama durumu güncellenemedi" });
  }
});

// Kullanıcıyı sil
app.delete('/api/admin/users/:id', strictAdminAuth, async (req, res) => {
  try {
    await User.findByIdAndDelete(req.params.id);
    res.json({ message: "Kullanıcı silindi" });
  } catch (err) {
    res.status(500).json({ error: "Kullanıcı silinemedi" });
  }
});

// --- REKLAM YÖNETİMİ ---
// Tüm reklamları listele
app.get('/api/admin/advertisements', adminAuth, async (req, res) => {
  try {
    const ads = await Advertisement.find()
      .populate('createdBy', 'username')
      .sort({ createdAt: -1 });
    res.json(ads);
  } catch (err) {
    res.status(500).json({ error: "Reklamlar getirilemedi" });
  }
});

// Aktif reklamları getir (herkes görebilir)
app.get('/api/advertisements', async (req, res) => {
  try {
    const { placement } = req.query;
    const query = { isActive: true };
    if (placement) query.placement = placement;

    const now = new Date();
    const ads = await Advertisement.find({
      ...query,
      $or: [
        { startDate: { $lte: now }, endDate: { $gte: now } },
        { startDate: null, endDate: null }
      ]
    });
    res.json(ads);
  } catch (err) {
    res.status(500).json({ error: "Reklamlar getirilemedi" });
  }
});

// Reklam oluştur
app.post('/api/admin/advertisements', adminAuth, async (req, res) => {
  try {
    const adData = { ...req.body, createdBy: req.userId };

    // Eğer durationMinutes varsa, otomatik olarak startDate ve endDate oluştur
    if (req.body.durationMinutes) {
      const now = new Date();
      adData.startDate = now;
      adData.endDate = new Date(now.getTime() + req.body.durationMinutes * 60000);
      delete adData.durationMinutes; // Bu alanı modelde tutmuyoruz
    }

    const newAd = new Advertisement(adData);
    await newAd.save();
    res.json(newAd);
  } catch (err) {
    console.error('Reklam oluşturma hatası:', err);
    res.status(500).json({ error: "Reklam oluşturulamadı" });
  }
});

// Reklam güncelle
app.put('/api/admin/advertisements/:id', adminAuth, async (req, res) => {
  try {
    const updateData = { ...req.body };

    // Eğer durationMinutes varsa, otomatik olarak startDate ve endDate oluştur
    if (req.body.durationMinutes) {
      const now = new Date();
      updateData.startDate = now;
      updateData.endDate = new Date(now.getTime() + req.body.durationMinutes * 60000);
      delete updateData.durationMinutes;
    }

    const ad = await Advertisement.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true }
    );
    res.json(ad);
  } catch (err) {
    res.status(500).json({ error: "Reklam güncellenemedi" });
  }
});

// Reklam sil
app.delete('/api/admin/advertisements/:id', adminAuth, async (req, res) => {
  try {
    await Advertisement.findByIdAndDelete(req.params.id);
    res.json({ message: "Reklam silindi" });
  } catch (err) {
    res.status(500).json({ error: "Reklam silinemedi" });
  }
});

// Reklam tıklama/gösterim istatistikleri güncelle
app.post('/api/advertisements/:id/track', async (req, res) => {
  try {
    const { type } = req.body; // 'impression' veya 'click'
    const update = type === 'click'
      ? { $inc: { clicks: 1 } }
      : { $inc: { impressions: 1 } };

    await Advertisement.findByIdAndUpdate(req.params.id, update);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: "İstatistik güncellenemedi" });
  }
});

// --- KAMPÜS YÖNETİMİ ---
// Kampüs oluştur
app.post('/api/admin/campuses', adminAuth, async (req, res) => {
  try {
    const newCampus = new Campus(req.body);
    await newCampus.save();
    res.json(newCampus);
  } catch (err) {
    res.status(500).json({ error: "Kampüs oluşturulamadı" });
  }
});

// Kampüs güncelle
app.put('/api/admin/campuses/:id', adminAuth, async (req, res) => {
  try {
    const campus = await Campus.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    res.json(campus);
  } catch (err) {
    res.status(500).json({ error: "Kampüs güncellenemedi" });
  }
});

// Kampüs sil
app.delete('/api/admin/campuses/:id', strictAdminAuth, async (req, res) => {
  try {
    await Campus.findByIdAndDelete(req.params.id);
    res.json({ message: "Kampüs silindi" });
  } catch (err) {
    res.status(500).json({ error: "Kampüs silinemedi" });
  }
});

// --- TOPLULUK YÖNETİMİ ---
// Tüm toplulukları listele
app.get('/api/communities', async (req, res) => {
  try {
    const communities = await Community.find({ isActive: true })
      .populate('manager', 'username profilePicture')
      .populate('createdBy', 'username')
      .sort({ createdAt: -1 });
    res.json(communities);
  } catch (err) {
    res.status(500).json({ error: "Topluluklar getirilemedi" });
  }
});

// Topluluk oluştur
app.post('/api/admin/communities', adminAuth, async (req, res) => {
  try {
    const newCommunity = new Community({
      ...req.body,
      createdBy: req.userId
    });
    await newCommunity.save();
    res.json(newCommunity);
  } catch (err) {
    res.status(500).json({ error: "Topluluk oluşturulamadı" });
  }
});

// Topluluk güncelle
app.put('/api/admin/communities/:id', adminAuth, async (req, res) => {
  try {
    const community = await Community.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    res.json(community);
  } catch (err) {
    res.status(500).json({ error: "Topluluk güncellenemedi" });
  }
});

// Topluluk sil
app.delete('/api/admin/communities/:id', adminAuth, async (req, res) => {
  try {
    await Community.findByIdAndDelete(req.params.id);
    res.json({ message: "Topluluk silindi" });
  } catch (err) {
    res.status(500).json({ error: "Topluluk silinemedi" });
  }
});

// --- YORUM MODERASYONU ---
// Tüm yorumları listele
app.get('/api/admin/comments', adminAuth, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const comments = await CampusComment.find()
      .populate('author', 'username profilePicture')
      .populate('campusId', 'name')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);
    res.json(comments);
  } catch (err) {
    res.status(500).json({ error: "Yorumlar getirilemedi" });
  }
});

// Yorum sil
app.delete('/api/admin/comments/:id', adminAuth, async (req, res) => {
  try {
    await CampusComment.findByIdAndDelete(req.params.id);
    res.json({ message: "Yorum silindi" });
  } catch (err) {
    res.status(500).json({ error: "Yorum silinemedi" });
  }
});

// Tüm postları listele (moderasyon için)
app.get('/api/admin/posts', adminAuth, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const posts = await Post.find()
      .populate('author', 'username profilePicture')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);
    res.json(posts);
  } catch (err) {
    res.status(500).json({ error: "Postlar getirilemedi" });
  }
});

// Post sil
app.delete('/api/admin/posts/:id', adminAuth, async (req, res) => {
  try {
    await Post.findByIdAndDelete(req.params.id);
    res.json({ message: "Post silindi" });
  } catch (err) {
    res.status(500).json({ error: "Post silinemedi" });
  }
});

// ============================================
// SÜRÜM NOTLARI (VERSION NOTES) ENDPOİNT'LERİ
// ============================================

// Tüm yayınlanmış sürüm notlarını getir (Public)
app.get('/api/version-notes', async (req, res) => {
  try {
    const notes = await VersionNote.find({ isPublished: true })
      .sort({ releaseDate: -1 })
      .select('-createdBy')
      .lean();
    res.json(notes);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Sürüm notları getirilemedi' });
  }
});

// Tüm sürüm notlarını getir (Admin - hem published hem unpublished)
app.get('/api/admin/version-notes', adminAuth, async (req, res) => {
  try {
    const notes = await VersionNote.find()
      .sort({ releaseDate: -1 })
      .populate('createdBy', 'username fullName')
      .lean();
    res.json(notes);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Sürüm notları getirilemedi' });
  }
});

// Yeni sürüm notu oluştur (Admin)
app.post('/api/admin/version-notes', adminAuth, async (req, res) => {
  try {
    console.log('[version-notes] Gelen body:', req.body);
    const { version, title, description, features, bugFixes, improvements, releaseDate, isPublished } = req.body;

    const newNote = new VersionNote({
      version,
      title,
      description,
      features: features || [],
      bugFixes: bugFixes || [],
      improvements: improvements || [],
      releaseDate: releaseDate || new Date(),
      isPublished: isPublished || false,
      createdBy: req.userId
    });

    await newNote.save();

    // Sadece yayınlanmış sürüm notları için tüm kullanıcılara bildirim gönder
    if (isPublished) {
      const users = await User.find({}, '_id');
      const notifications = users.map(user => ({
        recipient: user._id,
        type: 'version_update',
        title: 'Yeni sürüm mevcut!',
        message: `KBÜ Sosyal ${version} sürümüne güncellendi. Yenilikleri görmek için tıkla!`,
        link: '/version-notes',
        isRead: false
      }));

      await Notification.insertMany(notifications);
      console.log(`✅ ${users.length} kullanıcıya sürüm ${version} bildirimi gönderildi`);
    }

    res.status(201).json(newNote);
  } catch (err) {
    console.error(err);
    console.log(err);
    if (err.code === 11000) {
      return res.status(400).json({ error: 'Bu sürüm numarası zaten mevcut' });
    }
    res.status(500).json({ error: 'Sürüm notu oluşturulamadı' });
  }
});

// Sürüm notunu güncelle (Admin)
app.put('/api/admin/version-notes/:id', adminAuth, async (req, res) => {
  try {
    const { version, title, description, features, bugFixes, improvements, releaseDate, isPublished } = req.body;

    // Eski durumu kontrol et
    const oldNote = await VersionNote.findById(req.params.id);
    if (!oldNote) {
      return res.status(404).json({ error: 'Sürüm notu bulunamadı' });
    }

    const wasUnpublished = !oldNote.isPublished;

    const updatedNote = await VersionNote.findByIdAndUpdate(
      req.params.id,
      {
        version,
        title,
        description,
        features,
        bugFixes,
        improvements,
        releaseDate,
        isPublished
      },
      { new: true, runValidators: true }
    );

    // Eğer yayınlanmamış bir not yayınlanıyorsa, tüm kullanıcılara bildirim gönder
    if (wasUnpublished && isPublished) {
      const users = await User.find({}, '_id');
      const notifications = users.map(user => ({
        recipient: user._id,
        type: 'version_update',
        title: 'Yeni sürüm mevcut!',
        message: `KBÜ Sosyal ${version} sürümüne güncellendi. Yenilikleri görmek için tıkla!`,
        link: '/version-notes',
        isRead: false
      }));

      await Notification.insertMany(notifications);
      console.log(`✅ ${users.length} kullanıcıya sürüm ${version} bildirimi gönderildi (güncelleme)`);
    }

    res.json(updatedNote);
  } catch (err) {
    console.error(err);
    if (err.code === 11000) {
      return res.status(400).json({ error: 'Bu sürüm numarası zaten mevcut' });
    }
    res.status(500).json({ error: 'Sürüm notu güncellenemedi' });
  }
});

// Sürüm notunu sil (Admin)
app.delete('/api/admin/version-notes/:id', adminAuth, async (req, res) => {
  try {
    const deletedNote = await VersionNote.findByIdAndDelete(req.params.id);

    if (!deletedNote) {
      return res.status(404).json({ error: 'Sürüm notu bulunamadı' });
    }

    res.json({ message: 'Sürüm notu silindi' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Sürüm notu silinemedi' });
  }
});

// ============================================
// TOPLULUK ENDPOİNT'LERİ (KAMPÜS GİBİ)
// ============================================

// Topluluk oy verme (kampüs ile aynı mantık) - 5 saniye cooldown
app.post('/api/community/:id/vote', voteCooldown, async (req, res) => {
  const { type, token } = req.body;
  try {
    if (!token) return res.status(401).json({ error: "Oturum açmanız gerekiyor" });

    const decoded = jwt.verify(token, JWT_SECRET);
    const userId = decoded.id;

    const community = await Community.findById(req.params.id);
    const user = await User.findById(userId);
    if (!community || !user) return res.status(404).json({ error: "Bulunamadı" });

    // Oy hesaplama
    const existingVote = user.votedCommunities.find(v => v.communityId.toString() === req.params.id);

    if (existingVote) {
      community.votes[existingVote.voteType]--;
      community.votes[type]++;
      existingVote.voteType = type;
    } else {
      community.votes[type]++;
      user.votedCommunities.push({ communityId: req.params.id, voteType: type });
    }

    await community.save();
    await user.save();

    // Otomatik yorum sistemi
    const voteMessages = {
      positive: '👍 Bu topluluğu beğendim!',
      neutral: '😐 İdare eder.',
      negative: '👎 Pek beğenmedim.'
    };

    const existingComments = await CommunityComment.find({ community: req.params.id, author: userId });
    let finalComment;

    if (existingComments.length > 0) {
      finalComment = existingComments[0];
      const autoMessages = Object.values(voteMessages);
      const isAutoComment = autoMessages.includes(finalComment.content);

      if (isAutoComment) {
        finalComment.content = voteMessages[type];
      }
      finalComment.voteType = type;
      await finalComment.save();

      if (existingComments.length > 1) {
        const idsToDelete = existingComments.slice(1).map(c => c._id);
        await CommunityComment.deleteMany({ _id: { $in: idsToDelete } });
      }
    } else {
      finalComment = new CommunityComment({
        community: req.params.id,
        content: voteMessages[type],
        author: userId,
        voteType: type
      });
      await finalComment.save();
    }

    res.json({ community, userVote: type });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Sunucu hatası" });
  }
});

// Topluluk yorumlarını getir
app.get('/api/community/:id/comments', async (req, res) => {
  try {
    const comments = await CommunityComment.find({ community: req.params.id })
      .populate('author', 'username profilePicture')
      .sort({ createdAt: -1 });
    res.json(comments);
  } catch (err) {
    console.error("Yorumları getirme hatası:", err);
    res.status(500).json({ error: "Yorumlar getirilemedi" });
  }
});

// Topluluk yorumu yapma - 20 saniye cooldown
app.post('/api/community/:id/comments', auth, cooldown('comment'), async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    const userVote = user.votedCommunities.find(v => v.communityId.toString() === req.params.id);

    if (!userVote) {
      return res.status(403).json({ error: 'Yorum yapabilmek için önce oy vermelisiniz.' });
    }

    const existingComments = await CommunityComment.find({ community: req.params.id, author: req.userId });
    let targetComment;

    if (existingComments.length > 0) {
      targetComment = existingComments[0];
      targetComment.content = req.body.content;
      targetComment.voteType = userVote.voteType;
      await targetComment.save();

      if (existingComments.length > 1) {
        const idsToDelete = existingComments.slice(1).map(c => c._id);
        await CommunityComment.deleteMany({ _id: { $in: idsToDelete } });
      }
    } else {
      targetComment = new CommunityComment({
        community: req.params.id,
        content: req.body.content,
        author: req.userId,
        voteType: userVote.voteType
      });
      await targetComment.save();
    }

    const populatedComment = await targetComment.populate('author', 'username profilePicture');
    res.json(populatedComment);

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Yorum işlemi başarısız" });
  }
});

// Topluluk yorumunu beğenme
app.post('/api/community/comments/:id/like', auth, async (req, res) => {
  try {
    const comment = await CommunityComment.findById(req.params.id);
    if (!comment) {
      return res.status(404).json({ error: 'Yorum bulunamadı' });
    }

    const likeIndex = comment.likes.indexOf(req.userId);
    if (likeIndex > -1) {
      comment.likes.splice(likeIndex, 1);
    } else {
      comment.likes.push(req.userId);
    }

    await comment.save();
    const populatedComment = await comment.populate('author', 'username profilePicture');
    res.json(populatedComment);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Beğeni işlemi başarısız' });
  }
});

// Topluluk yorumunu düzenleme
app.put('/api/community/comments/:id', auth, async (req, res) => {
  try {
    const comment = await CommunityComment.findById(req.params.id);
    if (!comment) {
      return res.status(404).json({ error: 'Yorum bulunamadı' });
    }

    if (comment.author.toString() !== req.userId) {
      return res.status(403).json({ error: 'Bu yorumu düzenleyemezsiniz' });
    }

    const voteMessages = ['👍 Bu topluluğu beğendim!', '😐 İdare eder.', '👎 Pek beğenmedim.'];
    if (voteMessages.includes(comment.content)) {
      return res.status(403).json({ error: 'Otomatik yorumlar düzenlenemez' });
    }

    comment.content = req.body.content;
    await comment.save();

    const populatedComment = await comment.populate('author', 'username profilePicture');
    res.json(populatedComment);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Yorum düzenlenemedi' });
  }
});
// --- DOĞRULAMA MAİLİNİ TEKRAR GÖNDER ---
// Cooldown middleware'ini buraya da ekledim ki spam yapılmasın (60 saniye)
app.post('/api/resend-verification', async (req, res) => {
  const { email } = req.body;
  try {
    const user = await User.findOne({ $or: [{ username: email }, { email: email }] });

    // Güvenlik için: Kullanıcı yoksa veya zaten onaylıysa bile genel bir mesaj dön
    // (Böylece kötü niyetli kişiler hangi maillerin kayıtlı olduğunu anlayamaz)
    if (!user) {
      return res.status(404).json({ error: "Kullanıcı bulunamadı." });
    }

    if (user.isVerified) {
      return res.status(400).json({ error: "Bu hesap zaten doğrulanmış." });
    }

    // Yeni bir token oluştur ve kaydet
    const newVerificationToken = crypto.randomBytes(32).toString('hex');
    user.verificationToken = newVerificationToken;
    await user.save();

    // Mail Gönderme İşlemi (Register ile aynı mantık)
    const verificationLink = `${process.env.BACKEND_URL}/api/verify-email?token=${newVerificationToken}`;

    // Resend ile mail gönder
    try {
      const { data, error } = await resend.emails.send({
        from: 'KBÜ Sosyal <onboarding@resend.dev>',
        to: user.email,
        subject: 'KBÜ Sosyal - Yeni Doğrulama Linki',
        html: `
          <div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
            <h2 style="color: #1e3a8a;">Tekrar Merhaba ${user.fullName}!</h2>
            <p>Yeni doğrulama linkiniz aşağıdadır. Lütfen butona tıklayın:</p>
            <a href="${verificationLink}" style="background-color: #1e3a8a; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block; margin-top: 10px;">Hesabımı Doğrula</a>
            <p style="margin-top: 20px; font-size: 12px; color: #777;">Bu işlemi sen yapmadıysan, bu maili dikkate alma.</p>
          </div>
        `
      });

      if (error) {
        console.error("❌ Resend error:", error);
        return res.status(500).json({
          error: "Mail gönderilemedi. Lütfen daha sonra tekrar deneyin.",
          details: process.env.NODE_ENV === 'development' ? error : undefined
        });
      }

      console.log('✅ Tekrar doğrulama maili başarıyla gönderildi:', user.email);
      console.log('📧 Resend Mail ID:', data?.id);
      res.json({ message: "Doğrulama maili tekrar gönderildi! Spam kutunu kontrol etmeyi unutma." });
    } catch (mailError) {
      console.error("❌ Mail gönderme hatası (catch):", mailError);
      return res.status(500).json({
        error: "Mail gönderilemedi. Lütfen daha sonra tekrar deneyin.",
        details: process.env.NODE_ENV === 'development' ? mailError.message : undefined
      });
    }

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Sunucu hatası." });
  }
});

// ======================================
// BİLDİRİM API ENDPOINTS
// ======================================

// Get user's notifications
// ======================================
// BİLDİRİM API ENDPOINTS (DÜZELTİLMİŞ)
// ======================================

// Get user's notifications
app.get('/api/notifications', auth, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    // DÜZELTME: req.user.userId YERİNE req.userId KULLANILDI
    const notifications = await Notification.find({ recipient: req.userId }) 
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('sender', 'username fullName profilePicture')
      .populate('post', 'content')
      .lean();

    // DÜZELTME: req.userId
    const totalNotifications = await Notification.countDocuments({ recipient: req.userId });
    const unreadCount = await Notification.countDocuments({ recipient: req.userId, isRead: false });

    res.json({
      notifications,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(totalNotifications / limit),
        totalNotifications,
        hasMore: skip + notifications.length < totalNotifications
      },
      unreadCount
    });
  } catch (err) {
    console.error('Get notifications error:', err);
    res.status(500).json({ message: 'Bildirimler yüklenirken hata oluştu' });
  }
});

// Get unread count
app.get('/api/notifications/unread-count', auth, async (req, res) => {
  try {
    const unreadCount = await Notification.countDocuments({
      recipient: req.userId, // DÜZELTME: req.user.userId -> req.userId
      isRead: false
    });
    res.json({ unreadCount });
  } catch (err) {
    console.error('Get unread count error:', err);
    res.status(500).json({ message: 'Hata oluştu' });
  }
});

// Mark notification as read
app.put('/api/notifications/:id/read', auth, async (req, res) => {
  try {
    const notification = await Notification.findOne({
      _id: req.params.id,
      recipient: req.userId // DÜZELTME: req.user.userId -> req.userId
    });

    if (!notification) {
      return res.status(404).json({ message: 'Bildirim bulunamadı' });
    }

    notification.isRead = true;
    await notification.save();

    res.json({ message: 'Bildirim okundu olarak işaretlendi' });
  } catch (err) {
    console.error('Mark as read error:', err);
    res.status(500).json({ message: 'Hata oluştu' });
  }
});

// Mark all notifications as read
app.put('/api/notifications/read-all', auth, async (req, res) => {
  try {
    await Notification.updateMany(
      { recipient: req.userId, isRead: false }, // DÜZELTME: req.user.userId -> req.userId
      { isRead: true }
    );

    res.json({ message: 'Tüm bildirimler okundu olarak işaretlendi' });
  } catch (err) {
    console.error('Mark all as read error:', err);
    res.status(500).json({ message: 'Hata oluştu' });
  }
});

// Delete notification
app.delete('/api/notifications/:id', auth, async (req, res) => {
  try {
    const notification = await Notification.findOne({
      _id: req.params.id,
      recipient: req.userId // DÜZELTME: req.user.userId -> req.userId
    });

    if (!notification) {
      return res.status(404).json({ message: 'Bildirim bulunamadı' });
    }

    await notification.deleteOne();
    res.json({ message: 'Bildirim silindi' });
  } catch (err) {
    console.error('Delete notification error:', err);
    res.status(500).json({ message: 'Hata oluştu' });
  }
});

// ============ COMMENT ENDPOINTS ============

// Helper function to extract mentions from text
function extractMentions(text) {
  const mentionRegex = /@(\w+)/g;
  const mentions = [];
  let match;
  while ((match = mentionRegex.exec(text)) !== null) {
    mentions.push(match[1]);
  }
  return [...new Set(mentions)];
}

app.get('/api/posts/:postId/comments', async (req, res) => {
  try {
    // Sadece parent comment'leri getir (nested comment'leri hariç tut)
    const comments = await Comment.find({
      post: req.params.postId,
      parentComment: null  // Sadece ana yorumlar
    })
      .populate('author', 'username profilePicture fullName')
      .sort({ createdAt: -1 });
    res.json(comments);
  } catch (err) {
    console.error('Yorumları getirme hatası:', err);
    res.status(500).json({ message: 'Yorumlar yüklenemedi' });
  }
});

// 2. Yorum Yap (POST)
app.post('/api/posts/:postId/comments', auth, cooldown('comment'), async (req, res) => {
  try {
    const { content } = req.body;
    const postId = req.params.postId;
    const userId = req.userId;

    // Validasyonlar
    if (!content || content.trim().length === 0) return res.status(400).json({ message: 'İçerik boş olamaz' });
    if (content.length > 500) return res.status(400).json({ message: 'Yorum çok uzun' });

    const post = await Post.findById(postId);
    if (!post) return res.status(404).json({ message: 'Gönderi bulunamadı' });

    // Yorumu Kaydet
    const comment = new Comment({
      content,
      author: userId,
      post: postId
    });
    await comment.save();
    
    // Frontend için yazar bilgisini ekle
    await comment.populate('author', 'username profilePicture fullName');

    // 3. Bildirim: Post Sahibine (Kendi postu değilse)
    if (post.author && userId.toString() !== post.author.toString() && !post.isAnonymous) {
      await Notification.create({
        recipient: post.author,
        sender: userId,
        type: 'comment',
        post: postId,
        comment: comment._id
      });
    }

    // 4. Bildirim: Etiketlenenlere (@mention)
    const mentions = extractMentions(content);
    if (mentions.length > 0) {
      const mentionedUsers = await User.find({ 
        username: { $in: mentions }, 
        _id: { $ne: userId } 
      }).select('_id');

      const mentionNotifs = mentionedUsers.map(user => ({
        recipient: user._id,
        sender: userId,
        type: 'mention',
        post: postId,
        comment: comment._id
      }));

      if (mentionNotifs.length > 0) {
        await Notification.insertMany(mentionNotifs);
      }
    }

    res.status(201).json(comment);

  } catch (err) {
    console.error('Yorum oluşturma hatası:', err);
    res.status(500).json({ message: 'Yorum oluşturulamadı' });
  }
});
// --- YORUM BEĞENME (GÜNCELLENMİŞ & SPAM KORUMALI) ---
app.post('/api/comments/:commentId/like', auth, async (req, res) => {
  try {
    const comment = await Comment.findById(req.params.commentId);
    if (!comment) return res.status(404).json({ message: 'Yorum bulunamadı' });

    const userId = req.userId;
    const isLiked = comment.likes.includes(userId);

    if (isLiked) {
      // 1. Beğeniyi geri al
      comment.likes.pull(userId);

      // 2. SPAM KORUMASI: Bildirimi SİL
      await Notification.deleteOne({
        recipient: comment.author,
        sender: userId,
        type: 'comment_like',
        comment: comment._id
      });
    } else {
      // 1. Beğen
      comment.likes.push(userId);

      // 2. Bildirim Gönder (Kendi yorumu değilse)
      if (comment.author.toString() !== userId) {
        
        // ÇİFT KAYIT KONTROLÜ
        const existingNotif = await Notification.findOne({
            recipient: comment.author,
            sender: userId,
            type: 'comment_like',
            comment: comment._id
        });

        if (!existingNotif) {
            await Notification.create({
              recipient: comment.author,
              sender: userId,
              type: 'comment_like',
              post: comment.post,
              comment: comment._id
            });
            console.log(`❤️ Yorum Like Bildirimi gönderildi -> Alıcı: ${comment.author}`);
        }
      }
    }

    await comment.save();
    // Yazar bilgisini ekle
    await comment.populate('author', 'username profilePicture fullName');
    
    res.json(comment);
  } catch (err) {
    console.error('Yorum like hatası:', err);
    res.status(500).json({ message: 'Hata' });
  }
});

// Update a comment
app.put('/api/comments/:commentId', auth, async (req, res) => {
  try {
    const comment = await Comment.findById(req.params.commentId);
    if (!comment) {
      return res.status(404).json({ message: 'Yorum bulunamadı' });
    }

    if (comment.author.toString() !== req.userId) {
      return res.status(403).json({ message: 'Bu yorumu düzenleyemezsiniz' });
    }

    const { content } = req.body;
    if (!content || content.trim().length === 0) {
      return res.status(400).json({ message: 'Yorum içeriği boş olamaz' });
    }

    if (content.length > 500) {
      return res.status(400).json({ message: 'Yorum çok uzun (max 500 karakter)' });
    }

    comment.content = content;
    await comment.save();
    await comment.populate('author', 'username profilePicture fullName');

    res.json(comment);
  } catch (err) {
    console.error('Update comment error:', err);
    res.status(500).json({ message: 'Yorum güncellenemedi' });
  }
});

// Delete a comment
app.delete('/api/comments/:commentId', auth, async (req, res) => {
  try {
    const comment = await Comment.findById(req.params.commentId);
    if (!comment) {
      return res.status(404).json({ message: 'Yorum bulunamadı' });
    }

    if (comment.author.toString() !== req.userId) {
      return res.status(403).json({ message: 'Bu yorumu silemezsiniz' });
    }

    await comment.deleteOne();

    // Also delete related notifications
    await Notification.deleteMany({
      $or: [
        { type: 'comment', post: comment.post, sender: comment.author },
        { type: 'mention', post: comment.post, sender: comment.author }
      ]
    });

    res.json({ message: 'Yorum silindi' });
  } catch (err) {
    console.error('Delete comment error:', err);
    res.status(500).json({ message: 'Yorum silinemedi' });
  }
});

// --- NESTED COMMENTS (YORUMLARA YORUM) API ---

// Get a single comment by ID (for CommentDetailPage)
app.get('/api/comments/:commentId', async (req, res) => {
  try {
    const comment = await Comment.findById(req.params.commentId)
      .populate('author', 'username profilePicture fullName')
      .populate('post', '_id');

    if (!comment) {
      return res.status(404).json({ message: 'Yorum bulunamadı' });
    }

    res.json(comment);
  } catch (err) {
    console.error('Yorum getirme hatası:', err);
    res.status(500).json({ message: 'Yorum yüklenemedi' });
  }
});

// Get replies for a specific comment
app.get('/api/comments/:commentId/replies', async (req, res) => {
  try {
    const replies = await Comment.find({
      parentComment: req.params.commentId
    })
      .populate('author', 'username profilePicture fullName')
      .sort({ createdAt: -1 });

    res.json(replies);
  } catch (err) {
    console.error('Cevapları getirme hatası:', err);
    res.status(500).json({ message: 'Cevaplar yüklenemedi' });
  }
});

// Post a reply to a comment
app.post('/api/comments/:commentId/replies', auth, cooldown('comment'), async (req, res) => {
  try {
    const { content } = req.body;
    const parentCommentId = req.params.commentId;
    const userId = req.userId;

    // Validasyonlar
    if (!content || content.trim().length === 0) {
      return res.status(400).json({ message: 'İçerik boş olamaz' });
    }
    if (content.length > 500) {
      return res.status(400).json({ message: 'Yorum çok uzun' });
    }

    // Parent comment'i bul
    const parentComment = await Comment.findById(parentCommentId);
    if (!parentComment) {
      return res.status(404).json({ message: 'Yorum bulunamadı' });
    }

    // Reply'i kaydet
    const reply = new Comment({
      content,
      author: userId,
      post: parentComment.post,
      parentComment: parentCommentId
    });
    await reply.save();

    // Parent comment'in reply count'unu artır
    parentComment.replyCount += 1;
    await parentComment.save();

    // Frontend için yazar bilgisini ekle
    await reply.populate('author', 'username profilePicture fullName');

    // Bildirim: Parent comment sahibine (kendi yorumu değilse)
    if (parentComment.author && userId.toString() !== parentComment.author.toString()) {
      await Notification.create({
        recipient: parentComment.author,
        sender: userId,
        type: 'comment_reply',
        post: parentComment.post,
        comment: parentCommentId,
        reply: reply._id
      });
    }

    // Bildirim: Etiketlenenlere (@mention)
    const mentions = extractMentions(content);
    if (mentions.length > 0) {
      const mentionedUsers = await User.find({
        username: { $in: mentions },
        _id: { $ne: userId }
      }).select('_id');

      const mentionNotifs = mentionedUsers.map(user => ({
        recipient: user._id,
        sender: userId,
        type: 'mention',
        post: parentComment.post,
        comment: parentCommentId,
        reply: reply._id
      }));

      if (mentionNotifs.length > 0) {
        await Notification.insertMany(mentionNotifs);
      }
    }

    res.status(201).json(reply);

  } catch (err) {
    console.error('Reply oluşturma hatası:', err);
    res.status(500).json({ message: 'Cevap oluşturulamadı' });
  }
});

// --- PRODUCTION: FRONTEND STATIC FILES SUNMA ---
// Production'da frontend'i backend ile aynı domain'de sunuyoruz
if (process.env.NODE_ENV === 'production') {
  // Frontend build dosyalarını serve et
  app.use(express.static(path.join(__dirname, '../client/dist')));

  // Tüm diğer route'lar için index.html'i döndür (SPA routing için)
  // API route'ları hariç, tüm istekler için SPA index.html'i serve et
  app.use((req, res, next) => {
    // API route'larını atla
    if (req.path.startsWith('/api')) {
      return next();
    }
    // SPA için index.html döndür
    res.sendFile(path.join(__dirname, '../client/dist', 'index.html'));
  });
}
// --- ZAMANLANMIŞ GÖREVLER (CRON JOBS) ---
// Her gün saat 12:00 ve 20:00'de çalışır
cron.schedule('0 12,20 * * *', async () => {
  console.log('🔄 Öneri sistemi çalışıyor...');
  try {
    // 1. Son 7 günde en çok beğenilen ve yakın zamanda popülerleşmiş postu bul
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    // Aggregate ile en çok beğeni alan postu bul (tüm kategorilerden)
    const popularPosts = await Post.aggregate([
      {
        $match: {
          createdAt: { $gt: sevenDaysAgo },
          isAnonymous: false // Anonim postları önerme
        }
      },
      {
        $addFields: {
          likeCount: { $size: '$likes' }
        }
      },
      {
        $match: {
          likeCount: { $gte: 3 } // En az 3 beğeni olmalı
        }
      },
      {
        $sort: { likeCount: -1 }
      },
      {
        $limit: 1
      },
      {
        $project: { _id: 1, author: 1, likeCount: 1 }
      }
    ]);

    if (!popularPosts || popularPosts.length === 0) {
      console.log('📭 Son 7 günde önerilecek popüler post bulunamadı (en az 3 beğeni gerekli).');
      return;
    }

    const popularPost = popularPosts[0];
    console.log(`📌 Öneri: Post ${popularPost._id} (${popularPost.likeCount} beğeni)`);

    // 2. OPTİMİZE EDİLMİŞ BİLDİRİM SİSTEMİ
    // Tüm kullanıcıları RAM'e çekmek yerine, batch (toplu) işlem yapıyoruz

    const BATCH_SIZE = 500; // Her seferde 500 kullanıcı işle
    let processedUsers = 0;
    let skip = 0;

    // Toplam kullanıcı sayısını al (sadece sayma için)
    const totalUsers = await User.countDocuments({
      _id: { $ne: popularPost.author }
    });

    console.log(`📊 Toplam ${totalUsers} kullanıcıya bildirim gönderilecek...`);

    // Batch işleme döngüsü
    while (skip < totalUsers) {
      // Her seferinde sadece BATCH_SIZE kadar kullanıcı çek
      const userBatch = await User.find({
        _id: { $ne: popularPost.author }
      })
      .select('_id') // Sadece ID'yi al (bellek optimizasyonu)
      .skip(skip)
      .limit(BATCH_SIZE)
      .lean(); // Mongoose document'ı olmadan düz JS objesi olarak al (daha hızlı)

      if (userBatch.length === 0) break;

      // Duplicate bildirim kontrolü: Bu kullanıcılara bu post için zaten bildirim gönderilmiş mi?
      const existingNotifications = await Notification.find({
        recipient: { $in: userBatch.map(u => u._id) },
        type: 'suggestion',
        post: popularPost._id
      }).select('recipient').lean();

      // Zaten bildirim alan kullanıcıları filtrele
      const existingRecipients = new Set(existingNotifications.map(n => n.recipient.toString()));
      const usersToNotify = userBatch.filter(user => !existingRecipients.has(user._id.toString()));

      // Eğer tüm kullanıcılara zaten bildirim gönderildiyse, devam et
      if (usersToNotify.length === 0) {
        skip += BATCH_SIZE;
        continue;
      }

      // Bu batch için bildirimleri hazırla
      const notifications = usersToNotify.map(user => {
        const notification = {
          recipient: user._id,
          type: 'suggestion',
          post: popularPost._id,
          isRead: false,
          createdAt: new Date()
        };

        // Eğer post yazarı varsa sender olarak ekle
        if (popularPost.author) {
          notification.sender = popularPost.author;
        }

        return notification;
      });

      // Batch olarak veritabanına ekle
      // insertMany ordered:false ile hata olsa bile diğerlerine devam eder
      await Notification.insertMany(notifications, { ordered: false });

      processedUsers += usersToNotify.length; // Sadece gerçekten bildirim gönderilenleri say
      skip += BATCH_SIZE;

      console.log(`✅ ${processedUsers}/${totalUsers} kullanıcıya bildirim gönderildi (${userBatch.length - usersToNotify.length} duplicate atlandı)...`);

      // RAM'i rahatlatmak için kısa bir bekleme (isteğe bağlı)
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    console.log(`🎉 Öneri sistemi tamamlandı: ${processedUsers} kullanıcıya bildirim gönderildi.`);

  } catch (err) {
    console.error('❌ Öneri sistemi hatası:', err);
  }
});
const PORT = process.env.PORT || 5001; // .env'den çekiliyor veya 5001
app.listen(PORT, () => {
  console.log(`Sunucu ${PORT} portunda çalışıyor...`);
});