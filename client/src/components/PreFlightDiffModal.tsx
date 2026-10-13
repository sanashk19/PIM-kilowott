import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../api/client';
import {
  X,
  AlertTriangle,
  Loader2,
  Check,
  ShieldAlert,
  ShieldCheck,
} from 'lucide-react';

interface Props {
  productId: number | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export const PreFlightDiffModal: React.FC<Props> = ({ productId, isOpen, onClose, onSuccess }) => {
  const queryClient = useQueryClient();
  const [syncErrorMessage, setSyncErrorMessage] = useState<string | null>(null);
  const [conflictResolved, setConflictResolved] = useState(false);

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

  const resolveConflictMutation = useMutation({
    mutationFn: (resolution: 'keep_pim' | 'keep_woo') =>
      productId ? api.resolveConflict(productId, resolution) : Promise.reject(),
    onSuccess: () => {
      setConflictResolved(true);
      refetch();
    },
  });

  if (!isOpen || !productId) return null;

  const diffData = data?.data;
  const diffs = diffData?.diffs || [];
  const blastRadius = diffData?.blast_radius;
  const changedCount = diffs.filter((d) => d.is_different).length;
  const conflictCount = diffs.filter((d) => d.three_way_status === 'CONFLICT').length;
  const validationErrorsCount = diffData?.validation_errors?.length || 0;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white border border-[#e6e4df] rounded-lg w-full max-w-4xl shadow-xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-5 py-4 border-b border-[#e6e4df] flex items-center justify-between bg-[#fbfaf8]">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold text-[#111916] tracking-tight">
                Three-Way Pre-Flight Diff Inspector
              </h2>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-[#f4f2ec] text-[#5c6660] border border-[#e6e4df]">
                VERIDEX Engine
              </span>
            </div>
            <p className="text-xs text-[#5c6660] mt-0.5">
              Reconciles BASELINE state with PIM catalog and WooCommerce storefront before applying.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded text-[#8a948e] hover:text-[#111916] hover:bg-[#f4f2ec] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content area */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {isLoading ? (
            <div className="py-20 flex flex-col items-center justify-center gap-3 text-[#7d8b82]">
              <Loader2 className="w-7 h-7 animate-spin text-[#15803d]" />
              <p className="text-xs font-medium">Reconciling Three-Way Diff against baseline snapshot...</p>
            </div>
          ) : isError ? (
            <div className="p-4 rounded-lg bg-[#fef2f2] border border-[#fecaca] text-[#dc2626] text-xs">
              Failed to inspect synchronization diff: {(error as any)?.message || 'Unknown error'}
            </div>
          ) : (
            <>
              {/* Blast Radius Impact Summary */}
              {blastRadius && (
                <div className={`p-3.5 rounded-lg border text-xs flex items-center justify-between ${
                  blastRadius.risk_level === 'HIGH'
                    ? 'bg-[#fef2f2] border-[#fca5a5] text-[#991b1b]'
                    : blastRadius.risk_level === 'MEDIUM'
                    ? 'bg-[#fffbeb] border-[#fde68a] text-[#92400e]'
                    : 'bg-[#f0fdf4] border-[#bbf7d0] text-[#166534]'
                }`}>
                  <div className="flex items-center gap-2.5">
                    {blastRadius.risk_level === 'HIGH' ? (
                      <ShieldAlert className="w-4 h-4 text-[#dc2626] shrink-0" />
                    ) : (
                      <ShieldCheck className="w-4 h-4 text-[#15803d] shrink-0" />
                    )}
                    <div>
                      <strong className="uppercase tracking-wider mr-1 text-[11px]">
                        Sync Blast Radius: {blastRadius.risk_level}
                      </strong>
                      <span className="opacity-90">{blastRadius.risk_reason}</span>
                    </div>
                  </div>
                </div>
              )}

              {syncErrorMessage && (
                <div className="p-3.5 rounded-lg bg-[#fef2f2] border border-[#fecaca] text-[#dc2626] text-xs flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 shrink-0 text-[#dc2626]" />
                    <span>{syncErrorMessage}</span>
                  </div>
                  <button
                    onClick={() => setSyncErrorMessage(null)}
                    className="text-[#dc2626] hover:text-[#991b1b] text-xs font-semibold"
                  >
                    Dismiss
                  </button>
                </div>
              )}

              {/* Three-Way Diff Table */}
              <div className="border border-[#e6e4df] rounded-lg overflow-hidden bg-white shadow-2xs">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#fbfaf8] border-b border-[#e6e4df] text-[#5c6660] font-semibold text-[11px]">
                    <tr>
                      <th className="py-2.5 px-3.5">Field</th>
                      <th className="py-2.5 px-3.5 text-[#7d8b82]">Baseline (Last Sync)</th>
                      <th className="py-2.5 px-3.5 text-[#15803d]">VERIDEX (PIM)</th>
                      <th className="py-2.5 px-3.5 text-[#1d4ed8]">WooCommerce (Target)</th>
                      <th className="py-2.5 px-3.5 text-center">Three-Way Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#f4f2ec]">
                    {diffs.map((diffItem, idx) => {
                      const isMatch = diffItem.three_way_status === 'MATCH';
                      const isConflict = diffItem.three_way_status === 'CONFLICT';
                      const isPimChanged = diffItem.three_way_status === 'PIM_CHANGED';
                      const isWooChanged = diffItem.three_way_status === 'WOO_CHANGED';

                      return (
                        <tr key={idx} className={`transition-colors ${isConflict ? 'bg-[#fff8f8]' : 'hover:bg-[#fbfaf8]'}`}>
                          <td className="py-2.5 px-3.5 font-medium text-[#111916]">
                            {diffItem.label || diffItem.field}
                          </td>
                          <td className="py-2.5 px-3.5 text-[#7d8b82] font-mono text-[11px]">
                            {diffItem.baseline_value || '—'}
                          </td>
                          <td className={`py-2.5 px-3.5 font-mono text-[11px] ${isPimChanged ? 'font-bold text-[#047857]' : 'text-[#111916]'}`}>
                            {diffItem.pim_value || '—'}
                          </td>
                          <td className={`py-2.5 px-3.5 font-mono text-[11px] ${isWooChanged ? 'font-bold text-[#1d4ed8]' : 'text-[#5c6660]'}`}>
                            {diffItem.woo_value || '—'}
                          </td>
                          <td className="py-2.5 px-3.5 text-center">
                            {isMatch && (
                              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#f0fdf4] text-[#15803d] border border-[#bbf7d0]">
                                MATCH
                              </span>
                            )}
                            {isPimChanged && (
                              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#ecfdf5] text-[#047857] border border-[#a7f3d0]">
                                PIM CHANGED
                              </span>
                            )}
                            {isWooChanged && (
                              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#eff6ff] text-[#1d4ed8] border border-[#bfdbfe]">
                                WOO CHANGED
                              </span>
                            )}
                            {isConflict && (
                              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#fee2e2] text-[#b91c1c] border border-[#fca5a5]">
                                CONFLICT
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Conflict resolution quick action if detected */}
              {diffData?.has_conflicts && !conflictResolved && (
                <div className="p-3.5 rounded-lg bg-[#fff8f8] border border-[#fca5a5] flex items-center justify-between gap-4">
                  <div className="flex items-center gap-2 text-xs text-[#991b1b]">
                    <AlertTriangle className="w-4 h-4 text-[#dc2626] shrink-0" />
                    <span>
                      Concurrent edits detected. Source-of-truth policy recommendation: <strong>Keep PIM</strong>
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => resolveConflictMutation.mutate('keep_pim')}
                      disabled={resolveConflictMutation.isPending}
                      className="px-3 py-1.5 rounded text-xs font-semibold bg-white border border-[#e6e4df] hover:bg-[#fbfaf8] text-[#111916] shadow-2xs"
                    >
                      Keep PIM
                    </button>
                    <button
                      onClick={() => resolveConflictMutation.mutate('keep_woo')}
                      disabled={resolveConflictMutation.isPending}
                      className="px-3 py-1.5 rounded text-xs font-semibold bg-white border border-[#e6e4df] hover:bg-[#fbfaf8] text-[#111916] shadow-2xs"
                    >
                      Keep WooCommerce
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer Bar */}
        <div className="px-6 py-4 bg-[#fbfaf8] border-t border-[#e6e4df] flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4 text-xs font-medium text-[#5c6660]">
            <div>
              <strong className="text-[#111916]">{changedCount}</strong> fields changed
            </div>
            <div>
              <strong className={conflictCount > 0 ? 'text-[#dc2626]' : 'text-[#111916]'}>{conflictCount}</strong> conflicts
            </div>
            <div>
              <strong className={validationErrorsCount > 0 ? 'text-[#dc2626]' : 'text-[#15803d]'}>{validationErrorsCount}</strong> blockers
            </div>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              onClick={onClose}
              className="flex-1 sm:flex-none px-4 py-2 text-xs font-semibold border border-[#e6e4df] bg-white text-[#5c6660] hover:bg-[#f4f2ec] rounded-md transition-colors"
            >
              Cancel
            </button>
            <button
              disabled={syncMutation.isPending || (diffData ? !diffData.is_ready : false)}
              onClick={() => syncMutation.mutate(productId)}
              className="flex-1 sm:flex-none px-4 py-2 text-xs font-semibold bg-[#15803d] hover:bg-[#166534] disabled:bg-[#a7f3d0] text-white rounded-md shadow-2xs transition-colors flex items-center justify-center gap-1.5"
            >
              {syncMutation.isPending ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Synchronizing...</span>
                </>
              ) : (
                <>
                  <Check className="w-3.5 h-3.5" />
                  <span>Confirm &amp; Push to Store</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
