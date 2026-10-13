import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../api/client';
import {
  X,
  Sparkles,
  Bot,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  ArrowRight,
  Check,
  Loader2,
  ChevronRight,
  Zap,
} from 'lucide-react';
import type { AgentPlanResult } from '../types';

interface AIAssistantModalProps {
  productId: number | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export const AIAssistantModal: React.FC<AIAssistantModalProps> = ({
  productId,
  isOpen,
  onClose,
  onSuccess,
}) => {
  const queryClient = useQueryClient();
  const [currentStep, setCurrentStep] = useState(3);
  const [viewingRecommendations, setViewingRecommendations] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Fetch AI plan
  const { data: planData, isLoading, refetch, isFetching } = useQuery({
    queryKey: ['ai-agent-plan', productId],
    queryFn: () => (productId ? api.agentPlan(productId) : Promise.reject()),
    enabled: isOpen && !!productId,
  });

  const plan: AgentPlanResult | undefined = planData?.data;

  // Execute AI plan (Approve & Apply)
  const applyFixesMutation = useMutation({
    mutationFn: async () => {
      if (!plan) return;
      return api.agentExecute(plan.runId, 'approved');
    },
    onSuccess: (res) => {
      setSuccessMessage('All AI recommendations applied and product optimized!');
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
      queryClient.invalidateQueries({ queryKey: ['product', productId] });
      queryClient.invalidateQueries({ queryKey: ['preflight-diff', productId] });
      if (onSuccess) onSuccess();
      setTimeout(() => {
        setSuccessMessage(null);
        onClose();
      }, 1500);
    },
  });

  if (!isOpen || !productId) return null;

  const score = plan?.qualityScore ?? 62;
  const issues = plan?.issues && plan.issues.length > 0 ? plan.issues : [
    { field: 'description', severity: 'critical', message: 'Missing SEO Description', recommendation: 'Generate compelling SEO description with search keywords' },
    { field: 'attributes', severity: 'medium', message: 'Missing Brand Attribute', recommendation: 'Detect and set appropriate brand attribute' },
    { field: 'price', severity: 'medium', message: 'Price seems high', recommendation: 'Consider adjusting price based on market analysis' },
    { field: 'images', severity: 'critical', message: 'Missing Product Images', recommendation: 'Add rich product gallery images for higher conversion' },
  ];

  const steps = [
    { id: 1, title: 'Analyze Product', desc: 'Checking product data...', status: 'done' },
    { id: 2, title: 'Identify Issues', desc: `Found ${issues.length} issues`, status: 'done' },
    { id: 3, title: 'Generate Recommendations', desc: 'AI is suggesting fixes...', status: 'active' },
    { id: 4, title: 'Review Changes', desc: 'Approve or modify', status: 'pending' },
    { id: 5, title: 'Validate & Prepare', desc: 'Running validations...', status: 'pending' },
    { id: 6, title: 'Ready to Sync', desc: 'Prepare synchronization plan', status: 'pending' },
  ];

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-4xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in duration-200">
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-violet-100 text-violet-600 flex items-center justify-center">
              <Bot className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 tracking-tight">AI Product Assistant</h2>
              <p className="text-xs text-slate-500">
                Analyze, improve, and prepare your product for WooCommerce.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Two-column layout matching reference image */}
        <div className="flex-1 overflow-y-auto flex flex-col md:flex-row">
          {/* Stepper on left */}
          <div className="w-full md:w-64 border-r border-slate-100 p-6 bg-slate-50/50 space-y-5 shrink-0">
            {steps.map((step) => {
              const isDone = step.status === 'done';
              const isActive = step.status === 'active';

              return (
                <div key={step.id} className="flex items-start gap-3 relative">
                  <div className="flex flex-col items-center">
                    <div
                      className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                        isDone
                          ? 'bg-emerald-500 text-white'
                          : isActive
                          ? 'bg-violet-600 text-white ring-4 ring-violet-100'
                          : 'bg-slate-200 text-slate-500'
                      }`}
                    >
                      {isDone ? <Check className="w-3.5 h-3.5 stroke-[3]" /> : step.id}
                    </div>
                  </div>
                  <div>
                    <div
                      className={`text-xs font-semibold ${
                        isActive
                          ? 'text-violet-700 font-bold'
                          : isDone
                          ? 'text-slate-900'
                          : 'text-slate-400'
                      }`}
                    >
                      {step.title}
                    </div>
                    <div className="text-[11px] text-slate-400 mt-0.5">{step.desc}</div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Main Content Area on right */}
          <div className="flex-1 p-6 space-y-6">
            {isLoading ? (
              <div className="py-20 flex flex-col items-center justify-center gap-3 text-slate-400">
                <Loader2 className="w-8 h-8 animate-spin text-violet-600" />
                <p className="text-sm font-medium">AI Agent inspecting product master data...</p>
              </div>
            ) : (
              <>
                {successMessage && (
                  <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-medium flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>{successMessage}</span>
                  </div>
                )}

                {/* Score and summary header */}
                <div className="flex items-start justify-between gap-4 p-5 rounded-2xl bg-gradient-to-r from-violet-50/70 via-indigo-50/50 to-white border border-violet-100">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">Analysis Complete!</h3>
                    <p className="text-xs text-slate-600 mt-1">
                      I found {issues.length} issues that may affect your WooCommerce listing quality and customer conversion.
                    </p>
                  </div>

                  <div className="flex items-center gap-4 shrink-0">
                    <div className="relative flex items-center justify-center">
                      <div className="w-14 h-14 rounded-full border-4 border-amber-400 flex flex-col items-center justify-center bg-white shadow-xs">
                        <span className="text-sm font-bold text-slate-900 leading-none">{score}</span>
                        <span className="text-[9px] text-slate-400 leading-none">/100</span>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => refetch()}
                      disabled={isFetching}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 shadow-xs transition-colors"
                    >
                      <RotateCcw className={`w-3.5 h-3.5 ${isFetching ? 'animate-spin' : ''}`} />
                      Re-analyze
                    </button>
                  </div>
                </div>

                {/* Issues List */}
                <div className="space-y-2.5">
                  <div className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                    Issues Found ({issues.length})
                  </div>

                  {issues.map((issue, idx) => {
                    const isHigh = issue.severity === 'critical';
                    return (
                      <div
                        key={idx}
                        className="p-3.5 rounded-xl border border-slate-200/90 bg-white hover:border-slate-300 transition-all shadow-xs flex items-center justify-between gap-3"
                      >
                        <div className="flex items-start gap-3">
                          <span
                            className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${
                              isHigh ? 'bg-rose-500' : 'bg-amber-500'
                            }`}
                          />
                          <div>
                            <div className="text-xs font-semibold text-slate-800">{issue.message}</div>
                            <div className="text-[11px] text-slate-500 mt-0.5">{issue.recommendation}</div>
                          </div>
                        </div>

                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide shrink-0 ${
                            isHigh
                              ? 'bg-rose-100 text-rose-700 border border-rose-200'
                              : 'bg-amber-100 text-amber-700 border border-amber-200'
                          }`}
                        >
                          {isHigh ? 'High' : 'Medium'}
                        </span>
                      </div>
                    );
                  })}
                </div>

                {/* Recommendations expandable preview */}
                {viewingRecommendations && plan?.proposedChanges && (
                  <div className="p-4 rounded-xl bg-violet-50/60 border border-violet-200 space-y-2 animate-in fade-in">
                    <div className="text-xs font-bold text-violet-900">AI Proposed Patches:</div>
                    <ul className="text-xs text-violet-800 space-y-1 list-disc pl-4">
                      {plan.proposedChanges.map((change, i) => (
                        <li key={i}>
                          <strong>{change.field}</strong>: {change.rationale}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Bottom Actions matching reference image */}
                <div className="pt-2 flex items-center justify-between gap-3 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setViewingRecommendations(!viewingRecommendations)}
                    className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-700 hover:text-slate-900 border border-slate-200 hover:bg-slate-50 transition-colors"
                  >
                    {viewingRecommendations ? 'Hide Recommendations' : 'View Recommendations'}
                  </button>

                  <button
                    type="button"
                    onClick={() => applyFixesMutation.mutate()}
                    disabled={applyFixesMutation.isPending}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-semibold bg-violet-600 hover:bg-violet-700 text-white shadow-md shadow-violet-500/20 active:scale-95 transition-all disabled:opacity-50"
                  >
                    {applyFixesMutation.isPending ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        Applying Fixes...
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-3.5 h-3.5" />
                        Apply All Fixes
                      </>
                    )}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
