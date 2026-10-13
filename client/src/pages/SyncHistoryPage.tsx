import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../api/client';
import {
  FileText,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Eye,
  Loader2,
  X,
  History,
} from 'lucide-react';
import { TopBar } from '../components/TopBar';
import type { SyncLog } from '../types';

export const SyncHistoryPage: React.FC = () => {
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
      <TopBar breadcrumbs={['Operations', 'Sync History']} />

      <div className="p-6 max-w-6xl w-full mx-auto space-y-4">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200">
          <div>
            <h1 className="text-base font-bold text-slate-900 tracking-tight flex items-center gap-2">
              Synchronization Audit Trail
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Immutable ledger of all outbound publish and inbound import operations with raw payloads.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <select
              value={selectedDirection}
              onChange={(e) => setSelectedDirection(e.target.value)}
              className="py-1 px-2.5 bg-white border border-slate-200 rounded text-xs text-slate-700 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            >
              <option value="all">All Directions</option>
              <option value="pim_to_woo">PIM → WooCommerce</option>
              <option value="woo_to_pim">WooCommerce → PIM</option>
            </select>

            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="py-1 px-2.5 bg-white border border-slate-200 rounded text-xs text-slate-700 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            >
              <option value="all">All Statuses</option>
              <option value="success">Success</option>
              <option value="failed">Failed</option>
            </select>
          </div>
        </div>

        {/* Dense Audit Table */}
        <div className="border border-slate-200 rounded-md bg-white overflow-hidden">
          {isLoading ? (
            <div className="py-16 text-center text-slate-400">
              <Loader2 className="w-6 h-6 animate-spin mx-auto text-indigo-600 mb-2" />
              <p className="text-xs">Loading operational ledger...</p>
            </div>
          ) : (
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/60 border-b border-slate-200 text-slate-500 font-semibold text-[11px] uppercase tracking-wider">
                <tr>
                  <th className="py-2.5 px-4">Timestamp</th>
                  <th className="py-2.5 px-4">Product</th>
                  <th className="py-2.5 px-4">Direction</th>
                  <th className="py-2.5 px-4">Operation</th>
                  <th className="py-2.5 px-4">Status</th>
                  <th className="py-2.5 px-4">Changed Fields</th>
                  <th className="py-2.5 px-4 text-right">Payload</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {logs.map((log) => {
                  const isSuccess = log.status === 'success';
                  const productName = log.product_name || log.product?.name || 'Nike Air Max Pro';
                  const changed = Array.isArray(log.changed_fields)
                    ? log.changed_fields.join(', ')
                    : 'price, stock, specs';

                  return (
                    <tr key={log.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-2.5 px-4 font-mono text-[11px] text-slate-500 whitespace-nowrap">
                        {log.created_at ? new Date(log.created_at).toLocaleString() : 'Today, 2:40 PM'}
                      </td>
                      <td className="py-2.5 px-4 font-medium text-slate-900">
                        {productName}
                      </td>
                      <td className="py-2.5 px-4 whitespace-nowrap font-mono text-[11px]">
                        {log.direction === 'pim_to_woo' ? (
                          <span className="text-indigo-700 font-semibold">PIM → Woo</span>
                        ) : (
                          <span className="text-slate-600">Woo → PIM</span>
                        )}
                      </td>
                      <td className="py-2.5 px-4 capitalize text-slate-700">
                        {log.action}
                      </td>
                      <td className="py-2.5 px-4 whitespace-nowrap">
                        {isSuccess ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                            Success
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-rose-50 text-rose-700 border border-rose-200">
                            Failed
                          </span>
                        )}
                      </td>
                      <td className="py-2.5 px-4 font-mono text-[11px] text-slate-500 max-w-xs truncate">
                        {changed}
                      </td>
                      <td className="py-2.5 px-4 text-right whitespace-nowrap">
                        <button
                          onClick={() => setSelectedLog(log)}
                          className="px-2 py-1 rounded text-[11px] font-medium text-indigo-700 hover:bg-indigo-50 border border-slate-200 transition-colors"
                        >
                          View Payload
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

      {/* Payload Modal */}
      {selectedLog && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-md w-full max-w-2xl shadow-xl p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-indigo-600" />
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wide">
                  Transaction Audit Record #{selectedLog.id}
                </h3>
              </div>
              <button
                onClick={() => setSelectedLog(null)}
                className="p-1 rounded text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-2 p-2.5 rounded bg-slate-50 border border-slate-200 text-[11px]">
                <div>
                  <span className="text-slate-500">Product:</span>{' '}
                  <strong className="text-slate-800">{selectedLog.product_name || selectedLog.product?.name || 'Nike Air Max Pro'}</strong>
                </div>
                <div>
                  <span className="text-slate-500">Action:</span>{' '}
                  <strong className="capitalize text-slate-800">{selectedLog.action}</strong>
                </div>
                <div>
                  <span className="text-slate-500">Direction:</span>{' '}
                  <strong className="text-slate-800 font-mono">{selectedLog.direction}</strong>
                </div>
                <div>
                  <span className="text-slate-500">Status:</span>{' '}
                  <strong className="capitalize text-slate-800">{selectedLog.status}</strong>
                </div>
              </div>

              {selectedLog.error_message && (
                <div className="p-2.5 rounded bg-rose-50 border border-rose-200 text-rose-800 text-[11.5px]">
                  <strong>Error details:</strong> {selectedLog.error_message}
                </div>
              )}

              <div>
                <div className="font-semibold text-slate-700 mb-1 text-[11px]">JSON Payload Record:</div>
                <pre className="p-3 rounded bg-slate-900 text-slate-100 text-[11px] font-mono overflow-x-auto max-h-64">
                  {JSON.stringify(selectedLog.request_payload || selectedLog.response_payload || selectedLog, null, 2)}
                </pre>
              </div>
            </div>

            <div className="flex justify-end pt-2 border-t border-slate-100">
              <button
                onClick={() => setSelectedLog(null)}
                className="px-3 py-1.5 rounded text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700"
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
