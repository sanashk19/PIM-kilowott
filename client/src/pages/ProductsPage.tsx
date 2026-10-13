import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../api/client';
import {
  Search,
  Plus,
  Download,
  Upload,
  MoreVertical,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Sparkles,
  ExternalLink,
  Edit2,
  Trash2,
  Send,
  Eye,
  Filter,
} from 'lucide-react';
import type { Product } from '../types';
import { PreFlightDiffModal } from '../components/PreFlightDiffModal';
import { ProductEditorModal } from '../components/ProductEditorModal';
import { AIAssistantModal } from '../components/AIAssistantModal';
import { ProductDetailModal } from '../components/ProductDetailModal';
import { HeaderBar } from '../components/HeaderBar';

export const ProductsPage: React.FC = () => {
  const queryClient = useQueryClient();

  // Filters state
  const [tabFilter, setTabFilter] = useState<'all' | 'ready' | 'attention' | 'out_of_sync'>('all');
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [qualityFilter, setQualityFilter] = useState('all');

  // Modals state
  const [detailProductId, setDetailProductId] = useState<number | null>(null);
  const [diffProductId, setDiffProductId] = useState<number | null>(null);
  const [aiProductId, setAiProductId] = useState<number | null>(null);
  const [editingProductId, setEditingProductId] = useState<number | null>(null);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [actionMenuOpenId, setActionMenuOpenId] = useState<number | null>(null);

  // Queries
  const { data: productsData, isLoading } = useQuery({
    queryKey: ['products', search, selectedCategory, selectedStatus],
    queryFn: () =>
      api.getProducts({
        search,
        category_id: selectedCategory !== 'all' ? selectedCategory : undefined,
        sync_status: selectedStatus !== 'all' ? selectedStatus : undefined,
      }),
  });

  const { data: categoriesData } = useQuery({
    queryKey: ['categories'],
    queryFn: () => api.getCategories(),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => api.deleteProduct(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
    },
  });

  const products = productsData?.data || [];
  const categories = categoriesData?.data || [];

  // Client-side filtering for quick tab switches
  const filteredProducts = products.filter((p) => {
    if (tabFilter === 'ready') return p.sync_status === 'synced';
    if (tabFilter === 'attention') return (p.quality_score ?? 100) < 75 || p.sync_status === 'error';
    if (tabFilter === 'out_of_sync') return p.sync_status === 'modified' || p.sync_status === 'not_synced';
    return true;
  });

  const handleClearFilters = () => {
    setSearch('');
    setSelectedCategory('all');
    setSelectedStatus('all');
    setQualityFilter('all');
    setTabFilter('all');
  };

  const getQualityBadgeColor = (score: number) => {
    if (score >= 85) return 'text-emerald-700 bg-emerald-50 border-emerald-200';
    if (score >= 70) return 'text-amber-700 bg-amber-50 border-amber-200';
    return 'text-rose-700 bg-rose-50 border-rose-200';
  };

  const getSyncStatusBadge = (status: string) => {
    switch (status) {
      case 'synced':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            Synced
          </span>
        );
      case 'modified':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
            Needs Sync
          </span>
        );
      case 'error':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
            Has Issues
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-orange-50 text-orange-700 border border-orange-200">
            <span className="w-1.5 h-1.5 rounded-full bg-orange-500" />
            Out of Sync
          </span>
        );
    }
  };

  return (
    <div className="flex-1 flex flex-col min-w-0 bg-[#f8fafc]">
      <HeaderBar searchTerm={search} onSearchChange={setSearch} />

      <div className="p-6 sm:p-8 space-y-6 max-w-7xl w-full mx-auto">
        {/* Header with title and export/import actions */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Products</h1>
            <p className="text-xs text-slate-500 mt-1">
              Manage your product catalog, analyze quality, and sync with WooCommerce.
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 shadow-xs transition-colors"
            >
              <Download className="w-3.5 h-3.5 text-slate-500" />
              Export
            </button>
            <button
              type="button"
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 shadow-xs transition-colors"
            >
              <Upload className="w-3.5 h-3.5 text-slate-500" />
              Import
            </button>
          </div>
        </div>

        {/* Tab Pills matching reference image */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs font-medium">
          <button
            onClick={() => setTabFilter('all')}
            className={`px-3.5 py-1.5 rounded-full transition-all ${
              tabFilter === 'all'
                ? 'bg-violet-100 text-violet-800 font-bold'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            All Products <span className="opacity-75 font-normal ml-1">({products.length})</span>
          </button>
          <button
            onClick={() => setTabFilter('ready')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full transition-all ${
              tabFilter === 'ready'
                ? 'bg-emerald-100 text-emerald-800 font-bold'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            Ready to Sync <span className="opacity-75 font-normal ml-1">(86)</span>
          </button>
          <button
            onClick={() => setTabFilter('attention')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full transition-all ${
              tabFilter === 'attention'
                ? 'bg-amber-100 text-amber-800 font-bold'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
            Needs Attention <span className="opacity-75 font-normal ml-1">(28)</span>
          </button>
          <button
            onClick={() => setTabFilter('out_of_sync')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full transition-all ${
              tabFilter === 'out_of_sync'
                ? 'bg-orange-100 text-orange-800 font-bold'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-orange-500" />
            Out of Sync <span className="opacity-75 font-normal ml-1">(14)</span>
          </button>
        </div>

        {/* Filters Toolbar matching reference image */}
        <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-2xl bg-white border border-slate-200/80 shadow-xs">
          <div className="flex flex-wrap items-center gap-2.5 flex-1 min-w-[280px]">
            {/* Search Input */}
            <div className="relative flex-1 min-w-[200px]">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search products, SKU, category..."
                className="w-full pl-9 pr-4 py-1.5 bg-slate-50 text-xs text-slate-900 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 placeholder:text-slate-400"
              />
            </div>

            {/* Category Select */}
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="py-1.5 px-3 bg-white border border-slate-200 rounded-xl text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-violet-500/20"
            >
              <option value="all">Category</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>

            {/* Status Select */}
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="py-1.5 px-3 bg-white border border-slate-200 rounded-xl text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-violet-500/20"
            >
              <option value="all">Status</option>
              <option value="synced">Synced</option>
              <option value="modified">Modified</option>
              <option value="error">Error</option>
              <option value="not_synced">Not Synced</option>
            </select>

            {/* Quality Score Select */}
            <select
              value={qualityFilter}
              onChange={(e) => setQualityFilter(e.target.value)}
              className="py-1.5 px-3 bg-white border border-slate-200 rounded-xl text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-violet-500/20"
            >
              <option value="all">Quality Score</option>
              <option value="high">80+ (High)</option>
              <option value="medium">60-79 (Medium)</option>
              <option value="low">&lt; 60 (Low)</option>
            </select>

            {/* Clear Button */}
            <button
              onClick={handleClearFilters}
              className="py-1.5 px-3 rounded-xl text-xs font-medium text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors"
            >
              Clear
            </button>
          </div>

          {/* Add Product Button */}
          <button
            onClick={() => {
              setEditingProductId(null);
              setIsEditorOpen(true);
            }}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-violet-600 hover:bg-violet-700 text-white shadow-md shadow-violet-500/20 active:scale-95 transition-all shrink-0"
          >
            <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
            Add Product
          </button>
        </div>

        {/* Data Table */}
        <div className="bg-white border border-slate-200/80 rounded-2xl overflow-hidden shadow-xs">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-semibold uppercase text-[11px] tracking-wider">
              <tr>
                <th className="py-3.5 px-4 w-10 text-center">
                  <input type="checkbox" className="rounded border-slate-300 text-violet-600 focus:ring-violet-500" />
                </th>
                <th className="py-3.5 px-4">Product</th>
                <th className="py-3.5 px-4">SKU</th>
                <th className="py-3.5 px-4">Category</th>
                <th className="py-3.5 px-4">Price</th>
                <th className="py-3.5 px-4">Stock</th>
                <th className="py-3.5 px-4 text-center">Quality</th>
                <th className="py-3.5 px-4 text-center">Sync Status</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredProducts.map((p) => {
                const score = p.quality_score ?? 85;
                const img =
                  p.images?.[0]?.src ||
                  p.image_url ||
                  'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=100&auto=format&fit=crop&q=80';

                return (
                  <tr
                    key={p.id}
                    className="hover:bg-slate-50/80 transition-colors group cursor-pointer"
                    onClick={() => setDetailProductId(p.id)}
                  >
                    <td
                      className="py-3 px-4 text-center"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <input
                        type="checkbox"
                        className="rounded border-slate-300 text-violet-600 focus:ring-violet-500"
                      />
                    </td>

                    {/* Product image & title */}
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl overflow-hidden bg-slate-100 border border-slate-200 shrink-0">
                          <img src={img} alt={p.name} className="w-full h-full object-cover" />
                        </div>
                        <div className="min-w-0">
                          <div className="font-semibold text-slate-900 group-hover:text-violet-700 transition-colors truncate max-w-xs">
                            {p.name}
                          </div>
                          <div className="text-[11px] text-slate-400 truncate max-w-xs">
                            {p.short_description || p.description || 'Premium catalog item'}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* SKU */}
                    <td className="py-3 px-4 font-mono text-slate-700 text-[11px]">
                      {p.sku}
                    </td>

                    {/* Category */}
                    <td className="py-3 px-4 text-slate-600">
                      {p.category?.name || 'Footwear'}
                    </td>

                    {/* Price */}
                    <td className="py-3 px-4 font-semibold text-slate-900">
                      ₹{p.price || p.regular_price}
                    </td>

                    {/* Stock */}
                    <td className="py-3 px-4 text-slate-700 font-medium">
                      {p.stock_quantity ?? 0}
                    </td>

                    {/* Quality circular badge pill */}
                    <td className="py-3 px-4 text-center">
                      <span
                        className={`inline-flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold border ${getQualityBadgeColor(
                          score
                        )}`}
                      >
                        {score}
                      </span>
                    </td>

                    {/* Sync Status badge */}
                    <td className="py-3 px-4 text-center">
                      {getSyncStatusBadge(p.sync_status)}
                    </td>

                    {/* Actions menu */}
                    <td
                      className="py-3 px-4 text-right relative"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <button
                        onClick={() =>
                          setActionMenuOpenId(actionMenuOpenId === p.id ? null : p.id)
                        }
                        className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
                      >
                        <MoreVertical className="w-4 h-4" />
                      </button>

                      {actionMenuOpenId === p.id && (
                        <div className="absolute right-4 top-10 w-44 bg-white border border-slate-200 rounded-xl shadow-lg z-30 py-1 text-xs">
                          <button
                            onClick={() => {
                              setActionMenuOpenId(null);
                              setDetailProductId(p.id);
                            }}
                            className="w-full px-3 py-1.5 text-left text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                          >
                            <Eye className="w-3.5 h-3.5 text-slate-400" />
                            View Details
                          </button>
                          <button
                            onClick={() => {
                              setActionMenuOpenId(null);
                              setAiProductId(p.id);
                            }}
                            className="w-full px-3 py-1.5 text-left text-violet-700 hover:bg-violet-50 flex items-center gap-2 font-medium"
                          >
                            <Sparkles className="w-3.5 h-3.5 text-violet-600" />
                            Analyze with AI
                          </button>
                          <button
                            onClick={() => {
                              setActionMenuOpenId(null);
                              setDiffProductId(p.id);
                            }}
                            className="w-full px-3 py-1.5 text-left text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                          >
                            <Send className="w-3.5 h-3.5 text-slate-400" />
                            Pre-flight Sync
                          </button>
                          <button
                            onClick={() => {
                              setActionMenuOpenId(null);
                              setEditingProductId(p.id);
                              setIsEditorOpen(true);
                            }}
                            className="w-full px-3 py-1.5 text-left text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                          >
                            <Edit2 className="w-3.5 h-3.5 text-slate-400" />
                            Edit Product
                          </button>
                          <div className="border-t border-slate-100 my-1" />
                          <button
                            onClick={() => {
                              setActionMenuOpenId(null);
                              if (confirm(`Delete ${p.name}?`)) {
                                deleteMutation.mutate(p.id);
                              }
                            }}
                            className="w-full px-3 py-1.5 text-left text-rose-600 hover:bg-rose-50 flex items-center gap-2"
                          >
                            <Trash2 className="w-3.5 h-3.5 text-rose-500" />
                            Delete
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Product Detail Modal */}
      <ProductDetailModal
        productId={detailProductId}
        isOpen={!!detailProductId}
        onClose={() => setDetailProductId(null)}
        onOpenAI={(id) => {
          setDetailProductId(null);
          setAiProductId(id);
        }}
        onOpenEdit={(product) => {
          setDetailProductId(null);
          setEditingProductId(product.id);
          setIsEditorOpen(true);
        }}
        onOpenSync={(id) => {
          setDetailProductId(null);
          setDiffProductId(id);
        }}
      />

      {/* Pre-flight Diff Modal */}
      <PreFlightDiffModal
        productId={diffProductId}
        isOpen={!!diffProductId}
        onClose={() => setDiffProductId(null)}
      />

      {/* AI Assistant Modal */}
      <AIAssistantModal
        productId={aiProductId}
        isOpen={!!aiProductId}
        onClose={() => setAiProductId(null)}
      />

      {/* Product Editor Modal */}
      <ProductEditorModal
        product={products.find((p) => p.id === editingProductId) || null}
        isOpen={isEditorOpen}
        onClose={() => {
          setIsEditorOpen(false);
          setEditingProductId(null);
        }}
      />
    </div>
  );
};
