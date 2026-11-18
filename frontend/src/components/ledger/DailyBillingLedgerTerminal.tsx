'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { UserSession, CompanyDailyEntry } from '../../types/ledger';
import { loadAllEntries, saveCompanyDailyEntry, computeConsolidatedSummary } from '../../lib/ledger/store';
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

  const [entryModalOpen, setEntryModalOpen] = useState(false);
  const [modalCompanyId, setModalCompanyId] = useState<string | undefined>(undefined);

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

    const loaded = loadAllEntries();
    setEntries(loaded);
  }, [router]);

  const handleLogout = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('billing_ledger_session');
    }
    router.replace('/login');
  };

  const handleSaveEntry = (entry: CompanyDailyEntry) => {
    saveCompanyDailyEntry(entry);
    const updated = loadAllEntries();
    setEntries(updated);
  };

  const handleEditCompany = (companyId: string) => {
    setModalCompanyId(companyId);
    setEntryModalOpen(true);
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
          <CompanyEntryView currentUser={currentUser} selectedDate={selectedDate} />
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
