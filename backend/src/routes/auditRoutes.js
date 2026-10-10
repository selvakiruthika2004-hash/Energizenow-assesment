const express = require('express');
const { protect, authorize } = require('../middleware/auth');
const AuditLog = require('../models/AuditLog');
const router = express.Router();

router.get('/', protect, authorize('ADMIN'), async (req, res) => {
  try {
    const logs = await AuditLog.find().populate('user', 'name email').sort('-createdAt').limit(100);
    res.json(logs);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

module.exports = router;