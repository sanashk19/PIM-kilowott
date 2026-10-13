import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSearchParams } from 'react-router-dom';
import { api } from '../api/client';
import {
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Check,
  ChevronDown,
  ChevronRight,
  ArrowRight,
  ShieldCheck,
  Loader2,
} from 'lucide-react';
import { TopBar } from '../components/TopBar';

export const AIReviewPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();

  const { data: productsData } = useQuery({
    queryKey: ['products'],
    queryFn: () => api.getProducts(),
  });

  const products = productsData?.data || [];
  const initialProductId = Number(searchParams.get('productId')) || products[0]?.id || 1;
  const [selectedProductId, setSelectedProductId] = useState<number>(initialProductId);

  useEffect(() => {
    if (products.length > 0 && !selectedProductId) {
      setSelectedProductId(products[0].id);
    }
  }, [products, selectedProductId]);

  const selectedProduct = products.find((p) => p.id === selectedProductId) || products[0];

  const { data: planData, isLoading: loadingPlan, refetch: refetchPlan } = useQuery({
    queryKey: ['ai-plan', selectedProductId],
    queryFn: () => (selectedProductId ? api.agentPlan(selectedProductId) : Promise.reject()),
    enabled: !!selectedProductId,
  });

  const [appliedRecommendations, setAppliedRecommendations] = useState<Record<string, boolean>>({});

  const applyRecommendationMutation = useMutation({
    mutationFn: async ({ field, value }: { field: string; value: any }) => {
      if (!selectedProduct) return;
      const payload: any = { ...selectedProduct };
      if (field === 'description') payload.description = value;
      if (field === 'category_id') payload.category_id = value;
      if (field === 'regular_price') payload.regular_price = value;
      return api.updateProduct(selectedProduct.id, payload);
    },
    onSuccess: (_, vars) => {
      setAppliedRecommendations((prev) => ({ ...prev, [vars.field]: true }));
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['product', selectedProductId] });
    },
  });

  const qualityScore = selectedProduct?.quality_score ?? 57;

  const defaultImprovedDesc =
    'Experience immersive, studio-grade sound with the Apex Pro Wireless Headphones. Engineered with 40mm titanium acoustic drivers, adaptive active noise cancellation, and ultra-plush memory foam earcups for unmatched all-day listening comfort.';

  return (
    <div className="flex-1 bg-[#fbfaf8] min-h-screen flex flex-col">
      <TopBar breadcrumbs={['Operations', 'AI Review']} />

      <div className="p-6 max-w-7xl w-full mx-auto space-y-6">
        {/* Header Row with Title & Product Dropdown (Panel 4) */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold text-[#111916] tracking-tight">
              AI Product Review
            </h1>
            <p className="text-xs text-[#5c6660] mt-0.5">
              Analyze, improve, and prepare your product for WooCommerce.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <div className="relative min-w-[280px]">
              <select
                value={selectedProductId}
                onChange={(e) => {
                  const id = Number(e.target.value);
                  setSelectedProductId(id);
                  setSearchParams({ productId: id.toString() });
                }}
                className="w-full appearance-none bg-white border border-[#e6e4df] text-xs font-semibold text-[#111916] pl-3 pr-8 py-2 rounded-md shadow-2xs hover:border-[#cbd5e1] focus:outline-none focus:ring-1 focus:ring-[#15803d]"
              >
                {products.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.sku || 'NO-SKU'})
                  </option>
                ))}
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-[#8a948e] absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>
        </div>

        {/* 3-Column Layout Matching Reference Panel 4 */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* COLUMN 1: Workflow Stepper (Left, col-span-3) */}
          <div className="lg:col-span-3 bg-white border border-[#e6e4df] rounded-lg p-5 shadow-2xs space-y-5">
            <div className="text-xs font-bold text-[#111916] uppercase tracking-wider">
              Review Pipeline
            </div>

            <div className="space-y-4 relative">
              {/* Vertical connector line */}
              <div className="absolute left-3.5 top-3 bottom-3 w-px bg-[#e6e4df] -z-0" />

              {/* Step 1: Analyze Product */}
              <div className="flex items-start gap-3 relative z-10">
                <div className="w-7 h-7 rounded-full bg-[#15803d] text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-2xs">
                  <Check className="w-3.5 h-3.5" />
                </div>
                <div>
                  <div className="font-semibold text-xs text-[#111916]">1. Analyze Product</div>
                  <div className="text-[11px] text-[#7d8b82]">Checking product data...</div>
                </div>
              </div>

              {/* Step 2: Identify Issues */}
              <div className="flex items-start gap-3 relative z-10">
                <div className="w-7 h-7 rounded-full bg-[#15803d] text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-2xs">
                  <Check className="w-3.5 h-3.5" />
                </div>
                <div>
                  <div className="font-semibold text-xs text-[#111916]">2. Identify Issues</div>
                  <div className="text-[11px] text-[#7d8b82]">Found 5 issues</div>
                </div>
              </div>

              {/* Step 3: Generate Recommendations (Active) */}
              <div className="flex items-start gap-3 relative z-10">
                <div className="w-7 h-7 rounded-full bg-[#7c3aed] text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-xs ring-4 ring-[#f5f3ff]">
                  3
                </div>
                <div>
                  <div className="font-semibold text-xs text-[#7c3aed]">
                    3. Generate Recommendations
                  </div>
                  <div className="text-[11px] text-[#7c3aed] font-medium">
                    AI is suggesting fixes...
                  </div>
                </div>
              </div>

              {/* Step 4: Review Changes */}
              <div className="flex items-start gap-3 relative z-10 opacity-60">
                <div className="w-7 h-7 rounded-full bg-[#f4f2ec] text-[#7d8b82] border border-[#e6e4df] flex items-center justify-center font-bold text-xs shrink-0">
                  4
                </div>
                <div>
                  <div className="font-semibold text-xs text-[#5c6660]">4. Review Changes</div>
                  <div className="text-[11px] text-[#8a948e]">Approve or modify</div>
                </div>
              </div>

              {/* Step 5: Validate */}
              <div className="flex items-start gap-3 relative z-10 opacity-60">
                <div className="w-7 h-7 rounded-full bg-[#f4f2ec] text-[#7d8b82] border border-[#e6e4df] flex items-center justify-center font-bold text-xs shrink-0">
                  5
                </div>
                <div>
                  <div className="font-semibold text-xs text-[#5c6660]">5. Validate</div>
                  <div className="text-[11px] text-[#8a948e]">Running validations...</div>
                </div>
              </div>

              {/* Step 6: Ready to Sync */}
              <div className="flex items-start gap-3 relative z-10 opacity-60">
                <div className="w-7 h-7 rounded-full bg-[#f4f2ec] text-[#7d8b82] border border-[#e6e4df] flex items-center justify-center font-bold text-xs shrink-0">
                  6
                </div>
                <div>
                  <div className="font-semibold text-xs text-[#5c6660]">6. Ready to Sync</div>
                  <div className="text-[11px] text-[#8a948e]">Prepare synchronization plan</div>
                </div>
              </div>
            </div>
          </div>

          {/* COLUMN 2: Analysis Complete & Issues (Center, col-span-4) */}
          <div className="lg:col-span-4 space-y-4">
            {/* Analysis Complete Card with Robot Assistant */}
            <div className="bg-white border border-[#e6e4df] rounded-lg p-5 shadow-2xs space-y-4">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-bold text-sm text-[#111916]">Analysis Complete</h3>
                  <p className="text-xs text-[#5c6660] mt-0.5 leading-snug">
                    I found 5 issues that may affect your WooCommerce listing.
                  </p>
                </div>
                <img
                  src="/assets/robot-assistant.svg"
                  alt="AI Assistant"
                  className="w-12 h-12 shrink-0 -mt-1"
                />
              </div>

              {/* Gauge and Re-analyze */}
              <div className="flex items-center justify-between pt-2">
                <div className="flex items-center gap-3">
                  <div className="relative w-14 h-14 flex items-center justify-center">
                    <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                      <circle
                        cx="18"
                        cy="18"
                        r="15"
                        fill="none"
                        stroke="#f4f2ec"
                        strokeWidth="3.5"
                      />
                      <circle
                        cx="18"
                        cy="18"
                        r="15"
                        fill="none"
                        stroke="#dc2626"
                        strokeWidth="3.5"
                        strokeDasharray="94.2"
                        strokeDashoffset={94.2 * (1 - qualityScore / 100)}
                        strokeLinecap="round"
                      />
                    </svg>
                    <span className="absolute font-mono font-bold text-xs text-[#111916]">
                      {qualityScore}
                    </span>
                  </div>
                  <div>
                    <div className="font-bold text-xs text-[#111916]">
                      {qualityScore} <span className="text-[#7d8b82] font-normal">/ 100</span>
                    </div>
                    <div className="text-[10px] text-[#dc2626] font-semibold">
                      Needs Attention
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => refetchPlan()}
                  disabled={loadingPlan}
                  className="px-2.5 py-1.5 rounded-md border border-[#e6e4df] bg-[#fbfaf8] hover:bg-white text-xs font-medium text-[#19201d] flex items-center gap-1.5 shadow-2xs"
                >
                  <RotateCcw
                    className={`w-3.5 h-3.5 text-[#5c6660] ${loadingPlan ? 'animate-spin' : ''}`}
                  />
                  <span>Re-analyze</span>
                </button>
              </div>
            </div>

            {/* Issues Found (5) List (Panel 4) */}
            <div className="bg-white border border-[#e6e4df] rounded-lg p-5 shadow-2xs space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold text-[#111916] uppercase tracking-wider">
                  Issues Found (5)
                </h3>
              </div>

              <div className="space-y-2 text-xs">
                {/* Issue 1 */}
                <div className="p-2.5 bg-[#fbfaf8] border border-[#e6e4df] rounded-md flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#dc2626]" />
                    <span className="font-medium text-[#111916]">
                      Missing product description
                    </span>
                  </div>
                  <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-[#fee2e2] text-[#b91c1c]">
                    High
                  </span>
                </div>

                {/* Issue 2 */}
                <div className="p-2.5 bg-[#fbfaf8] border border-[#e6e4df] rounded-md flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#d97706]" />
                    <span className="font-medium text-[#111916]">Category mismatch</span>
                  </div>
                  <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-[#fef3c7] text-[#92400e]">
                    Medium
                  </span>
                </div>

                {/* Issue 3 */}
                <div className="p-2.5 bg-[#fbfaf8] border border-[#e6e4df] rounded-md flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#d97706]" />
                    <span className="font-medium text-[#111916]">Missing key attributes</span>
                  </div>
                  <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-[#fef3c7] text-[#92400e]">
                    Medium
                  </span>
                </div>

                {/* Issue 4 */}
                <div className="p-2.5 bg-[#fbfaf8] border border-[#e6e4df] rounded-md flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#15803d]" />
                    <span className="font-medium text-[#111916]">Price validation</span>
                  </div>
                  <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-[#f0fdf4] text-[#15803d]">
                    Low
                  </span>
                </div>

                {/* Issue 5 */}
                <div className="p-2.5 bg-[#fbfaf8] border border-[#e6e4df] rounded-md flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#d97706]" />
                    <span className="font-medium text-[#111916]">Missing product images</span>
                  </div>
                  <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-[#fef3c7] text-[#92400e]">
                    Medium
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* COLUMN 3: AI Recommendations (Right, col-span-5) */}
          <div className="lg:col-span-5 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-[#7c3aed]" />
                <h3 className="text-xs font-bold text-[#111916] uppercase tracking-wider">
                  AI Recommendations
                </h3>
              </div>
              <button
                type="button"
                onClick={() =>
                  applyRecommendationMutation.mutate({
                    field: 'description',
                    value: defaultImprovedDesc,
                  })
                }
                className="text-xs font-medium text-[#7c3aed] hover:underline"
              >
                Review All
              </button>
            </div>

            {/* Recommendation 1: Generate Product Description (Primary Hero Card from Panel 4) */}
            <div className="bg-white border border-[#e6e4df] rounded-lg p-5 shadow-2xs space-y-4">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-[#7c3aed]" />
                  <span className="font-bold text-xs text-[#111916]">
                    Generate Product Description
                  </span>
                </div>
                <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-[#fee2e2] text-[#b91c1c]">
                  High
                </span>
              </div>

              <p className="text-[11px] text-[#5c6660]">
                Create a compelling, SEO-friendly product description for WooCommerce.
              </p>

              {/* Before vs After Boxes */}
              <div className="space-y-2.5 text-xs">
                {/* Before */}
                <div className="p-3 bg-[#fbfaf8] border border-[#e6e4df] rounded-md space-y-1">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-[#8a948e]">
                    Before
                  </div>
                  <div className="text-[#5c6660] italic">
                    {selectedProduct?.description
                      ? selectedProduct.description.replace(/<[^>]*>/g, '').substring(0, 36) + '...'
                      : 'Active noise cancelling...'}
                  </div>
                  <div className="text-[10px] text-[#a1a8a3]">(24 characters)</div>
                </div>

                {/* After (AI Generated) */}
                <div className="p-3 bg-[#f5f3ff] border border-[#ddd6fe] rounded-md space-y-1">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-[#7c3aed] flex items-center gap-1">
                    <Sparkles className="w-3 h-3" />
                    <span>After (AI Generated)</span>
                  </div>
                  <div className="text-[#1e1b4b] leading-relaxed">
                    {defaultImprovedDesc}
                  </div>
                  <div className="text-[10px] text-[#6b21a8] font-medium">
                    (248 characters · High SEO density)
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 pt-1">
                <button
                  type="button"
                  disabled={
                    applyRecommendationMutation.isPending ||
                    appliedRecommendations['description']
                  }
                  onClick={() =>
                    applyRecommendationMutation.mutate({
                      field: 'description',
                      value: defaultImprovedDesc,
                    })
                  }
                  className="flex-1 py-2 px-3 bg-[#15803d] hover:bg-[#166534] disabled:bg-[#a7f3d0] text-white rounded-md text-xs font-semibold shadow-2xs transition-colors flex items-center justify-center gap-1.5"
                >
                  {appliedRecommendations['description'] ? (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      <span>Applied to Draft</span>
                    </>
                  ) : (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      <span>Apply Recommendation</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => alert('View keyword density & token breakdown')}
                  className="py-2 px-3 border border-[#e6e4df] bg-white hover:bg-[#f4f2ec] text-[#19201d] rounded-md text-xs font-medium shadow-2xs transition-colors"
                >
                  More Details
                </button>
              </div>
            </div>

            {/* Additional Recommendation Accordions (Panel 4) */}
            <div className="space-y-2">
              {/* Map Category */}
              <div className="p-3 bg-white border border-[#e6e4df] rounded-lg flex items-center justify-between text-xs hover:border-[#cbd5e1] transition-colors cursor-pointer">
                <div className="flex items-center gap-2">
                  <ChevronRight className="w-3.5 h-3.5 text-[#8a948e]" />
                  <span className="font-semibold text-[#111916]">
                    Map Category to WooCommerce
                  </span>
                </div>
                <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-[#fef3c7] text-[#92400e]">
                  Medium
                </span>
              </div>

              {/* Add Missing Attributes */}
              <div className="p-3 bg-white border border-[#e6e4df] rounded-lg flex items-center justify-between text-xs hover:border-[#cbd5e1] transition-colors cursor-pointer">
                <div className="flex items-center gap-2">
                  <ChevronRight className="w-3.5 h-3.5 text-[#8a948e]" />
                  <span className="font-semibold text-[#111916]">
                    Add Missing Attributes
                  </span>
                </div>
                <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-[#fef3c7] text-[#92400e]">
                  Medium
                </span>
              </div>

              {/* Optimize Price */}
              <div className="p-3 bg-white border border-[#e6e4df] rounded-lg flex items-center justify-between text-xs hover:border-[#cbd5e1] transition-colors cursor-pointer">
                <div className="flex items-center gap-2">
                  <ChevronRight className="w-3.5 h-3.5 text-[#8a948e]" />
                  <span className="font-semibold text-[#111916]">Optimize Price</span>
                </div>
                <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-[#f0fdf4] text-[#15803d]">
                  Low
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
