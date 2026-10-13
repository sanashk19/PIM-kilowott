import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../api/client';
import {
  RotateCcw,
  CheckCircle2,
  Store,
  Sliders,
  ShieldCheck,
  Check,
} from 'lucide-react';
import { TopBar } from '../components/TopBar';
import type { SourceOfTruthPolicies } from '../types';

export const SettingsPage: React.FC = () => {
  const queryClient = useQueryClient();

  const [formData, setFormData] = useState({
    woo_active_driver: 'mock',
    woo_store_url: '',
    woo_consumer_key: '',
    woo_consumer_secret: '',
    mock_woo_simulate_failure: false,
  });

  const [policies, setPolicies] = useState<SourceOfTruthPolicies>({
    name: 'PIM',
    sku: 'PIM',
    regular_price: 'PIM',
    sale_price: 'PIM',
    stock_quantity: 'WOOCOMMERCE',
    description: 'PIM',
    short_description: 'PIM',
    categories: 'PIM',
    attributes: 'PIM',
    image_url: 'PIM',
    brand: 'PIM',
  });

  const [connectionTestResult, setConnectionTestResult] = useState<any>(null);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string | null>(null);

  const { data: settingsData } = useQuery({
    queryKey: ['settings'],
    queryFn: () => api.getSettings(),
  });

  const { data: policiesData } = useQuery({
    queryKey: ['policies'],
    queryFn: () => api.getPolicies(),
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

  useEffect(() => {
    if (policiesData?.data) {
      setPolicies(policiesData.data);
    }
  }, [policiesData]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      await api.updateSettings(formData);
      await api.updatePolicies(policies);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings'] });
      queryClient.invalidateQueries({ queryKey: ['policies'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
      setSaveSuccessMsg('Platform configuration and Source-of-Truth policies updated successfully.');
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
    saveMutation.mutate();
  };

  const handlePolicyChange = (field: keyof SourceOfTruthPolicies, owner: 'PIM' | 'WOOCOMMERCE') => {
    setPolicies(prev => ({ ...prev, [field]: owner }));
  };

  return (
    <div className="flex-1 bg-white min-h-screen flex flex-col">
      <TopBar breadcrumbs={['Integrations', 'Settings & Policies']} />

      <div className="p-6 max-w-4xl w-full mx-auto space-y-6">
        {/* Header */}
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-[#111916] tracking-tight">Platform Configuration</h1>
            <span className="px-2 py-0.5 rounded text-[11px] font-bold uppercase tracking-wider bg-[#f4f2ec] text-[#5c6660] border border-[#e6e4df]">
              VERIDEX Rules
            </span>
          </div>
          <p className="text-xs text-[#5c6660] mt-0.5">
            Configure WooCommerce sync adapters, field ownership policies, and reconciliation rules.
          </p>
        </div>

        {saveSuccessMsg && (
          <div className="p-3 bg-[#f0fdf4] border border-[#bbf7d0] text-[#15803d] text-xs rounded-md shadow-2xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4" />
            <span>{saveSuccessMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* SOURCE-OF-TRUTH POLICIES CARD */}
          <div className="bg-white border border-[#e6e4df] rounded-lg p-5 shadow-2xs space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-[#f4f2ec]">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-[#15803d]" />
                <h2 className="text-xs font-bold text-[#111916] uppercase tracking-wider">
                  Source-of-Truth Field Policies
                </h2>
              </div>
              <span className="text-[11px] text-[#7d8b82]">
                Sync Inspector uses these to recommend conflict resolutions
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              {[
                { key: 'regular_price', label: 'Retail Price', desc: 'Base currency pricing' },
                { key: 'stock_quantity', label: 'Inventory Stock', desc: 'Warehouse unit counts' },
                { key: 'name', label: 'Product Title', desc: 'Storefront item name' },
                { key: 'description', label: 'Description', desc: 'Rich HTML copywriting' },
                { key: 'categories', label: 'Categories', desc: 'Store taxonomy hierarchy' },
                { key: 'attributes', label: 'Attributes', desc: 'Technical specifications' },
              ].map(({ key, label, desc }) => (
                <div
                  key={key}
                  className="p-3 rounded-lg border border-[#e6e4df] bg-[#fbfaf8] flex items-center justify-between gap-3"
                >
                  <div>
                    <div className="font-bold text-[#111916]">{label}</div>
                    <div className="text-[10.5px] text-[#7d8b82]">{desc}</div>
                  </div>

                  <div className="flex items-center rounded-md border border-[#e6e4df] bg-white p-0.5 shrink-0 shadow-2xs">
                    <button
                      type="button"
                      onClick={() => handlePolicyChange(key as any, 'PIM')}
                      className={`px-2.5 py-1 rounded text-[11px] font-semibold transition-colors ${
                        policies[key] === 'PIM'
                          ? 'bg-[#15803d] text-white shadow-xs'
                          : 'text-[#5c6660] hover:text-[#111916]'
                      }`}
                    >
                      PIM
                    </button>
                    <button
                      type="button"
                      onClick={() => handlePolicyChange(key as any, 'WOOCOMMERCE')}
                      className={`px-2.5 py-1 rounded text-[11px] font-semibold transition-colors ${
                        policies[key] === 'WOOCOMMERCE'
                          ? 'bg-[#1d4ed8] text-white shadow-xs'
                          : 'text-[#5c6660] hover:text-[#111916]'
                      }`}
                    >
                      Woo
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* WooCommerce Connection Card */}
          <div className="bg-white border border-[#e6e4df] rounded-lg p-5 shadow-2xs space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-[#f4f2ec]">
              <Store className="w-4 h-4 text-[#15803d]" />
              <h2 className="text-xs font-bold text-[#111916] uppercase tracking-wider">
                WooCommerce Adapter
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
                profiles, baseline snapshots, and realistic attributes.
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
