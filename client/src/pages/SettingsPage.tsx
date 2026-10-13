import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../api/client';
import {
  Settings,
  Server,
  Zap,
  ShieldAlert,
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  Save,
  Info,
} from 'lucide-react';

export const SettingsPage: React.FC = () => {
  const queryClient = useQueryClient();

  const [formData, setFormData] = useState({
    woo_active_driver: 'mock',
    woo_store_url: '',
    woo_consumer_key: '',
    woo_consumer_secret: '',
    mock_woo_simulate_failure: false,
  });

  const [connectionTestResult, setConnectionTestResult] = useState<any>(null);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string | null>(null);

  const { data: settingsData, isLoading } = useQuery({
    queryKey: ['settings'],
    queryFn: () => api.getSettings(),
  });

  useEffect(() => {
    if (settingsData?.data) {
      setFormData({
        woo_active_driver: settingsData.data.woo_active_driver || 'mock',
        woo_store_url: settingsData.data.woo_store_url || '',
        woo_consumer_key: settingsData.data.woo_consumer_key || '',
        woo_consumer_secret: settingsData.data.woo_consumer_secret || '',
        mock_woo_simulate_failure: settingsData.data.mock_woo_simulate_failure || false,
      });
    }
  }, [settingsData]);

  const saveMutation = useMutation({
    mutationFn: (data: typeof formData) => api.updateSettings(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
      setSaveSuccessMsg('Settings updated successfully.');
      setTimeout(() => setSaveSuccessMsg(null), 3000);
    },
  });

  const testConnectionMutation = useMutation({
    mutationFn: () => api.testConnection(),
    onSuccess: (res) => {
      setConnectionTestResult(res.data);
    },
    onError: (err: any) => {
      setConnectionTestResult({
        success: false,
        message: err.message,
      });
    },
  });

  const resetStoreMutation = useMutation({
    mutationFn: () => api.resetMockStore(),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
      queryClient.invalidateQueries({ queryKey: ['mock-store-products'] });
      queryClient.invalidateQueries({ queryKey: ['sync-logs'] });
      alert(res.message);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    saveMutation.mutate(formData);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-white tracking-tight">WooCommerce Integration Settings</h1>
        <p className="text-xs text-slate-400 mt-0.5">
          Configure API credentials, toggle between Mock Sandbox mode and Live Store mode, and test connection diagnostics.
        </p>
      </div>

      {saveSuccessMsg && (
        <div className="p-3.5 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          {saveSuccessMsg}
        </div>
      )}

      {/* Main Settings Form */}
      <form onSubmit={handleSubmit} className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-6 shadow-xl">
        {/* Driver Selection */}
        <div>
          <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
            Active Integration Driver
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <button
              type="button"
              onClick={() => setFormData({ ...formData, woo_active_driver: 'mock' })}
              className={`p-4 rounded-xl text-left border transition-all ${
                formData.woo_active_driver === 'mock'
                  ? 'bg-indigo-600/15 border-indigo-500 text-white shadow-lg shadow-indigo-500/10 ring-1 ring-indigo-500'
                  : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-semibold text-sm">Mock WooCommerce Sandbox</span>
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  Recommended for Hackathon
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-1">
                Zero external dependencies. Realistic WooCommerce API v3 payloads and response formats persisted locally in SQLite.
              </p>
            </button>

            <button
              type="button"
              onClick={() => setFormData({ ...formData, woo_active_driver: 'live' })}
              className={`p-4 rounded-xl text-left border transition-all ${
                formData.woo_active_driver === 'live'
                  ? 'bg-indigo-600/15 border-indigo-500 text-white shadow-lg shadow-indigo-500/10 ring-1 ring-indigo-500'
                  : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-semibold text-sm">Live WooCommerce Store (REST API)</span>
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
                  Production
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-1">
                Direct Guzzle HTTP communication with WordPress /wp-json/wc/v3 endpoints using Consumer Key & Secret.
              </p>
            </button>
          </div>
        </div>

        {/* Live Credentials Inputs (Active only if Live is selected) */}
        {formData.woo_active_driver === 'live' && (
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-4">
            <h3 className="text-xs font-semibold text-indigo-400 uppercase tracking-wider flex items-center gap-1.5">
              <Server className="w-4 h-4" /> Live Credentials (OAuth / Basic Auth)
            </h3>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">WooCommerce Store URL</label>
                <input
                  type="url"
                  placeholder="https://your-wordpress-store.com"
                  value={formData.woo_store_url}
                  onChange={(e) => setFormData({ ...formData, woo_store_url: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Consumer Key (ck_...)</label>
                <input
                  type="text"
                  placeholder="ck_xxxxxxxxxxxxxxxxxxxxxxxx"
                  value={formData.woo_consumer_key}
                  onChange={(e) => setFormData({ ...formData, woo_consumer_key: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Consumer Secret (cs_...)</label>
                <input
                  type="password"
                  placeholder="cs_xxxxxxxxxxxxxxxxxxxxxxxx"
                  value={formData.woo_consumer_secret}
                  onChange={(e) => setFormData({ ...formData, woo_consumer_secret: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 font-mono"
                />
              </div>
            </div>
          </div>
        )}

        {/* Hackathon Diagnostic Simulator Toggle */}
        <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0 mt-0.5">
              <ShieldAlert className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-xs font-semibold text-white">Simulate WooCommerce Network Failure / Error 500</h4>
              <p className="text-[11px] text-slate-400">
                Turn this on to demonstrate how PIM Hub intercepts API timeouts and failures, marks products as "Sync Error", and stores troubleshooting diagnostics in the audit log.
              </p>
            </div>
          </div>

          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={formData.mock_woo_simulate_failure}
              onChange={(e) =>
                setFormData({ ...formData, mock_woo_simulate_failure: e.target.checked })
              }
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-rose-600"></div>
          </label>
        </div>

        {/* Actions Bar */}
        <div className="flex items-center justify-between pt-2">
          <button
            type="button"
            onClick={() => testConnectionMutation.mutate()}
            disabled={testConnectionMutation.isPending}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 active:scale-95 transition-all disabled:opacity-50"
          >
            {testConnectionMutation.isPending ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Zap className="w-3.5 h-3.5 text-indigo-400" />
            )}
            Test Active Connection
          </button>

          <button
            type="submit"
            disabled={saveMutation.isPending}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-500/20 active:scale-95 transition-all disabled:opacity-50"
          >
            {saveMutation.isPending ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Save className="w-3.5 h-3.5" />
            )}
            Save Configuration
          </button>
        </div>
      </form>

      {/* Connection Test Diagnostics Output */}
      {connectionTestResult && (
        <div
          className={`p-4 rounded-2xl border ${
            connectionTestResult.success
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
              : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
          }`}
        >
          <div className="flex items-start gap-3 text-xs">
            {connectionTestResult.success ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            ) : (
              <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0" />
            )}
            <div className="space-y-1">
              <p className="font-semibold">{connectionTestResult.message}</p>
              {connectionTestResult.store_name && (
                <p className="text-[11px] opacity-80">
                  Store: {connectionTestResult.store_name} • API Target: {connectionTestResult.url} • WooCommerce v{connectionTestResult.wc_version || '3.x'}
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Danger Zone: Reset Mock Store */}
      <div className="p-5 rounded-2xl bg-rose-500/5 border border-rose-500/20 flex items-center justify-between">
        <div>
          <h4 className="text-xs font-semibold text-rose-300 uppercase tracking-wider">Reset Sandbox Environment</h4>
          <p className="text-[11px] text-slate-400 mt-0.5">
            Wipes all mock WooCommerce products and resets all PIM products to "Draft (Not Synced)" for a fresh demo run.
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            if (confirm('Are you sure you want to reset the mock store and all sync statuses?')) {
              resetStoreMutation.mutate();
            }
          }}
          disabled={resetStoreMutation.isPending}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 border border-rose-500/30 active:scale-95 transition-all disabled:opacity-50"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          Reset Sandbox
        </button>
      </div>
    </div>
  );
};
