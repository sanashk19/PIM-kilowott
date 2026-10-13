import React, { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { api } from '../api/client';
import {
  ArrowLeft,
  Edit2,
  Sparkles,
  GitCompare,
  CheckCircle2,
  AlertTriangle,
  Layers,
  History,
  Store,
  ExternalLink,
} from 'lucide-react';
import { TopBar } from '../components/TopBar';
import { ProductEditorModal } from '../components/ProductEditorModal';
import { PreFlightDiffModal } from '../components/PreFlightDiffModal';

export const ProductDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const productId = Number(id) || 1;

  const [activeTab, setActiveTab] = useState<'overview' | 'attributes' | 'ai' | 'sync'>('overview');
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [isDiffModalOpen, setIsDiffModalOpen] = useState(false);

  const { data: productData, isLoading } = useQuery({
    queryKey: ['product', productId],
    queryFn: () => api.getProduct(productId),
  });

  const product = productData?.data;

  if (isLoading || !product) {
    return (
      <div className="flex-1 bg-[#fbfaf8] min-h-screen flex flex-col">
        <TopBar breadcrumbs={['Workspace', 'Catalog', 'Loading...']} />
        <div className="p-8 text-center text-xs text-[#7d8b82]">
          Loading product record...
        </div>
      </div>
    );
  }

  const qualityScore = product.quality_score ?? 57;
  const issues = Array.isArray(product.quality_issues)
    ? product.quality_issues
    : typeof product.quality_issues === 'string'
    ? JSON.parse(product.quality_issues || '[]')
    : [];

  return (
    <div className="flex-1 bg-[#fbfaf8] min-h-screen flex flex-col">
      <TopBar breadcrumbs={['Workspace', 'Catalog', product.name]} />

      <div className="p-6 max-w-6xl w-full mx-auto space-y-6">
        {/* Navigation Breadcrumb & Back Link */}
        <div className="flex items-center justify-between">
          <Link
            to="/app/catalog"
            className="inline-flex items-center gap-1.5 text-xs text-[#5c6660] hover:text-[#111916] font-medium"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Catalog</span>
          </Link>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsDiffModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-[#f4f2ec] border border-[#e6e4df] rounded-md text-xs font-medium text-[#19201d] shadow-2xs transition-colors"
            >
              <GitCompare className="w-3.5 h-3.5 text-[#15803d]" />
              <span>Dry Run Diff</span>
            </button>
            <button
              type="button"
              onClick={() => setIsEditorOpen(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-[#15803d] hover:bg-[#166534] text-white rounded-md text-xs font-semibold shadow-2xs transition-colors"
            >
              <Edit2 className="w-3.5 h-3.5" />
              <span>Edit Product</span>
            </button>
          </div>
        </div>

        {/* Title & Status Row (Panel 3) */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-[#e6e4df]">
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-xl font-bold text-[#111916] tracking-tight">
                {product.name}
              </h1>
              <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-[#f4f2ec] text-[#5c6660] border border-[#e6e4df]">
                {product.status || 'Draft'}
              </span>
            </div>
            <div className="text-xs text-[#7d8b82] font-medium mt-0.5">
              {product.brand || 'Unbranded'}
            </div>
          </div>
        </div>

        {/* Main Grid: Left Image & Right Specs (Panel 3) */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
          {/* LEFT: Large Product Photography & Quality Gauge */}
          <div className="md:col-span-5 space-y-4">
            <div className="bg-white border border-[#e6e4df] rounded-xl p-6 shadow-2xs flex items-center justify-center min-h-[300px]">
              <img
                src={product.image_url || '/assets/products/headphones.svg'}
                alt={product.name}
                className="w-full max-h-64 object-contain"
              />
            </div>

            {/* Thumbnail Gallery Row */}
            <div className="grid grid-cols-4 gap-2">
              <div className="aspect-square bg-white border-2 border-[#15803d] rounded-lg p-1 flex items-center justify-center overflow-hidden cursor-pointer">
                <img
                  src={product.image_url || '/assets/products/headphones.svg'}
                  alt="Thumb 1"
                  className="w-full h-full object-contain"
                />
              </div>
              <div className="aspect-square bg-white border border-[#e6e4df] rounded-lg p-1 flex items-center justify-center overflow-hidden cursor-pointer opacity-70 hover:opacity-100">
                <img
                  src={product.image_url || '/assets/products/headphones.svg'}
                  alt="Thumb 2"
                  className="w-full h-full object-contain rotate-12"
                />
              </div>
              <div className="aspect-square bg-white border border-[#e6e4df] rounded-lg p-1 flex items-center justify-center overflow-hidden cursor-pointer opacity-70 hover:opacity-100">
                <img
                  src={product.image_url || '/assets/products/headphones.svg'}
                  alt="Thumb 3"
                  className="w-full h-full object-contain -rotate-12"
                />
              </div>
              <div className="aspect-square bg-[#f4f2ec] border border-[#e6e4df] rounded-lg flex items-center justify-center text-xs font-semibold text-[#5c6660] cursor-pointer">
                +2
              </div>
            </div>

            {/* Quality Score Indicator */}
            <div className="bg-white border border-[#e6e4df] rounded-lg p-4 shadow-2xs flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full border-4 border-[#dc2626] flex items-center justify-center font-bold text-xs font-mono text-[#111916]">
                  {qualityScore}
                </div>
                <div>
                  <div className="text-[11px] font-bold text-[#5c6660] uppercase tracking-wide">
                    Quality Score
                  </div>
                  <div className="text-xs font-bold text-[#111916]">
                    {qualityScore} / 100
                  </div>
                </div>
              </div>
              <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-[#fef2f2] text-[#dc2626] border border-[#fecaca]">
                Needs Attention
              </span>
            </div>
          </div>

          {/* RIGHT: Tabs & Information Matrix (Panel 3) */}
          <div className="md:col-span-7 space-y-4">
            {/* Tabs Header */}
            <div className="flex items-center gap-6 border-b border-[#e6e4df] text-xs font-semibold">
              <button
                type="button"
                onClick={() => setActiveTab('overview')}
                className={`pb-2.5 transition-colors relative ${
                  activeTab === 'overview'
                    ? 'text-[#15803d]'
                    : 'text-[#7d8b82] hover:text-[#111916]'
                }`}
              >
                Overview
                {activeTab === 'overview' && (
                  <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#15803d]" />
                )}
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('attributes')}
                className={`pb-2.5 transition-colors relative ${
                  activeTab === 'attributes'
                    ? 'text-[#15803d]'
                    : 'text-[#7d8b82] hover:text-[#111916]'
                }`}
              >
                Attributes
                {activeTab === 'attributes' && (
                  <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#15803d]" />
                )}
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('ai')}
                className={`pb-2.5 transition-colors relative flex items-center gap-1.5 ${
                  activeTab === 'ai'
                    ? 'text-[#7c3aed]'
                    : 'text-[#7d8b82] hover:text-[#111916]'
                }`}
              >
                <Sparkles className="w-3 h-3 text-[#7c3aed]" />
                <span>AI Analysis</span>
                {activeTab === 'ai' && (
                  <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#7c3aed]" />
                )}
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('sync')}
                className={`pb-2.5 transition-colors relative ${
                  activeTab === 'sync'
                    ? 'text-[#15803d]'
                    : 'text-[#7d8b82] hover:text-[#111916]'
                }`}
              >
                Sync History
                {activeTab === 'sync' && (
                  <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#15803d]" />
                )}
              </button>
            </div>

            {/* Tab 1: Product Information card (Panel 3) */}
            {activeTab === 'overview' && (
              <div className="bg-white border border-[#e6e4df] rounded-lg p-5 shadow-2xs space-y-4">
                <h3 className="text-xs font-bold text-[#111916] uppercase tracking-wider">
                  Product Information
                </h3>

                <div className="grid grid-cols-2 gap-y-3.5 gap-x-6 text-xs">
                  <div>
                    <div className="text-[11px] text-[#7d8b82]">SKU</div>
                    <div className="font-mono font-medium text-[#111916] mt-0.5">
                      {product.sku || 'AERO-01'}
                    </div>
                  </div>

                  <div>
                    <div className="text-[11px] text-[#7d8b82]">Category</div>
                    <div className="font-medium text-[#111916] mt-0.5">
                      {product.categories?.[0]?.name || 'Electronics'}
                    </div>
                  </div>

                  <div>
                    <div className="text-[11px] text-[#7d8b82]">Brand</div>
                    <div className="font-medium text-[#111916] mt-0.5">
                      {product.brand || 'Sony'}
                    </div>
                  </div>

                  <div>
                    <div className="text-[11px] text-[#7d8b82]">Regular Price</div>
                    <div className="font-medium text-[#111916] mt-0.5">
                      ₹{product.regular_price?.toLocaleString('en-IN') ?? '7,499'}
                    </div>
                  </div>

                  <div>
                    <div className="text-[11px] text-[#7d8b82]">Sale Price</div>
                    <div className="font-medium text-[#111916] mt-0.5">
                      {product.sale_price ? `₹${product.sale_price.toLocaleString('en-IN')}` : '—'}
                    </div>
                  </div>

                  <div>
                    <div className="text-[11px] text-[#7d8b82]">Stock Quantity</div>
                    <div className="font-medium text-[#111916] mt-0.5">
                      {product.stock_quantity ?? 15} units
                    </div>
                  </div>

                  <div>
                    <div className="text-[11px] text-[#7d8b82]">Status</div>
                    <div className="font-medium text-[#111916] mt-0.5 capitalize">
                      {product.status || 'Draft'}
                    </div>
                  </div>

                  <div>
                    <div className="text-[11px] text-[#7d8b82]">WooCommerce ID</div>
                    <div className="font-medium text-[#7d8b82] mt-0.5">
                      {product.woo_id ? `#${product.woo_id}` : '—'}
                    </div>
                  </div>
                </div>

                {/* Description snippet */}
                <div className="pt-3 border-t border-[#f4f2ec]">
                  <div className="text-[11px] text-[#7d8b82] mb-1">Description</div>
                  <div
                    className="text-xs text-[#5c6660] leading-relaxed prose prose-sm max-w-none"
                    dangerouslySetInnerHTML={{
                      __html: product.description || 'Active noise cancelling...',
                    }}
                  />
                </div>
              </div>
            )}

            {/* Tab 2: Attributes */}
            {activeTab === 'attributes' && (
              <div className="bg-white border border-[#e6e4df] rounded-lg p-5 shadow-2xs space-y-3">
                <h3 className="text-xs font-bold text-[#111916] uppercase tracking-wider">
                  Associated Attributes
                </h3>
                <div className="space-y-2 text-xs">
                  <div className="flex items-center justify-between p-2.5 bg-[#fbfaf8] border border-[#e6e4df] rounded-md">
                    <span className="font-medium text-[#111916]">Color</span>
                    <span className="text-[#5c6660]">Matte Black</span>
                  </div>
                  <div className="flex items-center justify-between p-2.5 bg-[#fbfaf8] border border-[#e6e4df] rounded-md">
                    <span className="font-medium text-[#111916]">Connectivity</span>
                    <span className="text-[#5c6660]">Bluetooth 5.3</span>
                  </div>
                  <div className="flex items-center justify-between p-2.5 bg-[#fbfaf8] border border-[#e6e4df] rounded-md">
                    <span className="font-medium text-[#111916]">Material</span>
                    <span className="text-[#5c6660]">Titanium Alloy</span>
                  </div>
                </div>
              </div>
            )}

            {/* Tab 3: AI Analysis */}
            {activeTab === 'ai' && (
              <div className="bg-white border border-[#e6e4df] rounded-lg p-5 shadow-2xs space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold text-[#111916] uppercase tracking-wider">
                    Detected Quality Issues ({issues.length || 5})
                  </h3>
                  <Link
                    to="/app/ai-review"
                    className="text-xs text-[#7c3aed] font-semibold hover:underline"
                  >
                    Open AI Review Studio →
                  </Link>
                </div>
                <div className="space-y-2 text-xs">
                  {issues.map((issue: any, index: number) => (
                    <div
                      key={index}
                      className="p-2.5 bg-[#fffcf5] border border-[#f5ebcf] rounded-md flex items-start justify-between gap-3"
                    >
                      <div className="flex items-center gap-2">
                        <AlertTriangle className="w-3.5 h-3.5 text-[#b45309] shrink-0" />
                        <span className="text-[#19201d] font-medium">{issue.message}</span>
                      </div>
                      <span className="px-1.5 py-0.5 rounded text-[10px] uppercase font-bold bg-[#fef3c7] text-[#92400e]">
                        {issue.severity || 'Medium'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Tab 4: Sync History */}
            {activeTab === 'sync' && (
              <div className="bg-white border border-[#e6e4df] rounded-lg p-5 shadow-2xs space-y-3">
                <h3 className="text-xs font-bold text-[#111916] uppercase tracking-wider">
                  Sync Audit Events
                </h3>
                <div className="space-y-2 text-xs">
                  <div className="p-2.5 bg-[#fbfaf8] border border-[#e6e4df] rounded-md flex items-center justify-between">
                    <div>
                      <div className="font-medium text-[#111916]">Price &amp; Stock updated</div>
                      <div className="text-[11px] text-[#7d8b82]">PIM → WooCommerce</div>
                    </div>
                    <span className="text-[11px] text-[#15803d] font-semibold">Success</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <ProductEditorModal
        isOpen={isEditorOpen}
        onClose={() => setIsEditorOpen(false)}
        product={product}
      />

      <PreFlightDiffModal
        isOpen={isDiffModalOpen}
        onClose={() => setIsDiffModalOpen(false)}
        productId={product.id}
      />
    </div>
  );
};
