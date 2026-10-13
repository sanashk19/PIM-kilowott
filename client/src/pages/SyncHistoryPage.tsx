import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
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
  Layers,
  FileCode,
} from 'lucide-react';
import { TopBar } from '../components/TopBar';
import type { SyncLog } from '../types';

export const SyncHistoryPage: React.FC = () => {
  const [selectedDirection, setSelectedDirection] = useState('all');
  const [selectedTimeRange, setSelectedTimeRange] = useState('Last 7 days');
  const [selectedLog, setSelectedLog] = useState<SyncLog | null>(null);

  const { data: logsData, isLoading } = useQuery({
    queryKey: ['sync-logs', selectedDirection],
    queryFn: () =>
      api.getSyncLogs({
        direction: selectedDirection !== 'all' ? selectedDirection : undefined,
      }),
    refetchInterval: 5000,
  });

  const logs = logsData?.data || [];

  return (
    <div className="flex-1 bg-[#fbfaf8] min-h-screen flex flex-col">
      <TopBar breadcrumbs={['Operations', 'Sync History']} />

      <div className="p-6 max-w-7xl w-full mx-auto space-y-6">
        {/* Header Row (Panel 7) */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold text-[#111916] tracking-tight">
              Synchronization History
            </h1>
            <p className="text-xs text-[#5c6660] mt-0.5">
              Immutable ledger of inbound and outbound product synchronization.
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

        {/* Enterprise Audit Table (Panel 7) */}
        <div className="bg-white border border-[#e6e4df] rounded-lg shadow-2xs overflow-hidden">
          <div className="overflow-x-auto w-full min-w-[760px]">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-[#fbfaf8] border-b border-[#e6e4df] text-[#5c6660]">
                  <th className="py-2.5 px-4 font-semibold">Time</th>
                  <th className="py-2.5 px-4 font-semibold">Product</th>
                  <th className="py-2.5 px-4 font-semibold">Direction</th>
                  <th className="py-2.5 px-4 font-semibold">Operation</th>
                  <th className="py-2.5 px-4 font-semibold">Status</th>
                  <th className="py-2.5 px-4 font-semibold">Changed Fields</th>
                  <th className="py-2.5 px-4 font-semibold text-right">Payload</th>
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
                    const isPimToWoo = log.direction === 'pim_to_woo';

                    // Relative timestamp formatting
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
                        onClick={() => setSelectedLog(log)}
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
                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-mono font-medium ${
                              isPimToWoo
                                ? 'bg-[#f0fdf4] text-[#15803d] border border-[#bbf7d0]'
                                : 'bg-[#eff6ff] text-[#1d4ed8] border border-[#bfdbfe]'
                            }`}
                          >
                            {isPimToWoo ? 'PIM → Woo' : 'Woo → PIM'}
                          </span>
                        </td>

                        {/* Operation */}
                        <td className="py-3 px-4 text-[#5c6660] capitalize">
                          {log.action}
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
                                  className="px-1.5 py-0.2 bg-[#f4f2ec] text-[#5c6660] rounded text-[10px] font-mono"
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

                        {/* Payload Button */}
                        <td className="py-3 px-4 text-right">
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
