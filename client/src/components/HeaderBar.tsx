import React from 'react';
import { Search, Bell, Grid, User } from 'lucide-react';

interface HeaderBarProps {
  searchTerm?: string;
  onSearchChange?: (val: string) => void;
  title?: string;
}

export const HeaderBar: React.FC<HeaderBarProps> = ({
  searchTerm = '',
  onSearchChange,
}) => {
  return (
    <div className="flex items-center justify-between gap-4 py-3 px-6 bg-white/80 backdrop-blur-sm border-b border-slate-200/80 sticky top-0 z-10">
      <div className="relative flex-1 max-w-md">
        <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => onSearchChange?.(e.target.value)}
          placeholder="Search products, SKU, category..."
          className="w-full pl-9 pr-14 py-2 bg-slate-50 hover:bg-slate-100/80 focus:bg-white text-xs text-slate-900 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 transition-all placeholder:text-slate-400"
        />
        <kbd className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] font-medium text-slate-400 bg-white border border-slate-200 px-1.5 py-0.5 rounded shadow-xs">
          Ctrl K
        </kbd>
      </div>

      <div className="flex items-center gap-2">
        <button
          type="button"
          className="p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
          title="Notifications"
        >
          <Bell className="w-4 h-4" />
        </button>
        <button
          type="button"
          className="p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
          title="Apps"
        >
          <Grid className="w-4 h-4" />
        </button>
        <div className="w-8 h-8 rounded-full bg-violet-100 border border-violet-200 text-violet-700 font-semibold text-xs flex items-center justify-center ml-1">
          S
        </div>
      </div>
    </div>
  );
};
