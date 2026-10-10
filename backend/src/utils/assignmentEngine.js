const User = require('../models/User');
const Department = require('../models/Department');
const Complaint = require('../models/Complaint');

const assignComplaintToStaff = async (category) => {
  // 1. Find matching department
  const department = await Department.findOne({ categories: category, isActive: true });
  if (!department) return { departmentId: null, assigneeId: null };

  // 2. Find active staff in this department
  const activeStaff = await User.find({ role: 'SUPPORT_AGENT', department: department.name, status: 'ACTIVE' });
  
  if (!activeStaff || activeStaff.length === 0) {
    return { departmentId: department._id, assigneeId: null };
  }

  // 3. Find staff with fewest active complaints
  const staffIds = activeStaff.map(s => s._id);
  
  const activeComplaintsCounts = await Complaint.aggregate([
    { $match: { assignedAgent: { $in: staffIds }, status: { $in: ['ASSIGNED', 'IN PROGRESS', 'OPEN', 'ESCALATED', 'ON HOLD'] } } },
    { $group: { _id: '$assignedAgent', count: { $sum: 1 } } }
  ]);

  const countMap = {};
  activeComplaintsCounts.forEach(c => {
    countMap[c._id.toString()] = c.count;
  });

  // Assign to the one with minimum count
  let selectedStaff = activeStaff[0];
  let minCount = countMap[selectedStaff._id.toString()] || 0;

  for (let i = 1; i < activeStaff.length; i++) {
    const staff = activeStaff[i];
    const count = countMap[staff._id.toString()] || 0;
    if (count < minCount) {
      minCount = count;
      selectedStaff = staff;
    }
  }

  return { departmentId: department._id, assigneeId: selectedStaff._id };
};

module.exports = { assignComplaintToStaff };
