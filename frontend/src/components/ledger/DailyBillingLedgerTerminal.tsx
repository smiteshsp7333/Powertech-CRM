'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { UserSession, CompanyDailyEntry } from '../../types/ledger';
import { loadAllEntries, saveCompanyDailyEntry, computeConsolidatedSummary, STORAGE_KEY } from '../../lib/ledger/store';
import ExecutiveHeader from './ExecutiveHeader';
import MasterConsolidatedView from './MasterConsolidatedView';
import CompanyEntryView from './CompanyEntryView';
import DailyEntryModal from './DailyEntryModal';

export default function DailyBillingLedgerTerminal() {
  const router = useRouter();
  const [isMounted, setIsMounted] = useState(false);
  const [currentUser, setCurrentUser] = useState<UserSession | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().slice(0, 10)
  );
  const [activeView, setActiveView] = useState<'DAILY' | 'MONTHLY'>('DAILY');
  const [selectedCompanyFilter, setSelectedCompanyFilter] = useState<string | null>(null);

  const [entries, setEntries] = useState<Record<string, CompanyDailyEntry>>({});
  const [ledgerSettings, setLedgerSettings] = useState<{
    unlockedDates: string[];
    updatedAt?: string;
    updatedBy?: string;
  }>({
    unlockedDates: ['2026-11-18'],
  });

  const [entryModalOpen, setEntryModalOpen] = useState(false);
  const [modalCompanyId, setModalCompanyId] = useState<string | undefined>(undefined);

  const syncFromCloud = async () => {
    try {
      const res = await fetch('/api/ledger', { cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        if (data) {
          if (data.entries) {
            setEntries(data.entries);
            if (typeof window !== 'undefined') {
              localStorage.setItem(STORAGE_KEY, JSON.stringify(data.entries));
            }
          }
          if (data.settings) {
            const dates = Array.isArray(data.settings.unlockedDates)
              ? data.settings.unlockedDates
              : data.settings.allowNov18Update
              ? ['2026-11-18']
              : [];
            setLedgerSettings({
              ...data.settings,
              unlockedDates: dates,
            });
          }
        }
      }
    } catch (err) {
      console.error('Failed to sync from cloud ledger:', err);
    }
  };

  useEffect(() => {
    setIsMounted(true);

    if (typeof window !== 'undefined') {
      const rawUser = localStorage.getItem('billing_ledger_session');
      if (!rawUser) {
        router.replace('/login');
        return;
      }
      try {
        const parsed = JSON.parse(rawUser);
        if (parsed && (parsed.email || parsed.username)) {
          setCurrentUser(parsed);
        } else {
          router.replace('/login');
          return;
        }
      } catch (e) {
        localStorage.removeItem('billing_ledger_session');
        router.replace('/login');
        return;
      }
    }

    // 1. Initial fast local load
    const loaded = loadAllEntries();
    setEntries(loaded);

    // 2. Fetch latest live cloud database
    syncFromCloud();

    // 3. Keep all devices in real-time sync with 10s auto-polling
    const interval = setInterval(syncFromCloud, 10000);

    // 4. Also refresh immediately whenever user focuses the tab
    const handleFocus = () => syncFromCloud();
    window.addEventListener('focus', handleFocus);
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        syncFromCloud();
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      clearInterval(interval);
      window.removeEventListener('focus', handleFocus);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, [router]);

  const handleLogout = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('billing_ledger_session');
    }
    router.replace('/login');
  };

  const handleSaveEntry = async (entry: CompanyDailyEntry) => {
    // Optimistic local update
    saveCompanyDailyEntry(entry);
    const updated = loadAllEntries();
    setEntries(updated);

    // Push to cloud backend
    try {
      const res = await fetch('/api/ledger', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ entry }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data && data.entries) {
          setEntries(data.entries);
          if (typeof window !== 'undefined') {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(data.entries));
          }
        }
      }
    } catch (err) {
      console.error('Failed to publish entry to cloud API:', err);
    }
  };

  const handleEditCompany = (companyId: string) => {
    setModalCompanyId(companyId);
    setEntryModalOpen(true);
  };

  const handleToggleDatePermission = async (targetDate: string, unlock: boolean) => {
    let newDates = [...(ledgerSettings.unlockedDates || [])];
    if (unlock) {
      if (!newDates.includes(targetDate)) newDates.push(targetDate);
    } else {
      newDates = newDates.filter((d) => d !== targetDate);
    }
    setLedgerSettings((prev) => ({ ...prev, unlockedDates: newDates }));

    try {
      const res = await fetch('/api/ledger', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          date: targetDate,
          unlock,
          updatedBy: currentUser?.name || 'Super Admin',
        }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data && data.settings) {
          const dates = Array.isArray(data.settings.unlockedDates)
            ? data.settings.unlockedDates
            : ['2026-11-18'];
          setLedgerSettings({ ...data.settings, unlockedDates: dates });
        }
      }
    } catch (err) {
      console.error('Failed to toggle date permission:', err);
    }
  };

  const handleToggleNov18Permission = (enabled: boolean) => {
    handleToggleDatePermission('2026-11-18', enabled);
  };

  if (!isMounted || !currentUser) {
    return (
      <div className="min-h-screen bg-[#070c18] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 rounded-full border-2 border-blue-500 border-t-transparent animate-spin" />
          <span className="text-xs text-slate-400">Loading Multi-Company Ledger...</span>
        </div>
      </div>
    );
  }

  const { summaries, grandTotal } = computeConsolidatedSummary(selectedDate, entries);
  const isOperator = currentUser.role === 'COMPANY_USER';

  return (
    <div className="min-h-screen bg-[#070c18] text-slate-100 antialiased pb-16 selection:bg-blue-600 selection:text-white">
      <ExecutiveHeader
        activeView={activeView}
        setActiveView={setActiveView}
        currentUser={currentUser}
        onLogout={handleLogout}
        onOpenEntryModal={() => {
          setModalCompanyId(currentUser.companyId);
          setEntryModalOpen(true);
        }}
      />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 pt-6">
        {isOperator ? (
          <CompanyEntryView
            currentUser={currentUser}
            selectedDate={selectedDate}
            unlockedDates={ledgerSettings.unlockedDates}
            allowNov18Update={ledgerSettings.unlockedDates?.includes('2026-11-18')}
          />
        ) : (
          <MasterConsolidatedView
            selectedDate={selectedDate}
            setSelectedDate={setSelectedDate}
            activeView={activeView}
            summaries={summaries}
            grandTotal={grandTotal}
            onEditCompany={handleEditCompany}
            selectedCompanyFilter={selectedCompanyFilter}
            setSelectedCompanyFilter={setSelectedCompanyFilter}
            unlockedDates={ledgerSettings.unlockedDates}
            onToggleDatePermission={handleToggleDatePermission}
            ledgerSettings={{
              allowNov18Update: ledgerSettings.unlockedDates?.includes('2026-11-18'),
            }}
            onToggleNov18Permission={handleToggleNov18Permission}
          />
        )}
      </main>

      <DailyEntryModal
        isOpen={entryModalOpen}
        onClose={() => setEntryModalOpen(false)}
        selectedDate={selectedDate}
        defaultCompanyId={modalCompanyId}
        onSave={handleSaveEntry}
        existingEntry={
          modalCompanyId ? entries[`${modalCompanyId}_${selectedDate}`] : undefined
        }
      />
    </div>
  );
}
