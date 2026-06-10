import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import axios from 'axios';
import './App.css';
import Navbar from './components/Navbar';
import ScrollToTop from './components/ScrollToTop';
import Login from './components/Login';
import Register from './components/Register';
import Home from './pages/Home';
import TeamsPage from './pages/TeamsPage';
import MatchesPage from './pages/MatchesPage';
import PlayersPage from './pages/PlayersPage';
import SeasonsPage from './pages/SeasonsPage';
import RegulationsPage from './pages/RegulationsPage';
import RankingsPage from './pages/RankingsPage';
import PlayerRankingPage from './pages/PlayerRankingPage';
import AccountManagement from './pages/AccountManagement';
import SupportDashboard from './pages/SupportDashboard';
import NotFound from './pages/NotFound';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import ChatWidget from './components/ChatWidget';
import Footer from './components/Footer';

// Page transition wrapper
const PageWrapper = ({ children }) => {
  const location = useLocation();
  return (
    <div key={location.pathname} className="page-enter">
      {children}
    </div>
  );
};

const App = () => {
  const [token, setToken] = useState(localStorage.getItem('token'));

  useEffect(() => {
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    } else {
      delete axios.defaults.headers.common['Authorization'];
    }
  }, [token]);

  return (
    <div className="min-h-screen app-bg">
      {/* Animated background orbs */}
      <div className="bg-orbs">
        <div className="orb orb-1" />
        <div className="orb orb-2" />
        <div className="orb orb-3" />
      </div>
      <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <Navbar token={token} setToken={setToken} />
        <ScrollToTop />

        {/* Main content — offset by sidebar on desktop, bottom nav on mobile */}
        <div className="app-content">
          <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
            <PageWrapper>
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/login" element={<Login setToken={setToken} />} />
                <Route path="/register" element={<Register />} />
                <Route path="/forgot-password" element={<ForgotPassword />} />
                <Route path="/reset-password/:token" element={<ResetPassword />} />
                <Route path="/teams" element={<TeamsPage token={token} />} />
                <Route path="/matches" element={<MatchesPage token={token} />} />
                <Route path="/players" element={<PlayersPage token={token} />} />
                <Route path="/seasons" element={<SeasonsPage token={token} />} />
                <Route path="/regulations" element={<RegulationsPage token={token} />} />
                <Route path="/rankings" element={<RankingsPage token={token} />} />
                <Route path="/player-rankings" element={<PlayerRankingPage token={token} />} />
                <Route path="/accounts" element={<AccountManagement token={token} />} />
                <Route path="/support" element={<SupportDashboard token={token} />} />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </PageWrapper>
          </main>
          <Footer />
        </div>
        <ChatWidget token={token} />
      </BrowserRouter>
    </div>
  );
};

export default App;