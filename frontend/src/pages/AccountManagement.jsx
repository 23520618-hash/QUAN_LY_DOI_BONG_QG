import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const AccountManagement = ({ token }) => {
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('users'); // 'users' or 'logs'
    const [users, setUsers] = useState([]);
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(false);
    
    // User management state
    const [userSearch, setUserSearch] = useState('');
    const [userStatusFilter, setUserStatusFilter] = useState('all'); // 'all', 'active', 'blocked'
    const [userRoleFilter, setUserRoleFilter] = useState('all'); // 'all', 'admin', 'user'
    const [editingPermissionsUser, setEditingPermissionsUser] = useState(null);
    const [tempPermissions, setTempPermissions] = useState([]);

    // Log tracking state
    const [logSearch, setLogSearch] = useState('');
    const [logActionFilter, setLogActionFilter] = useState('all');
    const [logPage, setLogPage] = useState(1);
    const [logTotalPages, setLogTotalPages] = useState(1);
    const [logTotalItems, setLogTotalItems] = useState(0);
    const logLimit = 15;

    // Feedback states
    const [errorMsg, setErrorMsg] = useState('');
    const [successMsg, setSuccessMsg] = useState('');
    
    // Current user identification to prevent self-action
    const currentUsername = localStorage.getItem('username') || '';

    const showMessage = (setter, msg) => {
        setter(msg);
        setTimeout(() => setter(''), 4000);
    };

    // Redirect if not admin or no token
    useEffect(() => {
        const role = localStorage.getItem('role');
        if (!token || role !== 'admin') {
            navigate('/');
        }
    }, [token, navigate]);

    const fetchUsers = async () => {
        setLoading(true);
        try {
            const response = await axios.get('http://localhost:5000/api/users');
            setUsers(response.data.data || []);
        } catch (err) {
            console.error('Lỗi tải danh sách tài khoản:', err);
            showMessage(setErrorMsg, err.response?.data?.message || 'Không thể tải danh sách tài khoản.');
        } finally {
            setLoading(false);
        }
    };

    const fetchLogs = async (page = 1, search = '', action = '') => {
        setLoading(true);
        try {
            let url = `http://localhost:5000/api/users/logs?page=${page}&limit=${logLimit}`;
            if (search) url += `&search=${encodeURIComponent(search)}`;
            if (action && action !== 'all') url += `&action=${encodeURIComponent(action)}`;
            
            const response = await axios.get(url);
            setLogs(response.data.data || []);
            if (response.data.pagination) {
                setLogTotalPages(response.data.pagination.pages || 1);
                setLogTotalItems(response.data.pagination.total || 0);
            }
        } catch (err) {
            console.error('Lỗi tải nhật ký hoạt động:', err);
            showMessage(setErrorMsg, err.response?.data?.message || 'Không thể tải nhật ký hoạt động.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (activeTab === 'users') {
            fetchUsers();
        } else {
            fetchLogs(logPage, logSearch, logActionFilter);
        }
    }, [activeTab]);

    // Handle user search & filters
    const filteredUsers = users.filter(user => {
        const matchesSearch = 
            user.username.toLowerCase().includes(userSearch.toLowerCase()) || 
            user.email.toLowerCase().includes(userSearch.toLowerCase());
        
        const matchesStatus = 
            userStatusFilter === 'all' || 
            (userStatusFilter === 'active' && !user.isBlocked) || 
            (userStatusFilter === 'blocked' && user.isBlocked);
            
        const matchesRole = 
            userRoleFilter === 'all' || 
            user.role === userRoleFilter;

        return matchesSearch && matchesStatus && matchesRole;
    });

    // Stats calculations
    const stats = {
        totalUsers: users.length,
        activeUsers: users.filter(u => !u.isBlocked).length,
        blockedUsers: users.filter(u => u.isBlocked).length,
        adminUsers: users.filter(u => u.role === 'admin').length,
    };

    // User Operations
    const handleBlockUnblock = async (user) => {
        const isCurrentlyBlocked = user.isBlocked;
        const action = isCurrentlyBlocked ? 'unblock' : 'block';
        const actionLabel = isCurrentlyBlocked ? 'mở khóa' : 'khóa';
        
        if (user.username === currentUsername) {
            showMessage(setErrorMsg, 'Bạn không thể tự khóa tài khoản của chính mình!');
            return;
        }

        if (!window.confirm(`Bạn có chắc muốn ${actionLabel} tài khoản "${user.username}" (${user.email}) không?`)) {
            return;
        }

        try {
            await axios.put(`http://localhost:5000/api/users/${user._id}/${action}`);
            showMessage(setSuccessMsg, `Đã ${actionLabel} tài khoản thành công!`);
            fetchUsers();
        } catch (err) {
            showMessage(setErrorMsg, err.response?.data?.message || `Thao tác thất bại.`);
        }
    };

    const handleRoleChange = async (user) => {
        const newRole = user.role === 'admin' ? 'user' : 'admin';
        const actionLabel = newRole === 'admin' ? 'nâng lên Admin' : 'hạ xuống User';

        if (user.username === currentUsername) {
            showMessage(setErrorMsg, 'Bạn không thể tự thay đổi vai trò của chính mình!');
            return;
        }

        if (!window.confirm(`Bạn có chắc muốn thay đổi vai trò của "${user.username}" thành ${newRole.toUpperCase()}?`)) {
            return;
        }

        try {
            await axios.put(`http://localhost:5000/api/users/${user._id}/role`, { role: newRole });
            showMessage(setSuccessMsg, `Đã chuyển đổi vai trò sang ${newRole.toUpperCase()} thành công!`);
            fetchUsers();
        } catch (err) {
            showMessage(setErrorMsg, err.response?.data?.message || `Thao tác thất bại.`);
        }
    };

    const handleDeleteUser = async (user) => {
        if (user.username === currentUsername) {
            showMessage(setErrorMsg, 'Bạn không thể tự xóa tài khoản của chính mình!');
            return;
        }

        if (!window.confirm(`⚠️ CẢNH BÁO: Bạn có chắc chắn muốn XÓA VĨNH VIỄN tài khoản "${user.username}" (${user.email})? Hành động này không thể hoàn tác!`)) {
            return;
        }

        try {
            await axios.delete(`http://localhost:5000/api/users/${user._id}`);
            showMessage(setSuccessMsg, `Đã xóa tài khoản thành công!`);
            fetchUsers();
        } catch (err) {
            showMessage(setErrorMsg, err.response?.data?.message || `Thao tác thất bại.`);
        }
    };

    const handleEditPermissions = (user) => {
        setEditingPermissionsUser(user);
        setTempPermissions(user.permissions || []);
    };

    const handleSavePermissions = async () => {
        try {
            await axios.put(`http://localhost:5000/api/users/${editingPermissionsUser._id}/permissions`, { permissions: tempPermissions });
            showMessage(setSuccessMsg, `Đã cập nhật quyền cho ${editingPermissionsUser.username} thành công!`);
            setEditingPermissionsUser(null);
            fetchUsers();
        } catch (err) {
            showMessage(setErrorMsg, err.response?.data?.message || `Cập nhật quyền thất bại.`);
        }
    };

    const togglePermission = (perm) => {
        setTempPermissions(prev => 
            prev.includes(perm) ? prev.filter(p => p !== perm) : [...prev, perm]
        );
    };

    const handleViewUserLogs = (email) => {
        setLogSearch(email);
        setLogActionFilter('all');
        setLogPage(1);
        setActiveTab('logs');
        fetchLogs(1, email, 'all');
    };

    const handleLogSearchSubmit = (e) => {
        e.preventDefault();
        setLogPage(1);
        fetchLogs(1, logSearch, logActionFilter);
    };

    const handleLogActionFilterChange = (action) => {
        setLogActionFilter(action);
        setLogPage(1);
        fetchLogs(1, logSearch, action);
    };

    const handlePageChange = (newPage) => {
        if (newPage >= 1 && newPage <= logTotalPages) {
            setLogPage(newPage);
            fetchLogs(newPage, logSearch, logActionFilter);
        }
    };

    const clearLogFilters = () => {
        setLogSearch('');
        setLogActionFilter('all');
        setLogPage(1);
        fetchLogs(1, '', 'all');
    };

    return (
        <div className="min-h-screen pb-12">
            <div className="container mx-auto p-4">
                {/* Alert Banners */}
                {successMsg && (
                    <div className="bg-emerald-500/90 text-white p-4 mb-4 rounded-xl shadow-lg backdrop-blur-md border border-emerald-400 flex items-center gap-3 animate-fade-in" role="alert">
                        <svg className="w-6 h-6 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                        <p className="font-semibold">{successMsg}</p>
                    </div>
                )}
                {errorMsg && (
                    <div className="bg-rose-500/90 text-white p-4 mb-4 rounded-xl shadow-lg backdrop-blur-md border border-rose-400 flex items-center gap-3 animate-fade-in" role="alert">
                        <svg className="w-6 h-6 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                        <p className="font-semibold">{errorMsg}</p>
                    </div>
                )}

                {/* Dashboard Stats */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                    <div className="bg-slate-900/80 border border-slate-700 backdrop-blur-md rounded-2xl p-6 shadow-xl text-center hover:scale-102 transition-transform duration-200">
                        <h4 className="text-gray-400 text-sm font-semibold uppercase tracking-wider mb-2">Tổng số tài khoản</h4>
                        <p className="text-4xl font-extrabold text-blue-400">{stats.totalUsers}</p>
                    </div>
                    <div className="bg-slate-900/80 border border-slate-700 backdrop-blur-md rounded-2xl p-6 shadow-xl text-center hover:scale-102 transition-transform duration-200">
                        <h4 className="text-gray-400 text-sm font-semibold uppercase tracking-wider mb-2">Đang hoạt động</h4>
                        <p className="text-4xl font-extrabold text-emerald-400">{stats.activeUsers}</p>
                    </div>
                    <div className="bg-slate-900/80 border border-slate-700 backdrop-blur-md rounded-2xl p-6 shadow-xl text-center hover:scale-102 transition-transform duration-200">
                        <h4 className="text-gray-400 text-sm font-semibold uppercase tracking-wider mb-2">Bị khóa (Chặn)</h4>
                        <p className="text-4xl font-extrabold text-rose-400">{stats.blockedUsers}</p>
                    </div>
                    <div className="bg-slate-900/80 border border-slate-700 backdrop-blur-md rounded-2xl p-6 shadow-xl text-center hover:scale-102 transition-transform duration-200">
                        <h4 className="text-gray-400 text-sm font-semibold uppercase tracking-wider mb-2">Tài khoản Admin</h4>
                        <p className="text-4xl font-extrabold text-purple-400">{stats.adminUsers}</p>
                    </div>
                </div>

                {/* Navigation and Tab selector */}
                <div className="bg-slate-900/90 rounded-2xl shadow-xl overflow-hidden border border-slate-700">
                    <div className="flex border-b border-slate-800 bg-slate-950/50">
                        <button
                            onClick={() => { setActiveTab('users'); }}
                            className={`flex-1 py-4 px-6 font-vietnam font-bold text-lg flex items-center justify-center gap-2 border-b-2 transition-all duration-200 ${
                                activeTab === 'users' 
                                    ? 'border-red-500 text-white bg-slate-900/80' 
                                    : 'border-transparent text-gray-400 hover:text-gray-200 hover:bg-slate-900/40'
                            }`}
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
                            Danh sách tài khoản
                        </button>
                        <button
                            onClick={() => { setActiveTab('logs'); }}
                            className={`flex-1 py-4 px-6 font-vietnam font-bold text-lg flex items-center justify-center gap-2 border-b-2 transition-all duration-200 ${
                                activeTab === 'logs' 
                                    ? 'border-red-500 text-white bg-slate-900/80' 
                                    : 'border-transparent text-gray-400 hover:text-gray-200 hover:bg-slate-900/40'
                            }`}
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                            Nhật ký hoạt động hệ thống
                        </button>
                    </div>

                    <div className="p-6">
                        {loading && (
                            <div className="flex items-center justify-center py-12">
                                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-red-500"></div>
                            </div>
                        )}

                        {!loading && activeTab === 'users' && (
                            <div>
                                {/* Filters */}
                                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                                    <div className="relative">
                                        <input
                                            type="text"
                                            value={userSearch}
                                            onChange={(e) => setUserSearch(e.target.value)}
                                            placeholder="Tìm kiếm tài khoản..."
                                            className="w-full pl-10 pr-4 py-2 bg-slate-800 text-white rounded-lg border border-slate-700 focus:outline-none focus:ring-2 focus:ring-red-500 placeholder-gray-500 text-sm shadow-inner"
                                        />
                                        <div className="absolute left-3 top-2.5 text-gray-500">
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                                        </div>
                                    </div>
                                    <div>
                                        <select
                                            value={userStatusFilter}
                                            onChange={(e) => setUserStatusFilter(e.target.value)}
                                            className="w-full py-2 px-3 bg-slate-800 text-white rounded-lg border border-slate-700 focus:outline-none focus:ring-2 focus:ring-red-500 text-sm"
                                        >
                                            <option value="all">Tất cả trạng thái</option>
                                            <option value="active">Đang hoạt động</option>
                                            <option value="blocked">Đang bị chặn</option>
                                        </select>
                                    </div>
                                    <div>
                                        <select
                                            value={userRoleFilter}
                                            onChange={(e) => setUserRoleFilter(e.target.value)}
                                            className="w-full py-2 px-3 bg-slate-800 text-white rounded-lg border border-slate-700 focus:outline-none focus:ring-2 focus:ring-red-500 text-sm"
                                        >
                                            <option value="all">Tất cả vai trò</option>
                                            <option value="admin">Quản trị viên (Admin)</option>
                                            <option value="user">Người dùng (User)</option>
                                        </select>
                                    </div>
                                    <div className="flex justify-end items-center">
                                        <span className="text-gray-400 text-sm font-semibold">Tìm thấy {filteredUsers.length} tài khoản</span>
                                    </div>
                                </div>

                                {/* Table */}
                                <div className="overflow-x-auto rounded-xl border border-slate-800">
                                    <table className="min-w-full divide-y divide-slate-850 text-left">
                                        <thead className="bg-slate-950/70 text-gray-400 text-xs uppercase tracking-wider font-semibold">
                                            <tr>
                                                <th className="px-6 py-4">Tài khoản</th>
                                                <th className="px-6 py-4">Email</th>
                                                <th className="px-6 py-4 text-center">Vai trò</th>
                                                <th className="px-6 py-4 text-center">Trạng thái</th>
                                                <th className="px-6 py-4">Ngày tham gia</th>
                                                <th className="px-6 py-4 text-right">Thao tác</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-850 bg-slate-900/40 text-gray-200">
                                            {filteredUsers.length > 0 ? (
                                                filteredUsers.map((user) => (
                                                    <tr key={user._id} className="hover:bg-slate-800/45 transition-colors duration-150">
                                                        <td className="px-6 py-4 whitespace-nowrap">
                                                            <div className="flex items-center gap-3">
                                                                <div className="w-9 h-9 rounded-full bg-slate-700 flex items-center justify-center font-bold text-white uppercase text-sm border border-slate-600">
                                                                    {user.username.substring(0, 2)}
                                                                </div>
                                                                <span className="font-semibold text-white">{user.username} {user.username === currentUsername && <span className="text-xs bg-slate-700 text-gray-300 font-normal px-2 py-0.5 rounded-full ml-1">(Bạn)</span>}</span>
                                                            </div>
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-300">
                                                            {user.email}
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap text-center">
                                                            <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                                                                user.role === 'admin' 
                                                                    ? 'bg-purple-900/60 text-purple-200 border border-purple-800' 
                                                                    : 'bg-slate-800 text-slate-300 border border-slate-700'
                                                            }`}>
                                                                {user.role === 'admin' ? 'ADMIN' : 'USER'}
                                                            </span>
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap text-center">
                                                            <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                                                                user.isBlocked 
                                                                    ? 'bg-rose-950/60 text-rose-300 border border-rose-900' 
                                                                    : 'bg-emerald-950/60 text-emerald-300 border border-emerald-900'
                                                            }`}>
                                                                {user.isBlocked ? 'BỊ CHẶN' : 'HOẠT ĐỘNG'}
                                                            </span>
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">
                                                            {new Date(user.createdAt).toLocaleDateString('vi-VN')}
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap text-right">
                                                            <div className="flex items-center justify-end gap-2">
                                                                {/* View logs button */}
                                                                <button
                                                                    onClick={() => handleViewUserLogs(user.email)}
                                                                    title="Xem lịch sử thao tác"
                                                                    className="p-1.5 bg-blue-900/40 hover:bg-blue-800/80 text-blue-300 rounded-lg border border-blue-800 transition-colors duration-200"
                                                                >
                                                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>
                                                                </button>
                                                                
                                                                {/* Block/Unblock toggle */}
                                                                <button
                                                                    onClick={() => handleBlockUnblock(user)}
                                                                    disabled={user.username === currentUsername}
                                                                    title={user.isBlocked ? "Mở chặn" : "Chặn tài khoản"}
                                                                    className={`p-1.5 rounded-lg border transition-colors duration-200 ${
                                                                        user.username === currentUsername 
                                                                            ? 'opacity-40 cursor-not-allowed bg-gray-800 text-gray-500 border-gray-700' 
                                                                            : user.isBlocked
                                                                                ? 'bg-emerald-900/40 hover:bg-emerald-800/80 text-emerald-300 border-emerald-800'
                                                                                : 'bg-rose-900/40 hover:bg-rose-800/80 text-rose-300 border-rose-800'
                                                                    }`}
                                                                >
                                                                    {user.isBlocked ? (
                                                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 11V7a4 4 0 118 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z" /></svg>
                                                                    ) : (
                                                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zM10 6a4 4 0 018 0v4H10V6z" /></svg>
                                                                    )}
                                                                </button>
                                                                
                                                                {/* Role swap toggle */}
                                                                <button
                                                                    onClick={() => handleRoleChange(user)}
                                                                    disabled={user.username === currentUsername}
                                                                    title="Đổi vai trò User/Admin"
                                                                    className={`p-1.5 bg-purple-900/40 hover:bg-purple-800/80 text-purple-300 rounded-lg border border-purple-800 transition-colors duration-200 ${
                                                                        user.username === currentUsername ? 'opacity-40 cursor-not-allowed' : ''
                                                                    }`}
                                                                >
                                                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
                                                                </button>

                                                                {/* Edit Permissions button */}
                                                                {user.role === 'user' && (
                                                                    <button
                                                                        onClick={() => handleEditPermissions(user)}
                                                                        disabled={user.username === currentUsername}
                                                                        title="Chỉnh sửa quyền"
                                                                        className={`p-1.5 bg-amber-900/40 hover:bg-amber-800/80 text-amber-300 rounded-lg border border-amber-800 transition-colors duration-200 ${
                                                                            user.username === currentUsername ? 'opacity-40 cursor-not-allowed' : ''
                                                                        }`}
                                                                    >
                                                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
                                                                    </button>
                                                                )}

                                                                {/* Delete Account button */}
                                                                <button
                                                                    onClick={() => handleDeleteUser(user)}
                                                                    disabled={user.username === currentUsername}
                                                                    title="Xóa tài khoản vĩnh viễn"
                                                                    className={`p-1.5 bg-rose-950/40 hover:bg-rose-900 text-rose-400 rounded-lg border border-rose-900 transition-colors duration-200 ${
                                                                        user.username === currentUsername ? 'opacity-40 cursor-not-allowed' : ''
                                                                    }`}
                                                                >
                                                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                                                </button>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                ))
                                            ) : (
                                                <tr>
                                                    <td colSpan="6" className="text-center py-8 text-gray-500 font-semibold">
                                                        Không tìm thấy tài khoản phù hợp với bộ lọc.
                                                    </td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}

                        {!loading && activeTab === 'logs' && (
                            <div>
                                {/* Logs filter */}
                                <form onSubmit={handleLogSearchSubmit} className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                                    <div className="relative md:col-span-2">
                                        <input
                                            type="text"
                                            value={logSearch}
                                            onChange={(e) => setLogSearch(e.target.value)}
                                            placeholder="Tìm theo email, tên, hoạt động..."
                                            className="w-full pl-10 pr-16 py-2 bg-slate-800 text-white rounded-lg border border-slate-700 focus:outline-none focus:ring-2 focus:ring-red-500 placeholder-gray-500 text-sm shadow-inner"
                                        />
                                        <div className="absolute left-3 top-2.5 text-gray-500">
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                                        </div>
                                        <button 
                                            type="submit" 
                                            className="absolute right-2 top-1.5 px-3 py-1 bg-red-600 hover:bg-red-700 text-white text-xs font-vietnam font-bold rounded"
                                        >
                                            Tìm
                                        </button>
                                    </div>
                                    <div>
                                        <select
                                            value={logActionFilter}
                                            onChange={(e) => handleLogActionFilterChange(e.target.value)}
                                            className="w-full py-2 px-3 bg-slate-800 text-white rounded-lg border border-slate-700 focus:outline-none focus:ring-2 focus:ring-red-500 text-sm"
                                        >
                                            <option value="all">Tất cả hành động</option>
                                            <option value="Đăng nhập">Đăng nhập</option>
                                            <option value="Đăng ký">Đăng ký</option>
                                            <option value="Tạo đội bóng">Tạo đội bóng</option>
                                            <option value="Cập nhật đội bóng">Cập nhật đội bóng</option>
                                            <option value="Xóa đội bóng">Xóa đội bóng</option>
                                            <option value="Thêm cầu thủ">Thêm cầu thủ</option>
                                            <option value="Cập nhật cầu thủ">Cập nhật cầu thủ</option>
                                            <option value="Xóa cầu thủ">Xóa cầu thủ</option>
                                            <option value="Tạo mùa giải">Tạo mùa giải</option>
                                            <option value="Cập nhật mùa giải">Cập nhật mùa giải</option>
                                            <option value="Xóa mùa giải">Xóa mùa giải</option>
                                            <option value="Tạo lịch thi đấu">Tạo lịch thi đấu</option>
                                            <option value="Cập nhật trận đấu">Cập nhật trận đấu</option>
                                            <option value="Xóa trận đấu">Xóa trận đấu</option>
                                            <option value="Thay đổi quy định">Thay đổi quy định</option>
                                            <option value="Khóa tài khoản">Khóa tài khoản</option>
                                            <option value="Mở khóa tài khoản">Mở khóa tài khoản</option>
                                            <option value="Thay đổi vai trò">Thay đổi vai trò</option>
                                            <option value="Xóa tài khoản">Xóa tài khoản (Admin xóa)</option>
                                        </select>
                                    </div>
                                    <div className="flex items-center gap-2 justify-end">
                                        {(logSearch || logActionFilter !== 'all') && (
                                            <button
                                                type="button"
                                                onClick={clearLogFilters}
                                                className="px-3 py-1.5 text-xs text-red-400 hover:text-red-300 font-bold border border-red-900 rounded-lg hover:bg-red-950/20"
                                            >
                                                Đặt lại lọc
                                            </button>
                                        )}
                                        <span className="text-gray-400 text-sm font-semibold">Tìm thấy {logTotalItems} log</span>
                                    </div>
                                </form>

                                {/* Logs Table */}
                                <div className="overflow-x-auto rounded-xl border border-slate-800 mb-6">
                                    <table className="min-w-full divide-y divide-slate-850 text-left">
                                        <thead className="bg-slate-950/70 text-gray-400 text-xs uppercase tracking-wider font-semibold">
                                            <tr>
                                                <th className="px-6 py-4">Thời gian</th>
                                                <th className="px-6 py-4">Tài khoản</th>
                                                <th className="px-6 py-4">Hành động</th>
                                                <th className="px-6 py-4">Chi tiết thao tác</th>
                                                <th className="px-6 py-4">Địa chỉ IP</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-850 bg-slate-900/40 text-gray-200">
                                            {logs.length > 0 ? (
                                                logs.map((log) => (
                                                    <tr key={log._id} className="hover:bg-slate-800/45 transition-colors duration-150">
                                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">
                                                            {new Date(log.createdAt).toLocaleString('vi-VN')}
                                                        </td>
                                                        <td className="px-6 py-4">
                                                            <div className="text-sm font-bold text-white">{log.username}</div>
                                                            <div className="text-xs text-gray-400 font-medium">{log.email}</div>
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap">
                                                            <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                                                                log.action.includes('Khóa') || log.action.includes('Xóa')
                                                                    ? 'bg-rose-950 text-rose-300 border border-rose-900'
                                                                    : log.action.includes('Tạo') || log.action.includes('Thêm') || log.action.includes('Mở')
                                                                        ? 'bg-emerald-950 text-emerald-300 border border-emerald-900'
                                                                        : log.action.includes('Đăng nhập')
                                                                            ? 'bg-blue-950 text-blue-300 border border-blue-900'
                                                                            : 'bg-amber-950 text-amber-300 border border-amber-900'
                                                            }`}>
                                                                {log.action}
                                                            </span>
                                                        </td>
                                                        <td className="px-6 py-4 text-sm text-gray-300 font-vietnam leading-relaxed max-w-md">
                                                            {log.details || 'Không có chi tiết'}
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap text-xs text-gray-500 font-mono">
                                                            {log.ipAddress || 'Không có'}
                                                        </td>
                                                    </tr>
                                                ))
                                            ) : (
                                                <tr>
                                                    <td colSpan="5" className="text-center py-8 text-gray-500 font-semibold">
                                                        Không tìm thấy lịch sử thao tác nào.
                                                    </td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>

                                {/* Pagination controls */}
                                {logTotalPages > 1 && (
                                    <div className="flex justify-between items-center bg-slate-950/40 p-4 rounded-xl border border-slate-800">
                                        <button
                                            onClick={() => handlePageChange(logPage - 1)}
                                            disabled={logPage === 1}
                                            className="px-4 py-2 text-sm bg-slate-800 text-white rounded-lg hover:bg-slate-700 disabled:opacity-40 disabled:hover:bg-slate-800 font-bold transition-all duration-200"
                                        >
                                            Trang trước
                                        </button>
                                        <span className="text-gray-400 font-semibold text-sm">
                                            Trang {logPage} / {logTotalPages}
                                        </span>
                                        <button
                                            onClick={() => handlePageChange(logPage + 1)}
                                            disabled={logPage === logTotalPages}
                                            className="px-4 py-2 text-sm bg-slate-800 text-white rounded-lg hover:bg-slate-700 disabled:opacity-40 disabled:hover:bg-slate-800 font-bold transition-all duration-200"
                                        >
                                            Trang sau
                                        </button>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
                
                {/* Permissions Modal */}
                {editingPermissionsUser && (
                    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in">
                        <div className="bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl w-full max-w-md p-6 animate-bounce-in">
                            <h3 className="text-xl font-bold text-white mb-2">Phân Quyền</h3>
                            <p className="text-gray-400 text-sm mb-6">Tài khoản: <span className="text-white font-semibold">{editingPermissionsUser.username}</span></p>
                            
                            <div className="space-y-4 mb-8">
                                {[
                                    { id: 'manage_seasons', label: 'Quản lý Mùa giải' },
                                    { id: 'manage_teams', label: 'Quản lý Đội bóng' },
                                    { id: 'manage_players', label: 'Quản lý Cầu thủ' },
                                    { id: 'manage_matches', label: 'Quản lý Trận đấu' },
                                    { id: 'manage_regulations', label: 'Quản lý Quy định' }
                                ].map(perm => (
                                    <label key={perm.id} className="flex items-center gap-3 p-3 rounded-xl border border-slate-700 hover:bg-slate-800/50 cursor-pointer transition-colors">
                                        <div className="relative flex items-center">
                                            <input 
                                                type="checkbox" 
                                                className="sr-only peer"
                                                checked={tempPermissions.includes(perm.id)}
                                                onChange={() => togglePermission(perm.id)}
                                            />
                                            <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-red-600"></div>
                                        </div>
                                        <span className="text-gray-200 font-medium">{perm.label}</span>
                                    </label>
                                ))}
                            </div>

                            <div className="flex gap-3 justify-end">
                                <button 
                                    onClick={() => setEditingPermissionsUser(null)}
                                    className="px-5 py-2.5 text-gray-300 bg-slate-800 hover:bg-slate-700 rounded-xl font-medium transition-colors"
                                >
                                    Hủy
                                </button>
                                <button 
                                    onClick={handleSavePermissions}
                                    className="px-5 py-2.5 text-white bg-red-600 hover:bg-red-700 rounded-xl font-bold transition-colors shadow-lg hover:shadow-red-500/25"
                                >
                                    Lưu Quyền
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AccountManagement;
