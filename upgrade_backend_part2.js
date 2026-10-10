const fs = require('fs');
const path = require('path');

const backendPath = path.join(__dirname, 'backend');

const files = {
  'src/utils/cronJobs.js': `const cron = require('node-cron');
const Complaint = require('../models/Complaint');
const ComplaintActivity = require('../models/ComplaintActivity');
const User = require('../models/User');

const checkSLAs = async () => {
  try {
    const now = new Date();
    
    // Check for SLA Warnings (25% time remaining)
    // Simplified logic: If we are past 75% of the time, mark as WARNING if ON TRACK
    const complaints = await Complaint.find({ status: { $in: ['OPEN', 'ASSIGNED', 'IN PROGRESS'] } });
    
    for (let c of complaints) {
      if (c.slaStatus === 'COMPLETED') continue;
      
      if (now > c.resolutionDeadline && c.slaStatus !== 'BREACHED') {
        c.slaStatus = 'BREACHED';
        c.isEscalated = true;
        c.escalationLevel += 1;
        c.status = 'ESCALATED';
        await c.save();
        
        await ComplaintActivity.create({
          complaint: c._id,
          action: 'SLA Breached & Escalated',
          description: \`Automatically escalated to Level \${c.escalationLevel} due to SLA breach.\`,
          newStatus: 'ESCALATED'
        });
      } else if (now > new Date(c.resolutionDeadline.getTime() - (c.resolutionDeadline.getTime() - c.slaStartTime.getTime()) * 0.25) && c.slaStatus === 'ON TRACK') {
        c.slaStatus = 'WARNING';
        await c.save();
        
        await ComplaintActivity.create({
          complaint: c._id,
          action: 'SLA Warning',
          description: 'SLA is approaching deadline.',
          newStatus: c.status
        });
      }
    }
  } catch(err) { console.error('Cron error', err); }
};

// Run every minute for demo purposes
cron.schedule('* * * * *', () => {
  console.log('Running SLA Check Cron...');
  checkSLAs();
});

module.exports = { checkSLAs };`,

  'src/routes/dashboardRoutes.js': `const express = require('express');
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

module.exports = router;`
};

Object.keys(files).forEach(file => {
  const filePath = path.join(backendPath, file);
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, files[file]);
});

console.log('Backend upgrade part 2 files generated.');
