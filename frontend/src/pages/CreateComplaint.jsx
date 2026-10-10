import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { PhoneCall, CheckCircle, X, Laptop } from 'lucide-react';
import { API_BASE } from '../utils/api';

export default function CreateComplaint() {
  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('Internet / Network');
  const [priority, setPriority] = useState('LOW');
  const [submitting, setSubmitting] = useState(false);

  // Call Support Modal states
  const [showCallModal, setShowCallModal] = useState(false);
  const [callPhone, setCallPhone] = useState('');
  const [callReason, setCallReason] = useState('');
  const [callCategory, setCallCategory] = useState('Internet / Network');
  const [callActive, setCallActive] = useState(false);
  const [callTimer, setCallTimer] = useState(0);
  const [activeCallId, setActiveCallId] = useState(null);
  const [resolvedComplaint, setResolvedComplaint] = useState(null);
  const [callingLoading, setCallingLoading] = useState(false);

  const user = JSON.parse(localStorage.getItem('user'));
  const navigate = useNavigate();

  useEffect(() => {
    if (user?.phone) setCallPhone(user.phone);
  }, [user]);

  useEffect(() => {
    let timer;
    if (callActive) {
      timer = setInterval(() => setCallTimer(prev => prev + 1), 1000);
    } else {
      setCallTimer(0);
    }
    return () => clearInterval(timer);
  }, [callActive]);

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
            setResolvedComplaint(matching.complaint);
          }
        } catch (e) {
          // silent
        }
      }, 3000);
    }
    return () => clearInterval(pollTimer);
  }, [callActive, activeCallId, user?.token]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await axios.post(`${API_BASE}/complaints`, 
        { subject, description, category, priority, filingMethod: 'REGISTER' },
        { headers: { Authorization: `Bearer ${user.token}` } }
      );
      navigate('/dashboard');
    } catch (error) {
      alert('Error creating complaint');
    } finally {
      setSubmitting(false);
    }
  };

  const handleStartCall = async (e) => {
    e.preventDefault();
    setCallingLoading(true);
    try {
      const res = await axios.post(`${API_BASE}/calls`, {
        customerName: user.name,
        customerPhone: callPhone || user.phone || '9876543210',
        customerEmail: user.email,
        reason: callReason || 'Cannot file online from portal',
        category: callCategory
      }, {
        headers: { Authorization: `Bearer ${user.token}` }
      });
      setActiveCallId(res.data._id);
      setCallActive(true);
      setResolvedComplaint(null);
    } catch (err) {
      alert(err.response?.data?.message || 'Error connecting to support helpline');
    } finally {
      setCallingLoading(false);
    }
  };

  const handleEndCall = () => {
    setCallActive(false);
    setActiveCallId(null);
    setShowCallModal(false);
    if (resolvedComplaint) {
      navigate('/dashboard');
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* CALLER OPTION HELPER BANNER */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 p-4 rounded-xl flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 shrink-0">
            <PhoneCall size={20} />
          </div>
          <div>
            <h4 className="text-sm font-bold text-gray-900">Can't file your complaint online?</h4>
            <p className="text-xs text-gray-600">
              Call Helpline <strong className="text-blue-700">1800-200-SMART</strong> and our admin will file it for you.
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => setShowCallModal(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold px-4 py-2 rounded-lg shadow-sm shrink-0 transition-colors"
        >
          📞 Call Support
        </button>
      </div>

      <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-100">
        <div className="flex justify-between items-center mb-6 pb-3 border-b">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">File New Complaint</h2>
            <p className="text-xs text-gray-500 mt-0.5">Submit an online ticket directly via portal register</p>
          </div>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
            <Laptop size={12} /> Filing: Via Register
          </span>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Subject</label>
            <input 
              required 
              className="w-full border p-2.5 rounded-lg text-sm focus:outline-blue-500" 
              value={subject} 
              onChange={e => setSubject(e.target.value)} 
              placeholder="Brief summary of the issue..."
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Category</label>
              <select 
                className="w-full border p-2.5 rounded-lg text-sm bg-white focus:outline-blue-500" 
                value={category} 
                onChange={e => setCategory(e.target.value)}
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
                className="w-full border p-2.5 rounded-lg text-sm bg-white focus:outline-blue-500" 
                value={priority} 
                onChange={e => setPriority(e.target.value)}
              >
                <option value="LOW">LOW</option>
                <option value="MEDIUM">MEDIUM</option>
                <option value="HIGH">HIGH</option>
                <option value="CRITICAL">CRITICAL</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Description</label>
            <textarea 
              required 
              rows={4}
              className="w-full border p-2.5 rounded-lg text-sm focus:outline-blue-500" 
              value={description} 
              onChange={e => setDescription(e.target.value)}
              placeholder="Please provide complete details regarding your problem..."
            ></textarea>
          </div>

          <div className="flex gap-4 pt-3 border-t">
            <button 
              type="submit" 
              disabled={submitting}
              className="bg-[#2563EB] text-white px-5 py-2.5 rounded-lg font-bold text-sm hover:bg-blue-700 shadow transition-colors disabled:bg-gray-400"
            >
              {submitting ? 'Submitting...' : 'Submit Complaint (Via Register)'}
            </button>
            <Link to="/dashboard" className="bg-gray-100 px-5 py-2.5 rounded-lg font-semibold text-sm text-gray-700 hover:bg-gray-200">
              Cancel
            </Link>
          </div>
        </form>
      </div>

      {/* CALL SUPPORT MODAL */}
      {showCallModal && (
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
                      <h3 className="text-lg font-bold text-gray-900">Direct Helpline Connection</h3>
                      <p className="text-xs text-gray-500">Toll-Free Support: 1800-200-SMART</p>
                    </div>
                  </div>
                  <button onClick={() => setShowCallModal(false)} className="text-gray-400 hover:text-gray-600">
                    <X size={20} />
                  </button>
                </div>

                <p className="text-xs text-gray-600 my-4 bg-blue-50 p-3 rounded-lg border border-blue-200">
                  Can't fill the online form? Request an immediate phone call. An admin will answer and register your complaint on your behalf!
                </p>

                <form onSubmit={handleStartCall} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Your Contact Phone</label>
                    <input
                      type="text"
                      required
                      className="w-full border p-2.5 rounded-lg text-sm"
                      value={callPhone}
                      onChange={e => setCallPhone(e.target.value)}
                      placeholder="e.g. +1 555-0199"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Category</label>
                    <select
                      className="w-full border p-2.5 rounded-lg text-sm bg-white"
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
                    <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Problem Summary</label>
                    <textarea
                      required
                      rows={3}
                      className="w-full border p-2.5 rounded-lg text-sm"
                      value={callReason}
                      onChange={e => setCallReason(e.target.value)}
                      placeholder="State what you need help with..."
                    ></textarea>
                  </div>

                  <div className="flex justify-end gap-3 pt-3 border-t">
                    <button
                      type="button"
                      onClick={() => setShowCallModal(false)}
                      className="px-4 py-2 border rounded-lg text-sm font-semibold hover:bg-gray-50"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={callingLoading}
                      className="px-5 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-bold flex items-center gap-2 shadow"
                    >
                      <PhoneCall size={16} />
                      {callingLoading ? 'Connecting...' : 'Dial Helpline Now'}
                    </button>
                  </div>
                </form>
              </div>
            ) : (
              <div className="p-8 text-center bg-gradient-to-b from-blue-900 to-indigo-950 text-white">
                <div className="w-20 h-20 mx-auto rounded-full bg-green-500/20 border-4 border-green-400 flex items-center justify-center animate-pulse mb-4">
                  <PhoneCall size={36} className="text-green-400" />
                </div>

                <div className="inline-block px-3 py-1 rounded-full text-xs font-bold bg-green-500/20 text-green-300 border border-green-500/30 mb-2">
                  🟢 Call Connected to Support Admin
                </div>

                <h3 className="text-2xl font-bold">In Call with Support Desk</h3>
                <p className="font-mono text-xl text-yellow-300 mt-1">
                  Duration: {Math.floor(callTimer / 60).toString().padStart(2, '0')}:{(callTimer % 60).toString().padStart(2, '0')}
                </p>

                <p className="text-sm text-blue-200 mt-4 max-w-sm mx-auto leading-relaxed">
                  The admin is entering your complaint details. Stay on the line...
                </p>

                {resolvedComplaint && (
                  <div className="bg-emerald-900/80 border border-emerald-400 rounded-xl p-4 mt-6 text-left">
                    <div className="flex items-center gap-2 text-emerald-300 font-bold text-sm">
                      <CheckCircle size={18} />
                      Complaint Registered by Admin!
                    </div>
                    <div className="text-xs text-emerald-100 mt-1 font-mono">
                      ID: <span className="font-bold text-white">{resolvedComplaint.complaintId}</span>
                    </div>
                    <div className="text-xs text-yellow-300 mt-2 font-semibold">
                      This complaint has been logged under "Through Call" on your dashboard.
                    </div>
                  </div>
                )}

                <div className="mt-8">
                  <button
                    onClick={handleEndCall}
                    className="bg-red-600 hover:bg-red-700 text-white font-bold px-8 py-3 rounded-full shadow-lg text-sm"
                  >
                    End Call
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
