import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../api/client';
import { Product } from '../types';
import {
  Search,
  Filter,
  Plus,
  Send,
  Eye,
  Edit,
  Trash2,
  Package,
  Layers,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Loader2,
  ExternalLink,
} from 'lucide-react';
import { StatusBadge } from '../components/StatusBadge';
import { PreFlightDiffModal } from '../components/PreFlightDiffModal';
import { ProductEditorModal } from '../components/ProductEditorModal';

export const ProductsPage: React.FC = () => {
  const queryClient = useQueryClient();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [selectedCategory, setSelectedCategory] = useState('all');

  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [activeDiffProductId, setActiveDiffProductId] = useState<number | null>(null);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isEditorOpen, setIsEditorOpen] = useState(false);

  // Fetch Products
  const { data: productsData, isLoading } = useQuery({
    queryKey: ['products', searchTerm, selectedStatus, selectedCategory],
    queryFn: () =>
      api.getProducts({
        search: searchTerm,
        sync_status: selectedStatus,
        category_id: selectedCategory,
      }),
  });

  // Fetch Categories for filter dropdown
  const { data: categoriesData } = useQuery({
    queryKey: ['categories'],
    queryFn: () => api.getCategories(),
  });

  // Quick Sync Mutation
  const quickSyncMutation = useMutation({
    mutationFn: (id: number) => api.pushProduct(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
      queryClient.invalidateQueries({ queryKey: ['sync-logs'] });
      queryClient.invalidateQueries({ queryKey: ['mock-store-products'] });
    },
    onError: (err: any) => {
      alert(`Sync failed: ${err.message}`);
    },
  });

  // Batch Sync Mutation
  const batchSyncMutation = useMutation({
    mutationFn: (ids: number[]) => api.pushBatch(ids),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
      queryClient.invalidateQueries({ queryKey: ['sync-logs'] });
      queryClient.invalidateQueries({ queryKey: ['mock-store-products'] });
      setSelectedIds([]);
      alert(`Batch Sync completed: ${res.data.synced} succeeded, ${res.data.failed} failed.`);
    },
  });

  // Delete Mutation
  const deleteMutation = useMutation({
    mutationFn: (id: number) => api.deleteProduct(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
    },
  });

  const products = productsData?.data || [];
  const categories = categoriesData?.data || [];

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedIds(products.map((p) => p.id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleSelectRow = (id: number) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleDelete = (prod: Product) => {
    if (confirm(`Are you sure you want to delete product "${prod.name}"?`)) {
      deleteMutation.mutate(prod.id);
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight">Product Catalog Management</h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Manage product descriptions, pricing, attributes, and push verified changes to WooCommerce.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {selectedIds.length > 0 && (
            <button
              onClick={() => batchSyncMutation.mutate(selectedIds)}
              disabled={batchSyncMutation.isPending}
              className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-500/20 active:scale-95 transition-all disabled:opacity-50"
            >
              {batchSyncMutation.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
              Sync Selected ({selectedIds.length})
            </button>
          )}

          <button
            onClick={() => {
              setEditingProduct(null);
              setIsEditorOpen(true);
            }}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white shadow-lg shadow-indigo-500/20 active:scale-95 transition-all"
          >
            <Plus className="w-4 h-4" />
            Add Product
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 flex flex-wrap items-center justify-between gap-4">
        {/* Search */}
        <div className="relative flex-1 min-w-[260px]">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search by product title or SKU..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-4 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
          />
        </div>

        {/* Status Filter */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400">Sync Status:</span>
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
          >
            <option value="all">All Statuses</option>
            <option value="synced">Synced</option>
            <option value="modified">Modified (Dirty)</option>
            <option value="not_synced">Draft (Not Synced)</option>
            <option value="error">Sync Error</option>
          </select>
        </div>

        {/* Category Filter */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400">Category:</span>
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
          >
            <option value="all">All Categories</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Products Table */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/80 overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-950/90 border-b border-slate-800 text-slate-400 uppercase text-[10px] font-semibold tracking-wider">
                <th className="py-3 px-4 w-10">
                  <input
                    type="checkbox"
                    checked={products.length > 0 && selectedIds.length === products.length}
                    onChange={handleSelectAll}
                    className="rounded bg-slate-800 border-slate-700 text-indigo-600 focus:ring-0"
                  />
                </th>
                <th className="py-3 px-4">Product</th>
                <th className="py-3 px-4">SKU</th>
                <th className="py-3 px-4">Categories</th>
                <th className="py-3 px-4">Price</th>
                <th className="py-3 px-4">Stock</th>
                <th className="py-3 px-4">Woo ID</th>
                <th className="py-3 px-4">Sync Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-sans">
              {isLoading ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-400">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto text-indigo-500 mb-2" />
                    Loading product catalog...
                  </td>
                </tr>
              ) : products.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-400">
                    <Package className="w-8 h-8 mx-auto text-slate-600 mb-2" />
                    No products matched your filters.
                  </td>
                </tr>
              ) : (
                products.map((prod) => (
                  <tr
                    key={prod.id}
                    className={`hover:bg-slate-800/40 transition-colors ${
                      selectedIds.includes(prod.id) ? 'bg-indigo-500/5' : ''
                    }`}
                  >
                    <td className="py-3 px-4">
                      <input
                        type="checkbox"
                        checked={selectedIds.includes(prod.id)}
                        onChange={() => handleSelectRow(prod.id)}
                        className="rounded bg-slate-800 border-slate-700 text-indigo-600 focus:ring-0"
                      />
                    </td>

                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        {prod.image_url ? (
                          <img
                            src={prod.image_url}
                            alt=""
                            className="w-10 h-10 rounded-lg object-cover border border-slate-800 shrink-0"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-lg bg-slate-800 flex items-center justify-center text-slate-500 shrink-0">
                            <Package className="w-5 h-5" />
                          </div>
                        )}
                        <div>
                          <p className="font-semibold text-slate-200 line-clamp-1">{prod.name}</p>
                          <p className="text-[11px] text-slate-400 line-clamp-1">{prod.short_description || '—'}</p>
                        </div>
                      </div>
                    </td>

                    <td className="py-3 px-4 font-mono text-slate-300">{prod.sku}</td>

                    <td className="py-3 px-4">
                      <div className="flex flex-wrap gap-1">
                        {prod.categories && prod.categories.length > 0 ? (
                          prod.categories.map((c) => (
                            <span
                              key={c.id}
                              className="px-2 py-0.5 rounded bg-slate-800 text-[10px] text-slate-300 border border-slate-700"
                            >
                              {c.name}
                            </span>
                          ))
                        ) : (
                          <span className="text-slate-600 italic text-[11px]">None</span>
                        )}
                      </div>
                    </td>

                    <td className="py-3 px-4">
                      <div className="flex flex-col">
                        <span className="font-semibold text-slate-200">
                          ${Number(prod.regular_price || 0).toFixed(2)}
                        </span>
                        {prod.sale_price !== null && (
                          <span className="text-[10px] text-emerald-400 line-through">
                            Sale: ${Number(prod.sale_price).toFixed(2)}
                          </span>
                        )}
                      </div>
                    </td>

                    <td className="py-3 px-4 text-slate-300">
                      <span className={prod.stock_quantity > 0 ? 'text-slate-300' : 'text-rose-400 font-medium'}>
                        {prod.stock_quantity} in stock
                      </span>
                    </td>

                    <td className="py-3 px-4 font-mono text-slate-400">
                      {prod.woo_id ? (
                        <span className="text-cyan-400">#{prod.woo_id}</span>
                      ) : (
                        <span className="text-slate-600">—</span>
                      )}
                    </td>

                    <td className="py-3 px-4">
                      <StatusBadge status={prod.sync_status} size="sm" />
                    </td>

                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {/* THE STANDOUT ACTION: INSPECT DIFF */}
                        <button
                          title="Inspect Pre-Flight Differences & Validation"
                          onClick={() => setActiveDiffProductId(prod.id)}
                          className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium bg-indigo-500/10 text-indigo-300 hover:bg-indigo-500/20 border border-indigo-500/30 transition-colors shadow-sm"
                        >
                          <ShieldCheck className="w-3.5 h-3.5 text-indigo-400" />
                          Inspect Diff
                        </button>

                        {/* Quick Sync */}
                        <button
                          title="Quick Sync to WooCommerce"
                          onClick={() => quickSyncMutation.mutate(prod.id)}
                          disabled={quickSyncMutation.isPending}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-400 hover:bg-slate-800 transition-colors"
                        >
                          <Send className="w-3.5 h-3.5" />
                        </button>

                        {/* Edit */}
                        <button
                          title="Edit Product"
                          onClick={() => {
                            setEditingProduct(prod);
                            setIsEditorOpen(true);
                          }}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </button>

                        {/* Delete */}
                        <button
                          title="Delete Product"
                          onClick={() => handleDelete(prod)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modals */}
      <PreFlightDiffModal
        productId={activeDiffProductId}
        isOpen={!!activeDiffProductId}
        onClose={() => setActiveDiffProductId(null)}
      />

      <ProductEditorModal
        product={editingProduct}
        isOpen={isEditorOpen}
        onClose={() => {
          setIsEditorOpen(false);
          setEditingProduct(null);
        }}
      />
    </div>
  );
};
