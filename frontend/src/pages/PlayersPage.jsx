import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Players from '../components/Players';
import PlayerForm from '../components/PlayerForm';
import { MagnifyingGlassIcon } from '@heroicons/react/24/outline';

const PlayersPage = ({ token }) => {
    const isAdmin = localStorage.getItem('role') === 'admin' || JSON.parse(localStorage.getItem('permissions') || '[]').includes('manage_players');
    const [showForm, setShowForm] = useState(false);
    const [editingPlayer, setEditingPlayer] = useState(null);
    const [allPlayers, setAllPlayers] = useState([]);
    const [filteredPlayers, setFilteredPlayers] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [success, setSuccess] = useState('');
    const [error, setError] = useState('');
    const [seasons, setSeasons] = useState([]);
    const [selectedSeason, setSelectedSeason] = useState(() => localStorage.getItem('lastSelectedSeason') || '');
    const [loading, setLoading] = useState(true);

    const handleSuccess = (message) => {
        setSuccess(message);
        setTimeout(() => setSuccess(''), 4000);
    };

    const handleFormSuccess = () => {
        setShowForm(false);
        setEditingPlayer(null);
        handleSuccess(editingPlayer ? 'Cập nhật cầu thủ thành công!' : 'Thêm cầu thủ và các bản ghi liên quan thành công!');
        fetchPlayersForSeason(selectedSeason);
    };

    const handleAddPlayerClick = () => {
        setEditingPlayer(null);
        setShowForm(true);
        setError('');
        setSuccess('');
    };

    useEffect(() => {
        const fetchSeasons = async () => {
            try {
                const response = await axios.get('http://localhost:5000/api/seasons');
                const seasonsData = response.data.data || [];
                setSeasons(seasonsData);
                if (seasonsData.length > 0 && !localStorage.getItem('lastSelectedSeason')) {
                    setSelectedSeason(seasonsData[0]._id);
                }
            } catch (err) {
                setError('Không thể tải danh sách mùa giải.');
            }
        };
        fetchSeasons();
    }, []);

    const fetchPlayersForSeason = async (seasonId) => {
        if (!seasonId) {
            setLoading(false);
            setAllPlayers([]);
            return;
        }
        setLoading(true);
        setError('');
        try {
            const teamsResponse = await axios.get(`http://localhost:5000/api/teams/seasons/${seasonId}`);
            const teamsInSeason = teamsResponse.data.data || [];
            const teamIds = new Set(teamsInSeason.map(t => t._id));
            const allPlayersResponse = await axios.get(`http://localhost:5000/api/players`);
            const fetchedPlayers = allPlayersResponse.data.data || [];
            const playersForSeason = fetchedPlayers.filter(p => teamIds.has(p.team_id?._id || p.team_id));
            setAllPlayers(playersForSeason);
        } catch (err) {
            setError('Không thể tải danh sách cầu thủ cho mùa giải này.');
            setAllPlayers([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPlayersForSeason(selectedSeason);
        if (selectedSeason) {
            localStorage.setItem('lastSelectedSeason', selectedSeason);
        }
    }, [selectedSeason]);

    useEffect(() => {
        if (!searchTerm) {
            setFilteredPlayers(allPlayers);
        } else {
            const lowercasedFilter = searchTerm.toLowerCase();
            const filteredData = allPlayers.filter(player =>
                player.name.toLowerCase().includes(lowercasedFilter)
            );
            setFilteredPlayers(filteredData);
        }
    }, [searchTerm, allPlayers]);

    return (
        <div className="min-h-screen animate-fade-in">
            {/* Toast notifications */}
            {success && <div className="toast toast-success">✅ {success}</div>}
            {error && !showForm && <div className="toast toast-error">❌ {error}</div>}

            {showForm ? (
                <div className="animate-scale-in">
                    <PlayerForm
                        editingPlayer={editingPlayer}
                        setEditingPlayer={setEditingPlayer}
                        setShowForm={setShowForm}
                        token={token}
                        onSuccess={handleFormSuccess}
                    />
                </div>
            ) : (
                <>
                    {/* Header Card */}
                    <div className="bg-slate-900/60 backdrop-blur-xl border border-white/10 rounded-3xl shadow-[0_10px_30px_rgba(0,0,0,0.2)] overflow-hidden mb-8">
                        <div className="relative overflow-hidden rounded-t-3xl">
                            <div className="absolute inset-0 bg-cover bg-center opacity-30" style={{ backgroundImage: `url('https://cdn.pixabay.com/photo/2023/04/01/22/10/goalkeeper-7893178_1280.jpg')` }} />
                            <div className="absolute inset-0 bg-gradient-to-r from-red-900/90 via-slate-900/80 to-slate-900/90" />
                            <div className="relative z-10 px-6 py-8 md:py-10 border-b border-white/5">
                                <h1 className="text-3xl md:text-4xl font-heading font-black text-white tracking-tight mb-1 drop-shadow-md">
                                    🏃 Danh sách cầu thủ
                                </h1>
                                <p className="text-gray-300 text-sm mb-6">
                                    {allPlayers.length > 0 ? `${allPlayers.length} cầu thủ` : 'Chọn mùa giải để xem cầu thủ'}
                                </p>

                                <div className="flex flex-col md:flex-row md:items-end gap-4">
                                    {/* Season Filter */}
                                    <div>
                                        <label htmlFor="season-select" className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">
                                            Mùa giải
                                        </label>
                                        <select
                                            id="season-select"
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

                                    {/* Search */}
                                    <div className="flex-1 max-w-sm">
                                        <label htmlFor="player-search" className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">
                                            Tìm kiếm
                                        </label>
                                        <div className="relative">
                                            <MagnifyingGlassIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                                            <input
                                                id="player-search"
                                                type="text"
                                                placeholder="Nhập tên cầu thủ..."
                                                value={searchTerm}
                                                onChange={(e) => setSearchTerm(e.target.value)}
                                                className="w-full pl-10 pr-4 py-2.5 bg-slate-800/80 backdrop-blur-md border border-white/10 rounded-xl text-white focus:ring-2 focus:ring-red-500 focus-glow shadow-inner placeholder-gray-500"
                                            />
                                        </div>
                                    </div>

                                    {/* Add button */}
                                    {token && isAdmin && (
                                        <button
                                            onClick={handleAddPlayerClick}
                                            className="bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white font-semibold py-2.5 px-5 rounded-xl shadow-lg hover:shadow-xl hover-glow transition-all duration-300 flex items-center gap-2 whitespace-nowrap animate-fade-in"
                                        >
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                                            Thêm cầu thủ
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Players List */}
                    <Players
                        setEditingPlayer={setEditingPlayer}
                        setShowForm={setShowForm}
                        players={filteredPlayers}
                        token={token}
                        setError={setError}
                        handleSuccess={handleSuccess}
                        loading={loading}
                        setAllPlayers={setAllPlayers}
                    />
                </>
            )}
        </div>
    );
};

export default PlayersPage;