import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import Rankings from '../components/Rankings';
import axios from 'axios';

// ── Skeleton Components ──────────────────────────────────────────────────────

const SkeletonCard = () => (
  <div className="flex-shrink-0 w-72 bg-white/80 rounded-xl p-5 shadow-card">
    <div className="skeleton h-4 w-32 mx-auto mb-4 rounded" />
    <div className="flex items-center justify-between mb-3">
      <div className="flex items-center gap-2">
        <div className="skeleton w-10 h-10 rounded-full" />
        <div className="skeleton h-3 w-20 rounded" />
      </div>
      <div className="skeleton w-12 h-8 rounded-lg" />
      <div className="flex items-center gap-2">
        <div className="skeleton h-3 w-20 rounded" />
        <div className="skeleton w-10 h-10 rounded-full" />
      </div>
    </div>
    <div className="skeleton h-3 w-28 mx-auto rounded" />
  </div>
);

const SkeletonMatch = () => (
  <div className="bg-white/80 rounded-xl p-6 shadow-card animate-pulse">
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className="skeleton w-14 h-14 rounded-full" />
        <div className="skeleton h-4 w-24 rounded" />
      </div>
      <div className="skeleton w-20 h-10 rounded-lg" />
      <div className="flex items-center gap-3">
        <div className="skeleton h-4 w-24 rounded" />
        <div className="skeleton w-14 h-14 rounded-full" />
      </div>
    </div>
  </div>
);

// ── Season Badge ─────────────────────────────────────────────────────────────

const SeasonBadge = ({ type }) => {
  const config = {
    current: { text: 'Đang diễn ra', bg: 'bg-green-100 text-green-700', dot: 'bg-green-500' },
    past: { text: 'Đã kết thúc', bg: 'bg-gray-100 text-gray-600', dot: 'bg-gray-400' },
    upcoming: { text: 'Sắp tới', bg: 'bg-blue-100 text-blue-700', dot: 'bg-blue-500' },
  };
  const c = config[type] || config.past;
  return (
    <span className={`inline-flex items-center gap-1.5 text-[10px] font-semibold px-2 py-0.5 rounded-full ${c.bg}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${c.dot} ${type === 'current' ? 'animate-pulse' : ''}`} />
      {c.text}
    </span>
  );
};

// ── Main Home Component ──────────────────────────────────────────────────────

const Home = () => {
  const [upcomingMatches, setUpcomingMatches] = useState([]);
  const [pastMatches, setPastMatches] = useState([]);
  const [leagueName, setLeagueName] = useState('Bảng xếp hạng');
  const [seasonId, setSeasonId] = useState(null);
  const [error, setError] = useState(null);
  const [currentSeasons, setCurrentSeasons] = useState([]);
  const [pastSeasons, setPastSeasons] = useState([]);
  const [upcomingSeasons, setUpcomingSeasons] = useState([]);
  const [loadingMatches, setLoadingMatches] = useState(false);
  const scrollContainerRef = useRef(null);

  // ── Data fetching ────────────────────────────────────────────────────

  useEffect(() => {
    const fetchSeasonsData = async () => {
      try {
        const response = await axios.get('http://localhost:5000/api/seasons');
        const allSeasons = response.data.data || [];
        const now = new Date();
        const active = [], past = [], upcoming = [];

        allSeasons.forEach((season) => {
          const start = new Date(season.start_date);
          const end = new Date(season.end_date);
          if (start <= now && end >= now) active.push(season);
          else if (end < now) past.push(season);
          else if (start > now) upcoming.push(season);
        });

        active.sort((a, b) => new Date(b.start_date) - new Date(a.start_date));
        past.sort((a, b) => new Date(b.end_date) - new Date(a.end_date));
        upcoming.sort((a, b) => new Date(a.start_date) - new Date(b.start_date));

        setCurrentSeasons(active);
        setPastSeasons(past);
        setUpcomingSeasons(upcoming);

        const first = active[0] || past[0] || upcoming[0];
        const savedSeasonId = localStorage.getItem('lastSelectedSeason');
        if (savedSeasonId && allSeasons.find(s => s._id === savedSeasonId)) {
          const selected = allSeasons.find(s => s._id === savedSeasonId);
          setSeasonId(savedSeasonId);
          setLeagueName(selected.season_name || 'Bảng xếp hạng');
        } else if (first) {
          setSeasonId(first._id);
          setLeagueName(first.season_name || 'Bảng xếp hạng');
        }
      } catch (err) {
        console.error('Lỗi khi lấy mùa giải:', err);
        setError('Không thể tải thông tin mùa giải.');
      }
    };
    fetchSeasonsData();
  }, []);

  useEffect(() => {
    if (!seasonId) { setUpcomingMatches([]); setPastMatches([]); return; }
    const fetchMatches = async () => {
      setLoadingMatches(true);
      try {
        const response = await axios.get(`http://localhost:5000/api/matches/seasons/${seasonId}`);
        const data = response.data.data || [];
        const now = new Date();
        setUpcomingMatches(
          data.filter(m => new Date(m.date) > now).sort((a, b) => new Date(a.date) - new Date(b.date)).slice(0, 5)
        );
        setPastMatches(
          data.filter(m => new Date(m.date) <= now).sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 5)
        );
      } catch (err) {
        console.error('Lỗi lấy trận đấu:', err);
        setUpcomingMatches([]);
        setPastMatches([]);
      } finally {
        setLoadingMatches(false);
      }
    };
    fetchMatches();
  }, [seasonId]);

  // ── Helpers ──────────────────────────────────────────────────────────

  const handleSeasonSelect = (season) => {
    setSeasonId(season._id);
    localStorage.setItem('lastSelectedSeason', season._id);
    setLeagueName(season.season_name || 'Bảng xếp hạng');
    setError(null);
  };

  const formatMatchDate = (date) => {
    const d = new Date(date);
    if (isNaN(d)) return 'Chưa xác định';
    return `${d.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' })} ${d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}`;
  };

  const defaultLogo = 'https://th.bing.com/th/id/OIP.iiLfIvv8F-PfjMrjObypGgHaHa?rs=1&pid=ImgDetMain';
  const getLogoUrl = (team) => {
    if (!team?.logo) return defaultLogo;
    if (team.logo.startsWith('http') || team.logo.startsWith('/')) return team.logo;
    return `/images/teams_logo/${team.logo}`;
  };

  const scrollCarousel = (dir) => {
    scrollContainerRef.current?.scrollBy({ left: dir * 300, behavior: 'smooth' });
  };

  const latestMatch = pastMatches[0];

  // ── Season List Renderer ─────────────────────────────────────────────

  const renderSeasonList = (seasons, title, type) => (
    <div className="mb-5">
      <h4 className="text-xs uppercase tracking-wider text-gray-500 font-semibold mb-2 px-1">{title}</h4>
      {seasons.length > 0 ? (
        <div className="space-y-1 max-h-[180px] overflow-y-auto no-scrollbar pr-1">
          {seasons.map((season, idx) => (
            <button
              key={season._id}
              onClick={() => handleSeasonSelect(season)}
              className={`w-full text-left px-3 py-2.5 rounded-xl transition-all duration-300 text-sm flex items-center justify-between gap-2 stagger-item ${
                seasonId === season._id
                  ? 'bg-gradient-to-r from-red-500/10 to-red-600/5 text-red-700 font-semibold shadow-sm border border-red-200/50'
                  : 'text-gray-700 hover:bg-gray-100/80 hover:translate-x-1'
              }`}
              style={{ animationDelay: `${idx * 60}ms` }}
            >
              <span className="truncate">{season.season_name || 'Mùa giải'}</span>
              <SeasonBadge type={type} />
            </button>
          ))}
        </div>
      ) : (
        <p className="text-gray-400 text-xs px-1">Không có mùa giải.</p>
      )}
    </div>
  );

  // ── Section Title ────────────────────────────────────────────────────

  const SectionTitle = ({ to, children, icon }) => (
    <Link to={to} className="group block mb-6">
      <h3 className="relative flex items-center gap-3 bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 text-white text-xl md:text-2xl font-heading font-bold py-4 px-6 rounded-xl shadow-lg hover:shadow-xl transition-all duration-500 group-hover:from-red-900 group-hover:via-red-800 group-hover:to-red-900 shimmer-overlay overflow-hidden">
        <span className="text-2xl transition-transform duration-300 group-hover:scale-110 group-hover:rotate-6">{icon}</span>
        {children}
        <svg className="w-5 h-5 ml-auto opacity-0 group-hover:opacity-100 transition-all duration-300 group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </h3>
    </Link>
  );

  // ── JSX ──────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen">
      {/* ── Hero Section ──────────────────────────────────────────────── */}
      <div className="relative w-full h-[40vh] md:h-[50vh] rounded-3xl overflow-hidden mb-10 shadow-[0_0_50px_rgba(0,0,0,0.3)] group bg-slate-900/30 backdrop-blur-3xl border border-white/10 flex items-center justify-center">
        {/* Animated gradient overlay for glass reflections */}
        <div className="absolute inset-0 opacity-20" style={{
          background: 'radial-gradient(circle at 50% -20%, rgba(220,38,38,0.5), transparent 70%), radial-gradient(circle at -20% 120%, rgba(59,130,246,0.3), transparent 70%)',
        }} />
        <div className="relative z-10 flex flex-col items-center justify-end h-full pb-12 px-6 text-center">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-heading font-extrabold text-white drop-shadow-2xl tracking-tight animate-fade-in">
            Football League
            <span className="block text-gradient bg-gradient-to-r from-red-400 via-amber-400 to-red-500 bg-clip-text text-transparent">
              Management
            </span>
          </h1>
          <p className="text-lg md:text-xl text-gray-300 mt-4 max-w-2xl font-light animate-fade-in delay-200">
            Quản lý đội bóng, trận đấu, cầu thủ, mùa giải và hơn thế nữa!
          </p>
          <div className="flex gap-4 mt-6 animate-fade-in delay-300">
            <Link to="/rankings" className="bg-white/10 backdrop-blur-sm hover:bg-white/20 text-white font-semibold px-6 py-2.5 rounded-xl border border-white/20 hover:border-white/40 transition-all duration-300 hover:translate-y-[-2px]">
              Bảng xếp hạng
            </Link>
          </div>
        </div>
      </div>

      {/* ── Main Content ──────────────────────────────────────────────── */}
      <div className="flex flex-col lg:flex-row gap-8 mb-12">

        {/* Sidebar — Season Picker */}
        <aside className="w-full lg:w-72 flex-shrink-0 animate-slide-left">
          <div className="bg-slate-900/60 backdrop-blur-2xl border border-white/10 rounded-3xl shadow-[0_10px_30px_rgba(0,0,0,0.2)] p-6 sticky top-6">
            <h3 className="text-lg font-heading font-bold text-white mb-5 flex items-center gap-2">
              <span className="w-2 h-6 bg-gradient-to-b from-red-400 to-red-600 rounded-full shadow-[0_0_10px_rgba(220,38,38,0.8)]" />
              Mùa giải
            </h3>
            {renderSeasonList(currentSeasons, 'Đang diễn ra', 'current')}
            {renderSeasonList(upcomingSeasons, 'Sắp tới', 'upcoming')}
            {renderSeasonList(pastSeasons, 'Đã kết thúc', 'past')}
            {upcomingSeasons.length === 0 && currentSeasons.length === 0 && pastSeasons.length === 0 && !error && (
              <p className="text-gray-400 text-sm">Không có dữ liệu mùa giải.</p>
            )}
          </div>
        </aside>

        {/* Main Content Area */}
        <div className="flex-1 min-w-0 space-y-10 animate-slide-up">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 p-4 rounded-xl text-center shadow-sm">
              {error}
            </div>
          )}

          {/* ── Upcoming Matches ───────────────────────────────────────── */}
          <section>
            <SectionTitle to="/matches" icon="📅">Trận đấu sắp diễn ra</SectionTitle>

            {loadingMatches ? (
              <div className="flex gap-4 overflow-hidden">
                <SkeletonCard /><SkeletonCard /><SkeletonCard />
              </div>
            ) : seasonId && upcomingMatches.length > 0 ? (
              <div className="relative group/carousel">
                {/* Scroll buttons */}
                {upcomingMatches.length > 1 && (
                  <>
                    <button onClick={() => scrollCarousel(-1)}
                      className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-2 z-10 w-10 h-10 rounded-full bg-white/90 shadow-lg flex items-center justify-center text-gray-600 hover:bg-white hover:text-red-600 transition-all opacity-0 group-hover/carousel:opacity-100">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                    </button>
                    <button onClick={() => scrollCarousel(1)}
                      className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-2 z-10 w-10 h-10 rounded-full bg-white/90 shadow-lg flex items-center justify-center text-gray-600 hover:bg-white hover:text-red-600 transition-all opacity-0 group-hover/carousel:opacity-100">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                    </button>
                  </>
                )}

                <div ref={scrollContainerRef} className="flex gap-5 overflow-x-auto no-scrollbar pb-4 px-1">
                  {upcomingMatches.map((match, i) => (
                    <div key={match._id}
                      className="flex-shrink-0 w-72 bg-slate-900/50 backdrop-blur-xl rounded-2xl p-6 tilt-card shadow-lg border border-white/10 animate-fade-in"
                      style={{ animationDelay: `${i * 100}ms` }}
                    >
                      <div className="text-center mb-4">
                        <span className="text-xs font-semibold text-gray-300 bg-slate-800/80 px-3 py-1.5 rounded-full border border-white/5">
                          {formatMatchDate(match.date)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex flex-col items-center gap-2 w-1/3">
                          <img src={getLogoUrl(match.team1)} alt="" className="w-14 h-14 object-contain rounded-full border border-white/20 shadow-md bg-white/5" onError={e => e.target.src = defaultLogo} />
                          <span className="text-xs font-semibold text-white text-center leading-tight truncate w-full">{match.team1?.team_name || 'Đội 1'}</span>
                        </div>
                        <div className="text-lg font-bold text-white bg-gradient-to-br from-red-600 to-red-800 px-3 py-1.5 rounded-lg shadow-inner">VS</div>
                        <div className="flex flex-col items-center gap-2 w-1/3">
                          <img src={getLogoUrl(match.team2)} alt="" className="w-14 h-14 object-contain rounded-full border border-white/20 shadow-md bg-white/5" onError={e => e.target.src = defaultLogo} />
                          <span className="text-xs font-semibold text-white text-center leading-tight truncate w-full">{match.team2?.team_name || 'Đội 2'}</span>
                        </div>
                      </div>
                      <div className="text-center text-xs text-gray-400 font-medium">
                        🏟 {match.stadium || 'Chưa xác định'}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : seasonId ? (
              <p className="text-center text-gray-400 py-6">Không có trận đấu sắp diễn ra.</p>
            ) : (
              <p className="text-center text-gray-400 py-6">Chọn mùa giải để xem trận đấu.</p>
            )}

            {seasonId && (
              <div className="mt-6 text-center">
                <Link to="/matches" className="inline-flex items-center gap-2 bg-gradient-to-r from-red-600 to-red-700 text-white font-semibold py-2.5 px-6 rounded-xl shadow-lg hover:shadow-xl hover-glow transition-all duration-300">
                  Xem tất cả trận đấu
                  <svg className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                </Link>
              </div>
            )}
          </section>

          {/* ── Latest Match Result ─────────────────────────────────────── */}
          <section>
            <SectionTitle to="/matches" icon="🏆">Trận đấu đã kết thúc</SectionTitle>

            {loadingMatches ? (
              <SkeletonMatch />
            ) : seasonId && latestMatch ? (
              <div className="bg-slate-900/60 backdrop-blur-xl border border-white/10 rounded-3xl p-6 md:p-10 shadow-[0_10px_30px_rgba(0,0,0,0.2)] hover-lift">
                <div className="flex justify-between items-center mb-6 text-sm text-gray-400">
                  <span className="flex items-center gap-1.5 font-semibold bg-slate-800/80 px-3 py-1.5 rounded-full border border-white/5">📅 {formatMatchDate(latestMatch.date)}</span>
                  <span className="flex items-center gap-1.5 font-semibold bg-slate-800/80 px-3 py-1.5 rounded-full border border-white/5">🏟 {latestMatch.stadium || 'Không xác định'}</span>
                </div>
                <div className="flex items-center justify-center gap-6 md:gap-14">
                  <div className="flex flex-col items-center gap-3 w-1/3">
                    <div className="relative">
                      <div className="absolute inset-0 bg-red-500 rounded-full blur-xl opacity-20"></div>
                      <img src={getLogoUrl(latestMatch.team1)} alt="" className="relative w-20 h-20 md:w-28 md:h-28 object-contain rounded-full border border-white/20 shadow-lg bg-white/5" onError={e => e.target.src = defaultLogo} />
                    </div>
                    <span className="font-bold text-white text-base text-center truncate w-full">{latestMatch.team1?.team_name || 'Đội 1'}</span>
                  </div>
                  <div className="text-center">
                    <div className="text-4xl md:text-5xl font-heading font-black text-white bg-slate-900/60 backdrop-blur-md px-6 py-2.5 rounded-2xl shadow-[inset_0_1px_1px_rgba(255,255,255,0.1),0_10px_20px_rgba(0,0,0,0.4)] tabular-nums border border-white/10 flex items-center justify-center min-w-[100px] tracking-widest">
                      {latestMatch.score || 'VS'}
                    </div>
                    {latestMatch.score && /^\d+-\d+$/.test(latestMatch.score) && (
                      <span className="inline-block mt-4 text-xs font-bold px-4 py-1.5 rounded-full bg-red-500/20 text-red-400 border border-red-500/30">
                        KẾT THÚC
                      </span>
                    )}
                  </div>
                  <div className="flex flex-col items-center gap-3 w-1/3">
                    <div className="relative">
                      <div className="absolute inset-0 bg-blue-500 rounded-full blur-xl opacity-20"></div>
                      <img src={getLogoUrl(latestMatch.team2)} alt="" className="relative w-20 h-20 md:w-28 md:h-28 object-contain rounded-full border border-white/20 shadow-lg bg-white/5" onError={e => e.target.src = defaultLogo} />
                    </div>
                    <span className="font-bold text-white text-base text-center truncate w-full">{latestMatch.team2?.team_name || 'Đội 2'}</span>
                  </div>
                </div>
              </div>
            ) : seasonId ? (
              <p className="text-center text-gray-400 py-6">Không có trận đấu đã kết thúc.</p>
            ) : null}
          </section>

          {/* ── Rankings ────────────────────────────────────────────────── */}
          <section>
            <SectionTitle to="/rankings" icon="📊">{leagueName}</SectionTitle>

            {seasonId ? (
              <>
                <div className="bg-slate-900/60 backdrop-blur-xl border border-white/10 rounded-3xl p-4 md:p-6 shadow-[0_10px_30px_rgba(0,0,0,0.2)]">
                  <Rankings seasonId={seasonId} hideDropdown={true} />
                </div>
                <div className="mt-6 text-center">
                  <Link to="/rankings" className="inline-flex items-center gap-2 bg-gradient-to-r from-red-600 to-red-700 text-white font-semibold py-2.5 px-6 rounded-xl shadow-lg hover:shadow-xl hover-glow transition-all duration-300">
                    Xem chi tiết
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                  </Link>
                </div>
              </>
            ) : !error ? (
              <p className="text-center text-gray-400 py-6">Chọn mùa giải để xem bảng xếp hạng.</p>
            ) : null}
          </section>
        </div>
      </div>
    </div>
  );
};

export default Home;