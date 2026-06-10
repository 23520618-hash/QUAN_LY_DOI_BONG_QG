import React, { useState, useEffect, useRef } from 'react';
import io from 'socket.io-client';
import axios from 'axios';
import { jwtDecode } from 'jwt-decode';

const ChatWidget = ({ token }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [socket, setSocket] = useState(null);
  const [userId, setUserId] = useState(null);
  const [role, setRole] = useState(null);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    if (token) {
      try {
        const decoded = jwtDecode(token);
        setUserId(decoded.user_id);
        setRole(decoded.role);
        
        // Connect to Socket.io
        const newSocket = io('http://localhost:5000');
        setSocket(newSocket);
        
        newSocket.on('connect', () => {
          newSocket.emit('join_room', decoded.user_id);
        });

        newSocket.on('receive_message', (message) => {
          setMessages((prev) => {
            // If message from server has _id, replace matching optimistic message or add if new
            if (message._id) {
              // Check if already exists (deduplicate)
              if (prev.some(m => m._id === message._id)) return prev;
              // Replace first matching optimistic message (same content + senderId) with real one
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
        });

        // Fetch history
        axios.get('http://localhost:5000/api/chat/history', {
          headers: { Authorization: `Bearer ${token}` }
        }).then(res => {
          setMessages(res.data.data || []);
        }).catch(err => console.error("Could not fetch chat history", err));

        return () => newSocket.close();
      } catch (err) {
        console.error("Invalid token", err);
      }
    }
  }, [token]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isOpen]);

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!inputMessage.trim() || !socket || !userId) return;

    const messageData = {
      senderId: userId,
      receiverId: 'admin', // Send to admin
      content: inputMessage,
    };

    // Optimistic update: show message immediately without waiting for server echo
    const optimisticMsg = {
      ...messageData,
      _optimistic: true, // Mark as optimistic so we can replace when server confirms
      createdAt: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, optimisticMsg]);

    socket.emit('send_message', messageData);
    setInputMessage('');
  };

  // Don't show the widget if not logged in or if the user is an admin (Admin uses dashboard)
  if (!token || role === 'admin') return null;

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
      {/* Chat Window */}
      {isOpen && (
        <div className="mb-4 w-80 sm:w-96 h-[450px] glass-panel rounded-2xl overflow-hidden flex flex-col shadow-[0_0_40px_rgba(220,38,38,0.2)] animate-fade-in border border-white/20 relative">
          <div className="absolute inset-0 bg-gradient-to-b from-red-600/10 to-transparent pointer-events-none"></div>
          
          {/* Header */}
          <div className="bg-gradient-to-r from-red-600 to-red-800 backdrop-blur-md p-4 flex items-center justify-between shadow-lg z-10 border-b border-red-500/30">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center border border-white/30">
                <span className="text-xl">🧑‍💻</span>
              </div>
              <div>
                <h3 className="text-white font-bold font-vietnam">Hỗ trợ trực tuyến</h3>
                <p className="text-red-100 text-xs flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                  Admin đang online
                </p>
              </div>
            </div>
            <button 
              onClick={() => setIsOpen(false)}
              className="text-red-100 hover:text-white p-1 hover:bg-white/10 rounded-lg transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </div>

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-4 bg-slate-900/80 backdrop-blur-sm custom-scrollbar z-10">
            {/* 24h notice */}
            <div className="flex items-center gap-2 mb-4 px-2 py-1.5 bg-amber-500/10 border border-amber-500/20 rounded-xl">
              <svg className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              <p className="text-[10px] text-amber-300/80">Tin nhắn được lưu tối đa <span className="font-semibold text-amber-300">24 giờ</span> và tự động xóa</p>
            </div>

            {messages.length === 0 ? (
              <div className="h-[calc(100%-40px)] flex flex-col items-center justify-center text-gray-400 space-y-2">
                <svg className="w-12 h-12 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
                <p className="text-sm font-medium">Bắt đầu trò chuyện với Admin</p>
              </div>
            ) : (
              <div className="space-y-1">
                {messages.map((msg, index) => {
                  const isMe = msg.senderId === userId || msg.senderId === userId?.toString();
                  const msgDate = new Date(msg.createdAt || Date.now());
                  const today = new Date();
                  const isToday = msgDate.toDateString() === today.toDateString();
                  const yesterday = new Date(today); yesterday.setDate(today.getDate() - 1);
                  const isYesterday = msgDate.toDateString() === yesterday.toDateString();

                  // Show date separator
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
                      <div className={`flex w-full mb-2 ${isMe ? 'justify-end' : 'justify-start'}`}>
                        <div className={`flex items-end gap-2 max-w-[85%] ${isMe ? 'flex-row-reverse' : 'flex-row'}`}>
                          {/* Avatar */}
                          <div className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white shadow-sm border border-white/10"
                               style={{ backgroundColor: isMe ? '#ef4444' : '#1e293b' }}>
                            {isMe ? 'ME' : 'AD'}
                          </div>
                          
                          {/* Message Bubble */}
                          <div className={`px-4 py-2.5 rounded-2xl shadow-lg border ${
                            isMe 
                              ? 'bg-gradient-to-br from-red-600 to-red-800 text-white border-red-500/50 rounded-br-sm' 
                              : 'bg-slate-800/80 backdrop-blur-md border-white/10 text-gray-200 rounded-bl-sm'
                          }`}>
                            <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                            <div className={`flex items-center gap-1 mt-1.5 ${isMe ? 'justify-end' : 'justify-start'}`}>
                              <span className={`text-[10px] ${isMe ? 'text-red-200/80' : 'text-gray-400'}`}>
                                {msgDate.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                              </span>
                              {isMe && (
                                msg._optimistic 
                                  ? <svg className="w-3 h-3 text-red-300 opacity-70" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                  : <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" /></svg>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className="p-3 bg-slate-900/95 backdrop-blur-md border-t border-white/10 z-10 relative">
            <form onSubmit={handleSendMessage} className="flex items-end gap-2">
              <input
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                placeholder="Nhập tin nhắn..."
                className="flex-1 bg-slate-800/80 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 transition-all shadow-inner"
              />
              <button 
                type="submit"
                disabled={!inputMessage.trim()}
                className="p-3 bg-red-600 hover:bg-red-700 disabled:bg-slate-700 disabled:text-gray-500 text-white rounded-xl transition-colors shadow-lg"
              >
                <svg className="w-5 h-5 translate-x-0.5 -translate-y-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Toggle Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="w-14 h-14 bg-gradient-to-br from-red-500 to-red-700 text-white rounded-full flex items-center justify-center shadow-[0_0_20px_rgba(239,68,68,0.4)] hover:scale-110 hover:shadow-[0_0_25px_rgba(239,68,68,0.6)] transition-all duration-300 animate-bounce-in relative group"
        >
          <svg className="w-6 h-6 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
          <span className="absolute top-0 right-0 w-3 h-3 bg-red-400 rounded-full border-2 border-slate-900 animate-ping"></span>
          <span className="absolute top-0 right-0 w-3 h-3 bg-red-400 rounded-full border-2 border-slate-900"></span>
        </button>
      )}
    </div>
  );
};

export default ChatWidget;
