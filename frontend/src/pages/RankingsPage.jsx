import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Rankings from '../components/Rankings';

const RankingsPage = ({ token }) => {
    const [seasons, setSeasons] = useState([]);
    const [selectedSeasonId, setSelectedSeasonId] = useState(() => localStorage.getItem('lastSelectedSeason') || null);
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchSeasons = async (retryCount = 1) => {
            setLoading(true);
            setError(null);
            try {
                const config = token ? { headers: { Authorization: `Bearer ${token}` } } : {};
                const response = await axios.get('http://localhost:5000/api/seasons', config);
                const isSuccess = response.data.success === true || response.data.status === 'success';
                if (!isSuccess || !Array.isArray(response.data.data)) {
                    throw new Error('Dữ liệu mùa giải không hợp lệ.');
                }
                const allSeasons = response.data.data;
                setSeasons(allSeasons);
                if (allSeasons.length > 0 && !localStorage.getItem('lastSelectedSeason')) {
                    setSelectedSeasonId(allSeasons[0]._id);
                } else if (allSeasons.length === 0) {
                    setError('Không có mùa giải nào.');
                }
            } catch (err) {
                console.error('Lỗi khi lấy danh sách mùa giải:', err);
                if (retryCount > 0) {
                    setTimeout(() => fetchSeasons(retryCount - 1), 2000);
                    return;
                }
                setError(
                    err.response?.status === 401
                        ? 'Không có quyền truy cập. Vui lòng đăng nhập lại.'
                        : `Không thể tải danh sách mùa giải: ${err.message}`
                );
            } finally {
                setLoading(false);
            }
        };
        fetchSeasons();
    }, [token]);

    const handleSetSelectedSeason = (id) => {
        if (id) {
            localStorage.setItem('lastSelectedSeason', id);
        } else {
            localStorage.removeItem('lastSelectedSeason');
        }
        setSelectedSeasonId(id);
    };

    const formatDate = (dateString) => {
        if (!dateString) return 'Không xác định';
        const date = new Date(dateString);
        return isNaN(date) ? 'Ngày không hợp lệ' : date.toLocaleDateString('vi-VN');
    };

    const selectedSeasonName = seasons.find(season => season._id === selectedSeasonId)?.season_name || '';

    if (loading) {
        return (
            <div className="min-h-[60vh] flex flex-col items-center justify-center gap-3">
                <div className="animate-spin rounded-full h-10 w-10 border-4 border-red-200 border-t-red-600" />
                <p className="text-gray-400 text-sm">Đang tải bảng xếp hạng...</p>
            </div>
        );
    }

    return (
        <div className="min-h-screen animate-fade-in">
            {/* Header */}
            <div className="bg-slate-900/60 backdrop-blur-xl border border-white/10 rounded-3xl shadow-[0_10px_30px_rgba(0,0,0,0.2)] overflow-hidden mb-8">
                <div className="relative overflow-hidden rounded-t-3xl">
                    <div className="absolute inset-0 bg-cover bg-center opacity-30"
                        style={{ backgroundImage: 'linear-gradient(rgba(0,0,0,0.5), rgba(0,0,0,0.5)), url(https://as2.ftcdn.net/v2/jpg/10/71/13/17/1000_F_1071131715_3c5mFvqcKnMC42oDNuLZkz2R902E7dC4.jpg)' }} />
                    <div className="absolute inset-0 bg-gradient-to-r from-red-900/90 via-slate-900/80 to-slate-900/90" />
                    <div className="relative z-10 px-6 py-10 md:py-14 text-center border-b border-white/5">
                        <h1 className="text-3xl sm:text-4xl md:text-5xl font-heading font-black text-white tracking-tight drop-shadow-md">
                            📊 Bảng Xếp Hạng
                        </h1>
                        {selectedSeasonName && (
                            <p className="text-lg text-gray-300 mt-2 font-medium">{selectedSeasonName}</p>
                        )}
                    </div>
                </div>
            </div>

            {/* Error */}
            {error && (
                <div className="bg-red-50 border border-red-200 text-red-600 p-4 rounded-xl text-center shadow-sm mb-6 animate-fade-in">
                    {error}
                </div>
            )}

            {/* Rankings Component */}
            <div className="bg-slate-900/60 backdrop-blur-xl border border-white/10 rounded-3xl shadow-[0_10px_30px_rgba(0,0,0,0.2)] p-4 md:p-6">
                <Rankings
                    seasonId={selectedSeasonId}
                    token={token}
                    seasons={seasons}
                    formatDate={formatDate}
                    setSelectedSeasonId={handleSetSelectedSeason}
                />
            </div>
        </div>
    );
};

export default RankingsPage;