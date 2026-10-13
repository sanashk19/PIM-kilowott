import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../api/client';
import {
  Store,
  ExternalLink,
  Download,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Sparkles,
} from 'lucide-react';
import { TopBar } from '../components/TopBar';

export const WooCommercePage: React.FC = () => {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [importNotice, setImportNotice] = useState<string | null>(null);

  const { data: storeData, isLoading } = useQuery({
    queryKey: ['mock-store-products', searchTerm],
    queryFn: () => api.getMockStoreProducts(searchTerm),
  });

  const importMutation = useMutation({
    mutationFn: (wooId: number) => api.importProduct(wooId),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
      queryClient.invalidateQueries({ queryKey: ['sync-logs'] });
      setImportNotice(res.message);
      setTimeout(() => setImportNotice(null), 3500);
    },
  });

  const products = storeData?.data || [];

  // Fallback realistic storefront list matching Panel 6 if database has partial records
  const displayItems =
    products.length > 0
      ? products
      : [
          {
            woo_id: 101,
            name: 'Apex Pro Wireless Headphones',
            regular_price: 7499,
            stock_quantity: 20,
            image_url: '/assets/products/headphones.jpg',
          },
          {
            woo_id: 103,
            name: 'Ethiopian Dark Roast 500g',
            regular_price: 899,
            stock_quantity: 110,
            image_url: '/assets/products/coffee.jpg',
          },
          {
            woo_id: 104,
            name: 'Ambient LED Light Bar',
            regular_price: 2499,
            stock_quantity: 60,
            image_url: '/assets/products/led-bar.jpg',
          },
          {
            woo_id: 105,
            name: 'AeroPress Travel Brew Kit',
            regular_price: 3499,
            stock_quantity: 15,
            image_url: '/assets/products/brewer.jpg',
          },
          {
            woo_id: 106,
            name: 'Leather Crossbody Bag',
            regular_price: 5099,
            stock_quantity: 18,
            image_url: '/assets/products/leather-bag.jpg',
          },
          {
            woo_id: 102,
            name: 'KeyCraft RGB Keyboard',
            regular_price: 3499,
            stock_quantity: 0,
            image_url: '/assets/products/keyboard.jpg',
          },
        ];

  return (
    <div className="flex-1 bg-white min-h-screen flex flex-col">
      <TopBar
        breadcrumbs={['Integrations', 'WooCommerce']}
        search={searchTerm}
        onSearchChange={setSearchTerm}
      />

      <div className="p-6 max-w-7xl w-full mx-auto space-y-6">
        {/* Header Row (Panel 6) */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-xl font-bold text-[#111916] tracking-tight">
                WooCommerce Storefront
              </h1>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-[#f0fdf4] text-[#15803d] border border-[#bbf7d0]">
                <span className="w-1.5 h-1.5 rounded-full bg-[#15803d]" />
                Live (Mock)
              </span>
            </div>
            <p className="text-xs text-[#5c6660] mt-0.5">
              View your synchronized products as they appear on your store.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => window.open('/app/woocommerce', '_blank')}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-[#f4f2ec] border border-[#e6e4df] rounded-md text-xs font-semibold text-[#19201d] shadow-2xs transition-colors"
            >
              <ExternalLink className="w-3.5 h-3.5 text-[#5c6660]" />
              <span>View in New Tab</span>
            </button>
          </div>
        </div>

        {/* Notice toast */}
        {importNotice && (
          <div className="p-3 bg-[#f0fdf4] border border-[#bbf7d0] text-[#15803d] text-xs rounded-lg flex items-center justify-between shadow-2xs">
            <span>{importNotice}</span>
            <button
              type="button"
              onClick={() => setImportNotice(null)}
              className="font-bold ml-2"
            >
              ×
            </button>
          </div>
        )}

        {/* Realistic Storefront Product Grid (Panel 6) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          {displayItems.map((item: any) => {
            const isOutOfStock = (item.stock_quantity ?? 0) <= 0;

            return (
              <div
                key={item.woo_id}
                className="bg-white border border-[#e6e4df] rounded-lg overflow-hidden shadow-2xs hover:shadow-xs hover:border-[#cbd5e1] transition-all flex flex-col justify-between group"
              >
                {/* Product Image Area */}
                <div className="relative aspect-square bg-[#fbfaf8] border-b border-[#f4f2ec] flex items-center justify-center p-6 overflow-hidden">
                  <img
                    src={item.image_url || '/assets/products/headphones.svg'}
                    alt={item.name}
                    className="max-h-48 w-full object-contain group-hover:scale-105 transition-transform duration-300"
                  />
                  <span className="absolute top-3 right-3 text-[10px] font-mono text-[#8a948e] bg-white/90 border border-[#e6e4df] px-1.5 py-0.5 rounded">
                    #{item.woo_id}
                  </span>
                </div>

                {/* Details Footer */}
                <div className="p-4 space-y-3">
                  <div>
                    <h3 className="font-semibold text-xs text-[#111916] line-clamp-1" title={item.name}>
                      {item.name}
                    </h3>
                    <div className="flex items-center justify-between mt-1.5">
                      <span className="font-bold text-sm text-[#111916]">
                        ₹{item.regular_price?.toLocaleString('en-IN') ?? '—'}
                      </span>
                      {isOutOfStock ? (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#fee2e2] text-[#b91c1c] border border-[#fca5a5]">
                          Out of Stock
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-[#f0fdf4] text-[#15803d] border border-[#bbf7d0]">
                          In Stock
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="pt-2 border-t border-[#f4f2ec] flex items-center justify-between text-xs">
                    <span className="text-[11px] text-[#7d8b82]">
                      {item.stock_quantity ?? 0} units available
                    </span>
                    <button
                      type="button"
                      onClick={() => importMutation.mutate(item.woo_id)}
                      className="text-[#15803d] hover:text-[#166534] font-semibold text-[11px] flex items-center gap-1"
                    >
                      <Download className="w-3 h-3" />
                      <span>Import to PIM</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
