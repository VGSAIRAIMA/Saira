import React from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import {
  Calendar,
  Layers,
  RotateCcw,
  BarChart3,
  Settings,
  Flame,
} from 'lucide-react';
import { SairaBrand } from '@/components/SairaLogo';

const navItems = [
  { to: '/today', label: 'Today', icon: Calendar },
  { to: '/sheet', label: 'Sheet', icon: Layers },
  { to: '/revision', label: 'Revision', icon: RotateCcw },
  { to: '/progress', label: 'Progress', icon: BarChart3 },
  { to: '/settings', label: 'Settings', icon: Settings },
];

export const AppShell: React.FC = () => {
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      {/* Sticky Top Bar */}
      <header className="sticky top-0 z-40 bg-surface/90 backdrop-blur-md border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-8">
            <NavLink to="/today" className="hover:opacity-90 transition-opacity">
              <SairaBrand size={28} />
            </NavLink>

            {/* Desktop Navigation Tabs */}
            <nav className="hidden md:flex items-center gap-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                return (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    className={({ isActive }) =>
                      `flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                        isActive
                          ? 'bg-surface-2 text-foreground font-semibold shadow-xs'
                          : 'text-muted-foreground hover:text-foreground hover:bg-surface-2/60'
                      }`
                    }
                  >
                    <Icon className="w-3.5 h-3.5" />
                    <span>{item.label}</span>
                  </NavLink>
                );
              })}
            </nav>
          </div>

          {/* Right Action Icons: Streak Flame + Avatar */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full border border-border bg-surface-2/40 text-xs font-mono font-medium text-warning">
              <Flame className="w-3.5 h-3.5 fill-warning" />
              <span>0</span>
            </div>

            <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-[#8B3DFF] to-[#FF2E7E] p-[1.5px] cursor-pointer">
              <div className="w-full h-full rounded-full bg-surface flex items-center justify-center text-[10px] font-bold text-foreground">
                R
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 py-6 pb-20 md:pb-8">
        <Outlet />
      </main>

      {/* Mobile Bottom Navigation Bar */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-surface/95 backdrop-blur-md border-t border-border flex justify-around items-center px-2 py-1.5">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `flex flex-col items-center gap-1 py-1 px-3 rounded-lg text-[10px] transition-colors ${
                  isActive ? 'text-primary font-medium' : 'text-muted-foreground'
                }`
              }
            >
              <Icon className="w-4 h-4" />
              <span>{item.label}</span>
            </NavLink>
          );
        })}
      </nav>
    </div>
  );
};
