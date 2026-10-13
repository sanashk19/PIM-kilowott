import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../api/client';
import { Product } from '../types';
import {
  X,
  Save,
  Loader2,
  Package,
  Layers,
  AlertCircle,
  Check,
} from 'lucide-react';

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
    stock_quantity: '10',
    manage_stock: true,
    brand: '',
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
        regular_price: product.regular_price !== null && product.regular_price !== undefined ? String(product.regular_price) : '',
        sale_price: product.sale_price !== null && product.sale_price !== undefined ? String(product.sale_price) : '',
        stock_quantity: String(product.stock_quantity ?? 0),
        manage_stock: product.manage_stock ?? true,
        brand: product.brand || '',
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
        stock_quantity: '10',
        manage_stock: true,
        brand: '',
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
      const serverMsg = err.data?.message || err.message || 'Failed to save product.';
      const fieldErrors = err.data?.errors
        ? Object.entries(err.data.errors)
            .map(([field, msgs]: any) => `${field}: ${msgs.join(', ')}`)
            .join(' | ')
        : null;
      setErrorMessage(fieldErrors ? `${serverMsg} (${fieldErrors})` : serverMsg);
    },
  });

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!formData.name.trim()) {
      setErrorMessage('Product title is required.');
      return;
    }
    if (!formData.sku.trim()) {
      setErrorMessage('Product SKU is required.');
      return;
    }

    // Format attributes for API
    const formattedAttributes = Object.entries(formData.selectedAttributes)
      .filter(([_, values]) => values.length > 0)
      .map(([attrId, values]) => ({
        attribute_id: Number(attrId),
        selected_values: values,
      }));

    const regularPriceNum = formData.regular_price.trim() !== '' ? Number(formData.regular_price) : null;
    const salePriceNum = formData.sale_price.trim() !== '' ? Number(formData.sale_price) : null;
    const stockQtyNum = formData.stock_quantity.trim() !== '' ? Number(formData.stock_quantity) : 0;

    const payload = {
      name: formData.name.trim(),
      sku: formData.sku.trim().toUpperCase(),
      slug: formData.slug.trim() || undefined,
      type: formData.type as 'simple' | 'variable',
      status: formData.status as 'draft' | 'publish',
      regular_price: regularPriceNum,
      sale_price: salePriceNum,
      stock_quantity: isNaN(stockQtyNum) ? 0 : stockQtyNum,
      manage_stock: formData.manage_stock,
      brand: formData.brand.trim() || undefined,
      description: formData.description.trim() || undefined,
      short_description: formData.short_description.trim() || undefined,
      image_url: formData.image_url.trim() || undefined,
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
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white border border-slate-200 rounded-lg w-full max-w-2xl shadow-xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-5 py-3.5 border-b border-slate-200 flex items-center justify-between bg-white">
          <div>
            <h2 className="text-sm font-bold text-slate-900 tracking-tight">
              {isEditing ? `Edit Product: ${product?.name}` : 'Create New Product'}
            </h2>
            <p className="text-xs text-slate-500">
              Manage product master catalog data, taxonomy attributes, and WooCommerce inventory.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 space-y-4 text-xs">
          {errorMessage && (
            <div className="p-3 rounded border border-rose-200 bg-rose-50 text-rose-800 text-xs flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold">Error saving product:</span> {errorMessage}
              </div>
            </div>
          )}

          {/* Section 1: General Info */}
          <div className="space-y-3">
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500 border-b border-slate-100 pb-1 flex items-center gap-1.5">
              <Package className="w-3.5 h-3.5 text-indigo-600" />
              General Information
            </div>

            <div className="space-y-2.5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Product Title <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. AeroPulse Wireless Headphones"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    SKU <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. AERO-01"
                    value={formData.sku}
                    onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                    className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded font-mono text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-indigo-500 uppercase"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Brand</label>
                  <input
                    type="text"
                    placeholder="e.g. Nike, Apple, Sony"
                    value={formData.brand}
                    onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                    className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Status</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded text-slate-800 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  >
                    <option value="publish">Publish (Active)</option>
                    <option value="draft">Draft</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Section 2: Pricing & Inventory */}
          <div className="space-y-3 pt-2">
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500 border-b border-slate-100 pb-1">
              Pricing &amp; Inventory
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Regular Price (₹) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="number"
                  step="0.01"
                  required
                  placeholder="e.g. 7499"
                  value={formData.regular_price}
                  onChange={(e) => setFormData({ ...formData, regular_price: e.target.value })}
                  className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded font-mono text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Sale Price (₹)
                </label>
                <input
                  type="number"
                  step="0.01"
                  placeholder="Optional sale price"
                  value={formData.sale_price}
                  onChange={(e) => setFormData({ ...formData, sale_price: e.target.value })}
                  className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded font-mono text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Stock Quantity
                </label>
                <input
                  type="number"
                  placeholder="e.g. 24"
                  value={formData.stock_quantity}
                  onChange={(e) => setFormData({ ...formData, stock_quantity: e.target.value })}
                  className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded font-mono text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>
            </div>
          </div>

          {/* Section 3: Media & Descriptions */}
          <div className="space-y-3 pt-2">
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500 border-b border-slate-100 pb-1">
              Media &amp; Copywriting
            </div>

            <div className="space-y-2.5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Featured Image URL
                </label>
                <input
                  type="url"
                  placeholder="https://images.unsplash.com/photo-..."
                  value={formData.image_url}
                  onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                  className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Full Description (SEO Optimized)
                </label>
                <textarea
                  rows={3}
                  placeholder="Detailed product features, specifications, materials, and care instructions..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>
            </div>
          </div>

          {/* Section 4: Categories Taxonomy */}
          <div className="space-y-2 pt-2">
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500 border-b border-slate-100 pb-1">
              Category Mapping
            </div>

            <div className="flex flex-wrap gap-1.5 pt-1">
              {categories.map((cat) => {
                const isSelected = formData.category_ids.includes(cat.id);
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => handleCategoryToggle(cat.id)}
                    className={`px-2.5 py-1 rounded text-xs font-medium border transition-colors ${
                      isSelected
                        ? 'bg-[#f0fdf4] border-[#15803d] text-[#15803d] font-semibold'
                        : 'bg-white border-[#e6e4df] text-[#5c6660] hover:bg-[#fbfaf8]'
                    }`}
                  >
                    {cat.name}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Section 5: Attributes */}
          {attributes.length > 0 && (
            <div className="space-y-2 pt-2">
              <div className="text-[11px] font-bold uppercase tracking-wider text-[#7d8b82] border-b border-[#f4f2ec] pb-1">
                Product Attributes (Variations / Specs)
              </div>

              <div className="space-y-2 pt-1">
                {attributes.map((attr) => (
                  <div key={attr.id} className="p-2.5 rounded border border-[#e6e4df] bg-[#fbfaf8]">
                    <span className="font-semibold text-[#111916] text-[11px] block mb-1.5">
                      {attr.name}
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {attr.options?.map((opt) => {
                        const selectedValues = formData.selectedAttributes[attr.id] || [];
                        const isSelected = selectedValues.includes(opt.value);
                        return (
                          <button
                            key={opt.id}
                            type="button"
                            onClick={() => handleAttributeOptionToggle(attr.id, opt.value)}
                            className={`px-2 py-0.5 rounded text-[11px] border transition-colors ${
                              isSelected
                                ? 'bg-[#15803d] border-[#15803d] text-white font-semibold'
                                : 'bg-white border-[#e6e4df] text-[#19201d] hover:bg-[#f4f2ec]'
                            }`}
                          >
                            {opt.label || opt.value}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Footer Submit */}
          <div className="pt-3 border-t border-[#e6e4df] flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-1.5 rounded border border-[#e6e4df] hover:bg-[#fbfaf8] text-xs font-semibold text-[#5c6660] transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saveMutation.isPending}
              className="flex items-center gap-1.5 px-4 py-1.5 rounded bg-[#15803d] hover:bg-[#166534] text-white text-xs font-semibold shadow-2xs disabled:opacity-50 transition-colors"
            >
              {saveMutation.isPending ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-3.5 h-3.5" />
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
