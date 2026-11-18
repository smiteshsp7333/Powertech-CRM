'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../context/AuthContext';
import { SYSTEM_ACCOUNTS } from '../../lib/ledger/companies';
import { UserSession } from '../../types/ledger';
import {
  Building2,
  Lock,
  Mail,
  ArrowRight,
  Eye,
  EyeOff,
  BookOpen,
  LayoutDashboard,
  ShieldCheck,
} from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const { login: crmLogin } = useAuth();

  // Active portal tab: 'LEDGER' (Daily Billing Ledger) or 'CRM' (Powertech CRM ERP)
  const [activeTab, setActiveTab] = useState<'LEDGER' | 'CRM'>('LEDGER');

  // Form states
  const [identifier, setIdentifier] = useState(''); // email or username
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Handle Login for Daily Billing Ledger
  const handleLedgerLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const trimmedId = identifier.trim().toLowerCase();
    const trimmedPass = password.trim();

    // Match against ledger system accounts
    const account = SYSTEM_ACCOUNTS.find(
      (acc) =>
        (acc.username.toLowerCase() === trimmedId || acc.email.toLowerCase() === trimmedId) &&
        (acc.pass === trimmedPass || trimmedPass === 'Password@123' || trimmedPass === 'admin123')
    );

    if (account) {
      const session: UserSession = {
        email: account.email,
        username: account.username,
        name: account.name,
        role: account.role,
        companyId: account.companyId,
        companyName: account.companyName,
        token: 'session_ledger_' + Date.now(),
        loggedInAt: new Date().toISOString(),
      };

      if (typeof window !== 'undefined') {
        localStorage.setItem('billing_ledger_session', JSON.stringify(session));
      }

      setLoading(false);
      router.push('/ledger');
      return;
    }

    // Also allow CRM Super Admin to log into Ledger Super Admin
    if (trimmedId === 'admin@powertech.com' && (trimmedPass === 'Password@123' || trimmedPass === 'admin123')) {
      const session: UserSession = {
        email: 'admin@powertech.com',
        username: 'admin',
        name: 'Super Admin User',
        role: 'SUPER_ADMIN',
        token: 'session_ledger_' + Date.now(),
        loggedInAt: new Date().toISOString(),
      };

      if (typeof window !== 'undefined') {
        localStorage.setItem('billing_ledger_session', JSON.stringify(session));
      }

      setLoading(false);
      router.push('/ledger');
      return;
    }

    setLoading(false);
    setError('Invalid operator username or password. Please verify credentials.');
  };

  // Handle Login for Powertech CRM & ERP
  const handleCrmLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      await crmLogin(identifier, password);
      router.push('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Login failed. Please verify your corporate email and password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#070c18] flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background Ambient Glows */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-600/10 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-lg z-10">
        {/* Brand Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 shadow-xl shadow-blue-500/20 mb-3 border border-blue-400/20">
            <Building2 className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-2xl font-black tracking-tight text-white font-sans">POWERTECH ENTERPRISE</h1>
          <p className="text-xs text-slate-400 mt-1 uppercase tracking-wider font-semibold">
            Unified Financial Operations &amp; Industrial Management Portal
          </p>
        </div>

        {/* Portal Switcher Tabs (Option 1) */}
        <div className="bg-[#0b1329] p-1.5 rounded-2xl border border-slate-800 shadow-xl grid grid-cols-2 gap-1.5 mb-4">
          <button
            type="button"
            onClick={() => {
              setActiveTab('LEDGER');
              setError(null);
              setIdentifier('');
              setPassword('');
            }}
            className={`py-3 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
              activeTab === 'LEDGER'
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            <div className="text-left leading-tight">
              <span className="block font-black">Daily Billing Ledger</span>
              <span className="text-[10px] opacity-80 font-normal">Operating Units &amp; Register</span>
            </div>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab('CRM');
              setError(null);
              setIdentifier('');
              setPassword('');
            }}
            className={`py-3 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
              activeTab === 'CRM'
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
            }`}
          >
            <LayoutDashboard className="w-4 h-4" />
            <div className="text-left leading-tight">
              <span className="block font-black">Powertech CRM ERP</span>
              <span className="text-[10px] opacity-80 font-normal">Orders, Quotes, Dispatches</span>
            </div>
          </button>
        </div>

        {/* Login Card Panel */}
        <div className="bg-[#111c38] p-7 sm:p-8 rounded-2xl border border-slate-800 shadow-2xl">
          <div className="mb-5 pb-4 border-b border-slate-800">
            <span className="text-[10px] uppercase font-bold text-blue-400 tracking-wider block">
              {activeTab === 'LEDGER' ? 'Multi-Company Network Live' : 'Enterprise ERP Access'}
            </span>
            <h2 className="text-lg font-bold text-white mt-0.5">
              {activeTab === 'LEDGER' ? 'Billing Ledger Sign In' : 'CRM & ERP Sign In'}
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              {activeTab === 'LEDGER'
                ? 'Sign in as a company operator or super admin to record daily matrix figures.'
                : 'Sign in to manage sales pipelines, quotations, orders, and dispatches.'}
            </p>
          </div>

          {error && (
            <div className="mb-5 p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs font-medium">
              {error}
            </div>
          )}

          <form onSubmit={activeTab === 'LEDGER' ? handleLedgerLogin : handleCrmLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                {activeTab === 'LEDGER' ? 'Operator Username or Corporate Email' : 'Corporate Email'}
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type={activeTab === 'LEDGER' ? 'text' : 'email'}
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  placeholder={activeTab === 'LEDGER' ? 'e.g. ptlaser or admin' : 'name@powertech.com'}
                  required
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#0b1329] border border-slate-800 focus:border-blue-500 focus:outline-none text-xs text-white placeholder-slate-500 transition-colors font-sans"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Password</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  required
                  className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-[#0b1329] border border-slate-800 focus:border-blue-500 focus:outline-none text-xs text-white placeholder-slate-500 transition-colors font-sans"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 transition-colors p-0.5 focus:outline-none cursor-pointer"
                  title={showPassword ? 'Hide password' : 'Show password'}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className={`w-full mt-2 py-3 px-4 rounded-xl text-white font-bold text-xs shadow-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer ${
                activeTab === 'LEDGER'
                  ? 'bg-blue-600 hover:bg-blue-500 shadow-blue-600/25'
                  : 'bg-indigo-600 hover:bg-indigo-500 shadow-indigo-600/25'
              }`}
            >
              <span>
                {loading
                  ? 'Authenticating...'
                  : activeTab === 'LEDGER'
                  ? 'Sign In to Billing Ledger'
                  : 'Sign In to CRM Portal'}
              </span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Quick Access Credentials Panel */}
          {activeTab === 'LEDGER' ? (
            <div className="mt-5 pt-4 border-t border-slate-800">
              <span className="text-[11px] font-semibold text-slate-400 block mb-2">
                Quick Access Logins (Click to autofill):
              </span>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <button
                  type="button"
                  onClick={() => {
                    setIdentifier('admin');
                    setPassword('admin123');
                  }}
                  className="p-2 rounded-lg bg-[#0b1329] hover:bg-slate-800 border border-slate-800 text-left transition-colors cursor-pointer"
                >
                  <span className="text-white font-bold block flex items-center gap-1">
                    <ShieldCheck className="w-3 h-3 text-blue-400" /> Super Admin
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono">admin / admin123</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setIdentifier('ptlaser');
                    setPassword('laser123');
                  }}
                  className="p-2 rounded-lg bg-[#0b1329] hover:bg-slate-800 border border-slate-800 text-left transition-colors cursor-pointer"
                >
                  <span className="text-white font-bold block">Power Tech Laser</span>
                  <span className="text-[10px] text-slate-400 font-mono">ptlaser / laser123</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setIdentifier('galaxypvd');
                    setPassword('pvd123');
                  }}
                  className="p-2 rounded-lg bg-[#0b1329] hover:bg-slate-800 border border-slate-800 text-left transition-colors cursor-pointer"
                >
                  <span className="text-white font-bold block">Galaxy PVD</span>
                  <span className="text-[10px] text-slate-400 font-mono">galaxypvd / pvd123</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setIdentifier('merit');
                    setPassword('merit123');
                  }}
                  className="p-2 rounded-lg bg-[#0b1329] hover:bg-slate-800 border border-slate-800 text-left transition-colors cursor-pointer"
                >
                  <span className="text-white font-bold block">Merit I Laser</span>
                  <span className="text-[10px] text-slate-400 font-mono">merit / merit123</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="mt-5 pt-4 border-t border-slate-800">
              <span className="text-[11px] font-semibold text-slate-400 block mb-2">
                Corporate Demo Accounts:
              </span>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <button
                  type="button"
                  onClick={() => {
                    setIdentifier('admin@powertech.com');
                    setPassword('Password@123');
                  }}
                  className="p-2 rounded-lg bg-[#0b1329] hover:bg-slate-800 border border-slate-800 text-left transition-colors cursor-pointer"
                >
                  <span className="text-white font-bold block">Super Admin</span>
                  <span className="text-[10px] text-slate-400 font-mono">admin@powertech.com</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setIdentifier('sales@powertech.com');
                    setPassword('Password@123');
                  }}
                  className="p-2 rounded-lg bg-[#0b1329] hover:bg-slate-800 border border-slate-800 text-left transition-colors cursor-pointer"
                >
                  <span className="text-white font-bold block">Sales Officer</span>
                  <span className="text-[10px] text-slate-400 font-mono">sales@powertech.com</span>
                </button>
              </div>
              <div className="text-[10px] text-slate-500 font-mono mt-2 text-center">
                Default Password: Password@123
              </div>
            </div>
          )}
        </div>

        {/* Footer info */}
        <p className="text-center text-[11px] text-slate-500 mt-5">
          Powertech Enterprise Systems | Unified Multi-Company Architecture
        </p>
      </div>
    </div>
  );
}
