const fs = require('fs');
const path = require('path');

const frontendPath = path.join(__dirname, 'frontend');

const files = {
  'src/pages/Analytics.jsx': `import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
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
        const res = await axios.get('http://localhost:5000/api/dashboard/analytics', {
          headers: { Authorization: \`Bearer \${user.token}\` }
        });
        setStats(res.data);
      } catch (err) { console.error(err); }
    };
    fetchStats();
  }, [navigate, user]);

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <aside className="w-64 bg-gray-900 text-white p-4">
        <h1 className="text-xl font-bold mb-8">EnergizeNow SLA</h1>
        <nav className="space-y-2">
          <Link to="/dashboard" className="flex items-center p-2 hover:bg-gray-800 rounded"><LayoutDashboard className="mr-2" size={18}/> Dashboard</Link>
          <Link to="/analytics" className="flex items-center p-2 bg-gray-800 rounded"><BarChart2 className="mr-2" size={18}/> Analytics</Link>
          {user.role === 'ADMIN' && <Link to="#" className="flex items-center p-2 hover:bg-gray-800 rounded"><Users className="mr-2" size={18}/> Users</Link>}
        </nav>
      </aside>
      <main className="flex-1 p-8">
        <h2 className="text-2xl font-bold mb-8">Service Analytics</h2>
        {stats && (
          <div className="grid grid-cols-4 gap-4 mb-8">
            <div className="bg-white p-4 rounded shadow border-l-4 border-blue-500">
              <p className="text-sm text-gray-500">Total</p>
              <h3 className="text-2xl font-bold">{stats.total}</h3>
            </div>
            <div className="bg-white p-4 rounded shadow border-l-4 border-green-500">
              <p className="text-sm text-gray-500">Resolved</p>
              <h3 className="text-2xl font-bold">{stats.resolved}</h3>
            </div>
            <div className="bg-white p-4 rounded shadow border-l-4 border-orange-500">
              <p className="text-sm text-gray-500">Escalated</p>
              <h3 className="text-2xl font-bold">{stats.escalated}</h3>
            </div>
            <div className="bg-white p-4 rounded shadow border-l-4 border-red-500">
              <p className="text-sm text-gray-500">SLA Breached</p>
              <h3 className="text-2xl font-bold">{stats.breached}</h3>
            </div>
          </div>
        )}
        <div className="bg-white p-4 rounded shadow h-80">
          <h3 className="font-bold mb-4">SLA Compliance</h3>
          {stats && (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={[{name: 'Complaints', onTrack: stats.total - stats.breached, breached: stats.breached}]}>
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="onTrack" fill="#10b981" name="On Track" />
                <Bar dataKey="breached" fill="#ef4444" name="Breached" />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </main>
    </div>
  );
}`
};

Object.keys(files).forEach(file => {
  const filePath = path.join(frontendPath, file);
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, files[file]);
});

console.log('Frontend upgrade part 2 files generated successfully.');
