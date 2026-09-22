import React, { useState, useRef, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { useTheme } from '../../context/ThemeContext';
import { Logo } from './Logo';
import { NotificationCenter } from './NotificationCenter';
import {
  Search,
  Plus,
  Play,
  Pause,
  Square,
  Moon,
  Sun,
  Bell,
  Sparkles,
  User,
  LogOut,
  FolderKanban,
  CheckSquare,
  Users,
  FileText,
  Clock,
  Menu,
  Palette,
  Check,
} from 'lucide-react';

interface NavbarProps {
  onToggleMobileSidebar: () => void;
  onOpenAuthModal: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  onToggleMobileSidebar,
  onOpenAuthModal,
}) => {
  const {
    user,
    isAuthenticated,
    logout,
    confirmAction,
    activeTimer,
    pauseTimer,
    resumeTimer,
    stopTimer,
    projects,
    unreadNotificationsCount,
    setIsCommandPaletteOpen,
    setIsAiModalOpen,
    setIsTaskModalOpen,
    setIsProjectModalOpen,
    setIsClientModalOpen,
    setIsInvoiceModalOpen,
    setIsTimeLogModalOpen,
    setSelectedTaskForEdit,
    setSelectedProjectForEdit,
    setSelectedClientForEdit,
    setSelectedInvoiceForEdit,
  } = useApp();

  const { theme, actualTheme, toggleTheme, accentColor, setAccentColor } = useTheme();

  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isQuickAddOpen, setIsQuickAddOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isAccentMenuOpen, setIsAccentMenuOpen] = useState(false);
  const [currentTime, setCurrentTime] = useState<Date>(new Date());

  const quickAddRef = useRef<HTMLDivElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const accentMenuRef = useRef<HTMLDivElement>(null);

  // Live real-time ticking clock
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (quickAddRef.current && !quickAddRef.current.contains(event.target as Node)) {
        setIsQuickAddOpen(false);
      }
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setIsUserMenuOpen(false);
      }
      if (accentMenuRef.current && !accentMenuRef.current.contains(event.target as Node)) {
        setIsAccentMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const formatTimer = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs
      .toString()
      .padStart(2, '0')}`;
  };

  const timerProject = projects.find(p => p.id === activeTimer.projectId);

  const formattedLiveTime = currentTime.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true,
  });

  const formattedLiveDate = currentTime.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });

  return (
    <header className="sticky top-0 z-30 w-full h-16 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800/80 px-2.5 sm:px-4 md:px-6 flex items-center justify-between transition-colors shadow-sm shrink-0 min-w-0">
      {/* Left: Mobile Menu & Logo */}
      <div className="flex items-center gap-1.5 sm:gap-3 min-w-0 shrink-0">
        <button
          onClick={onToggleMobileSidebar}
          className="lg:hidden p-1.5 sm:p-2 text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-100 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer shrink-0"
          aria-label="Toggle menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        <Logo size="md" />

        {/* Global Search Omni Bar Trigger (Ctrl+K) */}
        <button
          onClick={() => setIsCommandPaletteOpen(true)}
          className="hidden md:flex items-center gap-2.5 px-3 py-1.5 ml-4 text-xs font-medium text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800/80 hover:bg-slate-200/70 dark:hover:bg-slate-800 rounded-xl border border-slate-200/60 dark:border-slate-700/60 transition-all group cursor-pointer"
        >
          <span>Search or jump to...</span>
          <div className="flex items-center gap-1.5 ml-1">
            <kbd className="text-[10px] font-mono bg-white dark:bg-slate-900 px-1.5 py-0.5 rounded text-slate-500 border border-slate-200 dark:border-slate-700">
              Ctrl K
            </kbd>
            <Search className="w-3.5 h-3.5 text-slate-400 group-hover:text-emerald-600 transition-colors" />
          </div>
        </button>
      </div>

      {/* Middle: Live Clock & Active Stopwatch Widget */}
      <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
        {/* Live Real-Time Clock Display */}
        <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-100/80 dark:bg-slate-800/80 border border-slate-200/70 dark:border-slate-700/70 text-slate-700 dark:text-slate-300">
          <span className="w-2 h-2 rounded-full bg-whatsapp-light animate-pulse" />
          <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
            {formattedLiveDate}
          </span>
          <span className="text-xs font-mono font-bold text-slate-900 dark:text-white">
            {formattedLiveTime}
          </span>
        </div>

        {/* Active Timer Pill */}
        {activeTimer.elapsedSeconds > 0 || activeTimer.isRunning ? (
          <div className="flex items-center gap-1.5 sm:gap-2 px-2 sm:px-3 py-1 sm:py-1.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 shadow-sm animate-pulse-subtle">
            <span className="relative flex h-2 sm:h-2.5 w-2 sm:w-2.5">
              {activeTimer.isRunning && (
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-whatsapp-light opacity-75" />
              )}
              <span
                className={`relative inline-flex rounded-full h-2 sm:h-2.5 w-2 sm:w-2.5 ${
                  activeTimer.isRunning ? 'bg-whatsapp-light' : 'bg-amber-500'
                }`}
              />
            </span>

            <div className="hidden xl:flex flex-col text-left">
              <span className="text-[11px] font-bold text-slate-800 dark:text-slate-200 truncate max-w-[120px]">
                {timerProject ? timerProject.title : 'Active Timer'}
              </span>
            </div>

            <span className="font-mono font-bold text-xs sm:text-sm text-emerald-800 dark:text-emerald-300">
              {formatTimer(activeTimer.elapsedSeconds)}
            </span>

            <div className="flex items-center gap-1 ml-0.5 sm:ml-1">
              {activeTimer.isRunning ? (
                <button
                  onClick={pauseTimer}
                  title="Pause Timer"
                  className="p-1 rounded-full text-slate-600 dark:text-slate-300 hover:bg-emerald-200 dark:hover:bg-emerald-900 transition-colors cursor-pointer"
                >
                  <Pause className="w-3.5 h-3.5" />
                </button>
              ) : (
                <button
                  onClick={resumeTimer}
                  title="Resume Timer"
                  className="p-1 rounded-full text-slate-600 dark:text-slate-300 hover:bg-emerald-200 dark:hover:bg-emerald-900 transition-colors cursor-pointer"
                >
                  <Play className="w-3.5 h-3.5" />
                </button>
              )}

              <button
                onClick={stopTimer}
                title="Stop & Log Time to Project"
                className="p-1 rounded-full text-rose-600 hover:bg-rose-100 dark:hover:bg-rose-950/80 transition-colors cursor-pointer"
              >
                <Square className="w-3.5 h-3.5 fill-rose-600" />
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setIsTimeLogModalOpen(true)}
            className="hidden xl:flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors border border-transparent hover:border-slate-200 dark:border-slate-700 cursor-pointer"
          >
            <Clock className="w-3.5 h-3.5 text-emerald-600" />
            <span>Track Time</span>
          </button>
        )}
      </div>

      {/* Right: Quick Add, AI Copilot, Notifications, Theme, User */}
      <div className="flex items-center gap-1 sm:gap-1.5 md:gap-2 shrink-0">
        {/* Quick Add Button in WhatsApp Teal */}
        <div className="relative" ref={quickAddRef}>
          <button
            onClick={() => setIsQuickAddOpen(!isQuickAddOpen)}
            className="flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3.5 py-1.5 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-emerald-600 via-teal-600 to-whatsapp-teal hover:from-emerald-700 hover:to-whatsapp-dark shadow-md shadow-emerald-700/20 active:scale-95 transition-all cursor-pointer"
            title="Quick Add"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden md:inline">Quick Add</span>
          </button>

          {isQuickAddOpen && (
            <div className="absolute right-0 top-11 w-48 bg-white dark:bg-slate-900 rounded-xl shadow-xl border border-slate-200 dark:border-slate-800 p-1.5 z-50 animate-slide-up">
              <button
                onClick={() => {
                  setSelectedTaskForEdit(null);
                  setIsTaskModalOpen(true);
                  setIsQuickAddOpen(false);
                }}
                className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-emerald-50 dark:hover:bg-emerald-950/60 hover:text-emerald-700 dark:hover:text-emerald-300 rounded-lg transition-colors text-left cursor-pointer"
              >
                <CheckSquare className="w-4 h-4 text-emerald-600" />
                <span>New Task</span>
              </button>
              <button
                onClick={() => {
                  setSelectedProjectForEdit(null);
                  setIsProjectModalOpen(true);
                  setIsQuickAddOpen(false);
                }}
                className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-emerald-50 dark:hover:bg-emerald-950/60 hover:text-emerald-700 dark:hover:text-emerald-300 rounded-lg transition-colors text-left cursor-pointer"
              >
                <FolderKanban className="w-4 h-4 text-teal-600" />
                <span>New Project</span>
              </button>
              <button
                onClick={() => {
                  setSelectedClientForEdit(null);
                  setIsClientModalOpen(true);
                  setIsQuickAddOpen(false);
                }}
                className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-emerald-50 dark:hover:bg-emerald-950/60 hover:text-emerald-700 dark:hover:text-emerald-300 rounded-lg transition-colors text-left cursor-pointer"
              >
                <Users className="w-4 h-4 text-emerald-600" />
                <span>New Client</span>
              </button>
              <button
                onClick={() => {
                  setSelectedInvoiceForEdit(null);
                  setIsInvoiceModalOpen(true);
                  setIsQuickAddOpen(false);
                }}
                className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-emerald-50 dark:hover:bg-emerald-950/60 hover:text-emerald-700 dark:hover:text-emerald-300 rounded-lg transition-colors text-left cursor-pointer"
              >
                <FileText className="w-4 h-4 text-amber-500" />
                <span>New Invoice</span>
              </button>
            </div>
          )}
        </div>

        {/* App Guide & AI Button */}
        <button
          onClick={() => setIsAiModalOpen(true)}
          title="Me Plus App Guide & External AI"
          className="flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1.5 rounded-xl text-xs font-bold text-emerald-800 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 transition-colors cursor-pointer"
        >
          <Sparkles className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 animate-pulse" />
          <span className="hidden md:inline">App Guide &amp; AI</span>
        </button>

        {/* Quick Accent Color Palette Switcher */}
        <div className="relative" ref={accentMenuRef}>
          <button
            onClick={() => setIsAccentMenuOpen(!isAccentMenuOpen)}
            title="Change Theme Accent Color"
            className="p-1.5 sm:p-2 text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-100 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer relative"
          >
            <Palette className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span className="absolute bottom-1 right-1 w-2 h-2 rounded-full bg-emerald-500 ring-1 ring-white dark:ring-slate-900" />
          </button>

          {isAccentMenuOpen && (
            <div className="absolute right-0 top-11 w-44 bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 p-2 z-50 animate-slide-up">
              <div className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider px-2 py-1 mb-1">
                Theme Color
              </div>
              <div className="space-y-1">
                {[
                  { id: 'emerald' as const, name: 'Emerald Green', bg: 'bg-[#10b981]' },
                  { id: 'rose' as const, name: 'Rose Pink', bg: 'bg-[#f43f5e]' },
                  { id: 'blue' as const, name: 'Ocean Blue', bg: 'bg-[#3b82f6]' },
                  { id: 'purple' as const, name: 'Royal Purple', bg: 'bg-[#8b5cf6]' },
                  { id: 'amber' as const, name: 'Sunset Amber', bg: 'bg-[#f59e0b]' },
                ].map(c => (
                  <button
                    key={c.id}
                    onClick={() => {
                      setAccentColor(c.id);
                      setIsAccentMenuOpen(false);
                    }}
                    className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-xl text-xs font-semibold transition-colors cursor-pointer ${
                      accentColor === c.id
                        ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 font-bold'
                        : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className={`w-3.5 h-3.5 rounded-full ${c.bg} shadow-2xs`} />
                      <span>{c.name}</span>
                    </div>
                    {accentColor === c.id && (
                      <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Theme Toggle Button */}
        <button
          onClick={toggleTheme}
          title={`Switch to ${actualTheme === 'dark' ? 'Light' : 'Dark'} mode`}
          className="p-1.5 sm:p-2 text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-100 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
        >
          {actualTheme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4" />}
        </button>

        {/* Notification Bell with Badge */}
        <div className="relative">
          <button
            onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
            title="Notifications & Deadline Alerts"
            className="p-1.5 sm:p-2 text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-100 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors relative cursor-pointer"
          >
            <Bell className="w-4 h-4" />
            {unreadNotificationsCount > 0 && (
              <span className="absolute top-0.5 right-0.5 sm:top-1 sm:right-1 w-4 h-4 bg-rose-500 text-white font-black text-[9px] rounded-full flex items-center justify-center border-2 border-white dark:border-slate-900">
                {unreadNotificationsCount}
              </span>
            )}
          </button>

          <NotificationCenter
            isOpen={isNotificationsOpen}
            onClose={() => setIsNotificationsOpen(false)}
          />
        </div>

        {/* User Profile Avatar / Sign Out */}
        {isAuthenticated && user ? (
          <div className="relative ml-1" ref={userMenuRef}>
            <button
              onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
              className="flex items-center gap-2 p-1 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <img
                src={user.avatar}
                alt={user.name}
                className="w-8 h-8 rounded-xl object-cover ring-2 ring-emerald-500/40"
              />
            </button>

            {isUserMenuOpen && (
              <div className="absolute right-0 top-12 w-60 bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 p-2 z-50 animate-slide-up">
                <div className="px-3 py-2 border-b border-slate-100 dark:border-slate-800/80 mb-1">
                  <p className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate">
                    {user.name}
                  </p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                    {user.email}
                  </p>
                  <p className="text-[10px] text-slate-400 truncate mt-0.5">
                    {user.title}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setIsUserMenuOpen(false);
                    confirmAction({
                      title: 'Sign Out of Me Plus?',
                      message: 'Are you sure you want to log out? Any running timers will be stopped and your current workspace changes are safely saved.',
                      confirmText: 'Yes, Sign Out',
                      cancelText: 'Stay Logged In',
                      danger: true,
                      itemType: 'logout',
                      onConfirm: () => {
                        logout();
                      },
                    });
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50 rounded-lg transition-colors text-left cursor-pointer"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Sign Out</span>
                </button>
              </div>
            )}
          </div>
        ) : (
          <button
            onClick={onOpenAuthModal}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 hover:bg-emerald-100 rounded-xl transition-all cursor-pointer"
          >
            <User className="w-3.5 h-3.5" />
            <span>Sign In</span>
          </button>
        )}
      </div>
    </header>
  );
};
