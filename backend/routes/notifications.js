const express = require('express');
const router = express.Router();
const Notification = require('../models/Notification');
const auth = require('../middleware/auth');

// Get user's notifications
router.get('/', auth, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const notifications = await Notification.find({ recipient: req.user.userId })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('sender', 'username fullName profilePicture')
      .populate('post', 'content')
      .lean();

    const totalNotifications = await Notification.countDocuments({ recipient: req.user.userId });
    const unreadCount = await Notification.countDocuments({ recipient: req.user.userId, isRead: false });

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
router.get('/unread-count', auth, async (req, res) => {
  try {
    const unreadCount = await Notification.countDocuments({
      recipient: req.user.userId,
      isRead: false
    });
    res.json({ unreadCount });
  } catch (err) {
    console.error('Get unread count error:', err);
    res.status(500).json({ message: 'Hata oluştu' });
  }
});

// Mark notification as read
router.put('/:id/read', auth, async (req, res) => {
  try {
    const notification = await Notification.findOne({
      _id: req.params.id,
      recipient: req.user.userId
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
router.put('/read-all', auth, async (req, res) => {
  try {
    await Notification.updateMany(
      { recipient: req.user.userId, isRead: false },
      { isRead: true }
    );

    res.json({ message: 'Tüm bildirimler okundu olarak işaretlendi' });
  } catch (err) {
    console.error('Mark all as read error:', err);
    res.status(500).json({ message: 'Hata oluştu' });
  }
});

// Delete notification
router.delete('/:id', auth, async (req, res) => {
  try {
    const notification = await Notification.findOne({
      _id: req.params.id,
      recipient: req.user.userId
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

module.exports = router;
