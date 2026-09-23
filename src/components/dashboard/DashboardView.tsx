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
  Flame,
} from 'lucide-react';

const DAILY_SPARKS = [
  {
    quote: 'Focus on being productive instead of busy.',
    author: 'Tim Ferriss',
  },
  {
    quote: 'Small daily improvements over time lead to stunning results.',
    author: 'Robin Sharma',
  },
  {
    quote: 'Your time is your inventory — price it and protect it with pride.',
    author: 'Freelance Wisdom',
  },
  {
    quote: 'Done is better than perfect. Ship with confidence and iterate.',
    author: 'Sheryl Sandberg',
  },
  {
    quote: 'Deep focus creates rare work that clients eagerly pay for.',
    author: 'Cal Newport',
  },
  {
    quote: 'Action cures anxiety. Take the next clear step today.',
    author: 'Productivity Rule',
  },
  {
    quote: 'Quality work for one happy client opens doors to five more.',
    author: 'Agency Principle',
  },
  {
    quote: 'Simplicity is the soul of efficiency.',
    author: 'Austin Freeman',
  },
];

export const DashboardView: React.FC = () => {
  const {
    user,
    setIsProjectModalOpen,
    setIsClientModalOpen,
    setIsTimeLogModalOpen,
    setActiveTab,
  } = useApp();

  const [currentTime, setCurrentTime] = useState<Date>(new Date());

  // Daily Streak Calculation & Persistence
  const [streakDays, setStreakDays] = useState<number>(5);
  const [sparkIndex, setSparkIndex] = useState<number>(() => {
    const now = new Date();
    const start = new Date(now.getFullYear(), 0, 0);
    const diff = now.getTime() - start.getTime();
    const oneDay = 1000 * 60 * 60 * 24;
    const dayOfYear = Math.floor(diff / oneDay);
    return Math.abs(dayOfYear) % DAILY_SPARKS.length;
  });
  const [isSparkAnimating, setIsSparkAnimating] = useState(false);
  const [showStreakCheer, setShowStreakCheer] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem('meplus_daily_streak');
      const today = new Date().toISOString().slice(0, 10);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed.lastDate === today) {
          setStreakDays(parsed.count || 5);
        } else {
          const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
          if (parsed.lastDate === yesterday) {
            const newCount = (parsed.count || 5) + 1;
            setStreakDays(newCount);
            localStorage.setItem('meplus_daily_streak', JSON.stringify({ count: newCount, lastDate: today }));
          } else {
            setStreakDays(parsed.count || 5);
            localStorage.setItem('meplus_daily_streak', JSON.stringify({ count: parsed.count || 5, lastDate: today }));
          }
        }
      } else {
        localStorage.setItem('meplus_daily_streak', JSON.stringify({ count: 5, lastDate: today }));
        setStreakDays(5);
      }
    } catch {
      // fallback
    }
  }, []);

  const handleNextSpark = () => {
    setIsSparkAnimating(true);
    setTimeout(() => {
      setSparkIndex(prev => (prev + 1) % DAILY_SPARKS.length);
      setIsSparkAnimating(false);
    }, 150);
  };

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
      <div className="relative overflow-hidden rounded-2xl sm:rounded-3xl bg-gradient-to-r from-whatsapp-dark via-whatsapp-teal to-whatsapp-dark text-white p-4 sm:p-6 md:p-8 shadow-xl border border-emerald-400/25">
        {/* Soft luminous ambient glows matching screenshot */}
        <div className="absolute top-0 right-0 -mt-8 -mr-8 w-80 h-80 bg-whatsapp-light/25 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 -mb-8 w-60 h-60 bg-teal-300/15 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4 sm:gap-6">
          <div className="min-w-0 flex-1">
            {/* Live Date & Time Badges */}
            <div className="flex flex-wrap items-center gap-2 sm:gap-2.5 text-xs font-semibold text-emerald-100 mb-2 sm:mb-2.5">
              <div className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1 rounded-full bg-slate-950/30 border border-emerald-400/25 backdrop-blur-xs text-[11px] sm:text-xs">
                <Calendar className="w-3.5 h-3.5 text-emerald-300" />
                <span>{todayFormatted}</span>
              </div>
              <div className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1 rounded-full bg-slate-950/30 border border-emerald-400/25 backdrop-blur-xs text-[11px] sm:text-xs">
                <span className="w-2 h-2 rounded-full bg-whatsapp-light animate-pulse" />
                <Clock className="w-3.5 h-3.5 text-emerald-300" />
                <span className="font-mono">{timeFormatted}</span>
              </div>
            </div>

            {/* Greeting Headline */}
            <h1 className="text-xl sm:text-3xl md:text-4xl font-black tracking-tight text-white">
              {getGreeting()}, {user?.name ? user.name.split(' ')[0] : 'Freelancer'}!
            </h1>

            <p className="text-xs sm:text-sm text-emerald-100/90 mt-1 max-w-xl leading-relaxed">
              Your client projects, pending task deadlines, and productive work sessions are unified in one centralized workspace.
            </p>
          </div>

          {/* Daily Streak & Daily Spark Quotes Widget (Clean, Glassmorphic, Delightful) */}
          <div className="relative group w-full md:w-auto md:min-w-[310px] md:max-w-[380px] rounded-2xl bg-slate-950/30 hover:bg-slate-950/40 backdrop-blur-md border border-emerald-400/25 p-3 sm:p-3.5 transition-all shadow-lg shadow-black/15 shrink-0">
            {/* Top Bar: Flame Streak & Next Quote Shuffle */}
            <div className="flex items-center justify-between gap-2 mb-2 pb-1.5 border-b border-white/10">
              <button
                type="button"
                onClick={() => {
                  setShowStreakCheer(true);
                  setTimeout(() => setShowStreakCheer(false), 2400);
                }}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-500/20 hover:bg-amber-500/30 border border-amber-400/35 text-amber-200 text-xs font-bold transition-all cursor-pointer group/streak"
                title="Your consecutive active workdays! Click for a cheer."
              >
                <Flame className="w-3.5 h-3.5 text-amber-400 fill-amber-400 animate-pulse" />
                <span>{streakDays}-Day Streak</span>
                <span className="text-[10px] text-amber-300/80 font-semibold hidden sm:inline">• High Momentum</span>
              </button>

              <button
                type="button"
                onClick={handleNextSpark}
                title="Discover Next Daily Spark"
                className="flex items-center gap-1 px-2 py-0.5 rounded-lg text-emerald-200 hover:text-white hover:bg-white/10 text-[11px] font-semibold transition-all cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5 text-emerald-300" />
                <span>New Spark</span>
              </button>
            </div>

            {/* Quote Content */}
            <div className={`transition-opacity duration-150 ${isSparkAnimating ? 'opacity-0' : 'opacity-100'}`}>
              <p className="text-xs sm:text-[13px] text-emerald-50/95 font-medium italic leading-snug line-clamp-2">
                “{DAILY_SPARKS[sparkIndex].quote}”
              </p>
              <div className="flex items-center justify-between mt-1 text-[10px] text-emerald-300/80 font-semibold">
                <span>— {DAILY_SPARKS[sparkIndex].author}</span>
                <span className="text-[9px] text-emerald-300/60 uppercase tracking-wider">Daily Inspiration</span>
              </div>
            </div>

            {/* Streak Cheer Popup */}
            {showStreakCheer && (
              <div className="absolute inset-0 z-20 bg-emerald-950/95 backdrop-blur-md rounded-2xl flex items-center justify-center p-3 text-center border border-amber-400/40 animate-fade-in">
                <div className="space-y-0.5">
                  <p className="text-xs font-black text-amber-300 flex items-center justify-center gap-1.5">
                    <Flame className="w-4 h-4 fill-amber-400" /> You're on fire! {streakDays} days strong!
                  </p>
                  <p className="text-[11px] text-emerald-100">
                    Keep your freelance momentum flowing today!
                  </p>
                </div>
              </div>
            )}
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
                <h3 className="font-bold text-slate-900 dark:text-slate-100 text-base">
                  Quick Actions
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Instant productivity shortcuts
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <button
                onClick={() => setIsTimeLogModalOpen(true)}
                className="w-full flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 text-slate-700 dark:text-slate-200 hover:text-emerald-800 dark:hover:text-emerald-300 border border-slate-200/60 dark:border-slate-700/60 transition-all text-left group text-sm font-semibold cursor-pointer"
              >
                <div className="flex items-center gap-2.5">
                  <Clock className="w-4.5 h-4.5 text-purple-600" />
                  <span>Log Work Hours</span>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
              </button>

              <button
                onClick={() => setIsClientModalOpen(true)}
                className="w-full flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 text-slate-700 dark:text-slate-200 hover:text-emerald-800 dark:hover:text-emerald-300 border border-slate-200/60 dark:border-slate-700/60 transition-all text-left group text-sm font-semibold cursor-pointer"
              >
                <div className="flex items-center gap-2.5">
                  <Layers className="w-4.5 h-4.5 text-blue-600" />
                  <span>Add Client Profile</span>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
              </button>

              <button
                onClick={() => setActiveTab('invoices')}
                className="w-full flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 text-slate-700 dark:text-slate-200 hover:text-emerald-800 dark:hover:text-emerald-300 border border-slate-200/60 dark:border-slate-700/60 transition-all text-left group text-sm font-semibold cursor-pointer"
              >
                <div className="flex items-center gap-2.5">
                  <Plus className="w-4.5 h-4.5 text-amber-600" />
                  <span>Create Client Invoice</span>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
