import React, { useState } from 'react';
import axios from 'axios';
import { Link, useNavigate } from 'react-router-dom';
import { EyeIcon, EyeSlashIcon, CheckCircleIcon, XCircleIcon } from '@heroicons/react/24/outline';

const Register = () => {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [adminCode, setAdminCode] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  // Validation states
  const validations = {
    username: username.length >= 3,
    email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email),
    password: password.length >= 6,
    confirmMatch: confirmPassword === password && confirmPassword.length > 0,
  };

  const isFormValid = validations.username && validations.email && validations.password && validations.confirmMatch;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isFormValid) {
      setError('Vui lòng kiểm tra lại thông tin đăng ký.');
      return;
    }
    setError('');
    setIsLoading(true);
    try {
      await axios.post('http://localhost:5000/api/auth/register', { username, email, password, adminCode });
      navigate('/login');
    } catch (err) {
      setError(err.response?.data?.message || 'Đăng ký thất bại. Vui lòng thử lại.');
    } finally {
      setIsLoading(false);
    }
  };

  const ValidationHint = ({ valid, text, show }) => {
    if (!show) return null;
    return (
      <div className={`flex items-center gap-1.5 text-xs mt-1 ${valid ? 'text-green-600' : 'text-gray-400'}`}>
        {valid
          ? <CheckCircleIcon className="h-3.5 w-3.5 text-green-500" />
          : <XCircleIcon className="h-3.5 w-3.5 text-gray-400" />
        }
        {text}
      </div>
    );
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12 relative overflow-hidden">
      {/* Decorative floating orbs */}
      <div className="absolute top-20 left-10 w-72 h-72 bg-red-500/10 rounded-full blur-3xl animate-morph-blob" />
      <div className="absolute bottom-20 right-10 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl animate-morph-blob" style={{ animationDelay: '-4s' }} />

      <div className="w-full max-w-md animate-bounce-in relative z-10">
        <div className="glass-light rounded-2xl shadow-2xl p-8 md:p-10 gradient-border">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-red-500 to-red-700 mb-4 shadow-glow">
              <span className="text-3xl">🏆</span>
            </div>
            <h2 className="text-3xl font-heading font-bold text-gray-800">Tạo tài khoản</h2>
            <p className="text-gray-500 text-sm mt-2">Tham gia quản lý giải đấu bóng đá ngay hôm nay!</p>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 p-3 rounded-xl mb-6 text-sm text-center animate-fade-in font-medium">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Username */}
            <div>
              <label htmlFor="reg-username" className="block text-sm font-medium text-gray-700 mb-1.5">
                Tên người dùng
              </label>
              <input
                id="reg-username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Tên hiển thị"
                className="w-full px-4 py-3 bg-white border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 transition-all duration-300 text-gray-800 placeholder-gray-400 shadow-sm focus-glow"
                required
              />
              <ValidationHint valid={validations.username} text="Tối thiểu 3 ký tự" show={username.length > 0} />
            </div>

            {/* Email */}
            <div>
              <label htmlFor="reg-email" className="block text-sm font-medium text-gray-700 mb-1.5">
                Email
              </label>
              <input
                id="reg-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full px-4 py-3 bg-white border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 transition-all duration-300 text-gray-800 placeholder-gray-400 shadow-sm focus-glow"
                required
                autoComplete="email"
              />
              <ValidationHint valid={validations.email} text="Email hợp lệ" show={email.length > 0} />
            </div>

            {/* Password */}
            <div>
              <label htmlFor="reg-password" className="block text-sm font-medium text-gray-700 mb-1.5">
                Mật khẩu
              </label>
              <div className="relative">
                <input
                  id="reg-password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-4 py-3 pr-12 bg-white border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 transition-all duration-300 text-gray-800 placeholder-gray-400 shadow-sm focus-glow"
                  required
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors p-1"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeSlashIcon className="h-5 w-5" /> : <EyeIcon className="h-5 w-5" />}
                </button>
              </div>
              <ValidationHint valid={validations.password} text="Tối thiểu 6 ký tự" show={password.length > 0} />
            </div>

            {/* Confirm Password */}
            <div>
              <label htmlFor="reg-confirm" className="block text-sm font-medium text-gray-700 mb-1.5">
                Xác nhận mật khẩu
              </label>
              <div className="relative">
                <input
                  id="reg-confirm"
                  type={showConfirm ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  className={`w-full px-4 py-3 pr-12 bg-white border ${
                    confirmPassword && !validations.confirmMatch ? 'border-red-400 focus:ring-red-400' : 'border-gray-300 focus:ring-red-500'
                  } rounded-xl focus:outline-none focus:ring-2 transition-all duration-300 text-gray-800 placeholder-gray-400 shadow-sm focus-glow`}
                  required
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm(!showConfirm)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors p-1"
                  tabIndex={-1}
                >
                  {showConfirm ? <EyeSlashIcon className="h-5 w-5" /> : <EyeIcon className="h-5 w-5" />}
                </button>
              </div>
              <ValidationHint valid={validations.confirmMatch} text={validations.confirmMatch ? 'Mật khẩu khớp' : 'Mật khẩu không khớp'} show={confirmPassword.length > 0} />
            </div>

            {/* Admin Code */}
            <div>
              <label htmlFor="reg-admin" className="block text-sm font-medium text-gray-700 mb-1.5">
                Mã Admin <span className="text-gray-400 font-normal">(không bắt buộc)</span>
              </label>
              <input
                id="reg-admin"
                type="password"
                value={adminCode}
                onChange={(e) => setAdminCode(e.target.value)}
                placeholder="Nhập mã nếu bạn là admin"
                className="w-full px-4 py-3 bg-white border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 transition-all duration-300 text-gray-800 placeholder-gray-400 shadow-sm focus-glow"
              />
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={isLoading || !isFormValid}
              className="w-full bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 disabled:from-gray-400 disabled:to-gray-400 text-white font-semibold py-3 px-4 rounded-xl shadow-lg hover:shadow-xl hover-glow transition-all duration-300 text-base flex items-center justify-center gap-2 mt-2"
            >
              {isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent" />
                  <span>Đang xử lý...</span>
                </>
              ) : (
                'Đăng ký'
              )}
            </button>
          </form>

          <p className="text-center text-gray-500 mt-8 text-sm">
            Đã có tài khoản?{' '}
            <Link to="/login" className="font-semibold text-red-600 hover:text-red-700 hover:underline transition-colors">
              Đăng nhập ngay
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;