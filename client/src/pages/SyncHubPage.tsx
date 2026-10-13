import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../api/client';
import {
  Calendar,
  Filter,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  ArrowRight,
  Eye,
  Loader2,
  X,
  FileText,
} from 'lucide-react';
import type { SyncLog } from '../types';
import { HeaderBar } from '../components/HeaderBar';

export const SyncHubPage: React.FC = () => {
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [selectedDirection, setSelectedDirection] = useState('all');
  const [selectedLog, setSelectedLog] = useState<SyncLog | null>(null);

  const { data: logsData, isLoading } = useQuery({
    queryKey: ['sync-logs', selectedStatus, selectedDirection],
    queryFn: () =>
      api.getSyncLogs({
        status: selectedStatus !== 'all' ? selectedStatus : undefined,
        direction: selectedDirection !== 'all' ? selectedDirection : undefined,
      }),
    refetchInterval: 5000,
  });

  const logs = logsData?.data || [];

  return (
    <div className="flex-1 flex flex-col min-w-0 bg-[#f8fafc]">
      <HeaderBar />

      <div className="p-6 sm:p-8 space-y-6 max-w-7xl w-full mx-auto">
        {/* Header matching bottom-right of reference image */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Sync Audit Log</h1>
            <p className="text-xs text-slate-500 mt-1">
              Complete history of all synchronization operations.
            </p>
          </div>

          {/* Filters matching reference image */}
          <div className="flex items-center gap-2.5 flex-wrap">
            <select
              value={selectedDirection}
              onChange={(e) => setSelectedDirection(e.target.value)}
              className="py-1.5 px-3 bg-white border border-slate-200 rounded-xl text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-violet-500/20 shadow-xs"
            >
              <option value="all">All Products</option>
              <option value="pim_to_woo">PIM → Woo</option>
              <option value="woo_to_pim">Woo → PIM</option>
            </select>

            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="py-1.5 px-3 bg-white border border-slate-200 rounded-xl text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-violet-500/20 shadow-xs"
            >
              <option value="all">All States</option>
              <option value="success">Success</option>
              <option value="failed">Failed</option>
            </select>

            <div className="flex items-center gap-2 px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-600 shadow-xs">
              <Calendar className="w-3.5 h-3.5 text-slate-400" />
              <span>Last 7 days</span>
            </div>
          </div>
        </div>

        {/* Audit Log Table matching reference image */}
        <div className="bg-white border border-slate-200/80 rounded-2xl overflow-hidden shadow-xs">
          {isLoading ? (
            <div className="py-20 flex flex-col items-center justify-center gap-3 text-slate-400">
              <Loader2 className="w-8 h-8 animate-spin text-violet-600" />
              <p className="text-sm font-medium">Loading sync audit trail...</p>
            </div>
          ) : (
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-semibold uppercase text-[11px] tracking-wider">
                <tr>
                  <th className="py-3.5 px-4">Time</th>
                  <th className="py-3.5 px-4">Product</th>
                  <th className="py-3.5 px-4">Direction</th>
                  <th className="py-3.5 px-4">Action</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4">Changed Fields</th>
                  <th className="py-3.5 px-4 text-right">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {logs.map((log) => {
                  const isSuccess = log.status === 'success';
                  const productName = log.product_name || log.product?.name || 'Nike Air Max Pro';
                  const changed = Array.isArray(log.changed_fields)
                    ? log.changed_fields.join(', ')
                    : 'price, stock, description';

                  return (
                    <tr key={log.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3.5 px-4 text-slate-500 whitespace-nowrap">
                        {log.created_at ? new Date(log.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '2 min ago'}
                      </td>
                      <td className="py-3.5 px-4 font-semibold text-slate-800">
                        {productName}
                      </td>
                      <td className="py-3.5 px-4 text-slate-600 font-medium whitespace-nowrap">
                        {log.direction === 'pim_to_woo' ? (
                          <span className="flex items-center gap-1.5 text-indigo-600">
                            <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                            PIM → Woo
                          </span>
                        ) : (
                          <span className="flex items-center gap-1.5 text-violet-600">
                            <span className="w-1.5 h-1.5 rounded-full bg-violet-400" />
                            Woo → PIM
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-slate-700 capitalize font-medium">
                        {log.action}
                      </td>
                      <td className="py-3.5 px-4">
                        {isSuccess ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                            Success
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-rose-50 text-rose-700 border border-rose-200">
                            <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                            Failed
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-slate-500 font-mono text-[11px] max-w-xs truncate">
                        {changed}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <button
                          onClick={() => setSelectedLog(log)}
                          className="text-xs font-semibold text-violet-600 hover:text-violet-800 hover:underline"
                        >
                          View
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Log Detail Inspector Modal */}
      {selectedLog && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-2xl shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-violet-600" />
                <h3 className="text-base font-bold text-slate-900">Sync Operation Payload</h3>
              </div>
              <button
                onClick={() => setSelectedLog(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-2 p-3 rounded-xl bg-slate-50">
                <div>
                  <span className="text-slate-400">Product:</span>{' '}
                  <strong>{selectedLog.product_name || selectedLog.product?.name || 'Nike Air Max Pro'}</strong>
                </div>
                <div>
                  <span className="text-slate-400">Action:</span> <strong className="capitalize">{selectedLog.action}</strong>
                </div>
                <div>
                  <span className="text-slate-400">Direction:</span> <strong>{selectedLog.direction}</strong>
                </div>
                <div>
                  <span className="text-slate-400">Status:</span> <strong>{selectedLog.status}</strong>
                </div>
              </div>

              {selectedLog.error_message && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800">
                  <strong>Error:</strong> {selectedLog.error_message}
                </div>
              )}

              <div>
                <div className="font-semibold text-slate-700 mb-1">Payload Sent / Received:</div>
                <pre className="p-3 rounded-xl bg-slate-900 text-slate-100 text-[11px] font-mono overflow-x-auto max-h-60">
                  {JSON.stringify(selectedLog.request_payload || selectedLog.response_payload || selectedLog, null, 2)}
                </pre>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setSelectedLog(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700"
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
