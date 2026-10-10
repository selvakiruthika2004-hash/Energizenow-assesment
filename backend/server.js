const express = require('express');
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

require('./src/utils/cronJobs'); // Start cron jobs

app.use('/api/auth', authRoutes);
app.use('/api/complaints', require('./src/routes/complaintRoutes'));
app.use('/api/calls', require('./src/routes/callRoutes'));
app.use('/api/dashboard', require('./src/routes/dashboardRoutes'));
app.use('/api/audit', require('./src/routes/auditRoutes'));
app.use('/api/notifications', require('./src/routes/notificationRoutes'));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on ${PORT}`));