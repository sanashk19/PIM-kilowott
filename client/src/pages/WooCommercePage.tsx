import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../api/client';
import {
  Store,
  Download,
  Loader2,
  CheckCircle2,
  ExternalLink,
  Package,
} from 'lucide-react';
import { TopBar } from '../components/TopBar';

export const WooCommercePage: React.FC = () => {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [importNotice, setImportNotice] = useState<string | null>(null);

  const { data: storeData, isLoading } = useQuery({
    queryKey: ['mock-store-products', searchTerm],
    queryFn: () => api.getMockStoreProducts(searchTerm),
    refetchInterval: 5000,
  });

  const importMutation = useMutation({
    mutationFn: (wooId: number) => api.importProduct(wooId),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
      queryClient.invalidateQueries({ queryKey: ['sync-logs'] });
      setImportNotice(res.message);
      setTimeout(() => setImportNotice(null), 3500);
    },
  });

  const importAllMutation = useMutation({
    mutationFn: () => api.importAll(),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
      queryClient.invalidateQueries({ queryKey: ['sync-logs'] });
      setImportNotice('All WooCommerce products synchronized to PIM catalog.');
      setTimeout(() => setImportNotice(null), 3500);
    },
  });

  const products = storeData?.data || [];

  return (
    <div className="flex-1 flex flex-col min-w-0 bg-[#f8fafc]">
      <TopBar breadcrumbs={['Integrations', 'WooCommerce']} search={searchTerm} onSearchChange={setSearchTerm} />

      <div className="p-6 max-w-6xl w-full mx-auto space-y-4">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-bold text-slate-900 tracking-tight">WooCommerce Storefront</h1>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                Live Driver
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Live status of entities published to the target WooCommerce channel. Bi-directional import enabled.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => importAllMutation.mutate()}
              disabled={importAllMutation.isPending}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-xs disabled:opacity-50 transition-colors"
            >
              {importAllMutation.isPending ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Download className="w-3.5 h-3.5 text-slate-500" />
              )}
              Import All to PIM
            </button>
          </div>
        </div>

        {importNotice && (
          <div className="p-3 rounded-md bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-medium flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{importNotice}</span>
          </div>
        )}

        {/* Compact Table */}
        <div className="border border-slate-200 rounded-md bg-white overflow-hidden">
          {isLoading ? (
            <div className="py-16 text-center text-slate-400">
              <Loader2 className="w-6 h-6 animate-spin mx-auto text-indigo-600 mb-2" />
              <p className="text-xs">Connecting to WooCommerce endpoint...</p>
            </div>
          ) : (
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/60 border-b border-slate-200 text-slate-500 font-semibold text-[11px] uppercase tracking-wider">
                <tr>
                  <th className="py-2.5 px-4">Remote ID</th>
                  <th className="py-2.5 px-4">SKU</th>
                  <th className="py-2.5 px-4">Product Name</th>
                  <th className="py-2.5 px-4">Price</th>
                  <th className="py-2.5 px-4">Stock</th>
                  <th className="py-2.5 px-4">Channel Status</th>
                  <th className="py-2.5 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {products.map((p) => {
                  const inStock = (p.stock_quantity ?? 0) > 0;
                  return (
                    <tr key={p.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-2.5 px-4 font-mono text-[11px] text-slate-500">
                        #{p.id}
                      </td>
                      <td className="py-2.5 px-4 font-mono text-[11px] text-slate-700 font-medium">
                        {p.sku || `WOO-${p.id}`}
                      </td>
                      <td className="py-2.5 px-4 font-medium text-slate-900">
                        {p.name}
                      </td>
                      <td className="py-2.5 px-4 font-mono font-medium text-slate-900">
                        ₹{p.price || p.regular_price}
                      </td>
                      <td className="py-2.5 px-4">
                        {inStock ? (
                          <span className="text-emerald-700 font-medium">{p.stock_quantity ?? 12} in stock</span>
                        ) : (
                          <span className="text-rose-700 font-medium">Out of stock</span>
                        )}
                      </td>
                      <td className="py-2.5 px-4">
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                          Published
                        </span>
                      </td>
                      <td className="py-2.5 px-4 text-right">
                        <button
                          onClick={() => importMutation.mutate(p.id)}
                          disabled={importMutation.isPending}
                          className="px-2.5 py-1 rounded text-[11px] font-medium text-indigo-700 hover:bg-indigo-50 border border-slate-200 transition-colors"
                        >
                          Pull to PIM
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
    </div>
  );
};
