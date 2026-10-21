import React, { useState, useRef, useEffect } from 'react';
import { NavLink, Outlet, Link } from 'react-router-dom';
import {
  Calendar,
  Layers,
  RotateCcw,
  BarChart3,
  Settings,
  Flame,
  Cloud,
  CloudOff,
  RefreshCw,
  HardDrive,
  LogOut,
  User as UserIcon,
  AlertCircle,
} from 'lucide-react';
import { SairaBrand } from '@/components/SairaLogo';
import { useSheetStore } from '@/stores/useSheetStore';
import { useAuthStore } from '@/stores/useAuthStore';
import { calculateStreak } from '@/lib/stats/streak';
import { InstallButton } from '@/components/pwa/InstallButton';
import { OfflineBanner } from '@/components/pwa/OfflineBanner';
import { UpdatePrompt } from '@/components/pwa/UpdatePrompt';
import { useScheduler } from '@/lib/useScheduler';
import { CoachOverlay } from '@/components/coach/CoachOverlay';
import { NotificationPromptDialog } from '@/components/coach/NotificationPromptDialog';
import { WeeklyReviewDialog } from '@/components/weekly-review/WeeklyReviewDialog';
import { getDayOfWeekInTz } from '@/lib/schedule';
import { getDayKey, getIsoWeekKey, DEFAULT_TIMEZONE } from '@/lib/time';
import { loadLocalWeeklyReviews } from '@/lib/weeklyReviewStorage';

const navItems = [
  { to: '/today', label: 'Today', icon: Calendar },
  { to: '/sheet', label: 'Sheet', icon: Layers },
  { to: '/revision', label: 'Revision', icon: RotateCcw },
  { to: '/progress', label: 'Progress', icon: BarChart3 },
  { to: '/settings', label: 'Settings', icon: Settings },
];

export const AppShell: React.FC = () => {
  const syncStatus = useSheetStore((s) => s.syncStatus);
  const syncError = useSheetStore((s) => s.syncError);
  const retrySync = useSheetStore((s) => s.retrySync);
  const initialize = useSheetStore((s) => s.initialize);
  const dayLogs = useSheetStore((s) => s.dayLogs);
  const streak = calculateStreak(dayLogs);
  const { user, signOutUser } = useAuthStore();
  const [profileOpen, setProfileOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Scheduler hook for coach reminders and notifications
  const {
    overlayOpen,
    activeSlot,
    activeCategory,
    closeOverlay,
    promptOpen,
    closePrompt,
  } = useScheduler();

  // Initialize store from local storage / Firestore once on app startup, whichever page opens first
  useEffect(() => {
    initialize();
  }, [initialize]);

  const [weeklyReviewOpen, setWeeklyReviewOpen] = useState(false);
  const isLoaded = useSheetStore((s) => s.isLoaded);

  // Sunday weekly review prompt: opens on Sundays if not already completed or dismissed this session
  useEffect(() => {
    if (!isLoaded) return;
    const now = new Date();
    const dayOfWeek = getDayOfWeekInTz(now, DEFAULT_TIMEZONE);
    if (dayOfWeek === 0) {
      const todayKey = getDayKey(now, DEFAULT_TIMEZONE);
      const isoWeek = getIsoWeekKey(todayKey);
      const dismissedKey = `saira:sunday_review_dismissed:${isoWeek}`;
      if (sessionStorage.getItem(dismissedKey) !== 'true') {
        const reviews = loadLocalWeeklyReviews();
        if (!reviews[isoWeek]) {
          const timer = setTimeout(() => {
            setWeeklyReviewOpen(true);
          }, 1500);
          return () => clearTimeout(timer);
        }
      }
    }
  }, [isLoaded]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setProfileOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const renderSyncBadge = () => {
    switch (syncStatus) {
      case 'synced':
        return (
          <div
            title="Cloud synced via Firestore"
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-emerald-500/30 bg-emerald-500/10 text-[11px] font-mono text-emerald-400"
          >
            <Cloud className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Synced</span>
          </div>
        );
      case 'syncing':
        return (
          <div
            title="Syncing changes with cloud..."
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-primary/40 bg-primary/10 text-[11px] font-mono text-primary animate-pulse"
          >
            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
            <span className="hidden sm:inline">Syncing</span>
          </div>
        );
      case 'error':
        return (
          <button
            type="button"
            onClick={() => retrySync()}
            title={`Sync failed: ${syncError || 'Permission or network error'}. Click to retry.`}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-rose-500/40 bg-rose-500/10 text-[11px] font-mono text-rose-400 hover:bg-rose-500/20 hover:border-rose-500/60 transition-colors cursor-pointer"
          >
            <AlertCircle className="w-3.5 h-3.5 text-rose-400 animate-pulse" />
            <span className="hidden sm:inline">Sync failed, will retry</span>
          </button>
        );
      case 'offline':
        return (
          <div
            title="Offline mode. Changes saved locally in IndexedDB and will sync when reconnected."
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-amber-500/30 bg-amber-500/10 text-[11px] font-mono text-amber-400"
          >
            <CloudOff className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Offline</span>
          </div>
        );
      case 'local_only':
      default:
        return (
          <Link
            to="/login"
            title="Local Mode. Click to sign in and enable multi-device sync."
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-border bg-surface-2/40 text-[11px] font-mono text-muted-foreground hover:text-foreground hover:border-primary/40 transition-colors"
          >
            <HardDrive className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Local</span>
          </Link>
        );
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      {/* Offline Mode Indicator Banner */}
      <OfflineBanner />

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

          {/* Right Action Icons: Install Button + Sync Pill + Streak Flame + User Profile */}
          <div className="flex items-center gap-2.5 sm:gap-3">
            <InstallButton variant="topbar" />

            {renderSyncBadge()}

            <Link
              to="/today"
              title={`Current streak: ${streak.currentStreak} day${streak.currentStreak === 1 ? '' : 's'}. Longest streak: ${streak.longestStreak} days.`}
              className="flex items-center gap-1.5 px-3 py-1 rounded-full border border-border bg-surface-2/40 text-xs font-mono font-medium text-warning hover:border-warning/40 transition-colors"
            >
              <Flame className="w-3.5 h-3.5 fill-warning" />
              <span>{streak.currentStreak}</span>
            </Link>

            {/* User Profile Menu */}
            <div className="relative" ref={dropdownRef}>
              {user ? (
                <button
                  type="button"
                  onClick={() => setProfileOpen(!profileOpen)}
                  className="w-7 h-7 rounded-full bg-gradient-to-tr from-[#8B3DFF] to-[#FF2E7E] p-[1.5px] cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary/40"
                  aria-label="User account menu"
                >
                  {user.photoURL ? (
                    <img
                      src={user.photoURL}
                      alt={user.displayName || 'User'}
                      className="w-full h-full rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full rounded-full bg-surface flex items-center justify-center text-[10px] font-bold text-foreground">
                      {user.displayName ? user.displayName.charAt(0).toUpperCase() : 'U'}
                    </div>
                  )}
                </button>
              ) : (
                <Link
                  to="/login"
                  className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 hover:bg-primary/20 text-primary border border-primary/30 text-xs font-medium transition-colors"
                >
                  <UserIcon className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Sign In</span>
                </Link>
              )}

              {/* Profile Popover */}
              {profileOpen && user && (
                <div className="absolute right-0 mt-2 w-64 bg-surface border border-border rounded-xl shadow-2xl p-4 z-50 animate-in fade-in zoom-in-95 duration-150">
                  <div className="flex items-center gap-3 pb-3 border-b border-border mb-3">
                    {user.photoURL ? (
                      <img
                        src={user.photoURL}
                        alt={user.displayName || 'User'}
                        className="w-10 h-10 rounded-full object-cover border border-border"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-surface-2 flex items-center justify-center text-sm font-bold text-foreground border border-border">
                        {user.displayName ? user.displayName.charAt(0).toUpperCase() : 'U'}
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold truncate text-foreground">
                        {user.displayName || 'Learner'}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                    </div>
                  </div>

                  <div className="text-[11px] text-muted-foreground mb-3 flex items-center justify-between">
                    <span>Cloud Sync</span>
                    <span className={`capitalize font-mono text-xs font-medium ${syncStatus === 'error' ? 'text-rose-400' : 'text-foreground'}`}>
                      {syncStatus === 'error' ? 'Failed (Will Retry)' : syncStatus.replace('_', ' ')}
                    </span>
                  </div>

                  {syncStatus === 'error' && (
                    <div className="mb-3 p-2.5 rounded-lg bg-rose-500/10 border border-rose-500/30 text-[11px] text-rose-300">
                      <div className="flex items-center gap-1.5 font-semibold text-rose-400 mb-1">
                        <AlertCircle className="w-3.5 h-3.5" />
                        <span>Cloud Writes Rejected</span>
                      </div>
                      <p className="line-clamp-2 text-[10px] text-rose-200/80 mb-2 font-mono">
                        {syncError || 'Permission denied. Deploy firestore.rules to Firebase.'}
                      </p>
                      <button
                        type="button"
                        onClick={() => retrySync()}
                        className="w-full py-1.5 px-2 rounded-md bg-rose-500/20 hover:bg-rose-500/30 text-rose-200 font-medium text-xs transition-colors cursor-pointer"
                      >
                        Retry Cloud Sync
                      </button>
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={async () => {
                      setProfileOpen(false);
                      await signOutUser();
                    }}
                    className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-medium text-destructive hover:bg-destructive/10 border border-destructive/20 transition-colors cursor-pointer"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Sign Out</span>
                  </button>
                </div>
              )}
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
      {/* PWA Update Ready Toast */}
      <UpdatePrompt />

      {/* In-App Coach Reminder Overlay */}
      <CoachOverlay
        isOpen={overlayOpen}
        slot={activeSlot}
        lineCategory={activeCategory}
        onClose={closeOverlay}
      />

      {/* Polite Notification Permission Dialog (after 1st completed item) */}
      <NotificationPromptDialog
        isOpen={promptOpen}
        onClose={closePrompt}
      />

      {/* Sunday Weekly Review Dialog */}
      <WeeklyReviewDialog
        isOpen={weeklyReviewOpen}
        onClose={() => setWeeklyReviewOpen(false)}
      />
    </div>
  );
};
