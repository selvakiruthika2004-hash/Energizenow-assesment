const express = require('express');
const { protect, authorize } = require('../middleware/auth');
const CallLog = require('../models/CallLog');
const Complaint = require('../models/Complaint');
const ComplaintActivity = require('../models/ComplaintActivity');
const AuditLog = require('../models/AuditLog');
const Notification = require('../models/Notification');
const User = require('../models/User');
const { analyzeComplaint } = require('../utils/smartEngine');
const { assignComplaintToStaff } = require('../utils/assignmentEngine');
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

// Customer initiates an incoming call / request for call assistance
router.post('/', async (req, res) => {
  try {
    let customer = null;
    let customerName = req.body.customerName;
    let customerPhone = req.body.customerPhone;
    let customerEmail = req.body.customerEmail;

    // If request contains auth header, try to extract user
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer')) {
      try {
        const jwt = require('jsonwebtoken');
        const token = authHeader.split(' ')[1];
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findById(decoded.id);
        if (user) {
          customer = user._id;
          if (!customerName) customerName = user.name;
          if (!customerEmail) customerEmail = user.email;
          if (!customerPhone) customerPhone = user.phone || '9876543210';
        }
      } catch (e) {
        // Continue with body parameters if token invalid
      }
    }

    if (!customerName || !customerPhone) {
      return res.status(400).json({ message: 'Customer name and phone are required to connect call' });
    }

    const call = await CallLog.create({
      customer,
      customerName,
      customerPhone,
      customerEmail,
      reason: req.body.reason || 'Customer unable to file complaint online - requested phone assistance',
      category: req.body.category || 'General Support',
      priority: req.body.priority || 'MEDIUM',
      status: 'INCOMING'
    });

    res.status(201).json(call);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Admin / Staff: Get all calls (active incoming first)
router.get('/', protect, authorize('ADMIN', 'MANAGER', 'SUPPORT_AGENT'), async (req, res) => {
  try {
    const filter = {};
    if (req.query.status) {
      filter.status = req.query.status;
    }
    const calls = await CallLog.find(filter)
      .populate('customer', 'name email phone')
      .populate('complaint', 'complaintId subject status priority filingMethod')
      .populate('handledBy', 'name email')
      .sort('-createdAt');
    res.json(calls);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Customer: Get my calls
router.get('/my-calls', protect, async (req, res) => {
  try {
    const calls = await CallLog.find({
      $or: [
        { customer: req.user._id },
        { customerEmail: req.user.email }
      ]
    })
      .populate('complaint', 'complaintId subject status priority filingMethod createdAt')
      .sort('-createdAt');
    res.json(calls);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Admin / Staff: Update call status (ANSWERED, COMPLETED, MISSED)
router.put('/:id/status', protect, authorize('ADMIN', 'MANAGER', 'SUPPORT_AGENT'), async (req, res) => {
  try {
    const { status, notes } = req.body;
    const call = await CallLog.findById(req.params.id);
    if (!call) return res.status(404).json({ message: 'Call not found' });

    if (status) call.status = status;
    if (notes) call.notes = notes;
    call.handledBy = req.user._id;
    await call.save();

    const populated = await CallLog.findById(call._id)
      .populate('customer', 'name email phone')
      .populate('complaint', 'complaintId subject status priority filingMethod')
      .populate('handledBy', 'name email');

    res.json(populated);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Admin / Staff: File complaint directly for this incoming call!
router.post('/:id/file-complaint', protect, authorize('ADMIN', 'MANAGER', 'SUPPORT_AGENT'), async (req, res) => {
  try {
    const call = await CallLog.findById(req.params.id);
    if (!call) return res.status(404).json({ message: 'Call log not found' });

    const { subject, description, category, priorityOverride } = req.body;
    if (!subject || !description) {
      return res.status(400).json({ message: 'Subject and description are required to file complaint' });
    }

    // Resolve customer ID
    let customerId = call.customer;
    if (!customerId) {
      if (call.customerEmail) {
        const existingUser = await User.findOne({ email: call.customerEmail });
        if (existingUser) customerId = existingUser._id;
      }
      if (!customerId && call.customerPhone) {
        const existingUser = await User.findOne({ phone: call.customerPhone });
        if (existingUser) customerId = existingUser._id;
      }
      // If still not found, find any existing customer or create a caller profile
      if (!customerId) {
        const fallbackCustomer = await User.findOne({ role: 'CUSTOMER' });
        if (fallbackCustomer) {
          customerId = fallbackCustomer._id;
        } else {
          const newCust = await User.create({
            name: call.customerName,
            email: call.customerEmail || `caller_${Date.now()}@test.com`,
            password: 'password123',
            phone: call.customerPhone,
            role: 'CUSTOMER'
          });
          customerId = newCust._id;
        }
      }
    }

    const complaintCategory = category || call.category || 'General Support';
    const complaintId = 'CMP-' + Math.floor(10000 + Math.random() * 90000);

    // Triage processing
    const triage = analyzeComplaint(subject, description, complaintCategory);
    const finalPriority = priorityOverride || triage.priority || 'MEDIUM';
    const SLAs = calculateSLA(finalPriority);

    // Assignment Engine
    const { departmentId, assigneeId } = await assignComplaintToStaff(complaintCategory);
    const initialStatus = assigneeId ? 'ASSIGNED' : 'OPEN';

    const newComplaint = await Complaint.create({
      complaintId,
      customer: customerId,
      subject,
      description,
      category: complaintCategory,
      priority: finalPriority,
      systemSuggestedPriority: triage.priority,
      slaStartTime: new Date(),
      responseDeadline: SLAs.responseDeadline,
      resolutionDeadline: SLAs.resolutionDeadline,
      department: departmentId,
      assignedAgent: assigneeId,
      status: initialStatus,
      filingMethod: 'CALL', // Important: Filed through call
      callLog: call._id,
      callerPhone: call.customerPhone,
      filedBy: req.user._id
    });

    // Update CallLog
    call.status = 'COMPLETED';
    call.complaint = newComplaint._id;
    call.handledBy = req.user._id;
    if (req.body.callNotes) call.notes = req.body.callNotes;
    await call.save();

    await ComplaintActivity.create({
      complaint: newComplaint._id,
      action: 'Filed via Phone Call',
      description: `Complaint logged on customer behalf over phone by ${req.user.name} (${req.user.role}). Caller: ${call.customerName} (${call.customerPhone})`,
      performedBy: req.user._id,
      newStatus: initialStatus
    });

    if (assigneeId) {
      await ComplaintActivity.create({
        complaint: newComplaint._id,
        action: 'Assigned',
        description: 'Auto-assigned to staff',
        performedBy: req.user._id,
        newStatus: 'ASSIGNED'
      });
    }

    await AuditLog.create({
      user: req.user._id,
      action: 'CREATE_COMPLAINT_VIA_CALL',
      entity: 'Complaint',
      entityId: newComplaint._id,
      description: `Complaint ${complaintId} created via incoming phone call for ${call.customerName}.`
    });

    await Notification.create({
      user: customerId,
      complaint: newComplaint._id,
      message: `A complaint (${complaintId}) has been registered on your behalf through phone call.`
    });

    const populatedComplaint = await Complaint.findById(newComplaint._id)
      .populate('customer', 'name email phone')
      .populate('assignedAgent', 'name')
      .populate('filedBy', 'name');

    res.status(201).json({
      message: 'Complaint filed successfully via phone call',
      complaint: populatedComplaint,
      call
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
