import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Seasons from '../components/Seasons';
import SeasonForm from '../components/SeasonForm';

const SeasonsPage = ({ token }) => {
    const isAdmin = localStorage.getItem('role') === 'admin' || JSON.parse(localStorage.getItem('permissions') || '[]').includes('manage_seasons');
    const [seasons, setSeasons] = useState([]);
    const [showForm, setShowForm] = useState(false);
    const [editingSeason, setEditingSeason] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const fetchSeasons = async () => {
        setLoading(true);
        setError('');
        try {
            const response = await axios.get('http://localhost:5000/api/seasons');
            setSeasons(response.data.data);
        } catch (err) {
            setError('Không thể tải danh sách mùa giải. Vui lòng thử lại.');
            console.error("Fetch seasons error:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchSeasons();
    }, []);

    const handleEdit = (season) => {
        setEditingSeason(season);
        setShowForm(true);
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Bạn có chắc chắn muốn xóa mùa giải này? Mọi dữ liệu liên quan (đội bóng, trận đấu, kết quả,...) sẽ bị xóa vĩnh viễn.')) {
            return null;
        }
        try {
            await axios.delete(`http://localhost:5000/api/seasons/${id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setSuccess('Xóa mùa giải thành công!');
            setTimeout(() => setSuccess(''), 4000);
            fetchSeasons();
            return true;
        } catch (err) {
            setError(err.response?.data?.message || 'Không thể xóa mùa giải. Có thể mùa giải này đang được sử dụng.');
            console.error("Delete season error:", err);
            return false;
        }
    };

    const handleFormSuccess = () => {
        setShowForm(false);
        setEditingSeason(null);
        setSuccess(editingSeason ? 'Cập nhật mùa giải thành công!' : 'Thêm mùa giải thành công!');
        setTimeout(() => setSuccess(''), 4000);
        fetchSeasons();
    };

    return (
        <div className="min-h-screen animate-fade-in">
            {/* Toast notifications */}
            {success && <div className="toast toast-success">✅ {success}</div>}
            {error && !showForm && <div className="toast toast-error">❌ {error}</div>}

            {showForm ? (
                <div className="animate-scale-in">
                    <SeasonForm
                        editingSeason={editingSeason}
                        setEditingSeason={setEditingSeason}
                        setShowForm={setShowForm}
                        onSuccess={handleFormSuccess}
                        token={token}
                    />
                </div>
            ) : (
                <div className="bg-slate-900/60 backdrop-blur-xl border border-white/10 rounded-3xl shadow-[0_10px_30px_rgba(0,0,0,0.2)] overflow-hidden">
                    {/* Header */}
                    <div className="relative overflow-hidden rounded-t-3xl">
                        <div className="absolute inset-0 bg-cover bg-center opacity-30" style={{ backgroundImage: `url('https://i.pinimg.com/736x/4d/39/eb/4d39eb4cfbea4eaf05f6a98e9bf85dbc.jpg')` }} />
                        <div className="absolute inset-0 bg-gradient-to-r from-red-900/90 via-slate-900/80 to-slate-900/90" />
                        <div className="relative z-10 px-6 py-8 md:py-10 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 border-b border-white/5">
                            <div>
                                <h1 className="text-3xl md:text-4xl font-heading font-black text-white tracking-tight mb-1 drop-shadow-md">
                                    📅 Quản lý Mùa Giải
                                </h1>
                                <p className="text-gray-300 text-sm">
                                    {seasons.length > 0 ? `${seasons.length} mùa giải` : 'Chưa có mùa giải nào'}
                                </p>
                            </div>
                            {token && isAdmin && (
                                <button
                                    onClick={() => { setEditingSeason(null); setShowForm(true); }}
                                    className="bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white font-semibold py-2.5 px-5 rounded-xl shadow-lg hover:shadow-xl hover-glow transition-all duration-300 flex items-center gap-2"
                                >
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                                    Thêm mùa giải
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Content */}
                    <div className="p-4 md:p-6">
                        {loading ? (
                            <div className="flex flex-col items-center justify-center py-16 gap-3">
                                <div className="animate-spin rounded-full h-10 w-10 border-4 border-red-200 border-t-red-600" />
                                <p className="text-gray-500 text-sm">Đang tải mùa giải...</p>
                            </div>
                        ) : error ? (
                            <div className="bg-red-50 border border-red-200 text-red-600 p-4 rounded-xl text-center shadow-sm">
                                {error}
                            </div>
                        ) : (
                            <Seasons
                                seasons={seasons}
                                handleEdit={handleEdit}
                                handleDelete={handleDelete}
                                token={token}
                            />
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default SeasonsPage;