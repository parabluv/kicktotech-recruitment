import React, { useState, useEffect } from 'react';
import CandidateForm from './components/CandidateForm';
import AdminLogin from './components/AdminLogin';
import AdminDashboard from './components/AdminDashboard';
import { ShieldCheck, Rocket, UserCheck, Zap, Sparkles } from 'lucide-react';
import { StarBadge } from './components/GeometricDecorations';
import logoImg from './assets/kicktotech-logo.png';

export default function App() {
  const [currentView, setCurrentView] = useState('form'); // 'form' | 'admin-login' | 'admin-dashboard'
  const [adminUser, setAdminUser] = useState(null);

  useEffect(() => {
    if (window.location.hash === '#admin') {
      const token = localStorage.getItem('recruitment_admin_token');
      const savedUser = localStorage.getItem('recruitment_admin_user');
      if (token && savedUser) {
        try {
          setAdminUser(JSON.parse(savedUser));
          setCurrentView('admin-dashboard');
        } catch (e) {
          setCurrentView('admin-login');
        }
      } else {
        setCurrentView('admin-login');
      }
    } else {
      const token = localStorage.getItem('recruitment_admin_token');
      const savedUser = localStorage.getItem('recruitment_admin_user');
      if (token && savedUser) {
        try {
          setAdminUser(JSON.parse(savedUser));
        } catch (e) {}
      }
    }

    const handleHashChange = () => {
      if (window.location.hash === '#admin') {
        const token = localStorage.getItem('recruitment_admin_token');
        const savedUser = localStorage.getItem('recruitment_admin_user');
        if (token && savedUser) {
          setAdminUser(JSON.parse(savedUser));
          setCurrentView('admin-dashboard');
        } else {
          setCurrentView('admin-login');
        }
      } else {
        setCurrentView('form');
      }
    };

    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  const handleLoginSuccess = (user) => {
    setAdminUser(user);
    setCurrentView('admin-dashboard');
    window.location.hash = 'admin';
  };

  const handleLogout = () => {
    localStorage.removeItem('recruitment_admin_token');
    localStorage.removeItem('recruitment_admin_user');
    setAdminUser(null);
    setCurrentView('admin-login');
  };

  const navigateToAdmin = () => {
    const token = localStorage.getItem('recruitment_admin_token');
    const savedUser = localStorage.getItem('recruitment_admin_user');
    if (token && savedUser) {
      try {
        setAdminUser(JSON.parse(savedUser));
        setCurrentView('admin-dashboard');
        window.location.hash = 'admin';
        return;
      } catch (e) {}
    }
    setCurrentView('admin-login');
    window.location.hash = 'admin';
  };

  const navigateToForm = () => {
    setCurrentView('form');
    window.location.hash = '';
  };

  return (
    <div className="min-h-screen bg-[#FFFDF5] text-[#1E293B] flex flex-col font-body selection:bg-[#F472B6] selection:text-white bg-dot-pattern">
      {/* Playful Geometric Navbar */}
      <nav className="border-b-2 border-[#1E293B] bg-white sticky top-0 z-40 shadow-pop-sm">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 h-16 sm:h-20 flex items-center justify-between">
          <div 
            onClick={navigateToForm} 
            className="flex items-center gap-2 sm:gap-3 cursor-pointer group select-none min-w-0"
          >
            {/* Playful Geometric Official Logo */}
            <div className="w-9 h-9 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-[#15616D] border-2 border-[#1E293B] overflow-hidden shadow-pop-sm group-hover:rotate-6 transition-transform shrink-0 flex items-center justify-center p-0.5">
              <img src={logoImg} alt="KICK TO TECH" className="w-full h-full object-contain" />
            </div>

            <div className="min-w-0">
              <div className="font-heading font-black text-base sm:text-2xl text-[#1E293B] tracking-tight flex items-center gap-1.5 truncate">
                <span className="truncate">KICK TO TECH</span>
                <span className="text-[9px] sm:text-[11px] bg-[#FBBF24] text-[#1E293B] border border-[#1E293B] sm:border-2 px-1.5 sm:px-2.5 py-0.2 rounded-full font-black shadow-pop-sm uppercase shrink-0">
                  2026
                </span>
              </div>
              <p className="font-body text-[10px] sm:text-xs text-[#64748B] font-semibold hidden sm:flex items-center gap-1 mt-0.5">
                <span className="w-2 h-2 rounded-full bg-[#34D399] border border-[#1E293B]"></span>
                Interview Drive: Monday, 19th October
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {currentView === 'form' ? (
              <button
                onClick={navigateToAdmin}
                className="candy-btn bg-[#8B5CF6] hover:bg-[#7C3AED] text-white px-3 sm:px-5 py-1.5 sm:py-2.5 text-xs sm:text-sm flex items-center gap-1.5"
              >
                <ShieldCheck className="w-3.5 h-3.5 sm:w-4 sm:h-4 stroke-[2.5]" />
                <span className="hidden xs:inline">Admin</span> Login
              </button>
            ) : (
              <button
                onClick={navigateToForm}
                className="candy-btn bg-[#FBBF24] hover:bg-[#F59E0B] text-[#1E293B] px-3 sm:px-5 py-1.5 sm:py-2.5 text-xs sm:text-sm flex items-center gap-1.5"
              >
                <UserCheck className="w-3.5 h-3.5 sm:w-4 sm:h-4 stroke-[2.5]" />
                <span className="hidden xs:inline">Candidate</span> Form
              </button>
            )}
          </div>
        </div>
      </nav>

      {/* Main View Display */}
      <div className="flex-1">
        {currentView === 'form' && (
          <CandidateForm onNavigateAdmin={navigateToAdmin} />
        )}

        {currentView === 'admin-login' && (
          <AdminLogin
            onLoginSuccess={handleLoginSuccess}
            onBackToForm={navigateToForm}
          />
        )}

        {currentView === 'admin-dashboard' && adminUser && (
          <AdminDashboard
            adminUser={adminUser}
            onLogout={handleLogout}
            onBackToForm={navigateToForm}
          />
        )}
      </div>

      {/* Playful Geometric Footer */}
      <footer className="border-t-2 border-[#1E293B] bg-white py-10 px-4 text-xs text-[#64748B] font-body mt-16 shadow-pop-sm">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg overflow-hidden border border-[#1E293B] shadow-pop-sm shrink-0">
              <img src={logoImg} alt="KICK TO TECH" className="w-full h-full object-cover" />
            </div>
            <span className="font-heading font-black text-sm text-[#1E293B]">KICK TO TECH</span>
            <span>•</span>
            <span className="font-medium">Interview Drive scheduled for Monday, 19th October.</span>
          </div>

          <div className="flex flex-wrap items-center gap-3 text-xs font-semibold">
            <a
              href="https://chat.whatsapp.com/Ik7xEPjROaoEMoVZBnqtHt?s=qt&p=a&mlu=4&ilr=4"
              target="_blank"
              rel="noopener noreferrer"
              className="candy-btn bg-[#25D366] text-[#1E293B] px-3.5 py-1.5 text-xs font-bold shadow-pop-sm flex items-center gap-1.5"
            >
              <span>💬 Join WhatsApp Group</span>
            </a>
            <span className="text-[#1E293B]">
              Primary Admin: <strong className="text-[#8B5CF6] bg-[#FFFDF5] border border-[#1E293B] px-2 py-0.5 rounded-full shadow-pop-sm">parabluv25@gmail.com</strong>
            </span>
            <button
              onClick={navigateToAdmin}
              className="candy-btn bg-[#FFFDF5] hover:bg-[#F1F5F9] text-[#1E293B] px-3 py-1.5 text-xs"
            >
              Recruiter Access
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}
