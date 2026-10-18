'use client';

import React, { useState, useEffect } from 'react';
import AppLayout from '../../components/layout/AppLayout';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { Sliders, Save, Building2, CreditCard, Percent, Check } from 'lucide-react';

export default function SettingsPage() {
  const { hasPermission } = useAuth();
  const [settingsMap, setSettingsMap] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setLoading(true);
      const res = await api.getSettings();
      if (res && res.success && res.data) {
        if (res.data.map && typeof res.data.map === 'object' && !Array.isArray(res.data.map)) {
          setSettingsMap(res.data.map);
        } else if (Array.isArray(res.data)) {
          const map: Record<string, string> = {};
          res.data.forEach((s: any) => {
            if (s && s.key) map[s.key] = s.value || '';
          });
          setSettingsMap(map);
        } else if (Array.isArray(res.data.list)) {
          const map: Record<string, string> = {};
          res.data.list.forEach((s: any) => {
            if (s && s.key) map[s.key] = s.value || '';
          });
          setSettingsMap(map);
        } else if (typeof res.data === 'object' && !Array.isArray(res.data)) {
          setSettingsMap(res.data);
        }
      }
    } catch (err) {
      console.error('Failed to load settings:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (key: string, value: string) => {
    setSettingsMap((prev) => ({ ...(prev || {}), [key]: value }));
    setSaveSuccess(false);
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSaveSuccess(false);

    const payload = Object.entries(settingsMap || {}).map(([key, value]) => ({ key, value }));

    try {
      const res = await api.updateSettings(payload);
      if (res.success) {
        setSaveSuccess(true);
      }
    } catch (err: any) {
      alert(err.message || 'Failed to update system settings');
    } finally {
      setSaving(false);
    }
  };

  return (
    <AppLayout>
      <div className="space-y-6 max-w-4xl">
        {/* Module Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20">
              <Sliders className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-black text-white">
                System & Company Settings
              </h1>
              <p className="text-xs text-slate-400 mt-0.5">
                Configure corporate metadata, PDF headers, banking remittance details, and GST tax parameters.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {saveSuccess && (
              <span className="text-xs text-emerald-400 font-bold flex items-center gap-1.5 animate-pulse">
                <Check className="w-4 h-4" /> System settings updated!
              </span>
            )}
            {hasPermission('SETTING', 'edit') && (
              <button
                type="submit"
                form="settings-form"
                disabled={saving}
                className="inline-flex items-center gap-2 px-5 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-lg shadow-blue-600/20 transition-all disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                <span>{saving ? 'Saving...' : 'Save Configuration'}</span>
              </button>
            )}
          </div>
        </div>

        <form id="settings-form" onSubmit={handleSaveSettings} className="space-y-6">
          {/* Corporate Profile Card */}
          <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-slate-800">
              <Building2 className="w-5 h-5 text-blue-400" />
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                Corporate Entity Details
              </h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Company Legal Name</label>
                <input
                  type="text"
                  value={settingsMap['COMPANY_NAME'] || ''}
                  onChange={(e) => handleChange('COMPANY_NAME', e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-xs text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Company GSTIN Number</label>
                <input
                  type="text"
                  value={settingsMap['COMPANY_GSTIN'] || ''}
                  onChange={(e) => handleChange('COMPANY_GSTIN', e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-xs text-white font-mono"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-300 mb-1">Corporate Address</label>
                <input
                  type="text"
                  value={settingsMap['COMPANY_ADDRESS'] || ''}
                  onChange={(e) => handleChange('COMPANY_ADDRESS', e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-xs text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Official Contact Phone</label>
                <input
                  type="text"
                  value={settingsMap['COMPANY_PHONE'] || ''}
                  onChange={(e) => handleChange('COMPANY_PHONE', e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-xs text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Official Corporate Email</label>
                <input
                  type="email"
                  value={settingsMap['COMPANY_EMAIL'] || ''}
                  onChange={(e) => handleChange('COMPANY_EMAIL', e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-xs text-white"
                />
              </div>
            </div>
          </div>

          {/* Bank Remittance Card */}
          <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-slate-800">
              <CreditCard className="w-5 h-5 text-emerald-400" />
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                Bank Remittance & Settlement Details
              </h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Bank Name</label>
                <input
                  type="text"
                  value={settingsMap['BANK_NAME'] || ''}
                  onChange={(e) => handleChange('BANK_NAME', e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-xs text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Bank Account Number</label>
                <input
                  type="text"
                  value={settingsMap['BANK_ACCOUNT_NO'] || ''}
                  onChange={(e) => handleChange('BANK_ACCOUNT_NO', e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-xs text-white font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">IFSC Code</label>
                <input
                  type="text"
                  value={settingsMap['BANK_IFSC'] || ''}
                  onChange={(e) => handleChange('BANK_IFSC', e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-xs text-white font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Branch Name</label>
                <input
                  type="text"
                  value={settingsMap['BANK_BRANCH'] || ''}
                  onChange={(e) => handleChange('BANK_BRANCH', e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-xs text-white"
                />
              </div>
            </div>
          </div>

          {/* Tax & Invoicing Configuration Card */}
          <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-slate-800">
              <Percent className="w-5 h-5 text-purple-400" />
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                Taxation & Invoice Parameters
              </h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Default GST Rate (%)</label>
                <input
                  type="number"
                  value={settingsMap['DEFAULT_TAX_RATE'] || '18'}
                  onChange={(e) => handleChange('DEFAULT_TAX_RATE', e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-xs text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Default Invoice Mode
                </label>
                <select
                  value={settingsMap['INVOICE_MODE_DEFAULT'] || 'SYSTEM_GENERATED'}
                  onChange={(e) => handleChange('INVOICE_MODE_DEFAULT', e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-xs text-white"
                >
                  <option value="SYSTEM_GENERATED">System Generated (INV-YYYY-YY-00001)</option>
                  <option value="RECORDED_EXTERNAL">Recorded External Invoice</option>
                </select>
              </div>

              <div className="sm:col-span-2 pt-2">
                <label className="flex items-center gap-2 text-xs font-semibold text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settingsMap['ENABLE_GST_FIELDS'] === 'true'}
                    onChange={(e) => handleChange('ENABLE_GST_FIELDS', e.target.checked ? 'true' : 'false')}
                    className="rounded text-blue-600"
                  />
                  <span>Enable Advanced GST Fields (HSN/SAC Codes & Split CGST/SGST/IGST breakdown)</span>
                </label>
              </div>
            </div>
          </div>
        </form>
      </div>
    </AppLayout>
  );
}
