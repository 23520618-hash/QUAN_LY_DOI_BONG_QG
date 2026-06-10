import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import io from 'socket.io-client';
import { useNavigate } from 'react-router-dom';

const SupportDashboard = ({ token }) => {
  const [chatUsers, setChatUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [socket, setSocket] = useState(null);
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);
  const selectedUserRef = useRef(selectedUser);
  const navigate = useNavigate();

  useEffect(() => {
    selectedUserRef.current = selectedUser;
  }, [selectedUser]);

  useEffect(() => {
    const role = localStorage.getItem('role');
    if (!token || role !== 'admin') {
      navigate('/');
      return;
    }

    // Connect Socket
    const newSocket = io('http://localhost:5000');
    setSocket(newSocket);

    newSocket.on('connect', () => {
      newSocket.emit('join_room', 'admin');
    });

    newSocket.on('receive_message', (message) => {
      const currentSelected = selectedUserRef.current;
      // Normalize IDs to string for comparison
      const senderIdStr = message.senderId?.toString();
      const receiverIdStr = message.receiverId?.toString();
      const selectedIdStr = currentSelected?._id?.toString();

      // Check if this message belongs to the current chat conversation
      const isRelated = currentSelected && (
        senderIdStr === selectedIdStr ||
        receiverIdStr === selectedIdStr ||
        senderIdStr === 'admin'
      );

      if (isRelated) {
        setMessages((prev) => {
          if (message._id) {
            if (prev.some(m => m._id === message._id)) return prev;
            // Replace matching optimistic
            const idx = prev.findIndex(
              m => m._optimistic && m.senderId === message.senderId && m.content === message.content
            );
            if (idx !== -1) {
              const next = [...prev];
              next[idx] = message;
              return next;
            }
          }
          return [...prev, message];
        });
      } else {
        // Otherwise just refresh user list to show active users
        fetchChatUsers(token);
      }
    });

    fetchChatUsers(token);

    return () => newSocket.close();
  }, [token, navigate]); // Removed selectedUser from dependencies to avoid reconnecting socket

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const fetchChatUsers = async (authToken) => {
    const t = authToken || token;
    try {
      const res = await axios.get('http://localhost:5000/api/chat/users', {
        headers: { Authorization: `Bearer ${t}` }
      });
      setChatUsers(res.data.data || []);
    } catch (err) {
      console.error('Lỗi tải danh sách người dùng chat:', err);
    }
  };

  const loadChatHistory = async (user) => {
    setSelectedUser(user);
    setLoading(true);
    try {
      const res = await axios.get(`http://localhost:5000/api/chat/history/${user._id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setMessages(res.data.data || []);
    } catch (err) {
      console.error('Lỗi tải lịch sử chat:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!inputMessage.trim() || !socket || !selectedUser) return;

    const messageData = {
      senderId: 'admin',
      receiverId: selectedUser._id,
      content: inputMessage,
    };

    // Optimistic update
    const optimisticMsg = {
      ...messageData,
      _optimistic: true,
      createdAt: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, optimisticMsg]);

    socket.emit('send_message', messageData);
    setInputMessage('');
  };

  return (
    <div className="min-h-[85vh] py-8 relative">
      {/* Decorative background blur */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-red-600/10 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none"></div>

      <div className="container mx-auto px-4 max-w-6xl h-full relative z-10">
        <div className="bg-slate-900/80 backdrop-blur-xl border border-white/10 rounded-2xl shadow-[0_0_50px_rgba(0,0,0,0.3)] overflow-hidden flex h-[80vh]">
          
          {/* Sidebar - Users List */}
          <div className="w-1/3 border-r border-white/10 bg-slate-950/60 flex flex-col">
            <div className="p-5 border-b border-white/10 bg-gradient-to-r from-red-600/10 to-transparent">
              <h2 className="text-xl font-heading font-bold text-white flex items-center gap-2">
                <svg className="w-6 h-6 text-red-500 drop-shadow-[0_0_8px_rgba(239,68,68,0.8)]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" /></svg>
                Hỗ Trợ Khách Hàng
              </h2>
              <p className="text-xs text-gray-400 mt-1.5 uppercase tracking-wider font-semibold">Danh sách yêu cầu</p>
            </div>
            
            <div className="flex-1 overflow-y-auto custom-scrollbar p-3 space-y-2">
              {chatUsers.length === 0 ? (
                <div className="text-center py-10 text-gray-500 font-medium text-sm">
                  Chưa có tin nhắn nào từ người dùng.
                </div>
              ) : (
                chatUsers.map((user) => (
                  <button
                    key={user._id}
                    onClick={() => loadChatHistory(user)}
                    className={`w-full text-left p-4 rounded-xl transition-all duration-300 border flex items-center gap-4 ${
                      selectedUser?._id === user._id 
                        ? 'bg-gradient-to-r from-red-600/20 to-transparent border-red-500/30 shadow-[inset_3px_0_0_#ef4444]' 
                        : 'bg-transparent border-transparent hover:bg-white/5 hover:border-white/5'
                    }`}
                  >
                    <div className="relative">
                      <div className="w-12 h-12 rounded-full bg-slate-800 flex items-center justify-center font-bold text-gray-300 text-lg border border-white/10 shadow-inner">
                        {user.username.substring(0, 2).toUpperCase()}
                      </div>
                      <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-500 rounded-full border-2 border-slate-950"></div>
                    </div>
                    <div className="flex-1 overflow-hidden">
                      <h4 className="text-white font-semibold truncate text-sm">{user.username}</h4>
                      <p className="text-gray-400 text-xs truncate mt-0.5">ID: {user._id.substring(0, 8)}...</p>
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>

          {/* Main Chat Area */}
          <div className="flex-1 flex flex-col bg-slate-900/40 relative">
            {!selectedUser ? (
              <div className="flex-1 flex flex-col items-center justify-center text-gray-500 bg-slate-950/20">
                <div className="w-24 h-24 rounded-full bg-white/5 flex items-center justify-center mb-6">
                  <svg className="w-12 h-12 opacity-40" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z" /></svg>
                </div>
                <p className="text-lg font-medium tracking-wide">Chọn một người dùng để trò chuyện</p>
              </div>
            ) : (
              <>
                {/* Chat Header */}
                <div className="p-5 border-b border-white/10 bg-slate-900/80 backdrop-blur-md flex items-center gap-4 shadow-[0_4px_20px_rgba(0,0,0,0.2)] z-10">
                  <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center font-bold text-white uppercase text-sm border border-white/10 shadow-inner">
                    {selectedUser.username.substring(0, 2)}
                  </div>
                  <div>
                    <h3 className="text-white font-bold tracking-wide">{selectedUser.username}</h3>
                    <p className="text-xs text-emerald-400 flex items-center gap-1.5 mt-0.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse drop-shadow-[0_0_5px_rgba(52,211,153,0.8)]"></span>
                      Đang nhắn tin
                    </p>
                  </div>
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
                  {/* 24h notice */}
                  <div className="flex items-center gap-2 mb-4 px-3 py-2 bg-amber-500/10 border border-amber-500/20 rounded-xl">
                    <svg className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    <p className="text-[11px] text-amber-300/80">Tin nhắn được lưu tối đa <span className="font-semibold text-amber-300">24 giờ</span> và tự động xóa sau đó</p>
                  </div>

                  {loading ? (
                    <div className="flex justify-center items-center h-32">
                      <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-red-500"></div>
                    </div>
                  ) : (
                    <div className="space-y-1">
                      {messages.map((msg, index) => {
                        const isAdmin = msg.senderId === 'admin';
                        const msgDate = new Date(msg.createdAt || Date.now());
                        const today = new Date();
                        const isToday = msgDate.toDateString() === today.toDateString();
                        const yesterday = new Date(today);
                        yesterday.setDate(today.getDate() - 1);
                        const isYesterday = msgDate.toDateString() === yesterday.toDateString();
                        const prevMsg = messages[index - 1];
                        const prevDate = prevMsg ? new Date(prevMsg.createdAt || Date.now()) : null;
                        const showDateSep = !prevDate || prevDate.toDateString() !== msgDate.toDateString();
                        const dateLabel = isToday ? 'Hôm nay' : isYesterday ? 'Hôm qua' : msgDate.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' });
                        return (
                          <div key={index}>
                            {showDateSep && (
                              <div className="flex items-center gap-2 my-3">
                                <div className="flex-1 h-px bg-slate-700/60"></div>
                                <span className="text-[10px] text-gray-500 px-2 py-0.5 bg-slate-800/60 rounded-full border border-slate-700/40">{dateLabel}</span>
                                <div className="flex-1 h-px bg-slate-700/60"></div>
                              </div>
                            )}
                            <div className={`flex w-full mb-3 ${isAdmin ? 'justify-end' : 'justify-start'}`}>
                              <div className={`flex items-end gap-2 max-w-[70%] ${isAdmin ? 'flex-row-reverse' : 'flex-row'}`}>
                                <div className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white shadow-sm border border-white/10"
                                     style={{ backgroundColor: isAdmin ? '#ef4444' : '#1e293b' }}>
                                  {isAdmin ? 'AD' : selectedUser.username.substring(0, 2).toUpperCase()}
                                </div>
                                <div className={`px-4 py-2.5 rounded-2xl shadow-lg border ${isAdmin ? 'bg-gradient-to-br from-red-600 to-red-800 text-white border-red-500/50 rounded-br-sm' : 'bg-slate-800/80 backdrop-blur-md border-white/10 text-gray-200 rounded-bl-sm'}`}>
                                  <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                                  <span className={`text-[10px] mt-1.5 block ${isAdmin ? 'text-red-200/80 text-right' : 'text-gray-400 text-left'}`}>
                                    {msgDate.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                                    {!isToday && <span className="ml-1 opacity-70">· {dateLabel}</span>}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                      <div ref={messagesEndRef} />
                    </div>
                  )}
                </div>

                {/* Chat Input */}
                <div className="p-4 bg-slate-900/90 backdrop-blur-md border-t border-white/10">
                  <form onSubmit={handleSendMessage} className="flex items-end gap-3">
                    <input
                      type="text"
                      value={inputMessage}
                      onChange={(e) => setInputMessage(e.target.value)}
                      placeholder={`Nhắn tin cho ${selectedUser.username}...`}
                      className="flex-1 bg-slate-800/50 focus:bg-slate-800 border border-white/10 rounded-xl px-5 py-3.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 transition-all shadow-inner"
                    />
                    <button 
                      type="submit"
                      disabled={!inputMessage.trim()}
                      className="p-3.5 bg-red-600 hover:bg-red-700 disabled:bg-slate-700 disabled:text-gray-500 text-white rounded-xl transition-all shadow-lg hover:shadow-red-500/30"
                    >
                      <svg className="w-5 h-5 translate-x-0.5 -translate-y-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>
                    </button>
                  </form>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SupportDashboard;
