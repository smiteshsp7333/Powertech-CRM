'use client';

import React, { useState, useEffect } from 'react';
import AppLayout from '../../components/layout/AppLayout';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import {
  FileSpreadsheet,
  Plus,
  Search,
  Download,
  Trash2,
  X,
  FileCheck2,
  FileEdit,
  ArrowRight,
  Layers,
} from 'lucide-react';
import { Quotation, QuotationItem } from '../../types';

export default function QuotationsPage() {
  const { hasPermission } = useAuth();
  const [quotations, setQuotations] = useState<Quotation[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [enquiries, setEnquiries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Modals
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [revisionModalOpen, setRevisionModalOpen] = useState(false);
  const [convertModalOpen, setConvertModalOpen] = useState(false);
  const [activeQuotation, setActiveQuotation] = useState<any>(null);

  // Form State
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [selectedEnquiryId, setSelectedEnquiryId] = useState('');
  const [discountType, setDiscountType] = useState<'PERCENT' | 'FIXED'>('PERCENT');
  const [discountValue, setDiscountValue] = useState(0);
  const [taxRate, setTaxRate] = useState(18);
  const [specificationNotes, setSpecificationNotes] = useState('');
  const [termsAndConditions, setTermsAndConditions] = useState(
    'Validity: 30 days from issue date. Payment terms: 50% advance on PO, 50% upon delivery. Warranty: 2 Years comprehensive onsite.'
  );
  const [revisionReason, setRevisionReason] = useState('');
  const [agreedPaymentTerms, setAgreedPaymentTerms] = useState('50% advance, balance within 30 days');
  const [dueDays, setDueDays] = useState(30);

  const [lineItems, setLineItems] = useState<QuotationItem[]>([
    { itemDescription: '', specification: '', quantity: 1, unit: 'Nos', rate: 0, amount: 0 },
  ]);

  useEffect(() => {
    loadQuotations();
  }, [search, statusFilter, page]);

  useEffect(() => {
    loadDropdowns();
  }, []);

  const loadDropdowns = async () => {
    try {
      const [cRes, eRes] = await Promise.all([
        api.getCustomers(),
        api.getEnquiries({ limit: '50' }),
      ]);
      if (cRes.success) setCustomers(cRes.data);
      if (eRes.success) setEnquiries(eRes.data);
    } catch (err) {
      console.error(err);
    }
  };

  const loadQuotations = async () => {
    try {
      setLoading(true);
      const params: Record<string, string> = { page: String(page), limit: '10' };
      if (search) params.search = search;
      if (statusFilter) params.status = statusFilter;

      const res = await api.getQuotations(params);
      if (res.success) {
        setQuotations(res.data);
        setTotalPages(res.pagination.totalPages);
      }
    } catch (err) {
      console.error('Failed to load quotations:', err);
    } finally {
      setLoading(false);
    }
  };

  // Line item manipulation
  const handleItemChange = (index: number, field: keyof QuotationItem, val: any) => {
    const updated = [...lineItems];
    (updated[index] as any)[field] = val;
    const qty = Number(updated[index].quantity) || 0;
    const rate = Number(updated[index].rate) || 0;
    updated[index].amount = Math.round(qty * rate * 100) / 100;
    setLineItems(updated);
  };

  const addItemRow = () => {
    setLineItems([
      ...lineItems,
      { itemDescription: '', specification: '', quantity: 1, unit: 'Nos', rate: 0, amount: 0 },
    ]);
  };

  const removeItemRow = (index: number) => {
    if (lineItems.length === 1) return;
    setLineItems(lineItems.filter((_, i) => i !== index));
  };

  // Math summary calculation
  const subtotal = lineItems.reduce((acc, curr) => acc + (Number(curr.amount) || 0), 0);
  const discountAmount =
    discountType === 'PERCENT'
      ? Math.round(((subtotal * Math.min(100, Math.max(0, discountValue))) / 100) * 100) / 100
      : Math.min(subtotal, Math.max(0, discountValue));
  const taxable = Math.max(0, subtotal - discountAmount);
  const taxAmount = Math.round(((taxable * taxRate) / 100) * 100) / 100;
  const totalAmount = Math.round((taxable + taxAmount) * 100) / 100;

  const handleCreateQuotation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCustomerId) {
      alert('Please select a customer.');
      return;
    }

    try {
      const res = await api.createQuotation({
        customerId: selectedCustomerId,
        enquiryId: selectedEnquiryId || null,
        items: lineItems,
        discountType,
        discountValue,
        taxRate,
        specificationNotes,
        termsAndConditions,
      });

      if (res.success) {
        setCreateModalOpen(false);
        resetForm();
        loadQuotations();
      }
    } catch (err: any) {
      alert(err.message || 'Failed to create quotation');
    }
  };

  const handleOpenRevision = async (q: Quotation) => {
    try {
      const full = await api.getQuotationById(q.id);
      if (full.success) {
        setActiveQuotation(full.data);
        setLineItems(
          full.data.items.map((i: any) => ({
            itemDescription: i.itemDescription,
            specification: i.specification || '',
            quantity: i.quantity,
            unit: i.unit,
            rate: i.rate,
            amount: i.amount,
          }))
        );
        setDiscountType(full.data.discountType);
        setDiscountValue(full.data.discountValue);
        setTaxRate(full.data.taxRate);
        setSpecificationNotes(full.data.specificationNotes || '');
        setTermsAndConditions(full.data.termsAndConditions || '');
        setRevisionReason('');
        setRevisionModalOpen(true);
      }
    } catch (err) {
      alert('Failed to load quotation');
    }
  };

  const handleSaveRevision = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeQuotation) return;

    try {
      const res = await api.updateQuotationRevision(activeQuotation.id, {
        items: lineItems,
        discountType,
        discountValue,
        taxRate,
        specificationNotes,
        termsAndConditions,
        revisionReason,
      });

      if (res.success) {
        setRevisionModalOpen(false);
        loadQuotations();
      }
    } catch (err: any) {
      alert(err.message || 'Failed to update quotation revision');
    }
  };

  const handleConvertToOrderSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeQuotation) return;

    try {
      const res = await api.convertToOrder(activeQuotation.id, {
        agreedPaymentTerms,
        dueDays,
      });

      if (res.success) {
        alert(`Order ${res.data.orderNumber} successfully generated from Quotation!`);
        setConvertModalOpen(false);
        loadQuotations();
      }
    } catch (err: any) {
      alert(err.message || 'Failed to convert quotation to order');
    }
  };

  const handleDownloadPdf = async (id: string, fullNumber: string) => {
    try {
      const blob = await api.downloadQuotationPdf(id);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${fullNumber}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (err: any) {
      alert(err.message || 'Failed to download quotation PDF');
    }
  };

  const resetForm = () => {
    setSelectedCustomerId('');
    setSelectedEnquiryId('');
    setLineItems([{ itemDescription: '', specification: '', quantity: 1, unit: 'Nos', rate: 0, amount: 0 }]);
    setDiscountValue(0);
    setTaxRate(18);
    setSpecificationNotes('');
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Module Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20">
              <FileSpreadsheet className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-black text-white flex items-center gap-2">
                Quotation Management
                <span className="text-xs px-2 py-0.5 rounded-full font-bold bg-purple-500/20 text-purple-400 border border-purple-500/30">
                  Purple Theme
                </span>
              </h1>
              <p className="text-xs text-slate-400 mt-0.5">
                Generate itemized commercial quotations, manage revision snapshots, and export PDF documents.
              </p>
            </div>
          </div>

          {hasPermission('QUOTATION', 'create') && (
            <button
              onClick={() => {
                resetForm();
                setCreateModalOpen(true);
              }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs shadow-lg shadow-purple-600/20 transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>Create Commercial Quotation</span>
            </button>
          )}
        </div>

        {/* Filter and Search Bar */}
        <div className="glass-panel p-4 rounded-xl border border-slate-800 flex flex-wrap items-center justify-between gap-3">
          <div className="relative w-full max-w-sm">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              placeholder="Search by QTN number, customer..."
              className="w-full pl-9 pr-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            className="px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-xs text-slate-300 focus:border-purple-500"
          >
            <option value="">All Statuses</option>
            <option value="DRAFT">Draft</option>
            <option value="SENT">Sent</option>
            <option value="ACCEPTED">Accepted</option>
            <option value="REJECTED">Rejected</option>
            <option value="CONVERTED_TO_ORDER">Converted to Order</option>
          </select>
        </div>

        {/* Table List */}
        <div className="glass-panel rounded-xl border border-slate-800 overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left data-table">
              <thead>
                <tr>
                  <th>Quotation No</th>
                  <th>Date</th>
                  <th>Customer</th>
                  <th>Subtotal</th>
                  <th>Tax</th>
                  <th>Total Amount</th>
                  <th>Status</th>
                  <th className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={8} className="text-center py-10 text-slate-400 text-xs">
                      Loading quotations...
                    </td>
                  </tr>
                ) : quotations.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="text-center py-12 text-slate-400 text-xs">
                      No quotations found.
                    </td>
                  </tr>
                ) : (
                  quotations.map((q) => (
                    <tr key={q.id}>
                      <td className="font-bold text-purple-400">
                        {q.fullNumber}
                        {q.revisionNumber > 0 && (
                          <span className="ml-1.5 px-1.5 py-0.2 rounded text-[10px] bg-purple-900/60 text-purple-300 border border-purple-500/30">
                            Rev {q.revisionNumber}
                          </span>
                        )}
                      </td>
                      <td className="text-slate-400 text-xs">
                        {new Date(q.quotationDate).toLocaleDateString()}
                      </td>
                      <td className="font-semibold text-white">
                        {q.customer?.name}
                        {q.customer?.companyName && (
                          <span className="block text-[10px] text-slate-400 font-normal">
                            {q.customer.companyName}
                          </span>
                        )}
                      </td>
                      <td className="text-slate-300 text-xs">
                        INR {q.subtotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="text-slate-400 text-xs">
                        INR {q.taxAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="font-bold text-white text-xs">
                        INR {q.totalAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </td>
                      <td>
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            q.status === 'CONVERTED_TO_ORDER'
                              ? 'badge-green'
                              : q.status === 'ACCEPTED'
                              ? 'badge-teal'
                              : q.status === 'SENT'
                              ? 'badge-blue'
                              : q.status === 'REJECTED'
                              ? 'badge-red'
                              : 'badge-purple'
                          }`}
                        >
                          {q.status.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Download PDF */}
                          {hasPermission('QUOTATION', 'export') && (
                            <button
                              onClick={() => handleDownloadPdf(q.id, q.fullNumber)}
                              title="Download Server PDF"
                              className="p-1.5 rounded-lg bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 transition-colors"
                            >
                              <Download className="w-3.5 h-3.5" />
                            </button>
                          )}

                          {/* Edit / Revision */}
                          {hasPermission('QUOTATION', 'edit') && q.status !== 'CONVERTED_TO_ORDER' && (
                            <button
                              onClick={() => handleOpenRevision(q)}
                              title="Modify / Create Revision"
                              className="p-1.5 rounded-lg bg-purple-500/10 text-purple-400 hover:bg-purple-500/20 transition-colors"
                            >
                              <FileEdit className="w-3.5 h-3.5" />
                            </button>
                          )}

                          {/* Convert to Order */}
                          {hasPermission('ORDER', 'create') && q.status !== 'CONVERTED_TO_ORDER' && (
                            <button
                              onClick={() => {
                                setActiveQuotation(q);
                                setConvertModalOpen(true);
                              }}
                              title="Convert to Confirmed Order"
                              className="px-2.5 py-1 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 text-[10px] font-bold border border-emerald-500/30 flex items-center gap-1"
                            >
                              <FileCheck2 className="w-3 h-3" />
                              <span>Order</span>
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

        {/* Modal: Create Quotation */}
        {createModalOpen && (
          <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="glass-panel w-full max-w-3xl rounded-2xl border border-slate-700 p-6 max-h-[90vh] overflow-y-auto space-y-5">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <FileSpreadsheet className="w-5 h-5 text-purple-400" />
                  <h3 className="text-base font-bold text-white">Create Commercial Quotation</h3>
                </div>
                <button onClick={() => setCreateModalOpen(false)} className="text-slate-400 hover:text-white">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleCreateQuotation} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">Select Customer *</label>
                    <select
                      required
                      value={selectedCustomerId}
                      onChange={(e) => setSelectedCustomerId(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-xs text-white"
                    >
                      <option value="">-- Choose Customer --</option>
                      {customers.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name} {c.companyName ? `(${c.companyName})` : ''} - {c.phone}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Link Enquiry (Optional)
                    </label>
                    <select
                      value={selectedEnquiryId}
                      onChange={(e) => setSelectedEnquiryId(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-xs text-white"
                    >
                      <option value="">-- Standalone (No Enquiry) --</option>
                      {enquiries.map((e) => (
                        <option key={e.id} value={e.id}>
                          {e.enquiryNumber} - {e.customerName}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Line Items Table */}
                <div className="border border-slate-800 rounded-xl p-4 bg-slate-900/40 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-white uppercase tracking-wider">
                      Product & Service Line Items
                    </span>
                    <button
                      type="button"
                      onClick={addItemRow}
                      className="text-xs font-bold text-purple-400 hover:text-purple-300 flex items-center gap-1"
                    >
                      <Plus className="w-3.5 h-3.5" /> Add Item
                    </button>
                  </div>

                  {lineItems.map((item, idx) => (
                    <div key={idx} className="grid grid-cols-12 gap-2 items-center bg-slate-900 p-2.5 rounded-lg border border-slate-800">
                      <div className="col-span-5">
                        <input
                          type="text"
                          required
                          placeholder="Item Description *"
                          value={item.itemDescription}
                          onChange={(e) => handleItemChange(idx, 'itemDescription', e.target.value)}
                          className="w-full px-2.5 py-1.5 rounded bg-slate-800 border border-slate-700 text-xs text-white"
                        />
                      </div>
                      <div className="col-span-2">
                        <input
                          type="number"
                          min="1"
                          required
                          placeholder="Qty"
                          value={item.quantity}
                          onChange={(e) => handleItemChange(idx, 'quantity', e.target.value)}
                          className="w-full px-2 py-1.5 rounded bg-slate-800 border border-slate-700 text-xs text-white text-right"
                        />
                      </div>
                      <div className="col-span-1">
                        <input
                          type="text"
                          placeholder="Unit"
                          value={item.unit}
                          onChange={(e) => handleItemChange(idx, 'unit', e.target.value)}
                          className="w-full px-1.5 py-1.5 rounded bg-slate-800 border border-slate-700 text-xs text-white text-center"
                        />
                      </div>
                      <div className="col-span-2">
                        <input
                          type="number"
                          min="0"
                          required
                          placeholder="Rate"
                          value={item.rate}
                          onChange={(e) => handleItemChange(idx, 'rate', e.target.value)}
                          className="w-full px-2 py-1.5 rounded bg-slate-800 border border-slate-700 text-xs text-white text-right"
                        />
                      </div>
                      <div className="col-span-1 text-right text-xs font-bold text-slate-200">
                        {item.amount.toLocaleString('en-IN')}
                      </div>
                      <div className="col-span-1 text-right">
                        {lineItems.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeItemRow(idx)}
                            className="text-rose-400 hover:text-rose-300 p-1"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Totals & Tax Panel */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">
                        Specification Notes
                      </label>
                      <textarea
                        rows={2}
                        value={specificationNotes}
                        onChange={(e) => setSpecificationNotes(e.target.value)}
                        placeholder="Technical specs, color, ratings..."
                        className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-xs text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">
                        Terms & Conditions
                      </label>
                      <textarea
                        rows={2}
                        value={termsAndConditions}
                        onChange={(e) => setTermsAndConditions(e.target.value)}
                        className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-xs text-white"
                      />
                    </div>
                  </div>

                  <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-2.5 text-xs">
                    <div className="flex justify-between text-slate-300">
                      <span>Subtotal:</span>
                      <span className="font-bold">INR {subtotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                    </div>

                    <div className="flex items-center justify-between gap-2">
                      <span>Discount:</span>
                      <div className="flex items-center gap-1.5">
                        <select
                          value={discountType}
                          onChange={(e) => setDiscountType(e.target.value as any)}
                          className="px-2 py-0.5 rounded bg-slate-800 border border-slate-700 text-xs text-white"
                        >
                          <option value="PERCENT">%</option>
                          <option value="FIXED">Fixed</option>
                        </select>
                        <input
                          type="number"
                          min="0"
                          value={discountValue}
                          onChange={(e) => setDiscountValue(Number(e.target.value))}
                          className="w-16 px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 text-xs text-white text-right"
                        />
                      </div>
                    </div>

                    <div className="flex items-center justify-between gap-2">
                      <span>Tax (GST %):</span>
                      <input
                        type="number"
                        min="0"
                        value={taxRate}
                        onChange={(e) => setTaxRate(Number(e.target.value))}
                        className="w-16 px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 text-xs text-white text-right"
                      />
                    </div>

                    <div className="flex justify-between text-slate-400">
                      <span>Tax Amount:</span>
                      <span>INR {taxAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                    </div>

                    <div className="pt-2 border-t border-slate-800 flex justify-between text-sm font-black text-white">
                      <span>Total Amount:</span>
                      <span className="text-purple-400">INR {totalAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                    </div>
                  </div>
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
                    className="px-5 py-2 rounded-lg bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold shadow-lg shadow-purple-600/20"
                  >
                    Issue Quotation
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal: Edit / Revision */}
        {revisionModalOpen && activeQuotation && (
          <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="glass-panel w-full max-w-2xl rounded-2xl border border-slate-700 p-6 max-h-[90vh] overflow-y-auto space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <Layers className="w-5 h-5 text-purple-400" />
                  <h3 className="text-base font-bold text-white">
                    Modify & Revision {activeQuotation.fullNumber}
                  </h3>
                </div>
                <button onClick={() => setRevisionModalOpen(false)} className="text-slate-400 hover:text-white">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-3 rounded-lg bg-purple-950/30 border border-purple-500/20 text-xs text-purple-300">
                Modifying this issued quotation will automatically create a revision record (e.g.{' '}
                {activeQuotation.quotationNumber}-R{activeQuotation.revisionNumber + 1}) while keeping
                all earlier revisions preserved.
              </div>

              <form onSubmit={handleSaveRevision} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Reason for Revision / Modification *
                  </label>
                  <input
                    type="text"
                    required
                    value={revisionReason}
                    onChange={(e) => setRevisionReason(e.target.value)}
                    placeholder="e.g. Client requested 10% discount and additional battery cabinet"
                    className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-xs text-white"
                  />
                </div>

                <div className="border border-slate-800 rounded-xl p-3 bg-slate-900/40 space-y-2">
                  <span className="text-xs font-bold text-white uppercase tracking-wider block">Line Items</span>
                  {lineItems.map((item, idx) => (
                    <div key={idx} className="grid grid-cols-12 gap-2 items-center bg-slate-900 p-2 rounded">
                      <input
                        type="text"
                        required
                        value={item.itemDescription}
                        onChange={(e) => handleItemChange(idx, 'itemDescription', e.target.value)}
                        className="col-span-6 px-2 py-1 rounded bg-slate-800 text-xs text-white"
                      />
                      <input
                        type="number"
                        min="1"
                        value={item.quantity}
                        onChange={(e) => handleItemChange(idx, 'quantity', e.target.value)}
                        className="col-span-2 px-2 py-1 rounded bg-slate-800 text-xs text-white text-right"
                      />
                      <input
                        type="number"
                        min="0"
                        value={item.rate}
                        onChange={(e) => handleItemChange(idx, 'rate', e.target.value)}
                        className="col-span-3 px-2 py-1 rounded bg-slate-800 text-xs text-white text-right"
                      />
                    </div>
                  ))}
                </div>

                <div className="flex justify-between text-sm font-bold text-white p-3 rounded-lg bg-slate-900">
                  <span>Revised Total Amount:</span>
                  <span className="text-purple-400">INR {totalAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                </div>

                <div className="flex justify-end gap-3 pt-3 border-t border-slate-800">
                  <button
                    type="button"
                    onClick={() => setRevisionModalOpen(false)}
                    className="px-4 py-2 rounded-lg bg-slate-800 text-slate-300 text-xs font-semibold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-lg bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold"
                  >
                    Save New Revision
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal: Convert to Order */}
        {convertModalOpen && activeQuotation && (
          <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="glass-panel w-full max-w-md rounded-2xl border border-slate-700 p-6 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <FileCheck2 className="w-5 h-5 text-emerald-400" />
                  <h3 className="text-base font-bold text-white">Convert to Confirmed Order</h3>
                </div>
                <button onClick={() => setConvertModalOpen(false)} className="text-slate-400 hover:text-white">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <p className="text-xs text-slate-300">
                This will create a new order record (ORD-YYYY-00001) for{' '}
                <span className="font-bold text-white">{activeQuotation.customer?.name}</span> with a
                total contract value of{' '}
                <span className="font-bold text-emerald-400">
                  INR {activeQuotation.totalAmount?.toLocaleString('en-IN')}
                </span>
                .
              </p>

              <form onSubmit={handleConvertToOrderSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Agreed Payment Terms *
                  </label>
                  <input
                    type="text"
                    required
                    value={agreedPaymentTerms}
                    onChange={(e) => setAgreedPaymentTerms(e.target.value)}
                    placeholder="e.g. 50% Advance on PO, 50% on Delivery"
                    className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-xs text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Payment Due Days</label>
                  <input
                    type="number"
                    min="0"
                    value={dueDays}
                    onChange={(e) => setDueDays(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-xs text-white"
                  />
                </div>

                <div className="flex justify-end gap-3 pt-3 border-t border-slate-800">
                  <button
                    type="button"
                    onClick={() => setConvertModalOpen(false)}
                    className="px-4 py-2 rounded-lg bg-slate-800 text-slate-300 text-xs font-semibold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold"
                  >
                    Confirm & Place Order
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
