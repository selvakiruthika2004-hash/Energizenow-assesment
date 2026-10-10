import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { 
  LayoutDashboard, 
  Plus, 
  PhoneCall, 
  PhoneIncoming, 
  Phone, 
  Laptop, 
  CheckCircle, 
  AlertCircle, 
  Clock, 
  X, 
  UserCheck, 
  Filter, 
  Check 
} from 'lucide-react';
import { API_BASE } from '../utils/api';

export default function Dashboard() {
  const [complaints, setComplaints] = useState([]);
  const [incomingCalls, setIncomingCalls] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [filingFilter, setFilingFilter] = useState('ALL'); // ALL | REGISTER | CALL
  const [toastMessage, setToastMessage] = useState('');
  const [updatingId, setUpdatingId] = useState(null);

  // Customer Call Modal State
  const [showCustomerCallModal, setShowCustomerCallModal] = useState(false);
  const [callActive, setCallActive] = useState(false);
  const [callTimer, setCallTimer] = useState(0);
  const [activeCallId, setActiveCallId] = useState(null);
  const [resolvedComplaintFromCall, setResolvedComplaintFromCall] = useState(null);
  const [callPhone, setCallPhone] = useState('');
  const [callReason, setCallReason] = useState('');
  const [callCategory, setCallCategory] = useState('Internet / Network');
  const [callingStateLoading, setCallingStateLoading] = useState(false);

  // Admin File Complaint on Behalf of Customer Modal State
  const [showAdminFileModal, setShowAdminFileModal] = useState(false);
  const [selectedCallToAnswer, setSelectedCallToAnswer] = useState(null);
  const [adminFormData, setAdminFormData] = useState({
    customerId: '',
    customerName: '',
    customerPhone: '',
    customerEmail: '',
    subject: '',
    description: '',
    category: 'Internet / Network',
    priority: 'MEDIUM'
  });
  const [adminSubmitting, setAdminSubmitting] = useState(false);

  const user = JSON.parse(localStorage.getItem('user'));
  const navigate = useNavigate();

  const isAdminOrAgent = user?.role === 'ADMIN' || user?.role === 'SUPPORT_AGENT' || user?.role === 'MANAGER';
  const isCustomer = user?.role === 'CUSTOMER';

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 3500);
  };

  const fetchComplaints = async () => {
    if (!user) return;
    try {
      const res = await axios.get(`${API_BASE}/complaints`, {
        headers: { Authorization: `Bearer ${user.token}` }
      });
      setComplaints(res.data);
    } catch (err) {
      console.error('Error fetching complaints', err);
    }
  };

  const fetchIncomingCalls = async () => {
    if (!user || !isAdminOrAgent) return;
    try {
      const res = await axios.get(`${API_BASE}/calls?status=INCOMING`, {
        headers: { Authorization: `Bearer ${user.token}` }
      });
      setIncomingCalls(res.data);
    } catch (err) {
      console.error('Error fetching incoming calls', err);
    }
  };

  const fetchCustomers = async () => {
    if (!user || !isAdminOrAgent) return;
    try {
      const res = await axios.get(`${API_BASE}/auth/customers`, {
        headers: { Authorization: `Bearer ${user.token}` }
      });
      setCustomers(res.data);
    } catch (err) {
      console.error('Error fetching customers', err);
    }
  };

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    fetchComplaints();
    if (isAdminOrAgent) {
      fetchIncomingCalls();
      fetchCustomers();
      const interval = setInterval(fetchIncomingCalls, 5000);
      return () => clearInterval(interval);
    }
  }, [navigate, user?.token, user?.role]);

  // Call duration counter for customer in active call
  useEffect(() => {
    let timer;
    if (callActive) {
      timer = setInterval(() => {
        setCallTimer(prev => prev + 1);
      }, 1000);
    } else {
      setCallTimer(0);
    }
    return () => clearInterval(timer);
  }, [callActive]);

  // Polling to see if admin filed a complaint for this customer's active call
  useEffect(() => {
    let pollTimer;
    if (callActive && activeCallId) {
      pollTimer = setInterval(async () => {
        try {
          const res = await axios.get(`${API_BASE}/calls/my-calls`, {
            headers: { Authorization: `Bearer ${user.token}` }
          });
          const matching = res.data.find(c => c._id === activeCallId);
          if (matching && matching.status === 'COMPLETED' && matching.complaint) {
            setResolvedComplaintFromCall(matching.complaint);
            fetchComplaints();
          }
        } catch (e) {
          // silent
        }
      }, 3000);
    }
    return () => clearInterval(pollTimer);
  }, [callActive, activeCallId, user?.token]);

  // Handle direct Status dropdown change for Admin / Support Agent
  const handleStatusChange = async (complaintId, newStatus) => {
    setUpdatingId(complaintId);
    try {
      const res = await axios.put(
        `${API_BASE}/complaints/${complaintId}/status`,
        { status: newStatus },
        { headers: { Authorization: `Bearer ${user.token}` } }
      );

      // Update state locally
      setComplaints(prev => prev.map(c => (c._id === complaintId ? res.data : c)));
      showToast(`Status updated to ${newStatus} successfully!`);
    } catch (err) {
      console.error('Status update failed', err);
      alert(err.response?.data?.message || 'Failed to update status');
    } finally {
      setUpdatingId(null);
    }
  };

  // Customer triggers initiating a call
  const handleStartCustomerCall = async (e) => {
    e.preventDefault();
    setCallingStateLoading(true);
    try {
      const res = await axios.post(
        `${API_BASE}/calls`,
        {
          customerName: user.name,
          customerPhone: callPhone || user.phone || '9876543210',
          customerEmail: user.email,
          reason: callReason || 'Unable to file complaint online - requested phone assistance',
          category: callCategory
        },
        { headers: { Authorization: `Bearer ${user.token}` } }
      );
      setActiveCallId(res.data._id);
      setCallActive(true);
      setResolvedComplaintFromCall(null);
    } catch (err) {
      alert(err.response?.data?.message || 'Error connecting call to support helpline');
    } finally {
      setCallingStateLoading(false);
    }
  };

  const handleEndCustomerCall = () => {
    setCallActive(false);
    setActiveCallId(null);
    setShowCustomerCallModal(false);
    setResolvedComplaintFromCall(null);
    fetchComplaints();
  };

  // Open Admin File Complaint Modal
  const openAdminFileModal = (call = null) => {
    setSelectedCallToAnswer(call);
    if (call) {
      setAdminFormData({
        customerId: call.customer?._id || '',
        customerName: call.customerName || call.customer?.name || '',
        customerPhone: call.customerPhone || call.customer?.phone || '',
        customerEmail: call.customerEmail || call.customer?.email || '',
        subject: `[Phone Call] ${call.reason || 'Customer Issue'}`,
        description: `Customer called Support Desk:\nIssue: ${call.reason || 'Assistance requested'}\nCaller Phone: ${call.customerPhone}`,
        category: call.category || 'Internet / Network',
        priority: call.priority || 'MEDIUM'
      });
    } else {
      setAdminFormData({
        customerId: customers[0]?._id || '',
        customerName: customers[0]?.name || '',
        customerPhone: customers[0]?.phone || '',
        customerEmail: customers[0]?.email || '',
        subject: '',
        description: '',
        category: 'Internet / Network',
        priority: 'MEDIUM'
      });
    }
    setShowAdminFileModal(true);
  };

  const handleAdminCustomerSelect = (custId) => {
    const cust = customers.find(c => c._id === custId);
    if (cust) {
      setAdminFormData(prev => ({
        ...prev,
        customerId: cust._id,
        customerName: cust.name,
        customerPhone: cust.phone || '',
        customerEmail: cust.email || ''
      }));
    }
  };

  const handleAdminFileComplaintSubmit = async (e) => {
    e.preventDefault();
    setAdminSubmitting(true);
    try {
      if (selectedCallToAnswer) {
        await axios.post(
          `${API_BASE}/calls/${selectedCallToAnswer._id}/file-complaint`,
          {
            subject: adminFormData.subject,
            description: adminFormData.description,
            category: adminFormData.category,
            priorityOverride: adminFormData.priority
          },
          { headers: { Authorization: `Bearer ${user.token}` } }
        );
      } else {
        await axios.post(
          `${API_BASE}/complaints`,
          {
            customerId: adminFormData.customerId,
            subject: adminFormData.subject,
            description: adminFormData.description,
            category: adminFormData.category,
            priorityOverride: adminFormData.priority,
            filingMethod: 'CALL',
            callerPhone: adminFormData.customerPhone
          },
          { headers: { Authorization: `Bearer ${user.token}` } }
        );
      }

      showToast('Complaint filed successfully on customer behalf via Phone Call!');
      setShowAdminFileModal(false);
      fetchComplaints();
      fetchIncomingCalls();
    } catch (err) {
      alert(err.response?.data?.message || 'Error filing complaint');
    } finally {
      setAdminSubmitting(false);
    }
  };

  // Filter complaints based on filingMethod
  const filteredComplaints = complaints.filter(c => {
    if (filingFilter === 'REGISTER') return c.filingMethod !== 'CALL';
    if (filingFilter === 'CALL') return c.filingMethod === 'CALL';
    return true;
  });

  const stats = {
    total: complaints.length,
    open: complaints.filter(c => c.status === 'OPEN' || c.status === 'ASSIGNED').length,
    inProgress: complaints.filter(c => c.status === 'IN PROGRESS').length,
    resolved: complaints.filter(c => c.status === 'RESOLVED' || c.status === 'CLOSED' || c.status === 'CUSTOMER CONFIRMED').length,
    viaRegister: complaints.filter(c => c.filingMethod !== 'CALL').length,
    viaCall: complaints.filter(c => c.filingMethod === 'CALL').length
  };

  const getStatusBadgeStyle = (status) => {
    switch (status) {
      case 'OPEN':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'ASSIGNED':
        return 'bg-indigo-100 text-indigo-800 border-indigo-200';
      case 'IN PROGRESS':
        return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'RESOLVED':
        return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'CUSTOMER CONFIRMED':
        return 'bg-teal-100 text-teal-800 border-teal-200';
      case 'CLOSED':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      case 'ON HOLD':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'ESCALATED':
        return 'bg-red-100 text-red-800 border-red-200 font-bold';
      case 'REJECTED':
        return 'bg-rose-100 text-rose-800 border-rose-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-5 right-5 z-50 bg-emerald-600 text-white px-5 py-3 rounded-lg shadow-xl flex items-center gap-2 text-sm font-semibold animate-bounce">
          <CheckCircle size={18} />
          {toastMessage}
        </div>
      )}

      {/* CUSTOMER CALLER OPTION: Prominent banner for Customers who can't file online */}
      {isCustomer && (
        <div className="bg-gradient-to-r from-blue-700 via-indigo-700 to-blue-900 text-white p-6 rounded-2xl shadow-lg flex flex-col md:flex-row justify-between items-center gap-6 border border-blue-500/30">
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-2xl bg-white/10 flex items-center justify-center shrink-0 border border-white/20 shadow-inner">
              <PhoneCall className="text-yellow-300 animate-pulse" size={28} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-extrabold bg-yellow-400 text-blue-950 uppercase tracking-wide">
                  24/7 Telephone Assistance
                </span>
                <span className="text-blue-200 text-xs">Can't file a complaint online?</span>
              </div>
              <h3 className="text-xl font-bold mt-1 text-white">Call Support Desk & Let Admin File for You</h3>
              <p className="text-sm text-blue-100 mt-1 max-w-xl leading-relaxed">
                If you are having network issues, app issues, or cannot fill out the complaint form, call our customer helpline directly. Our admin will take your call and register the complaint for you!
              </p>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
            <div className="text-center md:text-right hidden sm:block">
              <div className="text-[11px] text-blue-200 uppercase tracking-wider font-semibold">Toll-Free Helpline</div>
              <div className="text-lg font-mono font-bold text-yellow-300">1800-200-SMART</div>
            </div>
            <button
              onClick={() => {
                setCallPhone(user.phone || '');
                setShowCustomerCallModal(true);
              }}
              className="w-full sm:w-auto flex items-center justify-center gap-2 bg-yellow-400 hover:bg-yellow-300 text-blue-950 font-bold px-6 py-3.5 rounded-xl shadow-lg transition-transform active:scale-95 text-sm"
            >
              <PhoneCall size={18} />
              Call Support Now
            </button>
          </div>
        </div>
      )}

      {/* ADMIN INCOMING CALLS NOTIFICATION & WIDGET */}
      {isAdminOrAgent && (
        <div className="space-y-4">
          {incomingCalls.length > 0 && (
            <div className="bg-red-50 border-2 border-red-300 rounded-2xl p-5 shadow-md">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-red-600 flex items-center justify-center text-white shrink-0 animate-bounce">
                    <PhoneIncoming size={24} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-red-600 text-white animate-pulse">
                        LIVE CALL
                      </span>
                      <h3 className="text-lg font-bold text-red-950">
                        {incomingCalls.length} Incoming Customer Call{incomingCalls.length > 1 ? 's' : ''} Awaiting Answer
                      </h3>
                    </div>
                    <p className="text-xs text-red-700 mt-0.5">
                      Customers who cannot file online are calling for assistance. Take the call and file their complaint.
                    </p>
                  </div>
                </div>
                <Link
                  to="/calls"
                  className="text-xs font-bold text-red-700 hover:text-red-900 underline"
                >
                  View All Call Logs &rarr;
                </Link>
              </div>

              {/* Incoming Calls List */}
              <div className="mt-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {incomingCalls.slice(0, 3).map(call => (
                  <div key={call._id} className="bg-white p-4 rounded-xl border border-red-200 shadow-sm flex flex-col justify-between">
                    <div>
                      <div className="flex justify-between items-start">
                        <span className="font-bold text-gray-900 text-sm">{call.customerName}</span>
                        <span className="text-[11px] font-mono bg-red-50 text-red-700 px-2 py-0.5 rounded border border-red-100">
                          {call.customerPhone}
                        </span>
                      </div>
                      <p className="text-xs text-gray-600 mt-1 italic line-clamp-2">
                        "{call.reason}"
                      </p>
                      <span className="text-[11px] text-gray-400 mt-2 block">
                        Called at: {new Date(call.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <button
                      onClick={() => openAdminFileModal(call)}
                      className="mt-3 w-full bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold py-2 px-3 rounded-lg flex items-center justify-center gap-1.5 shadow transition-colors"
                    >
                      <PhoneCall size={14} /> Answer & File Complaint
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
        <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 flex flex-col items-center justify-center">
          <p className="text-gray-500 text-xs uppercase tracking-wider font-semibold">Total Complaints</p>
          <p className="text-3xl font-extrabold text-[#1E3A8A] mt-1">{stats.total}</p>
        </div>
        <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 flex flex-col items-center justify-center">
          <p className="text-gray-500 text-xs uppercase tracking-wider font-semibold">Open / Assigned</p>
          <p className="text-3xl font-extrabold text-blue-600 mt-1">{stats.open}</p>
        </div>
        <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 flex flex-col items-center justify-center">
          <p className="text-gray-500 text-xs uppercase tracking-wider font-semibold">In Progress</p>
          <p className="text-3xl font-extrabold text-amber-500 mt-1">{stats.inProgress}</p>
        </div>
        <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 flex flex-col items-center justify-center">
          <p className="text-gray-500 text-xs uppercase tracking-wider font-semibold">Resolved</p>
          <p className="text-3xl font-extrabold text-[#0F9D78] mt-1">{stats.resolved}</p>
        </div>
      </div>

      {/* Complaints Table Container */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {/* Table Top Toolbar */}
        <div className="p-6 border-b border-gray-100 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
          <div>
            <h3 className="text-lg font-bold text-[#172033]">
              {isAdminOrAgent ? 'All Registered Complaints & Status Management' : 'My Filed Complaints'}
            </h3>
            <p className="text-xs text-gray-500 mt-0.5">
              {isAdminOrAgent 
                ? 'Select any status from the dropdown to instantly update it. View channel (Register vs Call).'
                : 'Track complaints filed directly by you or via support helpline call.'}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Filter by filing method: ALL, VIA REGISTER, THROUGH CALL */}
            <div className="bg-gray-100 p-1 rounded-xl flex items-center text-xs font-semibold">
              <button
                onClick={() => setFilingFilter('ALL')}
                className={`px-3 py-1.5 rounded-lg transition-colors ${filingFilter === 'ALL' ? 'bg-white text-blue-700 shadow-sm' : 'text-gray-600 hover:text-gray-900'}`}
              >
                All ({stats.total})
              </button>
              <button
                onClick={() => setFilingFilter('REGISTER')}
                className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors ${filingFilter === 'REGISTER' ? 'bg-white text-blue-700 shadow-sm' : 'text-gray-600 hover:text-gray-900'}`}
              >
                <Laptop size={13} /> Via Register ({stats.viaRegister})
              </button>
              <button
                onClick={() => setFilingFilter('CALL')}
                className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors ${filingFilter === 'CALL' ? 'bg-white text-purple-700 shadow-sm' : 'text-gray-600 hover:text-gray-900'}`}
              >
                <Phone size={13} /> Through Call ({stats.viaCall})
              </button>
            </div>

            {/* Admin Action: File Complaint for Customer */}
            {isAdminOrAgent && (
              <button
                onClick={() => openAdminFileModal(null)}
                className="flex items-center gap-1.5 bg-[#2563EB] hover:bg-blue-700 text-white text-xs font-bold px-3.5 py-2 rounded-lg shadow-sm transition-colors"
              >
                <PhoneCall size={14} /> + File Complaint for Customer (Call)
              </button>
            )}

            {/* Customer Action: New Complaint */}
            {isCustomer && (
              <Link
                to="/complaints/create"
                className="flex items-center gap-1.5 bg-[#2563EB] hover:bg-blue-700 text-white text-xs font-bold px-3.5 py-2 rounded-lg shadow-sm transition-colors"
              >
                <Plus size={14} /> File New Complaint
              </Link>
            )}
          </div>
        </div>

        {/* Complaints Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b bg-gray-50/70 text-xs font-bold uppercase tracking-wider text-gray-500">
                <th className="p-4">Complaint ID</th>
                <th className="p-4">Subject</th>
                <th className="p-4">Customer</th>
                <th className="p-4">Filed Via (Channel)</th>
                <th className="p-4">Priority</th>
                <th className="p-4">
                  {isAdminOrAgent ? 'Status (Update via Dropdown)' : 'Status'}
                </th>
                <th className="p-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-sm">
              {filteredComplaints.map(c => (
                <tr key={c._id} className="hover:bg-blue-50/30 transition-colors">
                  <td className="p-4 font-mono font-medium text-gray-800 text-xs">
                    {c.complaintId}
                  </td>
                  <td className="p-4">
                    <div className="font-semibold text-gray-900 max-w-xs truncate" title={c.subject}>
                      {c.subject}
                    </div>
                    <span className="text-xs text-gray-400">{c.category}</span>
                  </td>
                  <td className="p-4">
                    <div className="font-medium text-gray-800 text-xs">{c.customer?.name || 'Customer'}</div>
                    <div className="text-[11px] text-gray-400">{c.customer?.email}</div>
                  </td>

                  {/* FILED VIA COLUMN: Customer can see either via register or through call */}
                  <td className="p-4">
                    {c.filingMethod === 'CALL' ? (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-purple-100 text-purple-800 border border-purple-200">
                        <Phone size={12} className="text-purple-600" />
                        Through Call
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                        <Laptop size={12} className="text-blue-500" />
                        Via Register
                      </span>
                    )}
                  </td>

                  <td className="p-4">
                    <span className={`px-2.5 py-0.5 inline-flex text-xs font-bold rounded-full ${
                      c.priority === 'CRITICAL' ? 'bg-red-100 text-red-800' :
                      c.priority === 'HIGH' ? 'bg-amber-100 text-amber-800' :
                      c.priority === 'MEDIUM' ? 'bg-blue-100 text-blue-800' :
                      'bg-green-100 text-green-800'
                    }`}>
                      {c.priority}
                    </span>
                  </td>

                  {/* STATUS COLUMN: Admin gets an interactive dropdown that updates immediately */}
                  <td className="p-4">
                    {isAdminOrAgent ? (
                      <div className="relative inline-block">
                        <select
                          value={c.status}
                          disabled={updatingId === c._id}
                          onChange={(e) => handleStatusChange(c._id, e.target.value)}
                          className={`text-xs font-bold rounded-lg px-3 py-1.5 border transition-all cursor-pointer shadow-sm focus:ring-2 focus:ring-blue-500 focus:outline-none ${getStatusBadgeStyle(c.status)}`}
                        >
                          <option value="OPEN">OPEN</option>
                          <option value="ASSIGNED">ASSIGNED</option>
                          <option value="IN PROGRESS">IN PROGRESS</option>
                          <option value="RESOLVED">RESOLVED</option>
                          <option value="CUSTOMER CONFIRMED">CUSTOMER CONFIRMED</option>
                          <option value="ON HOLD">ON HOLD</option>
                          <option value="CLOSED">CLOSED</option>
                          <option value="ESCALATED">ESCALATED</option>
                          <option value="REJECTED">REJECTED</option>
                        </select>
                        {updatingId === c._id && (
                          <span className="ml-2 text-xs text-blue-600 animate-spin">⏳</span>
                        )}
                      </div>
                    ) : (
                      <span className={`px-3 py-1 inline-flex text-xs font-semibold rounded-full border ${getStatusBadgeStyle(c.status)}`}>
                        {c.status}
                      </span>
                    )}
                  </td>

                  <td className="p-4 text-right">
                    <Link
                      to={`/complaints/${c._id}`}
                      className="text-[#2563EB] hover:text-blue-800 font-semibold text-xs hover:underline"
                    >
                      View Details &rarr;
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {filteredComplaints.length === 0 && (
            <div className="text-center p-12 text-gray-400">
              <AlertCircle size={32} className="mx-auto mb-2 opacity-30" />
              <p>No complaints found matching this filter.</p>
            </div>
          )}
        </div>
      </div>

      {/* CUSTOMER CALL MODAL */}
      {showCustomerCallModal && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden">
            {!callActive ? (
              <div className="p-6">
                <div className="flex justify-between items-start pb-4 border-b">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
                      <PhoneCall size={20} />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-gray-900">Customer Support Helpline</h3>
                      <p className="text-xs text-gray-500">Toll-Free Helpline: 1800-200-SMART</p>
                    </div>
                  </div>
                  <button onClick={() => setShowCustomerCallModal(false)} className="text-gray-400 hover:text-gray-600">
                    <X size={20} />
                  </button>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 mt-4 text-xs text-blue-800">
                  Can't file your complaint online? Submit a direct call request and our support desk admin will pick up the call and register the complaint for you!
                </div>

                <form onSubmit={handleStartCustomerCall} className="mt-4 space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Your Contact Phone</label>
                    <input
                      type="text"
                      required
                      className="w-full border p-2.5 rounded-lg text-sm focus:outline-blue-500"
                      value={callPhone}
                      onChange={e => setCallPhone(e.target.value)}
                      placeholder="e.g. +1 555-0199"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Category of Issue</label>
                    <select
                      className="w-full border p-2.5 rounded-lg text-sm bg-white focus:outline-blue-500"
                      value={callCategory}
                      onChange={e => setCallCategory(e.target.value)}
                    >
                      <option>Internet / Network</option>
                      <option>Account / Login</option>
                      <option>Payment / Refund</option>
                      <option>Product / Service</option>
                      <option>Hardware / Equipment</option>
                      <option>Other / General</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Briefly State Your Problem</label>
                    <textarea
                      required
                      rows={3}
                      className="w-full border p-2.5 rounded-lg text-sm focus:outline-blue-500"
                      value={callReason}
                      onChange={e => setCallReason(e.target.value)}
                      placeholder="e.g. My internet is completely down and the website form was not submitting..."
                    ></textarea>
                  </div>

                  <div className="flex justify-end gap-3 pt-3 border-t">
                    <button
                      type="button"
                      onClick={() => setShowCustomerCallModal(false)}
                      className="px-4 py-2 border rounded-lg text-sm font-semibold hover:bg-gray-50"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={callingStateLoading}
                      className="px-5 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-bold flex items-center gap-2 shadow-md transition-colors"
                    >
                      <PhoneCall size={16} />
                      {callingStateLoading ? 'Connecting...' : 'Dial Helpline Now'}
                    </button>
                  </div>
                </form>
              </div>
            ) : (
              // Active Call State
              <div className="p-8 text-center bg-gradient-to-b from-blue-900 to-indigo-950 text-white">
                <div className="w-20 h-20 mx-auto rounded-full bg-green-500/20 border-4 border-green-400 flex items-center justify-center animate-pulse mb-4">
                  <PhoneCall size={36} className="text-green-400" />
                </div>

                <div className="inline-block px-3 py-1 rounded-full text-xs font-bold bg-green-500/20 text-green-300 border border-green-500/30 mb-2">
                  🟢 Call Connected to SmartServe Desk
                </div>

                <h3 className="text-2xl font-bold">In Call with Support Admin</h3>
                <p className="font-mono text-xl text-yellow-300 mt-1">
                  Duration: {Math.floor(callTimer / 60).toString().padStart(2, '0')}:{(callTimer % 60).toString().padStart(2, '0')}
                </p>

                <p className="text-sm text-blue-200 mt-4 max-w-sm mx-auto leading-relaxed">
                  The admin is attending to your call and entering your complaint into the system. Please stay on the line...
                </p>

                {resolvedComplaintFromCall && (
                  <div className="bg-emerald-900/80 border border-emerald-400 rounded-xl p-4 mt-6 text-left">
                    <div className="flex items-center gap-2 text-emerald-300 font-bold text-sm">
                      <CheckCircle size={18} />
                      Complaint Registered by Admin!
                    </div>
                    <div className="text-xs text-emerald-100 mt-1 font-mono">
                      ID: <span className="font-bold text-white">{resolvedComplaintFromCall.complaintId}</span>
                    </div>
                    <div className="text-xs text-emerald-200 mt-1">
                      Subject: {resolvedComplaintFromCall.subject}
                    </div>
                    <div className="text-xs text-yellow-300 mt-2 font-semibold">
                      This complaint has been logged under "Through Call" on your dashboard.
                    </div>
                  </div>
                )}

                <div className="mt-8">
                  <button
                    onClick={handleEndCustomerCall}
                    className="bg-red-600 hover:bg-red-700 text-white font-bold px-8 py-3 rounded-full shadow-lg transition-transform active:scale-95 text-sm"
                  >
                    End Call
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ADMIN FILE COMPLAINT MODAL (Answers Call & Files on Behalf of Customer) */}
      {showAdminFileModal && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-xl w-full p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-start pb-4 border-b">
              <div>
                <h3 className="text-xl font-bold text-gray-900">
                  {selectedCallToAnswer ? 'Answer Call & File Complaint' : 'File Complaint for Customer (Phone Call)'}
                </h3>
                <span className="inline-block mt-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-100 text-purple-800 border border-purple-200">
                  📞 Filing Method: Through Call
                </span>
              </div>
              <button onClick={() => setShowAdminFileModal(false)} className="text-gray-400 hover:text-gray-600">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleAdminFileComplaintSubmit} className="mt-4 space-y-4">
              {!selectedCallToAnswer && (
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Select Customer</label>
                  <select
                    className="w-full border p-2.5 rounded-lg text-sm bg-white focus:outline-blue-500"
                    value={adminFormData.customerId}
                    onChange={(e) => handleAdminCustomerSelect(e.target.value)}
                    required
                  >
                    <option value="">-- Choose Customer --</option>
                    {customers.map(cust => (
                      <option key={cust._id} value={cust._id}>
                        {cust.name} ({cust.email}) - {cust.phone || 'No phone'}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Customer Name</label>
                  <input
                    type="text"
                    required
                    readOnly={!!selectedCallToAnswer}
                    className={`w-full border p-2 rounded text-sm ${selectedCallToAnswer ? 'bg-gray-50' : ''}`}
                    value={adminFormData.customerName}
                    onChange={e => setAdminFormData({ ...adminFormData, customerName: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Caller Phone</label>
                  <input
                    type="text"
                    required
                    className="w-full border p-2 rounded text-sm"
                    value={adminFormData.customerPhone}
                    onChange={e => setAdminFormData({ ...adminFormData, customerPhone: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Subject</label>
                <input
                  type="text"
                  required
                  className="w-full border p-2 rounded text-sm focus:outline-blue-500"
                  value={adminFormData.subject}
                  onChange={e => setAdminFormData({ ...adminFormData, subject: e.target.value })}
                  placeholder="Summary of customer issue..."
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Category</label>
                  <select
                    className="w-full border p-2 rounded text-sm bg-white focus:outline-blue-500"
                    value={adminFormData.category}
                    onChange={e => setAdminFormData({ ...adminFormData, category: e.target.value })}
                  >
                    <option>Internet / Network</option>
                    <option>Account / Login</option>
                    <option>Payment / Refund</option>
                    <option>Product / Service</option>
                    <option>Hardware / Equipment</option>
                    <option>Other / General</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Priority</label>
                  <select
                    className="w-full border p-2 rounded text-sm bg-white focus:outline-blue-500"
                    value={adminFormData.priority}
                    onChange={e => setAdminFormData({ ...adminFormData, priority: e.target.value })}
                  >
                    <option value="LOW">LOW</option>
                    <option value="MEDIUM">MEDIUM</option>
                    <option value="HIGH">HIGH</option>
                    <option value="CRITICAL">CRITICAL</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Description (From Caller)</label>
                <textarea
                  required
                  rows={4}
                  className="w-full border p-2 rounded text-sm focus:outline-blue-500"
                  value={adminFormData.description}
                  onChange={e => setAdminFormData({ ...adminFormData, description: e.target.value })}
                  placeholder="Enter details customer provided during phone conversation..."
                ></textarea>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t">
                <button
                  type="button"
                  onClick={() => setShowAdminFileModal(false)}
                  className="px-4 py-2 border rounded text-sm font-semibold hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={adminSubmitting}
                  className="px-5 py-2.5 bg-[#2563EB] hover:bg-blue-700 text-white rounded text-sm font-bold shadow transition-colors disabled:bg-gray-400"
                >
                  {adminSubmitting ? 'Registering Complaint...' : 'Register Complaint on Customer Behalf'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}