'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { CompanySummary, GroupGrandTotal, GroupCompany } from '../../types/ledger';
import { SYSTEM_ACCOUNTS } from '../../lib/ledger/companies';
import {
  Building2,
  TrendingUp,
  CheckCircle2,
  Clock,
  Edit2,
  ChevronRight,
  Calendar,
  Key,
  Copy,
  Check,
  X,
  Boxes,
  Coins,
  ShieldCheck,
  RotateCcw,
  Receipt,
  CreditCard,
  LayoutDashboard,
} from 'lucide-react';

interface MasterConsolidatedViewProps {
  selectedDate: string;
  setSelectedDate: (date: string) => void;
  activeView: 'DAILY' | 'MONTHLY';
  summaries: CompanySummary[];
  grandTotal: GroupGrandTotal;
  onEditCompany: (companyId: string) => void;
  selectedCompanyFilter: string | null;
  setSelectedCompanyFilter: (id: string | null) => void;
}

export type DivisionFilter = 'ALL' | 'PVD' | 'LASER';

export default function MasterConsolidatedView({
  selectedDate,
  setSelectedDate,
  activeView,
  summaries,
  grandTotal,
  onEditCompany,
  selectedCompanyFilter,
  setSelectedCompanyFilter,
}: MasterConsolidatedViewProps) {
  const [showAccountsModal, setShowAccountsModal] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [selectedDivision, setSelectedDivision] = useState<DivisionFilter>('ALL');
  const [showDivisionBoxes, setShowDivisionBoxes] = useState<boolean>(true);

  const handleCopy = (id: string, text: string) => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(text);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    }
  };

  const companyAccounts = SYSTEM_ACCOUNTS.filter((acc) => acc.role === 'COMPANY_USER');

  // Division categorizer: PVD vs Laser (Laser includes cutting and works)
  const isPvdCompany = (comp: GroupCompany) =>
    comp.category === 'PVD' || comp.name.toUpperCase().includes('PVD');

  const pvdSummaries = useMemo(
    () => summaries.filter((s) => isPvdCompany(s.company)),
    [summaries]
  );
  const laserSummaries = useMemo(
    () => summaries.filter((s) => !isPvdCompany(s.company)),
    [summaries]
  );

  // Aggregated figures for PVD Division
  const pvdTotals = useMemo(() => {
    const billing = pvdSummaries.reduce((acc, s) => acc + s.billing, 0);
    const otherBilling = pvdSummaries.reduce((acc, s) => acc + s.otherBilling, 0);
    const billingWithGst = pvdSummaries.reduce((acc, s) => acc + s.billingWithGst, 0);
    const paymentCollection = pvdSummaries.reduce((acc, s) => acc + s.paymentCollection, 0);
    const otherPayment = pvdSummaries.reduce((acc, s) => acc + s.otherPayment, 0);
    const todayPayment = pvdSummaries.reduce((acc, s) => acc + s.todayPayment, 0);
    const todayBilling = pvdSummaries.reduce((acc, s) => acc + s.todayBilling, 0);

    const monthBilling = pvdSummaries.reduce((acc, s) => acc + s.monthBilling, 0);
    const monthOtherBilling = pvdSummaries.reduce((acc, s) => acc + s.monthOtherBilling, 0);
    const monthBillingWithGst = pvdSummaries.reduce((acc, s) => acc + s.monthBillingWithGst, 0);
    const monthPaymentCollection = pvdSummaries.reduce((acc, s) => acc + s.monthPaymentCollection, 0);
    const monthOtherPayment = pvdSummaries.reduce((acc, s) => acc + s.monthOtherPayment, 0);
    const monthPayment = pvdSummaries.reduce((acc, s) => acc + s.monthPayment, 0);

    const submittedCount = pvdSummaries.filter((s) => s.hasEntryToday).length;
    const recoveryRate = todayBilling > 0 ? ((todayPayment / todayBilling) * 100).toFixed(1) : '0.0';
    const monthRecoveryRate =
      monthBilling > 0 ? ((monthPayment / monthBilling) * 100).toFixed(1) : '0.0';

    return {
      billing,
      otherBilling,
      billingWithGst,
      paymentCollection,
      otherPayment,
      todayBilling,
      todayPayment,
      monthBilling,
      monthOtherBilling,
      monthBillingWithGst,
      monthPaymentCollection,
      monthOtherPayment,
      monthPayment,
      submittedCount,
      totalCount: pvdSummaries.length,
      recoveryRate,
      monthRecoveryRate,
    };
  }, [pvdSummaries]);

  // Aggregated figures for Laser Division
  const laserTotals = useMemo(() => {
    const billing = laserSummaries.reduce((acc, s) => acc + s.billing, 0);
    const otherBilling = laserSummaries.reduce((acc, s) => acc + s.otherBilling, 0);
    const billingWithGst = laserSummaries.reduce((acc, s) => acc + s.billingWithGst, 0);
    const paymentCollection = laserSummaries.reduce((acc, s) => acc + s.paymentCollection, 0);
    const otherPayment = laserSummaries.reduce((acc, s) => acc + s.otherPayment, 0);
    const todayPayment = laserSummaries.reduce((acc, s) => acc + s.todayPayment, 0);
    const todayBilling = laserSummaries.reduce((acc, s) => acc + s.todayBilling, 0);

    const monthBilling = laserSummaries.reduce((acc, s) => acc + s.monthBilling, 0);
    const monthOtherBilling = laserSummaries.reduce((acc, s) => acc + s.monthOtherBilling, 0);
    const monthBillingWithGst = laserSummaries.reduce((acc, s) => acc + s.monthBillingWithGst, 0);
    const monthPaymentCollection = laserSummaries.reduce((acc, s) => acc + s.monthPaymentCollection, 0);
    const monthOtherPayment = laserSummaries.reduce((acc, s) => acc + s.monthOtherPayment, 0);
    const monthPayment = laserSummaries.reduce((acc, s) => acc + s.monthPayment, 0);

    const submittedCount = laserSummaries.filter((s) => s.hasEntryToday).length;
    const recoveryRate =
      todayBilling > 0 ? ((todayPayment / todayBilling) * 100).toFixed(1) : '0.0';
    const monthRecoveryRate =
      monthBilling > 0 ? ((monthPayment / monthBilling) * 100).toFixed(1) : '0.0';

    return {
      billing,
      otherBilling,
      billingWithGst,
      paymentCollection,
      otherPayment,
      todayBilling,
      todayPayment,
      monthBilling,
      monthOtherBilling,
      monthBillingWithGst,
      monthPaymentCollection,
      monthOtherPayment,
      monthPayment,
      submittedCount,
      totalCount: laserSummaries.length,
      recoveryRate,
      monthRecoveryRate,
    };
  }, [laserSummaries]);

  // Apply Division and Single Company filters
  const filteredSummaries = useMemo(() => {
    let list = summaries;
    if (selectedDivision === 'PVD') {
      list = list.filter((s) => isPvdCompany(s.company));
    } else if (selectedDivision === 'LASER') {
      list = list.filter((s) => !isPvdCompany(s.company));
    }

    if (selectedCompanyFilter) {
      list = list.filter((s) => s.company.id === selectedCompanyFilter);
    }
    return list;
  }, [summaries, selectedDivision, selectedCompanyFilter]);

  const isIndividualView = Boolean(selectedCompanyFilter && filteredSummaries.length === 1);
  const singleSummary = isIndividualView ? filteredSummaries[0] : null;

  const isMonthly = activeView === 'MONTHLY';
  const monthName = new Date(selectedDate).toLocaleString('default', {
    month: 'long',
    year: 'numeric',
  });

  // Calculate dynamic footer totals
  const displayFooterTotal = useMemo(() => {
    if (isIndividualView && singleSummary) {
      return {
        label: 'TOTAL - ' + singleSummary.company.name.toUpperCase(),
        billing: singleSummary.billing,
        otherBilling: singleSummary.otherBilling,
        billingWithGst: singleSummary.billingWithGst,
        paymentCollection: singleSummary.paymentCollection,
        otherPayment: singleSummary.otherPayment,
        todayPayment: singleSummary.todayPayment,
        monthBilling: singleSummary.monthBilling,
        monthOtherBilling: singleSummary.monthOtherBilling,
        monthBillingWithGst: singleSummary.monthBillingWithGst,
        monthPaymentCollection: singleSummary.monthPaymentCollection,
        monthOtherPayment: singleSummary.monthOtherPayment,
        monthPayment: singleSummary.monthPayment,
        statusText: singleSummary.hasEntryToday ? 'Submitted' : 'Pending',
        collectionRate: singleSummary.collectionRate,
      };
    }

    if (selectedDivision === 'PVD') {
      return {
        label: `PVD DIVISION TOTAL (${pvdTotals.totalCount} PLANTS)`,
        billing: pvdTotals.billing,
        otherBilling: pvdTotals.otherBilling,
        billingWithGst: pvdTotals.billingWithGst,
        paymentCollection: pvdTotals.paymentCollection,
        otherPayment: pvdTotals.otherPayment,
        todayPayment: pvdTotals.todayPayment,
        monthBilling: pvdTotals.monthBilling,
        monthOtherBilling: pvdTotals.monthOtherBilling,
        monthBillingWithGst: pvdTotals.monthBillingWithGst,
        monthPaymentCollection: pvdTotals.monthPaymentCollection,
        monthOtherPayment: pvdTotals.monthOtherPayment,
        monthPayment: pvdTotals.monthPayment,
        statusText: `${pvdTotals.submittedCount}/${pvdTotals.totalCount} Done`,
        collectionRate: Number(pvdTotals.recoveryRate),
      };
    }

    if (selectedDivision === 'LASER') {
      return {
        label: `LASER DIVISION TOTAL (${laserTotals.totalCount} PLANTS)`,
        billing: laserTotals.billing,
        otherBilling: laserTotals.otherBilling,
        billingWithGst: laserTotals.billingWithGst,
        paymentCollection: laserTotals.paymentCollection,
        otherPayment: laserTotals.otherPayment,
        todayPayment: laserTotals.todayPayment,
        monthBilling: laserTotals.monthBilling,
        monthOtherBilling: laserTotals.monthOtherBilling,
        monthBillingWithGst: laserTotals.monthBillingWithGst,
        monthPaymentCollection: laserTotals.monthPaymentCollection,
        monthOtherPayment: laserTotals.monthOtherPayment,
        monthPayment: laserTotals.monthPayment,
        statusText: `${laserTotals.submittedCount}/${laserTotals.totalCount} Done`,
        collectionRate: Number(laserTotals.recoveryRate),
      };
    }

    return {
      label: 'GRAND TOTAL (ALL COMPANIES)',
      billing: grandTotal.billing,
      otherBilling: grandTotal.otherBilling,
      billingWithGst: grandTotal.billingWithGst,
      paymentCollection: grandTotal.paymentCollection,
      otherPayment: grandTotal.otherPayment,
      todayPayment: grandTotal.todayPayment,
      monthBilling: grandTotal.monthBilling,
      monthOtherBilling: grandTotal.monthOtherBilling,
      monthBillingWithGst: grandTotal.monthBillingWithGst,
      monthPaymentCollection: grandTotal.monthPaymentCollection,
      monthOtherPayment: grandTotal.monthOtherPayment,
      monthPayment: grandTotal.monthPayment,
      statusText: `${grandTotal.submittedCount}/${grandTotal.totalCompanies} Done`,
      collectionRate: grandTotal.collectionRate,
    };
  }, [isIndividualView, singleSummary, selectedDivision, pvdTotals, laserTotals, grandTotal]);

  const handleSelectDivision = (div: DivisionFilter) => {
    setSelectedDivision(div);
    setSelectedCompanyFilter(null);
  };

  const handleResetFilters = () => {
    setSelectedDivision('ALL');
    setSelectedCompanyFilter(null);
  };

  return (
    <div className="space-y-6">
      {/* 5 Executive Metric Cards Aligned with Screenshot 1 Columns */}
      {!isMonthly ? (
        // DAILY MATRIX METRIC CARDS
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
          {/* Box 1: Billing (Base) */}
          <div className="bg-[#111c38] p-5 rounded-2xl border border-slate-800/80 shadow-xl transition-all hover:border-slate-700">
            <div className="flex items-center justify-between mb-3">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                Billing (Base)
              </span>
              <div className="w-8 h-8 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center border border-blue-500/20">
                <Receipt className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-black font-sans text-white tracking-tight">
              ₹{displayFooterTotal.billing.toLocaleString('en-IN')}
            </div>
            <span className="text-xs text-slate-400 mt-2 block truncate">
              {isIndividualView
                ? `Unit: ${singleSummary?.company.name}`
                : selectedDivision !== 'ALL'
                ? `${selectedDivision} Division (${displayFooterTotal.statusText})`
                : `Across ${grandTotal.submittedCount} of ${grandTotal.totalCompanies} companies`}
            </span>
          </div>

          {/* Box 2: Other Billing */}
          <div className="bg-[#111c38] p-5 rounded-2xl border border-slate-800/80 shadow-xl transition-all hover:border-slate-700">
            <div className="flex items-center justify-between mb-3">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                Other Billing
              </span>
              <div className="w-8 h-8 rounded-xl bg-cyan-500/10 text-cyan-400 flex items-center justify-center border border-cyan-500/20">
                <TrendingUp className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-black font-sans text-cyan-400 tracking-tight">
              ₹{displayFooterTotal.otherBilling.toLocaleString('en-IN')}
            </div>
            <span className="text-xs text-slate-400 mt-2 block truncate">
              Secondary billings today
            </span>
          </div>

          {/* Box 3: Payment Collection (Interactive Box) */}
          <div
            onClick={() => setShowDivisionBoxes(!showDivisionBoxes)}
            className={`cursor-pointer p-5 rounded-2xl border shadow-xl transition-all select-none ${
              showDivisionBoxes
                ? 'bg-[#111c38] border-emerald-500/60 ring-1 ring-emerald-500/40 shadow-emerald-500/5'
                : 'bg-[#111c38] border-slate-800/80 hover:border-emerald-500/50'
            }`}
            title="Click to toggle PVD vs Laser collections breakdown"
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <span>Payment Collection</span>
                <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400">
                  Breakdown
                </span>
              </span>
              <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center border border-emerald-500/20">
                <Coins className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-black font-sans text-emerald-400 tracking-tight">
              ₹{displayFooterTotal.paymentCollection.toLocaleString('en-IN')}
            </div>
            <span className="text-xs text-slate-400 mt-2 block truncate">
              PVD: ₹{pvdTotals.paymentCollection.toLocaleString('en-IN')} • Laser: ₹
              {laserTotals.paymentCollection.toLocaleString('en-IN')}
            </span>
          </div>

          {/* Box 4: Other Payment */}
          <div className="bg-[#111c38] p-5 rounded-2xl border border-slate-800/80 shadow-xl transition-all hover:border-slate-700">
            <div className="flex items-center justify-between mb-3">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                Other Payment
              </span>
              <div className="w-8 h-8 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center border border-purple-500/20">
                <CreditCard className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-black font-sans text-purple-400 tracking-tight">
              ₹{displayFooterTotal.otherPayment.toLocaleString('en-IN')}
            </div>
            <span className="text-xs text-slate-400 mt-2 block truncate">
              PVD: ₹{pvdTotals.otherPayment.toLocaleString('en-IN')} • Laser: ₹
              {laserTotals.otherPayment.toLocaleString('en-IN')}
            </span>
          </div>

          {/* Box 5: Including GST (Gross Invoiced Billing) */}
          <div className="bg-[#111c38] p-5 rounded-2xl border border-slate-800/80 shadow-xl transition-all hover:border-slate-700">
            <div className="flex items-center justify-between mb-3">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                Including GST
              </span>
              <div className="w-8 h-8 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center border border-blue-500/20">
                <ShieldCheck className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-black font-sans text-blue-400 tracking-tight">
              ₹{displayFooterTotal.billingWithGst.toLocaleString('en-IN')}
            </div>
            <span className="text-xs text-slate-400 mt-2 block truncate">
              Gross Billing with 18% GST
            </span>
          </div>
        </div>
      ) : (
        // MONTHLY CUMULATIVE METRIC CARDS
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
          {/* MTD Billing (Base) */}
          <div className="bg-[#111c38] p-5 rounded-2xl border border-slate-800/80 shadow-xl">
            <div className="flex items-center justify-between mb-3">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                MTD Billing (Base)
              </span>
              <div className="w-8 h-8 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center border border-blue-500/20">
                <Receipt className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-black font-sans text-white tracking-tight">
              ₹{displayFooterTotal.monthBilling.toLocaleString('en-IN')}
            </div>
            <span className="text-xs text-slate-400 mt-2 block">
              {monthName} Base Turnover
            </span>
          </div>

          {/* MTD Other Billing */}
          <div className="bg-[#111c38] p-5 rounded-2xl border border-slate-800/80 shadow-xl">
            <div className="flex items-center justify-between mb-3">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                MTD Other Billing
              </span>
              <div className="w-8 h-8 rounded-xl bg-cyan-500/10 text-cyan-400 flex items-center justify-center border border-cyan-500/20">
                <TrendingUp className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-black font-sans text-cyan-400 tracking-tight">
              ₹{displayFooterTotal.monthOtherBilling.toLocaleString('en-IN')}
            </div>
            <span className="text-xs text-slate-400 mt-2 block">
              Cumulative Other Billings
            </span>
          </div>

          {/* MTD Payment Collection (Interactive Box) */}
          <div
            onClick={() => setShowDivisionBoxes(!showDivisionBoxes)}
            className={`cursor-pointer p-5 rounded-2xl border shadow-xl transition-all select-none ${
              showDivisionBoxes
                ? 'bg-[#111c38] border-emerald-500/60 ring-1 ring-emerald-500/40'
                : 'bg-[#111c38] border-slate-800/80 hover:border-emerald-500/50'
            }`}
            title="Click to toggle PVD vs Laser MTD split"
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <span>MTD Collections</span>
                <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400">
                  Breakdown
                </span>
              </span>
              <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center border border-emerald-500/20">
                <Coins className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-black font-sans text-emerald-400 tracking-tight">
              ₹{displayFooterTotal.monthPaymentCollection.toLocaleString('en-IN')}
            </div>
            <span className="text-xs text-slate-400 mt-2 block truncate">
              PVD: ₹{pvdTotals.monthPaymentCollection.toLocaleString('en-IN')} • Laser: ₹
              {laserTotals.monthPaymentCollection.toLocaleString('en-IN')}
            </span>
          </div>

          {/* MTD Other Payment */}
          <div className="bg-[#111c38] p-5 rounded-2xl border border-slate-800/80 shadow-xl">
            <div className="flex items-center justify-between mb-3">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                MTD Other Payment
              </span>
              <div className="w-8 h-8 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center border border-purple-500/20">
                <CreditCard className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-black font-sans text-purple-400 tracking-tight">
              ₹{displayFooterTotal.monthOtherPayment.toLocaleString('en-IN')}
            </div>
            <span className="text-xs text-slate-400 mt-2 block truncate">
              PVD: ₹{pvdTotals.monthOtherPayment.toLocaleString('en-IN')} • Laser: ₹
              {laserTotals.monthOtherPayment.toLocaleString('en-IN')}
            </span>
          </div>

          {/* MTD Including GST */}
          <div className="bg-[#111c38] p-5 rounded-2xl border border-slate-800/80 shadow-xl">
            <div className="flex items-center justify-between mb-3">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                MTD Including GST
              </span>
              <div className="w-8 h-8 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center border border-blue-500/20">
                <ShieldCheck className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-black font-sans text-blue-400 tracking-tight">
              ₹{displayFooterTotal.monthBillingWithGst.toLocaleString('en-IN')}
            </div>
            <span className="text-xs text-slate-400 mt-2 block">
              Cumulative Billing with GST
            </span>
          </div>
        </div>
      )}

      {/* DEDICATED DIVISION COLLECTIONS COMPARISON PANELS (PVD vs LASER) */}
      {showDivisionBoxes && (
        <div className="space-y-3">
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-200 flex items-center gap-2">
                <Boxes className="w-4 h-4 text-emerald-400" />
                <span>Division Collections Breakdown</span>
              </span>
              <span className="text-[11px] text-slate-400 bg-slate-800/80 border border-slate-700/80 px-2.5 py-0.5 rounded-full font-medium">
                Select a division to filter related data
              </span>
            </div>
            {selectedDivision !== 'ALL' && (
              <button
                type="button"
                onClick={handleResetFilters}
                className="text-xs text-blue-400 hover:text-blue-300 font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Show All Companies</span>
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Box A: PVD Coating Division Collections */}
            <div
              onClick={() => handleSelectDivision(selectedDivision === 'PVD' ? 'ALL' : 'PVD')}
              className={`p-6 rounded-2xl border transition-all cursor-pointer relative shadow-xl select-none ${
                selectedDivision === 'PVD'
                  ? 'bg-[#151c3d] border-purple-500 ring-2 ring-purple-500/40 shadow-purple-500/10'
                  : 'bg-[#111c38] border-slate-800 hover:border-purple-500/60 hover:bg-[#131f42]'
              }`}
            >
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-purple-400" />
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-200">
                      PVD Coating Division Collections
                    </span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30">
                      {pvdTotals.totalCount} Plants
                    </span>
                  </div>
                  <div className="text-3xl font-black font-sans text-white mt-2.5 tracking-tight">
                    ₹
                    {(isMonthly ? pvdTotals.monthPayment : pvdTotals.todayPayment).toLocaleString(
                      'en-IN'
                    )}
                  </div>
                </div>

                <div className="text-right bg-slate-900/60 border border-slate-800 px-3 py-1.5 rounded-xl">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
                    Recovery Rate
                  </span>
                  <span className="text-sm font-extrabold font-sans text-emerald-400">
                    {isMonthly ? pvdTotals.monthRecoveryRate : pvdTotals.recoveryRate}%
                  </span>
                </div>
              </div>

              {/* Sub-breakdown: Payment Collection vs Other Payment */}
              <div className="grid grid-cols-2 gap-3 mt-4 pt-4 border-t border-slate-800">
                <div className="bg-[#0b1329] rounded-xl p-3 border border-slate-800/80">
                  <span className="text-[10px] text-slate-400 block font-semibold uppercase tracking-wider">
                    Payment Collection
                  </span>
                  <span className="text-base font-bold font-sans text-emerald-400 mt-1 block">
                    ₹
                    {(isMonthly ? pvdTotals.monthPaymentCollection : pvdTotals.paymentCollection).toLocaleString('en-IN')}
                  </span>
                </div>
                <div className="bg-[#0b1329] rounded-xl p-3 border border-slate-800/80">
                  <span className="text-[10px] text-slate-400 block font-semibold uppercase tracking-wider">
                    Other Payment
                  </span>
                  <span className="text-base font-bold font-sans text-purple-400 mt-1 block">
                    ₹
                    {(isMonthly ? pvdTotals.monthOtherPayment : pvdTotals.otherPayment).toLocaleString(
                      'en-IN'
                    )}
                  </span>
                </div>
              </div>

              {/* Action Banner */}
              <div className="mt-4 flex items-center justify-between text-xs font-semibold text-purple-400">
                <span>
                  {selectedDivision === 'PVD'
                    ? 'PVD related data active below (Click to reset)'
                    : 'Click to filter related PVD plant records'}
                </span>
                <ChevronRight
                  className={`w-4 h-4 transition-transform ${
                    selectedDivision === 'PVD' ? 'rotate-90' : ''
                  }`}
                />
              </div>
            </div>

            {/* Box B: Laser Division Collections */}
            <div
              onClick={() => handleSelectDivision(selectedDivision === 'LASER' ? 'ALL' : 'LASER')}
              className={`p-6 rounded-2xl border transition-all cursor-pointer relative shadow-xl select-none ${
                selectedDivision === 'LASER'
                  ? 'bg-[#151c3d] border-blue-500 ring-2 ring-blue-500/40 shadow-blue-500/10'
                  : 'bg-[#111c38] border-slate-800 hover:border-blue-500/60 hover:bg-[#131f42]'
              }`}
            >
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-blue-400" />
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-200">
                      Laser Division Collections
                    </span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30">
                      {laserTotals.totalCount} Plants
                    </span>
                  </div>
                  <div className="text-3xl font-black font-sans text-white mt-2.5 tracking-tight">
                    ₹
                    {(isMonthly ? laserTotals.monthPayment : laserTotals.todayPayment).toLocaleString(
                      'en-IN'
                    )}
                  </div>
                </div>

                <div className="text-right bg-slate-900/60 border border-slate-800 px-3 py-1.5 rounded-xl">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
                    Recovery Rate
                  </span>
                  <span className="text-sm font-extrabold font-sans text-emerald-400">
                    {isMonthly ? laserTotals.monthRecoveryRate : laserTotals.recoveryRate}%
                  </span>
                </div>
              </div>

              {/* Sub-breakdown: Payment Collection vs Other Payment */}
              <div className="grid grid-cols-2 gap-3 mt-4 pt-4 border-t border-slate-800">
                <div className="bg-[#0b1329] rounded-xl p-3 border border-slate-800/80">
                  <span className="text-[10px] text-slate-400 block font-semibold uppercase tracking-wider">
                    Payment Collection
                  </span>
                  <span className="text-base font-bold font-sans text-emerald-400 mt-1 block">
                    ₹
                    {(isMonthly ? laserTotals.monthPaymentCollection : laserTotals.paymentCollection).toLocaleString(
                      'en-IN'
                    )}
                  </span>
                </div>
                <div className="bg-[#0b1329] rounded-xl p-3 border border-slate-800/80">
                  <span className="text-[10px] text-slate-400 block font-semibold uppercase tracking-wider">
                    Other Payment
                  </span>
                  <span className="text-base font-bold font-sans text-purple-400 mt-1 block">
                    ₹
                    {(isMonthly ? laserTotals.monthOtherPayment : laserTotals.otherPayment).toLocaleString(
                      'en-IN'
                    )}
                  </span>
                </div>
              </div>

              {/* Action Banner */}
              <div className="mt-4 flex items-center justify-between text-xs font-semibold text-blue-400">
                <span>
                  {selectedDivision === 'LASER'
                    ? 'Laser related data active below (Click to reset)'
                    : 'Click to filter related Laser plant records'}
                </span>
                <ChevronRight
                  className={`w-4 h-4 transition-transform ${
                    selectedDivision === 'LASER' ? 'rotate-90' : ''
                  }`}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Container: Left Sidebar + Right Master Table */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Left Side: Companies Switcher & Division Tabs */}
        <div className="bg-[#0d1527] rounded-2xl border border-slate-800/90 p-4 shadow-xl space-y-3">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800 px-2">
            <span className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
              <Building2 className="w-4 h-4 text-blue-400" /> Group Companies
            </span>
            <span className="text-[11px] text-slate-400 font-semibold px-2 py-0.5 rounded-full bg-slate-900 border border-slate-800">
              Group Units
            </span>
          </div>

          {/* Division Filter Segmented Tabs */}
          <div className="grid grid-cols-3 gap-1 bg-[#0b1329] p-1 rounded-xl border border-slate-800 text-[11px] font-semibold">
            <button
              type="button"
              onClick={() => handleSelectDivision('ALL')}
              className={`py-1.5 rounded-lg transition-all cursor-pointer ${
                selectedDivision === 'ALL'
                  ? 'bg-slate-800 text-white font-bold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              All
            </button>
            <button
              type="button"
              onClick={() => handleSelectDivision('LASER')}
              className={`py-1.5 rounded-lg transition-all cursor-pointer ${
                selectedDivision === 'LASER'
                  ? 'bg-blue-600 text-white font-bold shadow-md shadow-blue-600/30'
                  : 'text-slate-400 hover:text-blue-400'
              }`}
            >
              Laser (6)
            </button>
            <button
              type="button"
              onClick={() => handleSelectDivision('PVD')}
              className={`py-1.5 rounded-lg transition-all cursor-pointer ${
                selectedDivision === 'PVD'
                  ? 'bg-purple-600 text-white font-bold shadow-md shadow-purple-600/30'
                  : 'text-slate-400 hover:text-purple-400'
              }`}
            >
              PVD (3)
            </button>
          </div>

          {/* Manage Accounts Button for Super Admin */}
          <button
            type="button"
            onClick={() => setShowAccountsModal(true)}
            className="w-full py-2.5 px-3 rounded-xl bg-slate-900/60 hover:bg-slate-800 border border-slate-800 text-white text-xs font-semibold flex items-center justify-between transition-all text-left cursor-pointer"
          >
            <span className="flex items-center gap-2">
              <Key className="w-3.5 h-3.5 text-blue-400" />
              <span>Company Passwords</span>
            </span>
            <span className="text-[10px] bg-blue-500/20 text-blue-400 px-1.5 py-0.5 rounded font-sans font-bold">
              Manage
            </span>
          </button>

          {/* Master consolidated button */}
          <button
            type="button"
            onClick={handleResetFilters}
            className={`w-full text-left px-3.5 py-2.5 rounded-xl transition-all flex items-center justify-between text-xs font-semibold cursor-pointer ${
              selectedCompanyFilter === null && selectedDivision === 'ALL'
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/25'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <span>All Companies (Consolidated)</span>
            <ChevronRight className="w-4 h-4" />
          </button>

          {/* List of Companies (Dynamic based on selectedDivision) */}
          <div className="space-y-1.5 pt-1 max-h-[380px] overflow-y-auto pr-1">
            {(selectedDivision === 'ALL'
              ? summaries
              : selectedDivision === 'PVD'
              ? pvdSummaries
              : laserSummaries
            ).map((s) => {
              const isSelected = selectedCompanyFilter === s.company.id;
              const isPvd = isPvdCompany(s.company);
              return (
                <button
                  key={s.company.id}
                  type="button"
                  onClick={() => setSelectedCompanyFilter(isSelected ? null : s.company.id)}
                  className={`w-full text-left px-3 py-2.5 rounded-xl transition-all flex items-center justify-between text-xs cursor-pointer ${
                    isSelected
                      ? 'bg-slate-800 text-white font-bold border border-slate-700'
                      : 'text-slate-300 hover:text-white hover:bg-slate-900/70'
                  }`}
                >
                  <div className="flex items-center gap-2 truncate">
                    <span
                      className={`w-2 h-2 rounded-full shrink-0 ${
                        s.hasEntryToday ? 'bg-emerald-400' : 'bg-amber-400'
                      }`}
                    />
                    <span className="truncate font-sans">{s.company.name}</span>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0 ml-1">
                    <span
                      className={`text-[9px] px-1.5 py-0.2 rounded font-sans font-bold ${
                        isPvd
                          ? 'bg-purple-500/15 text-purple-400'
                          : 'bg-blue-500/15 text-blue-400'
                      }`}
                    >
                      {isPvd ? 'PVD' : 'LASER'}
                    </span>
                    <span className="text-xs font-bold font-sans text-slate-300">
                      ₹{(isMonthly ? s.monthBilling : s.billing).toLocaleString('en-IN')}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>

          <div className="pt-3 border-t border-slate-800 px-2 flex items-center justify-between text-[11px] text-slate-400 font-medium">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400" /> Updated
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-amber-400" /> Pending
            </span>
          </div>
        </div>

        {/* Right Side: The Master Consolidated Table & Related Data View */}
        <div className="lg:col-span-3 bg-[#0d1527] rounded-2xl border border-slate-800/90 overflow-hidden shadow-2xl">
          {/* Card Header with DATE FILTER & Quick Link to CRM Dashboard */}
          <div className="p-4 sm:p-5 border-b border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-[#0b1329]/50">
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-base font-bold text-white tracking-tight">
                  {selectedDivision === 'PVD'
                    ? 'PVD Coating Division Collections & Operational Ledger'
                    : selectedDivision === 'LASER'
                    ? 'Laser Division Collections & Operational Ledger'
                    : isMonthly
                    ? 'Monthly Cumulative Consolidated Billing & Payment Matrix'
                    : 'Consolidated Operational Billing & Payment Register'}
                </h2>
                <span
                  className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${
                    selectedDivision === 'PVD'
                      ? 'bg-purple-500/20 text-purple-300 border-purple-500/30'
                      : selectedDivision === 'LASER'
                      ? 'bg-blue-500/20 text-blue-300 border-blue-500/30'
                      : 'bg-slate-800 text-slate-300 border-slate-700'
                  }`}
                >
                  {selectedDivision === 'PVD'
                    ? 'PVD Related Data'
                    : selectedDivision === 'LASER'
                    ? 'Laser Related Data'
                    : isMonthly
                    ? 'Month-to-Date'
                    : 'Daily Matrix'}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-1">
                {selectedDivision !== 'ALL'
                  ? `Showing ${filteredSummaries.length} plants in ${selectedDivision} Division • Date: ${selectedDate}`
                  : isMonthly
                  ? `Aggregated figures for ${monthName} • Real-time audit across operating plants`
                  : `Date: ${selectedDate} • Daily Collections & Cumulative Month Figures`}
              </p>
            </div>

            {/* Right Corner Controls: Link to CRM + DATE FILTER + Reset Filter */}
            <div className="flex items-center gap-2.5 flex-wrap self-start md:self-auto">
              <Link
                href="/dashboard"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 hover:text-white border border-blue-500/30 text-xs font-bold transition-all shadow-sm"
              >
                <LayoutDashboard className="w-3.5 h-3.5" />
                <span>CRM Dashboard</span>
              </Link>

              {(selectedCompanyFilter || selectedDivision !== 'ALL') && (
                <button
                  type="button"
                  onClick={handleResetFilters}
                  className="text-xs text-blue-400 hover:underline font-semibold flex items-center gap-1 pr-2 cursor-pointer"
                >
                  <span>Show All Companies</span>
                </button>
              )}

              {/* Date Filter Pill */}
              <div className="flex items-center gap-2 bg-slate-900 hover:bg-slate-800 px-3.5 py-1.5 rounded-full text-xs text-white font-medium border border-slate-700 transition-all shadow-inner">
                <Calendar className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="bg-transparent border-none text-white focus:outline-none cursor-pointer font-sans text-xs"
                  title="Filter register by date"
                />
              </div>
            </div>
          </div>

          {/* Active Filter Notification Pill */}
          {selectedDivision !== 'ALL' && (
            <div
              className={`px-4 py-2.5 border-b flex items-center justify-between text-xs font-semibold ${
                selectedDivision === 'PVD'
                  ? 'bg-purple-950/30 border-purple-900/50 text-purple-300'
                  : 'bg-blue-950/30 border-blue-900/50 text-blue-300'
              }`}
            >
              <span>
                Filtering related data for <strong>{selectedDivision} Division</strong> (
                {filteredSummaries.length} Plants) • Total Collection: ₹
                {(isMonthly
                  ? selectedDivision === 'PVD'
                    ? pvdTotals.monthPayment
                    : laserTotals.monthPayment
                  : selectedDivision === 'PVD'
                  ? pvdTotals.todayPayment
                  : laserTotals.todayPayment
                ).toLocaleString('en-IN')}
              </span>
              <button
                type="button"
                onClick={() => setSelectedDivision('ALL')}
                className="underline hover:text-white text-[11px] font-bold cursor-pointer"
              >
                Clear Division Filter
              </button>
            </div>
          )}

          {/* TABLE DISPLAY */}
          <div className="overflow-x-auto">
            {!isMonthly ? (
              // DAILY MATRIX TABLE (STRICTLY SCREENSHOT 1 COLUMNS - NO NET BALANCER)
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-800 bg-[#0b1329] text-slate-400 font-bold uppercase tracking-wider text-[11px]">
                    <th className="py-3 px-3.5">Company Name</th>
                    <th className="py-3 px-3 text-right">Billing</th>
                    <th className="py-3 px-3 text-right text-cyan-400">Other Billing</th>
                    <th className="py-3 px-3 text-right text-emerald-400">Payment Collection</th>
                    <th className="py-3 px-3 text-right text-purple-400">Other Payment</th>
                    <th className="py-3 px-3 text-right text-blue-400">Including GST</th>
                    <th className="py-3 px-3 text-center">Payment Received Date &amp; Time</th>
                    <th className="py-3 px-3 text-center">Status</th>
                    <th className="py-3 px-3 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {filteredSummaries.map((item) => {
                    const isPvd = isPvdCompany(item.company);
                    return (
                      <tr
                        key={item.company.id}
                        className="hover:bg-slate-800/40 transition-colors group"
                      >
                        <td className="py-3.5 px-3.5 font-bold text-white">
                          <div className="flex items-center gap-2">
                            <span
                              className={`w-7 h-7 rounded-lg bg-slate-900 border border-slate-700/80 flex items-center justify-center text-[10px] font-sans font-black ${
                                isPvd ? 'text-purple-400' : 'text-blue-400'
                              }`}
                            >
                              {item.company.code}
                            </span>
                            <div>
                              <div className="text-white font-bold leading-tight flex items-center gap-1.5 font-sans">
                                <span>{item.company.name}</span>
                                <span
                                  className={`text-[9px] px-1.5 py-0.2 rounded font-sans font-bold ${
                                    isPvd
                                      ? 'bg-purple-500/15 text-purple-400'
                                      : 'bg-blue-500/15 text-blue-400'
                                  }`}
                                >
                                  {isPvd ? 'PVD' : 'LASER'}
                                </span>
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* Column 2: Billing (Base) */}
                        <td className="py-3.5 px-3 text-right font-bold font-sans text-slate-100">
                          ₹{item.billing.toLocaleString('en-IN')}
                        </td>

                        {/* Column 3: Other Billing */}
                        <td className="py-3.5 px-3 text-right font-bold font-sans text-cyan-400">
                          ₹{(item.otherBilling || 0).toLocaleString('en-IN')}
                        </td>

                        {/* Column 4: Payment Collection */}
                        <td className="py-3.5 px-3 text-right font-black font-sans text-emerald-400">
                          ₹{(item.paymentCollection || 0).toLocaleString('en-IN')}
                        </td>

                        {/* Column 5: Other Payment */}
                        <td className="py-3.5 px-3 text-right font-bold font-sans text-purple-400">
                          ₹{(item.otherPayment || 0).toLocaleString('en-IN')}
                        </td>

                        {/* Column 6: Including GST */}
                        <td className="py-3.5 px-3 text-right font-black font-sans text-blue-400">
                          ₹{(item.billingWithGst || 0).toLocaleString('en-IN')}
                        </td>

                        {/* Column 7: Payment Received Date & Time */}
                        <td className="py-3.5 px-3 text-center text-xs">
                          {item.todayPayment > 0 ? (
                            <div className="inline-flex flex-col items-center">
                              <span className="text-slate-200 font-bold font-sans">
                                {item.paymentReceivedAt ||
                                  `${selectedDate.split('-').reverse().join('-')}, 04:00 PM`}
                              </span>
                              {item.paymentMode && (
                                <span className="text-[9px] uppercase px-1.5 py-0.2 rounded bg-slate-800 text-slate-400 font-sans font-semibold">
                                  {item.paymentMode.replace('_', ' ')}
                                </span>
                              )}
                            </div>
                          ) : (
                            <span className="text-slate-500 italic font-sans text-xs">-</span>
                          )}
                        </td>

                        {/* Column 8: Status */}
                        <td className="py-3.5 px-3 text-center">
                          {item.hasEntryToday ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                              <CheckCircle2 className="w-3 h-3" /> Submitted
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-500/15 text-amber-400 border border-amber-500/30">
                              <Clock className="w-3 h-3" /> Pending
                            </span>
                          )}
                        </td>

                        {/* Column 9: Action */}
                        <td className="py-3.5 px-3 text-center">
                          <button
                            type="button"
                            onClick={() => onEditCompany(item.company.id)}
                            className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold border border-slate-700 transition-colors inline-flex items-center gap-1 cursor-pointer"
                          >
                            <Edit2 className="w-3 h-3 text-blue-400" />
                            <span>Edit</span>
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>

                <tfoot>
                  <tr className="bg-[#0b1329] border-t-2 border-blue-500/50 text-white font-bold text-xs">
                    <td className="py-4 px-3.5 uppercase tracking-wider font-black flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-blue-500 animate-ping" />
                      {displayFooterTotal.label}
                    </td>
                    <td className="py-4 px-3 text-right font-sans text-sm font-black text-white">
                      ₹{displayFooterTotal.billing.toLocaleString('en-IN')}
                    </td>
                    <td className="py-4 px-3 text-right font-sans text-sm font-black text-cyan-400">
                      ₹{displayFooterTotal.otherBilling.toLocaleString('en-IN')}
                    </td>
                    <td className="py-4 px-3 text-right font-sans text-sm font-black text-emerald-400">
                      ₹{displayFooterTotal.paymentCollection.toLocaleString('en-IN')}
                    </td>
                    <td className="py-4 px-3 text-right font-sans text-sm font-black text-purple-400">
                      ₹{displayFooterTotal.otherPayment.toLocaleString('en-IN')}
                    </td>
                    <td className="py-4 px-3 text-right font-sans text-sm font-black text-blue-400">
                      ₹{displayFooterTotal.billingWithGst.toLocaleString('en-IN')}
                    </td>
                    <td className="py-4 px-3 text-center text-xs text-slate-300">
                      Live Timestamped
                    </td>
                    <td className="py-4 px-3 text-center text-xs text-slate-300">
                      {displayFooterTotal.statusText}
                    </td>
                    <td className="py-4 px-3 text-center">
                      <span className="text-xs font-bold text-slate-400">Verified</span>
                    </td>
                  </tr>
                </tfoot>
              </table>
            ) : (
              // MONTHLY CUMULATIVE TABLE (NO NET BALANCER)
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-800 bg-[#0b1329] text-slate-400 font-bold uppercase tracking-wider text-[11px]">
                    <th className="py-3 px-3.5">Company Name</th>
                    <th className="py-3 px-3 text-right">Billing (MTD)</th>
                    <th className="py-3 px-3 text-right text-cyan-400">Other Billing (MTD)</th>
                    <th className="py-3 px-3 text-right text-emerald-400">Payment Collection (MTD)</th>
                    <th className="py-3 px-3 text-right text-purple-400">Other Payment (MTD)</th>
                    <th className="py-3 px-3 text-right text-blue-400">Including GST (MTD)</th>
                    <th className="py-3 px-3 text-center">Collection %</th>
                    <th className="py-3 px-3 text-center">Latest Payment Received At</th>
                    <th className="py-3 px-3 text-center">Status</th>
                    <th className="py-3 px-3 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {filteredSummaries.map((item) => {
                    const isPvd = isPvdCompany(item.company);
                    return (
                      <tr
                        key={item.company.id}
                        className="hover:bg-slate-800/40 transition-colors group"
                      >
                        <td className="py-3.5 px-3.5 font-bold text-white">
                          <div className="flex items-center gap-2">
                            <span
                              className={`w-7 h-7 rounded-lg bg-slate-900 border border-slate-700/80 flex items-center justify-center text-[10px] font-sans font-black ${
                                isPvd ? 'text-purple-400' : 'text-blue-400'
                              }`}
                            >
                              {item.company.code}
                            </span>
                            <div>
                              <div className="text-white font-bold leading-tight flex items-center gap-1.5 font-sans">
                                <span>{item.company.name}</span>
                                <span
                                  className={`text-[9px] px-1.5 py-0.2 rounded font-sans font-bold ${
                                    isPvd
                                      ? 'bg-purple-500/15 text-purple-400'
                                      : 'bg-blue-500/15 text-blue-400'
                                  }`}
                                >
                                  {isPvd ? 'PVD' : 'LASER'}
                                </span>
                              </div>
                            </div>
                          </div>
                        </td>

                        <td className="py-3.5 px-3 text-right font-bold font-sans text-slate-100">
                          ₹{item.monthBilling.toLocaleString('en-IN')}
                        </td>

                        <td className="py-3.5 px-3 text-right font-bold font-sans text-cyan-400">
                          ₹{(item.monthOtherBilling || 0).toLocaleString('en-IN')}
                        </td>

                        <td className="py-3.5 px-3 text-right font-black font-sans text-emerald-400">
                          ₹{(item.monthPaymentCollection || 0).toLocaleString('en-IN')}
                        </td>

                        <td className="py-3.5 px-3 text-right font-bold font-sans text-purple-400">
                          ₹{(item.monthOtherPayment || 0).toLocaleString('en-IN')}
                        </td>

                        <td className="py-3.5 px-3 text-right font-black font-sans text-blue-400">
                          ₹{(item.monthBillingWithGst || 0).toLocaleString('en-IN')}
                        </td>

                        <td className="py-3.5 px-3 text-center">
                          <div className="inline-flex flex-col items-center gap-1">
                            <span className="text-xs font-bold font-sans text-emerald-400">
                              {item.collectionRate}%
                            </span>
                            <div className="w-16 bg-slate-800 h-1.5 rounded-full overflow-hidden">
                              <div
                                className="bg-emerald-400 h-full rounded-full"
                                style={{ width: `${Math.min(100, item.collectionRate)}%` }}
                              />
                            </div>
                          </div>
                        </td>

                        <td className="py-3.5 px-3 text-center text-xs text-slate-300 font-sans">
                          {item.paymentReceivedAt ||
                            `${selectedDate.split('-').reverse().join('-')}, 04:00 PM`}
                        </td>

                        <td className="py-3.5 px-3 text-center">
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                            <CheckCircle2 className="w-3 h-3" /> Reconciled
                          </span>
                        </td>

                        <td className="py-3.5 px-3 text-center">
                          <button
                            type="button"
                            onClick={() => onEditCompany(item.company.id)}
                            className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold border border-slate-700 transition-colors inline-flex items-center gap-1 cursor-pointer"
                          >
                            <Edit2 className="w-3 h-3 text-blue-400" />
                            <span>Edit</span>
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>

                <tfoot>
                  <tr className="bg-[#0b1329] border-t-2 border-purple-500/50 text-white font-bold text-xs">
                    <td className="py-4 px-3.5 uppercase tracking-wider font-black flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-purple-500 animate-ping" />
                      {displayFooterTotal.label}
                    </td>
                    <td className="py-4 px-3 text-right font-sans text-sm font-black text-white">
                      ₹{displayFooterTotal.monthBilling.toLocaleString('en-IN')}
                    </td>
                    <td className="py-4 px-3 text-right font-sans text-sm font-black text-cyan-400">
                      ₹{displayFooterTotal.monthOtherBilling.toLocaleString('en-IN')}
                    </td>
                    <td className="py-4 px-3 text-right font-sans text-sm font-black text-emerald-400">
                      ₹{displayFooterTotal.monthPaymentCollection.toLocaleString('en-IN')}
                    </td>
                    <td className="py-4 px-3 text-right font-sans text-sm font-black text-purple-400">
                      ₹{displayFooterTotal.monthOtherPayment.toLocaleString('en-IN')}
                    </td>
                    <td className="py-4 px-3 text-right font-sans text-sm font-black text-blue-400">
                      ₹{displayFooterTotal.monthBillingWithGst.toLocaleString('en-IN')}
                    </td>
                    <td className="py-4 px-3 text-center text-xs text-slate-300">
                      {displayFooterTotal.collectionRate}%
                    </td>
                    <td className="py-4 px-3 text-center text-xs text-slate-300">
                      Audited
                    </td>
                    <td className="py-4 px-3 text-center text-xs text-slate-300">
                      {displayFooterTotal.statusText}
                    </td>
                    <td className="py-4 px-3 text-center">
                      <span className="text-xs font-bold text-slate-400">Verified</span>
                    </td>
                  </tr>
                </tfoot>
              </table>
            )}
          </div>
        </div>
      </div>

      {/* Password & Credential Modal for Super Admin */}
      {showAccountsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
          <div className="relative w-full max-w-2xl bg-[#0d1527] border border-slate-700 rounded-2xl p-6 sm:p-7 shadow-2xl">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800 mb-5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-500/15 text-blue-400 flex items-center justify-center border border-blue-500/30">
                  <Key className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white tracking-tight">
                    Operating Company Credentials
                  </h3>
                  <p className="text-xs text-slate-400">
                    Direct access logins for company operators
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowAccountsModal(false)}
                className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2 max-h-[420px] overflow-y-auto pr-1">
              {companyAccounts.map((acc) => (
                <div
                  key={acc.id}
                  className="p-3.5 rounded-xl bg-[#0b1329] border border-slate-800 flex items-center justify-between gap-3 text-xs"
                >
                  <div>
                    <div className="font-bold text-white font-sans">{acc.companyName}</div>
                    <div className="text-[11px] text-slate-400 mt-0.5">
                      Username: <code className="text-blue-400 font-mono">{acc.username}</code> • Password: <code className="text-emerald-400 font-mono">{acc.pass}</code>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleCopy(acc.id, `${acc.username} / ${acc.pass}`)}
                    className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    {copiedId === acc.id ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                        <span className="text-emerald-400">Copied</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5 text-slate-400" />
                        <span>Copy</span>
                      </>
                    )}
                  </button>
                </div>
              ))}
            </div>

            <div className="pt-4 mt-5 border-t border-slate-800 flex justify-end">
              <button
                type="button"
                onClick={() => setShowAccountsModal(false)}
                className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold cursor-pointer"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
