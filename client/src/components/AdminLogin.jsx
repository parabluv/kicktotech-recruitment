import React, { useState } from 'react';
import { ShieldCheck, Lock, Mail, KeyRound, AlertCircle, ArrowLeft, CheckCircle2, Sparkles } from 'lucide-react';
import { FloatingGeometry, StarBadge } from './GeometricDecorations';
import logoImg from '../assets/kicktotech-logo.png';

export default function AdminLogin({ onLoginSuccess, onBackToForm }) {
  const [email, setEmail] = useState('');
  const [passcode, setPasscode] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');

    try {
      const response = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), passcode: passcode.trim() })
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || 'Login failed. Please check credentials.');
      }

      localStorage.setItem('recruitment_admin_token', data.token);
      localStorage.setItem('recruitment_admin_user', JSON.stringify(data.admin));

      onLoginSuccess(data.admin);
    } catch (err) {
      setErrorMsg(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto px-4 py-16 sm:py-24 relative">
      <FloatingGeometry />

      <div className="mb-6">
        <button
          onClick={onBackToForm}
          className="font-heading text-xs font-black text-[#1E293B] hover:text-[#8B5CF6] flex items-center gap-2 transition"
        >
          <ArrowLeft className="w-4 h-4 stroke-[3]" /> BACK TO CANDIDATE FORM
        </button>
      </div>

      <div className="sticker-card p-8 sm:p-10 relative bg-white">
        <div className="absolute -top-5 right-6">
          <StarBadge text="ADMIN" />
        </div>

        {/* Official KICK TO TECH Logo */}
        <div className="w-16 h-16 bg-[#15616D] border-2 border-[#1E293B] rounded-2xl overflow-hidden mb-6 shadow-pop-sm p-1 flex items-center justify-center">
          <img src={logoImg} alt="KICK TO TECH" className="w-full h-full object-contain" />
        </div>

        <h2 className="font-heading text-2xl sm:text-3xl font-black text-[#1E293B] mb-2">
          Admin Login
        </h2>

        {errorMsg && (
          <div className="mb-6 p-4 rounded-xl bg-[#FEE2E2] border-2 border-[#EF4444] text-[#B91C1C] text-xs font-semibold flex items-start gap-2.5 shadow-pop-sm">
            <AlertCircle className="w-4 h-4 shrink-0 stroke-[2.5] mt-0.5" />
            <span className="leading-relaxed">{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block font-heading text-xs font-extrabold uppercase tracking-wider text-[#1E293B] mb-1.5">
              Email Address
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your authorized email"
              className="geometric-input w-full px-4 py-3 text-xs sm:text-sm font-medium"
            />
          </div>

          <div>
            <label className="block font-heading text-xs font-extrabold uppercase tracking-wider text-[#1E293B] mb-1.5">
              Passcode
            </label>
            <input
              type="password"
              required
              value={passcode}
              onChange={(e) => setPasscode(e.target.value)}
              placeholder="Enter passcode"
              className="geometric-input w-full px-4 py-3 text-xs sm:text-sm font-medium"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="candy-btn bg-[#8B5CF6] hover:bg-[#7C3AED] text-white w-full py-3.5 mt-2 text-sm"
          >
            {loading ? (
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>Verifying Access...</span>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <KeyRound className="w-4 h-4 stroke-[2.5]" />
                <span>Enter Admin Dashboard</span>
              </div>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
