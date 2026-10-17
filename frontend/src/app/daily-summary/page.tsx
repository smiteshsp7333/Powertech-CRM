'use client';

import React, { useState, useEffect } from 'react';
import AppLayout from '../../components/layout/AppLayout';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import {
  CalendarDays,
  Plus,
  Lock,
  Unlock,
  TrendingUp,
  DollarSign,
  ShoppingCart,
  CreditCard,
  X,
  ShieldCheck,
} from 'lucide-react';

export default function DailySummaryPage() {
  const { hasPermission } = useAuth();
  const [summaryData, setSummaryData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Modals
  const [adjustmentModalOpen, setAdjustmentModalOpen] = useState(false);
  const [adjDate, setAdjDate] = useState(new Date().toISOString().slice(0, 10));
  const [adjType, setAdjType] = useState('COLLECTION_ADJUSTMENT');
  const [adjAmount, setAdjAmount] = useState<number>(0);
  const [adjReason, setAdjReason] = useState('');

  useEffect(() => {
    loadDailySummary();
  }, [startDate, endDate]);

  const loadDailySummary = async () => {
    try {
      setLoading(true);
      const params: Record<string, string> = {};
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;

      const res = await api.getDailySummary(params);
      if (res.success) {
        setSummaryData(res.data);
      }
    } catch (err) {
      console.error('Failed to load daily summary:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddAdjustmentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adjDate || adjAmount === 0 || !adjReason) {
      alert('Date, valid amount, and reason are required.');
      return;
    }

    try {
      const res = await api.addAdjustment({
        date: adjDate,
        type: adjType,
        amount: adjAmount,
        reason: adjReason,
      });

      if (res.success) {
        setAdjustmentModalOpen(false);
        setAdjAmount(0);
        setAdjReason('');
        loadDailySummary();
      }
    } catch (err: any) {
      alert(err.message || 'Failed to add manual adjustment');
    }
  };

  const handleToggleLock = async (dateStr: string, currentLocked: boolean) => {
    try {
      const res = await api.toggleDayLock({
        date: dateStr,
        isLocked: !currentLocked,
        notes: !currentLocked ? 'Day finalized and locked by management' : 'Unlocked for audit edit',
      });

      if (res.success) {
        loadDailySummary();
      }
    } catch (err: any) {
      alert(err.message || 'Failed to toggle day lock');
    }
  };

  const totals = summaryData?.totals || {};

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Module Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-sky-500/10 text-sky-400 border border-sky-500/20">
              <CalendarDays className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-black text-white flex items-center gap-2">
                Daily Billing, Sales & Purchase Summary
                <span className="text-xs px-2 py-0.5 rounded-full font-bold bg-sky-500/20 text-sky-400 border border-sky-500/30">
                  Automated Reconciliation
                </span>
              </h1>
              <p className="text-xs text-slate-400 mt-0.5">
                Zero double-entry reconciliation pulling directly from invoices, payment receipts, and purchases.
              </p>
            </div>
          </div>

          {hasPermission('DAILY_SUMMARY', 'create') && (
            <button
              onClick={() => setAdjustmentModalOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs shadow-lg shadow-sky-600/20 transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>Record Manual Adjustment</span>
            </button>
          )}
        </div>

        {/* 4 Summary Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="glass-card p-5 rounded-xl border border-blue-500/20">
            <div className="flex items-center justify-between text-blue-400">
              <span className="text-xs font-bold uppercase tracking-wider">Total Sales Invoiced</span>
              <CreditCard className="w-5 h-5" />
            </div>
            <span className="text-2xl font-black text-white block mt-3">
              INR {(totals.billing ?? 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </span>
            <span className="text-[10px] text-slate-400 block mt-1">Automatic pull from issued invoices</span>
          </div>

          <div className="glass-card p-5 rounded-xl border border-emerald-500/20">
            <div className="flex items-center justify-between text-emerald-400">
              <span className="text-xs font-bold uppercase tracking-wider">Total Collections</span>
              <DollarSign className="w-5 h-5" />
            </div>
            <span className="text-2xl font-black text-emerald-300 block mt-3">
              INR {(totals.collection ?? 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </span>
            <span className="text-[10px] text-slate-400 block mt-1">Automatic pull from payment receipts</span>
          </div>

          <div className="glass-card p-5 rounded-xl border border-rose-500/20">
            <div className="flex items-center justify-between text-rose-400">
              <span className="text-xs font-bold uppercase tracking-wider">Total Purchases</span>
              <ShoppingCart className="w-5 h-5" />
            </div>
            <span className="text-2xl font-black text-rose-300 block mt-3">
              INR {(totals.purchase ?? 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </span>
            <span className="text-[10px] text-slate-400 block mt-1">Automatic pull from vendor purchases</span>
          </div>

          <div className="glass-panel p-5 rounded-xl border border-sky-500/20">
            <div className="flex items-center justify-between text-sky-400">
              <span className="text-xs font-bold uppercase tracking-wider">Net Cash Flow</span>
              <TrendingUp className="w-5 h-5" />
            </div>
            <span
              className={`text-2xl font-black block mt-3 ${
                (totals.netCashFlow ?? 0) >= 0 ? 'text-sky-300' : 'text-rose-400'
              }`}
            >
              INR {(totals.netCashFlow ?? 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </span>
            <span className="text-[10px] text-slate-400 block mt-1">
              Formula: Collection - Purchase + Adjustments
            </span>
          </div>
        </div>

        {/* Date Filter Bar */}
        <div className="glass-panel p-4 rounded-xl border border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5">
              <span className="text-slate-400">From:</span>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-white"
              />
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-slate-400">To:</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-white"
              />
            </div>
            {(startDate || endDate) && (
              <button
                onClick={() => {
                  setStartDate('');
                  setEndDate('');
                }}
                className="text-slate-400 hover:text-white underline text-[11px]"
              >
                Reset Dates
              </button>
            )}
          </div>

          <span className="text-slate-400 text-[11px]">
            Locking a day prevents any further transactions or edits on that past date.
          </span>
        </div>

        {/* Day-by-Day Table List */}
        <div className="glass-panel rounded-xl border border-slate-800 overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left data-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Billing (Invoiced)</th>
                  <th>Collections (Receipts)</th>
                  <th>Purchases (Supplier Bills)</th>
                  <th>Manual Adjustments</th>
                  <th>Net Cash Flow</th>
                  <th>Status</th>
                  <th className="text-right">Audit Lock</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={8} className="text-center py-10 text-slate-400 text-xs">
                      Loading daily reconciliation summary...
                    </td>
                  </tr>
                ) : summaryData?.dailyRecords?.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="text-center py-12 text-slate-400 text-xs">
                      No transactions recorded in the selected period.
                    </td>
                  </tr>
                ) : (
                  summaryData?.dailyRecords?.map((row: any) => (
                    <tr key={row.date}>
                      <td className="font-bold text-white font-mono text-xs">{row.date}</td>
                      <td className="text-blue-400 font-semibold text-xs">
                        INR {row.billingAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="text-emerald-400 font-semibold text-xs">
                        INR {row.collectionAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="text-rose-400 font-semibold text-xs">
                        INR {row.purchaseAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="text-slate-300 text-xs">
                        {row.adjustmentAmount !== 0 ? (
                          <span className={row.adjustmentAmount > 0 ? 'text-emerald-400' : 'text-rose-400'}>
                            {row.adjustmentAmount > 0 ? '+' : ''}INR {row.adjustmentAmount.toLocaleString('en-IN')}
                          </span>
                        ) : (
                          '-'
                        )}
                      </td>
                      <td className="font-bold text-white text-xs">
                        INR {row.netCashFlow.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </td>
                      <td>
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            row.isLocked ? 'badge-red' : 'badge-green'
                          }`}
                        >
                          {row.isLocked ? 'LOCKED' : 'OPEN'}
                        </span>
                      </td>
                      <td className="text-right">
                        {hasPermission('DAILY_SUMMARY', 'edit') && (
                          <button
                            onClick={() => handleToggleLock(row.date, row.isLocked)}
                            title={row.isLocked ? 'Unlock Date for Admin Edit' : 'Lock Date to Finalize'}
                            className={`p-1.5 rounded-lg transition-colors ${
                              row.isLocked
                                ? 'bg-rose-500/20 text-rose-400 hover:bg-rose-500/30'
                                : 'bg-slate-800 text-slate-400 hover:text-white'
                            }`}
                          >
                            {row.isLocked ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Modal: Manual Adjustment */}
        {adjustmentModalOpen && (
          <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="glass-panel w-full max-w-md rounded-2xl border border-slate-700 p-6 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-sky-400" />
                  <h3 className="text-base font-bold text-white">Authorized Manual Adjustment</h3>
                </div>
                <button onClick={() => setAdjustmentModalOpen(false)} className="text-slate-400 hover:text-white">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <p className="text-xs text-slate-400">
                Authorized financial adjustment will be stamped with your user credentials and recorded in the audit trail.
              </p>

              <form onSubmit={handleAddAdjustmentSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Adjustment Date *</label>
                  <input
                    type="date"
                    required
                    value={adjDate}
                    onChange={(e) => setAdjDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-xs text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Adjustment Type *</label>
                  <select
                    value={adjType}
                    onChange={(e) => setAdjType(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-xs text-white"
                  >
                    <option value="COLLECTION_ADJUSTMENT">Collection / Cash Receipt Adjustment</option>
                    <option value="PURCHASE_ADJUSTMENT">Purchase / Expense Adjustment</option>
                    <option value="BILLING_ADJUSTMENT">Billing / Revenue Adjustment</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Amount (INR) * (Use negative for deduction)
                  </label>
                  <input
                    type="number"
                    step="any"
                    required
                    value={adjAmount}
                    onChange={(e) => setAdjAmount(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-xs text-white text-right"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Justification / Audit Reason *
                  </label>
                  <textarea
                    rows={2}
                    required
                    placeholder="e.g. Bank charges reconciliation, petty cash adjustment..."
                    value={adjReason}
                    onChange={(e) => setAdjReason(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-xs text-white"
                  />
                </div>

                <div className="flex justify-end gap-3 pt-3 border-t border-slate-800">
                  <button
                    type="button"
                    onClick={() => setAdjustmentModalOpen(false)}
                    className="px-4 py-2 rounded-lg bg-slate-800 text-slate-300 text-xs font-semibold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-lg bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold"
                  >
                    Save Adjustment
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
