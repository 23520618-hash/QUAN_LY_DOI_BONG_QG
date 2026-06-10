import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Teams from '../components/Teams';
import TeamForm from '../components/TeamForm';

const TeamsPage = ({ token }) => {
    const [showForm, setShowForm] = useState(false);
    const [editingTeam, setEditingTeam] = useState(null);
    const [seasons, setSeasons] = useState([]);
    const [selectedSeason, setSelectedSeason] = useState(() => localStorage.getItem('lastSelectedSeason') || '');
    const [refreshKey, setRefreshKey] = useState(0);
    const [pageError, setPageError] = useState('');
    const [pageSuccess, setPageSuccess] = useState('');

    const showMessage = (setter, message) => {
        setter(message);
        setTimeout(() => setter(''), 4000);
    };

    useEffect(() => {
        const fetchSeasons = async () => {
            try {
                const response = await axios.get('http://localhost:5000/api/seasons');
                const allSeasons = response.data.data || [];
                setSeasons(allSeasons);
                if (allSeasons.length > 0 && !localStorage.getItem('lastSelectedSeason')) {
                    setSelectedSeason(allSeasons[0]._id);
                }
            } catch (err) {
                console.error('Không thể tải danh sách mùa giải', err);
                showMessage(setPageError, 'Không thể tải danh sách mùa giải.');
            }
        };
        fetchSeasons();
    }, []);

    useEffect(() => {
        if (selectedSeason) {
            localStorage.setItem('lastSelectedSeason', selectedSeason);
        }
    }, [selectedSeason]);

    const handleFormSuccess = () => {
        setShowForm(false);
        setEditingTeam(null);
        showMessage(setPageSuccess, editingTeam ? 'Cập nhật đội bóng thành công!' : 'Thêm đội bóng thành công!');
        setRefreshKey(prevKey => prevKey + 1);
    };

    const isAdmin = localStorage.getItem('role') === 'admin' || JSON.parse(localStorage.getItem('permissions') || '[]').includes('manage_teams');

    const handleEditClick = (team) => {
        setEditingTeam(team);
        setShowForm(true);
        setPageError('');
        setPageSuccess('');
    };

    return (
        <div className="min-h-screen animate-fade-in">
            {/* Toast notifications */}
            {pageSuccess && (
                <div className="toast toast-success">
                    ✅ {pageSuccess}
                </div>
            )}
            {pageError && (
                <div className="toast toast-error">
                    ❌ {pageError}
                </div>
            )}

            {showForm ? (
                <div className="animate-scale-in">
                    <TeamForm
                        editingTeam={editingTeam}
                        setEditingTeam={setEditingTeam}
                        setShowForm={setShowForm}
                        onSuccess={handleFormSuccess}
                        token={token}
                        seasons={seasons}
                    />
                </div>
            ) : (
                <div className="bg-slate-900/60 backdrop-blur-xl border border-white/10 rounded-3xl shadow-[0_10px_30px_rgba(0,0,0,0.2)] overflow-hidden animate-fade-in">
                    {/* Header */}
                    <div className="relative overflow-hidden rounded-t-3xl">
                        <div className="absolute inset-0 bg-cover bg-center opacity-30" style={{ backgroundImage: 'url(https://i.pinimg.com/736x/e7/b2/85/e7b2855a88a7e8ccd29a30a43333e6af.jpg)' }} />
                        <div className="absolute inset-0 bg-gradient-to-r from-red-900/90 via-slate-900/80 to-slate-900/90" />
                        <div className="relative z-10 px-6 py-8 md:py-10 border-b border-white/5">
                            <h1 className="text-3xl md:text-4xl font-heading font-black text-white tracking-tight mb-1 drop-shadow-md">
                                ⚽ Danh sách đội bóng
                            </h1>
                            <p className="text-gray-300 text-sm mb-6">Quản lý thông tin các đội bóng trong giải đấu</p>

                            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
                                <div>
                                    <label htmlFor="seasonSelect" className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">
                                        Mùa giải
                                    </label>
                                    <select
                                        id="seasonSelect"
                                        value={selectedSeason}
                                        onChange={(e) => setSelectedSeason(e.target.value)}
                                        className="bg-slate-800/80 backdrop-blur-md border border-white/10 rounded-xl px-4 py-2.5 text-white font-medium focus:ring-2 focus:ring-red-500 focus-glow shadow-inner min-w-[200px]"
                                    >
                                        <option value="">-- Chọn mùa giải --</option>
                                        {seasons.map((season) => (
                                            <option key={season._id} value={season._id}>
                                                {season.season_name}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                {token && isAdmin && (
                                    <button
                                        onClick={() => { setEditingTeam(null); setShowForm(true); setPageError(''); setPageSuccess(''); }}
                                        className="bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white font-semibold py-2.5 px-5 rounded-xl shadow-lg hover:shadow-xl hover-glow transition-all duration-300 flex items-center gap-2"
                                    >
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                                        Thêm đội bóng
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Content */}
                    <div className="p-4 md:p-6">
                        <Teams
                            onEdit={handleEditClick}
                            token={token}
                            selectedSeason={selectedSeason}
                            refreshKey={refreshKey}
                            setPageError={setPageError}
                            setPageSuccess={showMessage.bind(null, setPageSuccess)}
                        />
                    </div>
                </div>
            )}
        </div>
    );
};

export default TeamsPage;