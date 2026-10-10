const mongoose = require('mongoose');
const auditSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  action: { type: String, required: true },
  entity: { type: String },
  entityId: { type: String },
  description: { type: String }
}, { timestamps: true });
module.exports = mongoose.model('AuditLog', auditSchema);