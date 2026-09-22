import React from 'react';
import { useApp } from '../../context/AppContext';
import { useTheme, SidebarTheme } from '../../context/ThemeContext';
import {
  LayoutDashboard,
  Users,
  FolderKanban,
  CheckSquare,
  Clock,
  FileText,
  Settings,
  Sparkles,
  ChevronRight,
  X,
} from 'lucide-react';
import { Logo } from './Logo';

interface SidebarProps {
  isMobileOpen: boolean;
  onCloseMobile: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isMobileOpen, onCloseMobile }) => {
  const {
    activeTab,
    setActiveTab,
    clients,
    projects,
    tasks,
    invoices,
    setIsAiModalOpen,
  } = useApp();

  const { actualTheme, sidebarTheme, setSidebarTheme } = useTheme();
  const isDark = actualTheme === 'dark';

  // Dynamic classes based on theme & sidebar style
  const getSidebarContainerClass = () => {
    if (isDark) {
      return 'bg-slate-900/95 border-r border-slate-800/80 text-slate-100 shadow-sm';
    }

    switch (sidebarTheme) {
      case 'sage':
        return 'bg-[#d4ede1] border-r border-emerald-300 text-slate-900 shadow-[2px_0_12px_-2px_rgba(16,185,129,0.15)]';
      case 'dark':
        return 'bg-slate-900 border-r border-slate-800 text-slate-100 shadow-xl';
      case 'white':
        return 'bg-white/95 border-r border-slate-200/80 text-slate-900 shadow-sm';
      case 'slate':
      default:
        return 'bg-[#dce5ee] border-r border-slate-300 text-slate-900 shadow-[2px_0_10px_-2px_rgba(0,0,0,0.06)]';
    }
  };

  const getInactiveNavClass = () => {
    if (isDark) {
      return 'text-slate-300 hover:bg-slate-800/70 hover:text-white border border-transparent';
    }

    switch (sidebarTheme) {
      case 'sage':
        return 'text-emerald-950 hover:bg-white/90 hover:text-emerald-900 hover:shadow-2xs border border-transparent hover:border-emerald-300/70';
      case 'dark':
        return 'text-slate-300 hover:bg-slate-800 hover:text-white border border-transparent';
      case 'white':
        return 'text-slate-600 hover:bg-emerald-50/70 hover:text-emerald-800 border border-transparent';
      case 'slate':
      default:
        return 'text-slate-700 hover:bg-white/90 hover:text-slate-900 hover:shadow-2xs border border-transparent hover:border-slate-300/80';
    }
  };

  const getSectionHeaderClass = () => {
    if (isDark || sidebarTheme === 'dark') return 'text-slate-400';
    if (sidebarTheme === 'sage') return 'text-emerald-800';
    if (sidebarTheme === 'slate') return 'text-slate-600';
    return 'text-slate-500';
  };

  const getAiCardClass = () => {
    if (isDark) {
      return 'bg-gradient-to-r from-emerald-500/10 via-teal-500/10 to-transparent border-emerald-800/40 text-slate-200 hover:border-emerald-600';
    }
    switch (sidebarTheme) {
      case 'sage':
        return 'bg-white/95 border-emerald-300 text-slate-800 shadow-2xs hover:border-emerald-500 hover:shadow-xs';
      case 'dark':
        return 'bg-slate-800/80 border-slate-700 text-slate-200 hover:border-emerald-500';
      case 'white':
        return 'bg-gradient-to-r from-emerald-500/10 via-teal-500/10 to-transparent border-emerald-200/50 text-slate-800 hover:border-emerald-400';
      case 'slate':
      default:
        return 'bg-white/95 border-slate-300 text-slate-800 shadow-2xs hover:border-emerald-400 hover:shadow-xs';
    }
  };

  const activeProjectsCount = projects.filter(p => p.status === 'in-progress').length;
  const pendingTasksCount = tasks.filter(t => t.status !== 'done').length;
  const urgentTasksCount = tasks.filter(t => t.priority === 'urgent' && t.status !== 'done').length;
  const activeClientsCount = clients.filter(c => c.status === 'active').length;

  const navItems = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: LayoutDashboard,
      badge: null,
    },
    {
      id: 'clients',
      label: 'Clients',
      icon: Users,
      badge: activeClientsCount > 0 ? activeClientsCount : null,
      badgeColor: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300',
    },
    {
      id: 'projects',
      label: 'Projects',
      icon: FolderKanban,
      badge: activeProjectsCount > 0 ? activeProjectsCount : null,
      badgeColor: 'bg-teal-100 text-teal-800 dark:bg-teal-950/80 dark:text-teal-300',
    },
    {
      id: 'tasks',
      label: 'Tasks & Views',
      icon: CheckSquare,
      badge: urgentTasksCount > 0 ? `${urgentTasksCount} urgent` : pendingTasksCount > 0 ? pendingTasksCount : null,
      badgeColor: urgentTasksCount > 0
        ? 'bg-rose-100 text-rose-700 dark:bg-rose-950/80 dark:text-rose-300 animate-pulse'
        : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300',
    },
    {
      id: 'time',
      label: 'Time Logs',
      icon: Clock,
      badge: null,
    },
    {
      id: 'invoices',
      label: 'Invoices',
      icon: FileText,
      badge: invoices.filter(i => i.status === 'sent').length > 0
        ? `${invoices.filter(i => i.status === 'sent').length} pending`
        : null,
      badgeColor: 'bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:text-amber-300',
    },
    {
      id: 'settings',
      label: 'Settings',
      icon: Settings,
      badge: null,
    },
  ];

  const handleSelectTab = (tabId: string) => {
    setActiveTab(tabId);
    onCloseMobile();
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-40 lg:hidden animate-fade-in"
          onClick={onCloseMobile}
        />
      )}

      {/* Fixed Left Sidebar Container */}
      <aside
        className={`fixed lg:sticky top-0 lg:top-0 bottom-0 left-0 z-50 lg:z-20 w-64 max-w-[85vw] h-full backdrop-blur-lg flex flex-col justify-between transition-all duration-300 ease-in-out shrink-0 select-none ${getSidebarContainerClass()} ${
          isMobileOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Mobile Close Header */}
        <div className="lg:hidden flex items-center justify-between px-4 py-3 border-b border-black/5 dark:border-white/10 shrink-0">
          <Logo size="sm" />
          <button
            onClick={onCloseMobile}
            className="p-1.5 rounded-xl text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-100 hover:bg-black/5 dark:hover:bg-white/10 cursor-pointer"
            aria-label="Close navigation"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Section (internally scrollable if needed) */}
        <div className="p-4 space-y-6 overflow-y-auto flex-1 custom-scrollbar">
          {/* Main Navigation */}
          <div>
            <div className={`text-[10px] font-extrabold uppercase tracking-wider px-3 mb-2 transition-colors ${getSectionHeaderClass()}`}>
              Workspace
            </div>
            <nav className="space-y-1">
              {navItems.map(item => {
                const isActive = activeTab === item.id;
                const Icon = item.icon;
                return (
                  <button
                    key={item.id}
                    onClick={() => handleSelectTab(item.id)}
                    className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all group ${
                      isActive
                        ? 'bg-gradient-to-r from-emerald-600 via-teal-600 to-whatsapp-teal text-white shadow-md shadow-emerald-700/20'
                        : getInactiveNavClass()
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Icon
                        className={`w-4 h-4 transition-transform group-hover:scale-110 ${
                          isActive
                            ? 'text-white'
                            : isDark || sidebarTheme === 'dark'
                            ? 'text-slate-400 group-hover:text-emerald-400'
                            : 'text-slate-500 group-hover:text-emerald-600'
                        }`}
                      />
                      <span>{item.label}</span>
                    </div>

                    {item.badge && (
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          isActive ? 'bg-white/20 text-white' : item.badgeColor
                        }`}
                      >
                        {item.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Quick AI Section */}
          <div>
            <div className={`text-[10px] font-extrabold uppercase tracking-wider px-3 mb-2 transition-colors ${getSectionHeaderClass()}`}>
              Smart Assistant
            </div>
            <div className="space-y-1.5">
              <button
                onClick={() => {
                  setIsAiModalOpen(true);
                  onCloseMobile();
                }}
                className={`w-full flex items-center justify-between p-3 rounded-xl border transition-all text-left group cursor-pointer ${getAiCardClass()}`}
              >
                <div className="flex items-center gap-2.5">
                  <div className="p-1.5 rounded-lg bg-emerald-500/20 text-emerald-700 dark:text-emerald-400">
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <div>
                    <div className={`text-xs font-bold flex items-center gap-1 ${
                      isDark || sidebarTheme === 'dark' ? 'text-white' : 'text-slate-900'
                    }`}>
                      App Guide &amp; AI
                      <span className="text-[9px] bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 px-1.5 py-0.2 rounded-full font-bold">
                        Help
                      </span>
                    </div>
                    <div className={`text-[10px] ${
                      isDark || sidebarTheme === 'dark' ? 'text-slate-400' : 'text-slate-500'
                    }`}>
                      App Help &amp; External AI
                    </div>
                  </div>
                </div>
                <ChevronRight className="w-3.5 h-3.5 text-emerald-600 group-hover:translate-x-0.5 transition-transform" />
              </button>
            </div>
          </div>
        </div>

        {/* Sidebar Color Switcher */}
        <div className={`p-3.5 border-t shrink-0 ${
          isDark || sidebarTheme === 'dark'
            ? 'border-slate-800'
            : sidebarTheme === 'sage'
            ? 'border-emerald-300/70'
            : sidebarTheme === 'slate'
            ? 'border-slate-300/80'
            : 'border-slate-200/80'
        }`}>
          {/* Real-Time Sidebar Color Customizer */}
          <div className="flex items-center justify-between px-1">
            <span className={`text-[10px] font-bold uppercase tracking-wider ${getSectionHeaderClass()}`}>
              Sidebar Style
            </span>
            <div className="flex items-center gap-1.5" role="radiogroup" aria-label="Sidebar style">
              <button
                type="button"
                onClick={() => setSidebarTheme('slate')}
                title="Cool Slate (Blue-gray tone)"
                className={`w-4 h-4 rounded-full bg-[#cbd5e1] border ${
                  sidebarTheme === 'slate'
                    ? 'ring-2 ring-emerald-500 ring-offset-1 border-slate-500 scale-110'
                    : 'border-slate-400'
                } cursor-pointer transition-all hover:scale-125`}
              />
              <button
                type="button"
                onClick={() => setSidebarTheme('sage')}
                title="Soft Sage (Sage green tone)"
                className={`w-4 h-4 rounded-full bg-[#82d6b3] border ${
                  sidebarTheme === 'sage'
                    ? 'ring-2 ring-emerald-500 ring-offset-1 border-emerald-600 scale-110'
                    : 'border-emerald-400'
                } cursor-pointer transition-all hover:scale-125`}
              />
              <button
                type="button"
                onClick={() => setSidebarTheme('dark')}
                title="Deep Slate (High contrast dark sidebar)"
                className={`w-4 h-4 rounded-full bg-slate-900 border ${
                  sidebarTheme === 'dark'
                    ? 'ring-2 ring-emerald-500 ring-offset-1 border-slate-600 scale-110'
                    : 'border-slate-700'
                } cursor-pointer transition-all hover:scale-125`}
              />
              <button
                type="button"
                onClick={() => setSidebarTheme('white')}
                title="Classic White"
                className={`w-4 h-4 rounded-full bg-white border ${
                  sidebarTheme === 'white'
                    ? 'ring-2 ring-emerald-500 ring-offset-1 border-slate-400 scale-110'
                    : 'border-slate-300'
                } cursor-pointer transition-all hover:scale-125`}
              />
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};
