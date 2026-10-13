import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
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
  Edit2,
  Trash2,
  GitCompare,
  Filter,
} from 'lucide-react';
import { TopBar } from '../components/TopBar';
import { PreFlightDiffModal } from '../components/PreFlightDiffModal';
import { ProductEditorModal } from '../components/ProductEditorModal';
import type { Product } from '../types';

export const CatalogPage: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [qualityFilter, setQualityFilter] = useState('all');

  const [inspectProductId, setInspectProductId] = useState<number | null>(null);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [actionMenuOpenId, setActionMenuOpenId] = useState<number | null>(null);

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

  const filteredProducts = products.filter((p) => {
    if (qualityFilter === 'high') return (p.quality_score ?? 0) >= 80;
    if (qualityFilter === 'medium') return (p.quality_score ?? 0) >= 60 && (p.quality_score ?? 0) < 80;
    if (qualityFilter === 'low') return (p.quality_score ?? 0) < 60;
    return true;
  });

  const getQualityBadge = (score: number) => {
    if (score >= 85) {
      return (
        <span className="inline-flex items-center gap-1 font-mono text-xs font-semibold text-emerald-700">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
          {score}/100
        </span>
      );
    }
    if (score >= 70) {
      return (
        <span className="inline-flex items-center gap-1 font-mono text-xs font-semibold text-amber-700">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
          {score}/100
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 font-mono text-xs font-semibold text-rose-700">
        <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
        {score}/100
      </span>
    );
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'synced':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
            Synced
          </span>
        );
      case 'modified':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-amber-50 text-amber-700 border border-amber-200">
            Pending sync
          </span>
        );
      case 'error':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-rose-50 text-rose-700 border border-rose-200">
            Sync error
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-slate-100 text-slate-700 border border-slate-200">
            Draft
          </span>
        );
    }
  };

  return (
    <div className="flex-1 flex flex-col min-w-0 bg-[#f8fafc]">
      <TopBar breadcrumbs={['Workspace', 'Catalog']} search={search} onSearchChange={setSearch} />

      <div className="p-6 max-w-6xl w-full mx-auto space-y-4">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200">
          <div>
            <h1 className="text-base font-bold text-slate-900 tracking-tight">Product Catalog</h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Master catalog repository. Manage SKUs, pricing, specifications and publishing channels.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                setEditingProduct(null);
                setIsEditorOpen(true);
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              Add Product
            </button>
          </div>
        </div>

        {/* Compact Filters Bar */}
        <div className="p-2.5 rounded-md bg-white border border-slate-200 flex flex-wrap items-center justify-between gap-2.5 text-xs">
          <div className="flex flex-wrap items-center gap-2 flex-1">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="py-1 px-2.5 bg-white border border-slate-200 rounded text-xs text-slate-700 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            >
              <option value="all">All Categories</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>

            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="py-1 px-2.5 bg-white border border-slate-200 rounded text-xs text-slate-700 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            >
              <option value="all">All Statuses</option>
              <option value="synced">Synced</option>
              <option value="modified">Pending Sync</option>
              <option value="error">Sync Error</option>
              <option value="not_synced">Draft</option>
            </select>

            <select
              value={qualityFilter}
              onChange={(e) => setQualityFilter(e.target.value)}
              className="py-1 px-2.5 bg-white border border-slate-200 rounded text-xs text-slate-700 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            >
              <option value="all">All Quality Scores</option>
              <option value="high">Score &gt;= 80</option>
              <option value="medium">Score 60 - 79</option>
              <option value="low">Score &lt; 60</option>
            </select>

            {(search || selectedCategory !== 'all' || selectedStatus !== 'all' || qualityFilter !== 'all') && (
              <button
                onClick={() => {
                  setSearch('');
                  setSelectedCategory('all');
                  setSelectedStatus('all');
                  setQualityFilter('all');
                }}
                className="text-xs text-slate-500 hover:text-slate-800 px-2 py-1"
              >
                Reset
              </button>
            )}
          </div>

          <div className="text-xs text-slate-500">
            Showing <strong className="text-slate-800">{filteredProducts.length}</strong> items
          </div>
        </div>

        {/* Dense Catalog Table */}
        <div className="border border-slate-200 rounded-md bg-white overflow-hidden">
          <div className="overflow-x-auto w-full">
            <table className="w-full text-left text-xs min-w-[780px]">
              <thead className="bg-slate-50/60 border-b border-slate-200 text-slate-500 font-semibold text-[11px] uppercase tracking-wider">
                <tr>
                  <th className="py-2.5 px-4">SKU</th>
                  <th className="py-2.5 px-4">Product Name</th>
                  <th className="py-2.5 px-4">Category</th>
                  <th className="py-2.5 px-4">Price</th>
                  <th className="py-2.5 px-4">Stock</th>
                  <th className="py-2.5 px-4">Quality</th>
                  <th className="py-2.5 px-4">Sync Status</th>
                  <th className="py-2.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredProducts.map((p) => {
                  const score = p.quality_score ?? 85;
                  return (
                    <tr key={p.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-2.5 px-4 font-mono text-[11px] text-slate-700 font-medium whitespace-nowrap">
                        {p.sku}
                      </td>
                      <td className="py-2.5 px-4 font-medium text-slate-900">
                        <div className="truncate max-w-xs">{p.name}</div>
                        <div className="text-[11px] text-slate-400 truncate max-w-xs">{p.brand || 'Nike'}</div>
                      </td>
                      <td className="py-2.5 px-4 text-slate-600 whitespace-nowrap">
                        {p.category?.name || 'Footwear'}
                      </td>
                      <td className="py-2.5 px-4 font-mono font-medium text-slate-900 whitespace-nowrap">
                        ₹{p.price || p.regular_price}
                      </td>
                      <td className="py-2.5 px-4 font-mono text-slate-700 whitespace-nowrap">
                        {p.stock_quantity ?? 0}
                      </td>
                      <td className="py-2.5 px-4 whitespace-nowrap">{getQualityBadge(score)}</td>
                      <td className="py-2.5 px-4 whitespace-nowrap">{getStatusBadge(p.sync_status)}</td>
                      <td className="py-2.5 px-4 text-right whitespace-nowrap space-x-1.5">
                        <button
                          onClick={() => navigate(`/ai-review?productId=${p.id}`)}
                          className="px-2 py-1 rounded text-[11px] font-medium text-indigo-700 hover:bg-indigo-50 border border-slate-200 transition-colors"
                        >
                          AI Review
                        </button>
                        <button
                          onClick={() => setInspectProductId(p.id)}
                          className="px-2 py-1 rounded text-[11px] font-medium text-slate-700 hover:bg-slate-100 border border-slate-200 transition-colors"
                        >
                          Inspect
                        </button>
                        <button
                          onClick={() => {
                            setEditingProduct(p);
                            setIsEditorOpen(true);
                          }}
                          className="p-1 rounded text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
                          title="Edit product"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Pre-flight Diff Modal */}
      <PreFlightDiffModal
        productId={inspectProductId}
        isOpen={!!inspectProductId}
        onClose={() => setInspectProductId(null)}
      />

      {/* Product Editor Modal */}
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
