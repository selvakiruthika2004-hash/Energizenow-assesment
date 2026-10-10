const express = require('express');
const { protect } = require('../middleware/auth');
const Complaint = require('../models/Complaint');
const router = express.Router();

router.get('/analytics', protect, async (req, res) => {
  try {
    const filter = req.user.role === 'CUSTOMER' ? { customer: req.user._id } : req.user.role === 'SUPPORT_AGENT' ? { assignedAgent: req.user._id } : {};
    
    const total = await Complaint.countDocuments(filter);
    const resolved = await Complaint.countDocuments({ ...filter, status: 'RESOLVED' });
    const escalated = await Complaint.countDocuments({ ...filter, isEscalated: true });
    const breached = await Complaint.countDocuments({ ...filter, slaStatus: 'BREACHED' });
    
    res.json({
      total,
      resolved,
      escalated,
      breached,
      slaCompliance: total > 0 ? Math.round(((total - breached) / total) * 100) : 100
    });
  } catch(err) { res.status(500).json({ message: err.message }); }
});

module.exports = router;