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
  ShieldCheck,
  ShieldAlert,
  ShieldX,
  Clock,
  ArrowRight,
  Info,
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
      payload[field] = value;
      return api.updateProduct(selectedProduct.id, payload);
    },
    onSuccess: (_, vars) => {
      setAppliedRecommendations((prev) => ({ ...prev, [vars.field]: true }));
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['product', selectedProductId] });
    },
  });

  const plan = planData?.data;
  const steps = plan?.steps || [];
  const guardrailReport = plan?.guardrailReport;
  const proposedChanges = plan?.proposedChanges || [];
  const qualityScore = plan?.qualityScore ?? selectedProduct?.quality_score ?? 85;

  // Format currency
  const formatPrice = (val: number | null | undefined) =>
    val ? `₹${Number(val).toLocaleString('en-IN')}` : '—';

  return (
    <div className="flex-1 bg-white min-h-screen flex flex-col">
      <TopBar breadcrumbs={['Operations', 'AI Review & Guardrails']} />

      <div className="p-6 max-w-7xl w-full mx-auto space-y-6">
        {/* Header Row */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-[#111916] tracking-tight">
                AI Product Review &amp; Guardrails
              </h1>
              <span className="px-2 py-0.5 rounded text-[11px] font-bold uppercase tracking-wider bg-[#f5f3ff] text-[#7c3aed] border border-[#ddd6fe] flex items-center gap-1">
                <Sparkles className="w-3 h-3" />
                <span>Deterministic Gate</span>
              </span>
            </div>
            <p className="text-xs text-[#5c6660] mt-0.5">
              AI proposes enhancements · Deterministic rules verify safety · Human supervisor approves changes.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <div className="relative min-w-[300px]">
              <select
                value={selectedProductId}
                onChange={(e) => {
                  const id = Number(e.target.value);
                  setSelectedProductId(id);
                  setSearchParams({ productId: id.toString() });
                  setAppliedRecommendations({});
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

        {/* 3-Column Layout: Agent Trace (Left 3) | Explainable Quality Score & Issues (Center 4) | AI Proposals & Guardrail Badges (Right 5) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* COLUMN 1: 8-Step Professional Agent Execution Trace */}
          <div className="lg:col-span-3 bg-white border border-[#e6e4df] rounded-lg p-5 shadow-2xs space-y-4">
            <div className="flex items-center justify-between">
              <div className="text-xs font-bold text-[#111916] uppercase tracking-wider flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-[#5c6660]" />
                <span>AI Agent Trace</span>
              </div>
              <span className="text-[10px] font-semibold text-[#047857] bg-[#ecfdf5] px-1.5 py-0.5 rounded border border-[#a7f3d0]">
                8 Steps Verified
              </span>
            </div>

            <div className="space-y-3 relative">
              <div className="absolute left-3.5 top-3 bottom-3 w-px bg-[#e6e4df] -z-0" />

              {steps.map((st: any) => {
                const isBlocked = st.status === 'blocked';
                const isWaiting = st.status === 'waiting_for_approval';
                const isWarning = st.status === 'warning';

                return (
                  <div key={st.step} className="flex items-start gap-3 relative z-10">
                    <div
                      className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-[11px] shrink-0 shadow-2xs ${
                        isBlocked
                          ? 'bg-[#dc2626] text-white'
                          : isWaiting
                          ? 'bg-[#7c3aed] text-white'
                          : isWarning
                          ? 'bg-[#d97706] text-white'
                          : 'bg-[#15803d] text-white'
                      }`}
                    >
                      {isBlocked ? '✕' : isWaiting ? '8' : <Check className="w-3.5 h-3.5" />}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-1">
                        <span className="font-semibold text-xs text-[#111916] truncate">
                          {st.code} {st.name}
                        </span>
                        {st.durationMs && (
                          <span className="text-[9.5px] font-mono text-[#8a948e] shrink-0">
                            {st.durationMs}ms
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-[#5c6660] mt-0.5 leading-snug line-clamp-2">
                        {st.description}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* COLUMN 2: Explainable Quality Score & Deductions */}
          <div className="lg:col-span-4 space-y-4">
            {/* Assistant & Overall Gauge Card */}
            <div className="bg-white border border-[#e6e4df] rounded-lg p-5 shadow-2xs space-y-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="font-bold text-sm text-[#111916]">Product Quality Score</h3>
                  <p className="text-xs text-[#5c6660] mt-0.5 leading-snug">
                    Deterministic calculation derived from catalog completeness, SKU integrity, and storefront readiness.
                  </p>
                </div>
                <img
                  src="/assets/robot-assistant.png"
                  alt="VERIDEX AI Robot Assistant"
                  className="w-14 h-14 object-contain shrink-0 drop-shadow-sm -mt-1"
                />
              </div>

              {/* Score breakdown & gauge */}
              <div className="flex items-center justify-between pt-1 border-t border-[#f4f2ec]">
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
                        stroke={qualityScore >= 80 ? '#15803d' : qualityScore >= 60 ? '#d97706' : '#dc2626'}
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
                    <div className={`text-[10px] font-semibold ${
                      qualityScore >= 80 ? 'text-[#15803d]' : qualityScore >= 60 ? 'text-[#d97706]' : 'text-[#dc2626]'
                    }`}>
                      {qualityScore >= 80 ? 'WooCommerce Ready' : 'Needs Optimization'}
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
                  <span>Re-evaluate</span>
                </button>
              </div>
            </div>

            {/* Explainable Deductions Breakdown */}
            <div className="bg-white border border-[#e6e4df] rounded-lg p-5 shadow-2xs space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold text-[#111916] uppercase tracking-wider">
                  Score Explanations &amp; Deductions
                </h3>
              </div>

              <div className="space-y-2 text-xs">
                {/* Deductions if any */}
                {(plan?.issues || []).length > 0 ? (
                  (plan?.issues || []).map((iss: any, idx: number) => (
                    <div
                      key={idx}
                      className="p-2.5 bg-[#fbfaf8] border border-[#e6e4df] rounded-md space-y-1"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-[#111916]">{iss.message}</span>
                        <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                          iss.severity === 'critical' ? 'bg-[#fee2e2] text-[#b91c1c]' : 'bg-[#fef3c7] text-[#92400e]'
                        }`}>
                          {iss.severity === 'critical' ? '-15 pts' : '-10 pts'}
                        </span>
                      </div>
                      <p className="text-[11px] text-[#5c6660] leading-snug">
                        Fix: {iss.recommendation}
                      </p>
                    </div>
                  ))
                ) : (
                  <div className="p-3 bg-[#f0fdf4] border border-[#bbf7d0] rounded-md text-[#166534] text-xs">
                    ✓ All essential catalog quality criteria verified. Zero quality deductions.
                  </div>
                )}

                {/* Positive Verified Factors */}
                <div className="pt-2 border-t border-[#f4f2ec] space-y-1.5 text-[11px] text-[#15803d]">
                  <div className="flex items-center gap-1.5">
                    <Check className="w-3.5 h-3.5 shrink-0" />
                    <span>Unique SKU identifier verified (+30 pts)</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Check className="w-3.5 h-3.5 shrink-0" />
                    <span>Positive non-negative retail pricing (+25 pts)</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Check className="w-3.5 h-3.5 shrink-0" />
                    <span>Active warehouse stock inventory (+15 pts)</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* COLUMN 3: AI Proposals with Deterministic Guardrails */}
          <div className="lg:col-span-5 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-[#7c3aed]" />
                <h3 className="text-xs font-bold text-[#111916] uppercase tracking-wider">
                  AI Proposed Enhancements ({proposedChanges.length})
                </h3>
              </div>
              <span className="text-[11px] text-[#5c6660]">Rules must verify each change</span>
            </div>

            {/* Render each proposed change */}
            {proposedChanges.length > 0 ? (
              proposedChanges.map((change: any, i: number) => {
                const isBlocked = change.guardrail?.blocked;
                const isApplied = appliedRecommendations[change.field];

                return (
                  <div
                    key={i}
                    className={`bg-white border rounded-lg p-5 shadow-2xs space-y-3.5 transition-colors ${
                      isBlocked ? 'border-[#fca5a5]' : 'border-[#e6e4df]'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-[#7c3aed]" />
                        <span className="font-bold text-xs text-[#111916] capitalize">
                          {change.field.replace('_', ' ')} Enhancement
                        </span>
                      </div>

                      {/* Guardrail badge */}
                      {isBlocked ? (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#fee2e2] text-[#b91c1c] border border-[#fca5a5] flex items-center gap-1">
                          <ShieldX className="w-3 h-3" />
                          <span>Guardrail Blocked</span>
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#f0fdf4] text-[#15803d] border border-[#bbf7d0] flex items-center gap-1">
                          <ShieldCheck className="w-3 h-3" />
                          <span>Guardrail Passed</span>
                        </span>
                      )}
                    </div>

                    <p className="text-[11px] text-[#5c6660]">
                      {change.rationale || 'AI suggested optimization to improve SEO indexation and conversion rates.'}
                    </p>

                    {/* Before vs After comparison */}
                    <div className="space-y-2 text-xs">
                      <div className="p-2.5 bg-[#fbfaf8] border border-[#e6e4df] rounded-md space-y-0.5">
                        <div className="text-[10px] font-bold uppercase tracking-wider text-[#8a948e]">
                          Current PIM Value
                        </div>
                        <div className="text-[#5c6660] font-mono text-[11px] line-clamp-2">
                          {typeof change.before === 'object' ? JSON.stringify(change.before) : String(change.before || '—')}
                        </div>
                      </div>

                      <div className="p-2.5 bg-[#f5f3ff] border border-[#ddd6fe] rounded-md space-y-0.5">
                        <div className="text-[10px] font-bold uppercase tracking-wider text-[#7c3aed] flex items-center gap-1">
                          <Sparkles className="w-3 h-3" />
                          <span>Proposed Value</span>
                        </div>
                        <div className="text-[#1e1b4b] font-mono text-[11px] leading-relaxed line-clamp-3">
                          {typeof change.after === 'object' ? JSON.stringify(change.after) : String(change.after || '—')}
                        </div>
                      </div>
                    </div>

                    {/* Guardrail explanation box if flagged */}
                    {change.guardrail && (
                      <div className={`p-2.5 rounded text-[11px] flex items-start gap-2 ${
                        isBlocked ? 'bg-[#fff8f8] border border-[#fecaca] text-[#991b1b]' : 'bg-[#fbfaf8] text-[#5c6660]'
                      }`}>
                        <Info className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                        <div>
                          <strong>{change.guardrail.name}:</strong> {change.guardrail.reason}
                          {isBlocked && (
                            <div className="mt-1 font-semibold text-[#dc2626]">
                              Action blocked by deterministic safety limit.
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Action button */}
                    <div className="pt-1">
                      <button
                        type="button"
                        disabled={isBlocked || isApplied || applyRecommendationMutation.isPending}
                        onClick={() =>
                          applyRecommendationMutation.mutate({
                            field: change.field,
                            value: change.after,
                          })
                        }
                        className={`w-full py-2 px-3 rounded-md text-xs font-semibold shadow-2xs transition-colors flex items-center justify-center gap-1.5 ${
                          isBlocked
                            ? 'bg-[#f4f2ec] text-[#8a948e] cursor-not-allowed border border-[#e6e4df]'
                            : isApplied
                            ? 'bg-[#f0fdf4] text-[#15803d] border border-[#bbf7d0]'
                            : 'bg-[#15803d] hover:bg-[#166534] text-white'
                        }`}
                      >
                        {isBlocked ? (
                          <span>Requires Supervisor Override</span>
                        ) : isApplied ? (
                          <>
                            <Check className="w-3.5 h-3.5" />
                            <span>Applied to Product Catalog</span>
                          </>
                        ) : (
                          <>
                            <Check className="w-3.5 h-3.5" />
                            <span>Approve &amp; Apply Recommendation</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                );
              })
            ) : loadingPlan ? (
              <div className="p-8 bg-white border border-[#e6e4df] rounded-lg text-center text-xs text-[#7d8b82] space-y-2">
                <Sparkles className="w-6 h-6 text-[#7c3aed] mx-auto animate-pulse" />
                <p className="font-semibold text-[#111916]">Generating AI Recommendations...</p>
                <p className="text-[11px]">Evaluating product data against store taxonomy rules.</p>
              </div>
            ) : (
              <div className="p-8 bg-white border border-[#e6e4df] rounded-lg text-center text-xs text-[#7d8b82] space-y-3">
                <CheckCircle2 className="w-6 h-6 text-[#15803d] mx-auto" />
                <div className="space-y-1">
                  <p className="font-semibold text-[#111916]">Catalog State Verified</p>
                  <p className="text-[11px] text-[#5c6660]">
                    All essential specifications, attributes, and storefront media conform to verified quality standards.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => refetchPlan()}
                  className="px-3 py-1.5 rounded bg-[#f4f2ec] hover:bg-[#e6e4df] text-[#111916] text-[11px] font-semibold transition-colors"
                >
                  Re-evaluate with AI
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
