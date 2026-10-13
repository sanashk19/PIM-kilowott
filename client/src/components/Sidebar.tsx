import React, { useState, useEffect, useRef, useCallback } from 'react';
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
  PanelLeftClose,
  PanelLeftOpen,
} from 'lucide-react';

const DEFAULT_WIDTH = 230;
const MIN_WIDTH = 190;
const MAX_WIDTH = 380;

export const Sidebar: React.FC = () => {
  const [width, setWidth] = useState<number>(() => {
    const saved = localStorage.getItem('pim_sidebar_width');
    return saved ? Math.max(MIN_WIDTH, Math.min(MAX_WIDTH, Number(saved))) : DEFAULT_WIDTH;
  });

  const [isCollapsed, setIsCollapsed] = useState<boolean>(() => {
    return localStorage.getItem('pim_sidebar_collapsed') === 'true';
  });

  const [isDragging, setIsDragging] = useState(false);
  const sidebarRef = useRef<HTMLElement>(null);

  const startResizing = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);

    const onMouseMove = (moveEvent: MouseEvent) => {
      const newWidth = Math.max(MIN_WIDTH, Math.min(MAX_WIDTH, moveEvent.clientX));
      setWidth(newWidth);
    };

    const onMouseUp = () => {
      setIsDragging(false);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
      localStorage.setItem('pim_sidebar_width', String(width));
    };

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
  }, [width]);

  useEffect(() => {
    localStorage.setItem('pim_sidebar_width', String(width));
  }, [width]);

  useEffect(() => {
    localStorage.setItem('pim_sidebar_collapsed', String(isCollapsed));
  }, [isCollapsed]);

  const toggleCollapse = () => {
    setIsCollapsed((prev) => !prev);
  };

  const handleDoubleClick = () => {
    setWidth(DEFAULT_WIDTH);
    setIsCollapsed(false);
  };

  return (
    <aside
      ref={sidebarRef}
      style={{ width: isCollapsed ? 64 : width }}
      className={`relative bg-[#111916] text-[#c2c8c4] flex flex-col h-screen sticky top-0 shrink-0 text-xs border-r border-[#1e2a23] transition-[width] ${
        isDragging ? 'transition-none select-none duration-0' : 'duration-150'
      }`}
    >
      {/* Brand Header */}
      <div className="px-3.5 py-3.5 border-b border-[#1b2620] flex items-center justify-between gap-2">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-6 h-6 rounded bg-[#1e3a29] border border-[#2a4d37] text-[#4ade80] flex items-center justify-center shrink-0">
            <ShieldCheck className="w-3.5 h-3.5" />
          </div>
          {!isCollapsed && (
            <div className="min-w-0">
              <div className="font-semibold text-[13px] tracking-tight text-white leading-tight truncate">
                VERIDEX
              </div>
              <div className="text-[10px] text-[#7d8b82] font-medium truncate">
                Intelligent Catalog &amp; Sync
              </div>
            </div>
          )}
        </div>

        <button
          type="button"
          onClick={toggleCollapse}
          className="text-[#7d8b82] hover:text-white p-1 rounded hover:bg-[#1b2620] transition-colors shrink-0"
          title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {isCollapsed ? (
            <PanelLeftOpen className="w-3.5 h-3.5" />
          ) : (
            <PanelLeftClose className="w-3.5 h-3.5" />
          )}
        </button>
      </div>

      {/* Navigation Sections */}
      <nav className="flex-1 px-2 py-3 space-y-4 overflow-y-auto">
        {/* WORKSPACE */}
        <div>
          {!isCollapsed && (
            <div className="px-2 py-1 text-[9.5px] font-semibold text-[#5c6962] uppercase tracking-wider">
              Workspace
            </div>
          )}
          <div className="mt-0.5 space-y-0.5">
            <NavLink
              to="/app/overview"
              title="Overview"
              className={({ isActive }) =>
                `flex items-center gap-2.5 px-2.5 py-1.5 rounded-md text-xs font-medium transition-colors ${
                  isActive
                    ? 'bg-[#1b2e23] text-white font-semibold'
                    : 'text-[#9ea8a2] hover:text-white hover:bg-[#16221c]'
                } ${isCollapsed ? 'justify-center px-1' : ''}`
              }
            >
              <LayoutDashboard className="w-3.5 h-3.5 text-[#738178] shrink-0" />
              {!isCollapsed && <span>Overview</span>}
            </NavLink>

            <NavLink
              to="/app/catalog"
              title="Catalog"
              className={({ isActive }) =>
                `flex items-center gap-2.5 px-2.5 py-1.5 rounded-md text-xs font-medium transition-colors ${
                  isActive
                    ? 'bg-[#1b2e23] text-white font-semibold'
                    : 'text-[#9ea8a2] hover:text-white hover:bg-[#16221c]'
                } ${isCollapsed ? 'justify-center px-1' : ''}`
              }
            >
              <Package className="w-3.5 h-3.5 text-[#738178] shrink-0" />
              {!isCollapsed && <span>Catalog</span>}
            </NavLink>

            <NavLink
              to="/app/attributes"
              title="Attributes"
              className={({ isActive }) =>
                `flex items-center gap-2.5 px-2.5 py-1.5 rounded-md text-xs font-medium transition-colors ${
                  isActive
                    ? 'bg-[#1b2e23] text-white font-semibold'
                    : 'text-[#9ea8a2] hover:text-white hover:bg-[#16221c]'
                } ${isCollapsed ? 'justify-center px-1' : ''}`
              }
            >
              <Layers className="w-3.5 h-3.5 text-[#738178] shrink-0" />
              {!isCollapsed && <span>Attributes</span>}
            </NavLink>
          </div>
        </div>

        {/* OPERATIONS */}
        <div>
          {!isCollapsed && (
            <div className="px-2 py-1 text-[9.5px] font-semibold text-[#5c6962] uppercase tracking-wider">
              Operations
            </div>
          )}
          <div className="mt-0.5 space-y-0.5">
            <NavLink
              to="/app/ai-review"
              title="AI Review"
              className={({ isActive }) =>
                `flex items-center justify-between px-2.5 py-1.5 rounded-md text-xs font-medium transition-colors ${
                  isActive
                    ? 'bg-[#1b2e23] text-white font-semibold'
                    : 'text-[#9ea8a2] hover:text-white hover:bg-[#16221c]'
                } ${isCollapsed ? 'justify-center px-1' : ''}`
              }
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <Sparkles className="w-3.5 h-3.5 text-[#a78bfa] shrink-0" />
                {!isCollapsed && <span>AI Review</span>}
              </div>
              {!isCollapsed && (
                <span className="px-1.5 py-0.2 rounded text-[10px] font-semibold bg-[#2e2617] text-[#fbbf24] border border-[#523e16]">
                  5
                </span>
              )}
            </NavLink>

            <NavLink
              to="/app/sync-inspector"
              title="Sync Inspector"
              className={({ isActive }) =>
                `flex items-center gap-2.5 px-2.5 py-1.5 rounded-md text-xs font-medium transition-colors ${
                  isActive
                    ? 'bg-[#1b2e23] text-white font-semibold'
                    : 'text-[#9ea8a2] hover:text-white hover:bg-[#16221c]'
                } ${isCollapsed ? 'justify-center px-1' : ''}`
              }
            >
              <GitCompare className="w-3.5 h-3.5 text-[#738178] shrink-0" />
              {!isCollapsed && <span>Sync Inspector</span>}
            </NavLink>

            <NavLink
              to="/app/sync-history"
              title="Sync History"
              className={({ isActive }) =>
                `flex items-center gap-2.5 px-2.5 py-1.5 rounded-md text-xs font-medium transition-colors ${
                  isActive
                    ? 'bg-[#1b2e23] text-white font-semibold'
                    : 'text-[#9ea8a2] hover:text-white hover:bg-[#16221c]'
                } ${isCollapsed ? 'justify-center px-1' : ''}`
              }
            >
              <History className="w-3.5 h-3.5 text-[#738178] shrink-0" />
              {!isCollapsed && <span>Sync History</span>}
            </NavLink>
          </div>
        </div>

        {/* INTEGRATIONS */}
        <div>
          {!isCollapsed && (
            <div className="px-2 py-1 text-[9.5px] font-semibold text-[#5c6962] uppercase tracking-wider">
              Integrations
            </div>
          )}
          <div className="mt-0.5 space-y-0.5">
            <NavLink
              to="/app/woocommerce"
              title="WooCommerce"
              className={({ isActive }) =>
                `flex items-center gap-2.5 px-2.5 py-1.5 rounded-md text-xs font-medium transition-colors ${
                  isActive
                    ? 'bg-[#1b2e23] text-white font-semibold'
                    : 'text-[#9ea8a2] hover:text-white hover:bg-[#16221c]'
                } ${isCollapsed ? 'justify-center px-1' : ''}`
              }
            >
              <Store className="w-3.5 h-3.5 text-[#738178] shrink-0" />
              {!isCollapsed && <span>WooCommerce</span>}
            </NavLink>

            <NavLink
              to="/app/settings"
              title="Settings"
              className={({ isActive }) =>
                `flex items-center gap-2.5 px-2.5 py-1.5 rounded-md text-xs font-medium transition-colors ${
                  isActive
                    ? 'bg-[#1b2e23] text-white font-semibold'
                    : 'text-[#9ea8a2] hover:text-white hover:bg-[#16221c]'
                } ${isCollapsed ? 'justify-center px-1' : ''}`
              }
            >
              <Settings className="w-3.5 h-3.5 text-[#738178] shrink-0" />
              {!isCollapsed && <span>Settings</span>}
            </NavLink>
          </div>
        </div>
      </nav>

      {/* Bottom Status & Profile */}
      <div className="p-3 border-t border-[#1b2620] space-y-2 bg-[#0e1412]">
        {!isCollapsed && (
          <div className="flex items-center justify-between text-[11px] px-1">
            <span className="text-[#7d8b82]">WooCommerce</span>
            <span className="flex items-center gap-1.5 font-medium text-[#4ade80]">
              <span className="w-1.5 h-1.5 rounded-full bg-[#22c55e] animate-pulse" />
              Connected
            </span>
          </div>
        )}

        <div className={`flex items-center gap-2.5 px-1 pt-1.5 border-t border-[#1a251e] ${isCollapsed ? 'justify-center' : ''}`}>
          <div className="w-6 h-6 rounded-full bg-[#1e2f24] border border-[#2e4736] text-[#86efac] flex items-center justify-center font-bold text-[10px] shrink-0">
            S
          </div>
          {!isCollapsed && (
            <div className="min-w-0">
              <div className="text-[11px] font-medium text-white truncate leading-tight">
                Sana Shaikh
              </div>
              <div className="text-[9.5px] text-[#7d8b82]">Owner</div>
            </div>
          )}
        </div>
      </div>

      {/* Interactive Drag Handle for Resizing Width */}
      <div
        onMouseDown={startResizing}
        onDoubleClick={handleDoubleClick}
        title="Drag to resize sidebar (double-click to reset)"
        className={`absolute top-0 right-0 w-1.5 h-full cursor-col-resize hover:bg-[#4ade80]/60 active:bg-[#4ade80] transition-colors z-20 ${
          isDragging ? 'bg-[#4ade80]' : 'bg-transparent'
        }`}
      />
    </aside>
  );
};
