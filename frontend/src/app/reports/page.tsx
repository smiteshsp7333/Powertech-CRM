'use client';

import React, { useState, useEffect } from 'react';
import AppLayout from '../../components/layout/AppLayout';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import {
  BarChart3,
  Download,
  Filter,
  FileSpreadsheet,
  HelpCircle,
  ShoppingBag,
  Truck,
  CreditCard,
  DollarSign,
  ShoppingCart,
  Calendar,
  Search,
} from 'lucide-react';

const REPORT_TABS = [
  { id: 'ENQUIRY', label: 'Enquiry Register', icon: HelpCircle, color: '#2563eb' },
  { id: 'QUOTATION', label: 'Quotation Register', icon: FileSpreadsheet, color: '#7c3aed' },
  { id: 'ORDER', label: 'Order Register', icon: ShoppingBag, color: '#ea580c' },
  { id: 'DISPATCH', label: 'Dispatch & Delivery Log', icon: Truck, color: '#0d9488' },
  { id: 'BILLING', label: 'Billing & Sales Register', icon: CreditCard, color: '#16a34a' },
  { id: 'PAYMENTS', label: 'Collections & Receipts', icon: DollarSign, color: '#10b981' },
  { id: 'PURCHASE', label: 'Procurement & Purchases', icon: ShoppingCart, color: '#dc2626' },
];

export default function ReportsPage() {
  const { hasPermission } = useAuth();
  const [selectedReport, setSelectedReport] = useState('BILLING');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [tableData, setTableData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadReport();
  }, [selectedReport, startDate, endDate, statusFilter]);

  const loadReport = async () => {
    try {
      setLoading(true);
      const params: Record<string, string> = { reportType: selectedReport };
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;
      if (statusFilter) params.status = statusFilter;

      const res = await api.getReportData(params);
      if (res.success) {
        setTableData(res.data);
      }
    } catch (err) {
      console.error('Failed to load report data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleExportExcel = async () => {
    try {
      setDownloading(true);
      const params: Record<string, string> = {};
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;
      if (statusFilter) params.status = statusFilter;

      const blob = await api.downloadReportExcel(selectedReport, params);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Powertech_${selectedReport}_Report.xlsx`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (err: any) {
      alert(err.message || 'Failed to export Excel report');
    } finally {
      setDownloading(false);
    }
  };

  const filteredRows = (tableData?.rows || []).filter((row: any) => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return Object.values(row).some((val) => String(val).toLowerCase().includes(term));
  });

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Module Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-slate-800 text-slate-300 border border-slate-700">
              <BarChart3 className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-black text-white">
                Business Reports & Export Hub
              </h1>
              <p className="text-xs text-slate-400 mt-0.5">
                Comprehensive operational registers, tabular views, and server-side Excel (.xlsx) exports.
              </p>
            </div>
          </div>

          {hasPermission('REPORT', 'export') && (
            <button
              onClick={handleExportExcel}
              disabled={downloading}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-lg shadow-emerald-600/20 transition-all disabled:opacity-50"
            >
              <Download className="w-4 h-4" />
              <span>{downloading ? 'Generating Excel...' : 'Export to Excel (.xlsx)'}</span>
            </button>
          )}
        </div>

        {/* Report Tabs Navigation */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
          {REPORT_TABS.map((tab) => {
            const Icon = tab.icon;
            const isSelected = selectedReport === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => {
                  setSelectedReport(tab.id);
                  setStatusFilter('');
                }}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                  isSelected
                    ? 'bg-slate-800 text-white shadow-lg border border-slate-700'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                }`}
                style={{
                  borderBottom: isSelected ? `2px solid ${tab.color}` : '2px solid transparent',
                }}
              >
                <Icon className="w-4 h-4" style={{ color: tab.color }} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Filter Toolbar */}
        <div className="glass-panel p-4 rounded-xl border border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex items-center gap-1.5">
              <span className="text-slate-400 font-medium">From:</span>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-white text-xs"
              />
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-slate-400 font-medium">To:</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-white text-xs"
              />
            </div>
            {(startDate || endDate) && (
              <button
                onClick={() => {
                  setStartDate('');
                  setEndDate('');
                }}
                className="text-slate-400 hover:text-white underline text-[11px]"
              >
                Clear Dates
              </button>
            )}
          </div>

          <div className="relative w-full max-w-xs">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Filter report rows..."
              className="w-full pl-9 pr-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-slate-500"
            />
          </div>
        </div>

        {/* Report Title & Row Count Banner */}
        <div className="flex items-center justify-between text-xs text-slate-400 px-1">
          <span className="font-bold text-white uppercase tracking-wider">
            {tableData?.reportTitle || 'Report Data'}
          </span>
          <span>Showing {filteredRows.length} recorded entries</span>
        </div>

        {/* Report Data Table */}
        <div className="glass-panel rounded-xl border border-slate-800 overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left data-table">
              <thead>
                <tr>
                  {tableData?.columns?.map((col: any) => (
                    <th key={col.key}>{col.header}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={10} className="text-center py-10 text-slate-400 text-xs">
                      Loading report register...
                    </td>
                  </tr>
                ) : filteredRows.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="text-center py-12 text-slate-400 text-xs">
                      No matching records found for this report.
                    </td>
                  </tr>
                ) : (
                  filteredRows.map((row: any, idx: number) => (
                    <tr key={idx}>
                      {tableData?.columns?.map((col: any) => {
                        const val = row[col.key];
                        return (
                          <td key={col.key} className="text-xs text-slate-300">
                            {typeof val === 'number'
                              ? `INR ${val.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`
                              : String(val ?? '-')}
                          </td>
                        );
                      })}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
