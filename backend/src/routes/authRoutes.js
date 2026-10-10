const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { protect, authorize } = require('../middleware/auth');
const router = express.Router();

const generateToken = (id) => jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '30d' });

router.post('/register', async (req, res) => {
  try {
    const { name, email, password, phone, role } = req.body;
    const userExists = await User.findOne({ email });
    if (userExists) return res.status(409).json({ message: 'User already exists' });
    const userRole = role || 'CUSTOMER';
    const user = await User.create({ name, email, password, phone, role: userRole });
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

router.get('/customers', protect, authorize('ADMIN', 'SUPPORT_AGENT'), async (req, res) => {
  try {
    const customers = await User.find({ role: 'CUSTOMER' }).select('name email phone status');
    res.json(customers);
  } catch(err) { res.status(500).json({ message: err.message }); }
});

router.put('/change-password', protect, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    if (!(await user.comparePassword(currentPassword))) {
      return res.status(401).json({ message: 'Invalid current password' });
    }
    user.password = newPassword;
    await user.save();
    res.json({ message: 'Password updated successfully' });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

router.post('/create-staff', protect, authorize('ADMIN'), async (req, res) => {
  try {
    const { name, email, password, role, department, phone } = req.body;
    if (role === 'CUSTOMER') return res.status(400).json({ message: 'Use regular registration for customers' });
    const userExists = await User.findOne({ email });
    if (userExists) return res.status(409).json({ message: 'User already exists' });
    const user = await User.create({ name, email, password, phone, role, department });
    res.status(201).json({ _id: user._id, name: user.name, email: user.email, role: user.role, department: user.department });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

module.exports = router;