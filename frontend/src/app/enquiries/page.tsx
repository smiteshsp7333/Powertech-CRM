'use client';

import React, { useState, useEffect, useRef } from 'react';
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
  Edit3,
  UploadCloud,
  FileText,
  Paperclip,
  Download,
  Check,
  Save,
  RefreshCw,
} from 'lucide-react';
import { Enquiry, EnquiryAttachment } from '../../types';
import { ENQUIRY_STATUSES, getStatusMeta } from '../../lib/crm/enquiryStatuses';

const SALES_ENGINEERS = [
  { id: 'user-sales', name: 'Siddharth Sales', email: 'sales@powertechlaser.in' },
  { id: 'user-priya', name: 'Priya Engineer', email: 'priya@powertechlaser.in' },
  { id: 'user-rajesh', name: 'Rajesh Works', email: 'rajesh@powertechlaser.in' },
  { id: 'user-ops', name: 'Omkar Operations', email: 'production@powertechlaser.in' },
];

export default function EnquiriesPage() {
  const { hasPermission, user } = useAuth();
  const [enquiries, setEnquiries] = useState<Enquiry[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Modals state
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [selectedEnquiry, setSelectedEnquiry] = useState<Enquiry | null>(null);
  const [editingEnquiry, setEditingEnquiry] = useState<Enquiry | null>(null);
  const [warningMessage, setWarningMessage] = useState<string | null>(null);

  // Form State (Create / Edit)
  const [customerName, setCustomerName] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [customerType, setCustomerType] = useState<'INDIVIDUAL' | 'COMPANY'>('COMPANY');
  const [status, setStatus] = useState<'OPEN' | 'QUOTATION_PREPARED' | 'ORDER_PLACED' | 'CANCELLED' | 'CLOSED_LOST'>('OPEN');
  const [assignedUserId, setAssignedUserId] = useState('user-sales');
  const [requirements, setRequirements] = useState('');
  const [remarks, setRemarks] = useState('');
  const [attachments, setAttachments] = useState<EnquiryAttachment[]>([]);
  const [isUploading, setIsUploading] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const editFileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadEnquiries();
    // Auto-sync every 10 seconds for real-time cross-device updates
    const interval = setInterval(loadEnquiries, 10000);
    const handleFocus = () => loadEnquiries();
    window.addEventListener('focus', handleFocus);

    return () => {
      clearInterval(interval);
      window.removeEventListener('focus', handleFocus);
    };
  }, [search, statusFilter, typeFilter, page]);

  const loadEnquiries = async () => {
    try {
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
        if (res.pagination) {
          setTotalPages(res.pagination.totalPages || 1);
        }
      }
    } catch (err) {
      console.error('Failed to load enquiries:', err);
    } finally {
      setLoading(false);
    }
  };

  // Quick In-Table Field Update (Instant sync to Upstash Redis)
  const handleQuickUpdateField = async (id: string, fields: Partial<Enquiry>) => {
    // Optimistic UI update
    setEnquiries((prev) =>
      prev.map((e) => (e.id === id ? { ...e, ...fields } : e))
    );

    try {
      await api.updateEnquiry(id, {
        ...fields,
        performedBy: user?.name || 'Super Admin',
      });
      loadEnquiries();
    } catch (err: any) {
      console.error('Failed to quick-update enquiry field:', err);
      loadEnquiries(); // rollback
    }
  };

  // File Upload Helper: Reads drawings / CAD files into Base64 format
  const handleFileUpload = (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setIsUploading(true);

    const fileList = Array.from(files);
    const readers: Promise<EnquiryAttachment>[] = fileList.map((file) => {
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = (e) => {
          const ext = file.name.split('.').pop()?.toUpperCase() || 'FILE';
          resolve({
            id: `att-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
            fileName: file.name,
            fileSize: file.size,
            fileType: ext,
            fileData: e.target?.result as string,
            uploadedAt: new Date().toISOString(),
            uploadedBy: user?.name || 'Sales Engineer',
          });
        };
        reader.readAsDataURL(file);
      });
    });

    Promise.all(readers)
      .then((newAttachments) => {
        setAttachments((prev) => [...prev, ...newAttachments]);
        setIsUploading(false);
      })
      .catch((err) => {
        console.error('File read error:', err);
        setIsUploading(false);
      });
  };

  const handleRemoveAttachment = (attId: string) => {
    setAttachments((prev) => prev.filter((a) => a.id !== attId));
  };

  const downloadAttachment = (att: EnquiryAttachment) => {
    if (!att.fileData) return;
    const link = document.createElement('a');
    link.href = att.fileData;
    link.download = att.fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  // Create Enquiry Handler
  const handleCreateEnquiry = async (e: React.FormEvent) => {
    e.preventDefault();
    setWarningMessage(null);

    const assigned = SALES_ENGINEERS.find((u) => u.id === assignedUserId) || SALES_ENGINEERS[0];

    try {
      const res = await api.createEnquiry({
        customerName,
        companyName: customerType === 'COMPANY' ? companyName || customerName : null,
        phone,
        address,
        customerType,
        status: 'OPEN',
        assignedUserId: assigned.id,
        assignedUser: assigned,
        requirements,
        remarks,
        attachments,
        createdBy: { id: user?.id || 'user-admin', name: user?.name || 'Super Admin' },
      });

      if (res.success) {
        setCreateModalOpen(false);
        resetForm();
        loadEnquiries();
      }
    } catch (err: any) {
      alert(err.message || 'Failed to create enquiry');
    }
  };

  // Open Edit Modal
  const handleOpenEditModal = (enq: Enquiry) => {
    setEditingEnquiry(enq);
    setCustomerName(enq.customerName || '');
    setCompanyName(enq.companyName || enq.customer?.companyName || '');
    setPhone(enq.phone || '');
    setAddress(enq.address || '');
    setCustomerType(enq.customerType || 'COMPANY');
    setStatus((enq.status as any) || 'OPEN');
    setAssignedUserId(enq.assignedUserId || 'user-sales');
    setRequirements(enq.requirements || '');
    setRemarks(enq.remarks || '');
    setAttachments(enq.attachments || []);
    setEditModalOpen(true);
  };

  // Save Edited Enquiry Handler
  const handleSaveEditedEnquiry = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingEnquiry) return;

    const assigned = SALES_ENGINEERS.find((u) => u.id === assignedUserId) || SALES_ENGINEERS[0];

    try {
      const res = await api.updateEnquiry(editingEnquiry.id, {
        customerName,
        companyName: customerType === 'COMPANY' ? companyName || customerName : null,
        phone,
        address,
        customerType,
        status,
        assignedUserId: assigned.id,
        assignedUser: assigned,
        requirements,
        remarks,
        attachments,
        performedBy: user?.name || 'Super Admin',
      });

      if (res.success) {
        setEditModalOpen(false);
        setEditingEnquiry(null);
        resetForm();
        loadEnquiries();
      }
    } catch (err: any) {
      alert(err.message || 'Failed to update enquiry');
    }
  };

  const resetForm = () => {
    setCustomerName('');
    setCompanyName('');
    setPhone('');
    setAddress('');
    setCustomerType('COMPANY');
    setStatus('OPEN');
    setAssignedUserId('user-sales');
    setRequirements('');
    setRemarks('');
    setAttachments([]);
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
    if (!confirm('Are you sure you want to delete this enquiry record? It will be removed across all connected devices.')) {
      return;
    }

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
              <h1 className="text-xl font-black text-white">Enquiry Management</h1>
              <p className="text-xs text-slate-400 mt-0.5">
                Record and qualify prospective clients, upload CAD drawings, and track live status.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={loadEnquiries}
              title="Refresh from cloud database"
              className="p-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:text-white transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
            </button>

            {hasPermission('ENQUIRY', 'create') && (
              <button
                onClick={() => {
                  resetForm();
                  setCreateModalOpen(true);
                }}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-lg shadow-blue-600/20 transition-all cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Record New Enquiry</span>
              </button>
            )}
          </div>
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
              className="px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-xs text-slate-300 focus:border-blue-500 cursor-pointer"
            >
              <option value="">All Statuses</option>
              {ENQUIRY_STATUSES.map((st) => (
                <option key={st.key} value={st.key}>
                  {st.label}
                </option>
              ))}
            </select>

            <select
              value={typeFilter}
              onChange={(e) => {
                setTypeFilter(e.target.value);
                setPage(1);
              }}
              className="px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-xs text-slate-300 focus:border-blue-500 cursor-pointer"
            >
              <option value="">All Customer Types</option>
              <option value="COMPANY">Company</option>
              <option value="INDIVIDUAL">Individual</option>
            </select>
          </div>
        </div>

        {/* Interactive Enquiries Table (Matching Client Screen) */}
        <div className="glass-panel rounded-xl border border-slate-800 overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-900/80 text-slate-400 font-bold uppercase tracking-wider text-[11px]">
                  <th className="py-3 px-3.5">ENQ No.</th>
                  <th className="py-3 px-3">Date</th>
                  <th className="py-3 px-3">Customer</th>
                  <th className="py-3 px-3">Contact Info</th>
                  <th className="py-3 px-3">Customer Type</th>
                  <th className="py-3 px-3">Status</th>
                  <th className="py-3 px-3">Assigned To</th>
                  <th className="py-3 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {loading ? (
                  <tr>
                    <td colSpan={8} className="text-center py-10 text-slate-400 text-xs">
                      Loading enquiries from cloud database...
                    </td>
                  </tr>
                ) : enquiries.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="text-center py-12 text-slate-400 text-xs">
                      No enquiry records found. Click &ldquo;Record New Enquiry&rdquo; to create one.
                    </td>
                  </tr>
                ) : (
                  enquiries.map((enq) => (
                    <tr key={enq.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="py-3 px-3.5 font-bold font-sans text-blue-400">
                        {enq.enquiryNumber}
                      </td>
                      <td className="py-3 px-3 text-slate-400 text-xs">
                        {new Date(enq.enquiryDate).toLocaleDateString()}
                      </td>
                      <td className="py-3 px-3">
                        <div className="font-semibold text-white">{enq.customerName}</div>
                        {enq.companyName && enq.companyName !== enq.customerName && (
                          <span className="block text-[10px] text-slate-400 font-normal">
                            {enq.companyName}
                          </span>
                        )}
                        {enq.attachments && enq.attachments.length > 0 && (
                          <span className="inline-flex items-center gap-1 text-[10px] text-purple-400 mt-0.5">
                            <Paperclip className="w-2.5 h-2.5" />
                            {enq.attachments.length} drawing(s)
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-3 text-slate-300 text-xs font-mono">{enq.phone}</td>

                      {/* Interactive Customer Type Selector */}
                      <td className="py-3 px-3">
                        <select
                          value={enq.customerType}
                          onChange={(e) =>
                            handleQuickUpdateField(enq.id, {
                              customerType: e.target.value as 'INDIVIDUAL' | 'COMPANY',
                            })
                          }
                          aria-label={`Customer type for ${enq.enquiryNumber}`}
                          className="bg-slate-900 border border-slate-700/80 rounded-lg px-2.5 py-1 text-xs text-slate-200 font-semibold focus:outline-none focus:border-blue-500 cursor-pointer"
                        >
                          <option value="COMPANY">Company</option>
                          <option value="INDIVIDUAL">Individual</option>
                        </select>
                      </td>

                      {/* Interactive Status Selector (10 Status Stages) */}
                      <td className="py-3 px-3">
                        {(() => {
                          const meta = getStatusMeta(enq.status);
                          return (
                            <select
                              value={meta.key}
                              onChange={(e) =>
                                handleQuickUpdateField(enq.id, {
                                  status: e.target.value as any,
                                })
                              }
                              aria-label={`Status for ${enq.enquiryNumber}`}
                              className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border cursor-pointer focus:outline-none ${meta.badgeBg} ${meta.textColor} ${meta.borderColor}`}
                            >
                              {ENQUIRY_STATUSES.map((st) => (
                                <option
                                  key={st.key}
                                  value={st.key}
                                  className="bg-[#0b1329] text-slate-200"
                                >
                                  {st.label}
                                </option>
                              ))}
                            </select>
                          );
                        })()}
                      </td>

                      {/* Interactive Assignee Selector */}
                      <td className="py-3 px-3">
                        <select
                          value={enq.assignedUserId || 'user-sales'}
                          onChange={(e) => {
                            const uid = e.target.value;
                            const assigned = SALES_ENGINEERS.find((s) => s.id === uid) || SALES_ENGINEERS[0];
                            handleQuickUpdateField(enq.id, {
                              assignedUserId: uid,
                              assignedUser: assigned,
                            });
                          }}
                          aria-label={`Assignee for ${enq.enquiryNumber}`}
                          className="bg-slate-900 border border-slate-700/80 rounded-lg px-2.5 py-1 text-xs text-slate-200 focus:outline-none focus:border-blue-500 cursor-pointer"
                        >
                          {SALES_ENGINEERS.map((s) => (
                            <option key={s.id} value={s.id} className="bg-[#0b1329] text-slate-200">
                              {s.name}
                            </option>
                          ))}
                        </select>
                      </td>

                      {/* Actions: View, Edit, Link Quotation/Order, Delete */}
                      <td className="py-3 px-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Quick Link to Quotation */}
                          <a
                            href={`/quotations?enquiryId=${enq.id}&customerName=${encodeURIComponent(
                              enq.customerName
                            )}&companyName=${encodeURIComponent(
                              enq.companyName || ''
                            )}&phone=${encodeURIComponent(enq.phone)}&requirements=${encodeURIComponent(
                              enq.requirements
                            )}`}
                            title="Prepare Commercial Quotation for this Enquiry"
                            className="p-1.5 rounded-lg bg-purple-600/15 text-purple-400 hover:bg-purple-600/30 transition-colors cursor-pointer"
                          >
                            <FileSpreadsheet className="w-3.5 h-3.5" />
                          </a>

                          <button
                            onClick={() => handleViewDetail(enq.id)}
                            title="View Detail, Drawings & Timeline"
                            className="p-1.5 rounded-lg bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 transition-colors cursor-pointer"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleOpenEditModal(enq)}
                            title="Edit Full Enquiry Details & Drawings"
                            className="p-1.5 rounded-lg bg-blue-600/15 text-blue-400 hover:bg-blue-600/30 transition-colors cursor-pointer"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteEnquiry(enq.id)}
                            title="Delete Enquiry"
                            className="p-1.5 rounded-lg bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
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
              <span>Page {page} of {totalPages}</span>
              <div className="flex gap-2">
                <button
                  disabled={page <= 1}
                  onClick={() => setPage(page - 1)}
                  className="px-3 py-1 rounded bg-slate-800 hover:bg-slate-700 disabled:opacity-40 cursor-pointer"
                >
                  Previous
                </button>
                <button
                  disabled={page >= totalPages}
                  onClick={() => setPage(page + 1)}
                  className="px-3 py-1 rounded bg-slate-800 hover:bg-slate-700 disabled:opacity-40 cursor-pointer"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>

        {/* MODAL 1: RECORD NEW ENQUIRY (With Drawing & CAD File Upload) */}
        {createModalOpen && (
          <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="glass-panel w-full max-w-2xl rounded-2xl border border-slate-700 p-6 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between pb-4 border-b border-slate-800 mb-5">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-lg bg-blue-500/10 text-blue-400">
                    <HelpCircle className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-white">Record Customer Enquiry</h3>
                    <span className="text-xs text-slate-400">
                      Creates enquiry with sequential ENQ number and CAD file attachments.
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => setCreateModalOpen(false)}
                  className="p-1 text-slate-400 hover:text-white cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleCreateEnquiry} className="space-y-4">
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 text-xs font-semibold text-slate-300 cursor-pointer">
                    <input
                      type="radio"
                      name="customerTypeCreate"
                      checked={customerType === 'COMPANY'}
                      onChange={() => setCustomerType('COMPANY')}
                      className="text-blue-600"
                    />
                    <span>Company / Enterprise</span>
                  </label>
                  <label className="flex items-center gap-2 text-xs font-semibold text-slate-300 cursor-pointer">
                    <input
                      type="radio"
                      name="customerTypeCreate"
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
                      <label className="block text-xs font-semibold text-slate-300 mb-1">Company Name</label>
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
                    <label className="block text-xs font-semibold text-slate-300 mb-1">Phone Number *</label>
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
                    <label className="block text-xs font-semibold text-slate-300 mb-1">Assign Lead To</label>
                    <select
                      value={assignedUserId}
                      onChange={(e) => setAssignedUserId(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-xs text-white"
                    >
                      {SALES_ENGINEERS.map((s) => (
                        <option key={s.id} value={s.id}>{s.name} ({s.email})</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Address / Site Location</label>
                  <input
                    type="text"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="e.g. MIDC Industrial Area, Bhosari, Pune"
                    className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-xs text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Requirements &amp; Technical Specifications *
                  </label>
                  <textarea
                    rows={3}
                    required
                    value={requirements}
                    onChange={(e) => setRequirements(e.target.value)}
                    placeholder="Describe requirement details (e.g. 3mm SS 304 laser cutting profile, 50kVA laser cut enclosure)..."
                    className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-xs text-white"
                  />
                </div>

                {/* Drawing / CAD File Upload Zone */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs font-semibold text-slate-300">
                      Engineering Drawings &amp; CAD Files (DXF, DWG, STEP, PDF, Images)
                    </label>
                    <span className="text-[11px] text-purple-400 font-semibold">
                      {attachments.length} file(s) attached
                    </span>
                  </div>

                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="border-2 border-dashed border-slate-700 hover:border-blue-500 rounded-xl p-4 text-center cursor-pointer bg-slate-900/50 hover:bg-slate-900/80 transition-all"
                  >
                    <UploadCloud className="w-8 h-8 text-blue-400 mx-auto mb-1" />
                    <span className="text-xs font-bold text-white block">Click to upload engineering drawings</span>
                    <span className="text-[10px] text-slate-400 block mt-0.5">
                      Supports DXF, DWG, STEP, PDF, JPG, PNG up to 25MB
                    </span>
                    <input
                      ref={fileInputRef}
                      type="file"
                      multiple
                      accept=".dxf,.dwg,.step,.stp,.pdf,.png,.jpg,.jpeg"
                      onChange={(e) => handleFileUpload(e.target.files)}
                      className="hidden"
                    />
                  </div>

                  {attachments.length > 0 && (
                    <div className="mt-2 space-y-1.5">
                      {attachments.map((att) => (
                        <div
                          key={att.id}
                          className="flex items-center justify-between p-2 rounded-lg bg-slate-900 border border-slate-800 text-xs"
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <span className="px-1.5 py-0.5 rounded text-[10px] font-black uppercase bg-purple-500/20 text-purple-300 border border-purple-500/30">
                              {att.fileType}
                            </span>
                            <span className="text-white truncate font-medium">{att.fileName}</span>
                            <span className="text-slate-500 text-[10px] shrink-0">
                              ({formatFileSize(att.fileSize)})
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleRemoveAttachment(att.id)}
                            className="text-rose-400 hover:text-rose-300 p-1"
                            title="Remove file"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Remarks / Internal Notes</label>
                  <input
                    type="text"
                    value={remarks}
                    onChange={(e) => setRemarks(e.target.value)}
                    placeholder="e.g. Urgent turnaround requested within 5 business days"
                    className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-xs text-white"
                  />
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
                  <button
                    type="button"
                    onClick={() => setCreateModalOpen(false)}
                    className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-lg shadow-blue-600/20 cursor-pointer"
                  >
                    Save Enquiry
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* MODAL 2: EDIT FULL ENQUIRY DETAILS */}
        {editModalOpen && editingEnquiry && (
          <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="glass-panel w-full max-w-2xl rounded-2xl border border-slate-700 p-6 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between pb-4 border-b border-slate-800 mb-5">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-lg bg-blue-500/10 text-blue-400">
                    <Edit3 className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-white">Edit Enquiry: {editingEnquiry.enquiryNumber}</h3>
                    <span className="text-xs text-slate-400">
                      Update contact details, drawing attachments, customer type, or status.
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => setEditModalOpen(false)}
                  className="p-1 text-slate-400 hover:text-white cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSaveEditedEnquiry} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3.5 rounded-xl bg-slate-900/60 border border-slate-800">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                      Customer Type
                    </label>
                    <select
                      value={customerType}
                      onChange={(e) => setCustomerType(e.target.value as any)}
                      className="w-full px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-xs text-white"
                    >
                      <option value="COMPANY">Company / Enterprise</option>
                      <option value="INDIVIDUAL">Individual Client</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                      Enquiry Status
                    </label>
                    <select
                      value={status}
                      onChange={(e) => setStatus(e.target.value as any)}
                      className="w-full px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-xs text-white font-bold"
                    >
                      <option value="OPEN">Open</option>
                      <option value="QUOTATION_PREPARED">Quotation Prepared</option>
                      <option value="ORDER_PLACED">Order Placed</option>
                      <option value="CANCELLED">Cancelled</option>
                      <option value="CLOSED_LOST">Closed / Lost</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                      Assigned To
                    </label>
                    <select
                      value={assignedUserId}
                      onChange={(e) => setAssignedUserId(e.target.value)}
                      className="w-full px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-xs text-white"
                    >
                      {SALES_ENGINEERS.map((s) => (
                        <option key={s.id} value={s.id}>{s.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">Customer Name *</label>
                    <input
                      type="text"
                      required
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-xs text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">Company Name</label>
                    <input
                      type="text"
                      value={companyName}
                      onChange={(e) => setCompanyName(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-xs text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">Phone Number *</label>
                    <input
                      type="text"
                      required
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-xs text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">Address / Location</label>
                    <input
                      type="text"
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-xs text-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Requirements &amp; Technical Specifications *
                  </label>
                  <textarea
                    rows={3}
                    required
                    value={requirements}
                    onChange={(e) => setRequirements(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-xs text-white"
                  />
                </div>

                {/* Drawing / CAD File Upload Zone in Edit Modal */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs font-semibold text-slate-300">
                      Engineering Drawings &amp; CAD Files
                    </label>
                    <span className="text-[11px] text-purple-400 font-semibold">
                      {attachments.length} file(s) attached
                    </span>
                  </div>

                  <div
                    onClick={() => editFileInputRef.current?.click()}
                    className="border-2 border-dashed border-slate-700 hover:border-blue-500 rounded-xl p-3 text-center cursor-pointer bg-slate-900/50 hover:bg-slate-900/80 transition-all"
                  >
                    <UploadCloud className="w-6 h-6 text-blue-400 mx-auto mb-1" />
                    <span className="text-xs font-bold text-white block">Upload or Add More Drawings</span>
                    <input
                      ref={editFileInputRef}
                      type="file"
                      multiple
                      accept=".dxf,.dwg,.step,.stp,.pdf,.png,.jpg,.jpeg"
                      onChange={(e) => handleFileUpload(e.target.files)}
                      className="hidden"
                    />
                  </div>

                  {attachments.length > 0 && (
                    <div className="mt-2 space-y-1.5">
                      {attachments.map((att) => (
                        <div
                          key={att.id}
                          className="flex items-center justify-between p-2 rounded-lg bg-slate-900 border border-slate-800 text-xs"
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <span className="px-1.5 py-0.5 rounded text-[10px] font-black uppercase bg-purple-500/20 text-purple-300 border border-purple-500/30">
                              {att.fileType}
                            </span>
                            <span className="text-white truncate font-medium">{att.fileName}</span>
                            <span className="text-slate-500 text-[10px] shrink-0">
                              ({formatFileSize(att.fileSize)})
                            </span>
                          </div>
                          <div className="flex items-center gap-1">
                            {att.fileData && (
                              <button
                                type="button"
                                onClick={() => downloadAttachment(att)}
                                className="text-blue-400 hover:text-blue-300 p-1"
                                title="Download file"
                              >
                                <Download className="w-3.5 h-3.5" />
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() => handleRemoveAttachment(att.id)}
                              className="text-rose-400 hover:text-rose-300 p-1"
                              title="Remove file"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Remarks</label>
                  <input
                    type="text"
                    value={remarks}
                    onChange={(e) => setRemarks(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-xs text-white"
                  />
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
                  <button
                    type="button"
                    onClick={() => setEditModalOpen(false)}
                    className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-lg shadow-emerald-600/20 cursor-pointer flex items-center gap-1.5"
                  >
                    <Save className="w-3.5 h-3.5" />
                    <span>Save Changes</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* MODAL 3: VIEW DETAIL, DRAWINGS & AUDIT TIMELINE */}
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
                      {(() => {
                        const meta = getStatusMeta(selectedEnquiry.status);
                        return (
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold border ${meta.badgeBg} ${meta.textColor} ${meta.borderColor}`}
                          >
                            {meta.label}
                          </span>
                        );
                      })()}
                    </h3>
                    <span className="text-xs text-slate-400">
                      Recorded on {new Date(selectedEnquiry.enquiryDate).toLocaleString()} &bull; Assigned to: {selectedEnquiry.assignedUser?.name || 'Unassigned'}
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => setDetailModalOpen(false)}
                  className="p-1 text-slate-400 hover:text-white cursor-pointer"
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
                  <span className="text-slate-500 font-semibold block">Company Name</span>
                  <span className="text-white">{selectedEnquiry.companyName || '-'}</span>
                </div>
                <div>
                  <span className="text-slate-500 font-semibold block">Phone</span>
                  <span className="text-white font-mono">{selectedEnquiry.phone}</span>
                </div>
                <div>
                  <span className="text-slate-500 font-semibold block">Customer Type</span>
                  <span className="text-white font-semibold">{selectedEnquiry.customerType}</span>
                </div>
                <div className="col-span-2">
                  <span className="text-slate-500 font-semibold block">Address / Location</span>
                  <span className="text-slate-300">{selectedEnquiry.address || '-'}</span>
                </div>
              </div>

              {/* Requirements & Notes */}
              <div>
                <span className="text-xs font-bold text-slate-300 uppercase tracking-wider block mb-1">
                  Requirements &amp; Technical Specifications
                </span>
                <p className="text-xs text-slate-300 bg-slate-900/50 p-3 rounded-lg border border-slate-800 whitespace-pre-wrap">
                  {selectedEnquiry.requirements}
                </p>
              </div>

              {/* Engineering Drawing & CAD Attachments */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                    <Paperclip className="w-3.5 h-3.5 text-purple-400" />
                    Engineering Drawings &amp; CAD Files ({selectedEnquiry.attachments?.length || 0})
                  </span>
                </div>
                {!selectedEnquiry.attachments || selectedEnquiry.attachments.length === 0 ? (
                  <p className="text-xs text-slate-500 italic p-3 rounded-lg bg-slate-900/40 border border-slate-800">
                    No drawing attachments uploaded. Click Edit to add drawings.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {selectedEnquiry.attachments.map((att) => (
                      <div
                        key={att.id}
                        className="p-3 rounded-lg bg-slate-900/70 border border-slate-800 flex items-center justify-between text-xs"
                      >
                        <div className="flex items-center gap-2.5">
                          <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase bg-purple-500/20 text-purple-300 border border-purple-500/30">
                            {att.fileType}
                          </span>
                          <div>
                            <span className="font-bold text-white block">{att.fileName}</span>
                            <span className="text-[10px] text-slate-400">
                              Size: {formatFileSize(att.fileSize)} &bull; Uploaded on {new Date(att.uploadedAt).toLocaleDateString()}
                            </span>
                          </div>
                        </div>

                        {att.fileData && (
                          <button
                            type="button"
                            onClick={() => downloadAttachment(att)}
                            className="px-3 py-1.5 rounded-lg bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 border border-blue-500/30 text-xs font-bold transition-all flex items-center gap-1 cursor-pointer"
                          >
                            <Download className="w-3.5 h-3.5" />
                            <span>Download</span>
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Linked Quotations */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                    <FileSpreadsheet className="w-3.5 h-3.5 text-purple-400" />
                    Linked Quotations ({selectedEnquiry.quotations?.length || 0})
                  </span>
                </div>
                {!selectedEnquiry.quotations || selectedEnquiry.quotations.length === 0 ? (
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

              <div className="flex flex-wrap justify-between items-center gap-2 pt-4 border-t border-slate-800">
                <div className="flex items-center gap-2">
                  <a
                    href={`/quotations?enquiryId=${selectedEnquiry.id}&customerName=${encodeURIComponent(
                      selectedEnquiry.customerName
                    )}&companyName=${encodeURIComponent(
                      selectedEnquiry.companyName || ''
                    )}&phone=${encodeURIComponent(
                      selectedEnquiry.phone
                    )}&requirements=${encodeURIComponent(selectedEnquiry.requirements)}`}
                    className="px-4 py-2 rounded-lg bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-lg shadow-purple-600/20"
                  >
                    <FileSpreadsheet className="w-3.5 h-3.5" />
                    <span>Prepare Commercial Quotation</span>
                  </a>

                  <button
                    type="button"
                    onClick={() => {
                      setDetailModalOpen(false);
                      handleOpenEditModal(selectedEnquiry);
                    }}
                    className="px-4 py-2 rounded-lg bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 border border-blue-500/30 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    <span>Edit This Enquiry</span>
                  </button>
                </div>

                <button
                  onClick={() => setDetailModalOpen(false)}
                  className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold cursor-pointer"
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
