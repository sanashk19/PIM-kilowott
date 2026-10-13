import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../api/client';
import {
  X,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Loader2,
  Sparkles,
  RefreshCw,
  Plus,
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
  const changedCount = diffs.filter((d) => d.status === 'changed').length;
  const conflictCount = diffData?.has_conflicts ? 1 : 0;
  const validationErrorsCount = diffData?.validation_errors?.length || 0;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white border border-slate-200 rounded-lg w-full max-w-4xl shadow-xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold text-slate-900 tracking-tight">Pre-flight Sync Inspector</h2>
            <p className="text-xs text-slate-500">
              Review changes before synchronizing with WooCommerce.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content area */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {isLoading ? (
            <div className="py-20 flex flex-col items-center justify-center gap-3 text-slate-400">
              <Loader2 className="w-7 h-7 animate-spin text-violet-600" />
              <p className="text-sm font-medium">Comparing PIM state with WooCommerce target...</p>
            </div>
          ) : isError ? (
            <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm">
              Failed to inspect synchronization diff: {(error as any)?.message || 'Unknown error'}
            </div>
          ) : (
            <>
              {syncErrorMessage && (
                <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 shrink-0 text-rose-500" />
                    <span>{syncErrorMessage}</span>
                  </div>
                  <button
                    onClick={() => setSyncErrorMessage(null)}
                    className="text-rose-500 hover:text-rose-800 text-xs font-semibold"
                  >
                    Dismiss
                  </button>
                </div>
              )}

              {/* Diff Table */}
              <div className="border border-slate-200 rounded-xl overflow-hidden bg-white shadow-xs">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50/80 border-b border-slate-200 text-slate-600 font-semibold uppercase text-[11px] tracking-wider">
                    <tr>
                      <th className="py-3 px-4">Field</th>
                      <th className="py-3 px-4">PIM Sentinel (Current)</th>
                      <th className="py-3 px-4">WooCommerce (Target)</th>
                      <th className="py-3 px-4 text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {diffs.map((diff, idx) => {
                      const isMatch = diff.status === 'match';
                      const isConflict = diff.status === 'conflict';
                      const isChanged = diff.status === 'changed';

                      return (
                        <tr key={idx} className="hover:bg-slate-50/70 transition-colors">
                          <td className="py-3 px-4 font-medium text-slate-800">
                            {diff.field_label || diff.field}
                          </td>
                          <td className="py-3 px-4 text-slate-700 font-mono text-[11.5px]">
                            {typeof diff.pim_value === 'object'
                              ? JSON.stringify(diff.pim_value)
                              : String(diff.pim_value ?? '—')}
                          </td>
                          <td className="py-3 px-4 text-slate-500 font-mono text-[11.5px]">
                            {typeof diff.woo_value === 'object'
                              ? JSON.stringify(diff.woo_value)
                              : String(diff.woo_value ?? '—')}
                          </td>
                          <td className="py-3 px-4 text-center">
                            {isMatch && (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                Match
                              </span>
                            )}
                            {isChanged && (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-sky-50 text-sky-700 border border-sky-200">
                                <span className="w-1.5 h-1.5 rounded-full bg-sky-500" />
                                Changed
                              </span>
                            )}
                            {isConflict && (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-rose-50 text-rose-700 border border-rose-200">
                                <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                                Conflict
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
                <div className="p-4 rounded-xl bg-amber-50/70 border border-amber-200 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-2.5 text-xs text-amber-800">
                    <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                    <span>
                      Detected conflicting concurrent edits between PIM and WooCommerce. Choose resolution policy:
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => resolveConflictMutation.mutate('keep_pim')}
                      disabled={resolveConflictMutation.isPending}
                      className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-white border border-amber-300 text-amber-900 hover:bg-amber-100 shadow-xs"
                    >
                      Keep PIM (Overwrite Woo)
                    </button>
                    <button
                      onClick={() => resolveConflictMutation.mutate('keep_woo')}
                      disabled={resolveConflictMutation.isPending}
                      className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-white border border-amber-300 text-amber-900 hover:bg-amber-100 shadow-xs"
                    >
                      Keep Woo (Pull from Woo)
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer Bar matching image */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-5 text-xs font-medium text-slate-600">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-sky-500" />
              <span>
                <strong className="text-slate-900">{changedCount}</strong> fields changed
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-rose-500" />
              <span>
                <strong className="text-slate-900">{conflictCount}</strong> conflict detected
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              <span>
                <strong className="text-slate-900">{validationErrorsCount}</strong> validation errors
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-200/70 transition-colors"
            >
              Cancel
            </button>

            {diffData?.has_conflicts && (
              <button
                type="button"
                onClick={() => resolveConflictMutation.mutate('keep_pim')}
                className="px-3.5 py-2 rounded-xl text-xs font-semibold border border-rose-300 text-rose-700 hover:bg-rose-50 transition-colors"
              >
                Resolve Conflicts
              </button>
            )}

            <button
              type="button"
              onClick={() => syncMutation.mutate(productId)}
              disabled={syncMutation.isPending || (diffData?.has_conflicts && !conflictResolved)}
              className="flex items-center gap-2 px-4 py-1.5 rounded text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs active:scale-95 transition-all disabled:opacity-50"
            >
              {syncMutation.isPending ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  Synchronizing...
                </>
              ) : (
                'Confirm & Sync'
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
