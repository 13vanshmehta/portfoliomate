import React, { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import { 
  Search, Image as ImageIcon, Paperclip, ChevronDown, 
  ThumbsUp, MessageCircle, Send, MoreHorizontal, Download, Pin,
  Megaphone, X, Bold, Italic, Underline as UnderlineIcon, Strikethrough, List, ListOrdered, Link2, Type, FileCheck, Menu, Trash2, Edit2
} from 'lucide-react';
import { getAnnouncements, createAnnouncement, likeAnnouncement, commentAnnouncement, getComments, deleteAnnouncement, updateAnnouncement } from '../api/announcement';
import { motion, AnimatePresence } from 'framer-motion';

const PREDEFINED_TAGS = ['PORTFOLIOMATE', 'STARTUP SCREENING', 'UPDATES', 'EVENTS', 'GENERAL', 'IMPORTANT'];

export default function Announcements() {
  const { user, toggleSidebar } = useOutletContext();
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [commentText, setCommentText] = useState({});
  
  // Filtering and Sorting States
  const [showPinnedOnly, setShowPinnedOnly] = useState(false);
  const [sortBy, setSortBy] = useState('Newest First');
  const [filterAuthor, setFilterAuthor] = useState('Everyone');
  const [selectedTopic, setSelectedTopic] = useState('All');

  // Comments State
  const [expandedComments, setExpandedComments] = useState({});
  const [commentsData, setCommentsData] = useState({});
  const [replyingTo, setReplyingTo] = useState({}); // { announcementId: commentId }
  const [searchQuery, setSearchQuery] = useState('');

  // Create Modal State
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [activeMenuId, setActiveMenuId] = useState(null);
  const [createData, setCreateData] = useState({
    title: '',
    body: '',
    tags: [],
    tagInput: '',
    isPinned: false,
    files: []
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchAnnouncements = async () => {
    try {
      setLoading(true);
      const res = await getAnnouncements(user.firmId, { limit: 20 });
      setAnnouncements(res.data.data.announcements || []);
    } catch (err) {
      console.error('Error fetching announcements:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.firmId) {
      fetchAnnouncements();
    }
  }, [user?.firmId]);

  const handleLike = async (id) => {
    try {
      await likeAnnouncement(id);
      fetchAnnouncements(); // Refresh the feed after liking (to ensure accuracy) or optimistic UI down below if preferred. We'll do optimistic.
      setAnnouncements(prev => prev.map(a => 
        a.announcementId === id ? { ...a, likesCount: (a.likesCount || 0) + (a.hasLiked ? -1 : 1), hasLiked: !a.hasLiked } : a
      ));
    } catch (err) {
      console.error('Like failed', err);
    }
  };

  const fetchCommentsForId = async (id) => {
    try {
      const res = await getComments(id);
      if (res.data.success) {
        setCommentsData(prev => ({ ...prev, [id]: res.data.data }));
      }
    } catch (err) {
      console.error('Failed to fetch comments', err);
    }
  };

  const handleToggleComments = async (id) => {
    if (expandedComments[id]) {
      setExpandedComments(prev => ({ ...prev, [id]: false }));
      return;
    }
    setExpandedComments(prev => ({ ...prev, [id]: true }));
    await fetchCommentsForId(id);
  };

  const handleComment = async (id) => {
    const text = commentText[id]?.trim();
    if (!text) return;
    
    const parentId = replyingTo[id] || null;

    try {
      await commentAnnouncement(id, text, parentId);
      setCommentText(prev => ({ ...prev, [id]: '' }));
      setReplyingTo(prev => ({ ...prev, [id]: null })); // clear reply state
      
      setAnnouncements(prev => prev.map(a => 
        a.announcementId === id ? { ...a, commentsCount: (a.commentsCount || 0) + 1 } : a
      ));
      // Refresh the specific comments list
      if (expandedComments[id]) {
         await fetchCommentsForId(id);
      } else {
         handleToggleComments(id); // Auto-expand if not open
      }
    } catch (err) {
      console.error('Comment failed', err);
    }
  };

  const handleDeleteAnnouncement = async (id) => {
    if (!window.confirm("Are you sure you want to delete this announcement?")) return;
    try {
      await deleteAnnouncement(id);
      setAnnouncements(prev => prev.filter(a => a.announcementId !== id));
      setActiveMenuId(null);
    } catch (err) {
      console.error('Failed to delete announcement', err);
    }
  };

  const handleEditAnnouncement = (announcement) => {
     setCreateData({
       id: announcement.announcementId,
       title: announcement.title || '',
       body: announcement.body || '',
       tags: announcement.classificationTags || [],
       tagInput: '',
       isPinned: announcement.isPinned || false,
       files: [] // Can't easily preview old files in input, could show separately, but skipping for simplicity
     });
     setIsCreateOpen(true);
     setActiveMenuId(null);
  };

  const handleCreateAnnouncement = async () => {
    if (!createData.title.trim() || !createData.body.trim()) return;

    setIsSubmitting(true);
    try {
      if (createData.id) {
        // Edit mode
        const res = await updateAnnouncement(createData.id, {
          title: createData.title,
          body: createData.body,
          classificationTags: createData.tags
        });
        
        if (res.data.success) {
          setAnnouncements(prev => prev.map(a => a.announcementId === createData.id ? res.data.data : a));
          setIsCreateOpen(false);
          setCreateData({
            id: null,
            title: '',
            body: '',
            tags: [],
            tagInput: '',
            isPinned: false,
            files: []
          });
        }
      } else {
        // Create mode
        const formData = new FormData();
        formData.append('title', createData.title);
        formData.append('body', createData.body);
        formData.append('classificationTags', JSON.stringify(createData.tags));
        formData.append('isPinned', createData.isPinned);

        createData.files.forEach(file => {
          formData.append('media', file);
        });

        const res = await createAnnouncement(formData);
        if (res.data.success) {
          setAnnouncements(prev => [res.data.data, ...prev]);
          setIsCreateOpen(false);
          setCreateData({
            id: null,
            title: '',
            body: '',
            tags: [],
            tagInput: '',
            isPinned: false,
            files: []
          });
        }
      }
    } catch (err) {
      console.error('Failed to save announcement:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddTag = (e) => {
    if (e.key === 'Enter' && createData.tagInput.trim()) {
      e.preventDefault();
      if (!createData.tags.includes(createData.tagInput.trim().toUpperCase())) {
        setCreateData(prev => ({
          ...prev,
          tags: [...prev.tags, prev.tagInput.trim().toUpperCase()],
          tagInput: ''
        }));
      }
    }
  };

  const removeTag = (tagToRemove) => {
    setCreateData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };

  const handleFileChange = (e) => {
    if (e.target.files?.length) {
      setCreateData(prev => ({
        ...prev,
        files: [...prev.files, ...Array.from(e.target.files)]
      }));
    }
  };

  const filteredAnnouncements = announcements
    .filter(a => searchQuery.trim() === '' || a.title?.toLowerCase().includes(searchQuery.toLowerCase()))
    .filter(a => showPinnedOnly ? a.isPinned : true)
    .filter(a => filterAuthor === 'Only Me' ? a.announcedBy === (user.uid || user.userId) : true)
    .filter(a => selectedTopic !== 'All' ? a.classificationTags?.includes(selectedTopic) : true)
    .sort((a, b) => {
        // Pinned announcements always come first
        if (a.isPinned && !b.isPinned) return -1;
        if (!a.isPinned && b.isPinned) return 1;

        // If both are pinned or both are unpinned, sort by the selected criteria
      if (sortBy === 'Oldest First') return new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime();
      if (sortBy === 'Most Popular') return ((b.likesCount || 0) + (b.commentsCount || 0)) - ((a.likesCount || 0) + (a.commentsCount || 0));
      return 0;
    });

  return (
    <div className="flex flex-col h-full w-full bg-[#f8f9fa]">
      {/* Create Modal Overlay */}
      <AnimatePresence>
        {isCreateOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
          >
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-3xl w-full max-w-[800px] shadow-2xl flex flex-col overflow-hidden max-h-[90vh]"
            >
              {/* Modal Header */}
              <div className="px-8 py-6 border-b border-gray-100 flex items-center justify-between bg-white relative">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600">
                    <Megaphone size={24} />
                  </div>
                  <div>
                    <h2 className="text-xl font-extrabold text-gray-900 tracking-tight">
                      {createData.id ? "Edit Announcement" : "New Announcement"}
                    </h2>
                    <p className="text-sm text-gray-500 font-medium mt-0.5">
                      {createData.id ? "Update your previously broadcasted message" : "Broadcast an update to your organization"}
                    </p>
                  </div>
                </div>
                <button 
                  onClick={() => {
                    setIsCreateOpen(false);
                    setCreateData({ id: null, title: '', body: '', tags: [], tagInput: '', isPinned: false, files: [] });
                  }}
                  className="p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600 rounded-full transition-colors absolute top-6 right-6"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Modal Body */}
              <div className="p-8 overflow-y-auto custom-scrollbar flex-1 space-y-6 bg-white">
                {/* Title */}
                <div>
                  <label className="text-[0.65rem] font-bold text-gray-400 uppercase tracking-widest pl-2 mb-2 block">Announcement Title</label>
                  <div className="flex items-center justify-between space-x-4">
                     <input 
                       type="text" 
                       placeholder="Enter a compelling title..." 
                       value={createData.title}
                       onChange={(e) => setCreateData(prev => ({ ...prev, title: e.target.value }))}
                       className="w-full bg-white text-xl font-bold text-gray-800 placeholder-gray-300 outline-none"
                     />
                     <div className="flex space-x-3 flex-shrink-0">
                       <label className="cursor-pointer flex items-center space-x-1.5 px-3 py-2 text-indigo-700 hover:bg-indigo-50 rounded-lg transition-colors text-sm font-bold bg-white">
                         <ImageIcon size={16} className="text-indigo-600" />
                         <span>Add Images</span>
                         <input type="file" multiple accept="image/*" className="hidden" onChange={handleFileChange} />
                       </label>
                       <label className="cursor-pointer flex items-center space-x-1.5 px-3 py-2 text-indigo-700 hover:bg-indigo-50 rounded-lg transition-colors text-sm font-bold bg-white">
                         <Paperclip size={16} className="text-indigo-600" />
                         <span>Attach Files</span>
                         <input type="file" multiple className="hidden" onChange={handleFileChange} />
                       </label>
                     </div>
                  </div>
                  {/* Selected files preview */}
                  {createData.files.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-4 pl-2">
                       {createData.files.map((f, i) => (
                         <div key={i} className="bg-gray-100 border border-gray-200 text-gray-600 px-3 py-1.5 rounded-lg text-[0.8rem] font-semibold flex items-center shadow-sm">
                           <FileCheck size={14} className="mr-2 text-indigo-500" />
                           <span className="truncate max-w-[150px]">{f.name}</span>
                           <button onClick={() => setCreateData(prev => ({ ...prev, files: prev.files.filter((_, idx) => idx !== i) }))} className="ml-2 text-gray-400 hover:text-red-500">
                             <X size={12} />
                           </button>
                         </div>
                       ))}
                    </div>
                  )}
                </div>

                {/* Editor Container */}
                <div className="border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
                   {/* Editor Toolbar (UI visual only for plain text currently) */}
                   <div className="bg-white border-b border-gray-200 px-4 py-2.5 flex items-center space-x-4 overflow-x-auto hidden-scrollbar">
                     <button className="flex items-center text-sm font-semibold text-gray-700 hover:bg-gray-100 px-2 py-1 rounded">
                       Normal <ChevronDown size={14} className="ml-1 text-gray-400" />
                     </button>
                     <div className="w-[1px] h-5 bg-gray-200"></div>
                     <div className="flex items-center space-x-1 text-gray-500">
                       <button className="p-1.5 hover:bg-gray-100 rounded transition-colors"><Bold size={16} /></button>
                       <button className="p-1.5 hover:bg-gray-100 rounded transition-colors"><Italic size={16} /></button>
                       <button className="p-1.5 hover:bg-gray-100 rounded transition-colors"><UnderlineIcon size={16} /></button>
                       <button className="p-1.5 hover:bg-gray-100 rounded transition-colors"><Strikethrough size={16} /></button>
                     </div>
                     <div className="w-[1px] h-5 bg-gray-200"></div>
                     <div className="flex items-center space-x-1 text-gray-500">
                       <button className="p-1.5 hover:bg-gray-100 rounded transition-colors"><List size={16} /></button>
                       <button className="p-1.5 hover:bg-gray-100 rounded transition-colors"><ListOrdered size={16} /></button>
                       <button className="p-1.5 hover:bg-gray-100 rounded transition-colors"><Link2 size={16} /></button>
                       <button className="p-1.5 hover:bg-gray-100 rounded transition-colors"><Type size={16} /></button>
                     </div>
                   </div>
                   
                   {/* Textarea block */}
                   <textarea
                     value={createData.body}
                     onChange={(e) => setCreateData(prev => ({ ...prev, body: e.target.value }))}
                     placeholder="What would you like to share?"
                     className="w-full min-h-[220px] p-5 outline-none resize-none text-[0.95rem] text-gray-800 leading-relaxed bg-[#fafafa]/30 focus:bg-white transition-colors"
                   />
                </div>

                {/* Bottom Config row */}
                <div className="grid grid-cols-2 gap-6 pt-2">
                  <div className="space-y-2">
                    <label className="text-[0.65rem] font-bold text-gray-400 uppercase tracking-widest pl-1">Classification Tags</label>
                    <div className="bg-gray-50 border border-gray-100 rounded-xl p-2 flex flex-wrap items-center gap-2 min-h-[46px]">
                      {createData.tags.map(tag => (
                        <span key={tag} className="bg-indigo-100 text-indigo-700 text-xs font-bold px-2.5 py-1 rounded-md flex items-center space-x-1 shadow-sm">
                          <span>{tag}</span>
                          <button onClick={() => removeTag(tag)} className="text-indigo-400 hover:text-indigo-900 ml-1">
                            <X size={12} />
                          </button>
                        </span>
                      ))}
                      <select 
                        onChange={(e) => {
                          const tag = e.target.value;
                          if (tag && !createData.tags.includes(tag)) {
                            setCreateData(prev => ({ ...prev, tags: [...prev.tags, tag] }));
                          }
                          e.target.value = "";
                        }}
                        className="flex-1 bg-transparent px-2 py-1 text-sm font-semibold outline-none cursor-pointer"
                      >
                        <option value="">Select tags...</option>
                        {PREDEFINED_TAGS.map(tag => (
                          <option key={tag} value={tag} disabled={createData.tags.includes(tag)}>{tag}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[0.65rem] font-bold text-gray-400 uppercase tracking-widest pl-1">Visibility settings</label>
                    <div className="bg-gray-50 border border-gray-100 rounded-xl p-3.5 flex items-center justify-between cursor-pointer hover:border-indigo-100 transition-colors group" onClick={() => setCreateData(prev => ({ ...prev, isPinned: !prev.isPinned }))}>
                      <div className="flex items-center space-x-3">
                         <div className="w-8 h-8 rounded-lg bg-white shadow-sm flex items-center justify-center text-gray-400 group-hover:text-indigo-500 transition-colors">
                            <Pin size={16} className="-rotate-45" />
                         </div>
                         <div className="flex flex-col">
                           <span className="text-sm font-bold text-gray-800">Pin Announcement</span>
                           <span className="text-[0.65rem] text-gray-400 font-medium">Keep at the top of organization feed</span>
                         </div>
                      </div>
                      
                      <div className={`w-10 h-5 border border-transparent rounded-full relative transition-colors ${createData.isPinned ? 'bg-indigo-600' : 'bg-gray-300'}`}>
                         <div className={`w-4 h-4 rounded-full bg-white shadow-sm absolute top-0.5 transition-transform duration-200 ${createData.isPinned ? 'translate-x-[18px]' : 'translate-x-0.5'}`} />
                      </div>
                    </div>
                  </div>
                </div>

              </div>

              {/* Modal Footer */}
              <div className="px-8 py-5 border-t border-gray-100 bg-gray-50/50 flex items-center justify-between">
                 <button 
                   onClick={() => {
                     setIsCreateOpen(false);
                     setCreateData({ id: null, title: '', body: '', tags: [], tagInput: '', isPinned: false, files: [] });
                   }}
                   className="text-gray-500 hover:text-gray-800 font-semibold text-sm px-4 py-2"
                 >
                   Cancel
                 </button>
                 <button 
                   onClick={handleCreateAnnouncement}
                   disabled={isSubmitting || !createData.title.trim() || !createData.body.trim()}
                   className="bg-[#242b5c] hover:bg-[#1a1f44] text-white font-bold px-8 py-3 rounded-xl shadow-md disabled:bg-gray-300 disabled:shadow-none transition-all flex items-center space-x-2 text-[0.95rem]"
                 >
                   {isSubmitting ? (
                     <div className="w-5 h-5 border-2 border-white border-t-transparent animate-spin rounded-full"></div>
                   ) : (
                     <>
                       <span>{createData.id ? "Update Post" : "Publish Now"}</span>
                       {!createData.id && <ChevronDown size={16} className="-rotate-90 opacity-70 ml-1" />}
                     </>
                   )}
                 </button>
              </div>

            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Top bar header spanning whole width */}
      <header className="px-5 md:px-8 py-3.5 bg-white/90 backdrop-blur-xl sticky top-0 z-20 flex items-center justify-between border-b border-gray-200/50 shadow-[0_4px_20px_-10px_rgba(0,0,0,0.05)] w-full">
        <div className="flex items-center space-x-4">
          <button onClick={toggleSidebar} className="lg:hidden p-2.5 -ml-2 text-gray-500 hover:bg-gray-100 active:bg-gray-200 rounded-xl transition-colors">
            <Menu size={22} />
          </button>
          <div className="flex flex-col">
            <h2 className="text-lg md:text-xl font-extrabold text-gray-900 tracking-tight leading-none">Announcements</h2>
            <span className="text-[0.7rem] font-semibold text-indigo-500 uppercase tracking-wider mt-1 hidden sm:block">Organization Feed</span>
          </div>
        </div>
        
        <div className="flex items-center space-x-5">
          <div className="relative max-w-md w-full hidden md:block group">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-indigo-500 transition-colors" size={18} />
            <input 
              type="text" 
              placeholder="Search announcements..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-gray-100/70 border border-transparent hover:bg-gray-100 focus:bg-white rounded-2xl pl-10 pr-4 py-2.5 text-sm focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-200 outline-none transition-all placeholder:text-gray-400 font-medium text-gray-700 shadow-inner focus:shadow-sm"
            />
          </div>
          
          <div className="flex items-center space-x-3 bg-white pl-2 pr-4 py-1.5 rounded-full shadow-[0_2px_8px_-2px_rgba(0,0,0,0.05)] border border-gray-100 cursor-pointer hover:border-gray-200 hover:shadow-md transition-all w-[180px] sm:w-[220px] flex-shrink-0 group">
            <div className="w-9 h-9 rounded-full overflow-hidden bg-indigo-50 border-2 border-white ring-2 ring-indigo-50/50 group-hover:ring-indigo-100 flex items-center justify-center flex-shrink-0 transition-all">
              {user.profilePicture ? (
                <img src={user.profilePicture} alt="profile" className="w-full h-full object-cover" />
              ) : (
                <span className="text-indigo-600 font-bold text-sm uppercase tracking-wider">{user.firstName?.charAt(0)}{user.lastName?.charAt(0)}</span>
              )}
            </div>
            <div className="flex flex-col text-left leading-none overflow-hidden block flex-1">
              <span className="font-bold text-gray-900 text-[0.85rem] truncate w-full block">{user.firstName} {user.lastName}</span>
              <span className="text-gray-500 text-[0.7rem] font-medium mt-0.5 truncate w-full block">{user.role || 'Member'}</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto custom-scrollbar relative px-4 lg:px-8 bg-[#f9fafb]">
        {/* Container for both feed and floating sidebar so they scroll away together */}
        <div className="max-w-[1100px] mx-auto w-full flex items-start gap-8 py-8 pb-24">
          
          {/* Center Feed */}
          <div className="flex-1 min-w-0 space-y-6">
            {/* Title block */}
            <div className="mb-6">
              <h1 className="text-[2.2rem] font-extrabold text-gray-900 tracking-tight leading-tight">Announcements</h1>
              <p className="text-gray-500 text-[0.95rem]">Get the latest news, updates, and events from exactly who matters.</p>
            </div>

            {/* Create Post Card */}
            <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 flex flex-col space-y-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-full overflow-hidden bg-indigo-100 flex-shrink-0">
                  {user.profilePicture ? (
                    <img src={user.profilePicture} alt="User" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-indigo-600 font-bold text-sm uppercase">
                      {user.firstName?.charAt(0)}{user.lastName?.charAt(0)}
                    </div>
                  )}
                </div>
                <input 
                  type="text" 
                  readOnly
                  onClick={() => setIsCreateOpen(true)}
                  placeholder={`What's on your mind, ${user.firstName}?`}
                  className="flex-1 bg-gray-50/80 border border-transparent hover:bg-gray-50 focus:bg-white focus:border-indigo-100 rounded-xl px-4 py-3 outline-none text-[0.95rem] transition-colors cursor-pointer"
                />
              </div>
              
              <div className="flex items-center justify-between pl-12">
                <div className="flex space-x-2">
                  <button onClick={() => setIsCreateOpen(true)} className="flex items-center space-x-1.5 px-3 py-1.5 text-gray-500 hover:bg-gray-50 hover:text-gray-800 rounded-lg transition-colors text-sm font-medium">
                    <ImageIcon size={16} className="text-blue-500" />
                    <span>Image</span>
                  </button>
                  <button onClick={() => setIsCreateOpen(true)} className="flex items-center space-x-1.5 px-3 py-1.5 text-gray-500 hover:bg-gray-50 hover:text-gray-800 rounded-lg transition-colors text-sm font-medium">
                    <Paperclip size={16} className="text-emerald-500" />
                    <span>Attachment</span>
                  </button>
                </div>
                <button onClick={() => setIsCreateOpen(true)} className="bg-gray-100 hover:bg-indigo-50 hover:text-indigo-600 text-gray-500 font-semibold px-5 py-2 rounded-xl text-xs transition-colors tracking-wide uppercase">
                  Quick Post
                </button>
              </div>
            </div>

            {/* Feed List */}
            {loading ? (
              <div className="flex items-center justify-center p-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
              </div>
            ) : filteredAnnouncements.length === 0 ? (
              <div className="text-center py-12 text-gray-500">No announcements found.</div>
            ) : (
              filteredAnnouncements.map((announcement) => (
                <div key={announcement.announcementId || Math.random()} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden flex flex-col">
                  {/* Optional Pinned Banner */}
                  {announcement.isPinned && (
                    <div className="bg-indigo-600 px-4 py-1.5 flex items-center space-x-2 text-white text-[0.7rem] font-bold tracking-wider uppercase">
                      <Pin size={12} className="-rotate-45" />
                      <span>Pinned Announcement</span>
                    </div>
                  )}

                  <div className="p-6">
                    {/* Header */}
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center space-x-3">
                        <div className="w-11 h-11 rounded-full bg-gray-200 overflow-hidden border border-gray-100 shadow-sm flex-shrink-0 relative">
                          {(announcement.announcedBy === (user.uid || user.userId) && user.profilePicture) || (announcement.announcedByPhoto && announcement.announcedByPhoto.startsWith('http')) ? (
                            <img 
                              src={(announcement.announcedBy === (user.uid || user.userId) && user.profilePicture) ? user.profilePicture : announcement.announcedByPhoto} 
                              alt="Profile" 
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                e.target.style.display = 'none';
                                e.target.nextSibling.style.display = 'flex';
                              }}
                            />
                          ) : null}
                          <div className={`w-full h-full bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold uppercase text-[0.95rem] ${((announcement.announcedBy === (user.uid || user.userId) && user.profilePicture) || (announcement.announcedByPhoto && announcement.announcedByPhoto.startsWith('http'))) ? 'hidden' : ''}`}>
                            {(announcement.announcedByName?.split(' ')[0]?.charAt(0) || '') + (announcement.announcedByName?.split(' ')[1]?.charAt(0) || '') || '?'}
                          </div>
                        </div>
                        <div>
                          <h4 className="font-bold text-gray-900 text-[0.95rem] capitalize leading-none tracking-tight">
                            {announcement.announcedByName}
                          </h4>
                          <p className="text-gray-500 text-[0.8rem] mt-1 space-x-1">
                            <span>Employee</span>
                            <span>•</span>
                            <span>{new Date(announcement.timestamp).toLocaleDateString()}</span>
                          </p>
                        </div>
                      </div>
                      
                      {/* Option Menu (Edit / Delete) */}
                      {(announcement.announcedBy === user?.uid || announcement.announcedBy === user?.userId || announcement.announcedBy === user?.id) && (
                        <div className="relative">
                          <button 
                            onClick={() => setActiveMenuId(activeMenuId === announcement.announcementId ? null : announcement.announcementId)}
                            className="text-gray-400 hover:bg-gray-50 p-2 rounded-full transition-colors focus:outline-none"
                          >
                            <MoreHorizontal size={20} />
                          </button>
                          
                          {activeMenuId === announcement.announcementId && (
                            <>
                              <div className="fixed inset-0 z-10" onClick={() => setActiveMenuId(null)} />
                              <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-lg border border-gray-100 z-20 py-2 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                                <button 
                                  onClick={() => handleEditAnnouncement(announcement)}
                                  className="w-full text-left px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 hover:text-indigo-600 flex items-center space-x-3 transition-colors"
                                >
                                  <Edit2 size={16} />
                                  <span>Edit Post</span>
                                </button>
                                <button 
                                  onClick={() => handleDeleteAnnouncement(announcement.announcementId)}
                                  className="w-full text-left px-4 py-2.5 text-sm font-semibold text-red-600 hover:bg-red-50 hover:text-red-700 flex items-center space-x-3 transition-colors group"
                                >
                                  <Trash2 size={16} className="group-hover:animate-pulse" />
                                  <span>Delete Post</span>
                                </button>
                              </div>
                            </>
                          )}
                        </div>
                      )}
                      
                    </div>

                    {/* Content */}
                    <div className="mb-4">
                      <h3 className="text-[1.2rem] font-extrabold text-gray-900 mb-2">{announcement.title}</h3>
                      <div className="text-gray-600 text-[0.95rem] leading-relaxed whitespace-pre-wrap">
                        {announcement.body}
                      </div>
                      {announcement.body?.length > 200 && (
                        <button className="text-indigo-600 font-bold text-sm hover:underline mt-2">Read More...</button>
                      )}
                    </div>

                    {/* Media / Image Grid */}
                    {(() => {
                      const isValidImage = (url) => {
                        if (!url) return false;
                        const u = url.toLowerCase();
                        // Exclude common document formats so they don't break the img tag
                        if (u.includes('.pdf') || u.includes('.doc') || u.includes('.xls') || u.includes('.ppt') || u.includes('.zip') || u.includes('.txt')) return false;
                        return true; 
                      };
                      const images = announcement.mediaUrls?.filter(isValidImage) || [];
                      if (images.length === 0) return null;
                      
                      const singleClass = images.length === 1 ? 'flex flex-col' : '';
                      const duoClass = images.length === 2 ? 'grid grid-cols-2 h-[250px]' : '';
                      const multiClass = images.length >= 3 ? 'grid grid-cols-2 grid-rows-2 h-[350px]' : '';
                      const layoutClass = singleClass || duoClass || multiClass;

                      return (
                        <div className={`mt-4 mb-5 rounded-2xl overflow-hidden shadow-sm border border-gray-100 gap-[2px] ${layoutClass}`}>
                          {images.slice(0, 4).map((url, idx) => {
                             const isFirstOfThree = images.length === 3 && idx === 0;
                             
                             return (
                               <div key={idx} className={`relative overflow-hidden bg-gray-50 flex items-center justify-center ${isFirstOfThree ? 'row-span-2' : ''}`}>
                                  <img 
                                    src={url} 
                                    alt="Announcement Media" 
                                    className={`object-cover w-full ${images.length === 1 ? 'max-h-[450px] h-auto' : 'absolute inset-0 h-full'}`}
                                    onError={(e) => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex'; }}
                                  />
                                  <div className="hidden absolute inset-0 items-center justify-center text-gray-400 text-xs font-semibold bg-gray-100 flex-col space-y-2">
                                    <span className="bg-white p-2 rounded-full shadow-sm"><FileCheck size={20} className="text-gray-300" /></span>
                                    <span>Preview Unavailable</span>
                                  </div>
                                  
                                  {images.length > 4 && idx === 3 && (
                                     <div className="absolute inset-0 bg-black/60 flex items-center justify-center backdrop-blur-[2px]">
                                        <span className="text-white text-2xl font-bold tracking-wider">+{images.length - 4}</span>
                                     </div>
                                  )}
                               </div>
                             );
                          })}
                        </div>
                      );
                    })()}

                    {/* Attachments preview */}
                    {(() => {
                      const isDocument = (url) => {
                        if (!url) return false;
                        const u = url.toLowerCase();
                        return u.includes('.pdf') || u.includes('.doc') || u.includes('.xls') || u.includes('.ppt') || u.includes('.zip') || u.includes('.txt'); 
                      };
                      const documents = announcement.mediaUrls?.filter(isDocument) || [];
                      if (documents.length === 0) return null;

                      return documents.map((docUrl, i) => {
                         let filename = `Attached Document ${i+1}`;
                         let downloadUrl = docUrl;

                         try {
                           // Extract from Firebase/Cloudinary URLs
                           let cleanName = decodeURIComponent(docUrl.split('?')[0].split('/').pop());
                           if (cleanName.includes('/')) cleanName = cleanName.split('/').pop();
                           // Strip Cloudinary UUIDs (e.g. b09a8945-01a2..._filename.pdf)
                           cleanName = cleanName.replace(/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}_/i, '');
                           // Strip out potential leading timestamps (e.g. 1718293910_filename.pdf)
                           cleanName = cleanName.replace(/^\d+_/, '');
                           // Cloudinary may also add 'v12345/' prefix if not split correctly, or other hash prefixes
                           if (cleanName.length > 2) filename = cleanName;
                         } catch(e) {}
                         
                         return (
                          <div key={docUrl} className="mt-2 mb-4 bg-gray-50 border border-gray-200 rounded-xl p-3 flex flex-col space-y-2">
                            <span className="text-xs font-bold text-gray-900">Attachments</span>
                            <a href={downloadUrl} target="_blank" rel="noopener noreferrer" className="bg-white border border-gray-200 hover:border-indigo-300 rounded-lg p-3 flex items-center justify-between cursor-pointer transition-colors group">
                              <div className="flex items-center space-x-3 overflow-hidden">
                                <div className="p-2 bg-indigo-50 rounded-lg text-indigo-500 flex-shrink-0 group-hover:bg-indigo-100 transition-colors">
                                  <FileCheck size={18} />
                                </div>
                                <div className="flex flex-col min-w-0 pr-4">
                                  <span className="text-sm font-semibold text-gray-800 truncate group-hover:text-indigo-700 transition-colors">{filename}</span>
                                  <span className="text-xs text-gray-400 uppercase tracking-widest mt-0.5">Click to open</span>
                                </div>
                              </div>
                              <div className="p-2 flex-shrink-0 text-gray-400 group-hover:text-indigo-600 rounded-lg transition-colors border border-transparent group-hover:bg-indigo-50">
                                <Download size={16} />
                              </div>
                            </a>
                          </div>
                      )});
                    })()}
                    

                    {/* Actions stats */}
                    <div className="flex items-center justify-between text-sm text-gray-500 font-semibold mb-4 mx-2">
                       <button onClick={() => handleLike(announcement.announcementId)} className={`flex items-center space-x-2 hover:bg-gray-50 px-4 py-2 rounded-xl transition-colors w-1/2 justify-center ${announcement.hasLiked ? 'text-indigo-600' : 'hover:text-indigo-600'}`}>
                         <ThumbsUp size={18} className={announcement.hasLiked ? "fill-indigo-600" : ""} />
                         <span>Like ({announcement.likesCount || 0})</span>
                       </button>
                       <button onClick={() => handleToggleComments(announcement.announcementId)} className="flex items-center space-x-2 hover:bg-gray-50 hover:text-indigo-600 px-4 py-2 rounded-xl transition-colors w-1/2 justify-center">
                         <MessageCircle size={18} />
                         <span>Comment ({announcement.commentsCount || 0})</span>
                       </button>
                    </div>

                    <div className="w-full h-[1px] bg-gray-100 mb-4"></div>

                    {/* Comments Area */}
                    <div className="bg-gray-50/50 rounded-2xl p-4 border border-gray-100 mt-2 space-y-4">
                      {expandedComments[announcement.announcementId] && (
                        <div className="space-y-4 pt-1 max-h-60 overflow-y-auto custom-scrollbar pr-2 mb-4">
                          {!commentsData[announcement.announcementId] ? (
                             <div className="text-center text-gray-400 text-xs py-2">Loading comments...</div>
                          ) : commentsData[announcement.announcementId].length === 0 ? (
                             <div className="text-center text-gray-400 text-xs py-2">No comments yet. Be the first to comment!</div>
                          ) : (
                            commentsData[announcement.announcementId]
                              .filter(c => !c.parentId) // Only top-level comments
                              .map(comment => (
                              <div key={comment.commentId} className="flex flex-col space-y-3">
                                <div className="flex space-x-3">
                                  <div className="w-8 h-8 rounded-full bg-slate-200 flex-shrink-0 overflow-hidden border border-gray-100 flex items-center justify-center relative">
                                     {(comment.userId === user.uid && user.profilePicture) || (comment.userPhoto && comment.userPhoto.startsWith('http')) ? (
                                        <img 
                                          src={(comment.userId === user.uid && user.profilePicture) ? user.profilePicture : comment.userPhoto} 
                                          alt="user" 
                                          className="w-full h-full object-cover"
                                          onError={(e) => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex'; }}
                                        />
                                     ) : null}
                                     <div className={`w-full h-full bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-[0.6rem] uppercase ${((comment.userId === user.uid && user.profilePicture) || (comment.userPhoto && comment.userPhoto.startsWith('http'))) ? 'hidden' : ''}`}>
                                       {(comment.userName?.split(' ')[0]?.charAt(0) || '') + (comment.userName?.split(' ')[1]?.charAt(0) || '') || '?'}
                                     </div>
                                  </div>
                                  <div className="flex flex-col flex-1">
                                    <div className="bg-white px-3.5 py-2.5 rounded-2xl rounded-tl-none text-sm text-gray-600 shadow-sm border border-gray-100 leading-relaxed">
                                       <div className="flex justify-between items-center mb-1">
                                         <span className="font-bold text-gray-900 text-xs capitalize">{comment.userName}</span>
                                         <span className="text-[0.65rem] text-gray-400">{new Date(comment.timestamp).toLocaleDateString()}</span>
                                       </div>
                                       <p className="text-[0.8rem] text-gray-700">{comment.text}</p>
                                    </div>
                                    {/* Action buttons under comment (Reply) */}
                                    <div className="flex items-center space-x-4 mt-1.5 ml-2">
                                       <button 
                                         onClick={() => setReplyingTo(prev => ({ ...prev, [announcement.announcementId]: comment.commentId }))}
                                         className="text-[0.7rem] font-bold text-gray-400 hover:text-indigo-600 transition-colors"
                                       >
                                         Reply
                                       </button>
                                    </div>
                                  </div>
                                </div>
                                {/* Replies (Nested Children) */}
                                {commentsData[announcement.announcementId].filter(c => c.parentId === comment.commentId).length > 0 && (
                                  <div className="pl-10 space-y-3 mt-1">
                                    {commentsData[announcement.announcementId].filter(c => c.parentId === comment.commentId).map(reply => (
                                      <div key={reply.commentId} className="flex space-x-3">
                                        <div className="w-6 h-6 rounded-full bg-slate-200 flex-shrink-0 overflow-hidden border border-gray-100 flex items-center justify-center relative">
                                          {(reply.userId === user.uid && user.profilePicture) || (reply.userPhoto && reply.userPhoto.startsWith('http')) ? (
                                              <img 
                                                src={(reply.userId === user.uid && user.profilePicture) ? user.profilePicture : reply.userPhoto} 
                                                alt="user" 
                                                className="w-full h-full object-cover"
                                                onError={(e) => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex'; }}
                                              />
                                          ) : null}
                                          <div className={`w-full h-full bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-[0.55rem] uppercase ${((reply.userId === user.uid && user.profilePicture) || (reply.userPhoto && reply.userPhoto.startsWith('http'))) ? 'hidden' : ''}`}>
                                            {(reply.userName?.split(' ')[0]?.charAt(0) || '') + (reply.userName?.split(' ')[1]?.charAt(0) || '') || '?'}
                                          </div>
                                        </div>
                                        <div className="bg-white px-3.5 py-2.5 rounded-2xl rounded-tl-none text-sm text-gray-600 shadow-sm border border-gray-100 leading-relaxed flex-1">
                                           <div className="flex justify-between items-center mb-1">
                                             <span className="font-bold text-gray-900 text-[0.7rem] capitalize">{reply.userName}</span>
                                             <span className="text-[0.6rem] text-gray-400">{new Date(reply.timestamp).toLocaleDateString()}</span>
                                          </div>
                                          <p className="text-[0.75rem] text-gray-700">{reply.text}</p>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>
                            ))
                          )}
                        </div>
                      )}

                      {/* Add comment input */}
                      <div className="flex flex-col pt-2 relative">
                        {replyingTo[announcement.announcementId] && (
                           <div className="flex items-center justify-between bg-indigo-50 text-indigo-700 text-xs font-semibold px-3 py-1.5 rounded-t-xl ml-11 mb-[-4px] relative z-10 w-max border border-indigo-100 border-b-0">
                              <span>Replying to thread...</span>
                              <button onClick={() => setReplyingTo(prev => ({ ...prev, [announcement.announcementId]: null }))} className="ml-3 hover:text-indigo-900 border-l border-indigo-200 pl-2">Cancel</button>
                           </div>
                        )}
                        <div className="flex items-center space-x-3 w-full">
                          <div className="w-8 h-8 rounded-full bg-indigo-100 overflow-hidden flex-shrink-0 shadow-sm border border-indigo-50 relative">
                            {user.profilePicture ? (
                              <img src={user.profilePicture} alt="User" className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-indigo-600 font-bold text-[0.65rem] uppercase">
                                {user.firstName?.charAt(0)}{user.lastName?.charAt(0)}
                              </div>
                            )}
                          </div>
                          <div className="relative flex-1">
                            <input 
                              type="text" 
                              placeholder={replyingTo[announcement.announcementId] ? "Write your reply..." : "Add a comment..."}
                              value={commentText[announcement.announcementId] || ''}
                              onChange={(e) => setCommentText({ ...commentText, [announcement.announcementId]: e.target.value })}
                              className={`w-full bg-white border border-gray-200 px-4 py-2 text-[0.85rem] outline-none pr-10 focus:ring-2 focus:ring-indigo-500/20 ${replyingTo[announcement.announcementId] ? 'rounded-b-2xl rounded-tr-2xl rounded-tl-none' : 'rounded-full'}`}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') handleComment(announcement.announcementId);
                              }}
                            />
                            <button 
                              onClick={() => handleComment(announcement.announcementId)}
                              className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-gray-400 hover:text-indigo-600 transition-colors bg-gray-50 rounded-full"
                            >
                              <Send size={12} className="-ml-0.5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>

                  </div>
                </div>
              ))
            )}
            
          </div>
        {/* Center column ends here */}

        {/* Right Sidebar Properties pane (Floats but scrolls with content) */}
        <aside className="hidden xl:flex w-72 bg-white border border-[#eaeaea] rounded-[1.25rem] p-5 shadow-sm flex-col flex-shrink-0 mt-[100px]">
          <div className="space-y-6 w-full">

          <div className="space-y-2 min-h-0">
             <label className="text-[0.65rem] font-bold text-gray-400 uppercase tracking-widest pl-1">Filter by Author</label>
             <div className="relative cursor-pointer group">
               <select 
                 value={filterAuthor}
                 onChange={(e) => setFilterAuthor(e.target.value)}
                 className="w-full appearance-none bg-white border border-gray-100 hover:border-gray-200 rounded-xl px-3 py-2 text-[0.8rem] font-semibold text-gray-800 outline-none transition-colors group-hover:bg-gray-50/50 shadow-sm"
               >
                 <option>Everyone</option>
                 <option>Only Me</option>
               </select>
               <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none group-hover:text-gray-600" />
             </div>
          </div>

          <div className="space-y-1.5 min-h-0">
             <label className="text-[0.65rem] font-bold text-gray-400 uppercase tracking-widest pl-1">Sort Order</label>
             <div className="relative cursor-pointer group">
               <select 
                 value={sortBy}
                 onChange={(e) => setSortBy(e.target.value)}
                 className="w-full appearance-none bg-white border border-gray-100 hover:border-gray-200 rounded-xl px-3 py-2 text-[0.8rem] font-semibold text-gray-800 outline-none transition-colors group-hover:bg-gray-50/50 shadow-sm"
               >
                 <option>Newest First</option>
                 <option>Oldest First</option>
                 <option>Most Popular</option>
               </select>
               <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none group-hover:text-gray-600" />
             </div>
          </div>

          <div className="bg-white border border-gray-100 rounded-xl px-3 py-2.5 flex items-center justify-between cursor-pointer hover:bg-gray-50 transition-colors mt-2 shadow-sm" onClick={() => setShowPinnedOnly(!showPinnedOnly)}>
             <div className="flex items-center space-x-2 text-[0.8rem] font-semibold text-gray-800">
               <Pin size={14} className="-rotate-45 text-[min(14px,1vw)] text-gray-500" />
               <span>Show Pinned Only</span>
             </div>
             {/* Simple Toggle Switch UI */}
             <div className={`w-8 h-4.5 rounded-full relative transition-colors ${showPinnedOnly ? 'bg-indigo-600' : 'bg-gray-200'}`}>
                <div className={`w-3.5 h-3.5 rounded-full bg-white shadow-sm absolute top-[2px] transition-transform duration-200 ${showPinnedOnly ? 'translate-x-4' : 'translate-x-[2px]'}`} />
             </div>
          </div>

          <div className="space-y-3 pt-3 border-t border-gray-100">
             <label className="text-[0.65rem] font-bold text-gray-400 uppercase tracking-widest pl-1">Tags</label>
             <div className="flex flex-wrap gap-2">
                <span 
                  onClick={() => setSelectedTopic('All')}
                  className={`border px-3 py-1.5 rounded-full text-[0.65rem] font-bold tracking-wide uppercase shadow-sm cursor-pointer transition-colors ${selectedTopic === 'All' ? 'bg-indigo-900 border-transparent text-white hover:bg-indigo-800' : 'bg-[#f0f4fc] border-[#e0e8f7] text-[#4a6bb5] hover:bg-indigo-50'}`}
                >
                  All
                </span>
                {PREDEFINED_TAGS.map(tag => (
                   <span 
                     key={tag}
                     onClick={() => setSelectedTopic(tag)}
                     className={`border px-3 py-1.5 rounded-full text-[0.65rem] font-bold tracking-wide uppercase cursor-pointer transition-colors ${selectedTopic === tag ? 'bg-indigo-900 border-transparent text-white hover:bg-indigo-800' : 'bg-[#f0f4fc] border-[#e0e8f7] text-[#4a6bb5] hover:bg-indigo-50'}`}
                   >
                     {tag}
                   </span>
                ))}
             </div>
          </div>
        
          </div>
        </aside>

        </div>
      </div>
    </div>
  );
}
