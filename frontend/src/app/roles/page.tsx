'use client';

import React, { useState, useEffect } from 'react';
import AppLayout from '../../components/layout/AppLayout';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { ShieldAlert, Save, ShieldCheck, Check, Lock } from 'lucide-react';
import { ModuleName } from '../../types';

const MODULES: { id: ModuleName; name: string }[] = [
  { id: 'ENQUIRY', name: 'Enquiry Management' },
  { id: 'QUOTATION', name: 'Quotation Management' },
  { id: 'ORDER', name: 'Order Management' },
  { id: 'DISPATCH', name: 'Dispatch & Delivery' },
  { id: 'BILLING', name: 'Billing & Payments' },
  { id: 'PURCHASE', name: 'Purchase & Procurement' },
  { id: 'DAILY_SUMMARY', name: 'Daily Financial Summary' },
  { id: 'REPORT', name: 'Reports & Analytics' },
  { id: 'USER_ROLE', name: 'Role & Permissions Vault' },
  { id: 'SETTING', name: 'System Settings' },
];

export default function RolesPage() {
  const { user } = useAuth();
  const [roles, setRoles] = useState<any[]>([]);
  const [selectedRoleId, setSelectedRoleId] = useState<string>('');
  const [permissionsState, setPermissionsState] = useState<Record<string, any>>({});
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    loadRoles();
  }, []);

  const loadRoles = async () => {
    try {
      const res = await api.getRoles();
      if (res.success && res.data.length > 0) {
        setRoles(res.data);
        const firstRole = res.data[0];
        setSelectedRoleId(firstRole.id);
        initPermissionsState(firstRole);
      }
    } catch (err) {
      console.error('Failed to load roles:', err);
    }
  };

  const handleSelectRole = (role: any) => {
    setSelectedRoleId(role.id);
    initPermissionsState(role);
    setSaveSuccess(false);
  };

  const initPermissionsState = (role: any) => {
    const pMap: Record<string, any> = {};
    MODULES.forEach((m) => {
      const existing = role.permissions?.find((p: any) => p.module === m.id);
      pMap[m.id] = {
        canView: existing ? existing.canView : false,
        canCreate: existing ? existing.canCreate : false,
        canEdit: existing ? existing.canEdit : false,
        canDelete: existing ? existing.canDelete : false,
        canExport: existing ? existing.canExport : false,
        dataScope: existing ? existing.dataScope : 'ALL',
      };
    });
    setPermissionsState(pMap);
  };

  const handleToggle = (module: ModuleName, field: string) => {
    setPermissionsState((prev) => ({
      ...prev,
      [module]: {
        ...prev[module],
        [field]: !prev[module]?.[field],
      },
    }));
    setSaveSuccess(false);
  };

  const handleScopeChange = (module: ModuleName, scope: 'OWN' | 'ALL') => {
    setPermissionsState((prev) => ({
      ...prev,
      [module]: {
        ...prev[module],
        dataScope: scope,
      },
    }));
    setSaveSuccess(false);
  };

  const handleSavePermissions = async () => {
    setSaving(true);
    setSaveSuccess(false);

    const payload = Object.entries(permissionsState).map(([module, perms]) => ({
      module,
      ...perms,
    }));

    try {
      const res = await api.updateRolePermissions(selectedRoleId, {
        permissions: payload,
      });

      if (res.success) {
        setSaveSuccess(true);
        // Refresh local roles list
        const updatedList = roles.map((r) => (r.id === selectedRoleId ? res.data : r));
        setRoles(updatedList);
      }
    } catch (err: any) {
      alert(err.message || 'Failed to save role permissions');
    } finally {
      setSaving(false);
    }
  };

  const currentRole = roles.find((r) => r.id === selectedRoleId);

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Module Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-black text-white">
                Role-Based Access Control (RBAC) Vault
              </h1>
              <p className="text-xs text-slate-400 mt-0.5">
                Configure module privileges (view, create, edit, delete, export) and data scopes (own vs all) enforced on every API route.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {saveSuccess && (
              <span className="text-xs text-emerald-400 font-bold flex items-center gap-1.5 animate-pulse">
                <Check className="w-4 h-4" /> Permissions updated and active!
              </span>
            )}
            <button
              onClick={handleSavePermissions}
              disabled={saving}
              className="inline-flex items-center gap-2 px-5 py-2 rounded-lg bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs shadow-lg shadow-amber-600/20 transition-all disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>{saving ? 'Saving...' : 'Save Permissions Matrix'}</span>
            </button>
          </div>
        </div>

        {/* Roles Tab Selector */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
          {roles.map((r) => {
            const isSelected = r.id === selectedRoleId;
            return (
              <button
                key={r.id}
                onClick={() => handleSelectRole(r)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                  isSelected
                    ? 'bg-amber-600/20 text-amber-300 border border-amber-500/40 shadow-lg'
                    : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
                }`}
              >
                <ShieldCheck className="w-4 h-4" />
                <span>{r.name}</span>
                {r.isSystem && (
                  <span className="text-[9px] px-1.5 py-0.2 rounded bg-amber-950/60 text-amber-400 font-bold uppercase">
                    System
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Selected Role Meta */}
        {currentRole && (
          <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between text-xs">
            <div>
              <span className="font-bold text-white text-sm">{currentRole.name}</span>
              <p className="text-slate-400 mt-0.5">{currentRole.description || 'Configured access role.'}</p>
            </div>
            {currentRole.name === 'Super Admin' && (
              <span className="px-3 py-1 rounded-lg bg-blue-500/10 text-blue-400 border border-blue-500/20 text-xs font-bold flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5" /> Super Admin retains master override access across all modules
              </span>
            )}
          </div>
        )}

        {/* Permission Matrix Table */}
        <div className="glass-panel rounded-xl border border-slate-800 overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left data-table">
              <thead>
                <tr>
                  <th>ERP Module</th>
                  <th className="text-center">View</th>
                  <th className="text-center">Create</th>
                  <th className="text-center">Edit</th>
                  <th className="text-center">Delete</th>
                  <th className="text-center">Export</th>
                  <th className="text-center">Data Scope</th>
                </tr>
              </thead>
              <tbody>
                {MODULES.map((m) => {
                  const perms = permissionsState[m.id] || {};
                  return (
                    <tr key={m.id}>
                      <td className="font-bold text-white text-xs">{m.name}</td>

                      {/* View */}
                      <td className="text-center">
                        <input
                          type="checkbox"
                          checked={Boolean(perms.canView)}
                          onChange={() => handleToggle(m.id, 'canView')}
                          className="w-4 h-4 rounded bg-slate-800 border-slate-700 text-amber-600 focus:ring-0 cursor-pointer"
                        />
                      </td>

                      {/* Create */}
                      <td className="text-center">
                        <input
                          type="checkbox"
                          checked={Boolean(perms.canCreate)}
                          onChange={() => handleToggle(m.id, 'canCreate')}
                          className="w-4 h-4 rounded bg-slate-800 border-slate-700 text-amber-600 focus:ring-0 cursor-pointer"
                        />
                      </td>

                      {/* Edit */}
                      <td className="text-center">
                        <input
                          type="checkbox"
                          checked={Boolean(perms.canEdit)}
                          onChange={() => handleToggle(m.id, 'canEdit')}
                          className="w-4 h-4 rounded bg-slate-800 border-slate-700 text-amber-600 focus:ring-0 cursor-pointer"
                        />
                      </td>

                      {/* Delete */}
                      <td className="text-center">
                        <input
                          type="checkbox"
                          checked={Boolean(perms.canDelete)}
                          onChange={() => handleToggle(m.id, 'canDelete')}
                          className="w-4 h-4 rounded bg-slate-800 border-slate-700 text-amber-600 focus:ring-0 cursor-pointer"
                        />
                      </td>

                      {/* Export */}
                      <td className="text-center">
                        <input
                          type="checkbox"
                          checked={Boolean(perms.canExport)}
                          onChange={() => handleToggle(m.id, 'canExport')}
                          className="w-4 h-4 rounded bg-slate-800 border-slate-700 text-amber-600 focus:ring-0 cursor-pointer"
                        />
                      </td>

                      {/* Data Scope */}
                      <td className="text-center">
                        <select
                          value={perms.dataScope || 'ALL'}
                          onChange={(e) => handleScopeChange(m.id, e.target.value as any)}
                          className="px-2.5 py-1 rounded bg-slate-900 border border-slate-700 text-[11px] font-bold text-slate-300 focus:border-amber-500"
                        >
                          <option value="ALL">All Records</option>
                          <option value="OWN">Own Records Only</option>
                        </select>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
