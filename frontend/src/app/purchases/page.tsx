'use client';

import React, { useState, useEffect } from 'react';
import AppLayout from '../../components/layout/AppLayout';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import {
  ShoppingCart,
  Plus,
  Search,
  Trash2,
  X,
  Building,
  Receipt,
} from 'lucide-react';
import { Purchase } from '../../types';

export default function PurchasesPage() {
  const { hasPermission } = useAuth();
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Modal
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [selectedSupplierId, setSelectedSupplierId] = useState('');
  const [supplierBillNo, setSupplierBillNo] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('RAW_MATERIAL');
  const [subtotal, setSubtotal] = useState<number>(0);
  const [taxRate, setTaxRate] = useState<number>(18);
  const [purchaseDate, setPurchaseDate] = useState(new Date().toISOString().slice(0, 10));

  useEffect(() => {
    loadPurchases();
  }, [search, page]);

  useEffect(() => {
    loadSuppliersList();
  }, []);

  const loadSuppliersList = async () => {
    try {
      const res = await api.getSuppliers();
      if (res.success) setSuppliers(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const loadPurchases = async () => {
    try {
      setLoading(true);
      const params: Record<string, string> = { page: String(page), limit: '10' };
      if (search) params.search = search;

      const res = await api.getPurchases(params);
      if (res.success) {
        setPurchases(res.data);
        setTotalPages(res.pagination.totalPages);
      }
    } catch (err) {
      console.error('Failed to load purchases:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePurchaseSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSupplierId || !description || subtotal <= 0) {
      alert('Supplier, description, and valid subtotal amount are required.');
      return;
    }

    try {
      const res = await api.createPurchase({
        supplierId: selectedSupplierId,
        supplierBillNo,
        description,
        category,
        subtotal,
        taxRate,
        purchaseDate,
      });

      if (res.success) {
        setCreateModalOpen(false);
        resetForm();
        loadPurchases();
      }
    } catch (err: any) {
      alert(err.message || 'Failed to record purchase bill');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to soft-delete this purchase record?')) return;
    try {
      await api.deletePurchase(id);
      loadPurchases();
    } catch (err: any) {
      alert(err.message || 'Failed to delete purchase record');
    }
  };

  const resetForm = () => {
    setSelectedSupplierId('');
    setSupplierBillNo('');
    setDescription('');
    setSubtotal(0);
    setTaxRate(18);
  };

  const calculatedTax = Math.round(((subtotal * taxRate) / 100) * 100) / 100;
  const calculatedTotal = Math.round((subtotal + calculatedTax) * 100) / 100;

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Module Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-rose-500/10 text-rose-400 border border-rose-500/20">
              <ShoppingCart className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-black text-white flex items-center gap-2">
                Purchase & Procurement
                <span className="text-xs px-2 py-0.5 rounded-full font-bold bg-rose-500/20 text-rose-400 border border-rose-500/30">
                  Red Theme
                </span>
              </h1>
              <p className="text-xs text-slate-400 mt-0.5">
                Manage vendor supplier bills and feed procurement expenses into the daily financial summary.
              </p>
            </div>
          </div>

          {hasPermission('PURCHASE', 'create') && (
            <button
              onClick={() => {
                resetForm();
                setCreateModalOpen(true);
              }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs shadow-lg shadow-rose-600/20 transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>Record Purchase Bill</span>
            </button>
          )}
        </div>

        {/* Search */}
        <div className="glass-panel p-4 rounded-xl border border-slate-800 flex items-center justify-between gap-3">
          <div className="relative w-full max-w-sm">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              placeholder="Search by purchase number, supplier, bill no..."
              className="w-full pl-9 pr-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-rose-500"
            />
          </div>
        </div>

        {/* Table List */}
        <div className="glass-panel rounded-xl border border-slate-800 overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left data-table">
              <thead>
                <tr>
                  <th>Purchase No</th>
                  <th>Date</th>
                  <th>Supplier</th>
                  <th>Bill / Invoice Ref</th>
                  <th>Description</th>
                  <th>Category</th>
                  <th>Total Amount</th>
                  <th className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={8} className="text-center py-10 text-slate-400 text-xs">
                      Loading purchases...
                    </td>
                  </tr>
                ) : purchases.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="text-center py-12 text-slate-400 text-xs">
                      No purchase records found.
                    </td>
                  </tr>
                ) : (
                  purchases.map((pur) => (
                    <tr key={pur.id}>
                      <td className="font-bold text-rose-400">{pur.purchaseNumber}</td>
                      <td className="text-slate-400 text-xs">
                        {new Date(pur.purchaseDate).toLocaleDateString()}
                      </td>
                      <td className="font-semibold text-white">
                        {pur.supplier?.name}
                        {pur.supplier?.companyName && (
                          <span className="block text-[10px] text-slate-400 font-normal">
                            {pur.supplier.companyName}
                          </span>
                        )}
                      </td>
                      <td className="text-slate-300 font-mono text-xs">
                        {pur.supplierBillNo || '-'}
                      </td>
                      <td className="text-slate-300 text-xs max-w-xs truncate">
                        {pur.description}
                      </td>
                      <td>
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-800 text-slate-300">
                          {pur.category || 'GENERAL'}
                        </span>
                      </td>
                      <td className="font-bold text-white text-xs">
                        INR {pur.totalAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="text-right">
                        {hasPermission('PURCHASE', 'delete') && (
                          <button
                            onClick={() => handleDelete(pur.id)}
                            title="Soft Delete"
                            className="p-1.5 rounded-lg bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
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

        {/* Modal: Record Purchase Bill */}
        {createModalOpen && (
          <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="glass-panel w-full max-w-lg rounded-2xl border border-slate-700 p-6 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <ShoppingCart className="w-5 h-5 text-rose-400" />
                  <h3 className="text-base font-bold text-white">Record Supplier Purchase</h3>
                </div>
                <button onClick={() => setCreateModalOpen(false)} className="text-slate-400 hover:text-white">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleCreatePurchaseSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Select Supplier *</label>
                  <select
                    required
                    value={selectedSupplierId}
                    onChange={(e) => setSelectedSupplierId(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-xs text-white"
                  >
                    <option value="">-- Choose Vendor / Supplier --</option>
                    {suppliers.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name} {s.companyName ? `(${s.companyName})` : ''}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Supplier Bill / Invoice No
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. VOL/2026/8841"
                      value={supplierBillNo}
                      onChange={(e) => setSupplierBillNo(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-xs text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">Purchase Date</label>
                    <input
                      type="date"
                      value={purchaseDate}
                      onChange={(e) => setPurchaseDate(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-xs text-white"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">Category</label>
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-xs text-white"
                    >
                      <option value="RAW_MATERIAL">Raw Material</option>
                      <option value="COMPONENTS">Components</option>
                      <option value="PACKAGING">Packaging</option>
                      <option value="SERVICES">Services</option>
                      <option value="LOGISTICS">Logistics</option>
                      <option value="OTHER">Other</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">Subtotal Amount (INR) *</label>
                    <input
                      type="number"
                      min="1"
                      required
                      value={subtotal}
                      onChange={(e) => setSubtotal(Number(e.target.value))}
                      className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-xs text-white text-right"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Description *</label>
                  <textarea
                    rows={2}
                    required
                    placeholder="e.g. Copper coils, transformers, safety breakers..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-xs text-white"
                  />
                </div>

                <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 text-xs flex justify-between font-bold">
                  <span className="text-slate-400">Total with 18% Tax:</span>
                  <span className="text-white">INR {calculatedTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
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
                    className="px-5 py-2 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold"
                  >
                    Save Purchase Bill
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
