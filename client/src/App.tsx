import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Sidebar } from './components/Sidebar';
import { OverviewPage } from './pages/OverviewPage';
import { CatalogPage } from './pages/CatalogPage';
import { AttributesPage } from './pages/AttributesPage';
import { AIReviewPage } from './pages/AIReviewPage';
import { SyncInspectorPage } from './pages/SyncInspectorPage';
import { SyncHistoryPage } from './pages/SyncHistoryPage';
import { WooCommercePage } from './pages/WooCommercePage';
import { SettingsPage } from './pages/SettingsPage';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      staleTime: 5000,
    },
  },
});

export const App: React.FC = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <div className="flex min-h-screen bg-[#f8fafc] text-slate-900 font-sans antialiased">
          {/* Professional Enterprise Sidebar */}
          <Sidebar />

          {/* Main Work Area */}
          <main className="flex-1 flex flex-col min-w-0 overflow-y-auto">
            <Routes>
              {/* Workspace */}
              <Route path="/" element={<OverviewPage />} />
              <Route path="/catalog" element={<CatalogPage />} />
              <Route path="/products" element={<CatalogPage />} />
              <Route path="/attributes" element={<AttributesPage />} />

              {/* Operations */}
              <Route path="/ai-review" element={<AIReviewPage />} />
              <Route path="/sync-inspector" element={<SyncInspectorPage />} />
              <Route path="/sync-history" element={<SyncHistoryPage />} />
              <Route path="/audit-logs" element={<SyncHistoryPage />} />

              {/* Integrations */}
              <Route path="/woocommerce" element={<WooCommercePage />} />
              <Route path="/mock-store" element={<WooCommercePage />} />
              <Route path="/settings" element={<SettingsPage />} />

              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </main>
        </div>
      </BrowserRouter>
    </QueryClientProvider>
  );
};

export default App;
