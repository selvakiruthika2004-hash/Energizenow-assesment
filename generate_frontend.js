const fs = require('fs');
const path = require('path');

const frontendPath = path.join(__dirname, 'frontend');
const dirs = [
  'src/components',
  'src/pages',
  'src/utils',
  'src/context'
];

dirs.forEach(dir => {
  fs.mkdirSync(path.join(frontendPath, dir), { recursive: true });
});

const files = {
  'src/App.jsx': `import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import CreateComplaint from './pages/CreateComplaint';
import ComplaintDetails from './pages/ComplaintDetails';

function App() {
  const user = JSON.parse(localStorage.getItem('user'));
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to={user ? "/dashboard" : "/login"} />} />
        <Route path="/login" element={<Login />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/complaints/create" element={<CreateComplaint />} />
        <Route path="/complaints/:id" element={<ComplaintDetails />} />
      </Routes>
    </BrowserRouter>
  );
}
export default App;`,

  'src/pages/Login.jsx': `import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

export default function Login() {
  const [email, setEmail] = useState('admin@test.com');
  const [password, setPassword] = useState('password123');
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post('http://localhost:5000/api/auth/login', { email, password });
      localStorage.setItem('user', JSON.stringify(res.data));
      navigate('/dashboard');
    } catch (err) {
      alert('Login failed');
    }
  };

  return (
    <div className="flex h-screen items-center justify-center bg-gray-100">
      <form onSubmit={handleLogin} className="bg-white p-8 rounded shadow-md w-96">
        <h2 className="text-2xl font-bold mb-4 text-center">Smart SLA System</h2>
        <input className="w-full border p-2 mb-4 rounded" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" />
        <input className="w-full border p-2 mb-4 rounded" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password" />
        <button className="w-full bg-blue-600 text-white p-2 rounded">Login</button>
      </form>
    </div>
  );
}`,

  'src/pages/Dashboard.jsx': `import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { LayoutDashboard, Plus } from 'lucide-react';

export default function Dashboard() {
  const [complaints, setComplaints] = useState([]);
  const user = JSON.parse(localStorage.getItem('user'));
  const navigate = useNavigate();

  useEffect(() => {
    if(!user) return navigate('/login');
    const fetchComplaints = async () => {
      try {
        const res = await axios.get('http://localhost:5000/api/complaints', {
          headers: { Authorization: \`Bearer \${user.token}\` }
        });
        setComplaints(res.data);
      } catch (err) { console.error(err); }
    };
    fetchComplaints();
  }, [navigate, user]);

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <aside className="w-64 bg-gray-900 text-white p-4">
        <h1 className="text-xl font-bold mb-8">EnergizeNow SLA</h1>
        <nav>
          <Link to="/dashboard" className="flex items-center p-2 bg-gray-800 rounded"><LayoutDashboard className="mr-2" size={18}/> Dashboard</Link>
        </nav>
      </aside>
      <main className="flex-1 p-8">
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-2xl font-bold">Complaints Dashboard</h2>
          {user.role !== 'SUPPORT_AGENT' && (
            <Link to="/complaints/create" className="bg-blue-600 text-white px-4 py-2 rounded flex items-center">
              <Plus size={18} className="mr-1" /> New Complaint
            </Link>
          )}
        </div>
        
        <div className="bg-white rounded shadow p-4">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b">
                <th className="p-2">ID</th>
                <th className="p-2">Subject</th>
                <th className="p-2">Priority</th>
                <th className="p-2">Status</th>
                <th className="p-2">SLA</th>
                <th className="p-2">Action</th>
              </tr>
            </thead>
            <tbody>
              {complaints.map(c => (
                <tr key={c._id} className="border-b hover:bg-gray-50">
                  <td className="p-2">{c.complaintId}</td>
                  <td className="p-2">{c.subject}</td>
                  <td className="p-2"><span className={\`px-2 py-1 rounded text-xs \${c.priority==='CRITICAL'?'bg-red-200 text-red-800':c.priority==='HIGH'?'bg-orange-200 text-orange-800':'bg-green-200 text-green-800'}\`}>{c.priority}</span></td>
                  <td className="p-2">{c.status}</td>
                  <td className="p-2">{c.slaStatus}</td>
                  <td className="p-2"><Link to={\`/complaints/\${c._id}\`} className="text-blue-600">View</Link></td>
                </tr>
              ))}
            </tbody>
          </table>
          {complaints.length === 0 && <p className="text-gray-500 mt-4 text-center">No complaints found.</p>}
        </div>
      </main>
    </div>
  );
}`
};

Object.keys(files).forEach(file => {
  fs.writeFileSync(path.join(frontendPath, file), files[file]);
});

console.log('Frontend files generated.');
