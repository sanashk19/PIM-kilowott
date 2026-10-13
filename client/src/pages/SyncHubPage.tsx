import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../api/client';
import { SyncLog } from '../types';
import {
  ArrowLeftRight,
  CheckCircle2,
  AlertTriangle,
  Download,
  Filter,
  Eye,
  X,
  Code2,
  Clock,
  Send,
  Loader2,
} from 'lucide-react';

export const SyncHubPage: React.FC = () => {
  const queryClient = useQueryClient();

  const [selectedStatus, setSelectedStatus] = useState('all');
  const [selectedDirection, setSelectedDirection] = useState('all');
  const [inspectingLog, setInspectingLog] = useState<SyncLog | null>(null);

  const { data: logsData, isLoading } = useQuery({
    queryKey: ['sync-logs', selectedStatus, selectedDirection],
    queryFn: () =>
      api.getSyncLogs({
        status: selectedStatus,
        direction: selectedDirection,
      }),
    refetchInterval: 5000,
  });

  const importAllMutation = useMutation({
    mutationFn: () => api.importAll(),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['sync-logs'] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
      alert(res.data.message);
    },
  });

  const logs = logsData?.data || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight">Synchronization Center & Audit Trail</h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Immutable log of all bi-directional sync payloads, API responses, errors, and WooCommerce state transitions.
          </p>
        </div>

        <button
          onClick={() => importAllMutation.mutate()}
          disabled={importAllMutation.isPending}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 active:scale-95 transition-all shadow-md disabled:opacity-50"
        >
          <Download className="w-4 h-4 text-cyan-400" />
          {importAllMutation.isPending ? 'Importing from Store...' : 'Import All from WooCommerce'}
        </button>
      </div>

      {/* Filter Bar */}
      <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400">Status:</span>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
            >
              <option value="all">All Statuses</option>
              <option value="success">Success</option>
              <option value="failed">Failed</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400">Direction:</span>
            <select
              value={selectedDirection}
              onChange={(e) => setSelectedDirection(e.target.value)}
              className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
            >
              <option value="all">All Directions</option>
              <option value="pim_to_woo">PIM → WooCommerce</option>
              <option value="woo_to_pim">WooCommerce → PIM</option>
            </select>
          </div>
        </div>

        <span className="text-xs text-slate-500 font-mono">
          Showing {logs.length} audit records
        </span>
      </div>

      {/* Logs Table */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/80 overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-950/90 border-b border-slate-800 text-slate-400 uppercase text-[10px] font-semibold tracking-wider">
                <th className="py-3 px-4">Time</th>
                <th className="py-3 px-4">Direction</th>
                <th className="py-3 px-4">Action</th>
                <th className="py-3 px-4">Target Entity</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Error / Details</th>
                <th className="py-3 px-4 text-right">Payload</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-sans">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto text-indigo-500 mb-2" />
                    Loading audit trail...
                  </td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-500">
                    No sync activity logs recorded yet.
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-3 px-4 font-mono text-[11px] text-slate-400 whitespace-nowrap">
                      {new Date(log.created_at).toLocaleString()}
                    </td>

                    <td className="py-3 px-4">
                      <span
                        className={`inline-flex items-center gap-1 font-semibold text-[10px] px-2 py-0.5 rounded border ${
                          log.direction === 'pim_to_woo'
                            ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/30'
                            : 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30'
                        }`}
                      >
                        {log.direction === 'pim_to_woo' ? 'PIM → Woo' : 'Woo → PIM'}
                      </span>
                    </td>

                    <td className="py-3 px-4 font-mono text-slate-300 uppercase text-[11px]">
                      {log.action}
                    </td>

                    <td className="py-3 px-4 font-medium text-slate-200">
                      {log.product?.name || `Entity: ${log.entity_type}`}
                    </td>

                    <td className="py-3 px-4">
                      {log.status === 'success' ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-400">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          Success
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[11px] font-medium text-rose-400">
                          <AlertTriangle className="w-3.5 h-3.5" />
                          Failed
                        </span>
                      )}
                    </td>

                    <td className="py-3 px-4 text-slate-400 max-w-xs">
                      {log.error_message ? (
                        <span className="text-rose-400 font-mono text-[11px] line-clamp-1">
                          {log.error_message}
                        </span>
                      ) : (
                        <span className="text-slate-500 text-[11px]">Clean execution</span>
                      )}
                    </td>

                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => setInspectingLog(log)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 transition-colors"
                      >
                        <Eye className="w-3.5 h-3.5 text-indigo-400" />
                        Inspect
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Inspect Log Modal */}
      {inspectingLog && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/90">
              <div className="flex items-center gap-2">
                <Code2 className="w-5 h-5 text-indigo-400" />
                <h3 className="text-base font-semibold text-white">
                  Audit Log #{inspectingLog.id} Payload Inspector
                </h3>
              </div>
              <button
                onClick={() => setInspectingLog(null)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-4">
              <div className="grid grid-cols-2 gap-4 text-xs p-3 rounded-xl bg-slate-950 border border-slate-800">
                <div>
                  <span className="text-slate-500">Direction:</span>{' '}
                  <strong className="text-slate-200">{inspectingLog.direction}</strong>
                </div>
                <div>
                  <span className="text-slate-500">Status:</span>{' '}
                  <strong className={inspectingLog.status === 'success' ? 'text-emerald-400' : 'text-rose-400'}>
                    {inspectingLog.status}
                  </strong>
                </div>
                <div>
                  <span className="text-slate-500">Timestamp:</span>{' '}
                  <span className="font-mono text-slate-300">{new Date(inspectingLog.created_at).toISOString()}</span>
                </div>
                <div>
                  <span className="text-slate-500">Action:</span>{' '}
                  <span className="font-mono text-slate-300">{inspectingLog.action}</span>
                </div>
              </div>

              {inspectingLog.error_message && (
                <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs font-mono">
                  <strong>Error Message:</strong>
                  <p className="mt-1">{inspectingLog.error_message}</p>
                </div>
              )}

              {/* Request Payload */}
              <div>
                <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                  Request Payload Sent:
                </h4>
                <pre className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-indigo-300 text-xs font-mono overflow-x-auto max-h-48">
                  {JSON.stringify(inspectingLog.request_payload, null, 2) || '(None)'}
                </pre>
              </div>

              {/* Response Payload */}
              <div>
                <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                  Response Payload Received:
                </h4>
                <pre className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-emerald-300 text-xs font-mono overflow-x-auto max-h-48">
                  {JSON.stringify(inspectingLog.response_payload, null, 2) || '(None)'}
                </pre>
              </div>
            </div>

            <div className="px-6 py-3 border-t border-slate-800 flex justify-end">
              <button
                onClick={() => setInspectingLog(null)}
                className="px-4 py-2 rounded-lg text-xs font-medium bg-slate-800 text-slate-200 hover:bg-slate-700"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
