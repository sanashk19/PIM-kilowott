import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../api/client';
import {
  History,
  CheckCircle2,
  AlertCircle,
  Clock,
  ArrowRight,
  Eye,
  X,
  ChevronDown,
  RotateCcw,
  FileCode,
  ShieldCheck,
  AlertTriangle,
  Check,
} from 'lucide-react';
import { TopBar } from '../components/TopBar';
import type { SyncLog } from '../types';

export const SyncHistoryPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [selectedDirection, setSelectedDirection] = useState('all');
  const [selectedTimeRange, setSelectedTimeRange] = useState('Last 7 days');
  const [selectedLog, setSelectedLog] = useState<SyncLog | null>(null);
  const [rollbackCandidateLog, setRollbackCandidateLog] = useState<SyncLog | null>(null);
  const [actionMessage, setActionMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const { data: logsData, isLoading } = useQuery({
    queryKey: ['sync-logs', selectedDirection],
    queryFn: () =>
      api.getSyncLogs({
        direction: selectedDirection !== 'all' ? selectedDirection : undefined,
      }),
    refetchInterval: 5000,
  });

  const logs = logsData?.data || [];

  const rollbackMutation = useMutation({
    mutationFn: (logId: number) => api.rollbackSync(logId),
    onSuccess: (res) => {
      setActionMessage({
        type: 'success',
        text: res.message || 'Rollback executed successfully. New immutable audit record created.',
      });
      setRollbackCandidateLog(null);
      queryClient.invalidateQueries({ queryKey: ['sync-logs'] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
    },
    onError: (err: any) => {
      setActionMessage({
        type: 'error',
        text: err?.message || 'Rollback failed.',
      });
    },
  });

  return (
    <div className="flex-1 bg-white min-h-screen flex flex-col">
      <TopBar breadcrumbs={['Operations', 'Sync History & Audit Ledger']} />

      <div className="p-6 max-w-7xl w-full mx-auto space-y-6">
        {/* Header Row */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-[#111916] tracking-tight">
                Immutable Synchronization Ledger
              </h1>
              <span className="px-2 py-0.5 rounded text-[11px] font-bold uppercase tracking-wider bg-[#f0fdf4] text-[#15803d] border border-[#bbf7d0]">
                Audit Trail
              </span>
            </div>
            <p className="text-xs text-[#5c6660] mt-0.5">
              Cryptographically verified audit trail with one-click snapshot rollback capability.
            </p>
          </div>

          <div className="flex items-center gap-2">
            {/* Direction Filter */}
            <div className="relative">
              <select
                value={selectedDirection}
                onChange={(e) => setSelectedDirection(e.target.value)}
                className="appearance-none bg-white border border-[#e6e4df] text-xs font-semibold text-[#111916] pl-3 pr-8 py-1.5 rounded-md shadow-2xs hover:border-[#cbd5e1] focus:outline-none focus:ring-1 focus:ring-[#15803d]"
              >
                <option value="all">All Directions</option>
                <option value="pim_to_woo">PIM → Woo</option>
                <option value="woo_to_pim">Woo → PIM</option>
                <option value="rollback">Rollback Events</option>
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-[#8a948e] absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>

            {/* Time Filter */}
            <div className="relative">
              <select
                value={selectedTimeRange}
                onChange={(e) => setSelectedTimeRange(e.target.value)}
                className="appearance-none bg-white border border-[#e6e4df] text-xs font-semibold text-[#111916] pl-3 pr-8 py-1.5 rounded-md shadow-2xs hover:border-[#cbd5e1] focus:outline-none focus:ring-1 focus:ring-[#15803d]"
              >
                <option>Last 7 days</option>
                <option>Last 24 hours</option>
                <option>Last 30 days</option>
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-[#8a948e] absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>
        </div>

        {/* Action message toast */}
        {actionMessage && (
          <div
            className={`p-3.5 rounded-lg border text-xs flex items-center justify-between ${
              actionMessage.type === 'success'
                ? 'bg-[#f0fdf4] border-[#bbf7d0] text-[#15803d]'
                : 'bg-[#fef2f2] border-[#fecaca] text-[#dc2626]'
            }`}
          >
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{actionMessage.text}</span>
            </div>
            <button
              type="button"
              onClick={() => setActionMessage(null)}
              className="font-bold text-sm ml-2"
            >
              ×
            </button>
          </div>
        )}

        {/* Enterprise Audit Table */}
        <div className="bg-white border border-[#e6e4df] rounded-lg shadow-2xs overflow-hidden">
          <div className="overflow-x-auto w-full min-w-[840px]">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-[#fbfaf8] border-b border-[#e6e4df] text-[#5c6660]">
                  <th className="py-2.5 px-4 font-semibold">Time</th>
                  <th className="py-2.5 px-4 font-semibold">Product</th>
                  <th className="py-2.5 px-4 font-semibold">Direction</th>
                  <th className="py-2.5 px-4 font-semibold">Operation</th>
                  <th className="py-2.5 px-4 font-semibold">Status</th>
                  <th className="py-2.5 px-4 font-semibold">Changed Fields</th>
                  <th className="py-2.5 px-4 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#f4f2ec]">
                {isLoading ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-[#7d8b82]">
                      Loading audit ledger...
                    </td>
                  </tr>
                ) : logs.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-[#7d8b82]">
                      No audit events recorded in this time range.
                    </td>
                  </tr>
                ) : (
                  logs.map((log) => {
                    const changedFields: string[] = Array.isArray(log.changed_fields)
                      ? log.changed_fields
                      : typeof log.changed_fields === 'string'
                      ? JSON.parse(log.changed_fields || '[]')
                      : [];

                    const isSuccess = log.status === 'success';
                    const isRollback = log.direction === 'rollback' || log.action === 'rollback';
                    const isPimToWoo = log.direction === 'pim_to_woo';
                    const hasRollbackSnapshot = Boolean(log.previous_snapshot);

                    const timeAgo = (() => {
                      const diffMs = Date.now() - new Date(log.created_at).getTime();
                      const mins = Math.floor(diffMs / 60000);
                      if (mins < 60) return `${Math.max(1, mins)} min ago`;
                      const hours = Math.floor(mins / 60);
                      if (hours < 24) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
                      return new Date(log.created_at).toLocaleDateString();
                    })();

                    return (
                      <tr
                        key={log.id}
                        className="hover:bg-[#fbfaf8] transition-colors cursor-pointer group"
                      >
                        {/* Time */}
                        <td className="py-3 px-4 font-medium text-[#5c6660] tabular-nums whitespace-nowrap">
                          {timeAgo}
                        </td>

                        {/* Product */}
                        <td className="py-3 px-4 font-semibold text-[#111916]">
                          {log.product_name || `Product #${log.product_id}`}
                        </td>

                        {/* Direction */}
                        <td className="py-3 px-4">
                          <span
                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-medium ${
                              isRollback
                                ? 'bg-[#fef2f2] text-[#b91c1c] border border-[#fca5a5]'
                                : isPimToWoo
                                ? 'bg-[#f0fdf4] text-[#15803d] border border-[#bbf7d0]'
                                : 'bg-[#eff6ff] text-[#1d4ed8] border border-[#bfdbfe]'
                            }`}
                          >
                            {isRollback ? 'Rollback Event' : isPimToWoo ? 'PIM → Woo' : 'Woo → PIM'}
                          </span>
                        </td>

                        {/* Operation */}
                        <td className="py-3 px-4 text-[#5c6660] capitalize">
                          {log.action.replace('_', ' ')}
                        </td>

                        {/* Status */}
                        <td className="py-3 px-4">
                          {isSuccess ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-[#f0fdf4] text-[#15803d] border border-[#bbf7d0]">
                              <span className="w-1.5 h-1.5 rounded-full bg-[#15803d]" />
                              Success
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-[#fef2f2] text-[#b91c1c] border border-[#fca5a5]">
                              <span className="w-1.5 h-1.5 rounded-full bg-[#dc2626]" />
                              Failed
                            </span>
                          )}
                        </td>

                        {/* Changed Fields */}
                        <td className="py-3 px-4">
                          <div className="flex flex-wrap gap-1 max-w-xs">
                            {changedFields.length > 0 ? (
                              changedFields.slice(0, 3).map((f, i) => (
                                <span
                                  key={i}
                                  className="px-1.5 py-0.5 bg-[#f4f2ec] text-[#5c6660] rounded text-[10px] font-mono"
                                >
                                  {f}
                                </span>
                              ))
                            ) : (
                              <span className="text-[#8a948e]">—</span>
                            )}
                            {changedFields.length > 3 && (
                              <span className="text-[10px] text-[#7d8b82]">
                                +{changedFields.length - 3}
                              </span>
                            )}
                          </div>
                        </td>

                        {/* Actions (Rollback & Payload) */}
                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {hasRollbackSnapshot && !isRollback && isSuccess && (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setRollbackCandidateLog(log);
                                }}
                                className="inline-flex items-center gap-1 px-2 py-1 rounded bg-white hover:bg-[#fff8f8] border border-[#fca5a5] text-[11px] font-semibold text-[#dc2626] transition-colors shadow-2xs"
                                title="Revert to state before this sync"
                              >
                                <RotateCcw className="w-3 h-3 text-[#dc2626]" />
                                <span>Rollback</span>
                              </button>
                            )}

                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedLog(log);
                              }}
                              className="inline-flex items-center gap-1 px-2 py-1 rounded bg-white hover:bg-[#f4f2ec] border border-[#e6e4df] text-[11px] font-medium text-[#19201d] transition-colors shadow-2xs"
                            >
                              <FileCode className="w-3 h-3 text-[#5c6660]" />
                              <span>Payload</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* ONE-CLICK ROLLBACK CONFIRMATION MODAL */}
      {rollbackCandidateLog && (
        <div className="fixed inset-0 z-50 bg-[#111916]/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-white rounded-lg shadow-2xl border border-[#e6e4df] p-6 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-[#e6e4df]">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-full bg-[#fee2e2] text-[#dc2626] flex items-center justify-center">
                  <RotateCcw className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-[#111916]">
                    Confirm One-Click Rollback
                  </h3>
                  <p className="text-[11px] text-[#5c6660]">
                    Audit Record #{rollbackCandidateLog.id} · {rollbackCandidateLog.product_name}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setRollbackCandidateLog(null)}
                className="p-1 rounded text-[#8a948e] hover:text-[#111916]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-[#5c6660] leading-relaxed">
              This action will revert <strong>{rollbackCandidateLog.product_name}</strong> back to the exact snapshot recorded prior to this sync operation, and immediately reconcile both VERIDEX PIM and WooCommerce.
            </p>

            {/* Snapshot Values to Restore */}
            <div className="bg-[#fbfaf8] border border-[#e6e4df] rounded-lg p-3.5 space-y-2 text-xs">
              <div className="font-bold text-[#111916] text-[11px] uppercase tracking-wider">
                State Snapshot to Restore:
              </div>
              <div className="font-mono text-[11px] space-y-1 text-[#111916]">
                {rollbackCandidateLog.previous_snapshot?.regular_price !== undefined && (
                  <div>• Regular Price: ₹{String(rollbackCandidateLog.previous_snapshot?.regular_price)}</div>
                )}
                {rollbackCandidateLog.previous_snapshot?.stock_quantity !== undefined && (
                  <div>• Stock Inventory: {String(rollbackCandidateLog.previous_snapshot?.stock_quantity)} units</div>
                )}
                {rollbackCandidateLog.previous_snapshot?.description ? (
                  <div className="line-clamp-2">• Description: {String(rollbackCandidateLog.previous_snapshot?.description).replace(/<[^>]*>/g, '')}</div>
                ) : null}
              </div>
            </div>

            <div className="p-3 bg-[#f0fdf4] border border-[#bbf7d0] rounded-md text-[11px] text-[#166534] flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-[#15803d] shrink-0" />
              <span>
                <strong>Immutable Guarantee:</strong> Original record #{rollbackCandidateLog.id} will remain untouched. A new rollback event will be appended to the ledger.
              </span>
            </div>

            <div className="pt-2 flex items-center justify-end gap-2 border-t border-[#f4f2ec]">
              <button
                type="button"
                onClick={() => setRollbackCandidateLog(null)}
                className="px-4 py-2 border border-[#e6e4df] bg-white hover:bg-[#f4f2ec] text-[#5c6660] rounded-md text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={rollbackMutation.isPending}
                onClick={() => rollbackMutation.mutate(rollbackCandidateLog.id)}
                className="px-4 py-2 bg-[#dc2626] hover:bg-[#b91c1c] disabled:bg-[#fca5a5] text-white rounded-md text-xs font-semibold shadow-2xs flex items-center gap-1.5"
              >
                {rollbackMutation.isPending ? (
                  <span>Restoring State...</span>
                ) : (
                  <>
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Confirm &amp; Restore State</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Slide-out Payload Drawer Modal */}
      {selectedLog && (
        <div className="fixed inset-0 z-50 bg-[#111916]/40 backdrop-blur-xs flex justify-end">
          <div className="w-full max-w-lg bg-white h-full shadow-2xl flex flex-col p-6 space-y-4 animate-in slide-in-from-right duration-200 overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-[#e6e4df]">
              <div>
                <h3 className="font-bold text-sm text-[#111916]">
                  Sync Audit Record #{selectedLog.id}
                </h3>
                <div className="text-xs text-[#7d8b82]">
                  {selectedLog.product_name} · {selectedLog.direction}
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedLog(null)}
                className="p-1 rounded-md text-[#7d8b82] hover:text-[#111916] hover:bg-[#f4f2ec]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {selectedLog.error_message && (
              <div className="p-3 bg-[#fef2f2] border border-[#fecaca] text-[#dc2626] rounded-md text-xs">
                <div className="font-bold mb-1">Execution Error</div>
                <div>{selectedLog.error_message}</div>
              </div>
            )}

            <div className="space-y-3 text-xs">
              <div>
                <div className="font-bold text-[#111916] mb-1">Request Payload</div>
                <pre className="p-3 bg-[#111916] text-[#86efac] font-mono text-[11px] rounded-lg overflow-x-auto max-h-56">
                  {typeof selectedLog.request_payload === 'string'
                    ? selectedLog.request_payload
                    : JSON.stringify(selectedLog.request_payload, null, 2)}
                </pre>
              </div>

              <div>
                <div className="font-bold text-[#111916] mb-1">Response Payload</div>
                <pre className="p-3 bg-[#111916] text-[#93c5fd] font-mono text-[11px] rounded-lg overflow-x-auto max-h-56">
                  {typeof selectedLog.response_payload === 'string'
                    ? selectedLog.response_payload
                    : JSON.stringify(selectedLog.response_payload, null, 2)}
                </pre>
              </div>

              {selectedLog.previous_snapshot && (
                <div>
                  <div className="font-bold text-[#111916] mb-1">Rollback Pre-Sync Snapshot</div>
                  <pre className="p-3 bg-[#111916] text-[#fde047] font-mono text-[11px] rounded-lg overflow-x-auto max-h-48">
                    {JSON.stringify(selectedLog.previous_snapshot, null, 2)}
                  </pre>
                </div>
              )}
            </div>

            <div className="pt-4 border-t border-[#e6e4df] flex justify-end">
              <button
                type="button"
                onClick={() => setSelectedLog(null)}
                className="px-4 py-2 rounded-md bg-[#111916] text-white text-xs font-semibold"
              >
                Close Audit Detail
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
