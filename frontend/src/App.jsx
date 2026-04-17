import { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import AuthLayout from './layouts/AuthLayout';
import LoginPage from './pages/Login';
import SignupPage from './pages/Signup';
import Dashboard from './pages/Dashboard';
import DashboardLayout from './layouts/DashboardLayout';
import Announcements from './pages/Announcements';
import Notifications from './pages/Notifications';

function App() {
  useEffect(() => {
    // Global event listener to detect scrolling across the application
    let scrollTimeouts = new Map();

    const handleScroll = (e) => {
      const target = e.target;
      if (target.classList && target.classList.contains('custom-scrollbar')) {
        target.classList.add('is-scrolling');
        
        if (scrollTimeouts.has(target)) {
          clearTimeout(scrollTimeouts.get(target));
        }

        scrollTimeouts.set(target, setTimeout(() => {
          if (target && target.classList) {
            target.classList.remove('is-scrolling');
          }
          scrollTimeouts.delete(target);
        }, 1000)); // Hide scrollbar 1 second after scrolling stops
      }
    };

    // Use capture phase to catch scroll events on any overflowing div
    window.addEventListener('scroll', handleScroll, true);

    return () => {
      window.removeEventListener('scroll', handleScroll, true);
      scrollTimeouts.forEach(timer => clearTimeout(timer));
    };
  }, []);

  return (
    <Router>
      <Routes>
        <Route path='/auth' element={<AuthLayout />}>
          <Route path='login' element={<LoginPage />} />
          <Route path='signup' element={<SignupPage />} />
        </Route>
        {/* Main Application Layout */}
        <Route path='/portfoliomate' element={<DashboardLayout />}>
          <Route index element={<Navigate to="announcement" replace />} />      
          <Route path='dashboard' element={<Dashboard />} />
          <Route path='announcement' element={<Announcements />} />
          <Route path='notifications' element={<Notifications />} />
          <Route path='*' element={<div className="p-8 text-gray-500">Coming Soon</div>} />
        </Route>
        <Route path='/dashboard' element={<Navigate to='/portfoliomate/dashboard' replace />} />
        <Route path='/' element={<Navigate to='/auth/login' replace />} />      
      </Routes>
    </Router>
  );
}
export default App;
