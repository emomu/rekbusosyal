const express = require('express');
const router = express.Router();
const ChristmasCard = require('../models/ChristmasCard');
const Notification = require('../models/Notification');
const User = require('../models/User');
const authMiddleware = require('../middleware/auth');
const cooldown = require('../middleware/cooldown');

// Yılbaşı kartı gönder
// SECURITY: Rate limited to prevent spam (1 card per minute)
router.post('/send', authMiddleware, cooldown('christmasCard'), async (req, res) => {
  try {
    const { recipientUsername, message } = req.body;

    if (!recipientUsername || !message) {
      return res.status(400).json({ error: 'Kullanıcı adı ve mesaj gereklidir' });
    }

    if (message.length > 500) {
      return res.status(400).json({ error: 'Mesaj çok uzun (max 500 karakter)' });
    }

    // Kullanıcı adını @ işareti olmadan temizle
    const cleanUsername = recipientUsername.replace('@', '');

    // Alıcıyı bul
    const recipient = await User.findOne({ username: cleanUsername });
    if (!recipient) {
      return res.status(404).json({ error: 'Kullanıcı bulunamadı' });
    }

    // Kendine kart gönderemez
    if (recipient._id.toString() === req.userId) {
      return res.status(400).json({ error: 'Kendine yılbaşı kartı gönderemezsin' });
    }

    // SECURITY: Aynı kişiye bugün zaten kart gönderilmiş mi kontrol et (spam önleme)
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const existingCard = await ChristmasCard.findOne({
      sender: req.userId,
      recipient: recipient._id,
      createdAt: { $gte: today }
    });

    if (existingCard) {
      return res.status(400).json({
        error: 'Bu kullanıcıya bugün zaten bir yılbaşı kartı gönderdin. Yarın tekrar deneyebilirsin.'
      });
    }

    // Yılbaşı kartını oluştur
    const card = new ChristmasCard({
      sender: req.userId,
      recipient: recipient._id,
      message
    });

    await card.save();

    // Bildirim oluştur
    const notification = new Notification({
      recipient: recipient._id,
      sender: req.userId,
      type: 'christmas_card',
      christmasCard: card._id,
      message: message.substring(0, 100) // İlk 100 karakteri önizleme olarak
    });

    await notification.save();

    // Populate sender bilgisini ekle
    await card.populate('sender', 'username fullName profilePicture');

    res.status(201).json({
      success: true,
      card,
      message: 'Yılbaşı kartın başarıyla gönderildi!'
    });

  } catch (error) {
    console.error('Christmas card send error:', error);
    res.status(500).json({ error: 'Yılbaşı kartı gönderilirken bir hata oluştu' });
  }
});

// Gelen yılbaşı kartlarını getir
router.get('/received', authMiddleware, async (req, res) => {
  try {
    const cards = await ChristmasCard.find({ recipient: req.userId })
      .populate('sender', 'username fullName profilePicture badges')
      .sort({ createdAt: -1 })
      .limit(50);

    res.json(cards);
  } catch (error) {
    console.error('Get received cards error:', error);
    res.status(500).json({ error: 'Kartlar getirilirken bir hata oluştu' });
  }
});

// Gönderilen yılbaşı kartlarını getir
router.get('/sent', authMiddleware, async (req, res) => {
  try {
    const cards = await ChristmasCard.find({ sender: req.userId })
      .populate('recipient', 'username fullName profilePicture badges')
      .sort({ createdAt: -1 })
      .limit(50);

    res.json(cards);
  } catch (error) {
    console.error('Get sent cards error:', error);
    res.status(500).json({ error: 'Kartlar getirilirken bir hata oluştu' });
  }
});

// Belirli bir kartı getir
router.get('/:cardId', authMiddleware, async (req, res) => {
  try {
    const card = await ChristmasCard.findById(req.params.cardId)
      .populate('sender', 'username fullName profilePicture badges')
      .populate('recipient', 'username fullName profilePicture badges');

    if (!card) {
      return res.status(404).json({ error: 'Kart bulunamadı' });
    }

    // Sadece gönderen veya alıcı görebilir
    if (card.sender._id.toString() !== req.userId && card.recipient._id.toString() !== req.userId) {
      return res.status(403).json({ error: 'Bu kartı görme yetkiniz yok' });
    }

    // Alıcı görüyorsa okundu olarak işaretle
    if (card.recipient._id.toString() === req.userId && !card.isRead) {
      card.isRead = true;
      await card.save();
    }

    res.json(card);
  } catch (error) {
    console.error('Get card error:', error);
    res.status(500).json({ error: 'Kart getirilirken bir hata oluştu' });
  }
});

// Okunmamış kart sayısını getir
router.get('/unread/count', authMiddleware, async (req, res) => {
  try {
    const count = await ChristmasCard.countDocuments({
      recipient: req.userId,
      isRead: false
    });

    res.json({ count });
  } catch (error) {
    console.error('Get unread count error:', error);
    res.status(500).json({ error: 'Sayı getirilirken bir hata oluştu' });
  }
});

module.exports = router;
