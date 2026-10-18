'use client';

import React, { useState, useEffect } from 'react';
import AppLayout from '../../components/layout/AppLayout';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import {
  CreditCard,
  Plus,
  Search,
  Download,
  AlertCircle,
  Clock,
  DollarSign,
  X,
  Receipt,
  FileText,
  ShieldCheck,
  CheckCircle2,
} from 'lucide-react';
import { Invoice } from '../../types';

export default function BillingPage() {
  const { hasPermission } = useAuth();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [pendingData, setPendingData] = useState<any>(null);
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [activeTab, setActiveTab] = useState<'ALL' | 'PENDING'>('ALL');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Modals
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [creditNoteModalOpen, setCreditNoteModalOpen] = useState(false);
  const [activeInvoice, setActiveInvoice] = useState<Invoice | null>(null);

  // Create Invoice Form State
  const [selectedOrderId, setSelectedOrderId] = useState('');
  const [selectedOrderDetails, setSelectedOrderDetails] = useState<any>(null);
  const [invoiceType, setInvoiceType] = useState<'SYSTEM_GENERATED' | 'RECORDED_EXTERNAL'>('SYSTEM_GENERATED');
  const [externalInvoiceNumber, setExternalInvoiceNumber] = useState('');
  const [billingDate, setBillingDate] = useState(new Date().toISOString().slice(0, 10));
  const [dueDate, setDueDate] = useState('');
  const [isInterState, setIsInterState] = useState(false);
  const [gstRate, setGstRate] = useState(18);

  // Record Payment Form State
  const [paymentAmount, setPaymentAmount] = useState<number>(0);
  const [paymentMode, setPaymentMode] = useState('BANK_TRANSFER');
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().slice(0, 10));
  const [referenceNumber, setReferenceNumber] = useState('');
  const [bankName, setBankName] = useState('HDFC Bank Ltd.');
  const [paymentRemarks, setPaymentRemarks] = useState('');

  // Credit Note Form State
  const [creditNoteAmount, setCreditNoteAmount] = useState<number>(0);
  const [creditNoteReason, setCreditNoteReason] = useState('');

  useEffect(() => {
    loadInvoices();
  }, [search, statusFilter, page]);

  useEffect(() => {
    loadPendingPayments();
    loadOrdersList();
  }, []);

  const loadOrdersList = async () => {
    try {
      const res = await api.getOrders({ limit: '50' });
      if (res.success) setOrders(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const loadInvoices = async () => {
    try {
      setLoading(true);
      const params: Record<string, string> = { page: String(page), limit: '10' };
      if (search) params.search = search;
      if (statusFilter) params.paymentStatus = statusFilter;

      const res = await api.getInvoices(params);
      if (res.success) {
        setInvoices(res.data);
        setTotalPages(res.pagination.totalPages);
      }
    } catch (err) {
      console.error('Failed to load invoices:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadPendingPayments = async () => {
    try {
      const res = await api.getPendingPayments();
      if (res.success) {
        setPendingData(res.data);
      }
    } catch (err) {
      console.error('Failed to load pending payments:', err);
    }
  };

  const handleSelectOrder = async (orderId: string) => {
    setSelectedOrderId(orderId);
    if (!orderId) {
      setSelectedOrderDetails(null);
      return;
    }

    try {
      const res = await api.getOrderById(orderId);
      if (res.success) {
        setSelectedOrderDetails(res.data);
        const due = new Date(Date.now() + (res.data.dueDays || 30) * 24 * 60 * 60 * 1000)
          .toISOString()
          .slice(0, 10);
        setDueDate(due);
      }
    } catch (err) {
      alert('Failed to load order items');
    }
  };

  const handleCreateInvoiceSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrderId || !selectedOrderDetails) return;

    try {
      const res = await api.createInvoice({
        orderId: selectedOrderId,
        invoiceType,
        externalInvoiceNumber: invoiceType === 'RECORDED_EXTERNAL' ? externalInvoiceNumber : undefined,
        billingDate,
        dueDate,
        isInterState,
        gstRate,
        items: selectedOrderDetails.items.map((it: any) => ({
          itemDescription: it.itemDescription,
          hsnSacCode: '85044090',
          quantity: it.quantity,
          unit: it.unit,
          rate: it.rate,
        })),
      });

      if (res.success) {
        setCreateModalOpen(false);
        resetInvoiceForm();
        loadInvoices();
        loadPendingPayments();
      }
    } catch (err: any) {
      alert(err.message || 'Failed to create invoice');
    }
  };

  const handleRecordPaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeInvoice) return;

    try {
      const res = await api.recordPayment(activeInvoice.id, {
        amountReceived: paymentAmount,
        paymentMode,
        paymentDate,
        referenceNumber,
        bankName,
        remarks: paymentRemarks,
      });

      if (res.success) {
        alert('Payment recorded successfully and invoice balance updated.');
        setPaymentModalOpen(false);
        loadInvoices();
        loadPendingPayments();
      }
    } catch (err: any) {
      alert(err.message || 'Failed to record payment');
    }
  };

  const handleCreditNoteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeInvoice) return;

    try {
      const res = await api.addCreditNote(activeInvoice.id, {
        creditNoteAmount,
        reason: creditNoteReason,
      });

      if (res.success) {
        alert('Credit note successfully applied.');
        setCreditNoteModalOpen(false);
        loadInvoices();
        loadPendingPayments();
      }
    } catch (err: any) {
      alert(err.message || 'Failed to apply credit note');
    }
  };

  const handleDownloadPdf = async (id: string, invoiceNumber: string) => {
    try {
      const blob = await api.downloadInvoicePdf(id);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${invoiceNumber}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (err: any) {
      alert(err.message || 'Failed to download tax invoice PDF');
    }
  };

  const resetInvoiceForm = () => {
    setSelectedOrderId('');
    setSelectedOrderDetails(null);
    setExternalInvoiceNumber('');
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Module Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-green-500/10 text-green-400 border border-green-500/20">
              <CreditCard className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-black text-white">
                Billing & Payment Collection
              </h1>
              <p className="text-xs text-slate-400 mt-0.5">
                Generate tax invoices, record multi-part payments, block over-payments, and monitor 0-90+ day ageing.
              </p>
            </div>
          </div>

          {hasPermission('BILLING', 'create') && (
            <button
              onClick={() => {
                resetInvoiceForm();
                setCreateModalOpen(true);
              }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-green-600 hover:bg-green-500 text-white font-bold text-xs shadow-lg shadow-green-600/20 transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>Generate / Record Invoice</span>
            </button>
          )}
        </div>

        {/* Ageing Summary Metric Cards */}
        {pendingData && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            <div className="glass-panel p-4 rounded-xl border border-slate-800">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                Total Receivables
              </span>
              <span className="text-xl font-black text-white block mt-1">
                INR {pendingData.totalOutstanding?.toLocaleString('en-IN')}
              </span>
              <span className="text-[10px] text-slate-500 block">Across all pending invoices</span>
            </div>

            <div className="glass-card p-4 rounded-xl border border-blue-500/20">
              <span className="text-[11px] font-bold text-blue-400 uppercase tracking-wider block">
                0-30 Days (Current)
              </span>
              <span className="text-lg font-black text-white block mt-1">
                INR {(pendingData.ageingSummary?.['0-30 days']?.amount || 0).toLocaleString('en-IN')}
              </span>
              <span className="text-[10px] text-blue-400/80 block">
                {pendingData.ageingSummary?.['0-30 days']?.count || 0} Invoices
              </span>
            </div>

            <div className="glass-card p-4 rounded-xl border border-amber-500/20">
              <span className="text-[11px] font-bold text-amber-400 uppercase tracking-wider block">
                31-60 Days
              </span>
              <span className="text-lg font-black text-white block mt-1">
                INR {(pendingData.ageingSummary?.['31-60 days']?.amount || 0).toLocaleString('en-IN')}
              </span>
              <span className="text-[10px] text-amber-400/80 block">
                {pendingData.ageingSummary?.['31-60 days']?.count || 0} Invoices
              </span>
            </div>

            <div className="glass-card p-4 rounded-xl border border-orange-500/20">
              <span className="text-[11px] font-bold text-orange-400 uppercase tracking-wider block">
                61-90 Days
              </span>
              <span className="text-lg font-black text-white block mt-1">
                INR {(pendingData.ageingSummary?.['61-90 days']?.amount || 0).toLocaleString('en-IN')}
              </span>
              <span className="text-[10px] text-orange-400/80 block">
                {pendingData.ageingSummary?.['61-90 days']?.count || 0} Invoices
              </span>
            </div>

            <div className="glass-card p-4 rounded-xl border border-rose-500/20">
              <span className="text-[11px] font-bold text-rose-400 uppercase tracking-wider block">
                90+ Days (Critical)
              </span>
              <span className="text-lg font-black text-rose-300 block mt-1">
                INR {(pendingData.ageingSummary?.['90+ days']?.amount || 0).toLocaleString('en-IN')}
              </span>
              <span className="text-[10px] text-rose-400/80 block">
                {pendingData.ageingSummary?.['90+ days']?.count || 0} Invoices
              </span>
            </div>
          </div>
        )}

        {/* Filter and Tab Switching */}
        <div className="glass-panel p-4 rounded-xl border border-slate-800 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('ALL')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                activeTab === 'ALL' ? 'bg-green-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              All Invoices
            </button>
            <button
              onClick={() => setActiveTab('PENDING')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                activeTab === 'PENDING' ? 'bg-amber-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              Pending Outstanding ({pendingData?.invoices?.length || 0})
            </button>
          </div>

          <div className="flex items-center gap-2 flex-1 max-w-sm justify-end">
            <div className="relative w-full">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                placeholder="Search by invoice number, customer..."
                className="w-full pl-9 pr-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-green-500"
              />
            </div>
          </div>
        </div>

        {/* Table List */}
        <div className="glass-panel rounded-xl border border-slate-800 overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left data-table">
              <thead>
                <tr>
                  <th>Invoice No</th>
                  <th>Date & Due</th>
                  <th>Customer</th>
                  <th>Invoice Total</th>
                  <th>Received</th>
                  <th>Balance Due</th>
                  <th>Status</th>
                  <th>Ageing</th>
                  <th className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={9} className="text-center py-10 text-slate-400 text-xs">
                      Loading billing records...
                    </td>
                  </tr>
                ) : (activeTab === 'PENDING' ? pendingData?.invoices || [] : invoices).length === 0 ? (
                  <tr>
                    <td colSpan={9} className="text-center py-12 text-slate-400 text-xs">
                      No invoices found.
                    </td>
                  </tr>
                ) : (
                  (activeTab === 'PENDING' ? pendingData?.invoices || [] : invoices).map((inv: any) => (
                    <tr key={inv.id}>
                      <td className="font-bold text-green-400">{inv.invoiceNumber}</td>
                      <td className="text-xs">
                        <span className="text-slate-300 block">
                          {new Date(inv.billingDate).toLocaleDateString()}
                        </span>
                        <span className="text-[10px] text-slate-500 block">
                          Due: {new Date(inv.dueDate).toLocaleDateString()}
                        </span>
                      </td>
                      <td className="font-semibold text-white">
                        {inv.customer?.name}
                        {inv.customer?.companyName && (
                          <span className="block text-[10px] text-slate-400 font-normal">
                            {inv.customer.companyName}
                          </span>
                        )}
                      </td>
                      <td className="font-bold text-white text-xs">
                        INR {inv.totalAmount?.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="text-emerald-400 font-semibold text-xs">
                        INR {inv.amountReceived?.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="font-bold text-rose-400 text-xs">
                        INR {inv.balanceAmount?.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </td>
                      <td>
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            inv.paymentStatus === 'PAID'
                              ? 'badge-green'
                              : inv.paymentStatus === 'PARTIALLY_PAID'
                              ? 'badge-teal'
                              : inv.paymentStatus === 'OVERDUE'
                              ? 'badge-red'
                              : 'badge-orange'
                          }`}
                        >
                          {inv.paymentStatus}
                        </span>
                      </td>
                      <td>
                        <span className="text-[11px] font-mono text-slate-400">
                          {inv.ageingBucket || '0-30 days'}
                        </span>
                      </td>
                      <td className="text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* PDF */}
                          {hasPermission('BILLING', 'export') && (
                            <button
                              onClick={() => handleDownloadPdf(inv.id, inv.invoiceNumber)}
                              title="Download Tax Invoice PDF"
                              className="p-1.5 rounded-lg bg-slate-800 text-slate-300 hover:text-white transition-colors"
                            >
                              <Download className="w-3.5 h-3.5" />
                            </button>
                          )}

                          {/* Record Payment */}
                          {hasPermission('BILLING', 'create') && inv.balanceAmount > 0 && (
                            <button
                              onClick={() => {
                                setActiveInvoice(inv);
                                setPaymentAmount(inv.balanceAmount);
                                setReferenceNumber('');
                                setPaymentRemarks('');
                                setPaymentModalOpen(true);
                              }}
                              title="Record Payment Receipt"
                              className="px-2.5 py-1 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 text-[10px] font-bold border border-emerald-500/20 flex items-center gap-1"
                            >
                              <DollarSign className="w-3 h-3" />
                              <span>Receive</span>
                            </button>
                          )}

                          {/* Credit Note */}
                          {hasPermission('BILLING', 'edit') && inv.balanceAmount > 0 && (
                            <button
                              onClick={() => {
                                setActiveInvoice(inv);
                                setCreditNoteAmount(0);
                                setCreditNoteReason('');
                                setCreditNoteModalOpen(true);
                              }}
                              title="Add Credit Note"
                              className="px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] font-semibold"
                            >
                              Credit Note
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Modal: Generate Invoice */}
        {createModalOpen && (
          <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="glass-panel w-full max-w-xl rounded-2xl border border-slate-700 p-6 max-h-[90vh] overflow-y-auto space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <CreditCard className="w-5 h-5 text-green-400" />
                  <h3 className="text-base font-bold text-white">Generate Tax Invoice</h3>
                </div>
                <button onClick={() => setCreateModalOpen(false)} className="text-slate-400 hover:text-white">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleCreateInvoiceSubmit} className="space-y-4">
                <div className="flex gap-4 p-3 rounded-lg bg-slate-900 border border-slate-800 text-xs font-semibold text-slate-300">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="invType"
                      checked={invoiceType === 'SYSTEM_GENERATED'}
                      onChange={() => setInvoiceType('SYSTEM_GENERATED')}
                    />
                    <span>Generate System Invoice (INV-YYYY-YY-00001)</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="invType"
                      checked={invoiceType === 'RECORDED_EXTERNAL'}
                      onChange={() => setInvoiceType('RECORDED_EXTERNAL')}
                    />
                    <span>Record External Invoice</span>
                  </label>
                </div>

                {invoiceType === 'RECORDED_EXTERNAL' && (
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      External Invoice Number *
                    </label>
                    <input
                      type="text"
                      required
                      value={externalInvoiceNumber}
                      onChange={(e) => setExternalInvoiceNumber(e.target.value)}
                      placeholder="e.g. EXT-2026-9921"
                      className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-xs text-white"
                    />
                  </div>
                )}

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Select Order *</label>
                  <select
                    required
                    value={selectedOrderId}
                    onChange={(e) => handleSelectOrder(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-xs text-white"
                  >
                    <option value="">-- Choose Order to Bill --</option>
                    {orders.map((o) => (
                      <option key={o.id} value={o.id}>
                        {o.orderNumber} - {o.customer?.name} (INR {o.totalAmount?.toLocaleString('en-IN')})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">Billing Date</label>
                    <input
                      type="date"
                      value={billingDate}
                      onChange={(e) => setBillingDate(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-xs text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">Payment Due Date</label>
                    <input
                      type="date"
                      value={dueDate}
                      onChange={(e) => setDueDate(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-xs text-white"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-4 p-3 rounded-lg bg-slate-900 border border-slate-800 text-xs text-slate-300">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isInterState}
                      onChange={(e) => setIsInterState(e.target.checked)}
                      className="rounded text-green-600"
                    />
                    <span>Inter-State Supply (100% IGST)</span>
                  </label>
                  <span className="text-slate-500">
                    {isInterState ? 'IGST 18%' : 'CGST 9% + SGST 9% (Local)'}
                  </span>
                </div>

                <div className="flex justify-end gap-3 pt-3 border-t border-slate-800">
                  <button
                    type="button"
                    onClick={() => setCreateModalOpen(false)}
                    className="px-4 py-2 rounded-lg bg-slate-800 text-slate-300 text-xs font-semibold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-lg bg-green-600 hover:bg-green-500 text-white text-xs font-bold"
                  >
                    Issue Tax Invoice
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal: Record Payment */}
        {paymentModalOpen && activeInvoice && (
          <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="glass-panel w-full max-w-md rounded-2xl border border-slate-700 p-6 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <DollarSign className="w-5 h-5 text-emerald-400" />
                  <h3 className="text-base font-bold text-white">
                    Record Payment: {activeInvoice.invoiceNumber}
                  </h3>
                </div>
                <button onClick={() => setPaymentModalOpen(false)} className="text-slate-400 hover:text-white">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 text-xs flex justify-between">
                <span className="text-slate-400">Current Outstanding Balance:</span>
                <span className="font-bold text-rose-400">
                  INR {activeInvoice.balanceAmount?.toLocaleString('en-IN')}
                </span>
              </div>

              <form onSubmit={handleRecordPaymentSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Amount Received (INR) *
                  </label>
                  <input
                    type="number"
                    min="1"
                    max={activeInvoice.balanceAmount}
                    required
                    value={paymentAmount}
                    onChange={(e) => setPaymentAmount(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-xs text-white"
                  />
                  <span className="text-[10px] text-slate-400 mt-0.5 block">
                    System prevents over-payment exceeding invoice balance.
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">Payment Mode *</label>
                    <select
                      value={paymentMode}
                      onChange={(e) => setPaymentMode(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-xs text-white"
                    >
                      <option value="BANK_TRANSFER">Bank Transfer (NEFT/RTGS)</option>
                      <option value="UPI">UPI</option>
                      <option value="CHEQUE">Cheque</option>
                      <option value="CASH">Cash</option>
                      <option value="CARD">Card</option>
                      <option value="OTHER">Other</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">Payment Date</label>
                    <input
                      type="date"
                      value={paymentDate}
                      onChange={(e) => setPaymentDate(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-xs text-white"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      UTR / Cheque / Ref No
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. UTR-HDFC-99214"
                      value={referenceNumber}
                      onChange={(e) => setReferenceNumber(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-xs text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">Deposit Bank</label>
                    <input
                      type="text"
                      value={bankName}
                      onChange={(e) => setBankName(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-xs text-white"
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-3 border-t border-slate-800">
                  <button
                    type="button"
                    onClick={() => setPaymentModalOpen(false)}
                    className="px-4 py-2 rounded-lg bg-slate-800 text-slate-300 text-xs font-semibold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold"
                  >
                    Confirm & Record Payment
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal: Credit Note */}
        {creditNoteModalOpen && activeInvoice && (
          <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="glass-panel w-full max-w-md rounded-2xl border border-slate-700 p-6 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <h3 className="text-base font-bold text-white">
                  Add Credit Note: {activeInvoice.invoiceNumber}
                </h3>
                <button onClick={() => setCreditNoteModalOpen(false)} className="text-slate-400 hover:text-white">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleCreditNoteSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Credit Note Adjustment Amount (INR) *
                  </label>
                  <input
                    type="number"
                    min="1"
                    max={activeInvoice.balanceAmount}
                    required
                    value={creditNoteAmount}
                    onChange={(e) => setCreditNoteAmount(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-xs text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Adjustment Justification / Reason *
                  </label>
                  <textarea
                    rows={2}
                    required
                    value={creditNoteReason}
                    onChange={(e) => setCreditNoteReason(e.target.value)}
                    placeholder="e.g. Commercial rate concession agreed by management"
                    className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-xs text-white"
                  />
                </div>

                <div className="flex justify-end gap-3 pt-3 border-t border-slate-800">
                  <button
                    type="button"
                    onClick={() => setCreditNoteModalOpen(false)}
                    className="px-4 py-2 rounded-lg bg-slate-800 text-slate-300 text-xs font-semibold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-lg bg-green-600 hover:bg-green-500 text-white text-xs font-bold"
                  >
                    Apply Credit Note
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
