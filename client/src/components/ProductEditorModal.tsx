import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../api/client';
import { Product } from '../types';
import { X, Save, Loader2, Image as ImageIcon, Tag, Layers, DollarSign, Package } from 'lucide-react';

interface Props {
  product: Product | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export const ProductEditorModal: React.FC<Props> = ({ product, isOpen, onClose, onSuccess }) => {
  const queryClient = useQueryClient();

  const isEditing = !!product;

  const [formData, setFormData] = useState({
    name: '',
    sku: '',
    slug: '',
    type: 'simple',
    status: 'publish',
    regular_price: '',
    sale_price: '',
    stock_quantity: 0,
    manage_stock: true,
    description: '',
    short_description: '',
    image_url: '',
    category_ids: [] as number[],
    selectedAttributes: {} as Record<number, string[]>,
  });

  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Load Categories & Attributes
  const { data: categoriesData } = useQuery({
    queryKey: ['categories'],
    queryFn: () => api.getCategories(),
    enabled: isOpen,
  });

  const { data: attributesData } = useQuery({
    queryKey: ['attributes'],
    queryFn: () => api.getAttributes(),
    enabled: isOpen,
  });

  // Populate form on open/change
  useEffect(() => {
    if (product) {
      const attrMap: Record<number, string[]> = {};
      if (product.product_attributes) {
        product.product_attributes.forEach((pa) => {
          attrMap[pa.attribute_id] = pa.selected_values || [];
        });
      }

      setFormData({
        name: product.name || '',
        sku: product.sku || '',
        slug: product.slug || '',
        type: product.type || 'simple',
        status: product.status || 'publish',
        regular_price: product.regular_price !== null ? String(product.regular_price) : '',
        sale_price: product.sale_price !== null ? String(product.sale_price) : '',
        stock_quantity: product.stock_quantity ?? 0,
        manage_stock: product.manage_stock ?? true,
        description: product.description || '',
        short_description: product.short_description || '',
        image_url: product.image_url || '',
        category_ids: product.categories ? product.categories.map((c) => c.id) : [],
        selectedAttributes: attrMap,
      });
    } else {
      setFormData({
        name: '',
        sku: '',
        slug: '',
        type: 'simple',
        status: 'publish',
        regular_price: '',
        sale_price: '',
        stock_quantity: 10,
        manage_stock: true,
        description: '',
        short_description: '',
        image_url: '',
        category_ids: [],
        selectedAttributes: {},
      });
    }
    setErrorMessage(null);
  }, [product, isOpen]);

  const saveMutation = useMutation({
    mutationFn: (payload: any) => {
      if (isEditing && product) {
        return api.updateProduct(product.id, payload);
      }
      return api.createProduct(payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
      if (onSuccess) onSuccess();
      onClose();
    },
    onError: (err: any) => {
      setErrorMessage(err.message || 'Failed to save product.');
    },
  });

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    // Format attributes for API
    const formattedAttributes = Object.entries(formData.selectedAttributes)
      .filter(([_, values]) => values.length > 0)
      .map(([attrId, values]) => ({
        attribute_id: Number(attrId),
        selected_values: values,
        is_variation: false,
        is_visible: true,
      }));

    const payload = {
      name: formData.name,
      sku: formData.sku,
      slug: formData.slug || undefined,
      type: formData.type,
      status: formData.status,
      regular_price: Number(formData.regular_price),
      sale_price: formData.sale_price ? Number(formData.sale_price) : null,
      stock_quantity: Number(formData.stock_quantity),
      manage_stock: formData.manage_stock,
      description: formData.description,
      short_description: formData.short_description,
      image_url: formData.image_url || null,
      category_ids: formData.category_ids,
      attributes: formattedAttributes,
    };

    saveMutation.mutate(payload);
  };

  const handleCategoryToggle = (id: number) => {
    setFormData((prev) => ({
      ...prev,
      category_ids: prev.category_ids.includes(id)
        ? prev.category_ids.filter((cId) => cId !== id)
        : [...prev.category_ids, id],
    }));
  };

  const handleAttributeOptionToggle = (attributeId: number, optionValue: string) => {
    setFormData((prev) => {
      const current = prev.selectedAttributes[attributeId] || [];
      const updated = current.includes(optionValue)
        ? current.filter((v) => v !== optionValue)
        : [...current, optionValue];

      return {
        ...prev,
        selectedAttributes: {
          ...prev.selectedAttributes,
          [attributeId]: updated,
        },
      };
    });
  };

  const categories = categoriesData?.data || [];
  const attributes = attributesData?.data || [];

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/90">
          <div>
            <h2 className="text-base font-semibold text-white">
              {isEditing ? `Edit Product: ${product?.name}` : 'Create New Product'}
            </h2>
            <p className="text-xs text-slate-400">
              Manage product master catalog data, attributes, and inventory.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
          {errorMessage && (
            <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs">
              {errorMessage}
            </div>
          )}

          {/* Section: General Info */}
          <div className="space-y-4">
            <h3 className="text-xs font-semibold text-indigo-400 uppercase tracking-wider flex items-center gap-1.5">
              <Package className="w-4 h-4" /> General Information
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-xs font-medium text-slate-300 mb-1">Product Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. AeroPulse Wireless Headphones"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">SKU *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. AERO-01"
                  value={formData.sku}
                  onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-200 placeholder-slate-600 font-mono focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Slug</label>
                <input
                  type="text"
                  placeholder="Auto-generated if empty"
                  value={formData.slug}
                  onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-200 placeholder-slate-600 font-mono focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                />
              </div>
            </div>
          </div>

          {/* Section: Pricing & Stock */}
          <div className="space-y-4 pt-2 border-t border-slate-800">
            <h3 className="text-xs font-semibold text-indigo-400 uppercase tracking-wider flex items-center gap-1.5">
              <DollarSign className="w-4 h-4" /> Pricing & Inventory
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Regular Price ($) *</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  required
                  placeholder="99.99"
                  value={formData.regular_price}
                  onChange={(e) => setFormData({ ...formData, regular_price: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Sale Price ($)</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="Optional sale price"
                  value={formData.sale_price}
                  onChange={(e) => setFormData({ ...formData, sale_price: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Stock Quantity</label>
                <input
                  type="number"
                  min="0"
                  value={formData.stock_quantity}
                  onChange={(e) => setFormData({ ...formData, stock_quantity: Number(e.target.value) })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                />
              </div>
            </div>
          </div>

          {/* Section: Image & Descriptions */}
          <div className="space-y-4 pt-2 border-t border-slate-800">
            <h3 className="text-xs font-semibold text-indigo-400 uppercase tracking-wider flex items-center gap-1.5">
              <ImageIcon className="w-4 h-4" /> Media & Descriptions
            </h3>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Featured Image URL</label>
              <div className="flex gap-3">
                <input
                  type="url"
                  placeholder="https://images.unsplash.com/..."
                  value={formData.image_url}
                  onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                  className="flex-1 bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                />
                {formData.image_url && (
                  <div className="w-10 h-10 rounded-lg overflow-hidden border border-slate-800 bg-slate-950 shrink-0">
                    <img
                      src={formData.image_url}
                      alt="Preview"
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLElement).style.display = 'none';
                      }}
                    />
                  </div>
                )}
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Short Description</label>
              <input
                type="text"
                placeholder="Brief summary for listings and SEO"
                value={formData.short_description}
                onChange={(e) => setFormData({ ...formData, short_description: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Full Description</label>
              <textarea
                rows={3}
                placeholder="Comprehensive technical specifications and product copy..."
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
              />
            </div>
          </div>

          {/* Section: Categories */}
          <div className="space-y-3 pt-2 border-t border-slate-800">
            <h3 className="text-xs font-semibold text-indigo-400 uppercase tracking-wider flex items-center gap-1.5">
              <Layers className="w-4 h-4" /> Categories
            </h3>
            <div className="flex flex-wrap gap-2">
              {categories.map((cat) => {
                const isSelected = formData.category_ids.includes(cat.id);
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => handleCategoryToggle(cat.id)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                      isSelected
                        ? 'bg-indigo-600/20 text-indigo-300 border-indigo-500/40'
                        : 'bg-slate-950 text-slate-400 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    {cat.name}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Section: Attributes (Color, Size, Brand) */}
          <div className="space-y-4 pt-2 border-t border-slate-800">
            <h3 className="text-xs font-semibold text-indigo-400 uppercase tracking-wider flex items-center gap-1.5">
              <Tag className="w-4 h-4" /> Product Attributes
            </h3>

            {attributes.map((attr) => {
              const selectedValues = formData.selectedAttributes[attr.id] || [];
              return (
                <div key={attr.id} className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-200">{attr.name}</span>
                    <span className="text-[11px] font-mono text-slate-500">{attr.slug}</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {attr.options?.map((opt) => {
                      const isChecked = selectedValues.includes(opt.value);
                      return (
                        <button
                          key={opt.id}
                          type="button"
                          onClick={() => handleAttributeOptionToggle(attr.id, opt.value)}
                          className={`px-2.5 py-1 rounded text-xs font-medium border transition-colors ${
                            isChecked
                              ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40'
                              : 'bg-slate-900 text-slate-400 border-slate-800 hover:border-slate-700'
                          }`}
                        >
                          {opt.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Modal Footer Inside Form */}
          <div className="pt-4 border-t border-slate-800 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg text-xs font-medium text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saveMutation.isPending}
              className="flex items-center gap-2 px-5 py-2.5 rounded-lg text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-500/20 active:scale-95 transition-all disabled:opacity-50"
            >
              {saveMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Saving Product...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  {isEditing ? 'Save Changes' : 'Create Product'}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
