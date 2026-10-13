import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../api/client';
import { Tags, Plus, Trash2, X, Check, Loader2, Sparkles } from 'lucide-react';
import { HeaderBar } from '../components/HeaderBar';

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
    <div className="flex-1 flex flex-col min-w-0 bg-[#f8fafc]">
      <HeaderBar />

      <div className="p-6 sm:p-8 space-y-6 max-w-7xl w-full mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Attributes & Taxonomy</h1>
            <p className="text-xs text-slate-500 mt-1">
              Configure global reusable product attributes (Size, Color, Brand, Material) mapped to WooCommerce taxonomy.
            </p>
          </div>

          <button
            onClick={() => setIsNewAttrModalOpen(true)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-violet-600 hover:bg-violet-700 text-white shadow-md shadow-violet-500/20 active:scale-95 transition-all"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            Create Attribute
          </button>
        </div>

        {/* Attributes Grid */}
        {isLoading ? (
          <div className="py-20 flex flex-col items-center justify-center gap-3 text-slate-400">
            <Loader2 className="w-8 h-8 animate-spin text-violet-600" />
            <p className="text-sm font-medium">Loading attributes taxonomy...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {attributes.map((attr) => (
              <div
                key={attr.id}
                className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex flex-col justify-between hover:shadow-md transition-all"
              >
                <div>
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="text-sm font-bold text-slate-900">{attr.name}</h3>
                      <p className="text-xs font-mono text-violet-600 mt-0.5">{attr.slug}</p>
                    </div>
                    <button
                      onClick={() => {
                        if (confirm(`Delete attribute "${attr.name}"?`)) {
                          deleteAttributeMutation.mutate(attr.id);
                        }
                      }}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Options List */}
                  <div className="mt-4">
                    <label className="text-[11px] font-semibold uppercase text-slate-400 tracking-wider">
                      Options ({attr.options?.length ?? 0})
                    </label>
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {attr.options?.map((opt) => (
                        <span
                          key={opt.id}
                          className="px-2.5 py-1 rounded-lg text-xs font-medium bg-slate-100 text-slate-700 border border-slate-200"
                        >
                          {opt.label || opt.value}
                        </span>
                      ))}

                      {attr.options?.length === 0 && (
                        <span className="text-xs text-slate-400 italic">No options defined</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Quick Add Option */}
                <div className="mt-5 pt-3 border-t border-slate-100">
                  {addingOptionAttrId === attr.id ? (
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        placeholder="Value (e.g. XL)"
                        value={newOptionValue}
                        onChange={(e) => setNewOptionValue(e.target.value)}
                        className="flex-1 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-violet-500/20"
                        autoFocus
                      />
                      <button
                        onClick={() => handleAddOptionSubmit(attr.id)}
                        disabled={addOptionMutation.isPending}
                        className="p-1.5 bg-violet-600 hover:bg-violet-700 text-white rounded-lg text-xs shadow-xs"
                      >
                        <Check className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => {
                          setAddingOptionAttrId(null);
                          setNewOptionValue('');
                        }}
                        className="p-1.5 bg-slate-200 hover:bg-slate-300 text-slate-600 rounded-lg text-xs"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setAddingOptionAttrId(attr.id)}
                      className="text-xs font-semibold text-violet-600 hover:text-violet-700 flex items-center gap-1"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      Add Option
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create Attribute Modal */}
      {isNewAttrModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-md shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900">New Global Attribute</h3>
              <button
                onClick={() => setIsNewAttrModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateAttribute} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Attribute Name</label>
                <input
                  type="text"
                  placeholder="e.g. Color, Size, Material"
                  value={newAttrName}
                  onChange={(e) => setNewAttrName(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-violet-500/20"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Preset Options (comma separated)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Small, Medium, Large, XL"
                  value={newAttrOptions}
                  onChange={(e) => setNewAttrOptions(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-violet-500/20"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsNewAttrModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createAttributeMutation.isPending}
                  className="px-5 py-2 rounded-xl text-xs font-semibold bg-violet-600 hover:bg-violet-700 text-white shadow-xs"
                >
                  Create
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
