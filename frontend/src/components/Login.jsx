import React, { useState } from 'react';
import axios from 'axios';
import { Link, useNavigate } from 'react-router-dom';
import { EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline';

const Login = ({ setToken }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [emailError, setEmailError] = useState('');
  const navigate = useNavigate();

  const validateEmail = (value) => {
    if (!value) { setEmailError(''); return; }
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    setEmailError(re.test(value) ? '' : 'Email không hợp lệ');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (emailError) return;
    setError('');
    setIsLoading(true);
    try {
      const response = await axios.post('http://localhost:5000/api/auth/login', { email, password });
      const token = response.data.data.token;
      const role = response.data.data.role;
      const permissions = response.data.data.permissions || [];
      const username = response.data.data.username || email.split('@')[0];
      setToken(token);
      localStorage.setItem('token', token);
      localStorage.setItem('role', role);
      localStorage.setItem('permissions', JSON.stringify(permissions));
      localStorage.setItem('username', username);
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.message || 'Đăng nhập thất bại. Vui lòng kiểm tra lại thông tin.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12 relative overflow-hidden">
      {/* Decorative floating orbs */}
      <div className="absolute top-20 left-10 w-72 h-72 bg-red-500/10 rounded-full blur-3xl animate-morph-blob" />
      <div className="absolute bottom-20 right-10 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl animate-morph-blob" style={{ animationDelay: '-4s' }} />
      
      {/* Card */}
      <div className="w-full max-w-md animate-bounce-in relative z-10">
        <div className="glass-light rounded-2xl shadow-2xl p-8 md:p-10 gradient-border">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-red-500 to-red-700 mb-4 shadow-glow">
              <span className="text-3xl">⚽</span>
            </div>
            <h2 className="text-3xl font-heading font-bold text-gray-800">Đăng nhập</h2>
            <p className="text-gray-500 text-sm mt-2">Chào mừng trở lại! Hãy đăng nhập để tiếp tục.</p>
          </div>

          {/* Error */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 p-3 rounded-xl mb-6 text-sm text-center animate-fade-in font-medium">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Email */}
            <div>
              <label htmlFor="login-email" className="block text-sm font-medium text-gray-700 mb-1.5">
                Email
              </label>
              <input
                id="login-email"
                type="email"
                value={email}
                onChange={(e) => { setEmail(e.target.value); validateEmail(e.target.value); }}
                placeholder="you@example.com"
                className={`w-full px-4 py-3 bg-white border ${emailError ? 'border-red-400 focus:ring-red-400' : 'border-gray-300 focus:ring-red-500'} rounded-xl focus:outline-none focus:ring-2 transition-all duration-300 text-gray-800 placeholder-gray-400 shadow-sm focus-glow`}
                required
                autoComplete="email"
              />
              {emailError && <p className="text-red-500 text-xs mt-1">{emailError}</p>}
            </div>

            {/* Password */}
            <div>
              <label htmlFor="login-password" className="block text-sm font-medium text-gray-700 mb-1.5">
                Mật khẩu
              </label>
              <div className="relative">
                <input
                  id="login-password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-4 py-3 pr-12 bg-white border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 transition-all duration-300 text-gray-800 placeholder-gray-400 shadow-sm focus-glow"
                  required
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors p-1"
                  tabIndex={-1}
                >
                  {showPassword
                    ? <EyeSlashIcon className="h-5 w-5" />
                    : <EyeIcon className="h-5 w-5" />
                  }
                </button>
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={isLoading || !!emailError}
              className="w-full bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 disabled:from-gray-400 disabled:to-gray-400 text-white font-semibold py-3 px-4 rounded-xl shadow-lg hover:shadow-xl hover-glow transition-all duration-300 text-base flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent" />
                  <span>Đang đăng nhập...</span>
                </>
              ) : (
                'Đăng nhập'
              )}
            </button>
          </form>

          <div className="mt-6 flex flex-col gap-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-400">Bạn chưa có tài khoản?</span>
              <Link to="/register" className="font-bold text-red-500 hover:text-red-400 transition-colors">
                Đăng ký ngay
              </Link>
            </div>
            <div className="flex items-center justify-center text-sm pt-2 border-t border-slate-700/50">
              <Link to="/forgot-password" className="text-gray-400 hover:text-white transition-colors">
                Quên mật khẩu?
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;