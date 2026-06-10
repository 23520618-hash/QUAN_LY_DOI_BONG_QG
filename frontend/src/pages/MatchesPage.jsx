// File: truonghoangkhiem/ql_giai_bd_qg_se104_uit/QL_Giai_BD_QG_SE104_UIT-ten-nhanh-moi/frontend/src/pages/MatchesPage.jsx
import React, { useState, useCallback } from 'react';
import axios from 'axios';
import Matches from '../components/Matches';
import MatchForm from '../components/MatchForm';

const MatchesPage = ({ token }) => {
  const isAdmin = localStorage.getItem('role') === 'admin' || JSON.parse(localStorage.getItem('permissions') || '[]').includes('manage_matches');
  const [showForm, setShowForm] = useState(false);
  const [editingMatch, setEditingMatch] = useState(null);
  const [matches, setMatches] = useState([]);
  const [showAutoCreateForm, setShowAutoCreateForm] = useState(false);
  const [autoCreateData, setAutoCreateData] = useState({
    season_id: '',
    matchperday: 1,
  });
  const [seasons, setSeasons] = useState([]);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  // --- BẮT ĐẦU THAY ĐỔI ---
  const [isCreatingSchedule, setIsCreatingSchedule] = useState(false); // Đổi tên `loading`
  // --- KẾT THÚC THAY ĐỔI ---

  // Fetch seasons for the dropdown
  React.useEffect(() => {
    const fetchSeasons = async () => {
      try {
        const response = await axios.get('http://localhost:5000/api/seasons');
        setSeasons(response.data.data || response.data || []);
      } catch (err) {
        setError('Không thể tải danh sách mùa giải');
      }
    };
    fetchSeasons();
  }, []);

  const memoizedSetMatches = useCallback((newMatches) => {
    setMatches(newMatches);
  }, []);

  const onPastMatchesFetched = useCallback((pastMatches) => {
    // Logic xử lý khi có các trận đã qua
  }, []);

  // --- BẮT ĐẦU THAY ĐỔI ---
  const handleAutoCreateSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setIsCreatingSchedule(true); // Bắt đầu tải

    if (!token) {
      setError('Vui lòng đăng nhập để tạo trận đấu tự động.');
      setIsCreatingSchedule(false);
      return;
    }

    if (!autoCreateData.season_id) {
      setError('Vui lòng chọn mùa giải.');
      setIsCreatingSchedule(false);
      return;
    }

    if (autoCreateData.matchperday < 1) {
      setError('Số trận đấu mỗi ngày phải lớn hơn hoặc bằng 1.');
      setIsCreatingSchedule(false);
      return;
    }

    try {
      await axios.post('http://localhost:5000/api/matches', {
        season_id: autoCreateData.season_id,
        matchperday: autoCreateData.matchperday,
      }, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const response = await axios.get(`http://localhost:5000/api/matches/seasons/${autoCreateData.season_id}`);
      setMatches(response.data.data || response.data || []);

      setSuccess('Tạo lịch thi đấu tự động thành công!');
      setAutoCreateData({ season_id: '', matchperday: 1 });
      setShowAutoCreateForm(false);
    } catch (err) {
      console.error('Auto create error:', err.response?.data || err.message);
      if (err.response?.status === 400) {
        setError(err.response.data.message || 'Dữ liệu không hợp lệ.');
      } else if (err.response?.status === 404) {
        setError('Mùa giải không tồn tại.');
      } else {
        setError('Không thể tạo lịch thi đấu. Vui lòng thử lại.');
      }
    } finally {
      setIsCreatingSchedule(false); // Dừng tải
    }
  };
  // --- KẾT THÚC THAY ĐỔI ---

  return (
    <div className="min-h-screen animate-fade-in">
      {/* Toast notifications */}
      {success && (
        <div className="toast toast-success">
          ✅ {success}
        </div>
      )}
      {error && (
        <div className="toast toast-error">
          ❌ {error}
        </div>
      )}

      {showForm ? (
        token ? (
          <div className="animate-scale-in">
            <MatchForm
              editingMatch={editingMatch}
              setEditingMatch={setEditingMatch}
              setShowForm={setShowForm}
              setMatches={memoizedSetMatches}
              token={token}
              seasons={seasons}
            />
          </div>
        ) : (
          <div className="p-4">
            <p className="text-red-600 bg-red-100 p-3 rounded-lg text-center font-medium">
              Vui lòng đăng nhập để thêm hoặc sửa trận đấu.
            </p>
          </div>
        )
      ) : showAutoCreateForm ? (
        <div className="max-w-lg mx-auto p-8 bg-slate-900/80 backdrop-blur-2xl rounded-3xl shadow-[0_0_40px_rgba(0,0,0,0.4)] border border-white/10 animate-scale-in mt-10 relative overflow-hidden">
          <div className="absolute -top-32 -right-32 w-64 h-64 bg-red-600/20 rounded-full blur-3xl pointer-events-none"></div>
          <h2 className="text-3xl font-black text-white mb-6 text-center font-heading drop-shadow-md">
            Tạo Lịch Thi Đấu
          </h2>
          <form onSubmit={handleAutoCreateSubmit} className="space-y-6 relative z-10">
            <fieldset disabled={isCreatingSchedule} className="space-y-6">
              <div>
                <label
                  htmlFor="season_id"
                  className="block text-sm font-bold text-gray-300 uppercase tracking-widest mb-2"
                >
                  Mùa Giải
                </label>
                <select
                  id="season_id"
                  value={autoCreateData.season_id}
                  onChange={(e) =>
                    setAutoCreateData({ ...autoCreateData, season_id: e.target.value })
                  }
                  className="w-full p-3.5 bg-slate-800/80 border border-white/10 rounded-xl text-white focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 shadow-inner"
                  required
                >
                  <option value="">Chọn mùa giải</option>
                  {seasons.map((season) => (
                    <option key={season._id} value={season._id}>
                      {season.season_name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label
                  htmlFor="matchperday"
                  className="block text-sm font-bold text-gray-300 uppercase tracking-widest mb-2"
                >
                  Số Trận Mỗi Ngày
                </label>
                <input
                  type="number"
                  id="matchperday"
                  value={autoCreateData.matchperday}
                  onChange={(e) =>
                    setAutoCreateData({
                      ...autoCreateData,
                      matchperday: parseInt(e.target.value, 10),
                    })
                  }
                  min="1"
                  className="w-full p-3.5 bg-slate-800/80 border border-white/10 rounded-xl text-white focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 shadow-inner"
                  required
                />
              </div>
              <div className="flex justify-center space-x-4 pt-4">
                <button
                  type="submit"
                  className="bg-gradient-to-r from-red-600 to-red-800 hover:from-red-700 hover:to-red-900 text-white px-8 py-3 rounded-xl shadow-lg hover:shadow-xl hover:shadow-red-500/20 transition-all duration-300 font-bold min-w-[120px] flex items-center justify-center gap-2 border border-red-500/30"
                  disabled={isCreatingSchedule}
                >
                  {isCreatingSchedule ? <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div> : 'Tạo Lịch'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowAutoCreateForm(false)}
                  className="bg-slate-800 border border-white/10 text-white px-8 py-3 rounded-xl hover:bg-slate-700 transition-all shadow-sm font-bold"
                  disabled={isCreatingSchedule}
                >
                  Hủy
                </button>
              </div>
            </fieldset>
          </form>
        </div>
      ) : (
        <div className="bg-slate-900/60 backdrop-blur-xl border border-white/10 rounded-3xl shadow-[0_10px_30px_rgba(0,0,0,0.2)] overflow-hidden animate-fade-in">
          {/* Header Banner */}
          <div className="relative overflow-hidden rounded-t-3xl">
            <div className="absolute inset-0 bg-cover bg-center opacity-30" style={{ backgroundImage: 'url(https://images.unsplash.com/photo-1508098682722-e99c43a406b2?q=80&w=2070&auto=format&fit=crop)' }} />
            <div className="absolute inset-0 bg-gradient-to-r from-red-900/90 via-slate-900/80 to-slate-900/90" />
            <div className="relative z-10 px-6 py-8 md:py-10 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 border-b border-white/5">
              <div>
                <h1 className="text-3xl md:text-4xl font-heading font-black text-white tracking-tight mb-1 drop-shadow-md">
                  📅 Lịch thi đấu & Kết quả
                </h1>
                <p className="text-gray-300 text-sm">Theo dõi lịch thi đấu và kết quả các trận đấu kịch tính</p>
              </div>
              {token && isAdmin && (
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      setEditingMatch(null);
                      setShowForm(true);
                    }}
                    className="bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white px-5 py-2.5 rounded-xl shadow-lg hover:shadow-xl hover-glow transition-all duration-300 font-semibold flex items-center gap-2"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                    Tạo Lịch / Thêm Trận
                  </button>
                  <button
                    onClick={() => setShowAutoCreateForm(true)}
                    className="bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white px-5 py-2.5 rounded-xl shadow-lg hover:shadow-xl hover-glow transition-all duration-300 font-semibold flex items-center gap-2"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
                    Tạo Tự Động
                  </button>
                </div>
              )}
            </div>
          </div>

          <div className="p-4 md:p-6">
            <Matches
              matches={matches}
              setMatches={memoizedSetMatches}
              setEditingMatch={setEditingMatch}
              setShowForm={setShowForm}
              token={token}
              onPastMatchesFetched={onPastMatchesFetched}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default MatchesPage;