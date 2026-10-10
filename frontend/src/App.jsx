import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import CreateComplaint from './pages/CreateComplaint';
import ComplaintDetails from './pages/ComplaintDetails';
import Register from './pages/Register';
import Analytics from './pages/Analytics';
import Calls from './pages/Calls';
import Layout from './components/Layout';

function App() {
  const user = JSON.parse(localStorage.getItem('user'));
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to={user ? "/dashboard" : "/login"} />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        
        {/* Protected Routes wrapped in Layout */}
        <Route element={<Layout />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/analytics" element={<Analytics />} />
          <Route path="/calls" element={<Calls />} />
          <Route path="/complaints/create" element={<CreateComplaint />} />
          <Route path="/complaints/:id" element={<ComplaintDetails />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
export default App;