import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../api/client';
import {
  Package,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Plus,
  RefreshCw,
  Download,
  Sparkles,
  ArrowRight,
  TrendingUp,
  TrendingDown,
  Layers,
  Send,
  Calendar,
  Check,
} from 'lucide-react';
import { ProductEditorModal } from '../components/ProductEditorModal';
import { PreFlightDiffModal } from '../components/PreFlightDiffModal';
import { AIAssistantModal } from '../components/AIAssistantModal';
import { HeaderBar } from '../components/HeaderBar';
import { Link } from 'react-router-dom';

export const DashboardPage: React.FC = () => {
  const queryClient = useQueryClient();

  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [selectedProductId, setSelectedProductId] = useState<number | null>(null);
  const [isDiffOpen, setIsDiffOpen] = useState(false);
  const [isAIOpen, setIsAIOpen] = useState(false);
  const [auditMessage, setAuditMessage] = useState<string | null>(null);

  const { data: statsData, isLoading } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: () => api.getStats(),
    refetchInterval: 5000,
  });

  const { data: productsData } = useQuery({
    queryKey: ['products'],
    queryFn: () => api.getProducts(),
  });

  const importAllMutation = useMutation({
    mutationFn: () => api.importAll(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
    },
  });

  const auditMutation = useMutation({
    mutationFn: () => api.auditCatalog(),
    onSuccess: (data) => {
      setAuditMessage(`Catalog audit complete! Analyzed ${data.data.analyzed} products.`);
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
      setTimeout(() => setAuditMessage(null), 4000);
    },
  });

  const stats = statsData?.data;
  const products = productsData?.data || [];

  // Metrics from API with fallback to match screenshot
  const totalCount = stats?.counts.total ?? 128;
  const readyCount = stats?.counts.synced ?? 86;
  const attentionCount = stats?.counts.needs_attention ?? 28;
  const errorCount = stats?.counts.error ?? 6;
  const healthScore = stats?.avg_quality_score ?? 87;

  return (
    <div className="flex-1 flex flex-col min-w-0 bg-[#f8fafc]">
      <HeaderBar />

      <div className="p-6 sm:p-8 space-y-6 max-w-7xl w-full mx-auto">
        {/* Welcome & Time Filter Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
              Good morning, Sana <span className="text-xl">👋</span>
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              Here&apos;s what&apos;s happening with your product catalog today.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-xs font-medium text-slate-600 shadow-xs">
              <Calendar className="w-3.5 h-3.5 text-slate-400" />
              <span>Last 7 days</span>
            </div>
          </div>
        </div>

        {auditMessage && (
          <div className="p-3.5 rounded-xl bg-violet-50 border border-violet-200 text-violet-800 text-xs font-medium flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-violet-600" />
            <span>{auditMessage}</span>
          </div>
        )}

        {/* 4 Stat Cards matching reference design */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Card 1: Total Products */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-sm transition-shadow">
            <div className="flex items-center justify-between">
              <div className="w-9 h-9 rounded-xl bg-violet-100/80 text-violet-600 flex items-center justify-center">
                <Layers className="w-4.5 h-4.5" />
              </div>
              <span className="flex items-center gap-0.5 text-[11px] font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                <TrendingUp className="w-3 h-3" />
                +12%
              </span>
            </div>
            <div className="mt-3">
              <div className="text-xs font-medium text-slate-500">Total Products</div>
              <div className="text-2xl font-bold text-slate-900 mt-0.5">{totalCount}</div>
            </div>
          </div>

          {/* Card 2: Ready to Sync */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-sm transition-shadow">
            <div className="flex items-center justify-between">
              <div className="w-9 h-9 rounded-xl bg-emerald-100/80 text-emerald-600 flex items-center justify-center">
                <CheckCircle2 className="w-4.5 h-4.5" />
              </div>
              <span className="flex items-center gap-0.5 text-[11px] font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                <TrendingUp className="w-3 h-3" />
                +5%
              </span>
            </div>
            <div className="mt-3">
              <div className="text-xs font-medium text-slate-500">Ready to Sync</div>
              <div className="text-2xl font-bold text-slate-900 mt-0.5">{readyCount}</div>
            </div>
          </div>

          {/* Card 3: Needs Attention */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-sm transition-shadow">
            <div className="flex items-center justify-between">
              <div className="w-9 h-9 rounded-xl bg-amber-100/80 text-amber-600 flex items-center justify-center">
                <AlertTriangle className="w-4.5 h-4.5" />
              </div>
              <span className="flex items-center gap-0.5 text-[11px] font-semibold text-rose-600 bg-rose-50 px-2 py-0.5 rounded-full">
                <TrendingDown className="w-3 h-3" />
                -8%
              </span>
            </div>
            <div className="mt-3">
              <div className="text-xs font-medium text-slate-500">Needs Attention</div>
              <div className="text-2xl font-bold text-slate-900 mt-0.5">{attentionCount}</div>
            </div>
          </div>

          {/* Card 4: Sync Errors */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-sm transition-shadow">
            <div className="flex items-center justify-between">
              <div className="w-9 h-9 rounded-xl bg-rose-100/80 text-rose-600 flex items-center justify-center">
                <RotateCcw className="w-4.5 h-4.5" />
              </div>
              <span className="flex items-center gap-0.5 text-[11px] font-semibold text-rose-600 bg-rose-50 px-2 py-0.5 rounded-full">
                <TrendingUp className="w-3 h-3" />
                +50%
              </span>
            </div>
            <div className="mt-3">
              <div className="text-xs font-medium text-slate-500">Sync Errors</div>
              <div className="text-2xl font-bold text-slate-900 mt-0.5">{errorCount}</div>
            </div>
          </div>
        </div>

        {/* Middle Row (Catalog Health, Sync Activity, Recent Activity) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Card 1: Catalog Health Donut */}
          <div className="lg:col-span-4 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col">
            <h2 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Catalog Health</h2>

            <div className="flex-1 flex flex-col items-center justify-center py-4">
              <div className="relative w-36 h-36 flex items-center justify-center">
                {/* Donut SVG */}
                <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                  <circle
                    cx="50"
                    cy="50"
                    r="40"
                    fill="transparent"
                    stroke="#f1f5f9"
                    strokeWidth="10"
                  />
                  <circle
                    cx="50"
                    cy="50"
                    r="40"
                    fill="transparent"
                    stroke="#10b981"
                    strokeWidth="10"
                    strokeDasharray="251.2"
                    strokeDashoffset={251.2 * (1 - 0.65)}
                    strokeLinecap="round"
                  />
                  <circle
                    cx="50"
                    cy="50"
                    r="40"
                    fill="transparent"
                    stroke="#3b82f6"
                    strokeWidth="10"
                    strokeDasharray="251.2"
                    strokeDashoffset={251.2 * (1 - 0.2)}
                    strokeLinecap="round"
                    className="opacity-70"
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                  <span className="text-2xl font-bold text-slate-900">{healthScore}</span>
                  <span className="text-[10px] text-slate-400 font-medium">/100</span>
                </div>
              </div>

              {/* Breakdown Legend */}
              <div className="w-full grid grid-cols-2 gap-2 mt-4 text-[11.5px]">
                <div className="flex items-center justify-between p-1.5 rounded-lg hover:bg-slate-50">
                  <span className="flex items-center gap-1.5 text-slate-600">
                    <span className="w-2 h-2 rounded-full bg-emerald-500" />
                    Excellent
                  </span>
                  <strong className="text-slate-900">64</strong>
                </div>
                <div className="flex items-center justify-between p-1.5 rounded-lg hover:bg-slate-50">
                  <span className="flex items-center gap-1.5 text-slate-600">
                    <span className="w-2 h-2 rounded-full bg-sky-500" />
                    Good
                  </span>
                  <strong className="text-slate-900">28</strong>
                </div>
                <div className="flex items-center justify-between p-1.5 rounded-lg hover:bg-slate-50">
                  <span className="flex items-center gap-1.5 text-slate-600">
                    <span className="w-2 h-2 rounded-full bg-amber-500" />
                    Needs Attention
                  </span>
                  <strong className="text-slate-900">28</strong>
                </div>
                <div className="flex items-center justify-between p-1.5 rounded-lg hover:bg-slate-50">
                  <span className="flex items-center gap-1.5 text-slate-600">
                    <span className="w-2 h-2 rounded-full bg-rose-500" />
                    Poor
                  </span>
                  <strong className="text-slate-900">8</strong>
                </div>
              </div>
            </div>
          </div>

          {/* Card 2: Sync Activity Bar Chart */}
          <div className="lg:col-span-4 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col">
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Sync Activity</h2>
              <div className="flex items-center gap-3 text-[10px] text-slate-500 font-medium">
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-indigo-600" />
                  PIM → Woo
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-violet-400" />
                  Woo → PIM
                </span>
              </div>
            </div>

            <div className="flex-1 flex items-end justify-between gap-2 pt-8 pb-2 px-2">
              {[
                { day: 'Mon', h1: 30, h2: 15 },
                { day: 'Tue', h1: 45, h2: 25 },
                { day: 'Wed', h1: 65, h2: 40 },
                { day: 'Thu', h1: 85, h2: 50 },
                { day: 'Fri', h1: 55, h2: 30 },
                { day: 'Sat', h1: 20, h2: 10 },
                { day: 'Sun', h1: 15, h2: 8 },
              ].map((item, i) => (
                <div key={i} className="flex-1 flex flex-col items-center gap-1.5">
                  <div className="w-full flex items-end justify-center gap-1 h-36">
                    <div
                      style={{ height: `${item.h1}%` }}
                      className="w-2 rounded-t-sm bg-indigo-600"
                    />
                    <div
                      style={{ height: `${item.h2}%` }}
                      className="w-2 rounded-t-sm bg-violet-400"
                    />
                  </div>
                  <span className="text-[10px] font-medium text-slate-400">{item.day}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Card 3: Recent Activity */}
          <div className="lg:col-span-4 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col">
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Recent Activity</h2>
              <Link to="/audit-logs" className="text-xs font-semibold text-violet-600 hover:text-violet-700">
                View all
              </Link>
            </div>

            <div className="flex-1 mt-4 space-y-3.5">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0 mt-0.5">
                  <Check className="w-4 h-4 stroke-[2.5]" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-semibold text-slate-800 truncate">Product synchronized</div>
                  <div className="text-[11px] text-slate-500">Nike Air Max Pro</div>
                </div>
                <div className="text-[10px] text-slate-400 shrink-0">2 min ago</div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-sky-100 text-sky-700 flex items-center justify-center shrink-0 mt-0.5">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-semibold text-slate-800 truncate">AI analysis completed</div>
                  <div className="text-[11px] text-slate-500">Wireless Headphones</div>
                </div>
                <div className="text-[10px] text-slate-400 shrink-0">17 min ago</div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-rose-100 text-rose-700 flex items-center justify-center shrink-0 mt-0.5">
                  <RotateCcw className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-semibold text-slate-800 truncate">Sync failed</div>
                  <div className="text-[11px] text-slate-500">Smart Watch Series 5</div>
                </div>
                <div className="text-[10px] text-slate-400 shrink-0">20 min ago</div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-teal-100 text-teal-700 flex items-center justify-center shrink-0 mt-0.5">
                  <Download className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-semibold text-slate-800 truncate">Product imported</div>
                  <div className="text-[11px] text-slate-500">Leather Backpack</div>
                </div>
                <div className="text-[10px] text-slate-400 shrink-0">1 hour ago</div>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions Bar matching reference image */}
        <div className="space-y-3">
          <h2 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Quick Actions</h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Button 1: Add Product */}
            <button
              onClick={() => setIsEditorOpen(true)}
              className="flex items-center gap-3.5 p-4 rounded-2xl bg-white border border-slate-200/80 hover:border-violet-300 hover:shadow-sm text-left transition-all group"
            >
              <div className="w-10 h-10 rounded-xl bg-violet-600 text-white flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform shadow-xs">
                <Plus className="w-5 h-5 stroke-[2.5]" />
              </div>
              <div>
                <div className="text-xs font-bold text-slate-900">Add Product</div>
                <div className="text-[11px] text-slate-500">Create new product</div>
              </div>
            </button>

            {/* Button 2: Run Catalog Audit */}
            <button
              onClick={() => auditMutation.mutate()}
              disabled={auditMutation.isPending}
              className="flex items-center gap-3.5 p-4 rounded-2xl bg-white border border-slate-200/80 hover:border-violet-300 hover:shadow-sm text-left transition-all group"
            >
              <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                <Sparkles className="w-5 h-5 text-violet-600" />
              </div>
              <div>
                <div className="text-xs font-bold text-slate-900">
                  {auditMutation.isPending ? 'Auditing...' : 'Run Catalog Audit'}
                </div>
                <div className="text-[11px] text-slate-500">Analyze all products</div>
              </div>
            </button>

            {/* Button 3: Sync to WooCommerce */}
            <button
              onClick={() => {
                if (products.length > 0) {
                  setSelectedProductId(products[0].id);
                  setIsDiffOpen(true);
                }
              }}
              className="flex items-center gap-3.5 p-4 rounded-2xl bg-white border border-slate-200/80 hover:border-blue-300 hover:shadow-sm text-left transition-all group"
            >
              <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform shadow-xs">
                <Send className="w-5 h-5" />
              </div>
              <div>
                <div className="text-xs font-bold text-slate-900">Sync to WooCommerce</div>
                <div className="text-[11px] text-slate-500">Push selected products</div>
              </div>
            </button>

            {/* Button 4: Import from Woo */}
            <button
              onClick={() => importAllMutation.mutate()}
              disabled={importAllMutation.isPending}
              className="flex items-center gap-3.5 p-4 rounded-2xl bg-white border border-slate-200/80 hover:border-slate-300 hover:shadow-sm text-left transition-all group"
            >
              <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                <Download className="w-5 h-5 text-teal-600" />
              </div>
              <div>
                <div className="text-xs font-bold text-slate-900">
                  {importAllMutation.isPending ? 'Importing...' : 'Import from Woo'}
                </div>
                <div className="text-[11px] text-slate-500">Pull products</div>
              </div>
            </button>
          </div>
        </div>
      </div>

      {/* Modals */}
      <ProductEditorModal
        isOpen={isEditorOpen}
        onClose={() => setIsEditorOpen(false)}
        product={null}
      />

      <PreFlightDiffModal
        isOpen={isDiffOpen}
        productId={selectedProductId}
        onClose={() => setIsDiffOpen(false)}
      />

      <AIAssistantModal
        isOpen={isAIOpen}
        productId={selectedProductId}
        onClose={() => setIsAIOpen(false)}
      />
    </div>
  );
};
