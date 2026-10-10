import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Phone, PhoneIncoming, PhoneCall, CheckCircle, Clock, AlertTriangle, Plus, X, User } from 'lucide-react';
import { API_BASE } from '../utils/api';

export default function Calls() {
  const [calls, setCalls] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('ALL');
  const [selectedCall, setSelectedCall] = useState(null);
  const [customers, setCustomers] = useState([]);
  const [showFileModal, setShowFileModal] = useState(false);
  const [modalCall, setModalCall] = useState(null);

  // Form states for filing complaint
  const [formData, setFormData] = useState({
    customerId: '',
    customerName: '',
    customerPhone: '',
    customerEmail: '',
    subject: '',
    description: '',
    category: 'Internet / Network',
    priority: 'MEDIUM',
    notes: ''
  });
  const [submitting, setSubmitting] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState('');

  const user = JSON.parse(localStorage.getItem('user'));
  const navigate = useNavigate();

  const fetchCalls = async () => {
    try {
      const res = await axios.get(`${API_BASE}/calls`, {
        headers: { Authorization: `Bearer ${user.token}` }
      });
      setCalls(res.data);
    } catch (err) {
      console.error('Error fetching calls', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchCustomers = async () => {
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
    if (!user) return navigate('/login');
    if (user.role === 'CUSTOMER') return navigate('/dashboard');

    fetchCalls();
    fetchCustomers();

    const interval = setInterval(fetchCalls, 5000);
    return () => clearInterval(interval);
  }, [user, navigate]);

  const openFileModal = (call = null) => {
    setModalCall(call);
    if (call) {
      setFormData({
        customerId: call.customer?._id || '',
        customerName: call.customerName || call.customer?.name || '',
        customerPhone: call.customerPhone || call.customer?.phone || '',
        customerEmail: call.customerEmail || call.customer?.email || '',
        subject: `[Call] ${call.reason || 'Customer Issue'}`,
        description: `Customer called regarding: ${call.reason || ''}\nPhone: ${call.customerPhone}`,
        category: call.category || 'Internet / Network',
        priority: call.priority || 'MEDIUM',
        notes: ''
      });
    } else {
      setFormData({
        customerId: customers[0]?._id || '',
        customerName: customers[0]?.name || '',
        customerPhone: customers[0]?.phone || '',
        customerEmail: customers[0]?.email || '',
        subject: '',
        description: '',
        category: 'Internet / Network',
        priority: 'MEDIUM',
        notes: ''
      });
    }
    setShowFileModal(true);
  };

  const handleCustomerSelect = (custId) => {
    const cust = customers.find(c => c._id === custId);
    if (cust) {
      setFormData(prev => ({
        ...prev,
        customerId: cust._id,
        customerName: cust.name,
        customerPhone: cust.phone || '',
        customerEmail: cust.email || ''
      }));
    }
  };

  const handleStatusUpdate = async (callId, newStatus) => {
    try {
      await axios.put(`${API_BASE}/calls/${callId}/status`, { status: newStatus }, {
        headers: { Authorization: `Bearer ${user.token}` }
      });
      fetchCalls();
    } catch (err) {
      alert('Error updating call status');
    }
  };

  const handleFileComplaintSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (modalCall) {
        // File directly for existing call
        await axios.post(`${API_BASE}/calls/${modalCall._id}/file-complaint`, {
          subject: formData.subject,
          description: formData.description,
          category: formData.category,
          priorityOverride: formData.priority,
          callNotes: formData.notes
        }, {
          headers: { Authorization: `Bearer ${user.token}` }
        });
      } else {
        // Create complaint with filingMethod = CALL
        await axios.post(`${API_BASE}/complaints`, {
          customerId: formData.customerId,
          subject: formData.subject,
          description: formData.description,
          category: formData.category,
          priorityOverride: formData.priority,
          filingMethod: 'CALL',
          callerPhone: formData.customerPhone
        }, {
          headers: { Authorization: `Bearer ${user.token}` }
        });
      }

      setFeedbackMsg('Complaint successfully registered through call!');
      setTimeout(() => {
        setFeedbackMsg('');
        setShowFileModal(false);
      }, 1500);
      fetchCalls();
    } catch (err) {
      alert(err.response?.data?.message || 'Error filing complaint for call');
    } finally {
      setSubmitting(false);
    }
  };

  const filteredCalls = calls.filter(c => {
    if (activeTab === 'ALL') return true;
    return c.status === activeTab;
  });

  const incomingCount = calls.filter(c => c.status === 'INCOMING').length;

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-lg shadow-sm border border-gray-100">
        <div>
          <div className="flex items-center gap-2">
            <PhoneIncoming className="text-blue-600" size={26} />
            <h1 className="text-2xl font-bold text-gray-800">Customer Helpline & Incoming Calls</h1>
          </div>
          <p className="text-sm text-gray-500 mt-1">
            Manage incoming phone assistance requests and file complaints on behalf of customers who cannot file online.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => openFileModal(null)}
            className="flex items-center gap-2 bg-[#2563EB] hover:bg-blue-700 text-white font-medium px-4 py-2.5 rounded-lg shadow-sm transition-colors text-sm"
          >
            <Plus size={18} /> Log & File Phone Complaint
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-gray-200 pb-2">
        <button
          onClick={() => setActiveTab('ALL')}
          className={`px-4 py-2 text-sm font-semibold rounded-lg transition-colors ${activeTab === 'ALL' ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-100'}`}
        >
          All Calls ({calls.length})
        </button>
        <button
          onClick={() => setActiveTab('INCOMING')}
          className={`px-4 py-2 text-sm font-semibold rounded-lg flex items-center gap-2 transition-colors ${activeTab === 'INCOMING' ? 'bg-red-600 text-white' : 'text-gray-600 hover:bg-gray-100'}`}
        >
          {incomingCount > 0 && <span className="w-2 h-2 rounded-full bg-white animate-ping"></span>}
          Incoming Calls ({incomingCount})
        </button>
        <button
          onClick={() => setActiveTab('COMPLETED')}
          className={`px-4 py-2 text-sm font-semibold rounded-lg transition-colors ${activeTab === 'COMPLETED' ? 'bg-green-600 text-white' : 'text-gray-600 hover:bg-gray-100'}`}
        >
          Filed / Completed ({calls.filter(c => c.status === 'COMPLETED').length})
        </button>
      </div>

      {/* Calls Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b bg-gray-50 text-xs uppercase tracking-wider text-gray-500">
                <th className="p-4">Customer</th>
                <th className="p-4">Contact</th>
                <th className="p-4">Reason / Issue</th>
                <th className="p-4">Call Time</th>
                <th className="p-4">Call Status</th>
                <th className="p-4">Linked Complaint</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-sm">
              {filteredCalls.map(c => (
                <tr key={c._id} className="hover:bg-gray-50 transition-colors">
                  <td className="p-4">
                    <div className="font-semibold text-gray-900">{c.customerName || c.customer?.name || 'Guest Caller'}</div>
                    <div className="text-xs text-gray-500">{c.customerEmail || c.customer?.email}</div>
                  </td>
                  <td className="p-4 font-mono text-gray-700">
                    <span className="flex items-center gap-1.5">
                      <Phone size={14} className="text-gray-400" />
                      {c.customerPhone}
                    </span>
                  </td>
                  <td className="p-4 max-w-xs">
                    <div className="font-medium text-gray-800 truncate" title={c.reason}>{c.reason}</div>
                    <span className="text-xs px-2 py-0.5 bg-gray-100 text-gray-600 rounded mt-1 inline-block">
                      {c.category}
                    </span>
                  </td>
                  <td className="p-4 text-xs text-gray-500 whitespace-nowrap">
                    {new Date(c.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}, {new Date(c.createdAt).toLocaleDateString()}
                  </td>
                  <td className="p-4">
                    {c.status === 'INCOMING' && (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-red-100 text-red-800 border border-red-200 animate-pulse">
                        <PhoneIncoming size={12} /> Incoming Call
                      </span>
                    )}
                    {c.status === 'ANSWERED' && (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 border border-amber-200">
                        <PhoneCall size={12} /> Answered
                      </span>
                    )}
                    {c.status === 'COMPLETED' && (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-800 border border-green-200">
                        <CheckCircle size={12} /> Complaint Filed
                      </span>
                    )}
                    {c.status === 'MISSED' && (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-600 border border-gray-200">
                        Missed Call
                      </span>
                    )}
                  </td>
                  <td className="p-4">
                    {c.complaint ? (
                      <Link
                        to={`/complaints/${c.complaint._id || c.complaint}`}
                        className="font-mono text-xs font-bold text-blue-600 hover:underline bg-blue-50 px-2.5 py-1 rounded border border-blue-200 inline-block"
                      >
                        {c.complaint.complaintId || 'View CMP'} &rarr;
                      </Link>
                    ) : (
                      <span className="text-xs text-gray-400 italic">None</span>
                    )}
                  </td>
                  <td className="p-4 text-right whitespace-nowrap">
                    {c.status === 'INCOMING' ? (
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => openFileModal(c)}
                          className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold px-3 py-1.5 rounded shadow-sm transition-colors"
                        >
                          Answer & File Complaint
                        </button>
                        <button
                          onClick={() => handleStatusUpdate(c._id, 'MISSED')}
                          className="text-gray-400 hover:text-gray-600 text-xs px-2 py-1"
                        >
                          Dismiss
                        </button>
                      </div>
                    ) : c.status !== 'COMPLETED' ? (
                      <button
                        onClick={() => openFileModal(c)}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-3 py-1.5 rounded shadow-sm transition-colors"
                      >
                        File Complaint
                      </button>
                    ) : (
                      <span className="text-xs text-gray-400">Handled by {c.handledBy?.name || 'Staff'}</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {filteredCalls.length === 0 && (
            <div className="text-center p-12 text-gray-400">
              <PhoneIncoming size={36} className="mx-auto mb-2 opacity-30" />
              <p>No calls found under this filter.</p>
            </div>
          )}
        </div>
      </div>

      {/* Modal: File Complaint for Customer */}
      {showFileModal && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-xl w-full p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center pb-4 border-b">
              <div>
                <h3 className="text-xl font-bold text-gray-800">
                  {modalCall ? 'File Complaint for Incoming Call' : 'Log Phone Call & File Complaint'}
                </h3>
                <span className="inline-block mt-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-100 text-purple-800 border border-purple-200">
                  📞 Filing Method: Through Call
                </span>
              </div>
              <button onClick={() => setShowFileModal(false)} className="text-gray-400 hover:text-gray-600">
                <X size={20} />
              </button>
            </div>

            {feedbackMsg && (
              <div className="mt-4 p-3 bg-green-100 border border-green-300 text-green-800 rounded text-sm font-medium">
                {feedbackMsg}
              </div>
            )}

            <form onSubmit={handleFileComplaintSubmit} className="mt-4 space-y-4">
              {!modalCall && (
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Select Customer</label>
                  <select
                    className="w-full border p-2 rounded text-sm focus:outline-blue-500 bg-white"
                    value={formData.customerId}
                    onChange={(e) => handleCustomerSelect(e.target.value)}
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
                    readOnly={!!modalCall}
                    className={`w-full border p-2 rounded text-sm ${modalCall ? 'bg-gray-50' : ''}`}
                    value={formData.customerName}
                    onChange={e => setFormData({ ...formData, customerName: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Caller Phone</label>
                  <input
                    type="text"
                    required
                    className="w-full border p-2 rounded text-sm"
                    value={formData.customerPhone}
                    onChange={e => setFormData({ ...formData, customerPhone: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Complaint Subject</label>
                <input
                  type="text"
                  required
                  className="w-full border p-2 rounded text-sm focus:outline-blue-500"
                  value={formData.subject}
                  onChange={e => setFormData({ ...formData, subject: e.target.value })}
                  placeholder="Summary of issue stated by caller..."
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Category</label>
                  <select
                    className="w-full border p-2 rounded text-sm bg-white focus:outline-blue-500"
                    value={formData.category}
                    onChange={e => setFormData({ ...formData, category: e.target.value })}
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
                    value={formData.priority}
                    onChange={e => setFormData({ ...formData, priority: e.target.value })}
                  >
                    <option value="LOW">LOW</option>
                    <option value="MEDIUM">MEDIUM</option>
                    <option value="HIGH">HIGH</option>
                    <option value="CRITICAL">CRITICAL</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Detailed Description (from caller)</label>
                <textarea
                  required
                  rows={4}
                  className="w-full border p-2 rounded text-sm focus:outline-blue-500"
                  value={formData.description}
                  onChange={e => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Enter complete details given by customer during phone call..."
                ></textarea>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t">
                <button
                  type="button"
                  onClick={() => setShowFileModal(false)}
                  className="px-4 py-2 border rounded text-sm font-medium hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 bg-[#2563EB] hover:bg-blue-700 text-white rounded text-sm font-bold shadow transition-colors disabled:bg-gray-400"
                >
                  {submitting ? 'Registering Complaint...' : 'Register Complaint on Customer Behalf'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
