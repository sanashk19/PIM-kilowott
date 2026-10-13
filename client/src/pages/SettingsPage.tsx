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
  Save,
  Shield,
  Store,
} from 'lucide-react';
import { TopBar } from '../components/TopBar';

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
      setConnectionTestResult(res);
    },
    onError: (err: any) => {
      setConnectionTestResult({
        connected: false,
        message: err.message || 'Connection test failed',
      });
    },
  });

  const resetMutation = useMutation({
    mutationFn: () => api.resetMockStore(),
    onSuccess: () => {
      queryClient.invalidateQueries();
      setSaveSuccessMsg('Catalog restored to default enterprise demo state.');
      setTimeout(() => setSaveSuccessMsg(null), 3000);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    saveMutation.mutate(formData);
  };

  return (
    <div className="flex-1 bg-[#fbfaf8] min-h-screen flex flex-col">
      <TopBar breadcrumbs={['Integrations', 'Settings']} />

      <div className="p-6 max-w-4xl w-full mx-auto space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-xl font-bold text-[#111916] tracking-tight">Platform Settings</h1>
          <p className="text-xs text-[#5c6660] mt-0.5">
            Configure WooCommerce sync adapters, authentication credentials, and database sandbox.
          </p>
        </div>

        {saveSuccessMsg && (
          <div className="p-3 bg-[#f0fdf4] border border-[#bbf7d0] text-[#15803d] text-xs rounded-md shadow-2xs">
            {saveSuccessMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* WooCommerce Connection Card */}
          <div className="bg-white border border-[#e6e4df] rounded-lg p-5 shadow-2xs space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-[#f4f2ec]">
              <Store className="w-4 h-4 text-[#15803d]" />
              <h2 className="text-xs font-bold text-[#111916] uppercase tracking-wider">
                WooCommerce Integration
              </h2>
            </div>

            <div className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-[#111916] mb-1.5">Active Driver</label>
                <div className="grid grid-cols-2 gap-3">
                  <label
                    className={`flex items-start gap-2.5 p-3 rounded-md border cursor-pointer ${
                      formData.woo_active_driver === 'mock'
                        ? 'bg-[#f0fdf4] border-[#15803d]'
                        : 'border-[#e6e4df] hover:bg-[#fbfaf8]'
                    }`}
                  >
                    <input
                      type="radio"
                      name="driver"
                      value="mock"
                      checked={formData.woo_active_driver === 'mock'}
                      onChange={() =>
                        setFormData((prev) => ({ ...prev, woo_active_driver: 'mock' }))
                      }
                      className="mt-0.5 text-[#15803d]"
                    />
                    <div>
                      <div className="font-semibold text-[#111916]">Internal Mock Store</div>
                      <div className="text-[11px] text-[#5c6660]">
                        Safe sandbox simulation with zero external API dependencies.
                      </div>
                    </div>
                  </label>

                  <label
                    className={`flex items-start gap-2.5 p-3 rounded-md border cursor-pointer ${
                      formData.woo_active_driver === 'real'
                        ? 'bg-[#f0fdf4] border-[#15803d]'
                        : 'border-[#e6e4df] hover:bg-[#fbfaf8]'
                    }`}
                  >
                    <input
                      type="radio"
                      name="driver"
                      value="real"
                      checked={formData.woo_active_driver === 'real'}
                      onChange={() =>
                        setFormData((prev) => ({ ...prev, woo_active_driver: 'real' }))
                      }
                      className="mt-0.5 text-[#15803d]"
                    />
                    <div>
                      <div className="font-semibold text-[#111916]">Live REST API</div>
                      <div className="text-[11px] text-[#5c6660]">
                        Connect directly to a live WooCommerce v3 installation.
                      </div>
                    </div>
                  </label>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-[#111916] mb-1">Store URL</label>
                <input
                  type="url"
                  value={formData.woo_store_url}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, woo_store_url: e.target.value }))
                  }
                  placeholder="https://your-store.com"
                  className="w-full px-3 py-1.5 border border-[#e6e4df] rounded-md text-xs focus:ring-1 focus:ring-[#15803d]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-[#111916] mb-1">Consumer Key</label>
                  <input
                    type="text"
                    value={formData.woo_consumer_key}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, woo_consumer_key: e.target.value }))
                    }
                    placeholder="ck_..."
                    className="w-full px-3 py-1.5 border border-[#e6e4df] rounded-md text-xs font-mono focus:ring-1 focus:ring-[#15803d]"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-[#111916] mb-1">Consumer Secret</label>
                  <input
                    type="password"
                    value={formData.woo_consumer_secret}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, woo_consumer_secret: e.target.value }))
                    }
                    placeholder="cs_..."
                    className="w-full px-3 py-1.5 border border-[#e6e4df] rounded-md text-xs font-mono focus:ring-1 focus:ring-[#15803d]"
                  />
                </div>
              </div>

              <div className="pt-2 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => testConnectionMutation.mutate()}
                  disabled={testConnectionMutation.isPending}
                  className="px-3 py-1.5 bg-white hover:bg-[#f4f2ec] border border-[#e6e4df] rounded-md text-xs font-semibold text-[#19201d] shadow-2xs"
                >
                  {testConnectionMutation.isPending ? 'Testing...' : 'Test Connection'}
                </button>

                {connectionTestResult && (
                  <span
                    className={`text-xs font-semibold ${
                      connectionTestResult.connected ? 'text-[#15803d]' : 'text-[#dc2626]'
                    }`}
                  >
                    {connectionTestResult.message}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Reset Sandbox Card */}
          <div className="bg-white border border-[#e6e4df] rounded-lg p-5 shadow-2xs space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-[#f4f2ec]">
              <RotateCcw className="w-4 h-4 text-[#b45309]" />
              <h2 className="text-xs font-bold text-[#111916] uppercase tracking-wider">
                Reset Demo Sandbox
              </h2>
            </div>

            <div className="flex items-center justify-between text-xs">
              <p className="text-[#5c6660] max-w-lg leading-relaxed">
                Restore the catalog to the canonical 10-product demo state with controlled conflict
                profiles and mock storefront data.
              </p>

              <button
                type="button"
                onClick={() => {
                  if (confirm('Reset entire catalog to default demo state?')) {
                    resetMutation.mutate();
                  }
                }}
                disabled={resetMutation.isPending}
                className="px-3 py-1.5 border border-[#e6e4df] bg-white hover:bg-[#fef2f2] text-[#dc2626] font-semibold rounded-md shadow-2xs shrink-0"
              >
                Reset Catalog
              </button>
            </div>
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={saveMutation.isPending}
              className="px-5 py-2 bg-[#15803d] hover:bg-[#166534] text-white rounded-md text-xs font-semibold shadow-2xs transition-colors"
            >
              Save Configuration
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
