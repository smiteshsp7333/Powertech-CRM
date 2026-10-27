'use client';

import React, { useState, useEffect } from 'react';
import AppLayout from '../../components/layout/AppLayout';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import {
  Truck,
  Plus,
  Search,
  CheckCircle2,
  Clock,
  AlertTriangle,
  X,
  PackageCheck,
  Send,
  MapPin,
  Trash2,
} from 'lucide-react';
import { Dispatch } from '../../types';

export default function DispatchesPage() {
  const { hasPermission } = useAuth();
  const [dispatches, setDispatches] = useState<Dispatch[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Modals
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [statusModalOpen, setStatusModalOpen] = useState(false);
  const [activeDispatch, setActiveDispatch] = useState<any>(null);

  // Form State
  const [selectedOrderId, setSelectedOrderId] = useState('');
  const [selectedOrderDetails, setSelectedOrderDetails] = useState<any>(null);
  const [transportCourier, setTransportCourier] = useState('');
  const [trackingNumber, setTrackingNumber] = useState('');
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [expectedDeliveryDate, setExpectedDeliveryDate] = useState('');
  const [remarks, setRemarks] = useState('');
  const [dispatchItemQuantities, setDispatchItemQuantities] = useState<Record<string, number>>({});

  // Status update form
  const [newStatus, setNewStatus] = useState('DELIVERED');
  const [actualDeliveryDate, setActualDeliveryDate] = useState('');
  const [actualDeliveryTime, setActualDeliveryTime] = useState('');
  const [statusRemarks, setStatusRemarks] = useState('');

  useEffect(() => {
    loadDispatches();
  }, [search, statusFilter, page]);

  useEffect(() => {
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

  const loadDispatches = async () => {
    try {
      setLoading(true);
      const params: Record<string, string> = { page: String(page), limit: '10' };
      if (search) params.search = search;
      if (statusFilter) params.deliveryStatus = statusFilter;

      const res = await api.getDispatches(params);
      if (res.success) {
        setDispatches(res.data);
        setTotalPages(res.pagination.totalPages);
      }
    } catch (err) {
      console.error('Failed to load dispatches:', err);
    } finally {
      setLoading(false);
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
        setDeliveryAddress(res.data.customer?.address || res.data.customerAddress || '');
        // Default to dispatching all remaining quantities
        const initialQtys: Record<string, number> = {};
        res.data.items?.forEach((it: any) => {
          const totalQty = Number(it.quantity) || 1;
          const dispatched = Number(it.dispatchedQty ?? it.dispatchedQuantity ?? 0);
          const rem = Math.max(0, totalQty - dispatched);
          initialQtys[it.id] = rem;
        });
        setDispatchItemQuantities(initialQtys);
      }
    } catch (err) {
      alert('Failed to load order items');
    }
  };

  const handleCreateDispatchSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrderId || !selectedOrderDetails) return;

    // Build items payload
    const items = Object.entries(dispatchItemQuantities)
      .filter(([_, qty]) => Number(qty) > 0)
      .map(([orderItemId, quantity]) => ({ orderItemId, quantity: Number(quantity) }));

    if (items.length === 0) {
      alert('Please specify quantity greater than 0 for at least one item.');
      return;
    }

    try {
      const res = await api.createDispatch({
        orderId: selectedOrderId,
        transportCourier,
        trackingNumber,
        deliveryAddress,
        expectedDeliveryDate,
        remarks,
        items,
      });

      if (res.success) {
        setCreateModalOpen(false);
        resetCreateForm();
        loadDispatches();
      }
    } catch (err: any) {
      alert(err.message || 'Failed to create dispatch');
    }
  };

  const handleUpdateStatusSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeDispatch) return;

    try {
      const res = await api.updateDeliveryStatus(activeDispatch.id, {
        deliveryStatus: newStatus,
        actualDeliveryDate,
        actualDeliveryTime,
        remarks: statusRemarks,
      });

      if (res.success) {
        setStatusModalOpen(false);
        loadDispatches();
      }
    } catch (err: any) {
      alert(err.message || 'Failed to update delivery status');
    }
  };

  const handleDeleteDispatch = async (id: string) => {
    if (!confirm('Are you sure you want to delete this dispatch record?')) return;
    try {
      await api.deleteDispatch(id);
      loadDispatches();
    } catch (err: any) {
      alert(err.message || 'Failed to delete dispatch');
    }
  };

  const resetCreateForm = () => {
    setSelectedOrderId('');
    setSelectedOrderDetails(null);
    setTransportCourier('');
    setTrackingNumber('');
    setDeliveryAddress('');
    setExpectedDeliveryDate('');
    setRemarks('');
    setDispatchItemQuantities({});
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Module Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-teal-500/10 text-teal-400 border border-teal-500/20">
              <Truck className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-black text-white">
                Dispatch & Delivery Management
              </h1>
              <p className="text-xs text-slate-400 mt-0.5">
                Log partial or full shipments, track courier consignments, and record delivery handovers.
              </p>
            </div>
          </div>

          {hasPermission('DISPATCH', 'create') && (
            <button
              onClick={() => {
                resetCreateForm();
                setCreateModalOpen(true);
              }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs shadow-lg shadow-teal-600/20 transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>Record New Dispatch</span>
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
              placeholder="Search by DSP number, tracking, courier, order..."
              className="w-full pl-9 pr-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-teal-500"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            className="px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-xs text-slate-300 focus:border-teal-500"
          >
            <option value="">All Delivery Statuses</option>
            <option value="PENDING">Pending</option>
            <option value="DISPATCHED">Dispatched</option>
            <option value="DELIVERED">Delivered</option>
            <option value="DELAYED">Delayed</option>
          </select>
        </div>

        {/* Table List */}
        <div className="glass-panel rounded-xl border border-slate-800 overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left data-table">
              <thead>
                <tr>
                  <th>Dispatch No</th>
                  <th>Dispatch Date</th>
                  <th>Order Reference</th>
                  <th>Customer</th>
                  <th>Transport / Courier</th>
                  <th>Tracking Number</th>
                  <th>Delivery Status</th>
                  <th className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={8} className="text-center py-10 text-slate-400 text-xs">
                      Loading dispatches...
                    </td>
                  </tr>
                ) : dispatches.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="text-center py-12 text-slate-400 text-xs">
                      No dispatch records found.
                    </td>
                  </tr>
                ) : (
                  dispatches.map((dsp) => (
                    <tr key={dsp.id}>
                      <td className="font-bold text-teal-400">{dsp.dispatchNumber}</td>
                      <td className="text-slate-400 text-xs">
                        {new Date(dsp.dispatchDate).toLocaleDateString()}
                      </td>
                      <td className="font-semibold text-orange-400">{dsp.order?.orderNumber || (dsp as any).orderNumber || '-'}</td>
                      <td className="text-white text-xs">{dsp.order?.customer?.name || (dsp.order as any)?.customerName || (dsp.order as any)?.companyName || 'Industrial Client'}</td>
                      <td className="text-slate-300 text-xs">{dsp.transportCourier || '-'}</td>
                      <td className="text-slate-200 font-mono text-xs">
                        {dsp.trackingNumber || '-'}
                      </td>
                      <td>
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            dsp.deliveryStatus === 'DELIVERED'
                              ? 'badge-green'
                              : dsp.deliveryStatus === 'DISPATCHED'
                              ? 'badge-teal'
                              : dsp.deliveryStatus === 'DELAYED'
                              ? 'badge-red'
                              : 'badge-grey'
                          }`}
                        >
                          {dsp.deliveryStatus}
                        </span>
                      </td>
                      <td className="text-right">
                        {hasPermission('DISPATCH', 'edit') && (
                          <button
                            onClick={() => {
                              setActiveDispatch(dsp);
                              setNewStatus(dsp.deliveryStatus);
                              setActualDeliveryDate(new Date().toISOString().slice(0, 10));
                              setActualDeliveryTime('15:00 IST');
                              setStatusRemarks(dsp.remarks || '');
                              setStatusModalOpen(true);
                            }}
                            className="px-2.5 py-1 rounded-lg bg-teal-500/10 hover:bg-teal-500/20 text-teal-400 text-[10px] font-bold border border-teal-500/20"
                          >
                            Update Delivery
                          </button>
                        )}
                        <button
                          onClick={() => handleDeleteDispatch(dsp.id)}
                          title="Delete Dispatch"
                          className="ml-1.5 p-1.5 rounded-lg bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 transition-colors inline-flex items-center"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Modal: Record Dispatch */}
        {createModalOpen && (
          <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="glass-panel w-full max-w-2xl rounded-2xl border border-slate-700 p-6 max-h-[90vh] overflow-y-auto space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <Truck className="w-5 h-5 text-teal-400" />
                  <h3 className="text-base font-bold text-white">Record Partial or Full Dispatch</h3>
                </div>
                <button onClick={() => setCreateModalOpen(false)} className="text-slate-400 hover:text-white">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleCreateDispatchSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Select Order *</label>
                  <select
                    required
                    value={selectedOrderId}
                    onChange={(e) => handleSelectOrder(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-xs text-white"
                  >
                    <option value="">-- Choose Order to Dispatch --</option>
                    {orders.map((o) => (
                      <option key={o.id} value={o.id}>
                        {o.orderNumber} - {o.customer?.name || o.customerName || o.companyName || 'Industrial Client'} ({o.status})
                      </option>
                    ))}
                  </select>
                </div>

                {selectedOrderDetails && (
                  <div className="border border-slate-800 rounded-xl p-3 bg-slate-900/40 space-y-3">
                    <span className="text-xs font-bold text-teal-400 uppercase tracking-wider block">
                      Fulfill Item Quantities (Partial Dispatch Supported)
                    </span>

                    {selectedOrderDetails.items?.map((it: any) => {
                      const totalQty = Number(it.quantity) || 1;
                      const dispatched = Number(it.dispatchedQty ?? it.dispatchedQuantity ?? 0);
                      const remaining = Math.max(0, totalQty - dispatched);
                      const unit = it.unit || 'Nos';
                      const itemDesc = it.itemDescription || it.description || 'Industrial Equipment / Material';
                      return (
                        <div
                          key={it.id}
                          className="flex items-center justify-between p-2 rounded bg-slate-900 border border-slate-800 text-xs"
                        >
                          <div>
                            <span className="font-medium text-white block">{itemDesc}</span>
                            <span className="text-[11px] text-slate-400">
                              Total: {totalQty} {unit} | Already Dispatched: {dispatched} {unit} | Available: {remaining} {unit}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-slate-400 text-[11px]">Dispatching:</span>
                            <input
                              type="number"
                              min="0"
                              max={remaining}
                              value={dispatchItemQuantities[it.id] ?? 0}
                              onChange={(e) =>
                                setDispatchItemQuantities({
                                  ...dispatchItemQuantities,
                                  [it.id]: Math.min(remaining, Math.max(0, Number(e.target.value) || 0)),
                                })
                              }
                              className="w-20 px-2 py-1 rounded bg-slate-800 border border-slate-700 text-right text-xs text-white"
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Transport / Courier Agency
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. VRL Logistics, DTDC, BlueDart"
                      value={transportCourier}
                      onChange={(e) => setTransportCourier(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-xs text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Tracking / Consignment Number
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. VRL-PUN-982144"
                      value={trackingNumber}
                      onChange={(e) => setTrackingNumber(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-xs text-white font-mono"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">Delivery Address</label>
                    <input
                      type="text"
                      value={deliveryAddress}
                      onChange={(e) => setDeliveryAddress(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-xs text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Expected Delivery Date
                    </label>
                    <input
                      type="date"
                      value={expectedDeliveryDate}
                      onChange={(e) => setExpectedDeliveryDate(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-xs text-white"
                    />
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
                    className="px-5 py-2 rounded-lg bg-teal-600 hover:bg-teal-500 text-white text-xs font-bold"
                  >
                    Generate Dispatch Note
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal: Update Delivery Status */}
        {statusModalOpen && activeDispatch && (
          <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="glass-panel w-full max-w-md rounded-2xl border border-slate-700 p-6 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <h3 className="text-base font-bold text-white">
                  Update Delivery: {activeDispatch.dispatchNumber}
                </h3>
                <button onClick={() => setStatusModalOpen(false)} className="text-slate-400 hover:text-white">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleUpdateStatusSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Delivery Status *</label>
                  <select
                    value={newStatus}
                    onChange={(e) => setNewStatus(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-xs text-white"
                  >
                    <option value="DISPATCHED">In Transit / Dispatched</option>
                    <option value="DELIVERED">Delivered to Client</option>
                    <option value="DELAYED">Delayed</option>
                  </select>
                </div>

                {newStatus === 'DELIVERED' && (
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">
                        Actual Date
                      </label>
                      <input
                        type="date"
                        value={actualDeliveryDate}
                        onChange={(e) => setActualDeliveryDate(e.target.value)}
                        className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-xs text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">
                        Time
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. 14:30 IST"
                        value={actualDeliveryTime}
                        onChange={(e) => setActualDeliveryTime(e.target.value)}
                        className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-xs text-white"
                      />
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Handover Remarks</label>
                  <input
                    type="text"
                    value={statusRemarks}
                    onChange={(e) => setStatusRemarks(e.target.value)}
                    placeholder="e.g. Received by Mr. Ramesh Patil in sound condition"
                    className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-xs text-white"
                  />
                </div>

                <div className="flex justify-end gap-3 pt-3 border-t border-slate-800">
                  <button
                    type="button"
                    onClick={() => setStatusModalOpen(false)}
                    className="px-4 py-2 rounded-lg bg-slate-800 text-slate-300 text-xs font-semibold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-lg bg-teal-600 hover:bg-teal-500 text-white text-xs font-bold"
                  >
                    Save Delivery Update
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
