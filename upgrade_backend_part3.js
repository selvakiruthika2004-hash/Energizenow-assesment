const fs = require('fs');
const path = require('path');

const backendPath = path.join(__dirname, 'backend');

const files = {
  'src/utils/smartEngine.js': `// Transparent Rule-Based Engine
const analyzeComplaint = (subject, description, category) => {
  const text = (subject + ' ' + description).toLowerCase();
  let sentiment = 'NEUTRAL';
  let priority = 'LOW';
  let riskScore = 10;
  
  if (text.includes('angry') || text.includes('unacceptable') || text.includes('failed') || text.includes('worst')) {
    sentiment = 'NEGATIVE';
  }
  if (text.includes('urgent') || text.includes('outage') || text.includes('security') || text.includes('breach')) {
    priority = 'CRITICAL';
    sentiment = 'HIGHLY_NEGATIVE';
    riskScore = 85;
  } else if (text.includes('important') || text.includes('business') || text.includes('down')) {
    priority = 'HIGH';
    riskScore = 60;
  } else if (text.includes('normal') || text.includes('issue')) {
    priority = 'MEDIUM';
    riskScore = 30;
  }

  return { sentiment, priority, riskScore };
};

module.exports = { analyzeComplaint };`,

  'src/models/AuditLog.js': `const mongoose = require('mongoose');
const auditSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  action: { type: String, required: true },
  entity: { type: String },
  entityId: { type: String },
  description: { type: String }
}, { timestamps: true });
module.exports = mongoose.model('AuditLog', auditSchema);`,

  'src/routes/auditRoutes.js': `const express = require('express');
const { protect, authorize } = require('../middleware/auth');
const AuditLog = require('../models/AuditLog');
const router = express.Router();

router.get('/', protect, authorize('ADMIN'), async (req, res) => {
  try {
    const logs = await AuditLog.find().populate('user', 'name email').sort('-createdAt').limit(100);
    res.json(logs);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

module.exports = router;`
};

Object.keys(files).forEach(file => {
  const filePath = path.join(backendPath, file);
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, files[file]);
});

console.log('Backend upgrade part 3 files generated.');
