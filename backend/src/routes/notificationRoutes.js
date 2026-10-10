const express = require('express');
const { protect } = require('../middleware/auth');
const Notification = require('../models/Notification');
const router = express.Router();

router.get('/', protect, async (req, res) => {
  try {
    const notifications = await Notification.find({ user: req.user._id }).sort('-createdAt');
    res.json(notifications);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

router.put('/:id/read', protect, async (req, res) => {
  try {
    const notification = await Notification.findOneAndUpdate(
      { _id: req.params.id, user: req.user._id },
      { read: true },
      { new: true }
    );
    res.json(notification);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

module.exports = router;
