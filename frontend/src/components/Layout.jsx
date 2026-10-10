import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { LayoutDashboard, LogOut, Plus, Search, CheckSquare, Settings, User, PhoneCall, PhoneIncoming } from 'lucide-react';
import { useEffect, useState } from 'react';
import axios from 'axios';
import { API_BASE } from '../utils/api';

export default function Layout() {
  const navigate = useNavigate();
  const location = useLocation();
  const user = JSON.parse(localStorage.getItem('user'));
  const [incomingCount, setIncomingCount] = useState(0);

  const handleLogout = () => {
    localStorage.removeItem('user');
    navigate('/login');
  };

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }

    if (user.role === 'ADMIN' || user.role === 'SUPPORT_AGENT' || user.role === 'MANAGER') {
      const checkIncomingCalls = async () => {
        try {
          const res = await axios.get(`${API_BASE}/calls?status=INCOMING`, {
            headers: { Authorization: `Bearer ${user.token}` }
          });
          setIncomingCount(res.data.length);
        } catch (e) {
          // Silent ignore
        }
      };
      checkIncomingCalls();
      const interval = setInterval(checkIncomingCalls, 6000);
      return () => clearInterval(interval);
    }
  }, [navigate, user?.token, user?.role]);

  if (!user) {
    return null;
  }

  const navItems = [
    { name: 'Dashboard', path: '/dashboard', icon: <LayoutDashboard size={20} /> },
  ];

  if (user.role === 'CUSTOMER') {
    navItems.push({ name: 'New Complaint', path: '/complaints/create', icon: <Plus size={20} /> });
  }

  if (user.role === 'ADMIN' || user.role === 'SUPPORT_AGENT' || user.role === 'MANAGER') {
    navItems.push({
      name: 'Incoming Calls',
      path: '/calls',
      icon: <PhoneIncoming size={20} />,
      badge: incomingCount > 0 ? incomingCount : null
    });
  }

  if (user.role === 'ADMIN') {
    navItems.push({ name: 'Analytics', path: '/analytics', icon: <Search size={20} /> });
  }

  return (
    <div className="flex h-screen bg-[#F3F6FC] font-sans text-[#172033]">
      {/* Sidebar */}
      <aside className="w-64 bg-[#1E3A8A] text-white flex flex-col shadow-lg">
        <div className="p-6">
          <h1 className="text-2xl font-bold tracking-wider text-white">SmartServe</h1>
          <p className="text-sm text-blue-200 mt-1 opacity-80">{user.role}</p>
        </div>
        <nav className="flex-1 px-4 mt-4 space-y-2">
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center justify-between p-3 rounded-lg transition-colors ${
                location.pathname === item.path
                  ? 'bg-[#2563EB] text-white shadow-md'
                  : 'text-blue-100 hover:bg-[#2563EB] hover:text-white'
              }`}
            >
              <div className="flex items-center">
                {item.icon}
                <span className="ml-3 font-medium">{item.name}</span>
              </div>
              {item.badge && (
                <span className="bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full animate-pulse">
                  {item.badge}
                </span>
              )}
            </Link>
          ))}

          {user.role === 'CUSTOMER' && (
            <div className="pt-4 border-t border-blue-800/60 mt-4">
              <div className="bg-blue-900/60 border border-blue-700/50 rounded-xl p-3 text-xs text-blue-200">
                <div className="font-bold text-white flex items-center gap-1.5 mb-1">
                  <PhoneCall size={14} className="text-green-400" />
                  Support Helpline
                </div>
                <p className="mb-2 text-[11px] leading-relaxed text-blue-200/80">Can't file a complaint? Call our 24/7 hotline directly:</p>
                <div className="bg-blue-950/80 px-2.5 py-1.5 rounded font-mono font-bold text-yellow-300 text-xs text-center border border-blue-800">
                  1800-200-SMART
                </div>
              </div>
            </div>
          )}
        </nav>
        <div className="p-4 border-t border-blue-800">
          <button
            onClick={handleLogout}
            className="flex items-center w-full p-3 rounded-lg text-blue-200 hover:bg-red-600 hover:text-white transition-colors"
          >
            <LogOut size={20} />
            <span className="ml-3 font-medium">Logout</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Navbar */}
        <header className="bg-white shadow-sm px-8 py-4 flex items-center justify-between z-10">
          <div className="flex items-center gap-3">
            <h2 className="text-xl font-semibold text-gray-800 capitalize">
              {location.pathname.split('/').pop().replace('-', ' ') || 'Dashboard'}
            </h2>
          </div>
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <div className="w-10 h-10 bg-[#2563EB] rounded-full flex items-center justify-center text-white font-bold shadow-md">
                {user.name ? user.name.charAt(0) : 'U'}
              </div>
              <div>
                <p className="text-sm font-semibold">{user.name}</p>
                <p className="text-xs text-gray-500">{user.email}</p>
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-auto p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
