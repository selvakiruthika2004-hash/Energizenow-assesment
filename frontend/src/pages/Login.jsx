import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { Eye, EyeOff, User, Shield } from 'lucide-react';
import { API_BASE } from '../utils/api';

export default function Login() {
  const [loginType, setLoginType] = useState('user'); // 'user' or 'admin'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleTabChange = (type) => {
    setLoginType(type);
    setEmail('');
    setPassword('');
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await axios.post(`${API_BASE}/auth/login`, { email, password });
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
      <div className="bg-white p-8 rounded shadow-md w-full max-w-md">
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold text-[#1E3A8A]">SmartServe</h2>
          <h3 className="text-sm text-gray-500">Complaint & Service Management</h3>
        </div>
        
        <div className="flex mb-6 bg-gray-100 p-1 rounded-lg">
          <button 
            type="button"
            onClick={() => handleTabChange('user')}
            className={`flex-1 flex justify-center items-center py-2 rounded-md transition-colors ${loginType === 'user' ? 'bg-white shadow text-[#2563EB] font-bold' : 'text-gray-600 hover:bg-gray-200'}`}
          >
            <User size={18} className="mr-2" /> User Login
          </button>
          <button 
            type="button"
            onClick={() => handleTabChange('admin')}
            className={`flex-1 flex justify-center items-center py-2 rounded-md transition-colors ${loginType === 'admin' ? 'bg-white shadow text-[#2563EB] font-bold' : 'text-gray-600 hover:bg-gray-200'}`}
          >
            <Shield size={18} className="mr-2" /> Admin/Staff
          </button>
        </div>

        <form onSubmit={handleLogin}>
          {error && <div className="bg-red-100 text-red-700 p-3 mb-4 rounded text-sm font-medium">{error}</div>}
          
          <div className="mb-4">
            <label className="block text-sm font-medium mb-1 text-gray-700">Email</label>
            <input className="w-full border p-2 rounded focus:outline-blue-500" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>
          
          <div className="mb-4 relative">
            <label className="block text-sm font-medium mb-1 text-gray-700">Password</label>
            <input className="w-full border p-2 rounded focus:outline-blue-500" type={showPassword ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} required />
            <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-8 text-gray-500">
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>

          <div className="flex justify-between items-center mb-6 text-sm">
            <label className="flex items-center text-gray-600">
              <input type="checkbox" className="mr-2" /> Remember me
            </label>
            <a href="#" className="text-blue-600 hover:underline">Forgot password?</a>
          </div>
          
          <button disabled={loading} className="w-full bg-[#2563EB] hover:bg-blue-700 text-white font-bold p-3 rounded transition-colors mb-4 disabled:bg-gray-400 shadow-md">
            {loading ? 'Authenticating...' : 'LOGIN'}
          </button>

          {loginType === 'user' && (
            <div className="text-center text-sm mt-4 border-t pt-4">
              <span className="text-gray-600">Don't have an account? </span>
              <Link to="/register" className="text-blue-600 font-medium hover:underline">Create Account</Link>
            </div>
          )}
        </form>
      </div>
    </div>
  );
}