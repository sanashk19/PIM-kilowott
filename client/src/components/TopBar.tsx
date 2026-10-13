import React from 'react';
import { Search, Bell, ExternalLink } from 'lucide-react';

interface TopBarProps {
  breadcrumbs?: string[];
  search?: string;
  onSearchChange?: (val: string) => void;
  actions?: React.ReactNode;
}

export const TopBar: React.FC<TopBarProps> = ({
  breadcrumbs = ['Workspace', 'Overview'],
  search,
  onSearchChange,
  actions,
}) => {
  return (
    <header className="h-12 bg-white border-b border-slate-200 px-6 flex items-center justify-between gap-4 sticky top-0 z-10 shrink-0">
      {/* Breadcrumb / Page Title */}
      <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
        {breadcrumbs.map((crumb, i) => (
          <React.Fragment key={i}>
            {i > 0 && <span className="text-slate-300">/</span>}
            <span className={i === breadcrumbs.length - 1 ? 'text-slate-900 font-semibold' : ''}>
              {crumb}
            </span>
          </React.Fragment>
        ))}
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-3">
        {onSearchChange !== undefined && (
          <div className="relative w-64">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search ?? ''}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Filter by SKU, name..."
              className="w-full pl-8 pr-12 py-1 bg-slate-50 hover:bg-slate-100/70 focus:bg-white border border-slate-200 rounded text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
            <kbd className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-slate-400 font-mono bg-white border border-slate-200 px-1 rounded">
              ⌘K
            </kbd>
          </div>
        )}

        {actions}

        <button
          type="button"
          className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded transition-colors relative"
          title="Notifications"
        >
          <Bell className="w-4 h-4" />
          <span className="w-1.5 h-1.5 bg-indigo-600 rounded-full absolute top-1 right-1" />
        </button>

        <div className="h-4 w-px bg-slate-200" />

        <div className="flex items-center gap-2">
          <div className="text-[11px] text-right">
            <div className="font-semibold text-slate-800 leading-tight">Production</div>
            <div className="text-[10px] text-slate-400">WooCommerce v3</div>
          </div>
        </div>
      </div>
    </header>
  );
};
