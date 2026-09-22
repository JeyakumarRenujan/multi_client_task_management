import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { StatCards } from './StatCards';
import { DeadlineRadar } from './DeadlineRadar';
import { WorkloadDistribution } from './WorkloadDistribution';
import { RecentActivity } from './RecentActivity';
import {
  Sparkles,
  Plus,
  Clock,
  Calendar,
  Layers,
  ArrowRight,
  Zap,
  Sun,
  Sunrise,
  Moon,
} from 'lucide-react';

export const DashboardView: React.FC = () => {
  const {
    user,
    setIsTaskModalOpen,
    setIsProjectModalOpen,
    setIsClientModalOpen,
    setIsTimeLogModalOpen,
    setIsAiModalOpen,
    setActiveTab,
  } = useApp();

  const [currentTime, setCurrentTime] = useState<Date>(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const getGreetingData = () => {
    const hour = currentTime.getHours();
    if (hour >= 5 && hour < 12) {
      return {
        text: 'Good morning',
        icon: <Sunrise className="w-5 h-5 text-amber-300 animate-pulse-subtle" />,
      };
    }
    if (hour >= 12 && hour < 18) {
      return {
        text: 'Good afternoon',
        icon: <Sun className="w-5 h-5 text-amber-300 animate-pulse-subtle" />,
      };
    }
    return {
      text: 'Good evening',
      icon: <Moon className="w-5 h-5 text-indigo-300" />,
    };
  };

  const greeting = getGreetingData();

  const todayFormatted = currentTime.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  const timeFormatted = currentTime.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true,
  });

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Modern High-End Welcome Hero Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-950 via-[#072d24] to-slate-900 text-white p-6 sm:p-7 md:p-8 shadow-2xl border border-emerald-500/20 ring-1 ring-white/10">
        {/* Subtle geometric dot grid pattern */}
        <div className="absolute inset-0 bg-[radial-gradient(rgba(255,255,255,0.06)_1px,transparent_1px)] [background-size:20px_20px] pointer-events-none" />

        {/* Ambient background glowing orbs */}
        <div className="absolute top-0 right-0 -mt-12 -mr-12 w-80 h-80 bg-whatsapp-light/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/4 -mb-10 w-60 h-60 bg-teal-400/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-1/2 right-1/3 w-40 h-40 bg-purple-500/10 rounded-full blur-2xl pointer-events-none" />

        {/* Top edge subtle highlight glow */}
        <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-emerald-400/30 to-transparent" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            {/* Status & Live Timing Badges */}
            <div className="flex flex-wrap items-center gap-2 sm:gap-2.5 text-xs font-semibold mb-3">
              {/* Workspace Active Indicator */}
              <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-400/30 backdrop-blur-md text-emerald-300 shadow-xs">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400"></span>
                </span>
                <span className="text-[11px] font-bold tracking-wider uppercase">Workspace Active</span>
              </div>

              {/* Date Pill */}
              <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/[0.07] border border-white/10 backdrop-blur-md text-slate-200">
                <Calendar className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-xs">{todayFormatted}</span>
              </div>

              {/* Live Clock Pill */}
              <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/[0.07] border border-white/10 backdrop-blur-md text-slate-200">
                <Clock className="w-3.5 h-3.5 text-teal-400" />
                <span className="font-mono text-xs font-semibold tracking-wider">{timeFormatted}</span>
              </div>
            </div>

            {/* Greeting Headline without Rocket Icon */}
            <div className="flex items-center gap-2.5 mb-1.5">
              <div className="p-2 rounded-xl bg-white/10 backdrop-blur-md border border-white/15 shadow-inner flex items-center justify-center">
                {greeting.icon}
              </div>
              <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold tracking-tight text-white">
                {greeting.text},{' '}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-300 via-teal-200 to-whatsapp-light">
                  {user?.name ? user.name.split(' ')[0] : 'Freelancer'}
                </span>
                !
              </h1>
            </div>

            <p className="text-xs sm:text-sm text-slate-300/90 mt-1 max-w-xl leading-relaxed">
              Your client projects, pending task deadlines, and productive work sessions are unified in one centralized workspace.
            </p>
          </div>

          {/* Action CTAs */}
          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => setIsAiModalOpen(true)}
              className="relative group flex items-center gap-2 px-4 py-2.5 rounded-xl bg-purple-600/25 hover:bg-purple-600/40 border border-purple-400/30 hover:border-purple-300/60 text-purple-100 text-xs font-bold transition-all duration-200 shadow-md shadow-purple-950/30 hover:shadow-purple-500/20 backdrop-blur-md cursor-pointer hover:-translate-y-0.5 active:translate-y-0"
            >
              <Sparkles className="w-4 h-4 text-purple-300 group-hover:rotate-12 transition-transform" />
              <span>AI Copilot</span>
              <span className="hidden sm:inline-block px-1.5 py-0.5 rounded-full text-[10px] bg-purple-400/20 text-purple-200 border border-purple-300/20 font-semibold ml-0.5">
                Assistant
              </span>
            </button>

            <button
              onClick={() => setIsTaskModalOpen(true)}
              className="relative group flex items-center gap-2 px-4.5 py-2.5 rounded-xl bg-gradient-to-r from-whatsapp-light to-emerald-400 hover:brightness-110 text-slate-950 text-xs font-black shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/40 hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200 cursor-pointer"
            >
              <Plus className="w-4 h-4 text-slate-950 stroke-[3] group-hover:rotate-90 transition-transform duration-300" />
              <span>New Task</span>
            </button>
          </div>
        </div>
      </div>

      {/* KPI Stats Grid */}
      <StatCards />

      {/* Main Two-Column Grid: Deadlines & Workload */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <DeadlineRadar />
        <WorkloadDistribution />
      </div>

      {/* Bottom Row: Recent Activity & Quick Shortcuts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <RecentActivity />
        </div>

        {/* Quick Launchpad Card */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                <Zap className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 dark:text-slate-100 text-sm">
                  Quick Actions
                </h3>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Instant productivity shortcuts
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <button
                onClick={() => setIsTimeLogModalOpen(true)}
                className="w-full flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 text-slate-700 dark:text-slate-200 hover:text-emerald-800 dark:hover:text-emerald-300 border border-slate-200/60 dark:border-slate-700/60 transition-all text-left group text-xs font-semibold cursor-pointer"
              >
                <div className="flex items-center gap-2.5">
                  <Clock className="w-4 h-4 text-purple-600" />
                  <span>Log Work Hours</span>
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
              </button>

              <button
                onClick={() => setIsClientModalOpen(true)}
                className="w-full flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 text-slate-700 dark:text-slate-200 hover:text-emerald-800 dark:hover:text-emerald-300 border border-slate-200/60 dark:border-slate-700/60 transition-all text-left group text-xs font-semibold cursor-pointer"
              >
                <div className="flex items-center gap-2.5">
                  <Layers className="w-4 h-4 text-blue-600" />
                  <span>Add Client Profile</span>
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
              </button>

              <button
                onClick={() => setActiveTab('invoices')}
                className="w-full flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 text-slate-700 dark:text-slate-200 hover:text-emerald-800 dark:hover:text-emerald-300 border border-slate-200/60 dark:border-slate-700/60 transition-all text-left group text-xs font-semibold cursor-pointer"
              >
                <div className="flex items-center gap-2.5">
                  <Plus className="w-4 h-4 text-amber-600" />
                  <span>Create Client Invoice</span>
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
              </button>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-400">
            Keyboard shortcut: Press <kbd className="font-mono bg-slate-100 dark:bg-slate-800 px-1 py-0.5 rounded text-slate-700 dark:text-slate-300">Ctrl+K</kbd>
          </div>
        </div>
      </div>
    </div>
  );
};
