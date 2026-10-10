import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { API_BASE } from '../utils/api';
import { LayoutDashboard, Users, Settings, BarChart2 } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

export default function Analytics() {
  const [stats, setStats] = useState(null);
  const user = JSON.parse(localStorage.getItem('user'));
  const navigate = useNavigate();

  useEffect(() => {
    if(!user) return navigate('/login');
    const fetchStats = async () => {
      try {
        const res = await axios.get(`${API_BASE}/dashboard/analytics`, {
          headers: { Authorization: `Bearer ${user.token}` }
        });
        setStats(res.data);
      } catch (err) { console.error(err); }
    };
    fetchStats();
  }, [navigate, user]);

  return (
    <div className="space-y-6">
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow border border-gray-100 flex flex-col items-center justify-center border-b-4 border-blue-500">
            <p className="text-gray-500 text-sm uppercase tracking-wide">Total</p>
            <h3 className="text-3xl font-bold text-[#1E3A8A]">{stats.total}</h3>
          </div>
          <div className="bg-white p-6 rounded-lg shadow border border-gray-100 flex flex-col items-center justify-center border-b-4 border-green-500">
            <p className="text-gray-500 text-sm uppercase tracking-wide">Resolved</p>
            <h3 className="text-3xl font-bold text-[#0F9D78]">{stats.resolved}</h3>
          </div>
          <div className="bg-white p-6 rounded-lg shadow border border-gray-100 flex flex-col items-center justify-center border-b-4 border-orange-500">
            <p className="text-gray-500 text-sm uppercase tracking-wide">Escalated</p>
            <h3 className="text-3xl font-bold text-amber-500">{stats.escalated}</h3>
          </div>
          <div className="bg-white p-6 rounded-lg shadow border border-gray-100 flex flex-col items-center justify-center border-b-4 border-red-500">
            <p className="text-gray-500 text-sm uppercase tracking-wide">SLA Breached</p>
            <h3 className="text-3xl font-bold text-red-600">{stats.breached}</h3>
          </div>
        </div>
      )}
      <div className="bg-white p-6 rounded-lg shadow border border-gray-100 h-96">
        <h3 className="text-lg font-semibold mb-6 text-[#172033]">SLA Compliance</h3>
        {stats && (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={[{name: 'Complaints', onTrack: stats.total - stats.breached, breached: stats.breached}]}>
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="onTrack" fill="#0F9D78" name="On Track" radius={[4, 4, 0, 0]} />
              <Bar dataKey="breached" fill="#DC2626" name="Breached" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}