import React, { useState } from 'react';
import { NavLink, Outlet, useLocation, useParams } from 'react-router-dom';
import {
  LayoutDashboard,
  BarChart3,
  Calendar,
  Users,
  Wrench,
  Radio,
  Menu,
  X,
  ChevronRight,
  ShieldCheck
} from 'lucide-react';
import { useLiveBookingUpdates } from '../../hooks/useLiveBookingUpdates';

interface NavItem {
  name: string;
  path: string;
  icon: React.ComponentType<{ className?: string }>;
}

const NAV_ITEMS: NavItem[] = [
  { name: 'Overview', path: '/', icon: LayoutDashboard },
  { name: 'Analytics', path: '/analytics', icon: BarChart3 },
  { name: 'Bookings', path: '/bookings', icon: Calendar },
  { name: 'Mechanics', path: '/mechanics', icon: Users }
];

export const DashboardLayout: React.FC = () => {
  const location = useLocation();
  const params = useParams();
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const { isConnected } = useLiveBookingUpdates();

  // Dynamic page title based on current route
  const getPageTitle = (): { title: string; subtitle: string } => {
    const path = location.pathname;
    if (path === '/') {
      return { title: 'Operations Overview', subtitle: 'Live garage operations, dispatches & revenue metrics' };
    }
    if (path === '/analytics') {
      return { title: 'Operational Analytics', subtitle: 'Service volume breakdown, revenue trends & fleet efficiency' };
    }
    if (path === '/bookings') {
      return { title: 'Service Bookings', subtitle: 'Manage, search, and advance customer booking status' };
    }
    if (path.startsWith('/bookings/')) {
      return { title: `Booking Details ${params.id ? `#${params.id}` : ''}`, subtitle: 'Full service audit trail, vehicle snapshot & mechanic assignment' };
    }
    if (path === '/mechanics') {
      return { title: 'Mechanic Fleet Roster', subtitle: 'Field specialist availability, specialties, and job history' };
    }
    if (path.startsWith('/mechanics/')) {
      return { title: 'Mechanic Profile', subtitle: 'Technician ratings, skills, and related historical bookings' };
    }
    return { title: 'Instant Mechanic Dashboard', subtitle: 'Real-time vehicle operations' };
  };

  const { title, subtitle } = getPageTitle();

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans antialiased selection:bg-cyan-500 selection:text-white">
      {/* ── Desktop Fixed Left Sidebar (hidden below md breakpoint) ── */}
      <aside className="hidden md:flex fixed top-0 left-0 bottom-0 w-64 flex-col bg-slate-900/70 backdrop-blur-xl border-r border-slate-800 z-30">
        {/* Brand Header */}
        <div className="h-16 px-6 flex items-center space-x-3 border-b border-slate-800/80">
          <div className="h-9 w-9 rounded-xl bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/20 shrink-0">
            <Wrench className="h-4 w-4 text-white" />
          </div>
          <div className="overflow-hidden">
            <div className="flex items-center space-x-2">
              <span className="font-extrabold text-sm tracking-tight text-white truncate">Instant Mechanic</span>
              <span className="text-[9px] uppercase font-black px-1.5 py-0.5 rounded bg-cyan-500/15 text-cyan-400 border border-cyan-500/30">
                LIVE
              </span>
            </div>
            <p className="text-[10px] text-slate-400 truncate">Ops & Dispatch Center</p>
          </div>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          <div className="px-3 pb-2 text-[10px] font-bold uppercase tracking-wider text-slate-500">
            Navigation
          </div>
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive =
              item.path === '/'
                ? location.pathname === '/'
                : location.pathname.startsWith(item.path);

            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={`flex items-center space-x-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all duration-200 ${
                  isActive
                    ? 'bg-gradient-to-r from-cyan-500/20 to-blue-500/10 text-cyan-400 border border-cyan-500/30 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                }`}
              >
                <Icon className={`h-4 w-4 ${isActive ? 'text-cyan-400' : 'text-slate-400'}`} />
                <span>{item.name}</span>
                {isActive && <ChevronRight className="h-3 w-3 ml-auto opacity-70" />}
              </NavLink>
            );
          })}
        </nav>

        {/* Sidebar Footer Badge */}
        <div className="p-4 border-t border-slate-800/80">
          <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 text-[11px] text-slate-400 space-y-1">
            <div className="flex items-center space-x-1.5 text-cyan-400 font-semibold">
              <ShieldCheck className="h-3.5 w-3.5" />
              <span>Real-Time Active</span>
            </div>
            <p className="text-[10px] leading-relaxed text-slate-400">
              Live updates sync automatically with zero manual page reloads.
            </p>
          </div>
        </div>
      </aside>

      {/* ── Mobile Navigation Drawer (Overlay on screens < md) ── */}
      {mobileDrawerOpen && (
        <div
          className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm md:hidden"
          onClick={() => setMobileDrawerOpen(false)}
        >
          <div
            className="w-64 h-full bg-slate-900 border-r border-slate-800 p-4 flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div className="flex items-center space-x-2">
                <div className="h-8 w-8 rounded-lg bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center">
                  <Wrench className="h-4 w-4 text-white" />
                </div>
                <span className="font-bold text-sm text-white">Instant Mechanic</span>
              </div>
              <button
                onClick={() => setMobileDrawerOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <nav className="flex-1 py-4 space-y-1">
              {NAV_ITEMS.map((item) => {
                const Icon = item.icon;
                const isActive =
                  item.path === '/'
                    ? location.pathname === '/'
                    : location.pathname.startsWith(item.path);

                return (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    onClick={() => setMobileDrawerOpen(false)}
                    className={`flex items-center space-x-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition ${
                      isActive
                        ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    <span>{item.name}</span>
                  </NavLink>
                );
              })}
            </nav>
          </div>
        </div>
      )}

      {/* ── Topbar (Positioned next to desktop sidebar or full-width on mobile) ── */}
      <header className="sticky top-0 z-20 md:ml-64 h-16 bg-slate-950/85 backdrop-blur-md border-b border-slate-800 px-4 md:px-8 flex items-center justify-between">
        {/* Left: Mobile hamburger trigger & Page Title */}
        <div className="flex items-center space-x-3">
          <button
            onClick={() => setMobileDrawerOpen(true)}
            className="md:hidden p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white"
            aria-label="Open navigation drawer"
          >
            <Menu className="h-5 w-5" />
          </button>

          <div>
            <h1 className="text-base md:text-lg font-extrabold text-white tracking-tight leading-tight">
              {title}
            </h1>
            <p className="hidden sm:block text-[11px] text-slate-400 leading-none">
              {subtitle}
            </p>
          </div>
        </div>

        {/* Right: Real-time Socket status indicator */}
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-2 px-3 py-1.5 rounded-full bg-slate-900/90 border border-slate-800 text-xs">
            <span
              className={`h-2.5 w-2.5 rounded-full transition-all ${
                isConnected ? 'bg-emerald-500 shadow-[0_0_10px_#10b981]' : 'bg-rose-500 animate-pulse'
              }`}
            />
            <Radio className="h-3.5 w-3.5 text-slate-400" />
            <span className={isConnected ? 'text-emerald-400 font-semibold' : 'text-rose-400 font-medium'}>
              {isConnected ? 'Socket Live' : 'Offline'}
            </span>
          </div>
        </div>
      </header>

      {/* ── Main Scrollable Content Area ── */}
      <main className="flex-1 md:ml-64 p-4 md:p-8 pb-20 md:pb-8">
        <Outlet />
      </main>

      {/* ── Mobile Bottom Navigation Bar (Visible only on screens < md) ── */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-slate-900/95 backdrop-blur-lg border-t border-slate-800 z-30 flex items-center justify-around px-2">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive =
            item.path === '/'
              ? location.pathname === '/'
              : location.pathname.startsWith(item.path);

          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={`flex flex-col items-center justify-center flex-1 py-1 text-[10px] font-medium transition ${
                isActive ? 'text-cyan-400 font-bold' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Icon className={`h-5 w-5 mb-0.5 ${isActive ? 'text-cyan-400' : 'text-slate-400'}`} />
              <span>{item.name}</span>
            </NavLink>
          );
        })}
      </nav>
    </div>
  );
};

export default DashboardLayout;
