'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '../../context/AuthContext';
import {
  LayoutDashboard,
  HelpCircle,
  FileSpreadsheet,
  ShoppingBag,
  Truck,
  CreditCard,
  ShoppingCart,
  CalendarDays,
  BarChart3,
  ShieldAlert,
  Sliders,
  LogOut,
  Menu,
  X,
  UserCheck,
  ChevronDown,
  Building2,
  ExternalLink,
} from 'lucide-react';
import { ModuleName } from '../../types';

interface NavItem {
  name: string;
  href: string;
  module?: ModuleName;
  icon: React.ComponentType<{ className?: string }>;
  accentColor: string;
  badge?: string;
}

const NAV_ITEMS: NavItem[] = [
  {
    name: 'Dashboard',
    href: '/dashboard',
    icon: LayoutDashboard,
    accentColor: '#38bdf8',
  },
  {
    name: 'Enquiries',
    href: '/enquiries',
    module: 'ENQUIRY',
    icon: HelpCircle,
    accentColor: '#2563eb', // Blue
  },
  {
    name: 'Quotations',
    href: '/quotations',
    module: 'QUOTATION',
    icon: FileSpreadsheet,
    accentColor: '#7c3aed', // Purple
  },
  {
    name: 'Orders',
    href: '/orders',
    module: 'ORDER',
    icon: ShoppingBag,
    accentColor: '#ea580c', // Orange
  },
  {
    name: 'Dispatch & Delivery',
    href: '/dispatches',
    module: 'DISPATCH',
    icon: Truck,
    accentColor: '#0d9488', // Teal
  },
  {
    name: 'Billing & Payments',
    href: '/billing',
    module: 'BILLING',
    icon: CreditCard,
    accentColor: '#16a34a', // Green
  },
  {
    name: 'Purchases',
    href: '/purchases',
    module: 'PURCHASE',
    icon: ShoppingCart,
    accentColor: '#dc2626', // Red
  },
  {
    name: 'Daily Summary',
    href: '/daily-summary',
    module: 'DAILY_SUMMARY',
    icon: CalendarDays,
    accentColor: '#0284c7', // Sky
  },
  {
    name: 'Reports',
    href: '/reports',
    module: 'REPORT',
    icon: BarChart3,
    accentColor: '#475569', // Grey
  },
  {
    name: 'Role Permissions',
    href: '/roles',
    module: 'USER_ROLE',
    icon: ShieldAlert,
    accentColor: '#f59e0b',
  },
  {
    name: 'Settings',
    href: '/settings',
    module: 'SETTING',
    icon: Sliders,
    accentColor: '#8b5cf6',
  },
];

const DEMO_ROLES = [
  { label: 'Super Admin', email: 'admin@powertech.com', color: '#f59e0b' },
  { label: 'Sales', email: 'sales@powertech.com', color: '#2563eb' },
  { label: 'Operations', email: 'operations@powertech.com', color: '#0d9488' },
  { label: 'Accounts', email: 'accounts@powertech.com', color: '#16a34a' },
  { label: 'Purchase', email: 'purchase@powertech.com', color: '#dc2626' },
];

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { user, logout, hasPermission, switchRoleDemo } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [roleDropdownOpen, setRoleDropdownOpen] = useState(false);

  // Filter navigation links based on user role permissions
  const permittedNavItems = NAV_ITEMS.filter((item) => {
    if (!item.module) return true;
    return hasPermission(item.module, 'view');
  });

  return (
    <div className="flex h-screen overflow-hidden bg-[#0a0f1d] text-slate-100">
      {/* Sidebar - Desktop */}
      <aside className="hidden lg:flex lg:flex-col w-64 bg-[#0d1527] border-r border-slate-800/80 shadow-2xl z-30">
        {/* Brand Header */}
        <div className="flex items-center gap-3 px-6 py-5 border-b border-slate-800/80 bg-[#09101f]">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
            <Building2 className="w-5 h-5 text-white" />
          </div>
          <div>
            <span className="text-base font-black tracking-wider text-white block">POWERTECH</span>
            <span className="text-[10px] font-semibold text-blue-400 uppercase tracking-widest block">
              Enterprise ERP
            </span>
          </div>
        </div>

        {/* Navigation Items */}
        <div className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
          {permittedNavItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center justify-between px-3.5 py-2.5 rounded-lg text-xs font-semibold transition-all duration-150 ${
                  isActive
                    ? 'bg-slate-800 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                }`}
                style={{
                  borderLeft: isActive ? `3px solid ${item.accentColor}` : '3px solid transparent',
                }}
              >
                <div className="flex items-center gap-3">
                  <div
                    className="p-1 rounded-md"
                    style={{
                      color: isActive ? item.accentColor : '#94a3b8',
                      backgroundColor: isActive ? `${item.accentColor}15` : 'transparent',
                    }}
                  >
                    <Icon className="w-4 h-4" />
                  </div>
                  <span>{item.name}</span>
                </div>
              </Link>
            );
          })}
        </div>

        {/* User Role Card & Footer */}
        <div className="p-4 border-t border-slate-800/80 bg-[#09101f]">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center font-bold text-xs text-blue-400">
                {user?.name?.slice(0, 2).toUpperCase() || 'PT'}
              </div>
              <div className="min-w-0">
                <span className="text-xs font-bold text-white block truncate">{user?.name || 'Authorized User'}</span>
                <span className="text-[10px] text-slate-400 block truncate">{user?.roleName || 'Guest'}</span>
              </div>
            </div>
            <button
              onClick={logout}
              title="Logout"
              className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-lg transition-colors"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Navbar */}
        <header className="h-16 bg-[#0d1527]/90 backdrop-blur border-b border-slate-800/80 px-4 lg:px-8 flex items-center justify-between z-20">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
            <div className="hidden sm:flex items-center gap-2 text-xs">
              <span className="text-slate-400 font-medium">Domain:</span>
              <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-blue-500/10 text-blue-400 border border-blue-500/20">
                Powertech CRM & ERP
              </span>
            </div>
          </div>

          {/* Quick Demo Role Switcher */}
          <div className="flex items-center gap-3">
            <div className="relative">
              <button
                onClick={() => setRoleDropdownOpen(!roleDropdownOpen)}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-800/80 border border-slate-700 hover:border-slate-600 text-xs font-semibold text-slate-200 transition-colors shadow-sm"
              >
                <UserCheck className="w-3.5 h-3.5 text-amber-400" />
                <span>Active Role:</span>
                <span className="text-amber-300 font-bold">{user?.roleName || 'Selecting...'}</span>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              </button>

              {roleDropdownOpen && (
                <div className="absolute right-0 mt-2 w-56 rounded-xl bg-[#0f172a] border border-slate-700 shadow-2xl py-2 z-50">
                  <div className="px-3 py-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-800">
                    Switch Test Role (1-Click)
                  </div>
                  {DEMO_ROLES.map((role) => (
                    <button
                      key={role.email}
                      onClick={() => {
                        switchRoleDemo(role.email);
                        setRoleDropdownOpen(false);
                      }}
                      className={`w-full text-left px-3.5 py-2 text-xs font-medium flex items-center justify-between hover:bg-slate-800 transition-colors ${
                        user?.roleName === role.label ? 'text-amber-400 font-bold bg-slate-800/40' : 'text-slate-300'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: role.color }} />
                        <span>{role.label}</span>
                      </div>
                      {user?.roleName === role.label && (
                        <span className="text-[10px] text-amber-400 font-bold">ACTIVE</span>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <a
              href="/docs"
              target="_blank"
              rel="noreferrer"
              className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800/60 hover:bg-slate-800 text-slate-300 hover:text-white text-xs font-semibold border border-slate-700/60 transition-colors"
            >
              <span>API Docs</span>
              <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
            </a>
          </div>
        </header>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="lg:hidden fixed inset-0 z-40 bg-black/60 backdrop-blur-sm">
            <div className="w-64 h-full bg-[#0d1527] border-r border-slate-800 p-4 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between pb-4 border-b border-slate-800 mb-4">
                  <span className="font-bold text-sm text-white">POWERTECH ERP</span>
                  <button onClick={() => setMobileMenuOpen(false)} className="text-slate-400 p-1">
                    <X className="w-5 h-5" />
                  </button>
                </div>
                <div className="space-y-1">
                  {permittedNavItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = pathname === item.href;
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={() => setMobileMenuOpen(false)}
                        className={`flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium ${
                          isActive ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-white'
                        }`}
                      >
                        <Icon className="w-4 h-4" />
                        <span>{item.name}</span>
                      </Link>
                    );
                  })}
                </div>
              </div>
              <button
                onClick={logout}
                className="w-full flex items-center justify-center gap-2 py-2 rounded-lg bg-rose-600/10 text-rose-400 border border-rose-500/20 text-xs font-semibold"
              >
                <LogOut className="w-4 h-4" />
                <span>Logout</span>
              </button>
            </div>
          </div>
        )}

        {/* Content Body */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 bg-[#0a0f1d]">{children}</main>
      </div>
    </div>
  );
}
