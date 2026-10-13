import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../api/client';
import {
  ExternalLink,
  Download,
  Loader2,
  Search,
  CheckCircle2,
  Sparkles,
} from 'lucide-react';
import { HeaderBar } from '../components/HeaderBar';

export const MockStorePage: React.FC = () => {
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

  const products = storeData?.data || [];

  return (
    <div className="flex-1 flex flex-col min-w-0 bg-[#f8fafc]">
      <HeaderBar searchTerm={searchTerm} onSearchChange={setSearchTerm} />

      <div className="p-6 sm:p-8 space-y-6 max-w-7xl w-full mx-auto">
        {/* Header matching bottom-left of reference image */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Mock WooCommerce Store</h1>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                LIVE (Mock)
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              View your synchronized products as they appear on your WooCommerce store.
            </p>
          </div>

          <button
            type="button"
            onClick={() => window.open(window.location.href, '_blank')}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 shadow-xs transition-colors shrink-0"
          >
            <ExternalLink className="w-3.5 h-3.5 text-slate-500" />
            View in New Tab
          </button>
        </div>

        {importNotice && (
          <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-medium flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{importNotice}</span>
          </div>
        )}

        {/* Product Grid matching reference image cards */}
        {isLoading ? (
          <div className="py-20 flex flex-col items-center justify-center gap-3 text-slate-400">
            <Loader2 className="w-8 h-8 animate-spin text-violet-600" />
            <p className="text-sm font-medium">Loading store catalog...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {products.map((p) => {
              const inStock = (p.stock_quantity ?? 0) > 0;
              const img =
                p.images?.[0]?.src ||
                p.image_url ||
                'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400&auto=format&fit=crop&q=80';

              return (
                <div
                  key={p.id}
                  className="bg-white rounded-2xl border border-slate-200/80 p-3.5 flex flex-col shadow-xs hover:shadow-md transition-shadow group"
                >
                  {/* Image Container */}
                  <div className="aspect-square rounded-xl bg-slate-50 overflow-hidden border border-slate-100 mb-3 flex items-center justify-center">
                    <img
                      src={img}
                      alt={p.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  </div>

                  {/* Title */}
                  <h3 className="text-xs font-semibold text-slate-900 truncate" title={p.name}>
                    {p.name}
                  </h3>

                  {/* Price & Stock status */}
                  <div className="mt-2 flex items-center justify-between">
                    <span className="text-sm font-bold text-slate-900">
                      ₹{p.price || p.regular_price}
                    </span>

                    {inStock ? (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        In Stock
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-rose-50 text-rose-700 border border-rose-200">
                        Out of Stock
                      </span>
                    )}
                  </div>

                  {/* Pull into PIM button */}
                  <button
                    onClick={() => importMutation.mutate(p.id)}
                    disabled={importMutation.isPending}
                    className="mt-3 w-full py-1.5 rounded-lg text-[11px] font-semibold text-slate-600 hover:text-slate-900 bg-slate-50 hover:bg-slate-100 border border-slate-200 transition-colors flex items-center justify-center gap-1.5"
                  >
                    <Download className="w-3 h-3 text-slate-500" />
                    Pull to PIM
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
