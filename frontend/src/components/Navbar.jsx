import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import {
  HomeIcon,
  BuildingOfficeIcon,
  TrophyIcon,
  UserIcon,
  CalendarIcon,
  DocumentTextIcon,
  ChartBarIcon,
  ArrowLeftOnRectangleIcon,
  ArrowRightOnRectangleIcon,
  UserPlusIcon,
  StarIcon,
  ShieldCheckIcon,
  ChatBubbleLeftRightIcon,
  Bars3Icon,
  XMarkIcon,
} from '@heroicons/react/24/outline';

const Navbar = ({ token, setToken }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [username, setUsername] = useState('');
  const [role, setRole] = useState('');

  useEffect(() => {
    setUsername(localStorage.getItem('username') || '');
    setRole(localStorage.getItem('role') || '');
  }, [token]);

  // Close mobile nav on route change
  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  const handleLogout = () => {
    setToken(null);
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    localStorage.removeItem('username');
    navigate('/login');
  };

  const isActive = (path) => location.pathname === path;

  const navLinkClass = (path) =>
    `relative flex items-center gap-3 px-3 py-3 rounded-2xl text-sm font-semibold transition-all duration-300 ease-spring group/item ${
      isActive(path)
        ? 'bg-gradient-to-r from-red-600/20 to-transparent border border-red-500/20 text-white shadow-[inset_0_0_20px_rgba(220,38,38,0.1)]'
        : 'text-gray-400 hover:bg-white/5 hover:text-white hover:translate-x-1 hover:shadow-sm border border-transparent'
    }`;

  const activeIndicator = (path) =>
    isActive(path)
      ? 'absolute left-0 top-1/2 -translate-y-1/2 w-1.5 h-8 bg-gradient-to-b from-red-400 to-red-600 rounded-r-full shadow-[0_0_10px_rgba(220,38,38,0.8)]'
      : 'hidden';

  // Get user initials for avatar
  const getInitials = () => {
    if (!username) return '?';
    return username.charAt(0).toUpperCase();
  };

  const menuItems = [
    { path: '/', icon: HomeIcon, label: 'Trang chủ', group: 'main' },
    { path: '/teams', icon: BuildingOfficeIcon, label: 'Đội bóng', group: 'manage' },
    { path: '/players', icon: UserIcon, label: 'Cầu thủ', group: 'manage' },
    { path: '/matches', icon: TrophyIcon, label: 'Trận đấu', group: 'manage' },
    { path: '/seasons', icon: CalendarIcon, label: 'Mùa giải', group: 'manage' },
    { path: '/regulations', icon: DocumentTextIcon, label: 'Quy định', group: 'manage' },
    { path: '/rankings', icon: ChartBarIcon, label: 'Xếp hạng', group: 'stats' },
    { path: '/player-rankings', icon: StarIcon, label: 'XH Cầu thủ', group: 'stats' },
  ];

  const renderNavLink = (item) => (
    <Link key={item.path} to={item.path} className={navLinkClass(item.path)} title={item.label}>
      <span className={activeIndicator(item.path)} />
      <item.icon className="h-5 w-5 flex-shrink-0" />
      <span className="hidden group-hover:block whitespace-nowrap">{item.label}</span>
      {/* Tooltip for collapsed state */}
      <span className="absolute left-full ml-3 px-2 py-1 bg-gray-800 text-white text-xs rounded-md whitespace-nowrap opacity-0 group-hover:opacity-0 group-hover/item:opacity-100 pointer-events-none transition-opacity z-50 hidden lg:group-hover:hidden group-[&:not(:hover)]/item:hidden">
        {item.label}
      </span>
    </Link>
  );

  const renderDivider = (label) => (
    <div className="px-3 pt-4 pb-1">
      <span className="text-[10px] uppercase tracking-widest text-gray-600 font-semibold hidden group-hover:block">
        {label}
      </span>
      <div className="h-px bg-gray-700/50 mt-1 group-hover:hidden" />
    </div>
  );

  return (
    <>
      {/* ── Desktop Sidebar ──────────────────────────────────────────── */}
      <nav className="fixed left-0 top-0 h-screen w-16 hover:w-64 bg-slate-900/60 backdrop-blur-2xl border-r border-white/5 shadow-[20px_0_40px_rgba(0,0,0,0.3)] transition-all duration-500 ease-spring group z-50 hidden md:flex flex-col overflow-hidden before:absolute before:inset-0 before:bg-gradient-to-b before:from-red-600/5 before:to-transparent before:pointer-events-none">
        {/* Logo area */}
        <Link to="/" className="flex items-center gap-4 px-3.5 py-6 border-b border-white/5 group/logo relative z-10">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-red-500 via-red-600 to-red-800 flex items-center justify-center flex-shrink-0 shadow-[0_0_15px_rgba(220,38,38,0.5)] group-hover/logo:shadow-[0_0_25px_rgba(220,38,38,0.8)] group-hover:scale-110 transition-all duration-500">
            <span className="text-white font-heading font-bold text-sm">⚽</span>
          </div>
          <span className="text-white font-heading font-black text-xl tracking-tight hidden group-hover:block whitespace-nowrap animate-fade-in bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">
            FLM
          </span>
        </Link>

        {/* Menu */}
        <div className="flex-1 flex flex-col px-2 py-2 overflow-y-auto no-scrollbar">
          {/* Main */}
          {menuItems.filter(i => i.group === 'main').map(renderNavLink)}

          {renderDivider('Quản lý')}
          {menuItems.filter(i => i.group === 'manage').map(renderNavLink)}

          {renderDivider('Thống kê')}
          {menuItems.filter(i => i.group === 'stats').map(renderNavLink)}

          {/* Admin only */}
          {token && role === 'admin' && (
            <>
              {renderDivider('Hệ thống')}
              <Link to="/accounts" className={navLinkClass('/accounts')} title="Tài khoản">
                <span className={activeIndicator('/accounts')} />
                <ShieldCheckIcon className="h-5 w-5 flex-shrink-0" />
                <span className="hidden group-hover:block whitespace-nowrap">Tài khoản</span>
              </Link>
              <Link to="/support" className={navLinkClass('/support')} title="Hỗ trợ trực tuyến">
                <span className={activeIndicator('/support')} />
                <ChatBubbleLeftRightIcon className="h-5 w-5 flex-shrink-0" />
                <span className="hidden group-hover:block whitespace-nowrap">Hỗ trợ</span>
              </Link>
            </>
          )}
        </div>

        {/* Bottom section — User info & Auth */}
        <div className="px-3 pb-4 border-t border-white/5 pt-4 bg-slate-950/20 relative z-10">
          {token ? (
            <>
              {/* User info */}
              <div className="flex items-center gap-3 px-3 py-2 mb-2">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-red-500 to-amber-500 flex items-center justify-center flex-shrink-0 text-white font-bold text-xs shadow-md">
                  {getInitials()}
                </div>
                <div className="hidden group-hover:block overflow-hidden">
                  <p className="text-white text-sm font-semibold truncate">{username || 'User'}</p>
                  <p className="text-gray-500 text-[10px] uppercase tracking-wider">{role || 'user'}</p>
                </div>
              </div>
              <button
                onClick={handleLogout}
                className="flex items-center gap-3 px-3 py-3 rounded-2xl text-sm font-semibold text-gray-400 hover:bg-red-500/10 hover:text-red-400 hover:shadow-[inset_0_0_15px_rgba(220,38,38,0.1)] transition-all duration-200 w-full group/logout"
              >
                <ArrowLeftOnRectangleIcon className="h-5 w-5 flex-shrink-0 group-hover/logout:-translate-x-1 transition-transform" />
                <span className="hidden group-hover:block whitespace-nowrap">Đăng xuất</span>
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className={navLinkClass('/login')} title="Đăng nhập">
                <span className={activeIndicator('/login')} />
                <ArrowRightOnRectangleIcon className="h-5 w-5 flex-shrink-0" />
                <span className="hidden group-hover:block whitespace-nowrap">Đăng nhập</span>
              </Link>
              <Link to="/register" className={`${navLinkClass('/register')} mt-1`} title="Đăng ký">
                <span className={activeIndicator('/register')} />
                <UserPlusIcon className="h-5 w-5 flex-shrink-0" />
                <span className="hidden group-hover:block whitespace-nowrap">Đăng ký</span>
              </Link>
            </>
          )}
        </div>
      </nav>

      {/* ── Mobile Bottom Nav ────────────────────────────────────────── */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-slate-900/80 backdrop-blur-2xl border-t border-white/5 shadow-[0_-10px_30px_rgba(0,0,0,0.5)] pb-safe">
        <div className="flex items-center justify-around px-1 py-2">
          {[
            { path: '/', icon: HomeIcon, label: 'Home' },
            { path: '/matches', icon: TrophyIcon, label: 'Trận' },
            { path: '/rankings', icon: ChartBarIcon, label: 'Xếp hạng' },
            { path: '/teams', icon: BuildingOfficeIcon, label: 'Đội' },
          ].map(item => (
            <Link
              key={item.path}
              to={item.path}
              className={`flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-lg transition-all ${
                isActive(item.path)
                  ? 'text-red-500'
                  : 'text-gray-500 hover:text-white'
              }`}
            >
              <item.icon className="h-5 w-5" />
              <span className="text-[10px] font-medium">{item.label}</span>
            </Link>
          ))}
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-lg text-gray-500 hover:text-white transition-all"
          >
            {mobileOpen
              ? <XMarkIcon className="h-5 w-5" />
              : <Bars3Icon className="h-5 w-5" />
            }
            <span className="text-[10px] font-medium">Menu</span>
          </button>
        </div>
      </div>

      {/* ── Mobile Full Menu Overlay ─────────────────────────────────── */}
      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-40 glass" style={{ animation: 'slideInUp 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) both' }}>
          <div className="flex flex-col h-full pt-8 pb-20 px-6 overflow-y-auto">
            <h3 className="text-white font-heading font-bold text-xl mb-6">Menu</h3>
            <div className="space-y-1">
              {menuItems.map(item => (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl text-base font-medium transition-all ${
                    isActive(item.path)
                      ? 'bg-red-500/20 text-white'
                      : 'text-gray-400 hover:bg-white/5 hover:text-white'
                  }`}
                >
                  <item.icon className="h-5 w-5" />
                  {item.label}
                </Link>
              ))}
              {token && role === 'admin' && (
                <>
                  <Link to="/accounts" className={`flex items-center gap-3 px-4 py-3 rounded-xl text-base font-medium transition-all ${
                    isActive('/accounts') ? 'bg-red-500/20 text-white' : 'text-gray-400 hover:bg-white/5 hover:text-white'
                  }`}>
                    <ShieldCheckIcon className="h-5 w-5" />
                    Quản lý tài khoản
                  </Link>
                  <Link to="/support" className={`flex items-center gap-3 px-4 py-3 rounded-xl text-base font-medium transition-all ${
                    isActive('/support') ? 'bg-red-500/20 text-white' : 'text-gray-400 hover:bg-white/5 hover:text-white'
                  }`}>
                    <ChatBubbleLeftRightIcon className="h-5 w-5" />
                    Hỗ trợ trực tuyến
                  </Link>
                </>
              )}
            </div>
            <div className="mt-auto pt-6 border-t border-white/10">
              {token ? (
                <>
                  <div className="flex items-center gap-3 px-4 py-3 mb-2">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-red-500 to-amber-500 flex items-center justify-center text-white font-bold text-sm">
                      {getInitials()}
                    </div>
                    <div>
                      <p className="text-white font-semibold">{username || 'User'}</p>
                      <p className="text-gray-500 text-xs uppercase">{role || 'user'}</p>
                    </div>
                  </div>
                  <button onClick={handleLogout} className="flex items-center gap-3 px-4 py-3 rounded-xl text-red-400 hover:bg-red-500/10 w-full text-left font-medium">
                    <ArrowLeftOnRectangleIcon className="h-5 w-5" />
                    Đăng xuất
                  </button>
                </>
              ) : (
                <div className="space-y-1">
                  <Link to="/login" className="flex items-center gap-3 px-4 py-3 rounded-xl text-gray-400 hover:bg-white/5 hover:text-white font-medium">
                    <ArrowRightOnRectangleIcon className="h-5 w-5" />
                    Đăng nhập
                  </Link>
                  <Link to="/register" className="flex items-center gap-3 px-4 py-3 rounded-xl text-gray-400 hover:bg-white/5 hover:text-white font-medium">
                    <UserPlusIcon className="h-5 w-5" />
                    Đăng ký
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Navbar;