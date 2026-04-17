import React, { useState } from 'react';
import { Navigate, Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Calendar, 
  Mail, 
  FileCheck, 
  Users, 
  UsersRound, 
  Gem, 
  Bell, 
  Megaphone, 
  MessageSquare, 
  Link as LinkIcon, 
  ListTodo, 
  Settings,
  LogOut,
  Hexagon,
  Menu,
  X
} from 'lucide-react';

export default function DashboardLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const userStr = localStorage.getItem('user');
  const user = userStr ? JSON.parse(userStr) : null;

  if (!user) {
    return <Navigate to="/auth/login" replace />;
  }

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/auth/login');
  };

  const navItems = [
    { name: 'Dashboard', icon: LayoutDashboard, path: '/portfoliomate/dashboard' },
    { name: 'Meetings', icon: Calendar, path: '/portfoliomate/meetings' },
    { name: 'Google Mails', icon: Mail, path: '/portfoliomate/mails' },
    { name: 'Screening', icon: FileCheck, path: '/portfoliomate/screening' },
    { name: 'Stakeholders', icon: Users, path: '/portfoliomate/stakeholders' },
    { name: 'Groups', icon: UsersRound, path: '/portfoliomate/groups' },
    { name: 'Engagements', icon: Gem, path: '/portfoliomate/engagements' },
    { name: 'Notifications', icon: Bell, path: '/portfoliomate/notifications' },
    { name: 'Announcements', icon: Megaphone, path: '/portfoliomate/announcement' },
    { name: 'Chats', icon: MessageSquare, path: '/portfoliomate/chats' },
    { name: 'Portfolio Share', icon: LinkIcon, path: '/portfoliomate/share' },
    { name: 'Task Manager', icon: ListTodo, path: '/portfoliomate/tasks' },
    { name: 'Settings', icon: Settings, path: '/portfoliomate/settings' },
  ];

  return (
    <div className="flex h-screen bg-[#F8FAFC]">
      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Left Sidebar */}
      <aside className={`fixed lg:relative inset-y-0 left-0 bg-white border-r border-gray-100 flex flex-col pt-6 pb-4 shadow-xl lg:shadow-sm z-50 flex-shrink-0 w-64 transform transition-transform duration-300 ease-in-out ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
        <div className="px-6 mb-8 flex items-center justify-between">
          <div className="flex items-center text-indigo-600 font-bold text-lg cursor-pointer lg:w-full">
            <div className="bg-indigo-50 p-1.5 rounded-lg mr-3 flex items-center justify-center">
              <img src="/Vector.png" alt="Logo" className="w-6 h-6 object-contain" />
            </div>
            PortfolioMate
          </div>
          <button className="lg:hidden text-gray-500 hover:bg-gray-100 p-1.5 rounded-lg transition-colors" onClick={() => setIsSidebarOpen(false)}>
            <X size={20} />
          </button>
        </div>

        {/* Navigation list */}
        <nav className="flex-1 overflow-y-auto px-4 space-y-1 custom-scrollbar group/nav">
          {navItems.map((item) => {
            const isActive = location.pathname.startsWith(item.path);
            return (
              <Link
                key={item.name}
                to={item.path}
                onClick={() => setIsSidebarOpen(false)}
                className={`group flex items-center space-x-3 px-4 py-2.5 rounded-xl text-[0.9rem] font-[600] transition-all duration-200 ease-in-out ${
                  isActive 
                    ? 'bg-[#18181B] text-white shadow-sm' 
                    : 'text-[#3f3f46] hover:bg-gray-100 hover:text-[#09090b]'
                }`}
              >
                <item.icon size={18} className={isActive ? 'text-white' : 'text-[#3f3f46] group-hover:text-black'} />
                <span>{item.name}</span>
              </Link>
            );
          })}
        </nav>

        <div className="px-4 mt-auto pt-4 border-t border-gray-100 mix-blend-multiply">
          <button 
            onClick={handleLogout}
            className="flex group w-full items-center space-x-3 px-4 py-3 text-[#3f3f46] hover:bg-red-50 hover:text-red-700 rounded-xl transition-colors font-[600] text-[0.9rem]"
          >
            <LogOut size={18} className="rotate-180 text-[#3f3f46] group-hover:text-red-700" />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col overflow-hidden relative min-w-0">
        <Outlet context={{ user, toggleSidebar: () => setIsSidebarOpen(true) }} />
      </main>
    </div>
  );
}
