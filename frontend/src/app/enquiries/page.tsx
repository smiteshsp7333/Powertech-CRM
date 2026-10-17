'use client';

import React, { useState, useEffect } from 'react';
import AppLayout from '../../components/layout/AppLayout';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import {
  HelpCircle,
  Plus,
  Search,
  Filter,
  Eye,
  Trash2,
  X,
  FileSpreadsheet,
  AlertTriangle,
  History,
  Building,
  User,
  ArrowRight,
} from 'lucide-react';
import { Enquiry } from '../../types';

export default function EnquiriesPage() {
  const { hasPermission } = useAuth();
  const [enquiries, setEnquiries] = useState<Enquiry[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Modals state
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [selectedEnquiry, setSelectedEnquiry] = useState<any>(null);
  const [warningMessage, setWarningMessage] = useState<string | null>(null);

  // Form State
  const [customerName, setCustomerName] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [customerType, setCustomerType] = useState<'INDIVIDUAL' | 'COMPANY'>('COMPANY');
  const [requirements, setRequirements] = useState('');
  const [remarks, setRemarks] = useState('');

  useEffect(() => {
    loadEnquiries();
  }, [search, statusFilter, typeFilter, page]);

  const loadEnquiries = async () => {
    try {
      setLoading(true);
      const params: Record<string, string> = {
        page: String(page),
        limit: '10',
      };
      if (search) params.search = search;
      if (statusFilter) params.status = statusFilter;
      if (typeFilter) params.customerType = typeFilter;

      const res = await api.getEnquiries(params);
      if (res.success) {
        setEnquiries(res.data);
        setTotalPages(res.pagination.totalPages);
      }
    } catch (err) {
      console.error('Failed to load enquiries:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateEnquiry = async (e: React.FormEvent) => {
    e.preventDefault();
    setWarningMessage(null);

    try {
      const res = await api.createEnquiry({
        customerName,
        companyName: customerType === 'COMPANY' ? companyName || customerName : null,
        phone,
        address,
        customerType,
        requirements,
        remarks,
      });

      if (res.success) {
        if (res.warning) {
          setWarningMessage(res.warning);
        } else {
          setCreateModalOpen(false);
          resetForm();
        }
        loadEnquiries();
      }
    } catch (err: any) {
      alert(err.message || 'Failed to create enquiry');
    }
  };

  const resetForm = () => {
    setCustomerName('');
    setCompanyName('');
    setPhone('');
    setAddress('');
    setRequirements('');
    setRemarks('');
    setWarningMessage(null);
  };

  const handleViewDetail = async (id: string) => {
    try {
      const res = await api.getEnquiryById(id);
      if (res.success) {
        setSelectedEnquiry(res.data);
        setDetailModalOpen(true);
      }
    } catch (err) {
      alert('Failed to fetch enquiry detail');
    }
  };

  const handleDeleteEnquiry = async (id: string) => {
    if (!confirm('Are you sure you want to soft-delete this enquiry record? It will be archived in audit logs.')) return;

    try {
      await api.deleteEnquiry(id);
      loadEnquiries();
    } catch (err: any) {
      alert(err.message || 'Failed to delete enquiry');
    }
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Module Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20">
              <HelpCircle className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-black text-white flex items-center gap-2">
                Enquiry Management
                <span className="text-xs px-2 py-0.5 rounded-full font-bold bg-blue-500/20 text-blue-400 border border-blue-500/30">
                  Blue Theme
                </span>
              </h1>
              <p className="text-xs text-slate-400 mt-0.5">
                Record and qualify prospective clients, track history timeline, and prepare quotations.
              </p>
            </div>
          </div>

          {hasPermission('ENQUIRY', 'create') && (
            <button
              onClick={() => {
                resetForm();
                setCreateModalOpen(true);
              }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-lg shadow-blue-600/20 transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>Record New Enquiry</span>
            </button>
          )}
        </div>

        {/* Filter and Search Bar */}
        <div className="glass-panel p-4 rounded-xl border border-slate-800 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 flex-1 min-w-[240px]">
            <div className="relative w-full max-w-sm">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                placeholder="Search by ENQ number, customer, phone..."
                className="w-full pl-9 pr-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
              className="px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-xs text-slate-300 focus:border-blue-500"
            >
              <option value="">All Statuses</option>
              <option value="OPEN">Open</option>
              <option value="QUOTATION_PREPARED">Quotation Prepared</option>
              <option value="ORDER_PLACED">Order Placed</option>
              <option value="CLOSED_LOST">Closed / Lost</option>
            </select>

            <select
              value={typeFilter}
              onChange={(e) => {
                setTypeFilter(e.target.value);
                setPage(1);
              }}
              className="px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-xs text-slate-300 focus:border-blue-500"
            >
              <option value="">All Customer Types</option>
              <option value="COMPANY">Company</option>
              <option value="INDIVIDUAL">Individual</option>
            </select>
          </div>
        </div>

        {/* Table List */}
        <div className="glass-panel rounded-xl border border-slate-800 overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left data-table">
              <thead>
                <tr>
                  <th>Enquiry Number</th>
                  <th>Date</th>
                  <th>Customer Name</th>
                  <th>Contact Info</th>
                  <th>Customer Type</th>
                  <th>Status</th>
                  <th>Assigned To</th>
                  <th className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={8} className="text-center py-10 text-slate-400 text-xs">
                      Loading enquiries...
                    </td>
                  </tr>
                ) : enquiries.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="text-center py-12 text-slate-400 text-xs">
                      No enquiry records found matching your filters.
                    </td>
                  </tr>
                ) : (
                  enquiries.map((enq) => (
                    <tr key={enq.id}>
                      <td className="font-bold text-blue-400">{enq.enquiryNumber}</td>
                      <td className="text-slate-400 text-xs">
                        {new Date(enq.enquiryDate).toLocaleDateString()}
                      </td>
                      <td className="font-semibold text-white">
                        {enq.customerName}
                        {enq.customer?.companyName && enq.customer?.companyName !== enq.customerName && (
                          <span className="block text-[10px] text-slate-400 font-normal">
                            {enq.customer?.companyName}
                          </span>
                        )}
                      </td>
                      <td className="text-slate-300 text-xs">{enq.phone}</td>
                      <td>
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-300">
                          {enq.customerType === 'COMPANY' ? (
                            <Building className="w-3 h-3 text-blue-400" />
                          ) : (
                            <User className="w-3 h-3 text-slate-400" />
                          )}
                          {enq.customerType}
                        </span>
                      </td>
                      <td>
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            enq.status === 'OPEN'
                              ? 'badge-blue'
                              : enq.status === 'QUOTATION_PREPARED'
                              ? 'badge-purple'
                              : enq.status === 'ORDER_PLACED'
                              ? 'badge-green'
                              : 'badge-red'
                          }`}
                        >
                          {enq.status.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="text-slate-300 text-xs">
                        {enq.assignedUser?.name || 'Unassigned'}
                      </td>
                      <td className="text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleViewDetail(enq.id)}
                            title="View Detail & Timeline"
                            className="p-1.5 rounded-lg bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 transition-colors"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                          {hasPermission('ENQUIRY', 'delete') && (
                            <button
                              onClick={() => handleDeleteEnquiry(enq.id)}
                              title="Archive / Soft Delete"
                              className="p-1.5 rounded-lg bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 transition-colors"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
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

          {/* Pagination Footer */}
          {totalPages > 1 && (
            <div className="p-4 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
              <span>
                Page {page} of {totalPages}
              </span>
              <div className="flex gap-2">
                <button
                  disabled={page <= 1}
                  onClick={() => setPage(page - 1)}
                  className="px-3 py-1 rounded bg-slate-800 hover:bg-slate-700 disabled:opacity-40"
                >
                  Previous
                </button>
                <button
                  disabled={page >= totalPages}
                  onClick={() => setPage(page + 1)}
                  className="px-3 py-1 rounded bg-slate-800 hover:bg-slate-700 disabled:opacity-40"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Modal: Create Enquiry */}
        {createModalOpen && (
          <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="glass-panel w-full max-w-xl rounded-2xl border border-slate-700 p-6 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between pb-4 border-b border-slate-800 mb-5">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-lg bg-blue-500/10 text-blue-400">
                    <HelpCircle className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-white">Record Customer Enquiry</h3>
                    <span className="text-xs text-slate-400">
                      Auto-generates sequential ENQ-YYYY-00001 inside database transaction.
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => setCreateModalOpen(false)}
                  className="p-1 text-slate-400 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {warningMessage && (
                <div className="mb-4 p-3.5 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs flex items-start gap-2.5">
                  <AlertTriangle className="w-4 h-4 text-amber-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <span className="font-bold block">Duplicate Phone Warning:</span>
                    <span>{warningMessage} Existing customer record was re-used.</span>
                    <button
                      onClick={() => setCreateModalOpen(false)}
                      className="mt-2 text-xs font-bold underline block text-white"
                    >
                      Acknowledge & Close
                    </button>
                  </div>
                </div>
              )}

              <form onSubmit={handleCreateEnquiry} className="space-y-4">
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 text-xs font-semibold text-slate-300 cursor-pointer">
                    <input
                      type="radio"
                      name="customerType"
                      checked={customerType === 'COMPANY'}
                      onChange={() => setCustomerType('COMPANY')}
                      className="text-blue-600"
                    />
                    <span>Company / Enterprise</span>
                  </label>
                  <label className="flex items-center gap-2 text-xs font-semibold text-slate-300 cursor-pointer">
                    <input
                      type="radio"
                      name="customerType"
                      checked={customerType === 'INDIVIDUAL'}
                      onChange={() => setCustomerType('INDIVIDUAL')}
                      className="text-blue-600"
                    />
                    <span>Individual Client</span>
                  </label>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Customer / Contact Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      placeholder="e.g. Ramesh Patil"
                      className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-xs text-white"
                    />
                  </div>

                  {customerType === 'COMPANY' && (
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">
                        Company Name
                      </label>
                      <input
                        type="text"
                        value={companyName}
                        onChange={(e) => setCompanyName(e.target.value)}
                        placeholder="e.g. Apex Solar Energy Ltd."
                        className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-xs text-white"
                      />
                    </div>
                  )}

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Phone Number *
                    </label>
                    <input
                      type="text"
                      required
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="e.g. 9876543210"
                      className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-xs text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">Address / Location</label>
                    <input
                      type="text"
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      placeholder="e.g. MIDC Industrial Area, Pune"
                      className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-xs text-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Enquiry Requirements & Technical Specifications *
                  </label>
                  <textarea
                    rows={3}
                    required
                    value={requirements}
                    onChange={(e) => setRequirements(e.target.value)}
                    placeholder="Describe requirement details (e.g. 50kVA Three-phase online UPS with battery backup)..."
                    className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-xs text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Remarks / Internal Notes</label>
                  <input
                    type="text"
                    value={remarks}
                    onChange={(e) => setRemarks(e.target.value)}
                    placeholder="e.g. Urgent turnaround requested within 10 days"
                    className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-xs text-white"
                  />
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
                  <button
                    type="button"
                    onClick={() => setCreateModalOpen(false)}
                    className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-lg shadow-blue-600/20"
                  >
                    Save Enquiry
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal: View Detail & Timeline */}
        {detailModalOpen && selectedEnquiry && (
          <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="glass-panel w-full max-w-2xl rounded-2xl border border-slate-700 p-6 max-h-[90vh] overflow-y-auto space-y-6">
              <div className="flex items-center justify-between pb-4 border-b border-slate-800">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-lg bg-blue-500/10 text-blue-400">
                    <HelpCircle className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-white flex items-center gap-2">
                      {selectedEnquiry.enquiryNumber}
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold badge-blue">
                        {selectedEnquiry.status}
                      </span>
                    </h3>
                    <span className="text-xs text-slate-400">
                      Recorded on {new Date(selectedEnquiry.enquiryDate).toLocaleString()}
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => setDetailModalOpen(false)}
                  className="p-1 text-slate-400 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Client Info Grid */}
              <div className="grid grid-cols-2 gap-4 p-4 rounded-xl bg-slate-900/60 border border-slate-800 text-xs">
                <div>
                  <span className="text-slate-500 font-semibold block">Customer Name</span>
                  <span className="text-white font-bold">{selectedEnquiry.customerName}</span>
                </div>
                <div>
                  <span className="text-slate-500 font-semibold block">Phone</span>
                  <span className="text-white">{selectedEnquiry.phone}</span>
                </div>
                <div>
                  <span className="text-slate-500 font-semibold block">Customer Type</span>
                  <span className="text-white">{selectedEnquiry.customerType}</span>
                </div>
                <div>
                  <span className="text-slate-500 font-semibold block">Address</span>
                  <span className="text-slate-300">{selectedEnquiry.address || '-'}</span>
                </div>
              </div>

              {/* Requirements & Notes */}
              <div>
                <span className="text-xs font-bold text-slate-300 uppercase tracking-wider block mb-1">
                  Requirements
                </span>
                <p className="text-xs text-slate-300 bg-slate-900/50 p-3 rounded-lg border border-slate-800 whitespace-pre-wrap">
                  {selectedEnquiry.requirements}
                </p>
              </div>

              {/* Linked Quotations */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                    <FileSpreadsheet className="w-3.5 h-3.5 text-purple-400" />
                    Linked Quotations ({selectedEnquiry.quotations?.length || 0})
                  </span>
                </div>
                {selectedEnquiry.quotations?.length === 0 ? (
                  <p className="text-xs text-slate-500 italic">No quotations issued yet.</p>
                ) : (
                  <div className="space-y-2">
                    {selectedEnquiry.quotations.map((q: any) => (
                      <div
                        key={q.id}
                        className="p-3 rounded-lg bg-slate-900/60 border border-slate-800 flex items-center justify-between text-xs"
                      >
                        <div>
                          <span className="font-bold text-purple-400 block">{q.fullNumber}</span>
                          <span className="text-[11px] text-slate-400">
                            Total: INR {q.totalAmount?.toLocaleString('en-IN')}
                          </span>
                        </div>
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold badge-purple">
                          {q.status}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Change History Timeline */}
              <div>
                <span className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5 mb-3">
                  <History className="w-3.5 h-3.5 text-blue-400" />
                  Audit History Timeline
                </span>
                <div className="space-y-3 relative before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-800">
                  {selectedEnquiry.timeline?.map((item: any) => (
                    <div key={item.id} className="flex items-start gap-3 pl-6 relative">
                      <div className="w-2 h-2 rounded-full bg-blue-500 absolute left-1 top-1.5 ring-4 ring-slate-900" />
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-white">{item.action}</span>
                          <span className="text-[10px] text-slate-500">
                            by {item.performedBy} on {new Date(item.createdAt).toLocaleString()}
                          </span>
                        </div>
                        <p className="text-xs text-slate-400 mt-0.5">{item.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex justify-end pt-4 border-t border-slate-800">
                <button
                  onClick={() => setDetailModalOpen(false)}
                  className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
                >
                  Close Window
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
