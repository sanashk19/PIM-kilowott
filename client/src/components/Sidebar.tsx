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
  CheckCircle2,
} from 'lucide-react';

export const Sidebar: React.FC = () => {
  return (
    <aside className="w-56 bg-white border-r border-slate-200 flex flex-col h-screen sticky top-0 shrink-0 text-slate-800 text-xs select-none">
      {/* Brand Header */}
      <div className="px-4 py-3.5 border-b border-slate-200 flex items-center gap-2.5">
        <div className="w-6 h-6 rounded bg-indigo-600 text-white flex items-center justify-center shrink-0">
          <ShieldCheck className="w-3.5 h-3.5" />
        </div>
        <div className="min-w-0">
          <div className="font-bold text-[13px] tracking-tight text-slate-900 leading-tight">
            PIM SENTINEL
          </div>
          <div className="text-[10px] text-slate-500 font-medium truncate">
            Product Intelligence Platform
          </div>
        </div>
      </div>

      {/* Navigation Sections */}
      <nav className="flex-1 px-2 py-3 space-y-4 overflow-y-auto">
        {/* WORKSPACE */}
        <div>
          <div className="px-2.5 py-1 text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
            Workspace
          </div>
          <div className="mt-0.5 space-y-0.5">
            <NavLink
              to="/"
              end
              className={({ isActive }) =>
                `flex items-center gap-2.5 px-2.5 py-1.5 rounded-md text-xs font-medium transition-colors ${
                  isActive
                    ? 'bg-indigo-50 text-indigo-700 font-semibold'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`
              }
            >
              <LayoutDashboard className="w-4 h-4 text-slate-400 group-hover:text-slate-600" />
              <span>Overview</span>
            </NavLink>

            <NavLink
              to="/catalog"
              className={({ isActive }) =>
                `flex items-center gap-2.5 px-2.5 py-1.5 rounded-md text-xs font-medium transition-colors ${
                  isActive
                    ? 'bg-indigo-50 text-indigo-700 font-semibold'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`
              }
            >
              <Package className="w-4 h-4 text-slate-400" />
              <span>Catalog</span>
            </NavLink>

            <NavLink
              to="/attributes"
              className={({ isActive }) =>
                `flex items-center gap-2.5 px-2.5 py-1.5 rounded-md text-xs font-medium transition-colors ${
                  isActive
                    ? 'bg-indigo-50 text-indigo-700 font-semibold'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`
              }
            >
              <Layers className="w-4 h-4 text-slate-400" />
              <span>Attributes</span>
            </NavLink>
          </div>
        </div>

        {/* OPERATIONS */}
        <div>
          <div className="px-2.5 py-1 text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
            Operations
          </div>
          <div className="mt-0.5 space-y-0.5">
            <NavLink
              to="/ai-review"
              className={({ isActive }) =>
                `flex items-center justify-between px-2.5 py-1.5 rounded-md text-xs font-medium transition-colors ${
                  isActive
                    ? 'bg-indigo-50 text-indigo-700 font-semibold'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`
              }
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <Sparkles className="w-4 h-4 text-slate-400" />
                <span>AI Review</span>
              </div>
              <span className="px-1.5 py-0.2 rounded text-[10px] font-semibold bg-amber-100 text-amber-800">
                4
              </span>
            </NavLink>

            <NavLink
              to="/sync-inspector"
              className={({ isActive }) =>
                `flex items-center gap-2.5 px-2.5 py-1.5 rounded-md text-xs font-medium transition-colors ${
                  isActive
                    ? 'bg-indigo-50 text-indigo-700 font-semibold'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`
              }
            >
              <GitCompare className="w-4 h-4 text-slate-400" />
              <span>Sync Inspector</span>
            </NavLink>

            <NavLink
              to="/sync-history"
              className={({ isActive }) =>
                `flex items-center gap-2.5 px-2.5 py-1.5 rounded-md text-xs font-medium transition-colors ${
                  isActive
                    ? 'bg-indigo-50 text-indigo-700 font-semibold'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`
              }
            >
              <History className="w-4 h-4 text-slate-400" />
              <span>Sync History</span>
            </NavLink>
          </div>
        </div>

        {/* INTEGRATIONS */}
        <div>
          <div className="px-2.5 py-1 text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
            Integrations
          </div>
          <div className="mt-0.5 space-y-0.5">
            <NavLink
              to="/woocommerce"
              className={({ isActive }) =>
                `flex items-center gap-2.5 px-2.5 py-1.5 rounded-md text-xs font-medium transition-colors ${
                  isActive
                    ? 'bg-indigo-50 text-indigo-700 font-semibold'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`
              }
            >
              <Store className="w-4 h-4 text-slate-400" />
              <span>WooCommerce</span>
            </NavLink>

            <NavLink
              to="/settings"
              className={({ isActive }) =>
                `flex items-center gap-2.5 px-2.5 py-1.5 rounded-md text-xs font-medium transition-colors ${
                  isActive
                    ? 'bg-indigo-50 text-indigo-700 font-semibold'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`
              }
            >
              <Settings className="w-4 h-4 text-slate-400" />
              <span>Settings</span>
            </NavLink>
          </div>
        </div>
      </nav>

      {/* Bottom Status & Profile */}
      <div className="p-3 border-t border-slate-200 space-y-2 bg-slate-50/50">
        <div className="flex items-center justify-between text-[11px] text-slate-600 px-1">
          <span className="font-medium">WooCommerce</span>
          <span className="flex items-center gap-1.5 font-medium text-emerald-700">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            Connected
          </span>
        </div>

        <div className="flex items-center gap-2 px-1 pt-1 border-t border-slate-200/60">
          <div className="w-5 h-5 rounded-full bg-slate-200 text-slate-700 flex items-center justify-center font-bold text-[10px]">
            S
          </div>
          <div className="text-[11px] font-medium text-slate-800">
            Sana <span className="text-slate-400 font-normal">/ Owner</span>
          </div>
        </div>
      </div>
    </aside>
  );
};
