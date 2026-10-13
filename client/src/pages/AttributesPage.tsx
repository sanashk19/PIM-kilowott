import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../api/client';
import { Attribute } from '../types';
import { Tags, Plus, Trash2, X, Check, Loader2, Sparkles } from 'lucide-react';

export const AttributesPage: React.FC = () => {
  const queryClient = useQueryClient();

  const [isNewAttrModalOpen, setIsNewAttrModalOpen] = useState(false);
  const [newAttrName, setNewAttrName] = useState('');
  const [newAttrOptions, setNewAttrOptions] = useState('');

  const [addingOptionAttrId, setAddingOptionAttrId] = useState<number | null>(null);
  const [newOptionValue, setNewOptionValue] = useState('');

  const { data: attributesData, isLoading } = useQuery({
    queryKey: ['attributes'],
    queryFn: () => api.getAttributes(),
  });

  const createAttributeMutation = useMutation({
    mutationFn: (payload: { name: string; options: string[] }) => api.createAttribute(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['attributes'] });
      setIsNewAttrModalOpen(false);
      setNewAttrName('');
      setNewAttrOptions('');
    },
  });

  const addOptionMutation = useMutation({
    mutationFn: ({ attrId, value }: { attrId: number; value: string }) =>
      api.addAttributeOption(attrId, { value }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['attributes'] });
      setAddingOptionAttrId(null);
      setNewOptionValue('');
    },
  });

  const deleteAttributeMutation = useMutation({
    mutationFn: (id: number) => api.deleteAttribute(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['attributes'] });
    },
  });

  const attributes = attributesData?.data || [];

  const handleCreateAttribute = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAttrName.trim()) return;

    const options = newAttrOptions
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);

    createAttributeMutation.mutate({
      name: newAttrName.trim(),
      options,
    });
  };

  const handleAddOptionSubmit = (attrId: number) => {
    if (!newOptionValue.trim()) return;
    addOptionMutation.mutate({ attrId, value: newOptionValue.trim() });
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight">Global Attributes & Taxonomy</h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Configure reusable e-commerce product attributes (Color, Size, Material, Brand) mapped to WooCommerce taxonomy.
          </p>
        </div>

        <button
          onClick={() => setIsNewAttrModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white shadow-lg shadow-indigo-500/20 active:scale-95 transition-all"
        >
          <Plus className="w-4 h-4" />
          Create Attribute
        </button>
      </div>

      {/* Attributes Grid */}
      {isLoading ? (
        <div className="p-12 text-center text-slate-400">
          <Loader2 className="w-6 h-6 animate-spin mx-auto text-indigo-500 mb-2" />
          Loading attributes...
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {attributes.map((attr) => (
            <div
              key={attr.id}
              className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 flex flex-col justify-between hover:border-slate-700 transition-all shadow-lg"
            >
              <div>
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-base font-semibold text-white">{attr.name}</h3>
                    <p className="text-xs font-mono text-indigo-400">{attr.slug}</p>
                  </div>
                  <button
                    onClick={() => {
                      if (confirm(`Delete attribute "${attr.name}"?`)) {
                        deleteAttributeMutation.mutate(attr.id);
                      }
                    }}
                    className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-slate-800 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                {/* Options Chips */}
                <div className="mt-4">
                  <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-2">
                    Available Options ({attr.options?.length || 0}):
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {attr.options?.map((opt) => (
                      <span
                        key={opt.id}
                        className="px-2.5 py-1 rounded-lg text-xs font-medium bg-slate-950 text-slate-300 border border-slate-800"
                      >
                        {opt.value}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Add Option Form */}
              <div className="mt-5 pt-3 border-t border-slate-800">
                {addingOptionAttrId === attr.id ? (
                  <div className="flex items-center gap-1.5">
                    <input
                      type="text"
                      autoFocus
                      placeholder="e.g. Forest Green"
                      value={newOptionValue}
                      onChange={(e) => setNewOptionValue(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleAddOptionSubmit(attr.id);
                        if (e.key === 'Escape') setAddingOptionAttrId(null);
                      }}
                      className="flex-1 bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                    />
                    <button
                      onClick={() => handleAddOptionSubmit(attr.id)}
                      className="p-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs"
                    >
                      <Check className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => setAddingOptionAttrId(null)}
                      className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 text-xs"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => {
                      setAddingOptionAttrId(attr.id);
                      setNewOptionValue('');
                    }}
                    className="flex items-center gap-1 text-xs text-indigo-400 hover:text-indigo-300 font-medium"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Add Option Value
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* New Attribute Modal */}
      {isNewAttrModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-semibold text-white">Create Global Attribute</h3>
              <button
                onClick={() => setIsNewAttrModalOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateAttribute} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Attribute Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Material, Fit, Connectivity"
                  value={newAttrName}
                  onChange={(e) => setNewAttrName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Initial Options (comma-separated)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Cotton, Polyester, Wool"
                  value={newAttrOptions}
                  onChange={(e) => setNewAttrOptions(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsNewAttrModalOpen(false)}
                  className="px-4 py-2 rounded-lg text-xs font-medium text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createAttributeMutation.isPending}
                  className="px-4 py-2 rounded-lg text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-500/20"
                >
                  {createAttributeMutation.isPending ? 'Creating...' : 'Create Attribute'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
