const fs = require('fs');
const path = require('path');

const frontendPath = path.join(__dirname, 'frontend');

const files = {
  'src/pages/Register.jsx': `import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';

export default function Register() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleRegister = async (e) => {
    e.preventDefault();
    if (password !== confirmPassword) return setError('Passwords do not match');
    if (password.length < 6) return setError('Password must be at least 6 characters');
    setError('');
    setLoading(true);
    try {
      const res = await axios.post('http://localhost:5000/api/auth/register', { name, email, phone, password });
      localStorage.setItem('user', JSON.stringify(res.data));
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-100 p-4">
      <form onSubmit={handleRegister} className="bg-white p-8 rounded shadow-md w-full max-w-md">
        <h2 className="text-2xl font-bold mb-2 text-center text-blue-600">SmartServe</h2>
        <h3 className="text-lg mb-6 text-center text-gray-600">Create Customer Account</h3>
        {error && <div className="bg-red-100 text-red-700 p-2 mb-4 rounded">{error}</div>}
        
        <input required className="w-full border p-2 mb-4 rounded focus:outline-blue-500" type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Full Name" />
        <input required className="w-full border p-2 mb-4 rounded focus:outline-blue-500" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email Address" />
        <input className="w-full border p-2 mb-4 rounded focus:outline-blue-500" type="text" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Phone Number" />
        <input required className="w-full border p-2 mb-4 rounded focus:outline-blue-500" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password" />
        <input required className="w-full border p-2 mb-6 rounded focus:outline-blue-500" type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="Confirm Password" />
        
        <button disabled={loading} className="w-full bg-blue-600 hover:bg-blue-700 text-white p-2 rounded transition-colors disabled:bg-gray-400">
          {loading ? 'Creating account...' : 'REGISTER'}
        </button>
        <div className="mt-4 text-center">
          <Link to="/login" className="text-sm text-blue-600 hover:underline">Already have an account? Login</Link>
        </div>
      </form>
    </div>
  );
}`,

  'src/pages/Login.jsx': `import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { Eye, EyeOff } from 'lucide-react';

export default function Login() {
  const [email, setEmail] = useState('admin@test.com');
  const [password, setPassword] = useState('password123');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await axios.post('http://localhost:5000/api/auth/login', { email, password });
      localStorage.setItem('user', JSON.stringify(res.data));
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex h-screen items-center justify-center bg-gray-100 p-4">
      <form onSubmit={handleLogin} className="bg-white p-8 rounded shadow-md w-full max-w-md">
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold text-blue-600">SmartServe</h2>
          <h3 className="text-sm text-gray-500">Complaint & Service Management</h3>
        </div>
        {error && <div className="bg-red-100 text-red-700 p-2 mb-4 rounded text-sm">{error}</div>}
        
        <div className="mb-4">
          <label className="block text-sm font-medium mb-1 text-gray-700">Email</label>
          <input className="w-full border p-2 rounded focus:outline-blue-500" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </div>
        
        <div className="mb-4 relative">
          <label className="block text-sm font-medium mb-1 text-gray-700">Password</label>
          <input className="w-full border p-2 rounded focus:outline-blue-500" type={showPassword ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} required />
          <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-2 top-8 text-gray-500">
            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        </div>

        <div className="flex justify-between items-center mb-6 text-sm">
          <label className="flex items-center text-gray-600">
            <input type="checkbox" className="mr-2" /> Remember me
          </label>
          <a href="#" className="text-blue-600 hover:underline">Forgot password?</a>
        </div>
        
        <button disabled={loading} className="w-full bg-blue-600 hover:bg-blue-700 text-white p-2 rounded transition-colors mb-4 disabled:bg-gray-400">
          {loading ? 'Authenticating...' : 'LOGIN'}
        </button>

        <div className="text-center text-sm">
          <span className="text-gray-600">Don't have an account? </span>
          <Link to="/register" className="text-blue-600 font-medium hover:underline">Create Customer Account</Link>
        </div>
      </form>
    </div>
  );
}`
};

Object.keys(files).forEach(file => {
  const filePath = path.join(frontendPath, file);
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, files[file]);
});

console.log('Frontend upgrade files generated successfully.');
