import React, { useState, useEffect } from 'react';
import axios from 'axios';
import PlayerRanking from '../components/PlayerRanking';
import { MagnifyingGlassIcon } from '@heroicons/react/24/outline';

const PlayerRankingPage = ({ token }) => {
    const [seasons, setSeasons] = useState([]);
    const [selectedSeasonId, setSelectedSeasonId] = useState(() => localStorage.getItem('lastSelectedSeason') || null);
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
    const [searchTerm, setSearchTerm] = useState('');
    const [teams, setTeams] = useState([]);
    const [playerResults, setPlayerResults] = useState([]);
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(true);

    const API_URL = 'http://localhost:5000';

    useEffect(() => {
        const fetchSeasons = async (retryCount = 1) => {
            setLoading(true);
            setError(null);
            try {
                const config = token ? { headers: { Authorization: `Bearer ${token}` } } : {};
                const response = await axios.get(`${API_URL}/api/seasons`, config);
                const allSeasons = response.data.data || [];
                setSeasons(allSeasons);

                const storedSeasonId = localStorage.getItem('lastSelectedSeason');
                const storedSeasonIsValid = storedSeasonId && allSeasons.some(s => s._id === storedSeasonId);

                if (storedSeasonIsValid) {
                    setSelectedSeasonId(storedSeasonId);
                } else if (allSeasons.length > 0) {
                    const defaultSeason = allSeasons[0]._id;
                    setSelectedSeasonId(defaultSeason);
                    localStorage.setItem('lastSelectedSeason', defaultSeason);
                } else {
                    setError('Không có mùa giải nào.');
                }
            } catch (err) {
                console.error('Lỗi khi lấy danh sách mùa giải:', err);
                if (retryCount > 0 && err.response?.status !== 401) {
                    setTimeout(() => fetchSeasons(retryCount - 1), 2000);
                    return;
                }
                setError(
                    err.response?.status === 401
                        ? 'Dữ liệu bị giới hạn do chưa đăng nhập. Vui lòng đăng nhập để xem đầy đủ.'
                        : `Không thể tải danh sách mùa giải: ${err.message}`
                );
            } finally {
                setLoading(false);
            }
        };
        fetchSeasons();
    }, [token]);

    useEffect(() => {
        const fetchData = async () => {
            if (!selectedSeasonId || !/^[0-9a-fA-F]{24}$/.test(selectedSeasonId)) {
                setPlayerResults([]);
                setTeams([]);
                return;
            }
            setLoading(true);
            setError('');
            setPlayerResults([]);
            setTeams([]);
            try {
                const config = token ? { headers: { Authorization: `Bearer ${token}` } } : {};
                const teamsResponse = await axios.get(`${API_URL}/api/teams/seasons/${selectedSeasonId}`, config);
                if (teamsResponse.data.status !== 'success' || !Array.isArray(teamsResponse.data.data)) {
                    throw new Error('Dữ liệu đội bóng không hợp lệ.');
                }
                setTeams(teamsResponse.data.data);

                const playerResultsResponse = await axios.get(
                    `${API_URL}/api/player_rankings/season/${selectedSeasonId}`,
                    { params: { date: selectedDate }, ...config }
                );
                if (playerResultsResponse.data.status !== 'success' || !Array.isArray(playerResultsResponse.data.data)) {
                    throw new Error('Dữ liệu kết quả cầu thủ không hợp lệ.');
                }
                setPlayerResults(playerResultsResponse.data.data);
            } catch (err) {
                console.error('Lỗi khi lấy dữ liệu:', err);
                setError(
                    err.response?.status === 401
                        ? 'Dữ liệu bị giới hạn do chưa đăng nhập.'
                        : 'Không có thông tin xếp hạng cầu thủ cho lựa chọn này.'
                );
            } finally {
                setLoading(false);
            }
        };

        if (selectedSeasonId) {
            fetchData();
        } else {
            setLoading(false);
            setPlayerResults([]);
            setTeams([]);
        }
    }, [selectedSeasonId, selectedDate, token]);

    const formatDate = (dateString) => {
        if (!dateString) return 'Không xác định';
        const date = new Date(dateString);
        return isNaN(date) ? 'Ngày không hợp lệ' : date.toLocaleDateString('vi-VN');
    };

    const handleDateChange = (e) => setSelectedDate(e.target.value);

    const handleSeasonChange = (e) => {
        const id = e.target.value;
        setSelectedSeasonId(id);
        if (id) {
            localStorage.setItem('lastSelectedSeason', id);
        } else {
            localStorage.removeItem('lastSelectedSeason');
        }
    };

    const selectedSeasonName = seasons.find((season) => season._id === selectedSeasonId)?.season_name || '';

    if (loading && (!seasons.length && !selectedSeasonId)) {
        return (
            <div className="min-h-[60vh] flex flex-col items-center justify-center gap-3">
                <div className="animate-spin rounded-full h-10 w-10 border-4 border-red-200 border-t-red-600" />
                <p className="text-gray-400 text-sm">Đang tải dữ liệu...</p>
            </div>
        );
    }

    return (
        <div className="min-h-screen animate-fade-in">
            {/* Header */}
            <div className="bg-slate-900/60 backdrop-blur-xl border border-white/10 rounded-3xl shadow-[0_10px_30px_rgba(0,0,0,0.2)] overflow-hidden mb-8">
                <div className="relative overflow-hidden rounded-t-3xl">
                    <div className="absolute inset-0 bg-cover bg-center opacity-30"
                        style={{ backgroundImage: `linear-gradient(rgba(0,0,0,0.5), rgba(0,0,0,0.5)), url('https://wallpaperbat.com/img/470248-create-five-wallpaper-of-your-favorites-soccer-players.jpg')` }} />
                    <div className="absolute inset-0 bg-gradient-to-r from-red-900/90 via-slate-900/80 to-slate-900/90" />
                    <div className="relative z-10 px-6 py-8 md:py-10 border-b border-white/5">
                        <h1 className="text-3xl sm:text-4xl font-heading font-black text-white tracking-tight mb-1 text-center drop-shadow-md">
                            ⭐ Xếp Hạng Cầu Thủ
                        </h1>
                        {selectedSeasonName && (
                            <p className="text-lg text-gray-300 mt-1 font-medium text-center">{selectedSeasonName}</p>
                        )}

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end mt-6">
                            <div>
                                <label htmlFor="season-select" className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">
                                    Mùa giải
                                </label>
                                <select
                                    id="season-select"
                                    value={selectedSeasonId || ''}
                                    onChange={handleSeasonChange}
                                    className="w-full bg-slate-800/80 backdrop-blur-md border border-white/10 rounded-xl px-4 py-2.5 text-white font-medium focus:ring-2 focus:ring-red-500 focus-glow shadow-inner"
                                >
                                    <option value="">Chọn mùa giải</option>
                                    {seasons.map((season) => (
                                        <option key={season._id} value={season._id}>
                                            {`${season.season_name} (${formatDate(season.start_date)} - ${formatDate(season.end_date)})`}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label htmlFor="date-filter" className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">
                                    Tính đến ngày
                                </label>
                                <input
                                    type="date"
                                    id="date-filter"
                                    value={selectedDate}
                                    onChange={handleDateChange}
                                    className="w-full bg-slate-800/80 backdrop-blur-md border border-white/10 rounded-xl px-4 py-2.5 text-white font-medium focus:ring-2 focus:ring-red-500 focus-glow shadow-inner"
                                />
                            </div>

                            <div>
                                <label htmlFor="player-search" className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">
                                    Tìm cầu thủ
                                </label>
                                <div className="relative">
                                    <MagnifyingGlassIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                                    <input
                                        id="player-search"
                                        type="text"
                                        placeholder="Nhập tên cầu thủ..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        className="w-full pl-10 pr-4 py-2.5 bg-slate-800/80 backdrop-blur-md border border-white/10 rounded-xl text-white font-medium focus:ring-2 focus:ring-red-500 focus-glow shadow-inner placeholder-gray-500"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Content */}
            {error && !loading && (
                <div className="bg-red-50 border border-red-200 text-red-600 p-4 rounded-xl text-center shadow-sm mb-6 animate-fade-in">
                    {error}
                </div>
            )}

            {loading && selectedSeasonId ? (
                <div className="flex flex-col items-center justify-center py-16 gap-3">
                    <div className="animate-spin rounded-full h-10 w-10 border-4 border-red-200 border-t-red-600" />
                    <p className="text-gray-400 text-sm">Đang tải xếp hạng...</p>
                </div>
            ) : selectedSeasonId && playerResults.length === 0 && !error ? (
                <div className="bg-amber-50 border border-amber-200 text-amber-700 p-4 rounded-xl text-center shadow-sm">
                    Không có dữ liệu xếp hạng cầu thủ cho mùa giải và ngày đã chọn.
                </div>
            ) : selectedSeasonId ? (
                <div className="bg-slate-900/60 backdrop-blur-xl border border-white/10 rounded-3xl shadow-[0_10px_30px_rgba(0,0,0,0.2)] p-4 md:p-6">
                    <PlayerRanking
                        playerResults={playerResults}
                        teams={teams}
                        token={token}
                        searchTerm={searchTerm}
                    />
                </div>
            ) : !selectedSeasonId && !loading && !error && seasons.length > 0 ? (
                <div className="bg-blue-50 border border-blue-200 text-blue-700 p-4 rounded-xl text-center shadow-sm">
                    Vui lòng chọn một mùa giải để xem xếp hạng cầu thủ.
                </div>
            ) : null}
        </div>
    );
};

export default PlayerRankingPage;