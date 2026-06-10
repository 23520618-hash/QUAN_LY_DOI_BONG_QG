import React, { useState, useEffect } from 'react';
import axios from 'axios';

const Teams = ({ onEdit, token, selectedSeason, refreshKey, setPageError, setPageSuccess }) => {
    const isAdmin = localStorage.getItem('role') === 'admin' || JSON.parse(localStorage.getItem('permissions') || '[]').includes('manage_teams');
    const [teams, setTeams] = useState([]);
    const [loading, setLoading] = useState(true);
    const [deletingId, setDeletingId] = useState(null);

    useEffect(() => {
        const fetchTeams = async () => {
            if (!selectedSeason) {
                setTeams([]);
                setLoading(false);
                return;
            }
            setLoading(true);
            setPageError('');
            try {
                const response = await axios.get(`http://localhost:5000/api/teams/seasons/${selectedSeason}`);
                setTeams(response.data.data || []);
            } catch (err) {
                setPageError(err.response?.data?.message || 'Không thể tải danh sách đội bóng.');
                setTeams([]);
            } finally {
                setLoading(false);
            }
        };
        fetchTeams();
    }, [selectedSeason, refreshKey, setPageError]);

    const handleDelete = async (id) => {
        if (!window.confirm('Bạn có chắc chắn muốn xóa đội bóng này? Tất cả dữ liệu liên quan (cầu thủ, trận đấu, kết quả,...) của đội trong mùa giải này sẽ bị xóa vĩnh viễn và không thể khôi phục.')) {
            return;
        }
        setDeletingId(id);
        setPageError('');
        try {
            await axios.delete(`http://localhost:5000/api/teams/${id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setPageSuccess('Xóa đội bóng thành công. Dữ liệu mùa giải đang được tính toán lại.');
            setTeams(teams.filter((team) => team._id !== id));
        } catch (err) {
            setPageError(err.response?.data?.message || 'Không thể xóa đội bóng. Vui lòng thử lại.');
        } finally {
            setDeletingId(null);
        }
    };

    const handleKeepConflict = async (team) => {
        try {
            await axios.put(`http://localhost:5000/api/teams/${team._id}`, { is_conflicting: false, conflict_reason: '' }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setTeams(teams.map((t) => t._id === team._id ? { ...t, is_conflicting: false, conflict_reason: '' } : t));
            if (setPageSuccess) setPageSuccess('Đã giữ lại thông tin đội bóng.');
        } catch (err) {
            if (setPageError) setPageError('Lỗi khi giữ lại thông tin đội bóng: ' + (err.response?.data?.message || err.message));
        }
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center py-16 gap-3">
                <div className="animate-spin rounded-full h-10 w-10 border-4 border-red-200 border-t-red-600" />
                <p className="text-gray-400 text-sm">Đang tải đội bóng...</p>
            </div>
        );
    }

    return (
        <div className="p-2">
            {teams.length === 0 ? (
                <div className="text-center py-16">
                    <span className="text-5xl mb-4 block">🏟</span>
                    <p className="text-gray-500 text-lg font-medium">Không có đội bóng nào</p>
                    <p className="text-gray-400 text-sm mt-1">Hãy chọn mùa giải hoặc thêm đội bóng mới.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
                    {teams.map((team, i) => {
                        if (team.is_conflicting && (!token || !isAdmin)) return null;
                        return (
                        <div key={team._id}
                            className={`group bg-white border border-gray-100 rounded-2xl shadow-card p-5 flex flex-col items-center justify-between hover-lift stagger-item relative ${team.is_conflicting ? 'opacity-50 ring-2 ring-red-500' : ''}`}
                            style={{ animationDelay: `${i * 60}ms` }}
                        >
                            {team.is_conflicting && isAdmin && (
                                <div className="absolute top-0 left-0 bg-red-100 text-red-600 px-2 py-1 text-[10px] font-bold rounded-br-lg z-10 w-full text-center">
                                    Xung đột: {team.conflict_reason}
                                </div>
                            )}
                            <div className="flex-grow flex flex-col items-center mt-3">
                                <div className="w-20 h-20 rounded-full bg-gray-50 border-2 border-gray-100 flex items-center justify-center mb-3 overflow-hidden group-hover:scale-105 group-hover:border-red-500/20 shadow-sm transition-all duration-300">
                                    <img
                                        src={team.logo?.startsWith('http') || team.logo?.startsWith('/') ? team.logo : `/images/teams_logo/${team.logo}`}
                                        alt={`${team.team_name} logo`}
                                        className="w-16 h-16 object-contain"
                                        onError={(e) => (e.target.src = 'https://th.bing.com/th/id/OIP.dSoxOf16Bt30Ntp4xXxg6gAAAA?rs=1&pid=ImgDetMain')}
                                    />
                                </div>
                                <h3 className="text-base font-bold text-center text-gray-800 mb-1 group-hover:text-red-700 transition-colors">{team.team_name}</h3>
                                <div className="space-y-0.5 text-center">
                                    <p className="text-xs text-gray-500 flex items-center gap-1 justify-center">
                                        <span>🏟</span> {team.stadium || 'N/A'}
                                    </p>
                                    <p className="text-xs text-gray-500 flex items-center gap-1 justify-center">
                                        <span>👔</span> {team.coach || 'N/A'}
                                    </p>
                                    <p className="text-xs font-semibold text-red-600 flex items-center gap-1 justify-center bg-red-50 rounded-full px-2 py-0.5 mt-1">
                                        <span>👥</span> {team.playerCount ?? 0} cầu thủ
                                    </p>
                                </div>
                            </div>
                            {token && onEdit && isAdmin && (
                                <div className="mt-4 pt-3 border-t border-gray-100 w-full flex justify-center gap-2">
                                    {deletingId === team._id ? (
                                        <div className="flex items-center justify-center h-8 w-full">
                                            <div className="animate-spin rounded-full h-5 w-5 border-2 border-gray-300 border-t-gray-700" />
                                        </div>
                                    ) : (
                                        <div className="flex flex-wrap gap-y-2 justify-center w-full space-x-2">
                                            {team.is_conflicting && (
                                                <button
                                                    onClick={() => handleKeepConflict(team)}
                                                    className="bg-green-500 hover:bg-green-600 text-white p-1.5 px-3 rounded-lg shadow-sm transition-colors mb-1 w-full text-sm"
                                                    title="Giữ lại"
                                                >
                                                    Giữ lại
                                                </button>
                                            )}
                                            <button
                                                onClick={() => onEdit(team)}
                                                className="bg-gray-100 hover:bg-red-50 text-gray-600 hover:text-red-600 p-1.5 rounded-lg transition-colors"
                                                title="Sửa"
                                            >
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                                            </button>
                                            <button
                                                onClick={() => handleDelete(team._id)}
                                                className="bg-gray-100 hover:bg-red-50 text-gray-600 hover:text-red-600 p-1.5 rounded-lg transition-colors"
                                                title="Xóa"
                                            >
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                            </button>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    );})}
                </div>
            )}
        </div>
    );
};

export default Teams;