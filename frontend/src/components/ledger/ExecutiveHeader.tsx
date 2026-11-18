'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { UserSession } from '../../types/ledger';
import {
  BookOpen,
  LogOut,
  LayoutDashboard,
  ShieldCheck,
  Building2,
} from 'lucide-react';

interface ExecutiveHeaderProps {
  activeView: 'DAILY' | 'MONTHLY';
  setActiveView: (view: 'DAILY' | 'MONTHLY') => void;
  currentUser: UserSession | null;
  onLogout: () => void;
  onOpenEntryModal: () => void;
}

export default function ExecutiveHeader({
  activeView,
  setActiveView,
  currentUser,
  onLogout,
  onOpenEntryModal,
}: ExecutiveHeaderProps) {
  const [timeStr, setTimeStr] = useState('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTimeStr(
        now.toLocaleTimeString('en-US', {
          hour: '2-digit',
          minute: '2-digit',
          hour12: true,
        })
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const isSuperAdmin = currentUser?.role === 'SUPER_ADMIN';

  return (
    <header className="sticky top-0 z-40 bg-[#0d1527]/95 backdrop-blur-2xl border-b border-slate-800 transition-all">
      {/* Top Status Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-2.5 pb-2 flex items-center justify-between text-xs border-b border-slate-800/60">
        <div className="flex items-center gap-3">
          <span className="font-semibold text-white/90 font-mono tracking-wide">{timeStr}</span>
          <span className="h-3 w-px bg-white/20" />
          <div className="flex items-center gap-1.5 text-[#30d158] font-medium text-[11px]">
            <span className="w-2 h-2 rounded-full bg-[#30d158] animate-pulse" />
            <span>Multi-Company Network Live</span>
          </div>
        </div>

        {/* User Profile & Cross-System Switcher & Logout */}
        {currentUser && (
          <div className="flex items-center gap-2.5">
            {/* Quick Switch to CRM Dashboard */}
            {isSuperAdmin && (
              <Link
                href="/dashboard"
                className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-600/20 hover:bg-blue-600/30 border border-blue-500/30 text-xs font-bold text-blue-400 hover:text-white transition-all shadow-sm"
              >
                <LayoutDashboard className="w-3.5 h-3.5" />
                <span>CRM Dashboard</span>
              </Link>
            )}

            <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs text-white">
              {isSuperAdmin ? (
                <ShieldCheck className="w-3.5 h-3.5 text-[#0a84ff]" />
              ) : (
                <Building2 className="w-3.5 h-3.5 text-[#30d158]" />
              )}
              <span className="font-semibold text-white/95">{currentUser.name}</span>
              <span className="text-[10px] font-bold text-slate-400 px-1.5 py-0.5 rounded bg-white/10 uppercase tracking-wider">
                {currentUser.role === 'SUPER_ADMIN' ? 'SUPER ADMIN' : 'COMPANY PORTAL'}
              </span>
            </div>

            <button
              type="button"
              onClick={onLogout}
              title="Sign Out"
              className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#ff453a]/15 hover:bg-[#ff453a]/25 border border-[#ff453a]/30 text-xs font-semibold text-[#ff453a] transition-all active:scale-95 cursor-pointer shadow-sm"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Logout</span>
            </button>
          </div>
        )}
      </div>

      {/* Main Navigation Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3.5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Title & Brand */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-[#0a84ff] to-[#5e5ce6] flex items-center justify-center shadow-lg shadow-[#0a84ff]/20 border border-white/20">
            <BookOpen className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold tracking-tight text-white flex items-center gap-2">
              Billing Ledger
              {isSuperAdmin ? (
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-md bg-[#0a84ff]/20 text-[#0a84ff] border border-[#0a84ff]/30">
                  Group Companies
                </span>
              ) : (
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-md bg-[#30d158]/20 text-[#30d158] border border-[#30d158]/30">
                  {currentUser?.companyName || 'Operating Unit'}
                </span>
              )}
            </h1>
            <p className="text-xs text-[#8e8e93]">Daily Operational Collection &amp; Consolidated Billing Matrix</p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2.5 flex-wrap">
          {/* Daily vs Monthly Toggle (Super Admin Only) */}
          {isSuperAdmin && (
            <div className="bg-[#0b1329] p-1 rounded-xl border border-slate-800 flex items-center gap-1 text-xs font-semibold">
              <button
                type="button"
                onClick={() => setActiveView('DAILY')}
                className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                  activeView === 'DAILY'
                    ? 'bg-blue-600 text-white font-bold shadow-md shadow-blue-600/30'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Daily Matrix
              </button>
              <button
                type="button"
                onClick={() => setActiveView('MONTHLY')}
                className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                  activeView === 'MONTHLY'
                    ? 'bg-purple-600 text-white font-bold shadow-md shadow-purple-600/30'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Monthly Cumulative
              </button>
            </div>
          )}

          {/* Record Daily Entry Button */}
          {isSuperAdmin && (
            <button
              type="button"
              onClick={onOpenEntryModal}
              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-lg shadow-emerald-600/20 transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <span>+ Update Daily Entry</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
