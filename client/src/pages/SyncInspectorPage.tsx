import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../api/client';
import {
  ChevronDown,
  Check,
  ShieldAlert,
  ShieldCheck,
  AlertTriangle,
  RefreshCw,
  Sliders,
  Layers,
  ArrowRight,
} from 'lucide-react';
import { TopBar } from '../components/TopBar';

export const SyncInspectorPage: React.FC = () => {
  const queryClient = useQueryClient();

  const [selectedProductId, setSelectedProductId] = useState<number>(1);
  const [fieldResolutions, setFieldResolutions] = useState<Record<string, 'keep_pim' | 'keep_woo'>>({});
  const [syncStatusMsg, setSyncStatusMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Products query
  const { data: productsData } = useQuery({
    queryKey: ['products'],
    queryFn: () => api.getProducts(),
  });

  const products = productsData?.data || [];
  const selectedProduct = products.find((p) => p.id === selectedProductId) || products[0];

  // Pre-flight Diff query (Three-Way Diff + Blast Radius)
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
        text: `Changeset verified and pushed to WooCommerce storefront (ID: #${res.woo_id}).`,
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
  const diffs = diff?.diffs || [];
  const blastRadius = diff?.blast_radius;
  const conflicts = diffs.filter(d => d.three_way_status === 'CONFLICT');
  const pimChangedCount = diffs.filter(d => d.three_way_status === 'PIM_CHANGED').length;
  const wooChangedCount = diffs.filter(d => d.three_way_status === 'WOO_CHANGED').length;
  const matchCount = diffs.filter(d => d.three_way_status === 'MATCH').length;

  const handleFieldResolutionChange = (field: string, res: 'keep_pim' | 'keep_woo') => {
    setFieldResolutions(prev => ({ ...prev, [field]: res }));
  };

  const getStatusBadge = (status?: string) => {
    switch (status) {
      case 'MATCH':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-[#f0fdf4] text-[#15803d] border border-[#bbf7d0]">
            MATCH
          </span>
        );
      case 'PIM_CHANGED':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-[#ecfdf5] text-[#047857] border border-[#a7f3d0]">
            PIM CHANGED
          </span>
        );
      case 'WOO_CHANGED':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-[#eff6ff] text-[#1d4ed8] border border-[#bfdbfe]">
            WOO CHANGED
          </span>
        );
      case 'CONFLICT':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-[#fee2e2] text-[#b91c1c] border border-[#fca5a5]">
            CONFLICT
          </span>
        );
      case 'NEW':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-[#f5f3ff] text-[#6d28d9] border border-[#ddd6fe]">
            NEW ITEM
          </span>
        );
      default:
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-[#f4f2ec] text-[#5c6660]">
            {status || '—'}
          </span>
        );
    }
  };

  return (
    <div className="flex-1 bg-white min-h-screen flex flex-col">
      <TopBar breadcrumbs={['Operations', 'Sync Inspector']} />

      <div className="p-6 max-w-7xl w-full mx-auto space-y-6">
        {/* Header Row */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-xl font-bold text-[#111916] tracking-tight">
                Three-Way Synchronization Inspector
              </h1>
              <span className="px-2 py-0.5 rounded text-[11px] font-bold uppercase tracking-wider bg-[#f4f2ec] text-[#5c6660] border border-[#e6e4df]">
                Deterministic Diff
              </span>
            </div>
            <p className="text-xs text-[#5c6660] mt-0.5">
              Reconciles BASELINE (last sync) against VERIDEX PIM and WooCommerce storefront.
            </p>
          </div>

          {/* Product selector dropdown */}
          <div className="relative min-w-[300px]">
            <select
              value={selectedProductId}
              onChange={(e) => {
                setSelectedProductId(Number(e.target.value));
                setFieldResolutions({});
              }}
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

        {/* 5 Top Summary Metric Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3.5">
          <div className="bg-white border border-[#e6e4df] rounded-lg p-3.5 shadow-2xs">
            <div className="text-[11px] font-medium text-[#7d8b82]">In Sync (Match)</div>
            <div className="text-2xl font-bold text-[#111916] tabular-nums mt-0.5">{matchCount}</div>
          </div>

          <div className="bg-white border border-[#e6e4df] rounded-lg p-3.5 shadow-2xs">
            <div className="text-[11px] font-medium text-[#7d8b82]">PIM Changed</div>
            <div className="text-2xl font-bold text-[#047857] tabular-nums mt-0.5">{pimChangedCount}</div>
          </div>

          <div className="bg-white border border-[#e6e4df] rounded-lg p-3.5 shadow-2xs">
            <div className="text-[11px] font-medium text-[#7d8b82]">Woo Changed</div>
            <div className="text-2xl font-bold text-[#1d4ed8] tabular-nums mt-0.5">{wooChangedCount}</div>
          </div>

          <div className={`rounded-lg p-3.5 shadow-2xs border ${conflicts.length > 0 ? 'bg-[#fff8f8] border-[#fecaca]' : 'bg-white border-[#e6e4df]'}`}>
            <div className={`text-[11px] font-semibold ${conflicts.length > 0 ? 'text-[#dc2626]' : 'text-[#7d8b82]'}`}>
              Conflicts
            </div>
            <div className={`text-2xl font-bold tabular-nums mt-0.5 ${conflicts.length > 0 ? 'text-[#dc2626]' : 'text-[#111916]'}`}>
              {conflicts.length}
            </div>
          </div>

          <div className="bg-white border border-[#e6e4df] rounded-lg p-3.5 shadow-2xs">
            <div className="text-[11px] font-medium text-[#7d8b82]">Blast Radius</div>
            <div className={`text-sm font-bold mt-1.5 uppercase ${
              blastRadius?.risk_level === 'HIGH' ? 'text-[#dc2626]' : blastRadius?.risk_level === 'MEDIUM' ? 'text-[#b45309]' : 'text-[#15803d]'
            }`}>
              {blastRadius?.risk_level || 'LOW'} RISK
            </div>
          </div>
        </div>

        {/* Blast Radius Impact Summary Banner */}
        {blastRadius && (
          <div className={`p-4 rounded-lg border text-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 ${
            blastRadius.risk_level === 'HIGH'
              ? 'bg-[#fef2f2] border-[#fca5a5] text-[#991b1b]'
              : blastRadius.risk_level === 'MEDIUM'
              ? 'bg-[#fffbeb] border-[#fde68a] text-[#92400e]'
              : 'bg-[#f0fdf4] border-[#bbf7d0] text-[#166534]'
          }`}>
            <div className="flex items-center gap-3">
              {blastRadius.risk_level === 'HIGH' ? (
                <ShieldAlert className="w-5 h-5 text-[#dc2626] shrink-0" />
              ) : (
                <ShieldCheck className="w-5 h-5 text-[#15803d] shrink-0" />
              )}
              <div>
                <span className="font-bold uppercase tracking-wider text-[11px] mr-2">
                  Sync Impact Analysis: {blastRadius.risk_level} Risk
                </span>
                <p className="mt-0.5 opacity-90">{blastRadius.risk_reason}</p>
              </div>
            </div>
            <div className="text-right sm:shrink-0 text-[11px] font-semibold">
              <span>{blastRadius.recommended_action}</span>
            </div>
          </div>
        )}

        {/* Toast */}
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
              className="font-bold ml-3 text-sm"
            >
              ×
            </button>
          </div>
        )}

        {/* Main Grid: Three-Way Comparison Table (col-span-8) & Conflict/Policy Drawer (col-span-4) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* LEFT: Three-Way Table */}
          <div className="lg:col-span-8 bg-white border border-[#e6e4df] rounded-lg shadow-2xs overflow-hidden">
            <div className="px-4 py-3 bg-[#fbfaf8] border-b border-[#e6e4df] flex items-center justify-between">
              <div className="text-xs font-bold text-[#111916]">
                Three-Way Field State Comparison
              </div>
              <div className="text-[11px] text-[#7d8b82]">
                Active Policy: <span className="font-semibold text-[#111916]">PIM owns Content & Price; Woo owns Stock</span>
              </div>
            </div>

            <div className="overflow-x-auto w-full">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-[#fbfaf8] border-b border-[#e6e4df] text-[#5c6660]">
                    <th className="py-2.5 px-3.5 font-semibold">Field</th>
                    <th className="py-2.5 px-3.5 font-semibold text-[#7d8b82]">Baseline (Last Sync)</th>
                    <th className="py-2.5 px-3.5 font-semibold text-[#15803d]">VERIDEX (PIM)</th>
                    <th className="py-2.5 px-3.5 font-semibold text-[#1d4ed8]">WooCommerce</th>
                    <th className="py-2.5 px-3.5 font-semibold">Three-Way Status</th>
                    <th className="py-2.5 px-3.5 font-semibold text-right">Policy & Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#f4f2ec]">
                  {diffs.map((d, idx) => {
                    const isConflict = d.three_way_status === 'CONFLICT';
                    const isPimChanged = d.three_way_status === 'PIM_CHANGED';
                    const isWooChanged = d.three_way_status === 'WOO_CHANGED';
                    const activeResolution = fieldResolutions[d.field] || d.recommended_resolution || 'keep_pim';

                    return (
                      <tr
                        key={idx}
                        className={`transition-colors ${
                          isConflict ? 'bg-[#fff8f8] hover:bg-[#fff1f1]' : 'hover:bg-[#fbfaf8]'
                        }`}
                      >
                        <td className="py-3 px-3.5 font-medium text-[#111916]">
                          {d.label || d.field}
                        </td>
                        <td className="py-3 px-3.5 text-[#7d8b82] font-mono text-[11px]">
                          {d.baseline_value || '—'}
                        </td>
                        <td className={`py-3 px-3.5 font-mono text-[11px] ${isPimChanged ? 'font-bold text-[#047857]' : 'text-[#111916]'}`}>
                          {d.pim_value || '—'}
                        </td>
                        <td className={`py-3 px-3.5 font-mono text-[11px] ${isWooChanged ? 'font-bold text-[#1d4ed8]' : 'text-[#5c6660]'}`}>
                          {d.woo_value || '—'}
                        </td>
                        <td className="py-3 px-3.5">
                          {getStatusBadge(d.three_way_status)}
                        </td>
                        <td className="py-3 px-3.5 text-right">
                          {isConflict ? (
                            <select
                              value={activeResolution}
                              onChange={(e) => handleFieldResolutionChange(d.field, e.target.value as any)}
                              className="bg-white border border-[#fca5a5] rounded px-2 py-0.5 text-[11px] font-bold text-[#dc2626]"
                            >
                              <option value="keep_pim">Keep PIM (Policy: {d.policy_owner})</option>
                              <option value="keep_woo">Keep WooCommerce</option>
                            </select>
                          ) : isPimChanged ? (
                            <span className="text-[11px] text-[#047857] font-medium">Push PIM Update</span>
                          ) : isWooChanged ? (
                            <span className="text-[11px] text-[#1d4ed8] font-medium">Pull Woo Update</span>
                          ) : (
                            <span className="text-[#8a948e] text-[11px]">—</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="p-3 bg-[#fbfaf8] border-t border-[#e6e4df] text-[11px] text-[#5c6660] flex items-center justify-between">
              <span>Normalized comparison active: numeric string coercion &amp; whitespace stripped.</span>
              <span className="text-[#15803d] font-semibold">Zero false-positive changed states</span>
            </div>
          </div>

          {/* RIGHT: Conflict Resolution Drawer & Final Sync Action */}
          <div className="lg:col-span-4 bg-white border border-[#e6e4df] rounded-lg p-5 shadow-2xs space-y-5">
            <div>
              <div className="text-xs font-bold text-[#111916] uppercase tracking-wider">
                Reconciliation Control
              </div>
              <h3 className="font-bold text-sm text-[#111916] mt-1">
                {selectedProduct?.name || 'Selected Product'}
              </h3>
              <div className="text-xs text-[#5c6660] mt-0.5">
                SKU: <span className="font-mono font-medium text-[#111916]">{selectedProduct?.sku || 'N/A'}</span>
              </div>
            </div>

            {/* If conflicts exist, show guided resolution */}
            {conflicts.length > 0 ? (
              <div className="p-3.5 rounded-lg border border-[#fca5a5] bg-[#fff8f8] space-y-3">
                <div className="flex items-center gap-2 text-xs font-bold text-[#dc2626]">
                  <AlertTriangle className="w-4 h-4" />
                  <span>{conflicts.length} Unresolved Conflict(s) Detected</span>
                </div>
                <p className="text-[11.5px] text-[#7f1d1d] leading-relaxed">
                  Both VERIDEX and WooCommerce modified fields simultaneously since the last baseline synchronization.
                </p>

                <div className="space-y-2 pt-1">
                  {conflicts.map((c, i) => (
                    <div key={i} className="text-xs bg-white p-2.5 rounded border border-[#fca5a5]/60 space-y-1">
                      <div className="font-bold text-[#111916]">{c.label || c.field}</div>
                      <div className="text-[11px] text-[#5c6660]">
                        PIM: <span className="font-semibold text-[#047857]">{c.pim_value}</span> · Woo: <span className="font-semibold text-[#1d4ed8]">{c.woo_value}</span>
                      </div>
                      <div className="text-[10.5px] text-[#b45309] font-medium pt-1">
                        Recommended: Keep {c.policy_owner === 'PIM' ? 'VERIDEX (PIM)' : 'WooCommerce'} ({c.resolution_reason || 'Policy rule'})
                      </div>
                    </div>
                  ))}
                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => resolveMutation.mutate('keep_pim')}
                    className="flex-1 py-1.5 px-2 bg-white border border-[#e6e4df] hover:bg-[#fbfaf8] text-[#111916] rounded text-[11px] font-semibold shadow-2xs"
                  >
                    Apply PIM Policy
                  </button>
                  <button
                    type="button"
                    onClick={() => resolveMutation.mutate('keep_woo')}
                    className="flex-1 py-1.5 px-2 bg-white border border-[#e6e4df] hover:bg-[#fbfaf8] text-[#111916] rounded text-[11px] font-semibold shadow-2xs"
                  >
                    Accept Woo Remote
                  </button>
                </div>
              </div>
            ) : (
              <div className="p-3.5 rounded-lg border border-[#bbf7d0] bg-[#f0fdf4] text-xs text-[#166534] space-y-1">
                <div className="font-bold flex items-center gap-1.5">
                  <Check className="w-4 h-4 text-[#15803d]" />
                  <span>No Conflicting Field States</span>
                </div>
                <p className="text-[11.5px] opacity-90">
                  All field differences are clean one-way updates ready for deterministic synchronization.
                </p>
              </div>
            )}

            {/* Validation Errors / Warnings */}
            {diff?.validation_errors && diff.validation_errors.length > 0 && (
              <div className="p-3 bg-[#fef2f2] border border-[#fecaca] rounded-lg text-xs text-[#dc2626] space-y-1">
                <div className="font-bold">Sync Validation Blockers</div>
                {diff.validation_errors.map((err, i) => (
                  <div key={i} className="text-[11px]">• {err}</div>
                ))}
              </div>
            )}

            {/* Confirm & Sync Action Button */}
            <div className="pt-2 border-t border-[#f4f2ec] space-y-2">
              <button
                type="button"
                disabled={approveSyncMutation.isPending || !diff?.is_ready}
                onClick={() => approveSyncMutation.mutate()}
                className="w-full py-2.5 px-4 bg-[#15803d] hover:bg-[#166534] disabled:bg-[#a7f3d0] text-white rounded-md text-xs font-semibold shadow-2xs transition-colors flex items-center justify-center gap-2"
              >
                {approveSyncMutation.isPending ? (
                  <span>Applying Changeset...</span>
                ) : (
                  <>
                    <Check className="w-4 h-4" />
                    <span>Confirm &amp; Push to WooCommerce</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => refetch()}
                className="w-full py-2 px-3 border border-[#e6e4df] bg-white hover:bg-[#f4f2ec] text-[#5c6660] rounded-md text-xs font-medium shadow-2xs transition-colors flex items-center justify-center gap-1.5"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Re-run Dry Run Inspection</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
