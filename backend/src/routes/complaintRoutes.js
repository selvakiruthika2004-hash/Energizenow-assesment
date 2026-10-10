const express = require('express');
const { protect, authorize } = require('../middleware/auth');
const Complaint = require('../models/Complaint');
const ComplaintActivity = require('../models/ComplaintActivity');
const AuditLog = require('../models/AuditLog');
const { analyzeComplaint } = require('../utils/smartEngine');
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
    const complaints = await Complaint.find(filter)
      .populate('customer', 'name email phone')
      .populate('assignedAgent', 'name')
      .populate('filedBy', 'name email')
      .sort('-createdAt');
    res.json(complaints);
  } catch (error) { res.status(500).json({ message: error.message }); }
});

const { assignComplaintToStaff } = require('../utils/assignmentEngine');

router.post('/', protect, async (req, res) => {
  try {
    const { subject, description, category, priorityOverride, customerId, filingMethod, callerPhone } = req.body;
    const complaintId = 'CMP-' + Math.floor(10000 + Math.random() * 90000);
    
    // Triage processing
    const triage = analyzeComplaint(subject, description, category);
    const finalPriority = priorityOverride || triage.priority;
    const SLAs = calculateSLA(finalPriority);
    
    // Assignment Engine
    const { departmentId, assigneeId } = await assignComplaintToStaff(category);
    const initialStatus = assigneeId ? 'ASSIGNED' : 'OPEN';

    // Determine target customer & filing method
    let targetCustomer = req.user._id;
    let effectiveFilingMethod = 'REGISTER';
    let filedByUser = null;

    if ((req.user.role === 'ADMIN' || req.user.role === 'SUPPORT_AGENT' || req.user.role === 'MANAGER') && customerId) {
      targetCustomer = customerId;
      effectiveFilingMethod = filingMethod || 'CALL';
      filedByUser = req.user._id;
    }

    const newComplaint = await Complaint.create({
      complaintId,
      customer: targetCustomer,
      subject,
      description,
      category,
      priority: finalPriority,
      systemSuggestedPriority: triage.priority,
      slaStartTime: new Date(),
      responseDeadline: SLAs.responseDeadline,
      resolutionDeadline: SLAs.resolutionDeadline,
      department: departmentId,
      assignedAgent: assigneeId,
      status: initialStatus,
      filingMethod: effectiveFilingMethod,
      callerPhone: callerPhone || '',
      filedBy: filedByUser
    });
    
    const activityDesc = effectiveFilingMethod === 'CALL'
      ? `Filed via Phone Call on behalf of customer by ${req.user.name} (${req.user.role})`
      : `Created online with sentiment ${triage.sentiment} and SLA Risk Score ${triage.riskScore}%`;

    await ComplaintActivity.create({ 
      complaint: newComplaint._id, 
      action: effectiveFilingMethod === 'CALL' ? 'Filed via Call' : 'Created', 
      description: activityDesc, 
      performedBy: req.user._id, 
      newStatus: initialStatus 
    });

    if (assigneeId) {
      await ComplaintActivity.create({ complaint: newComplaint._id, action: 'Assigned', description: `Auto-assigned to staff`, performedBy: req.user._id, newStatus: 'ASSIGNED' });
    }

    await AuditLog.create({ 
      user: req.user._id, 
      action: effectiveFilingMethod === 'CALL' ? 'CREATE_COMPLAINT_VIA_CALL' : 'CREATE_COMPLAINT', 
      entity: 'Complaint', 
      entityId: newComplaint._id, 
      description: `Complaint ${complaintId} created (${effectiveFilingMethod}).` 
    });

    const populated = await Complaint.findById(newComplaint._id)
      .populate('customer', 'name email phone')
      .populate('assignedAgent', 'name')
      .populate('filedBy', 'name');
    
    res.status(201).json(populated);
  } catch (error) { res.status(500).json({ message: error.message }); }
});

router.get('/:id', protect, async (req, res) => {
  try {
    const complaint = await Complaint.findById(req.params.id)
      .populate('customer', 'name email phone')
      .populate('assignedAgent', 'name email')
      .populate('filedBy', 'name email')
      .populate('callLog');
    if (!complaint) return res.status(404).json({ message: 'Not found' });
    res.json(complaint);
  } catch (error) { res.status(500).json({ message: error.message }); }
});

router.put('/:id/status', protect, async (req, res) => {
  try {
    const { status, notes } = req.body;
    if (!status) return res.status(400).json({ message: 'Status is required' });

    const complaint = await Complaint.findById(req.params.id);
    if (!complaint) return res.status(404).json({ message: 'Not found' });

    // Authorization
    if (req.user.role === 'SUPPORT_AGENT' && complaint.assignedAgent && complaint.assignedAgent.toString() !== req.user._id.toString() && req.user.role !== 'ADMIN') {
      return res.status(403).json({ message: 'Not authorized to update this complaint' });
    }
    if (req.user.role === 'CUSTOMER' && status !== 'CUSTOMER CONFIRMED' && status !== 'REOPENED') {
      return res.status(403).json({ message: 'Customers can only confirm or reopen' });
    }

    const noteText = notes || `Status changed to ${status} by ${req.user.name || req.user.role}`;

    const oldStatus = complaint.status;
    complaint.status = status;

    if (status === 'RESOLVED') {
      complaint.resolutionDetails = noteText;
      complaint.resolvedBy = req.user._id;
      complaint.resolvedAt = new Date();
      if (!complaint.actualResolutionTime) complaint.actualResolutionTime = new Date();
    } else if (status === 'CLOSED') {
      complaint.closedAt = new Date();
    }

    await complaint.save();
    
    await ComplaintActivity.create({ 
      complaint: complaint._id, 
      action: 'Status Update', 
      description: `Status changed to ${status}${notes ? ': ' + notes : ''}`, 
      performedBy: req.user._id, 
      oldStatus, 
      newStatus: status 
    });

    await AuditLog.create({
      user: req.user._id,
      action: 'UPDATE_COMPLAINT_STATUS',
      entity: 'Complaint',
      entityId: complaint._id,
      description: `Status changed from ${oldStatus} to ${status}`
    });

    // Notify customer
    try {
      const Notification = require('../models/Notification');
      await Notification.create({
        user: complaint.customer,
        complaint: complaint._id,
        message: `Your complaint ${complaint.complaintId} status changed to ${status}.`
      });
    } catch (notifErr) {
      console.error('Notification error:', notifErr.message);
    }

    const updated = await Complaint.findById(complaint._id)
      .populate('customer', 'name email phone')
      .populate('assignedAgent', 'name')
      .populate('filedBy', 'name');

    res.json(updated);
  } catch(error) { res.status(500).json({ message: error.message }); }
});

module.exports = router;