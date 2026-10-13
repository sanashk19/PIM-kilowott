import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../api/client';
import {
  Layers,
  Plus,
  Trash2,
  X,
  Check,
  Tag,
  Sliders,
  ChevronRight,
} from 'lucide-react';
import { TopBar } from '../components/TopBar';

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
    <div className="flex-1 bg-[#fbfaf8] min-h-screen flex flex-col">
      <TopBar breadcrumbs={['Workspace', 'Attributes']} />

      <div className="p-6 max-w-7xl w-full mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold text-[#111916] tracking-tight">
              Attributes &amp; Taxonomy
            </h1>
            <p className="text-xs text-[#5c6660] mt-0.5">
              Define product options, specifications, and variation sets mapped to WooCommerce.
            </p>
          </div>

          <button
            type="button"
            onClick={() => setIsNewAttrModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-[#15803d] hover:bg-[#166534] text-white rounded-md text-xs font-semibold shadow-2xs transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Create Attribute</span>
          </button>
        </div>

        {/* Attribute Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {isLoading ? (
            <div className="col-span-3 py-12 text-center text-xs text-[#7d8b82]">
              Loading attribute taxonomy...
            </div>
          ) : attributes.length === 0 ? (
            <div className="col-span-3 py-12 text-center text-xs text-[#7d8b82]">
              No attributes configured. Click "Create Attribute" to begin.
            </div>
          ) : (
            attributes.map((attr) => (
              <div
                key={attr.id}
                className="bg-white border border-[#e6e4df] rounded-lg p-5 shadow-2xs flex flex-col justify-between space-y-4 hover:border-[#cbd5e1] transition-all"
              >
                <div>
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-bold text-sm text-[#111916]">{attr.name}</h3>
                      <div className="text-[11px] font-mono text-[#7d8b82] mt-0.5">
                        slug: {attr.slug}
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        if (confirm(`Delete attribute ${attr.name}?`)) {
                          deleteAttributeMutation.mutate(attr.id);
                        }
                      }}
                      className="text-[#7d8b82] hover:text-[#dc2626] p-1 rounded hover:bg-[#fef2f2] transition-colors"
                      title="Delete attribute"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Options Pills */}
                  <div className="mt-4">
                    <div className="text-[10px] font-bold uppercase tracking-wider text-[#8a948e] mb-2">
                      Options ({attr.options?.length || 0})
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {attr.options?.map((opt) => (
                        <span
                          key={opt.id}
                          className="px-2 py-1 rounded bg-[#fbfaf8] border border-[#e6e4df] text-[11px] font-medium text-[#19201d]"
                        >
                          {opt.label || opt.value}
                        </span>
                      ))}
                      {(!attr.options || attr.options.length === 0) && (
                        <span className="text-[11px] text-[#a1a8a3] italic">
                          No options added yet
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Bottom Add Option Inline Form */}
                <div className="pt-3 border-t border-[#f4f2ec]">
                  {addingOptionAttrId === attr.id ? (
                    <div className="flex items-center gap-1.5">
                      <input
                        type="text"
                        autoFocus
                        value={newOptionValue}
                        onChange={(e) => setNewOptionValue(e.target.value)}
                        placeholder="Option name..."
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleAddOptionSubmit(attr.id);
                          if (e.key === 'Escape') setAddingOptionAttrId(null);
                        }}
                        className="flex-1 px-2.5 py-1 text-xs border border-[#15803d] rounded bg-[#fbfaf8] focus:outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => handleAddOptionSubmit(attr.id)}
                        className="p-1 rounded bg-[#15803d] text-white hover:bg-[#166534]"
                      >
                        <Check className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setAddingOptionAttrId(null)}
                        className="p-1 rounded text-[#7d8b82] hover:text-[#19201d]"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => {
                        setAddingOptionAttrId(attr.id);
                        setNewOptionValue('');
                      }}
                      className="text-xs font-semibold text-[#15803d] hover:text-[#166534] flex items-center gap-1"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add Option</span>
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Create Attribute Modal */}
      {isNewAttrModalOpen && (
        <div className="fixed inset-0 z-50 bg-[#111916]/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl border border-[#e6e4df] shadow-2xl max-w-md w-full p-6 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-[#e6e4df]">
              <h3 className="font-bold text-sm text-[#111916]">Create New Attribute</h3>
              <button
                type="button"
                onClick={() => setIsNewAttrModalOpen(false)}
                className="text-[#7d8b82] hover:text-[#111916]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateAttribute} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-[#111916] mb-1">Attribute Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Color, Connectivity, Material"
                  value={newAttrName}
                  onChange={(e) => setNewAttrName(e.target.value)}
                  className="w-full px-3 py-2 border border-[#e6e4df] rounded-md text-xs focus:outline-none focus:ring-1 focus:ring-[#15803d]"
                />
              </div>

              <div>
                <label className="block font-semibold text-[#111916] mb-1">
                  Initial Options (comma-separated)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Matte Black, Glacier Silver, Midnight Navy"
                  value={newAttrOptions}
                  onChange={(e) => setNewAttrOptions(e.target.value)}
                  className="w-full px-3 py-2 border border-[#e6e4df] rounded-md text-xs focus:outline-none focus:ring-1 focus:ring-[#15803d]"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#f4f2ec]">
                <button
                  type="button"
                  onClick={() => setIsNewAttrModalOpen(false)}
                  className="px-3 py-1.5 border border-[#e6e4df] rounded-md text-xs font-medium text-[#5c6660] hover:bg-[#fbfaf8]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createAttributeMutation.isPending}
                  className="px-4 py-1.5 bg-[#15803d] hover:bg-[#166534] text-white rounded-md text-xs font-semibold shadow-2xs"
                >
                  Create Attribute
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
