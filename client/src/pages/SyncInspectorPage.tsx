import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../api/client';
import {
  GitCompare,
  AlertTriangle,
  CheckCircle2,
  AlertCircle,
  Check,
  ChevronDown,
  RotateCcw,
  Sparkles,
  ArrowRight,
} from 'lucide-react';
import { TopBar } from '../components/TopBar';

export const SyncInspectorPage: React.FC = () => {
  const queryClient = useQueryClient();

  const [selectedProductId, setSelectedProductId] = useState<number>(2); // Default to product with conflict (AeroPulse Headphones)
  const [resolutionChoice, setResolutionChoice] = useState<'keep_pim' | 'keep_woo' | 'custom'>('keep_pim');
  const [customValue, setCustomValue] = useState('24');
  const [syncStatusMsg, setSyncStatusMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Products query
  const { data: productsData } = useQuery({
    queryKey: ['products'],
    queryFn: () => api.getProducts(),
  });

  const products = productsData?.data || [];
  const selectedProduct = products.find((p) => p.id === selectedProductId) || products[0];

  // Pre-flight Diff query
  const { data: diffData, isLoading, refetch } = useQuery({
    queryKey: ['preflight-diff', selectedProductId],
    queryFn: () => (selectedProductId ? api.getPreFlightDiff(selectedProductId) : Promise.reject()),
    enabled: !!selectedProductId,
  });

  // Resolve conflict mutation
  const resolveMutation = useMutation({
    mutationFn: (choice: 'keep_pim' | 'keep_woo') =>
      api.resolveConflict(selectedProductId, choice),
    onSuccess: () => {
      refetch();
      queryClient.invalidateQueries({ queryKey: ['products'] });
    },
  });

  // Approve / push mutation
  const approveSyncMutation = useMutation({
    mutationFn: () => api.pushProduct(selectedProductId),
    onSuccess: (res) => {
      setSyncStatusMsg({
        type: 'success',
        text: `Product successfully pushed to WooCommerce (Remote ID: #${res.woo_id}).`,
      });
      refetch();
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['sync-logs'] });
    },
    onError: (err: any) => {
      setSyncStatusMsg({
        type: 'error',
        text: err?.message || 'Sync failed due to validation rules.',
      });
    },
  });

  const diff = diffData?.data;

  return (
    <div className="flex-1 bg-white min-h-screen flex flex-col">
      <TopBar breadcrumbs={['Operations', 'Sync Inspector']} />

      <div className="p-6 max-w-7xl w-full mx-auto space-y-6">
        {/* Header Row with Dry Run badge (Panel 5) */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-xl font-bold text-[#111916] tracking-tight">
                Pre-flight Synchronization Inspector
              </h1>
              <span className="px-2 py-0.5 rounded text-[11px] font-bold uppercase tracking-wider bg-[#f4f2ec] text-[#5c6660] border border-[#e6e4df]">
                Dry Run
              </span>
            </div>
            <p className="text-xs text-[#5c6660] mt-0.5">
              Review all changes before syncing with WooCommerce.
            </p>
          </div>

          {/* Product selector dropdown */}
          <div className="relative min-w-[280px]">
            <select
              value={selectedProductId}
              onChange={(e) => setSelectedProductId(Number(e.target.value))}
              className="w-full appearance-none bg-white border border-[#e6e4df] text-xs font-semibold text-[#111916] pl-3 pr-8 py-2 rounded-md shadow-2xs hover:border-[#cbd5e1] focus:outline-none focus:ring-1 focus:ring-[#15803d]"
            >
              {products.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.sku || 'NO-SKU'})
                </option>
              ))}
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-[#8a948e] absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
        </div>

        {/* 5 Top Summary Metric Cards (Matching reference Panel 5) */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3.5">
          {/* To Create */}
          <div className="bg-white border border-[#e6e4df] rounded-lg p-3.5 shadow-2xs">
            <div className="text-[11px] font-medium text-[#7d8b82]">To Create</div>
            <div className="text-2xl font-bold text-[#111916] tabular-nums mt-0.5">2</div>
          </div>

          {/* To Update */}
          <div className="bg-white border border-[#e6e4df] rounded-lg p-3.5 shadow-2xs">
            <div className="text-[11px] font-medium text-[#7d8b82]">To Update</div>
            <div className="text-2xl font-bold text-[#111916] tabular-nums mt-0.5">3</div>
          </div>

          {/* Conflicts */}
          <div className="bg-[#fff8f8] border border-[#fecaca] rounded-lg p-3.5 shadow-2xs">
            <div className="text-[11px] font-semibold text-[#dc2626]">Conflicts</div>
            <div className="text-2xl font-bold text-[#dc2626] tabular-nums mt-0.5">1</div>
          </div>

          {/* Validation Errors */}
          <div className="bg-white border border-[#e6e4df] rounded-lg p-3.5 shadow-2xs">
            <div className="text-[11px] font-medium text-[#7d8b82]">Validation Errors</div>
            <div className="text-2xl font-bold text-[#111916] tabular-nums mt-0.5">0</div>
          </div>

          {/* Warnings */}
          <div className="bg-[#fffcf5] border border-[#fde68a] rounded-lg p-3.5 shadow-2xs">
            <div className="text-[11px] font-semibold text-[#b45309]">Warnings</div>
            <div className="text-2xl font-bold text-[#b45309] tabular-nums mt-0.5">1</div>
          </div>
        </div>

        {/* Notification Toast Message */}
        {syncStatusMsg && (
          <div
            className={`p-3 rounded-lg border text-xs flex items-center justify-between ${
              syncStatusMsg.type === 'success'
                ? 'bg-[#f0fdf4] border-[#bbf7d0] text-[#15803d]'
                : 'bg-[#fef2f2] border-[#fecaca] text-[#dc2626]'
            }`}
          >
            <span>{syncStatusMsg.text}</span>
            <button
              type="button"
              onClick={() => setSyncStatusMsg(null)}
              className="font-bold ml-3"
            >
              ×
            </button>
          </div>
        )}

        {/* Main Grid: Left Diff Table & Right Conflict Resolution Drawer */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* LEFT: Field Comparison Table (col-span-8) */}
          <div className="lg:col-span-8 bg-white border border-[#e6e4df] rounded-lg shadow-2xs overflow-hidden">
            <div className="overflow-x-auto w-full">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-[#fbfaf8] border-b border-[#e6e4df] text-[#5c6660]">
                    <th className="py-2.5 px-4 font-semibold">Field</th>
                    <th className="py-2.5 px-4 font-semibold">PIM Sentinel (Current)</th>
                    <th className="py-2.5 px-4 font-semibold">WooCommerce (Target)</th>
                    <th className="py-2.5 px-4 font-semibold">Status</th>
                    <th className="py-2.5 px-4 font-semibold text-right">Resolution</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#f4f2ec]">
                  {/* Row 1: Product Name */}
                  <tr className="hover:bg-[#fbfaf8] transition-colors">
                    <td className="py-3 px-4 font-medium text-[#111916]">Product Name</td>
                    <td className="py-3 px-4 text-[#5c6660]">Apex Pro Wireless Headphones</td>
                    <td className="py-3 px-4 text-[#5c6660]">Apex Pro Wireless Headphones</td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-[#f0fdf4] text-[#15803d] border border-[#bbf7d0]">
                        Match
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right text-[#7d8b82]">—</td>
                  </tr>

                  {/* Row 2: SKU */}
                  <tr className="hover:bg-[#fbfaf8] transition-colors">
                    <td className="py-3 px-4 font-medium text-[#111916]">SKU</td>
                    <td className="py-3 px-4 font-mono text-[#5c6660]">AERO-01</td>
                    <td className="py-3 px-4 font-mono text-[#5c6660]">AERO-01</td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-[#f0fdf4] text-[#15803d] border border-[#bbf7d0]">
                        Match
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right text-[#7d8b82]">—</td>
                  </tr>

                  {/* Row 3: Regular Price */}
                  <tr className="hover:bg-[#fbfaf8] transition-colors">
                    <td className="py-3 px-4 font-medium text-[#111916]">Regular Price</td>
                    <td className="py-3 px-4 font-semibold text-[#111916]">₹6,999</td>
                    <td className="py-3 px-4 text-[#7d8b82]">₹7,999</td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-[#fffbeb] text-[#b45309] border border-[#fde68a]">
                        Changed
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <select className="bg-[#fbfaf8] border border-[#e6e4df] rounded px-2 py-0.5 text-[11px] font-medium text-[#19201d]">
                        <option>Keep PIM</option>
                        <option>Keep WooCommerce</option>
                      </select>
                    </td>
                  </tr>

                  {/* Row 4: Stock Quantity (Conflict!) */}
                  <tr className="bg-[#fff8f8] hover:bg-[#fff1f1] transition-colors">
                    <td className="py-3 px-4 font-bold text-[#dc2626]">Stock Quantity</td>
                    <td className="py-3 px-4 font-bold text-[#dc2626] tabular-nums">24</td>
                    <td className="py-3 px-4 font-bold text-[#7d8b82] tabular-nums">20</td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#fee2e2] text-[#b91c1c] border border-[#fca5a5]">
                        Conflict
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <select
                        value={resolutionChoice}
                        onChange={(e) => setResolutionChoice(e.target.value as any)}
                        className="bg-white border border-[#fca5a5] rounded px-2 py-0.5 text-[11px] font-bold text-[#dc2626]"
                      >
                        <option value="keep_pim">Resolve (PIM)</option>
                        <option value="keep_woo">Resolve (Woo)</option>
                      </select>
                    </td>
                  </tr>

                  {/* Row 5: Category */}
                  <tr className="hover:bg-[#fbfaf8] transition-colors">
                    <td className="py-3 px-4 font-medium text-[#111916]">Category</td>
                    <td className="py-3 px-4 text-[#5c6660]">Running Shoes</td>
                    <td className="py-3 px-4 text-[#7d8b82]">Footwear</td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-[#fffbeb] text-[#b45309] border border-[#fde68a]">
                        Changed
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <select className="bg-[#fbfaf8] border border-[#e6e4df] rounded px-2 py-0.5 text-[11px] font-medium text-[#19201d]">
                        <option>Keep PIM</option>
                        <option>Keep WooCommerce</option>
                      </select>
                    </td>
                  </tr>

                  {/* Row 6: Brand */}
                  <tr className="hover:bg-[#fbfaf8] transition-colors">
                    <td className="py-3 px-4 font-medium text-[#111916]">Brand</td>
                    <td className="py-3 px-4 text-[#5c6660]">Sony</td>
                    <td className="py-3 px-4 text-[#5c6660]">Sony</td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-[#f0fdf4] text-[#15803d] border border-[#bbf7d0]">
                        Match
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right text-[#7d8b82]">—</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Bottom notification indicator */}
            <div className="p-3 bg-[#fbfaf8] border-t border-[#e6e4df] text-[11px] text-[#5c6660] flex items-center justify-between">
              <span>Dry run validation completed. No fatal schema locks detected.</span>
              <span className="text-[#15803d] font-semibold">Clean payload ready</span>
            </div>
          </div>

          {/* RIGHT: Conflict Resolution Drawer (col-span-4, Panel 5) */}
          <div className="lg:col-span-4 bg-white border border-[#e6e4df] rounded-lg p-5 shadow-2xs space-y-5">
            <div>
              <div className="text-xs font-bold text-[#111916] uppercase tracking-wider">
                Conflict Resolution
              </div>
              <h3 className="font-bold text-sm text-[#111916] mt-1">Stock Quantity</h3>
              <div className="flex items-center gap-2 text-xs text-[#5c6660] mt-1">
                <span>PIM: <strong>24 units</strong></span>
                <span>·</span>
                <span>WooCommerce: <strong>20 units</strong></span>
              </div>
            </div>

            {/* Radio choices */}
            <div className="space-y-3 text-xs">
              <div className="font-semibold text-[#111916]">Choose value to keep:</div>

              <label className="flex items-center gap-2.5 p-2.5 rounded-md border border-[#e6e4df] hover:bg-[#fbfaf8] cursor-pointer">
                <input
                  type="radio"
                  name="choice"
                  checked={resolutionChoice === 'keep_pim'}
                  onChange={() => setResolutionChoice('keep_pim')}
                  className="text-[#15803d] focus:ring-[#15803d]"
                />
                <span className="text-[#111916] font-medium">Keep PIM value (24)</span>
              </label>

              <label className="flex items-center gap-2.5 p-2.5 rounded-md border border-[#e6e4df] hover:bg-[#fbfaf8] cursor-pointer">
                <input
                  type="radio"
                  name="choice"
                  checked={resolutionChoice === 'keep_woo'}
                  onChange={() => setResolutionChoice('keep_woo')}
                  className="text-[#15803d] focus:ring-[#15803d]"
                />
                <span className="text-[#111916] font-medium">Keep WooCommerce value (20)</span>
              </label>

              <label className="flex items-center gap-2.5 p-2.5 rounded-md border border-[#e6e4df] hover:bg-[#fbfaf8] cursor-pointer">
                <input
                  type="radio"
                  name="choice"
                  checked={resolutionChoice === 'custom'}
                  onChange={() => setResolutionChoice('custom')}
                  className="text-[#15803d] focus:ring-[#15803d]"
                />
                <span className="text-[#111916] font-medium">Use different value</span>
              </label>

              {resolutionChoice === 'custom' && (
                <input
                  type="number"
                  value={customValue}
                  onChange={(e) => setCustomValue(e.target.value)}
                  className="w-full mt-1 px-3 py-1.5 border border-[#e6e4df] rounded-md text-xs font-mono"
                  placeholder="Enter custom stock number"
                />
              )}
            </div>

            {/* Bottom Actions */}
            <div className="flex items-center gap-2 pt-2 border-t border-[#f4f2ec]">
              <button
                type="button"
                onClick={() => setResolutionChoice('keep_pim')}
                className="flex-1 py-2 px-3 border border-[#e6e4df] bg-white hover:bg-[#f4f2ec] text-[#19201d] rounded-md text-xs font-medium shadow-2xs transition-colors"
              >
                Cancel
              </button>

              <button
                type="button"
                disabled={approveSyncMutation.isPending}
                onClick={() => {
                  resolveMutation.mutate(
                    resolutionChoice === 'keep_woo' ? 'keep_woo' : 'keep_pim'
                  );
                  approveSyncMutation.mutate();
                }}
                className="flex-1 py-2 px-3 bg-[#15803d] hover:bg-[#166534] disabled:bg-[#a7f3d0] text-white rounded-md text-xs font-semibold shadow-2xs transition-colors flex items-center justify-center gap-1.5"
              >
                {approveSyncMutation.isPending ? (
                  <span>Syncing...</span>
                ) : (
                  <>
                    <Check className="w-3.5 h-3.5" />
                    <span>Confirm &amp; Sync</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
