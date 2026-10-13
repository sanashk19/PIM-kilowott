import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../api/client';
import {
  X,
  ArrowLeft,
  Sparkles,
  Edit2,
  CheckCircle2,
  Clock,
  Tag,
  ExternalLink,
  Layers,
  ShoppingBag,
} from 'lucide-react';
import type { Product } from '../types';

interface ProductDetailModalProps {
  productId: number | null;
  isOpen: boolean;
  onClose: () => void;
  onOpenAI: (id: number) => void;
  onOpenEdit: (product: Product) => void;
  onOpenSync: (id: number) => void;
}

export const ProductDetailModal: React.FC<ProductDetailModalProps> = ({
  productId,
  isOpen,
  onClose,
  onOpenAI,
  onOpenEdit,
  onOpenSync,
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'attributes' | 'ai' | 'history'>('overview');

  const { data, isLoading } = useQuery({
    queryKey: ['product', productId],
    queryFn: () => (productId ? api.getProduct(productId) : Promise.reject()),
    enabled: isOpen && !!productId,
  });

  if (!isOpen || !productId) return null;

  const product = data?.data;
  if (!product) return null;

  const score = product.quality_score ?? 85;
  const isExcellent = score >= 85;
  const isGood = score >= 70 && score < 85;
  const isAttention = score < 70;

  // Fallback realistic product image if empty
  const defaultImage =
    product.images?.[0]?.src ||
    product.image_url ||
    'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600&auto=format&fit=crop&q=80';

  const thumbnails = [
    defaultImage,
    'https://images.unsplash.com/photo-1608231387042-66d1773070a5?w=300&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?w=300&auto=format&fit=crop&q=80',
  ];

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-5xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh] animate-in fade-in duration-200">
        {/* Top bar with back button & status */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-white">
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="text-xs text-slate-400 font-medium">
              Products <span className="mx-1">&gt;</span> <strong className="text-slate-800">{product.name}</strong>
            </div>
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              {product.sync_status === 'synced' ? 'Synced' : product.sync_status}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => onOpenSync(product.id)}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
            >
              Pre-flight Diff
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content Body: Two columns matching reference image */}
        <div className="flex-1 overflow-y-auto p-6 grid grid-cols-1 md:grid-cols-12 gap-8">
          {/* Left Column (Image, Score, Actions) */}
          <div className="md:col-span-5 space-y-5">
            {/* Main Product Image */}
            <div className="aspect-4/3 rounded-2xl overflow-hidden border border-slate-200 bg-slate-50 flex items-center justify-center relative shadow-xs">
              <img
                src={defaultImage}
                alt={product.name}
                className="w-full h-full object-cover object-center"
              />
            </div>

            {/* Thumbnails row */}
            <div className="flex items-center gap-2.5">
              {thumbnails.map((src, i) => (
                <div
                  key={i}
                  className="w-16 h-14 rounded-xl overflow-hidden border border-slate-200 bg-slate-50 shrink-0"
                >
                  <img src={src} alt="thumb" className="w-full h-full object-cover" />
                </div>
              ))}
              <div className="w-12 h-14 rounded-xl border border-dashed border-slate-200 bg-slate-50 text-slate-400 text-xs font-bold flex items-center justify-center">
                +2
              </div>
            </div>

            {/* Quality Score card */}
            <div className="p-4 rounded-xl bg-slate-50/70 border border-slate-200/80 flex items-center justify-between">
              <div>
                <div className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">Quality Score</div>
                <div className="text-xl font-bold text-slate-900 mt-0.5">
                  {score}<span className="text-xs text-slate-400 font-normal">/100</span>
                </div>
              </div>
              <span className="px-3 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                Excellent
              </span>
            </div>

            {/* WooCommerce Meta card */}
            <div className="p-4 rounded-xl bg-slate-50/70 border border-slate-200/80 grid grid-cols-2 gap-4 text-xs">
              <div>
                <div className="text-slate-400 text-[11px]">WooCommerce ID</div>
                <div className="font-semibold text-slate-800 mt-0.5 font-mono">
                  #{product.woo_id || '1048'}
                </div>
              </div>
              <div>
                <div className="text-slate-400 text-[11px]">Last Synced</div>
                <div className="font-semibold text-slate-800 mt-0.5">2 hours ago</div>
              </div>
            </div>

            {/* Analyze with AI primary button */}
            <button
              onClick={() => onOpenAI(product.id)}
              className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-xs font-semibold bg-violet-600 hover:bg-violet-700 text-white shadow-md shadow-violet-500/20 active:scale-95 transition-all"
            >
              <Sparkles className="w-4 h-4" />
              Analyze with AI
            </button>
          </div>

          {/* Right Column (Tabs, Info, Description) */}
          <div className="md:col-span-7 space-y-6">
            {/* Tabs */}
            <div className="flex items-center gap-6 border-b border-slate-200 pb-2">
              <button
                onClick={() => setActiveTab('overview')}
                className={`text-xs font-semibold pb-2 -mb-2.5 transition-all ${
                  activeTab === 'overview'
                    ? 'text-violet-700 border-b-2 border-violet-600'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                Overview
              </button>
              <button
                onClick={() => setActiveTab('attributes')}
                className={`text-xs font-semibold pb-2 -mb-2.5 transition-all ${
                  activeTab === 'attributes'
                    ? 'text-violet-700 border-b-2 border-violet-600'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                Attributes (6)
              </button>
              <button
                onClick={() => setActiveTab('ai')}
                className={`text-xs font-semibold pb-2 -mb-2.5 transition-all ${
                  activeTab === 'ai'
                    ? 'text-violet-700 border-b-2 border-violet-600'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                AI Analysis
              </button>
              <button
                onClick={() => setActiveTab('history')}
                className={`text-xs font-semibold pb-2 -mb-2.5 transition-all ${
                  activeTab === 'history'
                    ? 'text-violet-700 border-b-2 border-violet-600'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                Sync History
              </button>
            </div>

            {/* Product Information Card */}
            <div className="border border-slate-200 rounded-2xl p-5 bg-white shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Product Information</h3>
                <button
                  onClick={() => onOpenEdit(product)}
                  className="flex items-center gap-1 text-xs font-semibold text-violet-600 hover:text-violet-700"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                  Edit
                </button>
              </div>

              <div className="grid grid-cols-2 gap-y-4 gap-x-6 text-xs">
                <div>
                  <div className="text-slate-400 text-[11px]">Product Name</div>
                  <div className="font-semibold text-slate-900 mt-0.5">{product.name}</div>
                </div>
                <div>
                  <div className="text-slate-400 text-[11px]">SKU</div>
                  <div className="font-mono font-semibold text-slate-900 mt-0.5">{product.sku}</div>
                </div>
                <div>
                  <div className="text-slate-400 text-[11px]">Category</div>
                  <div className="font-medium text-slate-800 mt-0.5">{product.category?.name || 'Footwear'}</div>
                </div>
                <div>
                  <div className="text-slate-400 text-[11px]">Brand</div>
                  <div className="font-medium text-slate-800 mt-0.5">{product.brand || 'Nike'}</div>
                </div>
                <div>
                  <div className="text-slate-400 text-[11px]">Regular Price</div>
                  <div className="font-semibold text-slate-900 mt-0.5">₹{product.regular_price || product.price}</div>
                </div>
                <div>
                  <div className="text-slate-400 text-[11px]">Sale Price</div>
                  <div className="font-semibold text-slate-900 mt-0.5">
                    {product.sale_price ? `₹${product.sale_price}` : '—'}
                  </div>
                </div>
                <div>
                  <div className="text-slate-400 text-[11px]">Stock Quantity</div>
                  <div className="font-semibold text-slate-900 mt-0.5">{product.stock_quantity ?? 24}</div>
                </div>
                <div>
                  <div className="text-slate-400 text-[11px]">Status</div>
                  <div className="font-semibold text-slate-900 mt-0.5 capitalize">{product.status || 'Active'}</div>
                </div>
              </div>
            </div>

            {/* Description Card */}
            <div className="border border-slate-200 rounded-2xl p-5 bg-white shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Description</h3>
                <button
                  onClick={() => onOpenEdit(product)}
                  className="flex items-center gap-1 text-xs font-semibold text-violet-600 hover:text-violet-700"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                  Edit
                </button>
              </div>

              <p className="text-xs text-slate-600 leading-relaxed">
                {product.description ||
                  'The Nike Air Max Pro delivers outstanding comfort and style with advanced cushioning and breathable materials. Perfect for both casual wear and athletic performance.'}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
