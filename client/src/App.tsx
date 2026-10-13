import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Sidebar } from './components/Sidebar';
import { LandingPage } from './pages/LandingPage';
import { OverviewPage } from './pages/OverviewPage';
import { CatalogPage } from './pages/CatalogPage';
import { ProductDetailPage } from './pages/ProductDetailPage';
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

// Authenticated Application Workspace Shell
const AppWorkspaceShell: React.FC = () => {
  return (
    <div className="flex min-h-screen bg-[#fbfaf8] text-[#19201d] font-sans antialiased">
      {/* Deep dark charcoal/green sidebar */}
      <Sidebar />

      {/* Main Work Area */}
      <main className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        <Outlet />
      </main>
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          {/* Public Marketing Landing Page at "/" (Section 14) */}
          <Route path="/" element={<LandingPage />} />

          {/* Authenticated Application Workspace Shell at "/app/*" */}
          <Route path="/app" element={<AppWorkspaceShell />}>
            <Route index element={<Navigate to="/app/overview" replace />} />
            <Route path="overview" element={<OverviewPage />} />
            <Route path="catalog" element={<CatalogPage />} />
            <Route path="catalog/:id" element={<ProductDetailPage />} />
            <Route path="attributes" element={<AttributesPage />} />
            <Route path="ai-review" element={<AIReviewPage />} />
            <Route path="sync-inspector" element={<SyncInspectorPage />} />
            <Route path="sync-history" element={<SyncHistoryPage />} />
            <Route path="woocommerce" element={<WooCommercePage />} />
            <Route path="settings" element={<SettingsPage />} />
          </Route>

          {/* Legacy & Direct Route Backwards Compatibility */}
          <Route path="/overview" element={<Navigate to="/app/overview" replace />} />
          <Route path="/catalog" element={<Navigate to="/app/catalog" replace />} />
          <Route path="/catalog/:id" element={<Navigate to="/app/catalog/:id" replace />} />
          <Route path="/products" element={<Navigate to="/app/catalog" replace />} />
          <Route path="/attributes" element={<Navigate to="/app/attributes" replace />} />
          <Route path="/ai-review" element={<Navigate to="/app/ai-review" replace />} />
          <Route path="/sync-inspector" element={<Navigate to="/app/sync-inspector" replace />} />
          <Route path="/sync-history" element={<Navigate to="/app/sync-history" replace />} />
          <Route path="/audit-logs" element={<Navigate to="/app/sync-history" replace />} />
          <Route path="/woocommerce" element={<Navigate to="/app/woocommerce" replace />} />
          <Route path="/mock-store" element={<Navigate to="/app/woocommerce" replace />} />
          <Route path="/settings" element={<Navigate to="/app/settings" replace />} />

          {/* Fallback to landing */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
};

export default App;
