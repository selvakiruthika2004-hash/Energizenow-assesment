const fs = require('fs');
const path = require('path');

const backendPath = path.join(__dirname, 'backend');

const files = {
  'src/models/ComplaintActivity.js': `const mongoose = require('mongoose');
const activitySchema = new mongoose.Schema({
  complaint: { type: mongoose.Schema.Types.ObjectId, ref: 'Complaint', required: true },
  action: { type: String, required: true },
  description: { type: String },
  performedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  oldStatus: String,
  newStatus: String
}, { timestamps: true });
module.exports = mongoose.model('ComplaintActivity', activitySchema);`,

  'src/models/User.js': `const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['ADMIN', 'MANAGER', 'SUPPORT_AGENT', 'CUSTOMER'], required: true },
  department: { type: String },
  phone: { type: String },
  status: { type: String, enum: ['ACTIVE', 'INACTIVE', 'SUSPENDED'], default: 'ACTIVE' },
  lastLoginAt: { type: Date }
}, { timestamps: true });

userSchema.pre('save', async function () {
  if (!this.isModified('password')) return;
  this.password = await bcrypt.hash(this.password, 10);
});

userSchema.methods.comparePassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('User', userSchema);`,

  'src/models/Complaint.js': `const mongoose = require('mongoose');

const complaintSchema = new mongoose.Schema({
  complaintId: { type: String, required: true, unique: true },
  customer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  subject: { type: String, required: true },
  description: { type: String, required: true },
  category: { type: String, required: true },
  priority: { type: String, enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'], default: 'LOW' },
  systemSuggestedPriority: { type: String, enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'] },
  assignedAgent: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  status: { type: String, enum: ['OPEN', 'ASSIGNED', 'IN PROGRESS', 'RESOLVED', 'CUSTOMER CONFIRMED', 'CLOSED', 'ESCALATED', 'ON HOLD', 'REJECTED'], default: 'OPEN' },
  slaStatus: { type: String, enum: ['ON TRACK', 'WARNING', 'BREACHED', 'COMPLETED'], default: 'ON TRACK' },
  slaStartTime: { type: Date },
  responseDeadline: { type: Date },
  resolutionDeadline: { type: Date },
  actualResponseTime: { type: Date },
  actualResolutionTime: { type: Date },
  escalationLevel: { type: Number, default: 0 },
  isEscalated: { type: Boolean, default: false },
  resolutionType: { type: String },
  resolutionDetails: { type: String },
  resolvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  resolvedAt: { type: Date },
  closedAt: { type: Date }
}, { timestamps: true });

module.exports = mongoose.model('Complaint', complaintSchema);`,

  'src/middleware/auth.js': `const jwt = require('jsonwebtoken');
const User = require('../models/User');

const protect = async (req, res, next) => {
  let token;
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }
  if (!token) return res.status(401).json({ message: 'Not authorized, no token' });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = await User.findById(decoded.id).select('-password');
    if(req.user.status !== 'ACTIVE') return res.status(403).json({ message: 'Account disabled' });
    next();
  } catch (error) {
    res.status(401).json({ message: 'Not authorized, token failed' });
  }
};

const authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ message: 'Role not authorized' });
    }
    next();
  };
};

module.exports = { protect, authorize };`,

  'src/routes/authRoutes.js': `const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { protect, authorize } = require('../middleware/auth');
const router = express.Router();

const generateToken = (id) => jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '30d' });

router.post('/register', async (req, res) => {
  try {
    const { name, email, password, phone } = req.body;
    const userExists = await User.findOne({ email });
    if (userExists) return res.status(409).json({ message: 'User already exists' });
    const user = await User.create({ name, email, password, phone, role: 'CUSTOMER' });
    res.status(201).json({ _id: user._id, name: user.name, email: user.email, role: user.role, token: generateToken(user._id) });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if(user && user.status !== 'ACTIVE') return res.status(403).json({ message: 'Account disabled' });
    if (user && (await user.comparePassword(password))) {
      user.lastLoginAt = new Date();
      await user.save();
      res.json({ _id: user._id, name: user.name, email: user.email, role: user.role, token: generateToken(user._id) });
    } else {
      res.status(401).json({ message: 'Invalid credentials' });
    }
  } catch(err) { res.status(500).json({ message: err.message }); }
});

router.get('/me', protect, (req, res) => {
  res.json(req.user);
});

router.get('/users', protect, authorize('ADMIN'), async (req, res) => {
  try {
    const users = await User.find().select('-password');
    res.json(users);
  } catch(err) { res.status(500).json({ message: err.message }); }
});

module.exports = router;`,

  'src/routes/complaintRoutes.js': `const express = require('express');
const { protect, authorize } = require('../middleware/auth');
const Complaint = require('../models/Complaint');
const ComplaintActivity = require('../models/ComplaintActivity');
const router = express.Router();

const calculateSLA = (priority) => {
  const now = new Date();
  const slaMap = {
    'LOW': { resp: 8, res: 48 },
    'MEDIUM': { resp: 4, res: 24 },
    'HIGH': { resp: 1, res: 8 },
    'CRITICAL': { resp: 0.25, res: 2 }
  };
  const hours = slaMap[priority] || slaMap['LOW'];
  return {
    responseDeadline: new Date(now.getTime() + hours.resp * 60 * 60 * 1000),
    resolutionDeadline: new Date(now.getTime() + hours.res * 60 * 60 * 1000)
  };
};

router.get('/', protect, async (req, res) => {
  try {
    const filter = req.user.role === 'CUSTOMER' ? { customer: req.user._id } : req.user.role === 'SUPPORT_AGENT' ? { assignedAgent: req.user._id } : {};
    const complaints = await Complaint.find(filter).populate('customer', 'name email').populate('assignedAgent', 'name').sort('-createdAt');
    res.json(complaints);
  } catch (error) { res.status(500).json({ message: error.message }); }
});

router.post('/', protect, async (req, res) => {
  try {
    const { subject, description, category, priority } = req.body;
    const complaintId = 'CMP-' + Math.floor(10000 + Math.random() * 90000);
    const SLAs = calculateSLA(priority || 'LOW');
    
    const newComplaint = await Complaint.create({
      complaintId,
      customer: req.user._id,
      subject,
      description,
      category,
      priority: priority || 'LOW',
      systemSuggestedPriority: priority || 'LOW',
      slaStartTime: new Date(),
      responseDeadline: SLAs.responseDeadline,
      resolutionDeadline: SLAs.resolutionDeadline
    });
    
    await ComplaintActivity.create({ complaint: newComplaint._id, action: 'Created', description: 'Complaint created', performedBy: req.user._id, newStatus: 'OPEN' });
    res.status(201).json(newComplaint);
  } catch (error) { res.status(500).json({ message: error.message }); }
});

router.get('/:id', protect, async (req, res) => {
  try {
    const complaint = await Complaint.findById(req.params.id)
      .populate('customer', 'name email')
      .populate('assignedAgent', 'name');
    if (!complaint) return res.status(404).json({ message: 'Not found' });
    res.json(complaint);
  } catch (error) { res.status(500).json({ message: error.message }); }
});

router.put('/:id/status', protect, async (req, res) => {
  try {
    const { status } = req.body;
    const complaint = await Complaint.findById(req.params.id);
    if (!complaint) return res.status(404).json({ message: 'Not found' });
    const oldStatus = complaint.status;
    complaint.status = status;
    await complaint.save();
    
    await ComplaintActivity.create({ complaint: complaint._id, action: 'Status Update', description: \`Status changed to \${status}\`, performedBy: req.user._id, oldStatus, newStatus: status });
    res.json(complaint);
  } catch(error) { res.status(500).json({ message: error.message }); }
});

module.exports = router;`
};

Object.keys(files).forEach(file => {
  const filePath = path.join(backendPath, file);
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, files[file]);
});

console.log('Backend upgrade files generated successfully.');
