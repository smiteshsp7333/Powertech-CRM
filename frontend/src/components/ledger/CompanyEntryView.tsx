'use client';

import React, { useState, useEffect } from 'react';
import { CompanyDailyEntry, UserSession } from '../../types/ledger';
import { GROUP_COMPANIES } from '../../lib/ledger/companies';
import { getCompanyEntries, saveCompanyDailyEntry } from '../../lib/ledger/store';
import {
  Calendar,
  Check,
  CheckCircle2,
  History,
  Building2,
  AlertCircle,
  Clock,
  Lock,
  Edit3,
} from 'lucide-react';

interface CompanyEntryViewProps {
  currentUser: UserSession;
  selectedDate: string;
}

export default function CompanyEntryView({ currentUser, selectedDate }: CompanyEntryViewProps) {
  const assignedCompanyId = currentUser.companyId || 'merit-i-laser';
  const company = GROUP_COMPANIES.find((c) => c.id === assignedCompanyId) || GROUP_COMPANIES[0];

  const todayDateStr = new Date().toISOString().slice(0, 10);

  const [date, setDate] = useState(selectedDate);
  const [billingWithGst, setBillingWithGst] = useState('');
  const [otherBilling, setOtherBilling] = useState('');
  const [paymentCollection, setPaymentCollection] = useState('');
  const [otherPayment, setOtherPayment] = useState('');
  const [paymentReceivedAt, setPaymentReceivedAt] = useState('');
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [history, setHistory] = useState<CompanyDailyEntry[]>([]);

  // Same-day edit rule:
  // Can only edit if the date being entered/viewed is today's current calendar date or the active register date
  const isSameDay = date === todayDateStr || date === selectedDate;

  useEffect(() => {
    setDate(selectedDate);
    refreshHistory(selectedDate);
  }, [selectedDate, assignedCompanyId]);

  const refreshHistory = (activeDate: string) => {
    const list = getCompanyEntries(company.id);
    setHistory(list);

    const existingToday = list.find((e) => e.date === activeDate);
    if (existingToday) {
      setBillingWithGst(
        String(
          existingToday.billingWithGst ||
            (existingToday.billing ? Math.round(existingToday.billing * 1.18) : existingToday.todayBilling)
        )
      );
      setOtherBilling(String(existingToday.otherBilling || '0'));
      setPaymentCollection(
        String(existingToday.paymentCollection || Math.round(existingToday.todayPayment * 0.95))
      );
      setOtherPayment(
        String(existingToday.otherPayment || Math.round(existingToday.todayPayment * 0.05))
      );
      setPaymentReceivedAt(existingToday.paymentReceivedAt || getDefaultDateTime(activeDate));
    } else {
      setBillingWithGst('');
      setOtherBilling('0');
      setPaymentCollection('');
      setOtherPayment('0');
      setPaymentReceivedAt(getDefaultDateTime(activeDate));
    }
  };

  const getDefaultDateTime = (d: string) => {
    const formatted = d.split('-').reverse().join('-');
    const now = new Date();
    const time = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
    return `${formatted}, ${time}`;
  };

  const bWithGstNum = parseFloat(billingWithGst) || 0;
  const oBillNum = parseFloat(otherBilling) || 0;
  const pColNum = parseFloat(paymentCollection) || 0;
  const oPayNum = parseFloat(otherPayment) || 0;

  const calculatedBaseBilling = bWithGstNum > 0 ? Math.round(bWithGstNum / 1.18) : 0;
  const calculatedTotalPayment = pColNum + oPayNum;
  const calculatedTotalBilling = bWithGstNum + oBillNum;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    // Enforce Same-day edit rule
    if (!isSameDay) {
      setErrorMessage('Entries can only be edited on the same day when made. Past dates are locked.');
      return;
    }

    if (!billingWithGst.trim()) {
      setErrorMessage('Billing with GST is mandatory.');
      return;
    }
    if (isNaN(bWithGstNum) || bWithGstNum < 0) {
      setErrorMessage('Please enter a valid Billing with GST figure.');
      return;
    }

    if (!paymentCollection.trim()) {
      setErrorMessage('Payment Collection is mandatory (enter 0 if nil).');
      return;
    }
    if (isNaN(pColNum) || pColNum < 0) {
      setErrorMessage('Please enter a valid Payment Collection figure.');
      return;
    }

    const entryToSave: CompanyDailyEntry = {
      id: `${company.id}_${date}`,
      companyId: company.id,
      companyName: company.name,
      date,
      billing: calculatedBaseBilling,
      otherBilling: oBillNum,
      billingWithGst: bWithGstNum,
      paymentCollection: pColNum,
      otherPayment: oPayNum,
      todayBilling: calculatedTotalBilling,
      todayPayment: calculatedTotalPayment,
      paymentReceivedAt: paymentReceivedAt || getDefaultDateTime(date),
      submittedBy: `${company.code} Operator`,
      submittedAt: new Date().toISOString(),
    };

    saveCompanyDailyEntry(entryToSave);
    setSavedSuccess(true);
    refreshHistory(date);

    setTimeout(() => {
      setSavedSuccess(false);
    }, 3500);
  };

  const handleSelectDateToEdit = (selectedHistoryDate: string) => {
    setDate(selectedHistoryDate);
    refreshHistory(selectedHistoryDate);
  };

  // Restrict submission log to last 7 days only
  const last7DaysHistory = history.slice(0, 7);

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Unit Identity Header */}
      <div className="bg-[#111c38] p-5 sm:p-6 rounded-2xl border border-slate-800 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 font-sans font-black text-sm">
            {company.code}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-black text-white tracking-tight">{company.name}</h2>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                Operating Portal
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Authorized Daily Financial Submission
            </p>
          </div>
        </div>

        {/* Date Selector */}
        <div className="flex items-center gap-2 bg-[#0b1329] px-3.5 py-2 rounded-xl border border-slate-800 self-start sm:self-auto">
          <Calendar className="w-4 h-4 text-blue-400 shrink-0" />
          <input
            type="date"
            value={date}
            onChange={(e) => {
              setDate(e.target.value);
              refreshHistory(e.target.value);
            }}
            className="bg-transparent border-none text-white text-xs font-sans font-bold focus:outline-none cursor-pointer"
            title="Select date for entry"
          />
        </div>
      </div>

      {/* Same-Day Edit Security Notice */}
      {!isSameDay ? (
        <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center gap-3 text-amber-300 text-xs">
          <Lock className="w-4 h-4 shrink-0 text-amber-400" />
          <span>
            <strong>Entry Locked (Past Date):</strong> Daily entries can only be edited on the same calendar day when made. This past record ({date}) is read-only.
          </span>
        </div>
      ) : (
        <div className="p-3.5 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center gap-2.5 text-blue-300 text-xs">
          <Edit3 className="w-4 h-4 shrink-0 text-blue-400" />
          <span>
            <strong>Same-Day Entry Active:</strong> You can submit and revise figures for {date}.
          </span>
        </div>
      )}

      {/* Main Submission Form (Strictly 4 Fields Matching Screenshot 2) */}
      <form onSubmit={handleSubmit} className="bg-[#111c38] p-6 rounded-2xl border border-slate-800 shadow-xl space-y-6">
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div>
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">
              Daily Operational Billing &amp; Payment Entry
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Enter gross billing with GST, other billing, and collections.
            </p>
          </div>
          <span className="text-[11px] font-bold text-slate-400 bg-slate-900 px-2.5 py-1 rounded-lg border border-slate-800">
            Date: {date}
          </span>
        </div>

        {errorMessage && (
          <div className="p-3.5 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {savedSuccess && (
          <div className="p-3.5 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>Record published successfully to Super Admin consolidated matrix.</span>
          </div>
        )}

        {/* 4 Fields Matching Screenshot 2 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Field 1: Billing with GST */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-300">
                Billing with GST (₹) <span className="text-rose-400">*</span>
              </label>
              {bWithGstNum > 0 && (
                <span className="text-[10px] text-slate-400 font-sans">
                  Base: ₹{calculatedBaseBilling.toLocaleString('en-IN')} + 18% GST
                </span>
              )}
            </div>
            <div className="relative">
              <input
                type="number"
                disabled={!isSameDay}
                value={billingWithGst}
                onChange={(e) => setBillingWithGst(e.target.value)}
                placeholder="e.g. 118000"
                className="w-full bg-[#0b1329] border border-slate-800 rounded-xl px-4 py-3 text-white text-base font-sans font-bold focus:outline-none focus:border-blue-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                required
              />
            </div>
            <span className="text-[11px] text-slate-500 block">
              Total invoiced value produced today inclusive of GST
            </span>
          </div>

          {/* Field 2: Other Billing */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-300 block">
              Other Billing (₹)
            </label>
            <input
              type="number"
              disabled={!isSameDay}
              value={otherBilling}
              onChange={(e) => setOtherBilling(e.target.value)}
              placeholder="e.g. 5000"
              className="w-full bg-[#0b1329] border border-slate-800 rounded-xl px-4 py-3 text-white text-base font-sans font-bold focus:outline-none focus:border-blue-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            />
            <span className="text-[11px] text-slate-500 block">
              Secondary or miscellaneous billing amount
            </span>
          </div>

          {/* Field 3: Payment Collection */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-300 block">
              Payment Collection (₹) <span className="text-rose-400">*</span>
            </label>
            <input
              type="number"
              disabled={!isSameDay}
              value={paymentCollection}
              onChange={(e) => setPaymentCollection(e.target.value)}
              placeholder="e.g. 110000"
              className="w-full bg-[#0b1329] border border-slate-800 rounded-xl px-4 py-3 text-emerald-400 text-base font-sans font-black focus:outline-none focus:border-emerald-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              required
            />
            <span className="text-[11px] text-slate-500 block">
              Primary collection / funds received today
            </span>
          </div>

          {/* Field 4: Other Payment */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-300 block">
              Other Payment (₹)
            </label>
            <input
              type="number"
              disabled={!isSameDay}
              value={otherPayment}
              onChange={(e) => setOtherPayment(e.target.value)}
              placeholder="e.g. 5000"
              className="w-full bg-[#0b1329] border border-slate-800 rounded-xl px-4 py-3 text-purple-400 text-base font-sans font-black focus:outline-none focus:border-purple-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            />
            <span className="text-[11px] text-slate-500 block">
              Other miscellaneous payments / receipts received
            </span>
          </div>
        </div>

        {/* Live Auto-Calculated Totals Summary */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-xl bg-[#0b1329] border border-slate-800">
          <div>
            <span className="text-[11px] text-slate-400 font-semibold uppercase tracking-wider block">
              Total Invoiced Billing
            </span>
            <span className="text-lg font-black font-sans text-white mt-0.5 block">
              ₹{calculatedTotalBilling.toLocaleString('en-IN')}
            </span>
            <span className="text-[10px] text-slate-500">
              Billing with GST (₹{bWithGstNum.toLocaleString('en-IN')}) + Other Billing (₹{oBillNum.toLocaleString('en-IN')})
            </span>
          </div>

          <div>
            <span className="text-[11px] text-slate-400 font-semibold uppercase tracking-wider block">
              Total Payment Received
            </span>
            <span className="text-lg font-black font-sans text-emerald-400 mt-0.5 block">
              ₹{calculatedTotalPayment.toLocaleString('en-IN')}
            </span>
            <span className="text-[10px] text-slate-500">
              Payment Collection (₹{pColNum.toLocaleString('en-IN')}) + Other Payment (₹{oPayNum.toLocaleString('en-IN')})
            </span>
          </div>
        </div>

        {/* Payment Timestamp */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-slate-300 block">
            Payment Realization Timestamp
          </label>
          <input
            type="text"
            disabled={!isSameDay}
            value={paymentReceivedAt}
            onChange={(e) => setPaymentReceivedAt(e.target.value)}
            placeholder="e.g. 23-10-2026, 04:15 PM"
            className="w-full bg-[#0b1329] border border-slate-800 rounded-xl px-4 py-2.5 text-slate-200 text-xs font-sans font-semibold focus:outline-none focus:border-blue-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          />
        </div>

        {/* Submit Button */}
        <div className="pt-2 flex justify-end">
          <button
            type="submit"
            disabled={!isSameDay}
            className="w-full sm:w-auto px-7 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black uppercase tracking-wider shadow-lg shadow-emerald-600/25 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Check className="w-4 h-4" />
            <span>Submit &amp; Publish to Super Admin</span>
          </button>
        </div>
      </form>

      {/* Submission Log Table (Strictly Last 7 Days, Matching Screenshot 2) */}
      <div className="bg-[#111c38] rounded-2xl border border-slate-800 shadow-xl overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <History className="w-4 h-4 text-blue-400" />
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">
              Submission Log ({company.name})
            </h3>
          </div>
          <span className="text-xs text-slate-400 font-semibold bg-slate-900 border border-slate-800 px-3 py-1 rounded-full">
            Last 7 Days Data Only
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-800 bg-[#0b1329] text-slate-400 font-bold uppercase tracking-wider text-[11px]">
                <th className="py-3 px-3.5">Date</th>
                <th className="py-3 px-3 text-right">Billing with GST</th>
                <th className="py-3 px-3 text-right">Other Billing</th>
                <th className="py-3 px-3 text-right text-emerald-400">Payment Collection</th>
                <th className="py-3 px-3 text-right text-purple-400">Other Payment</th>
                <th className="py-3 px-3 text-center">Payment Received At</th>
                <th className="py-3 px-3 text-center">Status</th>
                <th className="py-3 px-3 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {last7DaysHistory.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-500 italic">
                    No entries recorded yet for the last 7 days. Submit today&apos;s figures above.
                  </td>
                </tr>
              ) : (
                last7DaysHistory.map((row) => {
                  const canEditThisRow = row.date === todayDateStr || row.date === selectedDate;
                  const rowBWithGst =
                    row.billingWithGst ||
                    (row.billing ? Math.round(row.billing * 1.18) : row.todayBilling);
                  const rowOBill = row.otherBilling || 0;
                  const rowPCol = row.paymentCollection || Math.round(row.todayPayment * 0.95);
                  const rowOPay = row.otherPayment || Math.round(row.todayPayment * 0.05);

                  return (
                    <tr key={row.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="py-3.5 px-3.5 font-bold font-sans text-white">
                        {row.date}
                      </td>

                      <td className="py-3.5 px-3 text-right font-bold font-sans text-slate-100">
                        ₹{rowBWithGst.toLocaleString('en-IN')}
                      </td>

                      <td className="py-3.5 px-3 text-right font-bold font-sans text-slate-300">
                        ₹{rowOBill.toLocaleString('en-IN')}
                      </td>

                      <td className="py-3.5 px-3 text-right font-black font-sans text-emerald-400">
                        ₹{rowPCol.toLocaleString('en-IN')}
                      </td>

                      <td className="py-3.5 px-3 text-right font-bold font-sans text-purple-400">
                        ₹{rowOPay.toLocaleString('en-IN')}
                      </td>

                      <td className="py-3.5 px-3 text-center text-xs text-slate-300">
                        {row.paymentReceivedAt || '-'}
                      </td>

                      <td className="py-3.5 px-3 text-center">
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                          <CheckCircle2 className="w-3 h-3" /> Recorded
                        </span>
                      </td>

                      <td className="py-3.5 px-3 text-center">
                        {canEditThisRow ? (
                          <button
                            type="button"
                            onClick={() => handleSelectDateToEdit(row.date)}
                            className="px-2.5 py-1 rounded-lg bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 text-xs font-bold border border-blue-500/30 transition-colors inline-flex items-center gap-1 cursor-pointer"
                          >
                            <Edit3 className="w-3 h-3" />
                            <span>Edit</span>
                          </button>
                        ) : (
                          <span
                            className="px-2 py-1 rounded-lg bg-slate-800 text-slate-500 text-[10px] font-bold border border-slate-700/60 inline-flex items-center gap-1 cursor-not-allowed"
                            title="Locked - Can only edit on the same day"
                          >
                            <Lock className="w-3 h-3" />
                            <span>Locked</span>
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
