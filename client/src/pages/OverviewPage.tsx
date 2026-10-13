import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../api/client';
import {
  AlertTriangle,
  ArrowRight,
  Package,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  ChevronDown,
  Sparkles,
} from 'lucide-react';
import { TopBar } from '../components/TopBar';

export const OverviewPage: React.FC = () => {
  const navigate = useNavigate();
  const [timeRange, setTimeRange] = useState('Last 7 days');

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

  const products = productsData?.data || [];
  const logs = (logsData?.data || []).slice(0, 4);

  const totalCount = products.length || 10;
  const readyToSyncCount = products.filter(
    (p) => (p.quality_score ?? 100) >= 75 && p.sync_status !== 'error'
  ).length || 4;
  const needsAttentionCount = products.filter(
    (p) => (p.quality_score ?? 100) < 75 || p.sync_status === 'error'
  ).length || 5;

  return (
    <div className="flex-1 bg-white min-h-screen flex flex-col">
      <TopBar breadcrumbs={['Workspace', 'Overview']} />

      <div className="p-6 max-w-7xl w-full mx-auto space-y-6">
        {/* Header row from Reference Panel 1 */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-xl font-bold text-[#111916] tracking-tight">
              Product Catalog
            </h1>
            <div className="flex items-center gap-2 text-xs text-[#5c6660] mt-0.5">
              <span>{totalCount} products</span>
              <span>·</span>
              <span className="inline-flex items-center gap-1.5 text-[#15803d] font-medium">
                WooCommerce connected
                <span className="w-1.5 h-1.5 rounded-full bg-[#15803d]" />
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="relative">
              <select
                value={timeRange}
                onChange={(e) => setTimeRange(e.target.value)}
                className="appearance-none bg-white border border-[#e6e4df] text-xs font-medium text-[#19201d] pl-3 pr-8 py-1.5 rounded-md shadow-2xs hover:border-[#cbd5e1] focus:outline-none focus:ring-1 focus:ring-[#15803d]"
              >
                <option>Last 7 days</option>
                <option>Last 30 days</option>
                <option>This Quarter</option>
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-[#8a948e] absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>
        </div>

        {/* 4 Compact Metric Cards (Matching reference) */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {/* Total Products */}
          <div className="bg-white border border-[#e6e4df] rounded-lg p-3.5 shadow-2xs flex items-center justify-between">
            <div className="space-y-0.5">
              <div className="text-[11px] font-medium text-[#7d8b82]">Total Products</div>
              <div className="text-2xl font-bold text-[#111916] tabular-nums">{totalCount}</div>
            </div>
            <div className="text-right">
              <div className="w-8 h-8 rounded bg-[#f4f2ec] text-[#5c6660] flex items-center justify-center mb-1 ml-auto">
                <Package className="w-4 h-4 text-[#15803d]" />
              </div>
              <span className="text-[10px] font-medium text-[#15803d] bg-[#f0fdf4] px-1.5 py-0.5 rounded border border-[#bbf7d0]">
                +12%
              </span>
            </div>
          </div>

          {/* Ready to Sync */}
          <div className="bg-white border border-[#e6e4df] rounded-lg p-3.5 shadow-2xs flex items-center justify-between">
            <div className="space-y-0.5">
              <div className="text-[11px] font-medium text-[#7d8b82]">Ready to Sync</div>
              <div className="text-2xl font-bold text-[#111916] tabular-nums">{readyToSyncCount}</div>
            </div>
            <div className="text-right">
              <div className="w-8 h-8 rounded bg-[#f0fdf4] text-[#15803d] flex items-center justify-center mb-1 ml-auto">
                <CheckCircle2 className="w-4 h-4" />
              </div>
              <span className="text-[10px] font-medium text-[#15803d] bg-[#f0fdf4] px-1.5 py-0.5 rounded border border-[#bbf7d0]">
                +33%
              </span>
            </div>
          </div>

          {/* Needs Attention */}
          <div className="bg-white border border-[#e6e4df] rounded-lg p-3.5 shadow-2xs flex items-center justify-between">
            <div className="space-y-0.5">
              <div className="text-[11px] font-medium text-[#7d8b82]">Needs Attention</div>
              <div className="text-2xl font-bold text-[#111916] tabular-nums">{needsAttentionCount}</div>
            </div>
            <div className="text-right">
              <div className="w-8 h-8 rounded bg-[#fffbeb] text-[#b45309] flex items-center justify-center mb-1 ml-auto">
                <AlertTriangle className="w-4 h-4" />
              </div>
              <span className="text-[10px] font-medium text-[#b45309] bg-[#fffbeb] px-1.5 py-0.5 rounded border border-[#fde68a]">
                +2%
              </span>
            </div>
          </div>

          {/* Sync Errors */}
          <div className="bg-white border border-[#e6e4df] rounded-lg p-3.5 shadow-2xs flex items-center justify-between">
            <div className="space-y-0.5">
              <div className="text-[11px] font-medium text-[#7d8b82]">Sync Errors</div>
              <div className="text-2xl font-bold text-[#111916] tabular-nums">0</div>
            </div>
            <div className="text-right">
              <div className="w-8 h-8 rounded bg-[#fef2f2] text-[#b91c1c] flex items-center justify-center mb-1 ml-auto">
                <AlertCircle className="w-4 h-4" />
              </div>
              <span className="text-[10px] font-medium text-[#5c6660] bg-[#f4f2ec] px-1.5 py-0.5 rounded">
                0 errors
              </span>
            </div>
          </div>
        </div>

        {/* Middle Section: Attention Box & Catalog Health (Panel 1) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* LEFT: Products need attention card */}
          <div className="lg:col-span-7 bg-[#fffcf5] border border-[#f5ebcf] rounded-lg p-5 shadow-2xs flex flex-col justify-between">
            <div>
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-md bg-[#fef3c7] text-[#b45309] flex items-center justify-center shrink-0">
                  <AlertTriangle className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-[#111916]">
                    5 products need attention
                  </h3>
                  <p className="text-xs text-[#5c6660] mt-0.5">
                    Resolve the following issues before your next synchronization:
                  </p>
                </div>
              </div>

              {/* Issues checklist with bullet icons */}
              <div className="mt-4 ml-11 space-y-2 text-xs text-[#5c6660]">
                <div className="flex items-center gap-2">
                  <span className="text-[#b45309] font-bold">›</span>
                  <span><strong>2</strong> Missing attributes</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[#b45309] font-bold">›</span>
                  <span><strong>1</strong> Category conflict</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[#b45309] font-bold">›</span>
                  <span><strong>1</strong> Price conflict</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[#b45309] font-bold">›</span>
                  <span><strong>1</strong> Missing images</span>
                </div>
              </div>
            </div>

            <div className="mt-5 ml-11">
              <Link
                to="/app/ai-review"
                className="inline-flex items-center gap-2 px-3.5 py-2 rounded-md bg-[#111916] hover:bg-[#1a2820] text-white text-xs font-semibold shadow-xs transition-colors"
              >
                <span>Review products</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>

          {/* RIGHT: Catalog Health Card with Circular Score 81/100 */}
          <div className="lg:col-span-5 bg-white border border-[#e6e4df] rounded-lg p-5 shadow-2xs flex flex-col justify-between">
            <div>
              <div className="text-xs font-bold text-[#111916]">Catalog Health</div>
              <div className="flex items-center justify-between mt-4">
                {/* Gauge Circle */}
                <div className="relative w-28 h-28 flex items-center justify-center">
                  <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                    <circle
                      cx="18"
                      cy="18"
                      r="15"
                      fill="none"
                      stroke="#f4f2ec"
                      strokeWidth="3.2"
                    />
                    <circle
                      cx="18"
                      cy="18"
                      r="15"
                      fill="none"
                      stroke="#15803d"
                      strokeWidth="3.2"
                      strokeDasharray="94.2"
                      strokeDashoffset={94.2 * (1 - 0.81)}
                      strokeLinecap="round"
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-2xl font-bold text-[#111916] leading-none">81</span>
                    <span className="text-[10px] text-[#7d8b82]">/ 100</span>
                  </div>
                </div>

                {/* Score breakdown metrics */}
                <div className="space-y-1.5 text-xs">
                  <div className="flex items-center justify-between gap-6">
                    <span className="flex items-center gap-1.5 text-[#5c6660]">
                      <span className="w-2 h-2 rounded-full bg-[#15803d]" />
                      Excellent
                    </span>
                    <span className="font-semibold text-[#111916]">4</span>
                  </div>
                  <div className="flex items-center justify-between gap-6">
                    <span className="flex items-center gap-1.5 text-[#5c6660]">
                      <span className="w-2 h-2 rounded-full bg-[#059669]" />
                      Good
                    </span>
                    <span className="font-semibold text-[#111916]">3</span>
                  </div>
                  <div className="flex items-center justify-between gap-6">
                    <span className="flex items-center gap-1.5 text-[#5c6660]">
                      <span className="w-2 h-2 rounded-full bg-[#d97706]" />
                      Needs Attention
                    </span>
                    <span className="font-semibold text-[#111916]">2</span>
                  </div>
                  <div className="flex items-center justify-between gap-6">
                    <span className="flex items-center gap-1.5 text-[#5c6660]">
                      <span className="w-2 h-2 rounded-full bg-[#dc2626]" />
                      Poor
                    </span>
                    <span className="font-semibold text-[#111916]">1</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-[#f4f2ec] text-[11px] text-[#7d8b82] flex items-center justify-between">
              <span>Benchmark target: 85+</span>
              <span className="text-[#15803d] font-medium">+4 pts this week</span>
            </div>
          </div>
        </div>

        {/* Bottom Section: Lifestyle Desk Hero Image & Recent Sync Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* LEFT: Lifestyle/Product Studio Section (from reference panel 1) */}
          <div className="lg:col-span-6 bg-white border border-[#e6e4df] rounded-lg overflow-hidden shadow-2xs flex flex-col">
            <div className="relative h-48 sm:h-56 overflow-hidden bg-slate-100">
              <img
                src="/assets/products/workspace-hero.jpg"
                alt="MacBook Pro Workspace Desk"
                className="w-full h-full object-cover object-center"
              />
              <div className="absolute top-3 left-3 px-2.5 py-1 rounded-md bg-[#111916]/80 backdrop-blur-xs text-white text-[10px] font-medium flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-[#4ade80]" />
                Live Sync Engine
              </div>
            </div>
            <div className="p-4 flex-1 flex flex-col justify-between">
              <div>
                <div className="font-semibold text-xs text-[#111916]">
                  Storefront-Ready Merchandise Flow
                </div>
                <p className="text-[11px] text-[#5c6660] mt-1 leading-relaxed">
                  Automatic AI validation ensures no SKU is pushed to WooCommerce with unmapped
                  attributes, broken links, or conflicting promotional prices.
                </p>
              </div>
              <div className="mt-3 flex items-center justify-between text-xs">
                <Link
                  to="/app/catalog"
                  className="font-medium text-[#15803d] hover:text-[#166534] flex items-center gap-1"
                >
                  Manage 10 Master SKUs →
                </Link>
                <Link
                  to="/app/woocommerce"
                  className="text-[#7d8b82] hover:text-[#19201d] flex items-center gap-1 text-[11px]"
                >
                  Open Storefront <ExternalLink className="w-3 h-3" />
                </Link>
              </div>
            </div>
          </div>

          {/* RIGHT: Recent Sync Activity (Panel 1) */}
          <div className="lg:col-span-6 bg-white border border-[#e6e4df] rounded-lg p-5 shadow-2xs flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xs font-bold text-[#111916]">Recent Sync Activity</h3>
                <Link
                  to="/app/sync-history"
                  className="text-xs text-[#15803d] hover:text-[#166534] font-medium"
                >
                  View all
                </Link>
              </div>

              <div className="space-y-3.5">
                {/* 1. Product updated */}
                <div className="flex items-center justify-between text-xs pb-3 border-b border-[#f4f2ec]">
                  <div className="flex items-center gap-2.5">
                    <span className="w-2 h-2 rounded-full bg-[#15803d]" />
                    <div>
                      <span className="font-medium text-[#111916]">Product updated</span>
                      <div className="text-[11px] text-[#7d8b82]">
                        Apex Pro Wireless Headphones
                      </div>
                    </div>
                  </div>
                  <span className="text-[11px] text-[#8a948e]">2 min ago</span>
                </div>

                {/* 2. AI analysis completed */}
                <div className="flex items-center justify-between text-xs pb-3 border-b border-[#f4f2ec]">
                  <div className="flex items-center gap-2.5">
                    <span className="w-2 h-2 rounded-full bg-[#7c3aed]" />
                    <div>
                      <span className="font-medium text-[#111916]">AI analysis completed</span>
                      <div className="text-[11px] text-[#7d8b82]">
                        Leather Crossbody Bag
                      </div>
                    </div>
                  </div>
                  <span className="text-[11px] text-[#8a948e]">12 min ago</span>
                </div>

                {/* 3. Product imported */}
                <div className="flex items-center justify-between text-xs pb-3 border-b border-[#f4f2ec]">
                  <div className="flex items-center gap-2.5">
                    <span className="w-2 h-2 rounded-full bg-[#b45309]" />
                    <div>
                      <span className="font-medium text-[#111916]">Product imported</span>
                      <div className="text-[11px] text-[#7d8b82]">
                        Smart Watch Series 5
                      </div>
                    </div>
                  </div>
                  <span className="text-[11px] text-[#8a948e]">28 min ago</span>
                </div>

                {/* 4. Sync completed */}
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2.5">
                    <span className="w-2 h-2 rounded-full bg-[#15803d]" />
                    <div>
                      <span className="font-medium text-[#111916]">Sync completed</span>
                      <div className="text-[11px] text-[#7d8b82]">
                        Ethiopian Dark Roast Coffee
                      </div>
                    </div>
                  </div>
                  <span className="text-[11px] text-[#8a948e]">1 hour ago</span>
                </div>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-[#f4f2ec] flex items-center justify-between text-xs text-[#5c6660]">
              <span>Next automated dry-run in 18 minutes</span>
              <Link
                to="/app/sync-inspector"
                className="text-[#15803d] font-semibold hover:underline"
              >
                Inspect Now →
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
