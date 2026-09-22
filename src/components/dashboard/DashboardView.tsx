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

  const getGreeting = () => {
    const hour = currentTime.getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

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
      {/* Welcome Hero Banner with Signature WhatsApp Green/Teal Theme */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-whatsapp-dark via-whatsapp-teal to-whatsapp-dark text-white p-6 sm:p-7 md:p-8 shadow-xl border border-emerald-400/25">
        {/* Soft luminous ambient glows matching screenshot */}
        <div className="absolute top-0 right-0 -mt-8 -mr-8 w-80 h-80 bg-whatsapp-light/25 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 -mb-8 w-60 h-60 bg-teal-300/15 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="min-w-0 flex-1">
            {/* Live Date & Time Badges */}
            <div className="flex flex-wrap items-center gap-2.5 text-xs font-semibold text-emerald-100 mb-2.5">
              <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-950/30 border border-emerald-400/25 backdrop-blur-xs">
                <Calendar className="w-3.5 h-3.5 text-emerald-300" />
                <span>{todayFormatted}</span>
              </div>
              <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-950/30 border border-emerald-400/25 backdrop-blur-xs">
                <span className="w-2 h-2 rounded-full bg-whatsapp-light animate-pulse" />
                <Clock className="w-3.5 h-3.5 text-emerald-300" />
                <span className="font-mono">{timeFormatted}</span>
              </div>
            </div>

            {/* Greeting Headline without Rocket Emoji */}
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-black tracking-tight text-white">
              {getGreeting()}, {user?.name ? user.name.split(' ')[0] : 'Freelancer'}!
            </h1>

            <p className="text-xs sm:text-sm text-emerald-100/90 mt-1 max-w-xl leading-relaxed">
              Your client projects, pending task deadlines, and productive work sessions are unified in one centralized workspace.
            </p>
          </div>

          {/* Action Buttons with Proper Flex Alignment & No-Wrap */}
          <div className="flex items-center gap-3 shrink-0 flex-wrap sm:flex-nowrap">
            <button
              onClick={() => setIsAiModalOpen(true)}
              className="h-10 px-4 rounded-xl bg-purple-600/35 hover:bg-purple-600/50 border border-purple-300/40 text-purple-100 text-xs font-bold transition-all shadow-sm group cursor-pointer backdrop-blur-xs flex items-center gap-2 whitespace-nowrap shrink-0 active:scale-95"
            >
              <Sparkles className="w-4 h-4 text-purple-200 group-hover:rotate-12 transition-transform" />
              <span>AI Copilot</span>
            </button>

            <button
              onClick={() => setIsTaskModalOpen(true)}
              className="h-10 px-4 rounded-xl bg-whatsapp-light hover:brightness-110 text-slate-950 text-xs font-extrabold shadow-md shadow-black/20 transition-all cursor-pointer flex items-center gap-2 whitespace-nowrap shrink-0 active:scale-95"
            >
              <Plus className="w-4 h-4 text-slate-950 font-black stroke-[3]" />
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
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 shadow-sm flex flex-col">
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
        </div>
      </div>
    </div>
  );
};
