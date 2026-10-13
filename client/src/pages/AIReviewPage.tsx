import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSearchParams } from 'react-router-dom';
import { api } from '../api/client';
import {
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  RotateCcw,
  Check,
  Loader2,
  ShieldAlert,
} from 'lucide-react';
import { TopBar } from '../components/TopBar';
import type { Product, AgentPlanResult } from '../types';

export const AIReviewPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();

  // Load products list for review queue
  const { data: productsData, isLoading: loadingProducts } = useQuery({
    queryKey: ['products'],
    queryFn: () => api.getProducts(),
  });

  const products = productsData?.data || [];
  const initialProductId = Number(searchParams.get('productId')) || products[0]?.id || 1;
  const [selectedProductId, setSelectedProductId] = useState<number>(initialProductId);

  // Sync selected product with URL search param
  useEffect(() => {
    if (products.length > 0 && !selectedProductId) {
      setSelectedProductId(products[0].id);
    }
  }, [products, selectedProductId]);

  const selectedProduct = products.find((p) => p.id === selectedProductId) || products[0];

  // Fetch AI plan & review diagnosis for selected product
  const { data: planData, isLoading: loadingPlan, refetch: refetchPlan } = useQuery({
    queryKey: ['ai-plan', selectedProductId],
    queryFn: () => (selectedProductId ? api.agentPlan(selectedProductId) : Promise.reject()),
    enabled: !!selectedProductId,
  });

  // Fetch pre-flight diff to get WooCommerce comparison values
  const { data: diffData } = useQuery({
    queryKey: ['preflight-diff', selectedProductId],
    queryFn: () => (selectedProductId ? api.getPreFlightDiff(selectedProductId) : Promise.reject()),
    enabled: !!selectedProductId,
  });

  const [appliedRecommendations, setAppliedRecommendations] = useState<Record<string, boolean>>({});

  const applyRecommendationMutation = useMutation({
    mutationFn: async ({ field, value }: { field: string; value: any }) => {
      if (!selectedProduct) return;
      const payload: any = { ...selectedProduct };
      payload[field] = value;
      return api.updateProduct(selectedProduct.id, payload);
    },
    onSuccess: (_data, variables) => {
      setAppliedRecommendations((prev) => ({ ...prev, [variables.field]: true }));
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['preflight-diff', selectedProductId] });
      queryClient.invalidateQueries({ queryKey: ['ai-plan', selectedProductId] });
    },
  });

  const plan: AgentPlanResult | undefined = planData?.data;
  const diffs = diffData?.data?.diffs || [];

  // Comparison fields data matching realistic specs
  const fields = [
    {
      field: 'name',
      label: 'Product Name',
      pim: selectedProduct?.name || 'Nike Air Max Pro',
      woo: 'Nike Air Max Pro',
      isDiff: false,
    },
    {
      field: 'sku',
      label: 'SKU',
      pim: selectedProduct?.sku || 'NK-AM-001',
      woo: 'NK-AM-001',
      isDiff: false,
    },
    {
      field: 'price',
      label: 'Price',
      pim: `₹${selectedProduct?.regular_price || 8999}`,
      woo: '₹7,999',
      isDiff: true,
      recValue: 8999,
      note: 'WooCommerce target price is lower by ₹1,000.',
    },
    {
      field: 'category',
      label: 'Category',
      pim: selectedProduct?.category?.name || 'Running Shoes',
      woo: 'Footwear',
      isDiff: true,
      recValue: 'Running Shoes',
      note: "WooCommerce uses 'Footwear' while PIM uses 'Running Shoes'.",
    },
    {
      field: 'brand',
      label: 'Brand',
      pim: selectedProduct?.brand || 'Nike',
      woo: 'Nike',
      isDiff: false,
    },
    {
      field: 'description',
      label: 'Description',
      pim: selectedProduct?.description?.slice(0, 60) + '...' || 'Premium cushioning with breathable materials.',
      woo: 'Nike running shoes.',
      isDiff: true,
      note: 'PIM description contains full SEO attributes and specs.',
    },
    {
      field: 'stock_quantity',
      label: 'Stock',
      pim: String(selectedProduct?.stock_quantity ?? 24),
      woo: '20',
      isDiff: true,
      note: 'Inventory discrepancy detected (PIM: 24 vs Woo: 20).',
    },
  ];

  const score = selectedProduct?.quality_score ?? 71;

  return (
    <div className="flex-1 flex flex-col min-w-0 bg-[#f8fafc]">
      <TopBar breadcrumbs={['Operations', 'AI Review']} />

      <div className="p-6 max-w-6xl w-full mx-auto space-y-5">
        {/* Page Subheader & Queue Selector */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200">
          <div>
            <h1 className="text-base font-bold text-slate-900 tracking-tight flex items-center gap-2">
              AI Product Review
              <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">
                Operational Gate
              </span>
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Review and authorize AI-generated catalog fixes and WooCommerce synchronization reconciliations.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <label className="text-xs text-slate-500 font-medium">Select Product:</label>
            <select
              value={selectedProductId}
              onChange={(e) => {
                const id = Number(e.target.value);
                setSelectedProductId(id);
                setSearchParams({ productId: String(id) });
              }}
              className="px-2.5 py-1.5 bg-white border border-slate-200 rounded text-xs font-medium text-slate-800 focus:outline-none focus:ring-1 focus:ring-indigo-500 shadow-xs"
            >
              {products.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.sku} - {p.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Hero Review Header Card */}
        {selectedProduct && (
          <div className="border border-slate-200 rounded-md bg-white p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-bold text-slate-900">{selectedProduct.name}</h2>
                <span className="font-mono text-xs text-slate-500 px-1.5 py-0.5 bg-slate-100 rounded">
                  SKU: {selectedProduct.sku}
                </span>
              </div>
              <div className="text-xs text-slate-500 mt-1 flex items-center gap-3">
                <span>Category: <strong className="text-slate-700">{selectedProduct.category?.name || 'Footwear'}</strong></span>
                <span>·</span>
                <span>Regular Price: <strong className="text-slate-700">₹{selectedProduct.regular_price || 8999}</strong></span>
                <span>·</span>
                <span>Stock: <strong className="text-slate-700">{selectedProduct.stock_quantity ?? 24} units</strong></span>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="text-right">
                <div className="text-[11px] text-slate-500 font-medium">AI Quality Score</div>
                <div className="flex items-center gap-1.5 justify-end mt-0.5">
                  <span
                    className={`w-2 h-2 rounded-full ${
                      score >= 80 ? 'bg-emerald-500' : score >= 65 ? 'bg-amber-500' : 'bg-rose-500'
                    }`}
                  />
                  <span className="font-mono text-sm font-bold text-slate-900">
                    {score}<span className="text-xs text-slate-400 font-normal">/100</span>
                  </span>
                </div>
              </div>

              <button
                onClick={() => refetchPlan()}
                className="px-2.5 py-1.5 rounded border border-slate-200 hover:bg-slate-50 text-xs font-semibold text-slate-700 transition-colors flex items-center gap-1"
                title="Re-run assessment"
              >
                <RotateCcw className={`w-3.5 h-3.5 ${loadingPlan ? 'animate-spin' : ''}`} />
                Re-evaluate
              </button>
            </div>
          </div>
        )}

        {/* 2-Column Grid: Comparison Table (Left) + AI Recommendations (Right) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          {/* Comparison Table (Left Column) */}
          <div className="lg:col-span-7 border border-slate-200 rounded-md bg-white overflow-hidden flex flex-col">
            <div className="px-4 py-2.5 border-b border-slate-200 bg-slate-50/60 flex items-center justify-between">
              <div className="text-xs font-bold text-slate-800 uppercase tracking-wide text-[11px]">
                Field Comparison (PIM vs WooCommerce)
              </div>
              <span className="text-[11px] text-slate-400">
                Only discrepancies flagged
              </span>
            </div>

            <div className="overflow-x-auto w-full">
              <table className="w-full text-left text-xs min-w-[480px]">
                <thead className="bg-slate-50/40 border-b border-slate-200 text-slate-500 font-semibold text-[11px] uppercase tracking-wider">
                  <tr>
                    <th className="py-2.5 px-3.5">Field</th>
                    <th className="py-2.5 px-3.5">PIM Value</th>
                    <th className="py-2.5 px-3.5">WooCommerce</th>
                    <th className="py-2.5 px-3.5 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {fields.map((f, i) => (
                    <tr
                      key={i}
                      className={`transition-colors ${
                        f.isDiff ? 'bg-amber-50/30 hover:bg-amber-50/50' : 'hover:bg-slate-50/60'
                      }`}
                    >
                      <td className="py-2.5 px-3.5 font-medium text-slate-900 whitespace-nowrap">
                        {f.label}
                      </td>
                      <td className="py-2.5 px-3.5 font-mono text-[11.5px] text-slate-800 max-w-[150px] truncate">
                        {f.pim}
                      </td>
                      <td className="py-2.5 px-3.5 font-mono text-[11.5px] text-slate-600 max-w-[150px] truncate">
                        {f.woo}
                      </td>
                      <td className="py-2.5 px-3.5 text-center whitespace-nowrap">
                        {f.isDiff ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold bg-amber-100 text-amber-800 border border-amber-200">
                            Differs
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-600 border border-slate-200">
                            Match
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* AI Recommendation Panel (Right Column) */}
          <div className="lg:col-span-5 space-y-4">
            <div className="border border-slate-200 rounded-md bg-white p-4 space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-indigo-600" />
                  <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wide">
                    AI Recommendations
                  </h3>
                </div>
                <span className="text-[10px] font-semibold bg-indigo-50 text-indigo-700 px-1.5 py-0.5 rounded">
                  Requires Approval
                </span>
              </div>

              {/* Recommendation 1: Category Mismatch */}
              <div className="p-3 rounded border border-slate-200 bg-slate-50/50 space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <div className="text-xs font-bold text-slate-900">
                    Category Mismatch
                  </div>
                  <span className="text-[10px] font-semibold text-amber-700 bg-amber-100 px-1.5 py-0.2 rounded">
                    Medium
                  </span>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  WooCommerce uses generic <code className="px-1 py-0.5 bg-white border border-slate-200 rounded text-[11px]">Footwear</code> while PIM specifies <code className="px-1 py-0.5 bg-white border border-slate-200 rounded text-[11px]">Running Shoes</code>.
                </p>
                <div className="pt-1 flex items-center justify-between">
                  <span className="text-[11px] text-slate-400 font-medium">Proposed: Map to Running Shoes</span>
                  <button
                    onClick={() =>
                      applyRecommendationMutation.mutate({ field: 'category_id', value: 1 })
                    }
                    disabled={appliedRecommendations['category_id']}
                    className={`px-2.5 py-1 rounded text-xs font-semibold transition-colors flex items-center gap-1 ${
                      appliedRecommendations['category_id']
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : 'bg-indigo-600 hover:bg-indigo-700 text-white'
                    }`}
                  >
                    {appliedRecommendations['category_id'] ? (
                      <>
                        <Check className="w-3 h-3" />
                        Applied
                      </>
                    ) : (
                      'Apply Recommendation'
                    )}
                  </button>
                </div>
              </div>

              {/* Recommendation 2: Price Reconciliation */}
              <div className="p-3 rounded border border-slate-200 bg-slate-50/50 space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <div className="text-xs font-bold text-slate-900">
                    Price Discrepancy
                  </div>
                  <span className="text-[10px] font-semibold text-amber-700 bg-amber-100 px-1.5 py-0.2 rounded">
                    High
                  </span>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  PIM master price is set to <strong className="text-slate-800">₹8,999</strong>, but WooCommerce target is currently <strong className="text-slate-800">₹7,999</strong>. Synchronizing will update remote pricing.
                </p>
                <div className="pt-1 flex items-center justify-between">
                  <span className="text-[11px] text-slate-400 font-medium">Action: Enforce PIM Master Price</span>
                  <button
                    onClick={() =>
                      applyRecommendationMutation.mutate({ field: 'regular_price', value: 8999 })
                    }
                    disabled={appliedRecommendations['regular_price']}
                    className={`px-2.5 py-1 rounded text-xs font-semibold transition-colors flex items-center gap-1 ${
                      appliedRecommendations['regular_price']
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : 'bg-indigo-600 hover:bg-indigo-700 text-white'
                    }`}
                  >
                    {appliedRecommendations['regular_price'] ? (
                      <>
                        <Check className="w-3 h-3" />
                        Applied
                      </>
                    ) : (
                      'Apply Recommendation'
                    )}
                  </button>
                </div>
              </div>

              {/* Recommendation 3: SEO Description Enrichment */}
              <div className="p-3 rounded border border-slate-200 bg-slate-50/50 space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <div className="text-xs font-bold text-slate-900">
                    SEO Description Enrichment
                  </div>
                  <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-100 px-1.5 py-0.2 rounded">
                    Ready
                  </span>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Remote description is minimal. PIM contains technical features (cushioning specs, breathable upper, athletic sizing).
                </p>
                <div className="pt-1 flex items-center justify-between">
                  <span className="text-[11px] text-slate-400 font-medium">Action: Push Rich Copy</span>
                  <button
                    onClick={() =>
                      applyRecommendationMutation.mutate({
                        field: 'description',
                        value: selectedProduct?.description,
                      })
                    }
                    disabled={appliedRecommendations['description']}
                    className={`px-2.5 py-1 rounded text-xs font-semibold transition-colors flex items-center gap-1 ${
                      appliedRecommendations['description']
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : 'bg-indigo-600 hover:bg-indigo-700 text-white'
                    }`}
                  >
                    {appliedRecommendations['description'] ? (
                      <>
                        <Check className="w-3 h-3" />
                        Applied
                      </>
                    ) : (
                      'Apply Recommendation'
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* Operational notice */}
            <div className="p-3 rounded border border-slate-200 bg-white text-xs text-slate-500 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>All AI recommendations require human sign-off before publishing to WooCommerce.</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
