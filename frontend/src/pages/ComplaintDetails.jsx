import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import { Phone, Laptop, Clock, CheckCircle, AlertTriangle, ShieldCheck, User } from 'lucide-react';
import { API_BASE } from '../utils/api';

export default function ComplaintDetails() {
  const { id } = useParams();
  const [complaint, setComplaint] = useState(null);
  const user = JSON.parse(localStorage.getItem('user'));

  const fetchComplaint = async () => {
    try {
      const res = await axios.get(`${API_BASE}/complaints/${id}`, {
        headers: { Authorization: `Bearer ${user.token}` }
      });
      setComplaint(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchComplaint();
  }, [id, user?.token]);

  const [statusInput, setStatusInput] = useState('');
  const [notes, setNotes] = useState('');
  const [updateMsg, setUpdateMsg] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    if (complaint) setStatusInput(complaint.status);
  }, [complaint]);

  const handleUpdate = async (e) => {
    e.preventDefault();
    setIsUpdating(true);
    try {
      const res = await axios.put(`${API_BASE}/complaints/${id}/status`, 
        { status: statusInput, notes },
        { headers: { Authorization: `Bearer ${user.token}` } }
      );
      setComplaint(res.data);
      setNotes('');
      setUpdateMsg('Status updated successfully!');
      setTimeout(() => setUpdateMsg(''), 4000);
    } catch (err) {
      alert(err.response?.data?.message || 'Error updating status');
    } finally {
      setIsUpdating(false);
    }
  };

  if (!complaint) return <div className="p-8 text-center text-gray-500">Loading complaint details...</div>;

  const canUpdate = user.role === 'ADMIN' || user.role === 'SUPPORT_AGENT' || user.role === 'MANAGER';

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <Link to="/dashboard" className="text-blue-600 mb-2 inline-flex items-center gap-1 hover:underline font-semibold text-sm">
        &larr; Back to Dashboard
      </Link>
      
      <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-100">
        {/* Header Details */}
        <div className="flex flex-col md:flex-row justify-between items-start gap-4 pb-6 border-b border-gray-100">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="font-mono bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-xs font-bold border border-blue-200">
                {complaint.complaintId}
              </span>
              <span className="text-xs bg-gray-100 text-gray-600 px-2.5 py-0.5 rounded-full font-medium">
                {complaint.category}
              </span>
            </div>
            <h2 className="text-2xl md:text-3xl font-extrabold text-[#172033]">{complaint.subject}</h2>
            <p className="text-xs text-gray-400 mt-1">
              Registered on: {new Date(complaint.createdAt).toLocaleString()}
            </p>
          </div>

          <div className="flex flex-col items-end gap-2">
            <span className={`px-3 py-1 rounded-full text-xs font-extrabold ${
              complaint.priority === 'CRITICAL' ? 'bg-red-100 text-red-800 border border-red-200' :
              complaint.priority === 'HIGH' ? 'bg-amber-100 text-amber-800 border border-amber-200' :
              complaint.priority === 'MEDIUM' ? 'bg-blue-100 text-blue-800 border border-blue-200' :
              'bg-green-100 text-green-800 border border-green-200'
            }`}>
              PRIORITY: {complaint.priority}
            </span>
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-500">Current Status:</span>
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-800 border border-blue-200">
                {complaint.status}
              </span>
            </div>
          </div>
        </div>

        {/* FILING METHOD / CHANNEL BANNER */}
        <div className="my-6 p-4 rounded-xl border flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-gray-50/70 border-gray-200">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
              complaint.filingMethod === 'CALL' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'
            }`}>
              {complaint.filingMethod === 'CALL' ? <Phone size={20} /> : <Laptop size={20} />}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Filing Channel:</span>
                <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                  complaint.filingMethod === 'CALL'
                    ? 'bg-purple-100 text-purple-800 border border-purple-200'
                    : 'bg-blue-100 text-blue-800 border border-blue-200'
                }`}>
                  {complaint.filingMethod === 'CALL' ? '📞 Through Call (Customer Telephone Service)' : '💻 Via Register (Online Portal)'}
                </span>
              </div>
              <p className="text-xs text-gray-600 mt-0.5">
                {complaint.filingMethod === 'CALL'
                  ? `Complaint was logged by support desk on behalf of customer. ${complaint.callerPhone ? `Caller Phone: ${complaint.callerPhone}` : ''}`
                  : 'Complaint was registered online directly by customer.'}
              </p>
            </div>
          </div>

          {complaint.filedBy && (
            <div className="text-xs text-gray-500 bg-white px-3 py-1.5 rounded-lg border border-gray-200">
              Assisted by: <span className="font-semibold text-gray-800">{complaint.filedBy.name}</span>
            </div>
          )}
        </div>

        {/* Info Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
            <h3 className="font-bold text-gray-500 uppercase text-xs tracking-wider mb-2 flex items-center gap-1.5">
              <User size={14} /> Customer Information
            </h3>
            <p className="font-bold text-gray-900 text-sm">{complaint.customer?.name || 'Customer'}</p>
            <p className="text-xs text-gray-600">{complaint.customer?.email}</p>
            {complaint.callerPhone && (
              <p className="text-xs text-gray-500 mt-1 font-mono">Phone: {complaint.callerPhone}</p>
            )}
          </div>

          <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
            <h3 className="font-bold text-gray-500 uppercase text-xs tracking-wider mb-2 flex items-center gap-1.5">
              <ShieldCheck size={14} /> Assigned Staff
            </h3>
            <p className="font-bold text-gray-900 text-sm">
              {complaint.assignedAgent?.name || 'Unassigned / Automatic Queue'}
            </p>
            <p className="text-xs text-gray-500">Department: {complaint.category}</p>
          </div>

          <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
            <h3 className="font-bold text-gray-500 uppercase text-xs tracking-wider mb-2 flex items-center gap-1.5">
              <Clock size={14} /> SLA Lifecycle
            </h3>
            <p className={`font-bold text-sm ${
              complaint.slaStatus === 'WARNING' || complaint.slaStatus === 'BREACHED'
                ? 'text-red-600'
                : 'text-green-600'
            }`}>
              {complaint.slaStatus}
            </p>
            <p className="text-xs text-gray-500 mt-0.5">
              Deadline: {complaint.resolutionDeadline ? new Date(complaint.resolutionDeadline).toLocaleString() : 'N/A'}
            </p>
          </div>
        </div>

        {/* Description */}
        <div className="mb-8">
          <h3 className="font-bold text-gray-700 mb-2 uppercase text-xs tracking-wider">Detailed Description</h3>
          <p className="bg-gray-50 p-5 rounded-xl border border-gray-100 whitespace-pre-wrap text-[#172033] leading-relaxed text-sm">
            {complaint.description}
          </p>
        </div>
        
        {/* Resolution Notes */}
        {complaint.resolutionDetails && (
          <div className="mb-8">
            <h3 className="font-bold text-emerald-800 mb-2 uppercase text-xs tracking-wider flex items-center gap-1.5">
              <CheckCircle size={14} /> Resolution Details
            </h3>
            <div className="bg-emerald-50 p-5 rounded-xl border border-emerald-200 text-emerald-950 text-sm leading-relaxed whitespace-pre-wrap">
              {complaint.resolutionDetails}
            </div>
          </div>
        )}

        {/* Admin/Agent Status Update Panel */}
        {canUpdate && (
          <div className="mt-8 pt-6 border-t border-gray-200">
            <h3 className="font-bold text-[#172033] mb-4 text-base">Update Complaint Status</h3>
            <form onSubmit={handleUpdate} className="bg-blue-50/50 p-5 rounded-xl border border-blue-200">
              {updateMsg && (
                <div className="mb-4 text-emerald-700 bg-emerald-50 border border-emerald-200 px-4 py-2.5 rounded-lg font-semibold text-sm flex items-center gap-2">
                  <CheckCircle size={16} />
                  {updateMsg}
                </div>
              )}
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Select Status</label>
                  <select 
                    className="w-full border border-gray-300 p-2.5 rounded-lg text-sm bg-white focus:outline-blue-500 font-semibold"
                    value={statusInput}
                    onChange={(e) => setStatusInput(e.target.value)}
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
                </div>
              </div>

              <div className="mb-4">
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                  Status Notes / Resolution Summary (Optional)
                </label>
                <textarea 
                  className="w-full border border-gray-300 p-2.5 rounded-lg h-24 text-sm focus:outline-blue-500 bg-white" 
                  value={notes} 
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Enter any updates, action taken, or resolution notes for customer..."
                ></textarea>
              </div>

              <button 
                type="submit" 
                disabled={isUpdating}
                className="bg-[#2563EB] hover:bg-blue-700 text-white font-bold px-5 py-2.5 rounded-lg transition-colors text-sm shadow disabled:bg-gray-400"
              >
                {isUpdating ? 'Saving...' : 'Save Status Update'}
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
