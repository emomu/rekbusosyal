const express = require('express');
const router = express.Router();
const Community = require('../models/Community');
const User = require('../models/User');
const bcrypt = require('bcryptjs');
const authMiddleware = require('../middleware/auth');

// Kulüp oluştur (sadece club_manager ve admin, her kulüp yöneticisi 1 tane)
router.post('/create', authMiddleware, async (req, res) => {
  try {
    console.log('📝 Creating community with data:', req.body);
    console.log('👤 User info:', req.user);
    const { name, description, category, imageUrl } = req.body;

    // Kullanıcı yetkisini kontrol et
    if (req.user.role !== 'admin' && req.user.role !== 'club_manager') {
      console.log('❌ User role check failed:', req.user.role);
      return res.status(403).json({ error: 'Kulüp oluşturma yetkiniz yok' });
    }

    // Kulüp yöneticisi zaten bir kulüp yönetiyor mu kontrol et
    const existingCommunity = await Community.findOne({ manager: req.user.userId });
    if (existingCommunity && req.user.role === 'club_manager') {
      return res.status(400).json({ error: 'Zaten bir kulüp yönetiyorsunuz. Her kulüp yöneticisi sadece 1 kulüp oluşturabilir.' });
    }

    // Aynı isimde kulüp var mı kontrol et
    const duplicateName = await Community.findOne({ name: { $regex: new RegExp(`^${name}$`, 'i') } });
    if (duplicateName) {
      return res.status(400).json({ error: 'Bu isimde bir kulüp zaten mevcut' });
    }

    const newCommunity = new Community({
      name,
      description,
      category: category || 'Sosyal',
      imageUrl: imageUrl || '',
      manager: req.user.userId,
      members: [req.user.userId], // Oluşturan kişi otomatik üye
      createdBy: req.user.userId
    });

    await newCommunity.save();

    const populatedCommunity = await Community.findById(newCommunity._id)
      .populate('manager', 'fullName username profilePicture')
      .populate('createdBy', 'fullName username');

    res.status(201).json(populatedCommunity);
  } catch (error) {
    console.error('Error creating community:', error);
    console.error('Error details:', error.message);
    console.error('Stack trace:', error.stack);
    res.status(500).json({ error: 'Kulüp oluşturulurken bir hata oluştu', details: error.message });
  }
});

// Kulübün announcement hesabını oluştur (sadece club_manager ve admin)
router.post('/:communityId/create-announcement-account', authMiddleware, async (req, res) => {
  try {
    const { communityId } = req.params;
    const { username, password } = req.body;

    // Kullanıcı yetkisini kontrol et
    if (req.user.role !== 'admin' && req.user.role !== 'club_manager') {
      return res.status(403).json({ error: 'Announcement hesabı oluşturma yetkiniz yok' });
    }

    // Kulübü bul
    const community = await Community.findById(communityId);
    if (!community) {
      return res.status(404).json({ error: 'Kulüp bulunamadı' });
    }

    // Kulüp yöneticisi ise, sadece kendi kulübü için hesap oluşturabilir
    if (req.user.role === 'club_manager' && community.manager.toString() !== req.user.userId) {
      return res.status(403).json({ error: 'Sadece kendi kulübünüz için hesap oluşturabilirsiniz' });
    }

    // Bu kulübün zaten announcement hesabı var mı kontrol et
    if (community.announcementAccount) {
      return res.status(400).json({ error: 'Bu kulübün zaten bir announcement hesabı var' });
    }

    // Username zaten kullanılıyor mu kontrol et
    const existingUser = await User.findOne({ username });
    if (existingUser) {
      return res.status(400).json({ error: 'Bu kullanıcı adı zaten kullanılıyor' });
    }

    // Announcement hesabı oluştur
    const hashedPassword = await bcrypt.hash(password, 10);
    const announcementUser = new User({
      fullName: `${community.name} - Duyuru`,
      username: username,
      email: `${username}@announcement.kbusosyal.local`, // Dummy email
      birthDate: new Date(), // Dummy birthdate
      password: hashedPassword,
      role: 'user', // Normal user olarak oluştur
      isVerified: true, // Otomatik verified
      badges: ['verified'] // Verified badge ekle
    });

    await announcementUser.save();

    // Community'ye announcement hesabını bağla
    community.announcementAccount = announcementUser._id;
    await community.save();

    res.status(201).json({
      message: 'Announcement hesabı başarıyla oluşturuldu',
      account: {
        id: announcementUser._id,
        username: announcementUser.username,
        fullName: announcementUser.fullName
      }
    });
  } catch (error) {
    console.error('Error creating announcement account:', error);
    res.status(500).json({ error: 'Announcement hesabı oluşturulurken bir hata oluştu' });
  }
});

// Kulübün announcement hesabını getir
router.get('/:communityId/announcement-account', authMiddleware, async (req, res) => {
  try {
    const { communityId } = req.params;

    const community = await Community.findById(communityId).populate('announcementAccount', 'username fullName profilePicture badges');

    if (!community) {
      return res.status(404).json({ error: 'Kulüp bulunamadı' });
    }

    if (!community.announcementAccount) {
      return res.status(404).json({ error: 'Bu kulübün announcement hesabı yok' });
    }

    res.json(community.announcementAccount);
  } catch (error) {
    console.error('Error fetching announcement account:', error);
    res.status(500).json({ error: 'Announcement hesabı yüklenirken bir hata oluştu' });
  }
});

// Kulübün announcement hesabını sil (sadece admin)
router.delete('/:communityId/announcement-account', authMiddleware, async (req, res) => {
  try {
    const { communityId } = req.params;

    // Sadece admin silebilir
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Announcement hesabını silme yetkiniz yok' });
    }

    const community = await Community.findById(communityId);
    if (!community) {
      return res.status(404).json({ error: 'Kulüp bulunamadı' });
    }

    if (!community.announcementAccount) {
      return res.status(404).json({ error: 'Bu kulübün announcement hesabı yok' });
    }

    // Announcement hesabını sil
    await User.findByIdAndDelete(community.announcementAccount);

    // Community'den bağlantıyı kaldır
    community.announcementAccount = null;
    await community.save();

    res.json({ message: 'Announcement hesabı silindi' });
  } catch (error) {
    console.error('Error deleting announcement account:', error);
    res.status(500).json({ error: 'Announcement hesabı silinirken bir hata oluştu' });
  }
});

module.exports = router;
