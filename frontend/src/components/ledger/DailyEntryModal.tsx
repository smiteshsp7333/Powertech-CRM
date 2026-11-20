'use client';

import React, { useState, useEffect } from 'react';
import { CompanyDailyEntry } from '../../types/ledger';
import { GROUP_COMPANIES } from '../../lib/ledger/companies';
import { X, Check, Building2, Calendar, AlertCircle } from 'lucide-react';

interface DailyEntryModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedDate: string;
  defaultCompanyId?: string;
  existingEntry?: CompanyDailyEntry;
  onSave: (entry: CompanyDailyEntry) => void;
}

export default function DailyEntryModal({
  isOpen,
  onClose,
  selectedDate,
  defaultCompanyId,
  existingEntry,
  onSave,
}: DailyEntryModalProps) {
  const [companyId, setCompanyId] = useState(defaultCompanyId || GROUP_COMPANIES[0].id);
  const [date, setDate] = useState(selectedDate);
  const [billingWithGst, setBillingWithGst] = useState('');
  const [otherBilling, setOtherBilling] = useState('0');
  const [paymentCollection, setPaymentCollection] = useState('');
  const [otherPayment, setOtherPayment] = useState('0');
  const [paymentReceivedAt, setPaymentReceivedAt] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (defaultCompanyId) {
      setCompanyId(defaultCompanyId);
    }
  }, [defaultCompanyId]);

  useEffect(() => {
    setDate(selectedDate);
  }, [selectedDate]);

  const getDefaultDateTime = (d: string) => {
    const formatted = d.split('-').reverse().join('-');
    const now = new Date();
    const time = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
    return `${formatted}, ${time}`;
  };

  useEffect(() => {
    if (existingEntry) {
      const bWithGst =
        existingEntry.billingWithGst !== undefined && existingEntry.billingWithGst !== null
          ? existingEntry.billingWithGst
          : existingEntry.billing !== undefined && existingEntry.billing !== null
          ? Math.round(existingEntry.billing * 1.18)
          : existingEntry.todayBilling ?? '';
      setBillingWithGst(String(bWithGst));
      setOtherBilling(
        existingEntry.otherBilling !== undefined && existingEntry.otherBilling !== null
          ? String(existingEntry.otherBilling)
          : '0'
      );
      setPaymentCollection(
        existingEntry.paymentCollection !== undefined && existingEntry.paymentCollection !== null
          ? String(existingEntry.paymentCollection)
          : ''
      );
      setOtherPayment(
        existingEntry.otherPayment !== undefined && existingEntry.otherPayment !== null
          ? String(existingEntry.otherPayment)
          : '0'
      );
      setPaymentReceivedAt(existingEntry.paymentReceivedAt || getDefaultDateTime(existingEntry.date));
    } else {
      setBillingWithGst('');
      setOtherBilling('0');
      setPaymentCollection('');
      setOtherPayment('0');
      setPaymentReceivedAt(getDefaultDateTime(date));
    }
  }, [existingEntry, date, isOpen]);

  if (!isOpen) return null;

  const selectedCompany = GROUP_COMPANIES.find((c) => c.id === companyId);

  const bWithGstNum = parseFloat(billingWithGst) || 0;
  const oBillNum = parseFloat(otherBilling) || 0;
  const pColNum = parseFloat(paymentCollection) || 0;
  const oPayNum = parseFloat(otherPayment) || 0;

  const calculatedBaseBilling = bWithGstNum > 0 ? Math.round(bWithGstNum / 1.18) : 0;
  const calculatedTotalBilling = bWithGstNum + oBillNum;
  const calculatedTotalPayment = pColNum + oPayNum;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!billingWithGst.trim()) {
      setError('Billing with GST is mandatory.');
      return;
    }
    if (isNaN(bWithGstNum) || bWithGstNum < 0) {
      setError('Please enter a valid Billing with GST figure (0 or more).');
      return;
    }

    if (!paymentCollection.trim()) {
      setError('Payment Collection is mandatory (enter 0 if nil).');
      return;
    }
    if (isNaN(pColNum) || pColNum < 0) {
      setError('Please enter a valid Payment Collection figure.');
      return;
    }

    if (isNaN(oBillNum) || oBillNum < 0) {
      setError('Please enter a valid Other Billing figure.');
      return;
    }

    if (isNaN(oPayNum) || oPayNum < 0) {
      setError('Please enter a valid Other Payment figure.');
      return;
    }

    const key = `${companyId}_${date}`;
    onSave({
      id: key,
      companyId,
      companyName: selectedCompany ? selectedCompany.name : companyId,
      date,
      billing: calculatedBaseBilling,
      otherBilling: oBillNum,
      billingWithGst: bWithGstNum,
      paymentCollection: pColNum,
      otherPayment: oPayNum,
      todayBilling: calculatedTotalBilling,
      todayPayment: calculatedTotalPayment,
      gstPayment: pColNum,
      paymentReceivedAt: paymentReceivedAt.trim() || getDefaultDateTime(date),
      submittedBy: 'Super Admin',
      submittedAt: new Date().toISOString(),
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-xl bg-[#0f172a] border border-slate-700/80 rounded-2xl p-6 sm:p-7 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800 mb-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-500/15 text-blue-400 flex items-center justify-center border border-blue-500/30">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white tracking-tight">Record Daily Entry</h2>
              <p className="text-xs text-slate-400">Super Admin Manual Console</p>
            </div>
          </div>
          <button
            onClick={onClose}
            type="button"
            className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {error && (
          <div className="p-3 mb-4 rounded-xl bg-rose-500/15 border border-rose-500/30 text-xs text-rose-300 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          {/* Company & Date */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block font-semibold text-slate-300 mb-1.5">
                Group Company *
              </label>
              <select
                value={companyId}
                onChange={(e) => setCompanyId(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#1e293b] border border-slate-700 text-white font-semibold focus:outline-none focus:border-blue-500 transition-all font-sans"
              >
                {GROUP_COMPANIES.map((comp) => (
                  <option key={comp.id} value={comp.id} className="bg-[#1e293b] text-white">
                    {comp.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-blue-400" /> Entry Date *
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#1e293b] border border-slate-700 text-white font-sans font-semibold focus:outline-none focus:border-blue-500 transition-all"
                required
              />
            </div>
          </div>

          {/* Billing with GST & Other Billing */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block font-semibold text-slate-300">
                  Billing with GST (₹) *
                </label>
                {bWithGstNum > 0 && (
                  <span className="text-[10px] text-slate-400 font-sans">
                    Base: ₹{calculatedBaseBilling.toLocaleString('en-IN')}
                  </span>
                )}
              </div>
              <div className="relative">
                <input
                  type="number"
                  step="1"
                  value={billingWithGst}
                  onChange={(e) => setBillingWithGst(e.target.value)}
                  placeholder="e.g. 118000"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#1e293b] border border-slate-700 text-white font-sans text-base font-bold focus:outline-none focus:border-blue-500 transition-all"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block font-semibold text-slate-300 mb-1.5">
                Other Billing (₹)
              </label>
              <div className="relative">
                <input
                  type="number"
                  step="1"
                  value={otherBilling}
                  onChange={(e) => setOtherBilling(e.target.value)}
                  placeholder="e.g. 5000"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#1e293b] border border-slate-700 text-white font-sans text-base font-bold focus:outline-none focus:border-blue-500 transition-all"
                />
              </div>
            </div>
          </div>

          {/* Payment Collection & Other Payment */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block font-semibold text-slate-300 mb-1.5">
                Payment Collection (₹) *
              </label>
              <div className="relative">
                <input
                  type="number"
                  step="1"
                  value={paymentCollection}
                  onChange={(e) => setPaymentCollection(e.target.value)}
                  placeholder="e.g. 110000"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#1e293b] border border-slate-700 text-emerald-400 font-sans text-base font-bold focus:outline-none focus:border-emerald-500 transition-all"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block font-semibold text-slate-300 mb-1.5">
                Other Payment (₹)
              </label>
              <div className="relative">
                <input
                  type="number"
                  step="1"
                  value={otherPayment}
                  onChange={(e) => setOtherPayment(e.target.value)}
                  placeholder="e.g. 5000"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#1e293b] border border-slate-700 text-purple-400 font-sans text-base font-bold focus:outline-none focus:border-purple-500 transition-all"
                />
              </div>
            </div>
          </div>

          {/* Calculated Summary Preview */}
          <div className="grid grid-cols-2 gap-3 p-3.5 rounded-xl bg-[#0b1329] border border-slate-800">
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
                Total Invoiced Billing
              </span>
              <span className="text-sm font-bold font-sans text-white mt-0.5 block">
                ₹{calculatedTotalBilling.toLocaleString('en-IN')}
              </span>
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
                Total Collection
              </span>
              <span className="text-sm font-bold font-sans text-emerald-400 mt-0.5 block">
                ₹{calculatedTotalPayment.toLocaleString('en-IN')}
              </span>
            </div>
          </div>

          {/* Payment Received Date & Time */}
          <div>
            <label className="block font-semibold text-slate-300 mb-1.5">
              Payment Received Date &amp; Time
            </label>
            <input
              type="text"
              value={paymentReceivedAt}
              onChange={(e) => setPaymentReceivedAt(e.target.value)}
              placeholder="e.g. 23-10-2026, 04:15 PM"
              className="w-full px-3.5 py-2.5 rounded-xl bg-[#1e293b] border border-slate-700 text-white font-sans focus:outline-none focus:border-blue-500 transition-all"
            />
          </div>

          {/* Actions */}
          <div className="pt-4 border-t border-slate-800 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-slate-700 text-slate-400 hover:text-white hover:bg-slate-800 transition-all cursor-pointer font-sans"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold shadow-lg shadow-emerald-600/20 flex items-center gap-1.5 transition-all cursor-pointer font-sans"
            >
              <Check className="w-4 h-4" />
              <span>Save &amp; Publish</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
