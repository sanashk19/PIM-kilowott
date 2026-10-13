import React from 'react';
import { NavLink, Link } from 'react-router-dom';
import { LayoutDashboard, Package, Tags, ArrowLeftRight, Store, Settings, Layers } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../api/client';

export const Navbar: React.FC = () => {
  const { data: settingsData } = useQuery({
    queryKey: ['settings'],
    queryFn: () => api.getSettings(),
    staleTime: 10000,
  });

  const isMock = settingsData?.data?.woo_active_driver !== 'live';
  const isFailureSimulated = settingsData?.data?.mock_woo_simulate_failure;

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-800 bg-slate-950/80 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Platform Name */}
          <div className="flex items-center gap-3">
            <Link to="/" className="flex items-center gap-2.5 group">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-cyan-400 p-0.5 shadow-lg shadow-indigo-500/20 group-hover:shadow-indigo-500/40 transition-all">
                <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
                  <Layers className="w-5 h-5 text-indigo-400 group-hover:rotate-6 transition-transform" />
                </div>
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-lg text-white tracking-tight">PIM Hub</span>
                  <span className="text-[10px] font-semibold uppercase px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
                    Kilowott
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 -mt-0.5">WooCommerce Integration Command Center</p>
              </div>
            </Link>
          </div>

          {/* Navigation Links */}
          <nav className="hidden md:flex items-center gap-1">
            <NavLink
              to="/"
              className={({ isActive }) =>
                `flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-indigo-600/15 text-indigo-400 border border-indigo-500/30'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                }`
              }
            >
              <LayoutDashboard className="w-4 h-4" />
              Dashboard
            </NavLink>

            <NavLink
              to="/products"
              className={({ isActive }) =>
                `flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-indigo-600/15 text-indigo-400 border border-indigo-500/30'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                }`
              }
            >
              <Package className="w-4 h-4" />
              Products
            </NavLink>

            <NavLink
              to="/attributes"
              className={({ isActive }) =>
                `flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-indigo-600/15 text-indigo-400 border border-indigo-500/30'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                }`
              }
            >
              <Tags className="w-4 h-4" />
              Attributes
            </NavLink>

            <NavLink
              to="/sync"
              className={({ isActive }) =>
                `flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-indigo-600/15 text-indigo-400 border border-indigo-500/30'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                }`
              }
            >
              <ArrowLeftRight className="w-4 h-4" />
              Sync Center
            </NavLink>

            <NavLink
              to="/mock-store"
              className={({ isActive }) =>
                `flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-cyan-500/15 text-cyan-400 border border-cyan-500/30'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                }`
              }
            >
              <Store className="w-4 h-4" />
              Woo Storefront
            </NavLink>

            <NavLink
              to="/settings"
              className={({ isActive }) =>
                `flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-indigo-600/15 text-indigo-400 border border-indigo-500/30'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                }`
              }
            >
              <Settings className="w-4 h-4" />
              Settings
            </NavLink>
          </nav>

          {/* Active Integration Status Indicator */}
          <div className="flex items-center gap-3">
            <Link
              to="/settings"
              className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
                isFailureSimulated
                  ? 'bg-rose-500/10 text-rose-300 border-rose-500/30 animate-pulse'
                  : isMock
                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 hover:border-emerald-500/40'
                  : 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20 hover:border-indigo-500/40'
              }`}
            >
              <span
                className={`w-2 h-2 rounded-full ${
                  isFailureSimulated
                    ? 'bg-rose-500'
                    : isMock
                    ? 'bg-emerald-500 animate-pulse'
                    : 'bg-indigo-500 animate-pulse'
                }`}
              />
              {isFailureSimulated
                ? 'Simulated Error Active'
                : isMock
                ? 'Mock WooCommerce Sandbox'
                : 'Live WooCommerce Store'}
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
};
