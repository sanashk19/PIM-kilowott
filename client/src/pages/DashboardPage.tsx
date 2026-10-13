import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../api/client';
import {
  Package,
  CheckCircle2,
  RefreshCw,
  AlertTriangle,
  Store,
  Plus,
  ArrowRight,
  ShieldCheck,
  Send,
  Download,
  Activity,
  Layers,
  Sparkles,
  ExternalLink,
} from 'lucide-react';
import { StatusBadge } from '../components/StatusBadge';
import { PreFlightDiffModal } from '../components/PreFlightDiffModal';
import { ProductEditorModal } from '../components/ProductEditorModal';
import { Link } from 'react-router-dom';

export const DashboardPage: React.FC = () => {
  const queryClient = useQueryClient();

  const [selectedProductId, setSelectedProductId] = useState<number | null>(null);
  const [isDiffModalOpen, setIsDiffModalOpen] = useState(false);
  const [isEditorModalOpen, setIsEditorModalOpen] = useState(false);

  const { data: statsData, isLoading } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: () => api.getStats(),
    refetchInterval: 5000,
  });

  const importAllMutation = useMutation({
    mutationFn: () => api.importAll(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
    },
  });

  const stats = statsData?.data;

  const handleInspectDiff = (id: number) => {
    setSelectedProductId(id);
    setIsDiffModalOpen(true);
  };

  return (
    <div className="space-y-8">
      {/* Hero / Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 rounded-2xl bg-gradient-to-r from-indigo-950/40 via-slate-900 to-slate-950 border border-slate-800 shadow-xl">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-white tracking-tight">PIM Hub Command Center</h1>
            <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
              Kilowatt Edition
            </span>
          </div>
          <p className="text-sm text-slate-400 mt-1">
            Centralized product master data management and automated WooCommerce bi-directional synchronization.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={() => setIsEditorModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-500/25 active:scale-95 transition-all"
          >
            <Plus className="w-4 h-4" />
            New Product
          </button>

          <button
            onClick={() => importAllMutation.mutate()}
            disabled={importAllMutation.isPending}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 active:scale-95 transition-all disabled:opacity-50"
          >
            <Download className="w-4 h-4 text-cyan-400" />
            {importAllMutation.isPending ? 'Importing Store...' : 'Import from WooCommerce'}
          </button>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Total Products */}
        <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-slate-700 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Total Products</span>
            <div className="w-8 h-8 rounded-lg bg-indigo-500/10 flex items-center justify-center text-indigo-400">
              <Package className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-bold text-white">{stats?.counts.total ?? '—'}</span>
            <p className="text-[11px] text-slate-500 mt-0.5">Master catalog items</p>
          </div>
        </div>

        {/* Synced with Woo */}
        <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-emerald-500/30 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Synced to Woo</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-400">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold text-emerald-400">{stats?.counts.synced ?? '—'}</span>
              <span className="text-xs font-medium text-emerald-500/80">({stats?.sync_health_percentage ?? 0}%)</span>
            </div>
            <p className="text-[11px] text-slate-500 mt-0.5">Active in WooCommerce</p>
          </div>
        </div>

        {/* Modified / Pending Sync */}
        <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-amber-500/30 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Modified (Pending)</span>
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center text-amber-400">
              <RefreshCw className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-bold text-amber-300">{stats?.counts.modified ?? '—'}</span>
            <p className="text-[11px] text-slate-500 mt-0.5">Changed in PIM</p>
          </div>
        </div>

        {/* Sync Errors */}
        <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-rose-500/30 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Sync Errors</span>
            <div className="w-8 h-8 rounded-lg bg-rose-500/10 flex items-center justify-center text-rose-400">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-bold text-rose-400">{stats?.counts.error ?? '—'}</span>
            <p className="text-[11px] text-slate-500 mt-0.5">Requires resolution</p>
          </div>
        </div>

        {/* Mock Store Live Items */}
        <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-cyan-500/30 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Remote Storefront</span>
            <div className="w-8 h-8 rounded-lg bg-cyan-500/10 flex items-center justify-center text-cyan-400">
              <Store className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-bold text-cyan-400">{stats?.counts.mock_store ?? '—'}</span>
            <p className="text-[11px] text-slate-500 mt-0.5">Items in WooCommerce</p>
          </div>
        </div>
      </div>

      {/* Sync Health & Pre-flight Callout */}
      <div className="p-5 rounded-2xl bg-slate-900/60 border border-indigo-500/20 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 shrink-0">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-white">Pre-Flight Synchronization Assurance</h3>
            <p className="text-xs text-slate-400">
              Every product change undergoes automated schema validation, missing field detection, and side-by-side visual diff before reaching WooCommerce.
            </p>
          </div>
        </div>
        <Link
          to="/products"
          className="flex items-center gap-1.5 text-xs font-semibold text-indigo-400 hover:text-indigo-300 transition-colors"
        >
          View Catalog Diff Inspector <ArrowRight className="w-4 h-4" />
        </Link>
      </div>

      {/* Two Column Section: Recent Activity & Catalog Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (2 spans): Quick Catalog Overview */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold text-white flex items-center gap-2">
              <Package className="w-4 h-4 text-indigo-400" /> Catalog Overview
            </h2>
            <Link to="/products" className="text-xs text-indigo-400 hover:underline">
              View All Products ({stats?.counts.total})
            </Link>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-900/80 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-slate-950/80 border-b border-slate-800 text-slate-400 uppercase text-[10px] font-semibold tracking-wider">
                    <th className="py-3 px-4">Product</th>
                    <th className="py-3 px-4">SKU</th>
                    <th className="py-3 px-4">Price</th>
                    <th className="py-3 px-4">Stock</th>
                    <th className="py-3 px-4">Sync Status</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {stats?.recent_products?.map((prod) => (
                    <tr key={prod.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          {prod.image_url ? (
                            <img
                              src={prod.image_url}
                              alt=""
                              className="w-8 h-8 rounded-lg object-cover border border-slate-800 shrink-0"
                            />
                          ) : (
                            <div className="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center text-slate-500 shrink-0">
                              <Package className="w-4 h-4" />
                            </div>
                          )}
                          <span className="font-medium text-slate-200 line-clamp-1">{prod.name}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4 font-mono text-slate-400">{prod.sku}</td>
                      <td className="py-3 px-4 font-semibold text-slate-200">
                        ${Number(prod.regular_price || 0).toFixed(2)}
                      </td>
                      <td className="py-3 px-4 text-slate-400">{prod.stock_quantity} units</td>
                      <td className="py-3 px-4">
                        <StatusBadge status={prod.sync_status} size="sm" />
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => handleInspectDiff(prod.id)}
                          className="px-2.5 py-1 rounded-lg text-xs font-medium bg-indigo-500/10 text-indigo-400 hover:bg-indigo-500/20 border border-indigo-500/30 transition-colors"
                        >
                          Inspect Diff
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right Column (1 span): Recent Sync Audit Feed */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold text-white flex items-center gap-2">
              <Activity className="w-4 h-4 text-cyan-400" /> Recent Sync Activity
            </h2>
            <Link to="/sync" className="text-xs text-indigo-400 hover:underline">
              All Logs
            </Link>
          </div>

          <div className="p-4 rounded-2xl border border-slate-800 bg-slate-900/80 space-y-3">
            {stats?.recent_logs && stats.recent_logs.length > 0 ? (
              stats.recent_logs.map((log) => (
                <div
                  key={log.id}
                  className="p-3 rounded-xl bg-slate-950/80 border border-slate-800/80 text-xs space-y-1.5"
                >
                  <div className="flex items-center justify-between">
                    <span
                      className={`font-semibold uppercase text-[10px] px-1.5 py-0.5 rounded ${
                        log.status === 'success'
                          ? 'bg-emerald-500/20 text-emerald-400'
                          : 'bg-rose-500/20 text-rose-400'
                      }`}
                    >
                      {log.status}
                    </span>
                    <span className="text-[10px] text-slate-500">
                      {new Date(log.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>

                  <p className="font-medium text-slate-200">
                    {log.product?.name || (log.entity_type === 'batch' ? 'Batch Operation' : 'Direct Action')}
                  </p>

                  <p className="text-[11px] text-slate-400">
                    Direction: <strong className="text-slate-300">{log.direction === 'pim_to_woo' ? 'PIM → Woo' : 'Woo → PIM'}</strong> • Action: {log.action}
                  </p>

                  {log.error_message && (
                    <p className="text-[11px] text-rose-400 line-clamp-1 mt-1 font-mono">
                      {log.error_message}
                    </p>
                  )}
                </div>
              ))
            ) : (
              <p className="text-xs text-slate-500 text-center py-6">No recent sync events.</p>
            )}
          </div>
        </div>
      </div>

      {/* Modals */}
      <PreFlightDiffModal
        productId={selectedProductId}
        isOpen={isDiffModalOpen}
        onClose={() => {
          setIsDiffModalOpen(false);
          setSelectedProductId(null);
        }}
      />

      <ProductEditorModal
        product={null}
        isOpen={isEditorModalOpen}
        onClose={() => setIsEditorModalOpen(false)}
      />
    </div>
  );
};
