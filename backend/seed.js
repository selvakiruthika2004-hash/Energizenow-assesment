const mongoose = require('mongoose');
const dotenv = require('dotenv');
const bcrypt = require('bcrypt');
const User = require('./src/models/User');
const Complaint = require('./src/models/Complaint');
const ComplaintActivity = require('./src/models/ComplaintActivity');

dotenv.config();

mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.error(err));

const seedData = async () => {
  try {
    await User.deleteMany();
    await Complaint.deleteMany();
    await ComplaintActivity.deleteMany();
    const Department = require('./src/models/Department');
    await Department.deleteMany();

    const depts = [
      { name: 'IT Support', categories: ['Internet / Network'] },
      { name: 'Technical Support', categories: ['Account / Login'] },
      { name: 'Finance', categories: ['Payment / Refund'] },
      { name: 'Customer Service', categories: ['Product / Service'] },
      { name: 'Hardware Support', categories: ['Hardware / Equipment'] },
      { name: 'General Support', categories: ['Other / General'] }
    ];
    await Department.insertMany(depts);

    const hashedPassword = await bcrypt.hash('password123', 10);
    const users = [];
    users.push({ name: 'System Admin', email: 'admin@test.com', password: hashedPassword, role: 'ADMIN', status: 'ACTIVE' });
    
    for(let i=1; i<=2; i++) {
      users.push({ name: 'Manager ' + i, email: 'manager' + i + '@test.com', password: hashedPassword, role: 'MANAGER', status: 'ACTIVE' });
    }
    
    // Assign agents to departments
    const deptNames = depts.map(d => d.name);
    for(let i=1; i<=12; i++) {
      users.push({ 
        name: 'Agent ' + i, 
        email: 'agent' + i + '@test.com', 
        password: hashedPassword, 
        role: 'SUPPORT_AGENT', 
        department: deptNames[i % deptNames.length],
        status: 'ACTIVE' 
      });
    }
    
    for(let i=1; i<=10; i++) {
      users.push({ 
        name: 'Customer ' + i, 
        email: 'customer' + i + '@test.com', 
        password: hashedPassword, 
        role: 'CUSTOMER', 
        phone: '+1 555-01' + (i < 10 ? '0' + i : i),
        status: 'ACTIVE' 
      });
    }
    
    const createdUsers = await User.insertMany(users);
    
    const adminUser = createdUsers.find(u => u.role === 'ADMIN');
    const customers = createdUsers.filter(u => u.role === 'CUSTOMER');
    const agents = createdUsers.filter(u => u.role === 'SUPPORT_AGENT');
    
    const CallLog = require('./src/models/CallLog');
    await CallLog.deleteMany();

    const complaintsData = [];
    const categories = ['Internet / Network', 'Account / Login', 'Payment / Refund', 'Product / Service', 'Hardware / Equipment', 'Other / General'];
    const priorities = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];
    const statuses = ['OPEN', 'ASSIGNED', 'IN PROGRESS', 'RESOLVED', 'CLOSED', 'ESCALATED'];
    
    for(let i=1; i<=30; i++) {
      const priority = priorities[Math.floor(Math.random() * priorities.length)];
      let responseHours = 8;
      if(priority === 'MEDIUM') responseHours = 4;
      if(priority === 'HIGH') responseHours = 1;
      if(priority === 'CRITICAL') responseHours = 0.25;
      
      const isCall = i % 3 === 0; // 1 out of 3 complaints filed through phone call
      const assignedCust = customers[Math.floor(Math.random() * customers.length)];
      const now = new Date();
      complaintsData.push({
        complaintId: 'CMP-00' + (i < 10 ? '0'+i : i),
        customer: assignedCust._id,
        subject: isCall ? '[Phone Call] Issue report #' + i : 'Issue report #' + i,
        description: isCall ? 'Reported by caller over phone line: Detailed description for issue #' + i : 'Detailed description for issue #' + i,
        category: categories[Math.floor(Math.random() * categories.length)],
        priority: priority,
        status: statuses[Math.floor(Math.random() * statuses.length)],
        assignedAgent: i % 2 === 0 ? agents[Math.floor(Math.random() * agents.length)]._id : null,
        slaStatus: 'ON TRACK',
        slaStartTime: now,
        responseDeadline: new Date(now.getTime() + responseHours * 60 * 60 * 1000),
        resolutionDeadline: new Date(now.getTime() + responseHours * 6 * 60 * 60 * 1000),
        filingMethod: isCall ? 'CALL' : 'REGISTER',
        callerPhone: isCall ? assignedCust.phone || '+1 555-0100' : '',
        filedBy: isCall ? adminUser._id : null
      });
    }
    
    const createdComplaints = await Complaint.insertMany(complaintsData);
    
    // Seed some initial call logs
    await CallLog.insertMany([
      {
        customer: customers[0]._id,
        customerName: customers[0].name,
        customerPhone: customers[0].phone || '+1 555-0101',
        customerEmail: customers[0].email,
        reason: 'Broadband red light blinking, cannot access web portal',
        category: 'Internet / Network',
        priority: 'HIGH',
        status: 'INCOMING'
      },
      {
        customer: customers[1]._id,
        customerName: customers[1].name,
        customerPhone: customers[1].phone || '+1 555-0102',
        customerEmail: customers[1].email,
        reason: 'Payment debited twice during subscription renewal',
        category: 'Payment / Refund',
        priority: 'CRITICAL',
        status: 'INCOMING'
      },
      {
        customer: customers[2]._id,
        customerName: customers[2].name,
        customerPhone: customers[2].phone || '+1 555-0103',
        customerEmail: customers[2].email,
        reason: 'Cannot reset password via email',
        category: 'Account / Login',
        priority: 'MEDIUM',
        status: 'COMPLETED',
        complaint: createdComplaints[2]._id,
        handledBy: adminUser._id,
        notes: 'Assisted customer and filed ticket CMP-0003'
      }
    ]);

    // Create some activities
    const activitiesData = createdComplaints.map(c => ({
      complaint: c._id,
      action: c.filingMethod === 'CALL' ? 'Filed via Call' : 'Created',
      description: c.filingMethod === 'CALL' ? 'Complaint registered via customer phone call by admin' : 'System generated complaint',
      performedBy: c.filingMethod === 'CALL' ? adminUser._id : c.customer,
      newStatus: c.status
    }));
    await ComplaintActivity.insertMany(activitiesData);

    console.log('Data seeded successfully');
    process.exit();
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
};

seedData();
