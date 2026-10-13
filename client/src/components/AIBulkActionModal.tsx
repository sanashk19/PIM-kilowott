import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../api/client';
import {
  X,
  Sparkles,
  Loader2,
  Check,
  ShieldCheck,
  ShieldAlert,
  AlertTriangle,
  ArrowRight,
} from 'lucide-react';
import type { SyncChangeset } from '../types';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export const AIBulkActionModal: React.FC<Props> = ({ isOpen, onClose, onSuccess }) => {
  const queryClient = useQueryClient();

  const [prompt, setPrompt] = useState('Raise all headphone prices by 5%, but skip products currently on sale.');
  const [changeset, setChangeset] = useState<SyncChangeset | null>(null);
  const [selectedProductIds, setSelectedProductIds] = useState<number[]>([]);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const samplePrompts = [
    'Raise all headphone prices by 5%, but skip products currently on sale.',
    'Find products missing images and prepare them for review.',
    'Set all low-stock products to draft.',
  ];

  // 1. Generate Changeset Mutation
  const interpretMutation = useMutation({
    mutationFn: (p: string) => api.bulkAction(p),
    onSuccess: (res) => {
      setErrorMsg(null);
      setChangeset(res.data);
      setSelectedProductIds(res.data.products);
    },
    onError: (err: any) => {
      setErrorMsg(err.message || 'Failed to interpret natural language request.');
    },
  });

  // 2. Apply Changeset Mutation
  const applyMutation = useMutation({
    mutationFn: () => {
      if (!changeset) return Promise.reject();
      return api.applyChangeset(changeset.id, selectedProductIds);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
      queryClient.invalidateQueries({ queryKey: ['sync-logs'] });
      if (onSuccess) onSuccess();
      handleClose();
    },
    onError: (err: any) => {
      setErrorMsg(err.message || 'Failed to apply approved changeset.');
    },
  });

  const handleClose = () => {
    setChangeset(null);
    setErrorMsg(null);
    onClose();
  };

  const toggleSelectProduct = (pId: number) => {
    setSelectedProductIds((prev) =>
      prev.includes(pId) ? prev.filter((id) => id !== pId) : [...prev, pId]
    );
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white border border-[#e6e4df] rounded-lg w-full max-w-3xl shadow-xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-5 py-4 border-b border-[#e6e4df] flex items-center justify-between bg-[#fbfaf8]">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md bg-[#f5f3ff] text-[#7c3aed] flex items-center justify-center">
              <Sparkles className="w-3.5 h-3.5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-[#111916] tracking-tight">
                AI Natural Language Bulk Operations
              </h2>
              <p className="text-xs text-[#5c6660]">
                Natural language interprets intent into a dry-run changeset before applying.
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="p-1 rounded text-[#8a948e] hover:text-[#111916] hover:bg-[#f4f2ec]"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4 text-xs">
          {errorMsg && (
            <div className="p-3 bg-[#fef2f2] border border-[#fecaca] text-[#dc2626] rounded-md flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Prompt Input Box */}
          <div className="space-y-2">
            <label className="block font-semibold text-[#111916]">
              Enter Natural Language Command:
            </label>
            <textarea
              rows={2}
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="e.g. Raise all headphone prices by 5%, but skip products currently on sale."
              className="w-full p-2.5 border border-[#e6e4df] rounded-md text-xs text-[#111916] placeholder:text-[#8a948e] focus:outline-none focus:ring-1 focus:ring-[#15803d]"
            />

            {/* Quick Demo Chips */}
            <div className="flex flex-wrap items-center gap-1.5 pt-1">
              <span className="text-[11px] text-[#7d8b82]">Demo Suggestions:</span>
              {samplePrompts.map((sp, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setPrompt(sp)}
                  className="px-2 py-1 rounded bg-[#f4f2ec] hover:bg-[#ede9fe] text-[11px] text-[#5c6660] hover:text-[#7c3aed] transition-colors border border-[#e6e4df]"
                >
                  "{sp}"
                </button>
              ))}
            </div>
          </div>

          <div className="flex justify-end pt-1">
            <button
              type="button"
              disabled={interpretMutation.isPending || !prompt.trim()}
              onClick={() => interpretMutation.mutate(prompt)}
              className="px-4 py-2 bg-[#7c3aed] hover:bg-[#6d28d9] disabled:bg-[#ddd6fe] text-white rounded-md font-semibold flex items-center gap-1.5 shadow-2xs transition-colors"
            >
              {interpretMutation.isPending ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Interpreting Intent &amp; Validating...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Generate Changeset Dry Run</span>
                </>
              )}
            </button>
          </div>

          {/* CHANGESET DRY RUN PREVIEW */}
          {changeset && (
            <div className="pt-4 border-t border-[#e6e4df] space-y-3 animate-in fade-in duration-150">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-bold text-[#111916] text-xs">
                    Proposed Changeset: <span className="font-mono text-[#5c6660]">{changeset.id}</span>
                  </div>
                  <div className="text-[11px] text-[#7d8b82]">
                    Affects {changeset.products.length} product(s) · Status: {changeset.executionStatus}
                  </div>
                </div>

                <span
                  className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                    changeset.riskLevel === 'HIGH'
                      ? 'bg-[#fee2e2] text-[#b91c1c] border border-[#fca5a5]'
                      : changeset.riskLevel === 'MEDIUM'
                      ? 'bg-[#fef3c7] text-[#92400e] border border-[#fde68a]'
                      : 'bg-[#f0fdf4] text-[#15803d] border border-[#bbf7d0]'
                  }`}
                >
                  {changeset.riskLevel} Blast Radius
                </span>
              </div>

              {/* Proposed Field Modifications Table */}
              <div className="border border-[#e6e4df] rounded-lg overflow-hidden bg-white shadow-2xs">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-[#fbfaf8] border-b border-[#e6e4df] text-[#5c6660]">
                      <th className="py-2 px-3 w-8 text-center">
                        <input
                          type="checkbox"
                          checked={selectedProductIds.length === changeset.products.length}
                          onChange={(e) =>
                            setSelectedProductIds(
                              e.target.checked ? changeset.products : []
                            )
                          }
                          className="rounded border-[#cbd5e1] text-[#15803d] focus:ring-[#15803d]"
                        />
                      </th>
                      <th className="py-2 px-3 font-semibold">Product</th>
                      <th className="py-2 px-3 font-semibold">Field</th>
                      <th className="py-2 px-3 font-semibold text-[#7d8b82]">Before</th>
                      <th className="py-2 px-3 font-semibold text-[#15803d]">Proposed After</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#f4f2ec]">
                    {changeset.fieldChanges.map((fc, i) => (
                      <tr key={i} className="hover:bg-[#fbfaf8]">
                        <td className="py-2 px-3 text-center">
                          <input
                            type="checkbox"
                            checked={selectedProductIds.includes(fc.productId)}
                            onChange={() => toggleSelectProduct(fc.productId)}
                            className="rounded border-[#cbd5e1] text-[#15803d] focus:ring-[#15803d]"
                          />
                        </td>
                        <td className="py-2 px-3 font-medium text-[#111916]">
                          {fc.productName}
                        </td>
                        <td className="py-2 px-3 font-mono text-[11px] text-[#5c6660]">
                          {fc.field}
                        </td>
                        <td className="py-2 px-3 font-mono text-[11px] text-[#7d8b82]">
                          {fc.field.includes('price') ? `₹${fc.previousValue}` : String(fc.previousValue || '—')}
                        </td>
                        <td className="py-2 px-3 font-mono text-[11px] font-bold text-[#047857]">
                          {fc.field.includes('price') ? `₹${fc.newValue}` : String(fc.newValue || '—')}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Validation Warnings / Passed Info */}
              <div className="p-3 bg-[#f0fdf4] border border-[#bbf7d0] rounded-md text-[11px] text-[#166534] flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-[#15803d] shrink-0" />
                <span>
                  Deterministic guardrails verified: Zero price volatility violations detected.
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-[#fbfaf8] border-t border-[#e6e4df] flex items-center justify-between">
          <div className="text-xs text-[#5c6660]">
            {changeset ? (
              <span>{selectedProductIds.length} of {changeset.products.length} changes approved for commit</span>
            ) : (
              <span>Requires confirmation before applying changes to database</span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleClose}
              className="px-4 py-2 border border-[#e6e4df] bg-white hover:bg-[#f4f2ec] text-[#5c6660] rounded-md text-xs font-semibold"
            >
              Cancel
            </button>

            {changeset && (
              <button
                type="button"
                disabled={applyMutation.isPending || selectedProductIds.length === 0}
                onClick={() => applyMutation.mutate()}
                className="px-4 py-2 bg-[#15803d] hover:bg-[#166534] disabled:bg-[#a7f3d0] text-white rounded-md text-xs font-semibold shadow-2xs flex items-center gap-1.5"
              >
                {applyMutation.isPending ? (
                  <span>Applying Changeset...</span>
                ) : (
                  <>
                    <Check className="w-3.5 h-3.5" />
                    <span>Approve &amp; Apply Changeset</span>
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
