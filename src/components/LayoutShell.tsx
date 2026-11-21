import React, { useState } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  LogOut,
  Menu,
  X,
  type LucideIcon,
} from 'lucide-react';

export interface SidebarNavItem {
  id: string;
  label: string;
  icon: LucideIcon;
}

interface LayoutShellProps {
  brandTitle: string;
  sectionTitle: string;
  userEmail: string;
  userRoleLabel: string;
  navItems: SidebarNavItem[];
  activeNavId: string;
  onSelectNav: (id: string) => void;
  onLogout: () => void;
  children: React.ReactNode;
}

export function LayoutShell({
  brandTitle,
  sectionTitle,
  userEmail,
  userRoleLabel,
  navItems,
  activeNavId,
  onSelectNav,
  onLogout,
  children,
}: LayoutShellProps) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleNavClick = (id: string) => {
    onSelectNav(id);
    setMobileOpen(false);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-700 flex">
      {/* Mobile Sidebar Backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-30 bg-slate-900/40 lg:hidden no-print"
          onClick={() => setMobileOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Collapsible Left Sidebar */}
      <aside
        aria-label="Primary navigation"
        className={`no-print fixed inset-y-0 left-0 z-40 flex flex-col border-r border-slate-200 bg-white transition-all duration-200 lg:static ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        } ${collapsed ? 'lg:w-[76px]' : 'w-64'}`}
      >
        <div className="flex h-16 items-center justify-between border-b border-slate-200 px-4">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#1e3a8a] text-white font-display font-bold text-xs tracking-wide">
              BSG
            </div>
            {!collapsed && (
              <span className="font-display text-sm font-bold tracking-tight text-slate-900 truncate">
                {brandTitle}
              </span>
            )}
          </div>
          <button
            type="button"
            onClick={() => setMobileOpen(false)}
            className="rounded-md p-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-800 lg:hidden"
            aria-label="Close navigation menu"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav className="flex-1 space-y-1 p-3 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = item.id === activeNavId;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => handleNavClick(item.id)}
                title={collapsed ? item.label : undefined}
                aria-current={isActive ? 'page' : undefined}
                className={`w-full flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1e3a8a] ${
                  isActive
                    ? 'bg-[#1e3a8a] text-white shadow-sm'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                } ${collapsed ? 'justify-center px-2' : ''}`}
              >
                <Icon className="h-4.5 w-4.5 shrink-0" aria-hidden="true" />
                {!collapsed && <span className="truncate whitespace-nowrap">{item.label}</span>}
              </button>
            );
          })}
        </nav>

        <div className="hidden lg:flex border-t border-slate-200 p-3">
          <button
            type="button"
            onClick={() => setCollapsed((prev) => !prev)}
            className="w-full flex items-center justify-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-colors"
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {collapsed ? (
              <ChevronRight className="h-4 w-4 shrink-0" />
            ) : (
              <>
                <ChevronLeft className="h-4 w-4 shrink-0" />
                <span className="whitespace-nowrap">Collapse Sidebar</span>
              </>
            )}
          </button>
        </div>
      </aside>

      {/* Main Content Shell */}
      <div className="flex flex-1 flex-col min-w-0">
        {/* Top Header Bar */}
        <header className="no-print sticky top-0 z-20 flex h-16 items-center justify-between gap-4 border-b border-slate-200 bg-white px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              onClick={() => setMobileOpen(true)}
              className="rounded-lg border border-slate-200 p-2 text-slate-600 hover:bg-slate-100 lg:hidden"
              aria-label="Open navigation menu"
            >
              <Menu className="h-5 w-5" />
            </button>
            <h1 className="font-display text-base sm:text-lg font-semibold text-slate-900 truncate">
              {sectionTitle}
            </h1>
          </div>

          <div className="flex items-center gap-3 sm:gap-4 shrink-0">
            <div className="hidden sm:flex items-center gap-2 text-sm text-slate-600">
              <span className="font-medium text-slate-800 max-w-[220px] truncate">
                {userEmail}
              </span>
              <span aria-hidden="true" className="text-slate-300">
                /
              </span>
              <span className="text-xs font-medium text-slate-500 capitalize whitespace-nowrap">
                {userRoleLabel}
              </span>
            </div>
            <button
              type="button"
              onClick={onLogout}
              className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-xs sm:text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50 hover:text-slate-900 transition-colors whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1e3a8a]"
            >
              <LogOut className="h-4 w-4 text-slate-500 shrink-0" aria-hidden="true" />
              <span>Logout</span>
            </button>
          </div>
        </header>

        {/* Main Viewport */}
        <main className="flex-1">
          <div className="mx-auto max-w-7xl p-4 sm:p-6 lg:p-8">{children}</div>
        </main>
      </div>
    </div>
  );
}
