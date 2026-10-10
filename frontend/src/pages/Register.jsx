import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { User, Shield } from 'lucide-react';
import { API_BASE } from '../utils/api';

export default function Register() {
  const [registerType, setRegisterType] = useState('CUSTOMER'); // 'CUSTOMER' or 'ADMIN'
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
      const res = await axios.post(`${API_BASE}/auth/register`, { 
        name, email, phone, password, role: registerType 
      });
      localStorage.setItem('user', JSON.stringify(res.data));
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (type) => {
    setRegisterType(type);
    setError('');
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-100 p-4">
      <div className="bg-white p-8 rounded shadow-md w-full max-w-md">
        <h2 className="text-2xl font-bold mb-2 text-center text-[#1E3A8A]">SmartServe</h2>
        <h3 className="text-lg mb-6 text-center text-gray-600">Create an Account</h3>
        
        <div className="flex mb-6 bg-gray-100 p-1 rounded-lg">
          <button 
            type="button"
            onClick={() => handleTabChange('CUSTOMER')}
            className={`flex-1 flex justify-center items-center py-2 rounded-md transition-colors ${registerType === 'CUSTOMER' ? 'bg-white shadow text-[#2563EB] font-bold' : 'text-gray-600 hover:bg-gray-200'}`}
          >
            <User size={18} className="mr-2" /> User Account
          </button>
          <button 
            type="button"
            onClick={() => handleTabChange('ADMIN')}
            className={`flex-1 flex justify-center items-center py-2 rounded-md transition-colors ${registerType === 'ADMIN' ? 'bg-white shadow text-[#2563EB] font-bold' : 'text-gray-600 hover:bg-gray-200'}`}
          >
            <Shield size={18} className="mr-2" /> Admin Account
          </button>
        </div>

        <form onSubmit={handleRegister}>
          {error && <div className="bg-red-100 text-red-700 p-2 mb-4 rounded font-medium">{error}</div>}
          
          <input required className="w-full border p-2 mb-4 rounded focus:outline-blue-500" type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Full Name" />
          <input required className="w-full border p-2 mb-4 rounded focus:outline-blue-500" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email Address" />
          <input className="w-full border p-2 mb-4 rounded focus:outline-blue-500" type="text" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Phone Number" />
          
          <input required className="w-full border p-2 mb-4 rounded focus:outline-blue-500" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password" />
          <input required className="w-full border p-2 mb-6 rounded focus:outline-blue-500" type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="Confirm Password" />
          
          <button disabled={loading} className="w-full bg-[#2563EB] hover:bg-blue-700 text-white font-bold p-3 rounded transition-colors disabled:bg-gray-400">
            {loading ? 'Creating account...' : `REGISTER ${registerType === 'ADMIN' ? 'ADMIN' : 'USER'}`}
          </button>
          
          <div className="mt-4 text-center">
            <Link to="/login" className="text-sm text-blue-600 hover:underline">Already have an account? Login</Link>
          </div>
        </form>
      </div>
    </div>
  );
}