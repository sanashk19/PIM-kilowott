import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate, Link } from 'react-router-dom';
import { api } from '../api/client';
import {
  Search,
  Plus,
  Download,
  Upload,
  MoreHorizontal,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Sparkles,
  Edit2,
  Trash2,
  GitCompare,
  SlidersHorizontal,
  ChevronDown,
  Eye,
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
  const [selectedIds, setSelectedIds] = useState<number[]>([]);

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
    if (qualityFilter === 'medium')
      return (p.quality_score ?? 0) >= 60 && (p.quality_score ?? 0) < 80;
    if (qualityFilter === 'low') return (p.quality_score ?? 0) < 60;
    return true;
  });

  const allSelected =
    filteredProducts.length > 0 && selectedIds.length === filteredProducts.length;

  const toggleSelectAll = () => {
    if (allSelected) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredProducts.map((p) => p.id));
    }
  };

  const toggleSelectOne = (id: number) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const getQualityBadge = (score: number) => {
    if (score >= 85) {
      return (
        <span className="inline-flex items-center justify-center w-8 py-0.5 rounded text-[11px] font-bold font-mono bg-[#f0fdf4] text-[#15803d] border border-[#bbf7d0]">
          {score}
        </span>
      );
    }
    if (score >= 60) {
      return (
        <span className="inline-flex items-center justify-center w-8 py-0.5 rounded text-[11px] font-bold font-mono bg-[#fffbeb] text-[#b45309] border border-[#fde68a]">
          {score}
        </span>
      );
    }
    return (
      <span className="inline-flex items-center justify-center w-8 py-0.5 rounded text-[11px] font-bold font-mono bg-[#fef2f2] text-[#dc2626] border border-[#fecaca]">
        {score}
      </span>
    );
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'synced':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-[#f0fdf4] text-[#15803d] border border-[#bbf7d0]">
            Synced
          </span>
        );
      case 'modified':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-[#fffbeb] text-[#b45309] border border-[#fde68a]">
            Draft
          </span>
        );
      case 'error':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-[#fef2f2] text-[#b91c1c] border border-[#fecaca]">
            Error
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-[#f4f2ec] text-[#5c6660] border border-[#e6e4df]">
            Draft
          </span>
        );
    }
  };

  return (
    <div className="flex-1 bg-[#fbfaf8] min-h-screen flex flex-col">
      <TopBar
        breadcrumbs={['Workspace', 'Catalog']}
        search={search}
        onSearchChange={setSearch}
      />

      <div className="p-6 max-w-7xl w-full mx-auto space-y-5">
        {/* Page Header (Matching Panel 2) */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold text-[#111916] tracking-tight">Products</h1>
            <p className="text-xs text-[#5c6660] mt-0.5">
              Manage your product catalog, analyze quality, and sync with WooCommerce.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => alert('Import CSV ready in production.')}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-[#f4f2ec] border border-[#e6e4df] rounded-md text-xs font-medium text-[#19201d] transition-colors shadow-2xs"
            >
              <Upload className="w-3.5 h-3.5 text-[#5c6660]" />
              <span>Import</span>
            </button>

            <button
              type="button"
              onClick={() => alert('Exporting catalog to CSV...')}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-[#f4f2ec] border border-[#e6e4df] rounded-md text-xs font-medium text-[#19201d] transition-colors shadow-2xs"
            >
              <Download className="w-3.5 h-3.5 text-[#5c6660]" />
              <span>Export</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setEditingProduct(null);
                setIsEditorOpen(true);
              }}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-[#15803d] hover:bg-[#166534] text-white rounded-md text-xs font-semibold transition-colors shadow-2xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Product</span>
            </button>
          </div>
        </div>

        {/* Filter Controls Row (Matching Panel 2) */}
        <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3 rounded-lg border border-[#e6e4df] shadow-2xs">
          {/* Left search */}
          <div className="relative flex-1 min-w-[240px] max-w-sm">
            <Search className="w-3.5 h-3.5 text-[#8a948e] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by product name, SKU..."
              className="w-full pl-9 pr-3 py-1.5 bg-[#fbfaf8] hover:bg-white focus:bg-white border border-[#e6e4df] rounded-md text-xs text-[#19201d] placeholder:text-[#8a948e] focus:outline-none focus:ring-1 focus:ring-[#15803d]"
            />
          </div>

          {/* Right dropdown filters */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Category filter */}
            <div className="relative">
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="appearance-none bg-[#fbfaf8] hover:bg-white border border-[#e6e4df] text-xs font-medium text-[#19201d] pl-2.5 pr-7 py-1.5 rounded-md focus:outline-none focus:ring-1 focus:ring-[#15803d]"
              >
                <option value="all">Category: All</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id.toString()}>
                    {c.name}
                  </option>
                ))}
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-[#8a948e] absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>

            {/* Status filter */}
            <div className="relative">
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="appearance-none bg-[#fbfaf8] hover:bg-white border border-[#e6e4df] text-xs font-medium text-[#19201d] pl-2.5 pr-7 py-1.5 rounded-md focus:outline-none focus:ring-1 focus:ring-[#15803d]"
              >
                <option value="all">Status: All</option>
                <option value="draft">Draft</option>
                <option value="synced">Synced</option>
                <option value="modified">Modified</option>
                <option value="error">Error</option>
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-[#8a948e] absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>

            {/* Quality Score filter */}
            <div className="relative">
              <select
                value={qualityFilter}
                onChange={(e) => setQualityFilter(e.target.value)}
                className="appearance-none bg-[#fbfaf8] hover:bg-white border border-[#e6e4df] text-xs font-medium text-[#19201d] pl-2.5 pr-7 py-1.5 rounded-md focus:outline-none focus:ring-1 focus:ring-[#15803d]"
              >
                <option value="all">Quality Score: All</option>
                <option value="high">High (80+)</option>
                <option value="medium">Medium (60-79)</option>
                <option value="low">Needs Attention (&lt;60)</option>
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-[#8a948e] absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>

            <button
              type="button"
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 bg-[#fbfaf8] hover:bg-white border border-[#e6e4df] rounded-md text-xs font-medium text-[#5c6660] transition-colors"
            >
              <SlidersHorizontal className="w-3 h-3" />
              <span>More Filters</span>
            </button>
          </div>
        </div>

        {/* Bulk Selection Bar */}
        {selectedIds.length > 0 && (
          <div className="bg-[#111916] text-white px-4 py-2.5 rounded-lg flex items-center justify-between text-xs animate-in fade-in duration-150">
            <span className="font-medium">
              {selectedIds.length} product{selectedIds.length > 1 ? 's' : ''} selected
            </span>
            <div className="flex items-center gap-2">
              <Link
                to="/app/ai-review"
                className="px-2.5 py-1 bg-[#1b2e23] hover:bg-[#253e30] text-[#86efac] border border-[#2e4d39] rounded font-medium transition-colors flex items-center gap-1.5"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Bulk AI Review</span>
              </Link>
              <Link
                to="/app/sync-inspector"
                className="px-2.5 py-1 bg-[#15803d] hover:bg-[#166534] text-white rounded font-medium transition-colors flex items-center gap-1.5"
              >
                <GitCompare className="w-3.5 h-3.5" />
                <span>Bulk Pre-Flight Sync</span>
              </Link>
              <button
                type="button"
                onClick={() => setSelectedIds([])}
                className="px-2 py-1 text-[#9ea8a2] hover:text-white"
              >
                Deselect
              </button>
            </div>
          </div>
        )}

        {/* Enterprise Data Table (Matching Panel 2) */}
        <div className="bg-white border border-[#e6e4df] rounded-lg shadow-2xs overflow-hidden">
          <div className="overflow-x-auto w-full min-w-[840px]">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-[#fbfaf8] border-b border-[#e6e4df] text-[#5c6660] font-semibold">
                  <th className="py-2.5 px-3.5 w-10 text-center">
                    <input
                      type="checkbox"
                      checked={allSelected}
                      onChange={toggleSelectAll}
                      className="rounded border-[#cbd5e1] text-[#15803d] focus:ring-[#15803d]"
                    />
                  </th>
                  <th className="py-2.5 px-3 font-medium text-[#5c6660]">Product</th>
                  <th className="py-2.5 px-3 font-medium text-[#5c6660]">SKU</th>
                  <th className="py-2.5 px-3 font-medium text-[#5c6660]">Category</th>
                  <th className="py-2.5 px-3 font-medium text-[#5c6660]">Price</th>
                  <th className="py-2.5 px-3 font-medium text-[#5c6660]">Stock</th>
                  <th className="py-2.5 px-3 font-medium text-[#5c6660] text-center">Quality</th>
                  <th className="py-2.5 px-3 font-medium text-[#5c6660]">Sync Status</th>
                  <th className="py-2.5 px-3 font-medium text-[#5c6660] text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#f4f2ec]">
                {isLoading ? (
                  <tr>
                    <td colSpan={9} className="py-12 text-center text-[#7d8b82]">
                      Loading catalog repository...
                    </td>
                  </tr>
                ) : filteredProducts.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="py-12 text-center text-[#7d8b82]">
                      No products match your active search or filters.
                    </td>
                  </tr>
                ) : (
                  filteredProducts.map((p) => {
                    const isSelected = selectedIds.includes(p.id);
                    const categoryName = p.categories?.[0]?.name || 'Uncategorized';

                    return (
                      <tr
                        key={p.id}
                        className={`hover:bg-[#fbfaf8] transition-colors group ${
                          isSelected ? 'bg-[#f0fdf4]/40' : ''
                        }`}
                      >
                        {/* Checkbox */}
                        <td className="py-2.5 px-3.5 text-center">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => toggleSelectOne(p.id)}
                            className="rounded border-[#cbd5e1] text-[#15803d] focus:ring-[#15803d]"
                          />
                        </td>

                        {/* Product info with Thumbnail */}
                        <td className="py-2.5 px-3">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-md bg-[#f4f2ec] border border-[#e6e4df] flex items-center justify-center shrink-0 overflow-hidden">
                              {p.image_url ? (
                                <img
                                  src={p.image_url}
                                  alt={p.name}
                                  className="w-full h-full object-cover object-center"
                                />
                              ) : (
                                <div className="text-[10px] font-bold text-[#8a948e]">
                                  {p.name.substring(0, 2).toUpperCase()}
                                </div>
                              )}
                            </div>
                            <div className="min-w-0">
                              <Link
                                to={`/app/catalog/${p.id}`}
                                className="font-semibold text-[#111916] hover:text-[#15803d] transition-colors truncate block max-w-[240px]"
                                title={p.name}
                              >
                                {p.name}
                              </Link>
                              <div className="text-[11px] text-[#7d8b82]">{p.brand || '—'}</div>
                            </div>
                          </div>
                        </td>

                        {/* SKU */}
                        <td className="py-2.5 px-3 font-mono text-xs text-[#5c6660]">
                          {p.sku || <span className="text-[#dc2626] font-bold">MISSING</span>}
                        </td>

                        {/* Category */}
                        <td className="py-2.5 px-3 text-[#5c6660]">{categoryName}</td>

                        {/* Price */}
                        <td className="py-2.5 px-3 font-medium text-[#111916]">
                          ₹{p.regular_price?.toLocaleString('en-IN') ?? '—'}
                        </td>

                        {/* Stock */}
                        <td className="py-2.5 px-3 tabular-nums text-[#5c6660]">
                          {p.stock_quantity ?? 0}
                        </td>

                        {/* Quality Score */}
                        <td className="py-2.5 px-3 text-center">
                          {getQualityBadge(p.quality_score ?? 60)}
                        </td>

                        {/* Sync Status */}
                        <td className="py-2.5 px-3">{getStatusBadge(p.sync_status)}</td>

                        {/* Compact Actions Menu */}
                        <td className="py-2.5 px-3 text-right relative">
                          <div className="inline-flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => navigate(`/app/catalog/${p.id}`)}
                              className="p-1 text-[#7d8b82] hover:text-[#111916] hover:bg-[#f4f2ec] rounded"
                              title="View details"
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setEditingProduct(p);
                                setIsEditorOpen(true);
                              }}
                              className="p-1 text-[#7d8b82] hover:text-[#111916] hover:bg-[#f4f2ec] rounded"
                              title="Edit product"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => setInspectProductId(p.id)}
                              className="p-1 text-[#7d8b82] hover:text-[#15803d] hover:bg-[#f0fdf4] rounded"
                              title="Dry Run Sync Diff"
                            >
                              <GitCompare className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                if (confirm(`Delete product ${p.name}?`)) {
                                  deleteMutation.mutate(p.id);
                                }
                              }}
                              className="p-1 text-[#7d8b82] hover:text-[#dc2626] hover:bg-[#fef2f2] rounded"
                              title="Delete"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination Footer */}
          <div className="p-3 bg-[#fbfaf8] border-t border-[#e6e4df] flex items-center justify-between text-xs text-[#7d8b82]">
            <span>
              Showing {filteredProducts.length} of {products.length} products
            </span>
            <div className="flex items-center gap-1">
              <button
                type="button"
                disabled
                className="px-2 py-1 rounded border border-[#e6e4df] bg-white text-[#cbd5e1] cursor-not-allowed"
              >
                Previous
              </button>
              <button
                type="button"
                className="px-2.5 py-1 rounded bg-[#111916] text-white font-medium"
              >
                1
              </button>
              <button
                type="button"
                disabled
                className="px-2 py-1 rounded border border-[#e6e4df] bg-white text-[#cbd5e1] cursor-not-allowed"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Product Editor Modal */}
      <ProductEditorModal
        isOpen={isEditorOpen}
        onClose={() => setIsEditorOpen(false)}
        product={editingProduct}
      />

      {/* Pre-Flight Diff Modal */}
      {inspectProductId !== null && (
        <PreFlightDiffModal
          productId={inspectProductId}
          isOpen={true}
          onClose={() => setInspectProductId(null)}
        />
      )}
    </div>
  );
};
