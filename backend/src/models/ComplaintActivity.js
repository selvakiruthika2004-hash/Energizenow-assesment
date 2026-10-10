const mongoose = require('mongoose');
const activitySchema = new mongoose.Schema({
  complaint: { type: mongoose.Schema.Types.ObjectId, ref: 'Complaint', required: true },
  action: { type: String, required: true },
  description: { type: String },
  performedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  oldStatus: String,
  newStatus: String
}, { timestamps: true });
module.exports = mongoose.model('ComplaintActivity', activitySchema);