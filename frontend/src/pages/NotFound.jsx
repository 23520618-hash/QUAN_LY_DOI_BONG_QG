import React from 'react';
import { Link } from 'react-router-dom';

const NotFound = () => {
  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 relative overflow-hidden">
      {/* Decorative floating orbs */}
      <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-red-500/10 rounded-full blur-3xl animate-morph-blob" />
      <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-amber-500/10 rounded-full blur-3xl animate-morph-blob" style={{ animationDelay: '-4s' }} />

      <div className="max-w-md w-full glass rounded-3xl p-8 md:p-10 shadow-glow relative z-10 text-center animate-bounce-in">
        <div className="relative mb-6 inline-block">
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-red-500 to-amber-500 flex items-center justify-center mx-auto shadow-glow animate-float">
            <span className="text-4xl">⚽</span>
          </div>
        </div>

        <h1 className="text-8xl font-heading font-black text-transparent bg-clip-text bg-gradient-to-r from-red-500 to-amber-500 mb-2 animate-[glitch_2.5s_infinite] tracking-wider">
          404
        </h1>

        <h2 className="text-2xl font-bold text-white mb-3 font-heading">
          Không tìm thấy trang
        </h2>

        <p className="text-gray-400 mb-8 text-sm leading-relaxed">
          Trang bạn đang tìm kiếm không tồn tại hoặc đã bị di chuyển. Hãy quay lại trang chủ để tiếp tục!
        </p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link to="/"
            className="bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white font-semibold px-6 py-3 rounded-xl shadow-lg hover:shadow-xl hover-glow transition-all duration-300 flex items-center justify-center gap-2">
            <span>🏠</span> Trang chủ
          </Link>
          <Link to="/matches"
            className="bg-white/10 backdrop-blur-sm hover:bg-white/20 text-white font-semibold px-6 py-3 rounded-xl border border-white/10 hover:border-white/20 transition-all duration-300 flex items-center justify-center gap-2">
            <span>🏆</span> Trận đấu
          </Link>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
