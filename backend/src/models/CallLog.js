const mongoose = require('mongoose');

const callLogSchema = new mongoose.Schema({
  customer: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  customerName: { type: String, required: true },
  customerPhone: { type: String, required: true },
  customerEmail: { type: String },
  reason: { type: String, default: 'Unable to file complaint online / Need phone assistance' },
  category: { type: String, default: 'General Support' },
  priority: { type: String, enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'], default: 'MEDIUM' },
  status: { type: String, enum: ['INCOMING', 'ANSWERED', 'COMPLETED', 'MISSED'], default: 'INCOMING' },
  complaint: { type: mongoose.Schema.Types.ObjectId, ref: 'Complaint' },
  handledBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  notes: { type: String }
}, { timestamps: true });

module.exports = mongoose.model('CallLog', callLogSchema);
