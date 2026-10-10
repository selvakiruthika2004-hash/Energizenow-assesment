const fs = require('fs');
const path = require('path');

const backendPath = path.join(__dirname, 'backend');

const dirs = [
  'src/models',
  'src/controllers',
  'src/routes',
  'src/middleware',
  'src/utils',
];

dirs.forEach(dir => {
  fs.mkdirSync(path.join(backendPath, dir), { recursive: true });
});

const files = {
  'src/models/User.js': `const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['ADMIN', 'SUPPORT_AGENT', 'MANAGER', 'CUSTOMER'], required: true },
  department: { type: String }
}, { timestamps: true });

userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
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
  assignedAgent: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  status: { type: String, enum: ['OPEN', 'ASSIGNED', 'IN PROGRESS', 'RESOLVED', 'CUSTOMER CONFIRMED', 'CLOSED', 'ESCALATED'], default: 'OPEN' },
  slaStatus: { type: String, enum: ['ON TRACK', 'WARNING', 'BREACHED', 'COMPLETED'], default: 'ON TRACK' },
  slaDeadline: { type: Date },
  resolutionDetails: { type: String }
}, { timestamps: true });

module.exports = mongoose.model('Complaint', complaintSchema);`,

  'src/middleware/auth.js': `const jwt = require('jsonwebtoken');
const User = require('../models/User');

const protect = async (req, res, next) => {
  let token;
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }
  if (!token) return res.status(401).json({ message: 'Not authorized' });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = await User.findById(decoded.id).select('-password');
    next();
  } catch (error) {
    res.status(401).json({ message: 'Not authorized' });
  }
};

module.exports = { protect };`,

  'src/routes/authRoutes.js': `const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const router = express.Router();

router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email });
  if (user && (await user.comparePassword(password))) {
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '30d' });
    res.json({ _id: user._id, name: user.name, email: user.email, role: user.role, token });
  } else {
    res.status(401).json({ message: 'Invalid credentials' });
  }
});

module.exports = router;`,

  'server.js': `const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const cors = require('cors');
const authRoutes = require('./src/routes/authRoutes');

dotenv.config();

const app = express();
app.use(express.json());
app.use(cors());

mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.error(err));

app.use('/api/auth', authRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(\`Server running on \${PORT}\`));`
};

Object.keys(files).forEach(file => {
  fs.writeFileSync(path.join(backendPath, file), files[file]);
});

console.log('Backend files generated.');
