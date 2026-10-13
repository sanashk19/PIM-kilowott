import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../api/client';
import {
  X,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  ArrowRight,
  Send,
  Loader2,
  Code2,
  Table as TableIcon,
  ShieldCheck,
  Zap,
} from 'lucide-react';

interface Props {
  productId: number | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export const PreFlightDiffModal: React.FC<Props> = ({ productId, isOpen, onClose, onSuccess }) => {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<'diff' | 'payload'>('diff');
  const [syncErrorMessage, setSyncErrorMessage] = useState<string | null>(null);

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['preflight-diff', productId],
    queryFn: () => (productId ? api.getPreFlightDiff(productId) : Promise.reject('No ID')),
    enabled: isOpen && !!productId,
  });

  const syncMutation = useMutation({
    mutationFn: (id: number) => api.pushProduct(id),
    onSuccess: () => {
      setSyncErrorMessage(null);
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
      queryClient.invalidateQueries({ queryKey: ['sync-logs'] });
      queryClient.invalidateQueries({ queryKey: ['mock-store-products'] });
      if (onSuccess) onSuccess();
      onClose();
    },
    onError: (err: any) => {
      setSyncErrorMessage(err.message || 'Synchronization failed.');
    },
  });

  if (!isOpen || !productId) return null;

  const diffData = data?.data;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-4xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/90">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center">
              <ShieldCheck className="w-5 h-5 text-indigo-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-semibold text-white">Pre-Flight Synchronization Inspector</h2>
                <span className="text-[11px] font-mono uppercase px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  Feature Differentiator
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Inspect local PIM changes and validate WooCommerce API readiness before publishing.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {isLoading && (
            <div className="flex flex-col items-center justify-center py-16 text-slate-400">
              <Loader2 className="w-8 h-8 animate-spin text-indigo-500 mb-3" />
              <p className="text-sm">Analyzing product data and fetching WooCommerce state...</p>
            </div>
          )}

          {isError && (
            <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-sm flex items-start gap-3">
              <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
              <div>
                <p className="font-medium">Error loading pre-flight diff</p>
                <p className="text-xs text-rose-400 mt-1">{(error as any)?.message || 'Could not fetch diff data.'}</p>
                <button
                  onClick={() => refetch()}
                  className="mt-2 text-xs font-medium text-rose-300 underline hover:text-rose-200"
                >
                  Try Again
                </button>
              </div>
            </div>
          )}

          {diffData && (
            <>
              {/* Product Target Banner */}
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex flex-wrap items-center justify-between gap-4">
                <div>
                  <span className="text-[11px] font-mono text-slate-400">TARGET PRODUCT</span>
                  <h3 className="text-base font-medium text-white">{diffData.product_name}</h3>
                  <div className="flex items-center gap-3 mt-1 text-xs text-slate-400">
                    <span>SKU: <code className="text-indigo-400 font-mono">{diffData.sku}</code></span>
                    <span>•</span>
                    <span>Operation: <strong className="text-white uppercase">{diffData.action === 'create' ? 'Create in WooCommerce' : `Update Remote #${diffData.woo_id}`}</strong></span>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  {diffData.is_ready ? (
                    <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-medium">
                      <CheckCircle2 className="w-4 h-4" />
                      Pre-Flight Validated
                    </div>
                  ) : (
                    <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-medium">
                      <AlertCircle className="w-4 h-4" />
                      Validation Failed
                    </div>
                  )}

                  {diffData.has_changes ? (
                    <span className="px-2.5 py-1 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-medium">
                      Changes Detected
                    </span>
                  ) : (
                    <span className="px-2.5 py-1 rounded-lg bg-slate-800 text-slate-400 text-xs font-medium">
                      In Sync (No Diff)
                    </span>
                  )}
                </div>
              </div>

              {/* Validation Warnings / Errors */}
              {diffData.validation_errors.length > 0 && (
                <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs space-y-1">
                  <p className="font-semibold flex items-center gap-1.5">
                    <AlertCircle className="w-4 h-4" />
                    Blocking Validation Errors:
                  </p>
                  <ul className="list-disc list-inside space-y-0.5 text-rose-300/90 pl-1">
                    {diffData.validation_errors.map((err, idx) => (
                      <li key={idx}>{err}</li>
                    ))}
                  </ul>
                </div>
              )}

              {diffData.validation_warnings.length > 0 && (
                <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs space-y-1">
                  <p className="font-semibold flex items-center gap-1.5">
                    <AlertTriangle className="w-4 h-4" />
                    Advisory Warnings:
                  </p>
                  <ul className="list-disc list-inside space-y-0.5 text-amber-300/90 pl-1">
                    {diffData.validation_warnings.map((warn, idx) => (
                      <li key={idx}>{warn}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Sync Failure Error Notice (if sync button was clicked and errored) */}
              {syncErrorMessage && (
                <div className="p-4 rounded-xl bg-rose-500/15 border border-rose-500/40 text-rose-200 text-xs flex items-start gap-2.5">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-400" />
                  <div>
                    <span className="font-semibold">Synchronization Attempt Failed:</span>
                    <p className="mt-0.5 text-rose-300">{syncErrorMessage}</p>
                    <p className="mt-1 text-[11px] text-rose-400">
                      Tip: If this is a simulated error demonstration, you can disable "Simulate Network Failure" in Settings or change the SKU.
                    </p>
                  </div>
                </div>
              )}

              {/* View Mode Tabs */}
              <div className="flex items-center gap-2 border-b border-slate-800">
                <button
                  onClick={() => setActiveTab('diff')}
                  className={`flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium border-b-2 transition-colors ${
                    activeTab === 'diff'
                      ? 'border-indigo-500 text-indigo-400'
                      : 'border-transparent text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <TableIcon className="w-3.5 h-3.5" />
                  Visual Field Diff ({diffData.diffs.length} fields)
                </button>
                <button
                  onClick={() => setActiveTab('payload')}
                  className={`flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium border-b-2 transition-colors ${
                    activeTab === 'payload'
                      ? 'border-indigo-500 text-indigo-400'
                      : 'border-transparent text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Code2 className="w-3.5 h-3.5" />
                  Outgoing WooCommerce REST Payload (JSON)
                </button>
              </div>

              {/* Tab 1: Visual Side-by-Side Diff Table */}
              {activeTab === 'diff' && (
                <div className="rounded-xl border border-slate-800 overflow-hidden bg-slate-950">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-slate-900/80 border-b border-slate-800 text-slate-400 font-semibold uppercase text-[10px] tracking-wider">
                        <th className="py-2.5 px-3 w-36">Field</th>
                        <th className="py-2.5 px-3">PIM Hub Value</th>
                        <th className="py-2.5 px-3">WooCommerce State</th>
                        <th className="py-2.5 px-3 w-28 text-center">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60 font-mono">
                      {diffData.diffs.map((diff) => (
                        <tr
                          key={diff.field}
                          className={`transition-colors ${
                            diff.is_different
                              ? 'bg-indigo-500/5 hover:bg-indigo-500/10'
                              : 'hover:bg-slate-900/50'
                          }`}
                        >
                          <td className="py-2.5 px-3 font-sans font-medium text-slate-300">
                            {diff.label}
                          </td>
                          <td className="py-2.5 px-3 text-slate-200 break-all">
                            <span
                              className={
                                diff.is_different
                                  ? 'bg-indigo-500/20 text-indigo-300 px-1.5 py-0.5 rounded border border-indigo-500/30'
                                  : 'text-slate-300'
                              }
                            >
                              {diff.pim_value || <span className="text-slate-600 font-sans italic">(empty)</span>}
                            </span>
                          </td>
                          <td className="py-2.5 px-3 text-slate-400 break-all">
                            {diff.woo_value || <span className="text-slate-600 font-sans italic">(none)</span>}
                          </td>
                          <td className="py-2.5 px-3 text-center">
                            {diff.diff_type === 'new' && (
                              <span className="inline-block px-2 py-0.5 rounded text-[10px] font-semibold bg-cyan-500/15 text-cyan-400 border border-cyan-500/30">
                                NEW
                              </span>
                            )}
                            {diff.diff_type === 'modified' && (
                              <span className="inline-block px-2 py-0.5 rounded text-[10px] font-semibold bg-amber-500/15 text-amber-300 border border-amber-500/30">
                                CHANGED
                              </span>
                            )}
                            {diff.diff_type === 'unchanged' && (
                              <span className="inline-block px-2 py-0.5 rounded text-[10px] text-slate-500">
                                Match
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Tab 2: Raw JSON Payload Preview */}
              {activeTab === 'payload' && (
                <div className="space-y-4">
                  <div>
                    <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                      Mapped WooCommerce v3 REST API Payload:
                    </h4>
                    <pre className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-indigo-300 text-xs font-mono overflow-x-auto max-h-72">
                      {JSON.stringify(diffData.payload_preview, null, 2)}
                    </pre>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 border-t border-slate-800 bg-slate-900/90 flex items-center justify-between">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-xs font-medium text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
          >
            Cancel
          </button>

          <div className="flex items-center gap-3">
            <button
              onClick={() => syncMutation.mutate(productId)}
              disabled={!diffData?.is_ready || syncMutation.isPending}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-xs font-semibold shadow-lg transition-all ${
                diffData?.is_ready && !syncMutation.isPending
                  ? 'bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white shadow-indigo-500/20 active:scale-95'
                  : 'bg-slate-800 text-slate-500 cursor-not-allowed'
              }`}
            >
              {syncMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Synchronizing with WooCommerce...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  Confirm & Push to WooCommerce
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
