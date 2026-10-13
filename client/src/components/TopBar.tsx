import React from 'react';
import { Search, Bell } from 'lucide-react';

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
    <header className="h-13 bg-white border-b border-[#e8e6df] px-6 flex items-center justify-between gap-4 sticky top-0 z-10 shrink-0">
      {/* Left: Breadcrumbs & Global Search */}
      <div className="flex items-center gap-6 flex-1 min-w-0">
        {/* Breadcrumb */}
        <div className="flex items-center gap-1.5 text-xs text-[#667069] font-medium shrink-0">
          {breadcrumbs.map((crumb, i) => (
            <React.Fragment key={i}>
              {i > 0 && <span className="text-[#c7c4b8]">/</span>}
              <span className={i === breadcrumbs.length - 1 ? 'text-[#19201d] font-semibold' : ''}>
                {crumb}
              </span>
            </React.Fragment>
          ))}
        </div>

        {/* Global Search Bar */}
        <div className="relative max-w-md w-full">
          <Search className="w-3.5 h-3.5 text-[#8c948e] absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search ?? ''}
            onChange={(e) => onSearchChange?.(e.target.value)}
            placeholder="Search products, SKU, category..."
            className="w-full pl-9 pr-14 py-1.5 bg-slate-50 hover:bg-white focus:bg-white border border-[#e6e4df] rounded-md text-xs text-[#19201d] placeholder:text-[#8c948e] focus:outline-none focus:ring-1 focus:ring-[#15803d] focus:border-[#15803d] transition-all"
          />
          <kbd className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] text-[#8c948e] font-sans bg-white border border-[#e6e4df] px-1.5 py-0.5 rounded shadow-2xs">
            Ctrl K
          </kbd>
        </div>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-3 shrink-0">
        {actions}

        {/* Notification Bell */}
        <button
          type="button"
          className="p-1.5 text-[#667069] hover:text-[#19201d] hover:bg-[#f4f2ec] rounded-md transition-colors relative"
          title="Notifications"
        >
          <Bell className="w-4 h-4" />
          <span className="w-1.5 h-1.5 bg-[#15803d] rounded-full absolute top-1.5 right-1.5" />
        </button>

        <div className="h-4 w-px bg-[#e6e4df]" />

        {/* User Avatar */}
        <div className="w-7 h-7 rounded-full bg-[#1b2e23] text-[#86efac] border border-[#2a4d37] flex items-center justify-center font-bold text-xs">
          S
        </div>

        {/* Environment Indicator */}
        <div className="flex items-center gap-2 pl-1">
          <div className="text-[11px] text-right">
            <div className="font-semibold text-[#19201d] leading-tight flex items-center justify-end gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[#15803d]" />
              Production
            </div>
            <div className="text-[10px] text-[#7d8b82]">WooCommerce v3</div>
          </div>
        </div>
      </div>
    </header>
  );
};
