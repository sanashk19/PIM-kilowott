import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../api/client';
import {
  Settings,
  Server,
  Zap,
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  Save,
  Shield,
} from 'lucide-react';
import { HeaderBar } from '../components/HeaderBar';

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
      setConnectionTestResult({
        success: true,
        message: res.data?.message || 'Connection verified successfully.',
      });
    },
    onError: (err: any) => {
      setConnectionTestResult({
        success: false,
        message: err.message || 'Connection test failed.',
      });
    },
  });

  const resetMockStoreMutation = useMutation({
    mutationFn: () => api.resetMockStore(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mock-store-products'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
      alert('Mock store database reset to original 5 baseline products.');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    saveMutation.mutate(formData);
  };

  return (
    <div className="flex-1 flex flex-col min-w-0 bg-[#f8fafc]">
      <HeaderBar />

      <div className="p-6 sm:p-8 space-y-6 max-w-4xl w-full mx-auto">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">System Settings</h1>
          <p className="text-xs text-slate-500 mt-1">
            Configure WooCommerce driver mode, API credentials, and mock environment sandbox flags.
          </p>
        </div>

        {saveSuccessMsg && (
          <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-medium flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{saveSuccessMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Driver Mode Section */}
          <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-xs space-y-4">
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Server className="w-4 h-4 text-violet-600" />
              WooCommerce Integration Driver
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <label
                className={`p-4 rounded-xl border cursor-pointer transition-all flex flex-col justify-between ${
                  formData.woo_active_driver === 'mock'
                    ? 'border-violet-600 bg-violet-50/50 ring-2 ring-violet-500/10'
                    : 'border-slate-200 hover:border-slate-300 bg-slate-50/50'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-slate-900">In-Memory Mock Store</span>
                  <input
                    type="radio"
                    name="driver"
                    value="mock"
                    checked={formData.woo_active_driver === 'mock'}
                    onChange={() => setFormData({ ...formData, woo_active_driver: 'mock' })}
                    className="text-violet-600 focus:ring-violet-500"
                  />
                </div>
                <p className="text-[11px] text-slate-500">
                  Hermetic local simulation. Zero external dependencies. Ideal for testing edge-cases and hackathon grading.
                </p>
              </label>

              <label
                className={`p-4 rounded-xl border cursor-pointer transition-all flex flex-col justify-between ${
                  formData.woo_active_driver === 'live'
                    ? 'border-violet-600 bg-violet-50/50 ring-2 ring-violet-500/10'
                    : 'border-slate-200 hover:border-slate-300 bg-slate-50/50'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-slate-900">Live WordPress / WooCommerce</span>
                  <input
                    type="radio"
                    name="driver"
                    value="live"
                    checked={formData.woo_active_driver === 'live'}
                    onChange={() => setFormData({ ...formData, woo_active_driver: 'live' })}
                    className="text-violet-600 focus:ring-violet-500"
                  />
                </div>
                <p className="text-[11px] text-slate-500">
                  Connects to a real production WordPress instance via official WooCommerce REST API v3 over HTTPS.
                </p>
              </label>
            </div>
          </div>

          {/* Credentials Section */}
          <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-xs space-y-4">
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Shield className="w-4 h-4 text-violet-600" />
              API Credentials
            </h2>

            <div className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Store URL</label>
                <input
                  type="text"
                  placeholder="https://example.com"
                  value={formData.woo_store_url}
                  onChange={(e) => setFormData({ ...formData, woo_store_url: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-violet-500/20"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Consumer Key (ck_...)</label>
                  <input
                    type="text"
                    placeholder="ck_xxxxxxxxxxxxxxxxxxxxxxxx"
                    value={formData.woo_consumer_key}
                    onChange={(e) => setFormData({ ...formData, woo_consumer_key: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-mono focus:outline-none focus:ring-2 focus:ring-violet-500/20"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Consumer Secret (cs_...)</label>
                  <input
                    type="password"
                    placeholder="cs_xxxxxxxxxxxxxxxxxxxxxxxx"
                    value={formData.woo_consumer_secret}
                    onChange={(e) => setFormData({ ...formData, woo_consumer_secret: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-mono focus:outline-none focus:ring-2 focus:ring-violet-500/20"
                  />
                </div>
              </div>

              <div className="pt-2 flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => testConnectionMutation.mutate()}
                  disabled={testConnectionMutation.isPending}
                  className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors flex items-center gap-2"
                >
                  {testConnectionMutation.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Zap className="w-3.5 h-3.5 text-violet-600" />}
                  Test Driver Connection
                </button>

                {connectionTestResult && (
                  <span
                    className={`text-xs font-semibold ${
                      connectionTestResult.success ? 'text-emerald-600' : 'text-rose-600'
                    }`}
                  >
                    {connectionTestResult.message}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Sandbox & Failure Simulation */}
          <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-xs space-y-4">
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <RotateCcw className="w-4 h-4 text-violet-600" />
              Sandbox Chaos Testing
            </h2>

            <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-50 border border-slate-200">
              <div>
                <div className="text-xs font-bold text-slate-800">Simulate WooCommerce Upstream Failure</div>
                <div className="text-[11px] text-slate-500">
                  Injects artificial HTTP 500 error on sync push to verify audit logging and UI error recovery.
                </div>
              </div>
              <input
                type="checkbox"
                checked={formData.mock_woo_simulate_failure}
                onChange={(e) =>
                  setFormData({ ...formData, mock_woo_simulate_failure: e.target.checked })
                }
                className="w-4 h-4 rounded border-slate-300 text-violet-600 focus:ring-violet-500"
              />
            </div>

            <div className="pt-2">
              <button
                type="button"
                onClick={() => resetMockStoreMutation.mutate()}
                disabled={resetMockStoreMutation.isPending}
                className="text-xs font-semibold text-rose-600 hover:text-rose-800 flex items-center gap-1.5"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Reset Mock Store to Baseline Seed
              </button>
            </div>
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={saveMutation.isPending}
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-semibold bg-violet-600 hover:bg-violet-700 text-white shadow-md shadow-violet-500/20 active:scale-95 transition-all"
            >
              {saveMutation.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
              Save Configuration
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
