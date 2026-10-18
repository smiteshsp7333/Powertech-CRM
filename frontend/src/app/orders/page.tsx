'use client';

import React, { useState, useEffect } from 'react';
import AppLayout from '../../components/layout/AppLayout';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import {
  ShoppingBag,
  Search,
  Filter,
  Eye,
  CheckCircle,
  Truck,
  FileText,
  Camera,
  X,
  AlertTriangle,
  Upload,
  CreditCard,
  Ban,
  ArrowRight,
} from 'lucide-react';
import { Order } from '../../types';

export default function OrdersPage() {
  const { hasPermission } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Modals
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [statusModalOpen, setStatusModalOpen] = useState(false);
  const [photoModalOpen, setPhotoModalOpen] = useState(false);
  const [activeOrder, setActiveOrder] = useState<any>(null);

  // Status form
  const [newStatus, setNewStatus] = useState('CONFIRMED');
  const [cancellationReason, setCancellationReason] = useState('');

  // Photo upload form
  const [selectedPhotos, setSelectedPhotos] = useState<FileList | null>(null);
  const [uploadingPhotos, setUploadingPhotos] = useState(false);

  useEffect(() => {
    loadOrders();
  }, [search, statusFilter, page]);

  const loadOrders = async () => {
    try {
      setLoading(true);
      const params: Record<string, string> = { page: String(page), limit: '10' };
      if (search) params.search = search;
      if (statusFilter) params.status = statusFilter;

      const res = await api.getOrders(params);
      if (res.success) {
        setOrders(res.data);
        setTotalPages(res.pagination.totalPages);
      }
    } catch (err) {
      console.error('Failed to load orders:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDetail = async (id: string) => {
    try {
      const res = await api.getOrderById(id);
      if (res.success) {
        setActiveOrder(res.data);
        setDetailModalOpen(true);
      }
    } catch (err) {
      alert('Failed to load order details');
    }
  };

  const handleUpdateStatusSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeOrder) return;

    if (newStatus === 'CANCELLED' && !cancellationReason) {
      alert('A cancellation reason is required when cancelling an order.');
      return;
    }

    try {
      const res = await api.updateOrderStatus(activeOrder.id, {
        status: newStatus,
        cancellationReason,
      });

      if (res.success) {
        setStatusModalOpen(false);
        loadOrders();
        if (detailModalOpen) {
          handleOpenDetail(activeOrder.id);
        }
      }
    } catch (err: any) {
      alert(err.message || 'Failed to update order status');
    }
  };

  const handlePhotoUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeOrder || !selectedPhotos || selectedPhotos.length === 0) return;

    const formData = new FormData();
    for (let i = 0; i < selectedPhotos.length; i++) {
      formData.append('photos', selectedPhotos[i]);
    }

    setUploadingPhotos(true);
    try {
      const res = await api.uploadOrderPhotos(activeOrder.id, formData);
      if (res.success) {
        alert('Completion photos uploaded successfully.');
        setPhotoModalOpen(false);
        setSelectedPhotos(null);
        handleOpenDetail(activeOrder.id);
      }
    } catch (err: any) {
      alert(err.message || 'Failed to upload photographs.');
    } finally {
      setUploadingPhotos(false);
    }
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Module Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-orange-500/10 text-orange-400 border border-orange-500/20">
              <ShoppingBag className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-black text-white">
                Order Management
              </h1>
              <p className="text-xs text-slate-400 mt-0.5">
                Track full order lifecycles, monitor fulfillment progress, and maintain audit records.
              </p>
            </div>
          </div>
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
              placeholder="Search by ORD number, customer..."
              className="w-full pl-9 pr-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-orange-500"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            className="px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-xs text-slate-300 focus:border-orange-500"
          >
            <option value="">All Statuses</option>
            <option value="PLACED">Placed</option>
            <option value="CONFIRMED">Confirmed</option>
            <option value="IN_PROGRESS">In Progress</option>
            <option value="READY_FOR_DISPATCH">Ready for Dispatch</option>
            <option value="DISPATCHED">Dispatched</option>
            <option value="DELIVERED">Delivered</option>
            <option value="COMPLETED">Completed</option>
            <option value="CANCELLED">Cancelled</option>
          </select>
        </div>

        {/* Table List */}
        <div className="glass-panel rounded-xl border border-slate-800 overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left data-table">
              <thead>
                <tr>
                  <th>Order Number</th>
                  <th>Order Date</th>
                  <th>Customer</th>
                  <th>Total Amount</th>
                  <th>Due Days</th>
                  <th>Status</th>
                  <th className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={7} className="text-center py-10 text-slate-400 text-xs">
                      Loading orders...
                    </td>
                  </tr>
                ) : orders.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-12 text-slate-400 text-xs">
                      No order records found.
                    </td>
                  </tr>
                ) : (
                  orders.map((ord) => (
                    <tr key={ord.id}>
                      <td className="font-bold text-orange-400">{ord.orderNumber}</td>
                      <td className="text-slate-400 text-xs">
                        {new Date(ord.orderDate).toLocaleDateString()}
                      </td>
                      <td className="font-semibold text-white">
                        {ord.customer?.name}
                        {ord.customer?.companyName && (
                          <span className="block text-[10px] text-slate-400 font-normal">
                            {ord.customer.companyName}
                          </span>
                        )}
                      </td>
                      <td className="font-bold text-white text-xs">
                        INR {ord.totalAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="text-slate-300 text-xs">{ord.dueDays} Days</td>
                      <td>
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            ord.status === 'COMPLETED'
                              ? 'badge-green'
                              : ord.status === 'DELIVERED'
                              ? 'badge-teal'
                              : ord.status === 'DISPATCHED'
                              ? 'badge-blue'
                              : ord.status === 'CANCELLED'
                              ? 'badge-red'
                              : 'badge-orange'
                          }`}
                        >
                          {ord.status.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleOpenDetail(ord.id)}
                            title="View Full Order Timeline & Records"
                            className="p-1.5 rounded-lg bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 transition-colors"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                          {hasPermission('ORDER', 'edit') && (
                            <button
                              onClick={() => {
                                setActiveOrder(ord);
                                setNewStatus(ord.status);
                                setCancellationReason('');
                                setStatusModalOpen(true);
                              }}
                              title="Update Order Status"
                              className="px-2.5 py-1 rounded-lg bg-orange-500/10 hover:bg-orange-500/20 text-orange-400 text-[10px] font-bold border border-orange-500/20"
                            >
                              Update Status
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

        {/* Modal: Order Detail & 360 View */}
        {detailModalOpen && activeOrder && (
          <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="glass-panel w-full max-w-3xl rounded-2xl border border-slate-700 p-6 max-h-[90vh] overflow-y-auto space-y-6">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div className="flex items-center gap-2.5">
                  <ShoppingBag className="w-5 h-5 text-orange-400" />
                  <div>
                    <h3 className="text-base font-bold text-white flex items-center gap-2">
                      Order: {activeOrder.orderNumber}
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold badge-orange">
                        {activeOrder.status}
                      </span>
                    </h3>
                    <span className="text-xs text-slate-400">
                      Placed on {new Date(activeOrder.orderDate).toLocaleDateString()}
                    </span>
                  </div>
                </div>
                <button onClick={() => setDetailModalOpen(false)} className="text-slate-400 hover:text-white">
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Source traceability links */}
              <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span className="text-slate-500 font-semibold">Origin Trace:</span>
                  {activeOrder.enquiry ? (
                    <span className="px-2 py-0.5 rounded badge-blue text-[10px] font-bold">
                      {activeOrder.enquiry.enquiryNumber}
                    </span>
                  ) : (
                    <span className="text-slate-400">Direct Order</span>
                  )}
                  {activeOrder.quotation && (
                    <>
                      <ArrowRight className="w-3.5 h-3.5 text-slate-600" />
                      <span className="px-2 py-0.5 rounded badge-purple text-[10px] font-bold">
                        {activeOrder.quotation.fullNumber}
                      </span>
                    </>
                  )}
                </div>
                <span className="text-slate-400">Customer: {activeOrder.customer?.name}</span>
              </div>

              {/* Order Items Table */}
              <div>
                <span className="text-xs font-bold text-white uppercase tracking-wider block mb-2">
                  Order Items & Dispatched Progress
                </span>
                <div className="overflow-x-auto border border-slate-800 rounded-lg">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-900 text-slate-400">
                      <tr>
                        <th className="p-2.5">Description</th>
                        <th className="p-2.5 text-right">Ordered Qty</th>
                        <th className="p-2.5 text-right">Dispatched</th>
                        <th className="p-2.5 text-right">Remaining</th>
                        <th className="p-2.5 text-right">Rate (INR)</th>
                        <th className="p-2.5 text-right">Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60">
                      {activeOrder.items?.map((it: any) => {
                        const rem = it.quantity - it.dispatchedQty;
                        return (
                          <tr key={it.id}>
                            <td className="p-2.5 text-white font-medium">
                              {it.itemDescription}
                              {it.specification && (
                                <span className="block text-[10px] text-slate-400">{it.specification}</span>
                              )}
                            </td>
                            <td className="p-2.5 text-right text-slate-300">
                              {it.quantity} {it.unit}
                            </td>
                            <td className="p-2.5 text-right text-teal-400 font-bold">
                              {it.dispatchedQty} {it.unit}
                            </td>
                            <td className="p-2.5 text-right text-amber-400 font-bold">
                              {rem} {it.unit}
                            </td>
                            <td className="p-2.5 text-right text-slate-300">{it.rate.toLocaleString('en-IN')}</td>
                            <td className="p-2.5 text-right text-white font-bold">{it.amount.toLocaleString('en-IN')}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Dispatches & Courier Tracking */}
              <div>
                <span className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5 mb-2">
                  <Truck className="w-4 h-4 text-teal-400" />
                  Dispatches ({activeOrder.dispatches?.length || 0})
                </span>
                {activeOrder.dispatches?.length === 0 ? (
                  <p className="text-xs text-slate-500 italic">No dispatches logged yet.</p>
                ) : (
                  <div className="space-y-2">
                    {activeOrder.dispatches.map((dsp: any) => (
                      <div
                        key={dsp.id}
                        className="p-3 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-between text-xs"
                      >
                        <div>
                          <span className="font-bold text-teal-400">{dsp.dispatchNumber}</span>
                          <span className="text-slate-400 block text-[11px]">
                            {dsp.transportCourier} | Tracking: {dsp.trackingNumber || 'N/A'}
                          </span>
                        </div>
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold badge-teal">
                          {dsp.deliveryStatus}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Completion Photos Gallery */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                    <Camera className="w-4 h-4 text-sky-400" />
                    Completion Photographs & Work Proof ({activeOrder.completionPhotos?.length || 0})
                  </span>
                  <button
                    onClick={() => setPhotoModalOpen(true)}
                    className="text-xs text-sky-400 hover:text-sky-300 font-bold flex items-center gap-1"
                  >
                    <Upload className="w-3.5 h-3.5" /> Upload Photos
                  </button>
                </div>

                {activeOrder.completionPhotos?.length === 0 ? (
                  <p className="text-xs text-slate-500 italic">No project completion photos uploaded yet.</p>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {activeOrder.completionPhotos.map((photo: any) => (
                      <div
                        key={photo.id}
                        className="p-2 rounded-lg bg-slate-900 border border-slate-800 text-center"
                      >
                        <a href={photo.filePath} target="_blank" rel="noreferrer" className="block">
                          <div className="h-24 w-full bg-slate-800 rounded flex items-center justify-center text-slate-500 hover:bg-slate-700 transition-colors overflow-hidden">
                            <img
                              src={photo.filePath}
                              alt={photo.originalName}
                              className="h-full w-full object-cover"
                              onError={(e) => {
                                (e.target as any).style.display = 'none';
                              }}
                            />
                          </div>
                        </a>
                        <span className="text-[10px] text-slate-400 block mt-1.5 truncate">
                          {photo.originalName}
                        </span>
                        <span className="text-[9px] text-slate-500 block">
                          by {photo.uploadedBy?.name || 'Staff'}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex justify-end pt-3 border-t border-slate-800">
                <button
                  onClick={() => setDetailModalOpen(false)}
                  className="px-4 py-2 rounded-lg bg-slate-800 text-slate-300 text-xs font-semibold"
                >
                  Close Window
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal: Update Status */}
        {statusModalOpen && activeOrder && (
          <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="glass-panel w-full max-w-md rounded-2xl border border-slate-700 p-6 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <h3 className="text-base font-bold text-white">Update Status: {activeOrder.orderNumber}</h3>
                <button onClick={() => setStatusModalOpen(false)} className="text-slate-400 hover:text-white">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleUpdateStatusSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Select New Status *</label>
                  <select
                    value={newStatus}
                    onChange={(e) => setNewStatus(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-xs text-white"
                  >
                    <option value="PLACED">Placed</option>
                    <option value="CONFIRMED">Confirmed</option>
                    <option value="IN_PROGRESS">In Progress</option>
                    <option value="READY_FOR_DISPATCH">Ready for Dispatch</option>
                    <option value="DISPATCHED">Dispatched</option>
                    <option value="DELIVERED">Delivered</option>
                    <option value="COMPLETED">Completed</option>
                    <option value="CANCELLED">Cancelled</option>
                  </select>
                </div>

                {newStatus === 'CANCELLED' && (
                  <div>
                    <label className="block text-xs font-semibold text-rose-400 mb-1">
                      Cancellation Reason (Mandatory) *
                    </label>
                    <textarea
                      rows={3}
                      required
                      value={cancellationReason}
                      onChange={(e) => setCancellationReason(e.target.value)}
                      placeholder="Why is this order being cancelled?..."
                      className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-rose-500/50 text-xs text-white"
                    />
                  </div>
                )}

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
                    className="px-5 py-2 rounded-lg bg-orange-600 hover:bg-orange-500 text-white text-xs font-bold"
                  >
                    Save Status Change
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal: Upload Completion Photographs */}
        {photoModalOpen && activeOrder && (
          <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="glass-panel w-full max-w-md rounded-2xl border border-slate-700 p-6 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <Camera className="w-5 h-5 text-sky-400" />
                  <h3 className="text-base font-bold text-white">Upload Completion Proof</h3>
                </div>
                <button onClick={() => setPhotoModalOpen(false)} className="text-slate-400 hover:text-white">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <p className="text-xs text-slate-400">
                Upload installation / completion proof photos for{' '}
                <span className="text-white font-bold">{activeOrder.orderNumber}</span>. Valid formats:
                JPEG, PNG, WEBP (Max 10MB per image).
              </p>

              <form onSubmit={handlePhotoUploadSubmit} className="space-y-4">
                <input
                  type="file"
                  multiple
                  accept="image/jpeg,image/png,image/webp,application/pdf"
                  onChange={(e) => setSelectedPhotos(e.target.files)}
                  required
                  className="w-full text-xs text-slate-400 file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-sky-600 file:text-white hover:file:bg-sky-500"
                />

                <div className="flex justify-end gap-3 pt-3 border-t border-slate-800">
                  <button
                    type="button"
                    onClick={() => setPhotoModalOpen(false)}
                    className="px-4 py-2 rounded-lg bg-slate-800 text-slate-300 text-xs font-semibold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={uploadingPhotos}
                    className="px-5 py-2 rounded-lg bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold disabled:opacity-50"
                  >
                    {uploadingPhotos ? 'Uploading...' : 'Upload & Save Photos'}
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
