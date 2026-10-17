'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import AppLayout from '../../components/layout/AppLayout';
import { api } from '../../services/api';
import {
  HelpCircle,
  FileSpreadsheet,
  ShoppingBag,
  Truck,
  Clock,
  AlertCircle,
  CreditCard,
  CheckCircle2,
  ShoppingCart,
  ArrowUpRight,
  TrendingUp,
  Filter,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
} from 'recharts';

export default function DashboardPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadMetrics();
  }, []);

  const loadMetrics = async () => {
    try {
      setLoading(true);
      const res = await api.getDashboardMetrics();
      if (res.success) {
        setData(res.data);
      }
    } catch (err) {
      console.error('Failed to load dashboard metrics:', err);
    } finally {
      setLoading(false);
    }
  };

  const cards = data?.cards || {};

  return (
    <AppLayout>
      <div className="space-y-8">
        {/* Header Title Banner */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-800">
          <div>
            <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white">
              Executive Dashboard
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              Real-time operational metrics across sales, dispatches, billing, and procurement.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={loadMetrics}
              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition-colors"
            >
              Refresh Data
            </button>
          </div>
        </div>

        {/* 9 KPI Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-4">
          {/* 1. Enquiries */}
          <Link
            href="/enquiries"
            className="glass-card p-5 rounded-xl border border-blue-500/20 hover:border-blue-500/50 group block"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-blue-400">
                Total Enquiries
              </span>
              <div className="p-2 rounded-lg bg-blue-500/10 text-blue-400">
                <HelpCircle className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-3 flex items-baseline justify-between">
              <span className="text-2xl font-black text-white">
                {cards.totalEnquiries ?? 0}
              </span>
              <span className="text-[11px] font-semibold text-blue-400 flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
                View List <ArrowUpRight className="w-3.5 h-3.5" />
              </span>
            </div>
          </Link>

          {/* 2. Quotations */}
          <Link
            href="/quotations"
            className="glass-card p-5 rounded-xl border border-purple-500/20 hover:border-purple-500/50 group block"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-purple-400">
                Quotations Generated
              </span>
              <div className="p-2 rounded-lg bg-purple-500/10 text-purple-400">
                <FileSpreadsheet className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-3 flex items-baseline justify-between">
              <span className="text-2xl font-black text-white">
                {cards.totalQuotations ?? 0}
              </span>
              <span className="text-[11px] font-semibold text-purple-400 flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
                View List <ArrowUpRight className="w-3.5 h-3.5" />
              </span>
            </div>
          </Link>

          {/* 3. Confirmed Orders */}
          <Link
            href="/orders"
            className="glass-card p-5 rounded-xl border border-orange-500/20 hover:border-orange-500/50 group block"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-orange-400">
                Confirmed Orders
              </span>
              <div className="p-2 rounded-lg bg-orange-500/10 text-orange-400">
                <ShoppingBag className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-3 flex items-baseline justify-between">
              <span className="text-2xl font-black text-white">
                {cards.confirmedOrders ?? 0}
              </span>
              <span className="text-[11px] font-semibold text-orange-400 flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
                View List <ArrowUpRight className="w-3.5 h-3.5" />
              </span>
            </div>
          </Link>

          {/* 4. Pending Dispatches */}
          <Link
            href="/dispatches"
            className="glass-card p-5 rounded-xl border border-teal-500/20 hover:border-teal-500/50 group block"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-teal-400">
                Pending Dispatches
              </span>
              <div className="p-2 rounded-lg bg-teal-500/10 text-teal-400">
                <Truck className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-3 flex items-baseline justify-between">
              <span className="text-2xl font-black text-white">
                {cards.pendingDispatches ?? 0}
              </span>
              <span className="text-[11px] font-semibold text-teal-400 flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
                Dispatch Queue <ArrowUpRight className="w-3.5 h-3.5" />
              </span>
            </div>
          </Link>

          {/* 5. Pending Deliveries */}
          <Link
            href="/dispatches"
            className="glass-card p-5 rounded-xl border border-cyan-500/20 hover:border-cyan-500/50 group block"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-cyan-400">
                In-Transit Deliveries
              </span>
              <div className="p-2 rounded-lg bg-cyan-500/10 text-cyan-400">
                <Clock className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-3 flex items-baseline justify-between">
              <span className="text-2xl font-black text-white">
                {cards.pendingDeliveries ?? 0}
              </span>
              <span className="text-[11px] font-semibold text-cyan-400 flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
                Tracking Logs <ArrowUpRight className="w-3.5 h-3.5" />
              </span>
            </div>
          </Link>

          {/* 6. Pending Payments */}
          <Link
            href="/billing"
            className="glass-card p-5 rounded-xl border border-amber-500/20 hover:border-amber-500/50 group block"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-amber-400">
                Pending Payments
              </span>
              <div className="p-2 rounded-lg bg-amber-500/10 text-amber-400">
                <AlertCircle className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-3 flex items-baseline justify-between">
              <div>
                <span className="text-2xl font-black text-amber-300">
                  INR {(cards.pendingPaymentsAmount ?? 0).toLocaleString('en-IN')}
                </span>
                <span className="block text-[10px] text-slate-400 mt-0.5">
                  Across {cards.pendingPaymentsCount ?? 0} invoices
                </span>
              </div>
              <span className="text-[11px] font-semibold text-amber-400 flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
                Ageing Report <ArrowUpRight className="w-3.5 h-3.5" />
              </span>
            </div>
          </Link>

          {/* 7. Total Billing */}
          <div className="glass-card p-5 rounded-xl border border-emerald-500/20">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">
                Total Billing (Sales)
              </span>
              <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400">
                <CreditCard className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-3">
              <span className="text-2xl font-black text-white">
                INR {(cards.totalBilling ?? 0).toLocaleString('en-IN')}
              </span>
              <span className="block text-[10px] text-slate-400 mt-0.5">
                Total invoiced revenue
              </span>
            </div>
          </div>

          {/* 8. Total Collections */}
          <div className="glass-card p-5 rounded-xl border border-green-500/20">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-green-400">
                Total Collections
              </span>
              <div className="p-2 rounded-lg bg-green-500/10 text-green-400">
                <CheckCircle2 className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-3">
              <span className="text-2xl font-black text-green-300">
                INR {(cards.totalCollections ?? 0).toLocaleString('en-IN')}
              </span>
              <span className="block text-[10px] text-slate-400 mt-0.5">
                Net funds realized in bank/cash
              </span>
            </div>
          </div>

          {/* 9. Total Purchases */}
          <Link
            href="/purchases"
            className="glass-card p-5 rounded-xl border border-rose-500/20 hover:border-rose-500/50 group block"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-rose-400">
                Total Purchases
              </span>
              <div className="p-2 rounded-lg bg-rose-500/10 text-rose-400">
                <ShoppingCart className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-3 flex items-baseline justify-between">
              <div>
                <span className="text-2xl font-black text-white">
                  INR {(cards.totalPurchases ?? 0).toLocaleString('en-IN')}
                </span>
                <span className="block text-[10px] text-slate-400 mt-0.5">
                  Supplier procurement costs
                </span>
              </div>
              <span className="text-[11px] font-semibold text-rose-400 flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
                Suppliers <ArrowUpRight className="w-3.5 h-3.5" />
              </span>
            </div>
          </Link>
        </div>

        {/* Charts Section: Monthly Billing vs Collection + Enquiry Funnel */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Monthly Comparison Bar Chart */}
          <div className="lg:col-span-2 glass-panel p-6 rounded-2xl border border-slate-800">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                  Monthly Billing vs Collection (Last 6 Months)
                </h3>
                <span className="text-xs text-slate-400">
                  Tracking revenue generation against actual realized cash receipts.
                </span>
              </div>
              <TrendingUp className="w-4 h-4 text-emerald-400" />
            </div>

            <div className="h-72 w-full mt-4">
              {data?.monthlyTrend && (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data.monthlyTrend} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                    <XAxis dataKey="month" stroke="#94a3b8" fontSize={11} />
                    <YAxis
                      stroke="#94a3b8"
                      fontSize={11}
                      tickFormatter={(val) => `₹${(val / 1000).toFixed(0)}k`}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#0f172a',
                        border: '1px solid rgba(255,255,255,0.1)',
                        borderRadius: '8px',
                        fontSize: '12px',
                        color: '#fff',
                      }}
                      formatter={(val: any) => [`INR ${Number(val).toLocaleString('en-IN')}`, '']}
                    />
                    <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                    <Bar dataKey="billing" name="Billing (Sales)" fill="#2563eb" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="collection" name="Collection (Receipts)" fill="#16a34a" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          {/* Enquiry Funnel */}
          <div className="glass-panel p-6 rounded-2xl border border-slate-800 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                  Enquiry Conversion Funnel
                </h3>
                <Filter className="w-4 h-4 text-purple-400" />
              </div>
              <span className="text-xs text-slate-400 block mb-6">
                Progression from lead capture to placed orders.
              </span>

              <div className="space-y-4">
                {data?.enquiryFunnel?.map((step: any, index: number) => (
                  <div key={step.stage}>
                    <div className="flex justify-between text-xs font-semibold mb-1.5">
                      <span className="text-slate-300">{step.stage}</span>
                      <span className="font-bold text-white">{step.count}</span>
                    </div>
                    <div className="w-full h-2.5 rounded-full bg-slate-800 overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{
                          backgroundColor: step.color,
                          width: `${Math.max(10, Math.min(100, (step.count / Math.max(1, cards.totalEnquiries || 1)) * 100))}%`,
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-6 border-t border-slate-800/80 mt-6 text-[11px] text-slate-400">
              High pipeline velocity indicates efficient quote turnaround time.
            </div>
          </div>
        </div>

        {/* Recent Orders & Enquiries Table */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Orders */}
          <div className="glass-panel p-6 rounded-2xl border border-slate-800">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                Recent Orders
              </h3>
              <Link href="/orders" className="text-xs text-blue-400 hover:underline">
                View all orders
              </Link>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left data-table">
                <thead>
                  <tr>
                    <th>Order No</th>
                    <th>Customer</th>
                    <th>Amount</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {data?.recentOrders?.map((ord: any) => (
                    <tr key={ord.id}>
                      <td className="font-bold text-white">
                        <Link href={`/orders`} className="hover:text-blue-400">
                          {ord.orderNumber}
                        </Link>
                      </td>
                      <td className="text-slate-300">{ord.customer?.name}</td>
                      <td className="font-semibold text-white">
                        INR {ord.totalAmount?.toLocaleString('en-IN')}
                      </td>
                      <td>
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold badge-orange">
                          {ord.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Recent Enquiries */}
          <div className="glass-panel p-6 rounded-2xl border border-slate-800">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                Recent Enquiries
              </h3>
              <Link href="/enquiries" className="text-xs text-blue-400 hover:underline">
                View all enquiries
              </Link>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left data-table">
                <thead>
                  <tr>
                    <th>Enquiry No</th>
                    <th>Customer</th>
                    <th>Phone</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {data?.recentEnquiries?.map((enq: any) => (
                    <tr key={enq.id}>
                      <td className="font-bold text-white">
                        <Link href={`/enquiries`} className="hover:text-blue-400">
                          {enq.enquiryNumber}
                        </Link>
                      </td>
                      <td className="text-slate-300">{enq.customerName}</td>
                      <td className="text-slate-400">{enq.phone}</td>
                      <td>
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold badge-blue">
                          {enq.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
