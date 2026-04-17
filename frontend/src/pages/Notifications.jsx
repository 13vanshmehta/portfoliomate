import React, { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import { Bell, Check, Trash2, CheckCircle2, Menu, Search, MailOpen, Clock, Activity, MessageSquare, Megaphone } from 'lucide-react';
import { getNotifications, markAsRead, deleteNotification } from '../api/notification';

export default function Notifications() {
  const { user, toggleSidebar } = useOutletContext();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('All'); // All, Unread
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (user?.firmId) {
      fetchNotifications();
    }
  }, [user?.firmId]);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const res = await getNotifications();
      // Default to empty array if data is missing or undefined
      setNotifications(res.data?.data || []);
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
      setNotifications([]); // ensure it doesn't crash on error
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsRead = async (id, e) => {
    if (e) e.stopPropagation();
    try {
      await markAsRead(id);
      setNotifications(prev => 
        prev.map(n => n.notificationId === id ? { ...n, isRead: true } : n)
      );
    } catch (error) {
      console.error('Failed to mark as read:', error);
    }
  };

  const handleDelete = async (id, e) => {
    if (e) e.stopPropagation();
    try {
      await deleteNotification(id);
      setNotifications(prev => prev.filter(n => n.notificationId !== id));
    } catch (error) {
      console.error('Failed to delete notification:', error);
    }
  };

  const markAllAsRead = async () => {
    const unreadIds = notifications.filter(n => !n.isRead).map(n => n.notificationId);
    if (unreadIds.length === 0) return;
    
    try {
      await Promise.all(unreadIds.map(id => markAsRead(id)));
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    } catch (error) {
      console.error('Failed to mark all as read:', error);
    }
  };

  const filteredNotifications = notifications
    .filter(n => filter === 'Unread' ? !n.isRead : true)
    .filter(n => searchQuery.trim() === '' || 
      n.title?.toLowerCase().includes(searchQuery.toLowerCase()) || 
      n.body?.toLowerCase().includes(searchQuery.toLowerCase())
    );

  const unreadCount = notifications.filter(n => !n.isRead).length;

  return (
    <div className="flex flex-col h-full w-full bg-[#f8f9fa]">
      {/* Top bar header spanning whole width */}
      <header className="px-5 md:px-8 py-3.5 bg-white/90 backdrop-blur-xl sticky top-0 z-20 flex items-center justify-between border-b border-gray-200/50 shadow-[0_4px_20px_-10px_rgba(0,0,0,0.05)] w-full">
        <div className="flex items-center space-x-4">
          <button onClick={toggleSidebar} className="lg:hidden p-2.5 -ml-2 text-gray-500 hover:bg-gray-100 active:bg-gray-200 rounded-xl transition-colors">
            <Menu size={22} />
          </button>
          <div className="flex flex-col">
            <h2 className="text-lg md:text-xl font-extrabold text-gray-900 tracking-tight leading-none">Notifications</h2>
            <span className="text-[0.7rem] font-semibold text-indigo-500 uppercase tracking-wider mt-1 hidden sm:block">Activity & Alerts</span>
          </div>
        </div>
        
        <div className="flex items-center space-x-5">
          <div className="relative max-w-md w-full hidden md:block group">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-indigo-500 transition-colors" size={18} />
            <input 
              type="text" 
              placeholder="Search notifications..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-gray-100/70 border border-transparent hover:bg-gray-100 focus:bg-white rounded-2xl pl-10 pr-4 py-2.5 text-sm focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-200 outline-none transition-all placeholder:text-gray-400 font-medium text-gray-700 shadow-inner focus:shadow-sm"
            />
          </div>
          
          <div className="flex items-center space-x-3 bg-white pl-2 pr-4 py-1.5 rounded-full shadow-[0_2px_8px_-2px_rgba(0,0,0,0.05)] border border-gray-100 cursor-pointer hover:border-gray-200 hover:shadow-md transition-all w-[180px] sm:w-[220px] flex-shrink-0 group">
            <div className="w-9 h-9 rounded-full overflow-hidden bg-indigo-50 border-2 border-white ring-2 ring-indigo-50/50 group-hover:ring-indigo-100 flex items-center justify-center flex-shrink-0 transition-all">
              {user?.profilePicture ? (
                <img src={user.profilePicture} alt="profile" className="w-full h-full object-cover" />
              ) : (
                <span className="text-indigo-600 font-bold text-sm uppercase tracking-wider">{user?.firstName?.charAt(0)}{user?.lastName?.charAt(0)}</span>
              )}
            </div>
            <div className="flex flex-col text-left leading-none overflow-hidden block flex-1">
              <span className="font-bold text-gray-900 text-[0.85rem] truncate w-full block">{user?.firstName} {user?.lastName}</span>
              <span className="text-gray-500 text-[0.7rem] font-medium mt-0.5 truncate w-full block">{user?.role || 'Member'}</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto custom-scrollbar relative px-4 lg:px-8 bg-[#f9fafb]">
        {/* Container for both feed and floating sidebar so they scroll away together */}
        <div className="max-w-[1100px] mx-auto w-full flex flex-col lg:flex-row items-start gap-8 py-8 pb-24">
          
          {/* Main Feed Region */}
          <div className="flex-1 min-w-0 w-full space-y-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h1 className="text-[2.2rem] font-extrabold text-gray-900 tracking-tight leading-tight flex items-center gap-3">
                  Notifications
                  {unreadCount > 0 && (
                    <span className="bg-rose-100 text-rose-600 text-sm py-1 px-3 rounded-full font-bold ml-2 shadow-sm">
                      {unreadCount} New
                    </span>
                  )}
                </h1>
                <p className="text-gray-500 text-[0.95rem] mt-1">Review your recent activities and announcements.</p>
              </div>
              
              {unreadCount > 0 && (
                <button 
                  onClick={markAllAsRead}
                  className="hidden md:flex items-center gap-1.5 text-sm font-bold text-indigo-600 hover:text-indigo-800 bg-indigo-50 hover:bg-indigo-100 px-4 py-2 rounded-xl transition-all shadow-sm hover:shadow"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  Mark all as read
                </button>
              )}
            </div>

            {loading ? (
              <div className="flex justify-center items-center py-24">
                <div className="w-8 h-8 rounded-full border-4 border-indigo-200 border-t-indigo-600 animate-spin" />
              </div>
            ) : filteredNotifications.length === 0 ? (
              <div className="text-center py-20 bg-white rounded-3xl shadow-sm border border-gray-100 flex flex-col items-center">
                <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-5 shadow-inner">
                  <Bell className="w-10 h-10 text-gray-400" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">No notifications found</h3>
                <p className="text-gray-500 text-[0.95rem] max-w-sm">When there's an update, reply, or announcement, it will appear right here.</p>
              </div>
            ) : (
              <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden divide-y divide-gray-50">
                {filteredNotifications.map((notification) => (
                  <div 
                    key={notification.notificationId}
                    className={`p-5 sm:p-6 transition-all hover:bg-gray-50/50 flex gap-4 group ${
                      !notification.isRead ? 'bg-indigo-50/10' : ''
                    }`}
                  >
                    {/* Icon Column */}
                    <div className="flex-shrink-0 mt-0.5">
                      <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shadow-sm ${
                        !notification.isRead ? 'bg-indigo-100 text-indigo-600' : 'bg-gray-100 text-gray-500'
                      }`}>
                        {notification.type === 'like' && <Activity size={18} />}
                        {notification.type === 'comment' && <MessageSquare size={18} />}
                        {(notification.type === 'announcement' || !notification.type) && <Megaphone size={18} />}
                      </div>
                    </div>

                    {/* Content Column */}
                    <div className="flex-1 min-w-0 flex flex-col justify-center">
                      <div className="flex sm:items-center justify-between flex-col sm:flex-row gap-2 sm:gap-4 mb-2.5">
                        <h4 className={`font-bold text-[0.95rem] truncate pr-4 ${!notification.isRead ? 'text-gray-900' : 'text-gray-800'}`}>
                          {notification.title}
                        </h4>
                        <div className="flex items-center gap-2 text-xs font-semibold text-gray-400 whitespace-nowrap">
                          <Clock size={12} />
                          {new Date(notification.timestamp).toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </div>
                      <p className={`text-[0.85rem] leading-relaxed max-w-3xl ${!notification.isRead ? 'text-gray-600 font-medium' : 'text-gray-500'}`}>
                        {notification.body}
                      </p>
                    </div>

                    {/* Action Column */}
                    <div className="flex flex-col items-center justify-start ml-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      {!notification.isRead ? (
                        <button 
                          onClick={(e) => handleMarkAsRead(notification.notificationId, e)}
                          title="Mark as read"
                          className="p-2 text-indigo-600 hover:bg-indigo-100 rounded-xl transition-colors mb-2"
                        >
                          <Check className="w-4 h-4" />
                        </button>
                      ) : (
                        <button 
                          disabled
                          className="p-2 text-gray-300 mb-2 cursor-default"
                          title="Read"
                        >
                          <MailOpen className="w-4 h-4" />
                        </button>
                      )}
                      
                      <button 
                        onClick={(e) => handleDelete(notification.notificationId, e)}
                        title="Delete notification"
                        className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                    
                    {/* Visual Indicator for Unread */}
                    {!notification.isRead && (
                      <div className="w-2.5 h-2.5 bg-indigo-500 rounded-full flex-shrink-0 mt-3 absolute left-[-4px] md:relative md:left-0 md:mt-4 hidden md:block shadow-sm" />
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
          
          {/* Right Sidebar Filter Region */}
          <div className="w-full lg:w-[280px] flex-shrink-0 flex flex-col space-y-6">
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
              <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">Viewing Filter</h3>
              
              <div className="space-y-2">
                <button 
                  onClick={() => setFilter('All')}
                  className={`w-full flex items-center justify-between px-4 py-2.5 rounded-xl text-sm font-bold transition-colors ${
                    filter === 'All' ? 'bg-indigo-50 text-indigo-700' : 'text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  <span>All Notifications</span>
                  {filter === 'All' && <Check size={16} />}
                </button>
                <button 
                  onClick={() => setFilter('Unread')}
                  className={`w-full flex items-center justify-between px-4 py-2.5 rounded-xl text-sm font-bold transition-colors ${
                    filter === 'Unread' ? 'bg-indigo-50 text-indigo-700' : 'text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  <span>Unread Only</span>
                  {filter === 'Unread' && <Check size={16} />}
                </button>
              </div>

              {unreadCount > 0 && (
                <div className="mt-6 pt-6 border-t border-gray-100 md:hidden">
                  <button 
                    onClick={markAllAsRead}
                    className="w-full flex justify-center items-center gap-1.5 text-sm font-bold text-indigo-600 hover:text-indigo-800 bg-indigo-50 hover:bg-indigo-100 px-4 py-2.5 rounded-xl transition-all"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    Mark all as read
                  </button>
                </div>
              )}
            </div>
            
            <div className="bg-indigo-50 rounded-2xl p-6 border border-indigo-100/50 relative overflow-hidden">
               <div className="relative z-10">
                 <h3 className="text-[0.95rem] font-extrabold text-indigo-900 mb-2">Notification Settings</h3>
                 <p className="text-[0.8rem] text-indigo-700/80 font-medium leading-relaxed mb-4">
                   Never miss an important update. Configure how and when you receive alerts.
                 </p>
                 <button className="text-xs font-bold text-indigo-600 bg-white hover:bg-indigo-100/50 pl-4 pr-3 py-2 rounded-xl transition-colors shadow-sm inline-flex items-center group">
                   Manage Settings
                   <Menu size={14} className="ml-2 text-indigo-400 group-hover:text-indigo-600 transition-colors" />
                 </button>
               </div>
               <Bell size={100} className="text-indigo-600/5 absolute -right-6 -bottom-6 -rotate-12" />
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}