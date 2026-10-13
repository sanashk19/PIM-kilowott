import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Package,
  Layers,
  Sparkles,
  GitCompare,
  History,
  Store,
  Settings,
  ShieldCheck,
} from 'lucide-react';

export const Sidebar: React.FC = () => {
  return (
    <aside className="w-56 bg-[#111916] text-[#c2c8c4] flex flex-col h-screen sticky top-0 shrink-0 text-xs select-none border-r border-[#1e2a23]">
      {/* Brand Header */}
      <div className="px-4 py-3.5 border-b border-[#1b2620] flex items-center gap-2.5">
        <div className="w-6 h-6 rounded bg-[#1e3a29] border border-[#2a4d37] text-[#4ade80] flex items-center justify-center shrink-0">
          <ShieldCheck className="w-3.5 h-3.5" />
        </div>
        <div className="min-w-0">
          <div className="font-semibold text-[13px] tracking-tight text-white leading-tight">
            PIM Sentinel
          </div>
          <div className="text-[10px] text-[#7d8b82] font-medium truncate">
            Product Intelligence
          </div>
        </div>
      </div>

      {/* Navigation Sections */}
      <nav className="flex-1 px-2.5 py-3 space-y-4 overflow-y-auto">
        {/* WORKSPACE */}
        <div>
          <div className="px-2 py-1 text-[9.5px] font-semibold text-[#5c6962] uppercase tracking-wider">
            Workspace
          </div>
          <div className="mt-0.5 space-y-0.5">
            <NavLink
              to="/app/overview"
              className={({ isActive }) =>
                `flex items-center gap-2.5 px-2.5 py-1.5 rounded-md text-xs font-medium transition-colors ${
                  isActive
                    ? 'bg-[#1b2e23] text-white font-semibold'
                    : 'text-[#9ea8a2] hover:text-white hover:bg-[#16221c]'
                }`
              }
            >
              <LayoutDashboard className="w-3.5 h-3.5 text-[#738178]" />
              <span>Overview</span>
            </NavLink>

            <NavLink
              to="/app/catalog"
              className={({ isActive }) =>
                `flex items-center gap-2.5 px-2.5 py-1.5 rounded-md text-xs font-medium transition-colors ${
                  isActive
                    ? 'bg-[#1b2e23] text-white font-semibold'
                    : 'text-[#9ea8a2] hover:text-white hover:bg-[#16221c]'
                }`
              }
            >
              <Package className="w-3.5 h-3.5 text-[#738178]" />
              <span>Catalog</span>
            </NavLink>

            <NavLink
              to="/app/attributes"
              className={({ isActive }) =>
                `flex items-center gap-2.5 px-2.5 py-1.5 rounded-md text-xs font-medium transition-colors ${
                  isActive
                    ? 'bg-[#1b2e23] text-white font-semibold'
                    : 'text-[#9ea8a2] hover:text-white hover:bg-[#16221c]'
                }`
              }
            >
              <Layers className="w-3.5 h-3.5 text-[#738178]" />
              <span>Attributes</span>
            </NavLink>
          </div>
        </div>

        {/* OPERATIONS */}
        <div>
          <div className="px-2 py-1 text-[9.5px] font-semibold text-[#5c6962] uppercase tracking-wider">
            Operations
          </div>
          <div className="mt-0.5 space-y-0.5">
            <NavLink
              to="/app/ai-review"
              className={({ isActive }) =>
                `flex items-center justify-between px-2.5 py-1.5 rounded-md text-xs font-medium transition-colors ${
                  isActive
                    ? 'bg-[#1b2e23] text-white font-semibold'
                    : 'text-[#9ea8a2] hover:text-white hover:bg-[#16221c]'
                }`
              }
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <Sparkles className="w-3.5 h-3.5 text-[#a78bfa]" />
                <span>AI Review</span>
              </div>
              <span className="px-1.5 py-0.2 rounded text-[10px] font-semibold bg-[#2e2617] text-[#fbbf24] border border-[#523e16]">
                5
              </span>
            </NavLink>

            <NavLink
              to="/app/sync-inspector"
              className={({ isActive }) =>
                `flex items-center gap-2.5 px-2.5 py-1.5 rounded-md text-xs font-medium transition-colors ${
                  isActive
                    ? 'bg-[#1b2e23] text-white font-semibold'
                    : 'text-[#9ea8a2] hover:text-white hover:bg-[#16221c]'
                }`
              }
            >
              <GitCompare className="w-3.5 h-3.5 text-[#738178]" />
              <span>Sync Inspector</span>
            </NavLink>

            <NavLink
              to="/app/sync-history"
              className={({ isActive }) =>
                `flex items-center gap-2.5 px-2.5 py-1.5 rounded-md text-xs font-medium transition-colors ${
                  isActive
                    ? 'bg-[#1b2e23] text-white font-semibold'
                    : 'text-[#9ea8a2] hover:text-white hover:bg-[#16221c]'
                }`
              }
            >
              <History className="w-3.5 h-3.5 text-[#738178]" />
              <span>Sync History</span>
            </NavLink>
          </div>
        </div>

        {/* INTEGRATIONS */}
        <div>
          <div className="px-2 py-1 text-[9.5px] font-semibold text-[#5c6962] uppercase tracking-wider">
            Integrations
          </div>
          <div className="mt-0.5 space-y-0.5">
            <NavLink
              to="/app/woocommerce"
              className={({ isActive }) =>
                `flex items-center gap-2.5 px-2.5 py-1.5 rounded-md text-xs font-medium transition-colors ${
                  isActive
                    ? 'bg-[#1b2e23] text-white font-semibold'
                    : 'text-[#9ea8a2] hover:text-white hover:bg-[#16221c]'
                }`
              }
            >
              <Store className="w-3.5 h-3.5 text-[#738178]" />
              <span>WooCommerce</span>
            </NavLink>

            <NavLink
              to="/app/settings"
              className={({ isActive }) =>
                `flex items-center gap-2.5 px-2.5 py-1.5 rounded-md text-xs font-medium transition-colors ${
                  isActive
                    ? 'bg-[#1b2e23] text-white font-semibold'
                    : 'text-[#9ea8a2] hover:text-white hover:bg-[#16221c]'
                }`
              }
            >
              <Settings className="w-3.5 h-3.5 text-[#738178]" />
              <span>Settings</span>
            </NavLink>
          </div>
        </div>
      </nav>

      {/* Bottom Status & Profile */}
      <div className="p-3 border-t border-[#1b2620] space-y-2 bg-[#0e1412]">
        <div className="flex items-center justify-between text-[11px] px-1">
          <span className="text-[#7d8b82]">WooCommerce</span>
          <span className="flex items-center gap-1.5 font-medium text-[#4ade80]">
            <span className="w-1.5 h-1.5 rounded-full bg-[#22c55e] animate-pulse" />
            Connected
          </span>
        </div>

        <div className="flex items-center gap-2.5 px-1 pt-1.5 border-t border-[#1a251e]">
          <div className="w-6 h-6 rounded-full bg-[#1e2f24] border border-[#2e4736] text-[#86efac] flex items-center justify-center font-bold text-[10px]">
            S
          </div>
          <div className="min-w-0">
            <div className="text-[11px] font-medium text-white truncate leading-tight">
              Sana Shaikh
            </div>
            <div className="text-[9.5px] text-[#7d8b82]">Owner</div>
          </div>
        </div>
      </div>
    </aside>
  );
};
