const mongoose = require('mongoose');

const complaintSchema = new mongoose.Schema({
  complaintId: { type: String, required: true, unique: true },
  customer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  subject: { type: String, required: true },
  description: { type: String, required: true },
  category: { type: String, required: true },
  priority: { type: String, enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'], default: 'LOW' },
  systemSuggestedPriority: { type: String, enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'] },
  assignedAgent: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  department: { type: mongoose.Schema.Types.ObjectId, ref: 'Department' },
  status: { type: String, enum: ['OPEN', 'ASSIGNED', 'IN PROGRESS', 'RESOLVED', 'CUSTOMER CONFIRMED', 'CLOSED', 'ESCALATED', 'ON HOLD', 'REJECTED'], default: 'OPEN' },
  filingMethod: { type: String, enum: ['REGISTER', 'CALL'], default: 'REGISTER' },
  callLog: { type: mongoose.Schema.Types.ObjectId, ref: 'CallLog' },
  filedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  callerPhone: { type: String },
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

module.exports = mongoose.model('Complaint', complaintSchema);