import React from 'react';
import { Link } from 'react-router-dom';

const Footer = () => {
  return (
    <footer className="mt-auto border-t border-white/10 bg-gray-900/50 backdrop-blur-md gradient-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Brand */}
          <div className="space-y-3">
            <div className="flex items-center gap-3 group">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-500 to-red-700 flex items-center justify-center shadow-glow group-hover:scale-110 transition-transform duration-300">
                <span className="text-white text-xl animate-pulse-glow">⚽</span>
              </div>
              <span className="text-white font-heading font-bold text-xl tracking-tight bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">FLM</span>
            </div>
            <p className="text-gray-400 text-sm leading-relaxed max-w-xs">
              Football League Management — Hệ thống quản lý giải đấu bóng đá chuyên nghiệp, nâng tầm trải nghiệm thể thao.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-white font-semibold text-sm uppercase tracking-wider mb-4 font-heading">Truy cập nhanh</h4>
            <div className="grid grid-cols-2 gap-x-4 gap-y-2">
              {[
                { to: '/teams', label: 'Đội bóng' },
                { to: '/matches', label: 'Trận đấu' },
                { to: '/players', label: 'Cầu thủ' },
                { to: '/rankings', label: 'Xếp hạng' },
                { to: '/seasons', label: 'Mùa giải' },
                { to: '/regulations', label: 'Quy định' },
              ].map(link => (
                <div key={link.to} className="flex">
                  <Link to={link.to}
                    className="text-gray-400 hover:text-white text-sm transition-colors duration-200 hover-underline pb-0.5">
                    {link.label}
                  </Link>
                </div>
              ))}
            </div>
          </div>

          {/* Info */}
          <div>
            <h4 className="text-white font-semibold text-sm uppercase tracking-wider mb-4 font-heading">Thông tin</h4>
            <div className="space-y-2.5 text-sm text-gray-400">
              <p className="flex items-center gap-2 hover:text-gray-300 transition-colors">
                <span>📚</span> Đồ án SE104 — UIT
              </p>
              <p className="flex items-center gap-2 hover:text-gray-300 transition-colors">
                <span>🛠</span> React + Node.js + MongoDB
              </p>
              <p className="flex items-center gap-2 hover:text-gray-300 transition-colors">
                <span>📧</span> Contact: <a href="mailto:admin@flm.vn" className="hover-underline">admin@flm.vn</a>
              </p>
            </div>
          </div>
        </div>

        <div className="border-t border-white/5 mt-10 pt-6 text-center">
          <p className="text-gray-500 text-xs">
            © {new Date().getFullYear()} Football League Management. All rights reserved. Designed with ❤️ for UI/UX Excellence.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
