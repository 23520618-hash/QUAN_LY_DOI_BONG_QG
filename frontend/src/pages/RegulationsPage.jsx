// frontend/src/pages/RegulationsPage.jsx

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Regulations from '../components/Regulations';
import RegulationForm from '../components/RegulationForm';

const RegulationsPage = ({ token }) => {
    const isAdmin = localStorage.getItem('role') === 'admin' || JSON.parse(localStorage.getItem('permissions') || '[]').includes('manage_regulations');
    const [showForm, setShowForm] = useState(false);
    const [editingRegulation, setEditingRegulation] = useState(null);
    const [seasons, setSeasons] = useState([]);
    const [selectedSeasonId, setSelectedSeasonId] = useState(() => localStorage.getItem('lastSelectedSeason') || '');
    const [refreshKey, setRefreshKey] = useState(0);
    const [pageError, setPageError] = useState('');
    const [pageSuccess, setPageSuccess] = useState('');

    useEffect(() => {
        const fetchSeasons = async () => {
            try {
                const seasonsRes = await axios.get('http://localhost:5000/api/seasons');
                const seasonsData = seasonsRes.data.data || [];
                setSeasons(seasonsData);

                const storedSeasonId = localStorage.getItem('lastSelectedSeason');
                const storedSeasonIsValid = storedSeasonId && seasonsData.some(s => s._id === storedSeasonId);

                if (storedSeasonIsValid) {
                    setSelectedSeasonId(storedSeasonId);
                } else if (seasonsData.length > 0) {
                    const defaultSeason = seasonsData[0]._id;
                    setSelectedSeasonId(defaultSeason);
                    localStorage.setItem('lastSelectedSeason', defaultSeason);
                }
            } catch (err) {
                console.error('Không thể tải danh sách mùa giải', err);
                setPageError('Lỗi: Không thể tải danh sách mùa giải.');
            }
        };
        fetchSeasons();
    }, []);

    const handleSeasonChange = (seasonId) => {
        setSelectedSeasonId(seasonId);
        if (seasonId) {
            localStorage.setItem('lastSelectedSeason', seasonId);
        } else {
            localStorage.removeItem('lastSelectedSeason');
        }
    };

    const handleFormSuccess = () => {
        setShowForm(false);
        setEditingRegulation(null);
        setRefreshKey(prevKey => prevKey + 1);
        setPageSuccess(editingRegulation ? 'Cập nhật quy định thành công!' : 'Thêm quy định thành công!');
        setTimeout(() => setPageSuccess(''), 4000);
    };

    const handleEditClick = (regulation) => {
        setEditingRegulation(regulation);
        setShowForm(true);
    };

    const handleDeleteClick = async (id) => {
        if (!window.confirm('Bạn có chắc chắn muốn xóa quy định này không?')) {
            return false;
        }
        try {
            await axios.delete(`http://localhost:5000/api/regulations/${id}`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            setRefreshKey(prevKey => prevKey + 1);
            setPageSuccess('Xóa quy định thành công!');
            setTimeout(() => setPageSuccess(''), 4000);
            return true;
        } catch (err) {
            setPageError(err.response?.data?.message || 'Không thể xóa quy định. Vui lòng thử lại.');
            return false;
        }
    };

    return (
        <div className="min-h-screen animate-fade-in">
            {/* Toast notifications */}
            {pageSuccess && <div className="toast toast-success">✅ {pageSuccess}</div>}
            {pageError && !showForm && <div className="toast toast-error">❌ {pageError}</div>}

            {showForm ? (
                <div className="animate-scale-in">
                    <RegulationForm
                        editingRegulation={editingRegulation}
                        token={token}
                        seasons={seasons}
                        selectedSeasonId={selectedSeasonId}
                        onSuccess={handleFormSuccess}
                        setShowForm={setShowForm}
                        setEditingRegulation={setEditingRegulation}
                    />
                </div>
            ) : (
                <div className="bg-slate-900/60 backdrop-blur-xl border border-white/10 rounded-3xl shadow-[0_10px_30px_rgba(0,0,0,0.2)] overflow-hidden">
                    {/* Header */}
                    <div className="relative overflow-hidden rounded-t-3xl">
                        <div className="absolute inset-0 bg-cover bg-center opacity-30" style={{ backgroundImage: 'url(https://i.pinimg.com/736x/cd/07/2b/cd072bdf8a259e2d064fbb291a4456e8.jpg)' }} />
                        <div className="absolute inset-0 bg-gradient-to-r from-red-900/90 via-slate-900/80 to-slate-900/90" />
                        <div className="relative z-10 px-6 py-8 md:py-10 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 border-b border-white/5">
                            <div>
                                <h1 className="text-3xl md:text-4xl font-heading font-black text-white tracking-tight mb-1 drop-shadow-md">
                                    📜 Quy Định Giải Đấu
                                </h1>
                                <p className="text-gray-300 text-sm">Quản lý các quy định thi đấu theo mùa giải</p>
                            </div>
                            {token && isAdmin && (
                                <button
                                    onClick={() => { setEditingRegulation(null); setShowForm(true); }}
                                    className="bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white font-semibold py-2.5 px-5 rounded-xl shadow-lg hover:shadow-xl hover-glow transition-all duration-300 flex items-center gap-2"
                                >
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                                    Thêm quy định
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Content */}
                    <div className="p-4 md:p-6">
                        {/* Season Selector */}
                        <div className="mb-6">
                            <label htmlFor="page-season-select" className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">
                                Xem quy định cho mùa giải
                            </label>
                            <select
                                id="page-season-select"
                                value={selectedSeasonId}
                                onChange={(e) => handleSeasonChange(e.target.value)}
                                className="bg-slate-800/80 backdrop-blur-md border border-white/10 rounded-xl px-4 py-2.5 text-white font-medium focus:ring-2 focus:ring-red-500 focus-glow shadow-inner min-w-[200px]"
                            >
                                <option value="">Chọn mùa giải</option>
                                {seasons.map((season) => (
                                    <option key={season._id} value={season._id}>
                                        {season.season_name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <Regulations
                            onEdit={handleEditClick}
                            onDelete={handleDeleteClick}
                            token={token}
                            selectedSeasonId={selectedSeasonId}
                            seasons={seasons}
                            refreshKey={refreshKey}
                        />
                    </div>
                </div>
            )}
        </div>
    );
};

export default RegulationsPage;