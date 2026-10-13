import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../api/client';
import {
  Store,
  Download,
  Package,
  Search,
  ExternalLink,
  CheckCircle2,
  Loader2,
  Layers,
  Sparkles,
} from 'lucide-react';

export const MockStorePage: React.FC = () => {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');

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
      alert(res.message);
    },
    onError: (err: any) => {
      alert(`Import failed: ${err.message}`);
    },
  });

  const products = storeData?.data || [];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-2xl bg-gradient-to-r from-cyan-950/40 via-slate-900 to-slate-950 border border-slate-800 shadow-xl">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-white tracking-tight">WooCommerce Storefront Sandbox</h1>
            <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
              Live Store Simulation
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Visual preview of external products published to WooCommerce. Pull any existing store product back into PIM Hub with 1 click.
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs font-mono text-cyan-400 bg-cyan-500/10 border border-cyan-500/20 px-3 py-1.5 rounded-xl">
          <span>Target Store:</span>
          <strong>https://mock-woo.kilowott.local</strong>
        </div>
      </div>

      {/* Search Bar */}
      <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 flex items-center justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search products in WooCommerce store..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-4 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500"
          />
        </div>

        <span className="text-xs text-slate-400 font-mono">
          {products.length} published products in store
        </span>
      </div>

      {/* Products Grid */}
      {isLoading ? (
        <div className="p-16 text-center text-slate-400">
          <Loader2 className="w-8 h-8 animate-spin mx-auto text-cyan-500 mb-2" />
          Fetching WooCommerce store items...
        </div>
      ) : products.length === 0 ? (
        <div className="p-16 text-center text-slate-400 rounded-2xl bg-slate-900/40 border border-slate-800">
          <Store className="w-12 h-12 mx-auto text-slate-600 mb-3" />
          <h3 className="text-base font-semibold text-slate-300">WooCommerce Store is Empty</h3>
          <p className="text-xs text-slate-500 mt-1">
            Push a product from PIM Hub using "Inspect Diff" or "Quick Sync" to see it live here.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {products.map((item) => (
            <div
              key={item.id}
              className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 flex flex-col justify-between hover:border-cyan-500/30 transition-all shadow-xl group"
            >
              <div>
                {/* Product Image & Badges */}
                <div className="relative w-full h-44 rounded-xl overflow-hidden bg-slate-950 border border-slate-800 mb-4">
                  {item.images && item.images.length > 0 ? (
                    <img
                      src={item.images[0].src}
                      alt={item.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-slate-600">
                      <Package className="w-8 h-8" />
                    </div>
                  )}

                  <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5">
                    <span className="px-2 py-0.5 rounded-md bg-slate-950/80 backdrop-blur-md text-[10px] font-mono text-cyan-400 border border-slate-700">
                      WC #{item.id}
                    </span>
                    <span className="px-2 py-0.5 rounded-md bg-emerald-500/80 backdrop-blur-md text-[10px] font-semibold text-white">
                      Published
                    </span>
                  </div>
                </div>

                {/* Details */}
                <div>
                  <h3 className="text-base font-semibold text-white line-clamp-1">{item.name}</h3>
                  <p className="text-xs font-mono text-slate-400 mt-0.5">SKU: {item.sku || 'N/A'}</p>
                  <p className="text-xs text-slate-400 line-clamp-2 mt-2">
                    {item.short_description || item.description || 'No description provided.'}
                  </p>
                </div>

                {/* Attributes Pill List */}
                {item.attributes && item.attributes.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-1">
                    {item.attributes.map((attr, idx) => (
                      <span
                        key={idx}
                        className="text-[10px] px-2 py-0.5 rounded bg-slate-950 text-slate-300 border border-slate-800"
                      >
                        {attr.name}: {Array.isArray(attr.options) ? attr.options.join(', ') : ''}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Price & Action Footer */}
              <div className="mt-5 pt-3 border-t border-slate-800 flex items-center justify-between">
                <div>
                  <span className="text-xs text-slate-500 block text-[10px] uppercase font-mono">Store Price</span>
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-lg font-bold text-white">
                      ${Number(item.price || item.regular_price || 0).toFixed(2)}
                    </span>
                    {item.sale_price && (
                      <span className="text-xs text-slate-500 line-through">
                        ${Number(item.regular_price).toFixed(2)}
                      </span>
                    )}
                  </div>
                </div>

                {/* Bi-directional Pull Button */}
                <button
                  onClick={() => importMutation.mutate(item.id)}
                  disabled={importMutation.isPending}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 active:scale-95 transition-all shadow-sm disabled:opacity-50"
                >
                  {importMutation.isPending ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Download className="w-3.5 h-3.5" />
                  )}
                  Pull to PIM Hub
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
