const express = require('express');
const router = express.Router();
const Event = require('../models/Event');
const Community = require('../models/Community');
const authMiddleware = require('../middleware/auth');

// Tüm etkinlikleri listele (gelecek etkinlikler)
router.get('/', authMiddleware, async (req, res) => {
  try {
    const { page = 1, limit = 20, communityId } = req.query;
    const skip = (page - 1) * limit;

    const filter = {
      isActive: true,
      endDate: { $gte: new Date() } // Bitmemiş etkinlikler
    };

    if (communityId) {
      filter.community = communityId;
    }

    const events = await Event.find(filter)
      .populate('community', 'name imageUrl')
      .populate('createdBy', 'fullName username profilePicture')
      .sort({ startDate: 1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Event.countDocuments(filter);

    res.json({
      events,
      total,
      page: parseInt(page),
      totalPages: Math.ceil(total / limit)
    });
  } catch (error) {
    console.error('Error fetching events:', error);
    res.status(500).json({ error: 'Etkinlikler yüklenirken bir hata oluştu' });
  }
});

// Belirli bir etkinliği getir
router.get('/:eventId', authMiddleware, async (req, res) => {
  try {
    const event = await Event.findById(req.params.eventId)
      .populate('community', 'name imageUrl description')
      .populate('createdBy', 'fullName username profilePicture')
      .populate('attendees', 'fullName username profilePicture');

    if (!event) {
      return res.status(404).json({ error: 'Etkinlik bulunamadı' });
    }

    res.json(event);
  } catch (error) {
    console.error('Error fetching event:', error);
    res.status(500).json({ error: 'Etkinlik yüklenirken bir hata oluştu' });
  }
});

// Yeni etkinlik oluştur (sadece club_manager ve admin)
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { title, description, startDate, endDate, location, communityId, category, imageUrl } = req.body;

    // Kullanıcı yetkisini kontrol et
    if (req.user.role !== 'admin' && req.user.role !== 'club_manager') {
      return res.status(403).json({ error: 'Etkinlik oluşturma yetkiniz yok' });
    }

    // Kulübün varlığını kontrol et
    const community = await Community.findById(communityId);
    if (!community) {
      return res.status(404).json({ error: 'Kulüp bulunamadı' });
    }

    // Kulüp yöneticisi ise, sadece kendi kulübü için etkinlik oluşturabilir
    if (req.user.role === 'club_manager' && community.manager.toString() !== req.user.userId) {
      return res.status(403).json({ error: 'Sadece kendi kulübünüz için etkinlik oluşturabilirsiniz' });
    }

    const newEvent = new Event({
      title,
      description,
      startDate,
      endDate,
      location,
      community: communityId,
      category: category || community.category,
      imageUrl,
      createdBy: req.user.userId
    });

    await newEvent.save();

    const populatedEvent = await Event.findById(newEvent._id)
      .populate('community', 'name imageUrl')
      .populate('createdBy', 'fullName username profilePicture');

    res.status(201).json(populatedEvent);
  } catch (error) {
    console.error('Error creating event:', error);
    res.status(500).json({ error: 'Etkinlik oluşturulurken bir hata oluştu' });
  }
});

// Etkinliği güncelle (sadece oluşturan veya admin)
router.put('/:eventId', authMiddleware, async (req, res) => {
  try {
    const event = await Event.findById(req.params.eventId);

    if (!event) {
      return res.status(404).json({ error: 'Etkinlik bulunamadı' });
    }

    // Yetki kontrolü
    const isCreator = event.createdBy.toString() === req.user.userId;
    const isAdmin = req.user.role === 'admin';

    if (!isCreator && !isAdmin) {
      return res.status(403).json({ error: 'Bu etkinliği güncelleme yetkiniz yok' });
    }

    const { title, description, startDate, endDate, location, category, imageUrl, isActive } = req.body;

    if (title) event.title = title;
    if (description !== undefined) event.description = description;
    if (startDate) event.startDate = startDate;
    if (endDate) event.endDate = endDate;
    if (location !== undefined) event.location = location;
    if (category) event.category = category;
    if (imageUrl !== undefined) event.imageUrl = imageUrl;
    if (isActive !== undefined) event.isActive = isActive;

    event.updatedAt = Date.now();
    await event.save();

    const updatedEvent = await Event.findById(event._id)
      .populate('community', 'name imageUrl')
      .populate('createdBy', 'fullName username profilePicture');

    res.json(updatedEvent);
  } catch (error) {
    console.error('Error updating event:', error);
    res.status(500).json({ error: 'Etkinlik güncellenirken bir hata oluştu' });
  }
});

// Etkinliği sil (sadece oluşturan veya admin)
router.delete('/:eventId', authMiddleware, async (req, res) => {
  try {
    const event = await Event.findById(req.params.eventId);

    if (!event) {
      return res.status(404).json({ error: 'Etkinlik bulunamadı' });
    }

    // Yetki kontrolü
    const isCreator = event.createdBy.toString() === req.user.userId;
    const isAdmin = req.user.role === 'admin';

    if (!isCreator && !isAdmin) {
      return res.status(403).json({ error: 'Bu etkinliği silme yetkiniz yok' });
    }

    await Event.findByIdAndDelete(req.params.eventId);
    res.json({ message: 'Etkinlik silindi' });
  } catch (error) {
    console.error('Error deleting event:', error);
    res.status(500).json({ error: 'Etkinlik silinirken bir hata oluştu' });
  }
});

// Etkinliğe katılım belirt
router.post('/:eventId/attend', authMiddleware, async (req, res) => {
  try {
    const event = await Event.findById(req.params.eventId);

    if (!event) {
      return res.status(404).json({ error: 'Etkinlik bulunamadı' });
    }

    const userId = req.user.userId;
    const isAttending = event.attendees.includes(userId);

    if (isAttending) {
      // Katılımı iptal et
      event.attendees = event.attendees.filter(id => id.toString() !== userId);
    } else {
      // Katılım ekle
      event.attendees.push(userId);
    }

    await event.save();

    const updatedEvent = await Event.findById(event._id)
      .populate('community', 'name imageUrl')
      .populate('attendees', 'fullName username profilePicture');

    res.json(updatedEvent);
  } catch (error) {
    console.error('Error toggling attendance:', error);
    res.status(500).json({ error: 'Katılım durumu güncellenirken bir hata oluştu' });
  }
});

module.exports = router;
