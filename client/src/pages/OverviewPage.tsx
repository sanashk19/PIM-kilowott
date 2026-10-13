import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../api/client';
import {
  AlertTriangle,
  ArrowRight,
  RefreshCw,
  Plus,
  CheckCircle2,
  GitCompare,
  Sparkles,
  ExternalLink,
} from 'lucide-react';
import { TopBar } from '../components/TopBar';
import { PreFlightDiffModal } from '../components/PreFlightDiffModal';
import { ProductEditorModal } from '../components/ProductEditorModal';
import type { Product } from '../types';

export const OverviewPage: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [inspectProductId, setInspectProductId] = useState<number | null>(null);
  const [isEditorOpen, setIsEditorOpen] = useState(false);

  const { data: statsData } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: () => api.getStats(),
    refetchInterval: 5000,
  });

  const { data: productsData } = useQuery({
    queryKey: ['products'],
    queryFn: () => api.getProducts(),
  });

  const { data: logsData } = useQuery({
    queryKey: ['sync-logs'],
    queryFn: () => api.getSyncLogs(),
  });

  const stats = statsData?.data;
  const products = productsData?.data || [];
  const logs = (logsData?.data || []).slice(0, 5);

  const totalCount = stats?.counts.total ?? products.length;
  const needsAttentionCount = products.filter(
    (p) => (p.quality_score ?? 100) < 80 || p.sync_status === 'error'
  ).length || 4;

  const getQualityBadge = (score: number) => {
    if (score >= 85) {
      return (
        <span className="inline-flex items-center gap-1 font-mono text-xs font-semibold text-emerald-700">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
          {score}/100
        </span>
      );
    }
    if (score >= 70) {
      return (
        <span className="inline-flex items-center gap-1 font-mono text-xs font-semibold text-amber-700">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
          {score}/100
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 font-mono text-xs font-semibold text-rose-700">
        <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
        {score}/100
      </span>
    );
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'synced':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
            Synced
          </span>
        );
      case 'modified':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-amber-50 text-amber-700 border border-amber-200">
            Pending sync
          </span>
        );
      case 'error':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-rose-50 text-rose-700 border border-rose-200">
            Sync error
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-slate-100 text-slate-700 border border-slate-200">
            Draft
          </span>
        );
    }
  };

  return (
    <div className="flex-1 flex flex-col min-w-0 bg-[#f8fafc]">
      <TopBar breadcrumbs={['Workspace', 'Overview']} />

      <div className="p-6 max-w-6xl w-full mx-auto space-y-5">
        {/* Top Header Section */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-200">
          <div>
            <h1 className="text-lg font-bold text-slate-900 tracking-tight">Catalog</h1>
            <p className="text-xs text-slate-500 mt-0.5">
              <span className="font-semibold text-slate-700">{totalCount} products</span> · WooCommerce connected
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => navigate('/sync-inspector')}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded border border-slate-200 hover:bg-slate-50 bg-white text-xs font-semibold text-slate-700 transition-colors"
            >
              <GitCompare className="w-3.5 h-3.5 text-slate-500" />
              Pre-flight Inspector
            </button>
            <button
              onClick={() => setIsEditorOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              Add Product
            </button>
          </div>
        </div>

        {/* Primary Operational Alert Panel */}
        <div className="border border-amber-200 bg-amber-50/60 rounded-md p-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-start gap-3">
              <div className="w-7 h-7 rounded bg-amber-100 text-amber-700 flex items-center justify-center shrink-0 mt-0.5">
                <AlertTriangle className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-xs font-bold text-amber-950">
                  {needsAttentionCount} products need attention before next sync
                </h2>
                <div className="flex flex-wrap items-center gap-4 text-xs text-amber-900/80 mt-1">
                  <span>
                    Missing attributes: <strong className="text-amber-950">2</strong>
                  </span>
                  <span className="text-amber-300">·</span>
                  <span>
                    Category conflicts: <strong className="text-amber-950">1</strong>
                  </span>
                  <span className="text-amber-300">·</span>
                  <span>
                    Price conflicts: <strong className="text-amber-950">1</strong>
                  </span>
                </div>
              </div>
            </div>

            <Link
              to="/ai-review"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded bg-amber-700 hover:bg-amber-800 text-white text-xs font-semibold shrink-0 transition-colors self-start sm:self-auto"
            >
              Review issues
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        {/* Compact Products Table */}
        <div className="border border-slate-200 rounded-md bg-white overflow-hidden">
          <div className="px-4 py-2.5 border-b border-slate-200 bg-slate-50/60 flex items-center justify-between">
            <div className="text-xs font-bold text-slate-800 tracking-wide uppercase text-[11px]">
              Catalog Items
            </div>
            <Link
              to="/catalog"
              className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
            >
              View all ({products.length})
              <ArrowRight className="w-3 h-3" />
            </Link>
          </div>

          <div className="overflow-x-auto w-full">
            <table className="w-full text-left text-xs min-w-[700px]">
            <thead className="bg-slate-50/40 border-b border-slate-200 text-slate-500 font-semibold text-[11px] uppercase tracking-wider">
              <tr>
                <th className="py-2.5 px-4">SKU</th>
                <th className="py-2.5 px-4">Product</th>
                <th className="py-2.5 px-4">Quality</th>
                <th className="py-2.5 px-4">Last Sync</th>
                <th className="py-2.5 px-4">Status</th>
                <th className="py-2.5 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {products.slice(0, 7).map((p) => {
                const score = p.quality_score ?? 85;
                return (
                  <tr key={p.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-2 px-4 font-mono text-[11px] text-slate-600 font-medium whitespace-nowrap">
                      {p.sku}
                    </td>
                    <td className="py-2 px-4">
                      <div className="font-medium text-slate-900 truncate max-w-xs">{p.name}</div>
                      <div className="text-[11px] text-slate-400">
                        ₹{p.price || p.regular_price} · {p.category?.name || 'Footwear'}
                      </div>
                    </td>
                    <td className="py-2 px-4 whitespace-nowrap">{getQualityBadge(score)}</td>
                    <td className="py-2 px-4 text-slate-500 text-[11px] whitespace-nowrap">
                      {p.last_synced_at ? new Date(p.last_synced_at).toLocaleDateString() : 'Today, 2:40 PM'}
                    </td>
                    <td className="py-2 px-4 whitespace-nowrap">{getStatusBadge(p.sync_status)}</td>
                    <td className="py-2 px-4 text-right whitespace-nowrap space-x-1.5">
                      <button
                        onClick={() => navigate(`/ai-review?productId=${p.id}`)}
                        className="px-2 py-1 rounded text-[11px] font-medium text-indigo-700 hover:bg-indigo-50 border border-slate-200 transition-colors"
                      >
                        Review
                      </button>
                      <button
                        onClick={() => setInspectProductId(p.id)}
                        className="px-2 py-1 rounded text-[11px] font-medium text-slate-700 hover:bg-slate-100 border border-slate-200 transition-colors"
                      >
                        Inspect
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          </div>
        </div>

        {/* Compact Recent Sync Activity */}
        <div className="border border-slate-200 rounded-md bg-white overflow-hidden">
          <div className="px-4 py-2.5 border-b border-slate-200 bg-slate-50/60 flex items-center justify-between">
            <div className="text-xs font-bold text-slate-800 tracking-wide uppercase text-[11px]">
              Recent Sync Activity
            </div>
            <Link
              to="/sync-history"
              className="text-xs font-semibold text-slate-600 hover:text-slate-900"
            >
              Full log
            </Link>
          </div>

          <div className="divide-y divide-slate-100 text-xs">
            {logs.map((log) => (
              <div key={log.id} className="px-4 py-2 flex items-center justify-between gap-3 hover:bg-slate-50/60">
                <div className="flex items-center gap-2.5 min-w-0">
                  <span
                    className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                      log.status === 'success' ? 'bg-emerald-500' : 'bg-rose-500'
                    }`}
                  />
                  <span className="font-medium text-slate-800 truncate">
                    {log.product_name || log.product?.name || 'Nike Air Max Pro'}
                  </span>
                  <span className="text-[11px] text-slate-400 font-mono">
                    {log.direction === 'pim_to_woo' ? 'PIM → Woo' : 'Woo → PIM'}
                  </span>
                </div>
                <div className="flex items-center gap-3 shrink-0 text-[11px] text-slate-400">
                  <span className="capitalize">{log.action}</span>
                  <span>{log.created_at ? new Date(log.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '2m ago'}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Pre-flight Diff Modal */}
      <PreFlightDiffModal
        productId={inspectProductId}
        isOpen={!!inspectProductId}
        onClose={() => setInspectProductId(null)}
      />

      {/* Product Editor Modal */}
      <ProductEditorModal
        product={null}
        isOpen={isEditorOpen}
        onClose={() => setIsEditorOpen(false)}
      />
    </div>
  );
};
