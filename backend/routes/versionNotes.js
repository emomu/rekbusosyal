const express = require('express');
const router = express.Router();
const VersionNote = require('../models/VersionNote');
const User = require('../models/User');
const Notification = require('../models/Notification');
const adminAuth = require('../middleware/adminAuth');

// Get all version notes
router.get('/', async (req, res) => {
  try {
    const notes = await VersionNote.find().sort({ createdAt: -1 });
    res.json(notes);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Create a new version note
router.post('/', adminAuth, async (req, res) => {
  try {
    const { version, title, content } = req.body;

    const newNote = new VersionNote({
      version,
      title,
      content
    });

    const note = await newNote.save();

    // Create a notification for all users
    const users = await User.find({}, '_id');
    const notifications = users.map(user => ({
      recipient: user._id,
      type: 'version_update',
      title: 'Yeni sürüm mevcut!',
      message: `KBÜ Sosyal ${version} sürümüne güncellendi. Yenilikleri görmek için tıkla!`,
      link: '/version-notes'
    }));

    await Notification.insertMany(notifications);

    res.status(201).json(note);
  } catch (err) {
    console.error('Create version note error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
