const cron = require('node-cron');
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
          description: `Automatically escalated to Level ${c.escalationLevel} due to SLA breach.`,
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

module.exports = { checkSLAs };