import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useApp } from '../../context/AppContext';
import { useTheme, type AccentColor } from '../../context/ThemeContext';
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
  Check,
  X,
} from 'lucide-react';

interface ThemeAccentConfig {
  beamConic: string;
  borderGlitchClass: string;
  borderGlitchStyle: React.CSSProperties;
  cursorClass: string;
  cursorShadow: string;
  accentText: string;
  modalBtnGradient: string;
}

const THEME_ACCENTS: Record<AccentColor, ThemeAccentConfig> = {
  emerald: {
    beamConic:
      'conic-gradient(from 0deg at 50% 50%, transparent 0deg, transparent 270deg, rgba(16, 185, 129, 0.25) 300deg, #10b981 325deg, #34d399 345deg, #6ee7b7 355deg, #ffffff 360deg)',
    borderGlitchClass: 'border-emerald-400/40',
    borderGlitchStyle: { borderColor: 'rgba(52, 211, 153, 0.4)' },
    cursorClass: 'bg-emerald-400',
    cursorShadow: '0 0 8px rgba(52, 211, 153, 0.9)',
    accentText: 'text-emerald-300',
    modalBtnGradient: 'from-emerald-600 via-teal-600 to-whatsapp-teal hover:from-emerald-700 hover:to-whatsapp-dark shadow-emerald-700/20',
  },
  rose: {
    beamConic:
      'conic-gradient(from 0deg at 50% 50%, transparent 0deg, transparent 270deg, rgba(244, 63, 94, 0.25) 300deg, #f43f5e 325deg, #fb7185 345deg, #fda4af 355deg, #ffffff 360deg)',
    borderGlitchClass: 'border-rose-400/50',
    borderGlitchStyle: { borderColor: 'rgba(251, 113, 133, 0.5)' },
    cursorClass: 'bg-rose-400',
    cursorShadow: '0 0 8px rgba(251, 113, 133, 0.9)',
    accentText: 'text-rose-300',
    modalBtnGradient: 'from-rose-600 via-pink-600 to-rose-700 hover:from-rose-700 hover:to-rose-800 shadow-rose-700/20',
  },
  blue: {
    beamConic:
      'conic-gradient(from 0deg at 50% 50%, transparent 0deg, transparent 270deg, rgba(59, 130, 246, 0.25) 300deg, #3b82f6 325deg, #60a5fa 345deg, #93c5fd 355deg, #ffffff 360deg)',
    borderGlitchClass: 'border-blue-400/50',
    borderGlitchStyle: { borderColor: 'rgba(96, 165, 250, 0.5)' },
    cursorClass: 'bg-blue-400',
    cursorShadow: '0 0 8px rgba(96, 165, 250, 0.9)',
    accentText: 'text-blue-300',
    modalBtnGradient: 'from-blue-600 via-sky-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 shadow-blue-700/20',
  },
  purple: {
    beamConic:
      'conic-gradient(from 0deg at 50% 50%, transparent 0deg, transparent 270deg, rgba(168, 85, 247, 0.25) 300deg, #a855f7 325deg, #c084fc 345deg, #d8b4fe 355deg, #ffffff 360deg)',
    borderGlitchClass: 'border-purple-400/50',
    borderGlitchStyle: { borderColor: 'rgba(192, 132, 252, 0.5)' },
    cursorClass: 'bg-purple-400',
    cursorShadow: '0 0 8px rgba(192, 132, 252, 0.9)',
    accentText: 'text-purple-300',
    modalBtnGradient: 'from-purple-600 via-fuchsia-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 shadow-purple-700/20',
  },
  amber: {
    beamConic:
      'conic-gradient(from 0deg at 50% 50%, transparent 0deg, transparent 270deg, rgba(245, 158, 11, 0.25) 300deg, #f59e0b 325deg, #fbbf24 345deg, #fde68a 355deg, #ffffff 360deg)',
    borderGlitchClass: 'border-amber-400/50',
    borderGlitchStyle: { borderColor: 'rgba(251, 191, 36, 0.5)' },
    cursorClass: 'bg-amber-400',
    cursorShadow: '0 0 8px rgba(251, 191, 36, 0.9)',
    accentText: 'text-amber-300',
    modalBtnGradient: 'from-amber-600 via-orange-600 to-amber-700 hover:from-amber-700 hover:to-amber-800 shadow-amber-700/20',
  },
};

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
  const { accentColor } = useTheme();
  const activeThemeAccent = THEME_ACCENTS[accentColor] || THEME_ACCENTS.emerald;

  const [currentTime, setCurrentTime] = useState<Date>(new Date());

  // Daily Streak Calculation & Persistence with 7-Day History
  const [streakDays, setStreakDays] = useState<number>(2);
  const [streakHistory, setStreakHistory] = useState<string[]>([]);
  const [isStreakModalOpen, setIsStreakModalOpen] = useState(false);

  useEffect(() => {
    try {
      const today = new Date().toISOString().slice(0, 10);
      const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
      const stored = localStorage.getItem('meplus_daily_streak_v2');

      if (stored) {
        const parsed: { count: number; lastDate: string; history?: string[] } = JSON.parse(stored);
        let history = Array.isArray(parsed.history) ? parsed.history : [];

        if (parsed.lastDate === today) {
          if (!history.includes(today)) history.push(today);
          setStreakDays(parsed.count || 2);
          setStreakHistory(history);
        } else if (parsed.lastDate === yesterday) {
          const newCount = (parsed.count || 1) + 1;
          if (!history.includes(today)) history.push(today);
          setStreakDays(newCount);
          setStreakHistory(history);
          localStorage.setItem('meplus_daily_streak_v2', JSON.stringify({ count: newCount, lastDate: today, history }));
        } else {
          const newHistory = [today];
          setStreakDays(1);
          setStreakHistory(newHistory);
          localStorage.setItem('meplus_daily_streak_v2', JSON.stringify({ count: 1, lastDate: today, history: newHistory }));
        }
      } else {
        // Initial setup with 2-day streak (matches user's reference screenshot)
        const initialHistory = [yesterday, today];
        localStorage.setItem('meplus_daily_streak_v2', JSON.stringify({ count: 2, lastDate: today, history: initialHistory }));
        setStreakDays(2);
        setStreakHistory(initialHistory);
      }
    } catch {
      setStreakDays(2);
    }
  }, []);

  const getWeekDates = () => {
    const now = new Date();
    const day = now.getDay(); // 0 is Sunday, 1 is Monday...
    const diffToMonday = (day + 6) % 7;
    const monday = new Date(now);
    monday.setDate(now.getDate() - diffToMonday);

    const dayLabels = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'];
    const todayStr = now.toISOString().slice(0, 10);

    return dayLabels.map((label, idx) => {
      const d = new Date(monday);
      d.setDate(monday.getDate() + idx);
      const dateStr = d.toISOString().slice(0, 10);
      const isToday = dateStr === todayStr;
      const isPast = d < new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const isFuture = d > now && !isToday;
      const isActive = streakHistory.includes(dateStr);

      return {
        label,
        dateStr,
        isToday,
        isPast,
        isFuture,
        isActive,
      };
    });
  };

  const [sparkIndex, setSparkIndex] = useState<number>(() => {
    const now = new Date();
    const start = new Date(now.getFullYear(), 0, 0);
    const diff = now.getTime() - start.getTime();
    const oneDay = 1000 * 60 * 60 * 24;
    const dayOfYear = Math.floor(diff / oneDay);
    return Math.abs(dayOfYear) % DAILY_SPARKS.length;
  });
  const [displayedQuote, setDisplayedQuote] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [typeLoopKey, setTypeLoopKey] = useState(0);

  useEffect(() => {
    let isCancelled = false;
    const fullText = DAILY_SPARKS[sparkIndex].quote;
    setDisplayedQuote('');
    setIsTyping(true);

    let currentIdx = 0;
    let typeTimer: ReturnType<typeof setTimeout> | null = null;
    let restartTimer: ReturnType<typeof setTimeout> | null = null;
    let initialPauseTimer: ReturnType<typeof setTimeout> | null = null;

    initialPauseTimer = setTimeout(() => {
      if (isCancelled) return;

      const typeNextChar = () => {
        if (isCancelled) return;
        currentIdx++;
        if (currentIdx <= fullText.length) {
          setDisplayedQuote(fullText.slice(0, currentIdx));
          typeTimer = setTimeout(typeNextChar, 58); // Reduced typing speed: 58ms per char
        } else {
          setIsTyping(false);

          // Quote fully typed: hold on screen for 2.5 seconds
          restartTimer = setTimeout(() => {
            if (isCancelled) return;
            // Clear text with a visible pause so the user clearly sees the reset
            setDisplayedQuote('');
            setTimeout(() => {
              if (!isCancelled) {
                setTypeLoopKey(prev => prev + 1);
              }
            }, 250);
          }, 2500);
        }
      };

      typeNextChar();
    }, 200);

    return () => {
      isCancelled = true;
      if (initialPauseTimer) clearTimeout(initialPauseTimer);
      if (typeTimer) clearTimeout(typeTimer);
      if (restartTimer) clearTimeout(restartTimer);
    };
  }, [sparkIndex, typeLoopKey]);

  const handleNextSpark = () => {
    setSparkIndex(prev => (prev + 1) % DAILY_SPARKS.length);
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
        {/* Soft luminous ambient glows matching signature green style */}
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

          {/* Daily Streak & Daily Spark Quotes Widget with Running Glitch Border in Loop */}
          <div className="relative group w-full md:w-[380px] h-[142px] rounded-2xl p-[2px] overflow-hidden shadow-xl shrink-0">
            {/* 1. Running Neon Beam along the Border in a continuous loop */}
            <div
              className="absolute inset-[-150%] animate-border-beam pointer-events-none opacity-90 blur-[0.5px]"
              style={{
                background: activeThemeAccent.beamConic,
              }}
            />

            {/* 2. Subtle Theme Border Outline along the perimeter */}
            <div
              className={`absolute inset-0 rounded-2xl border ${activeThemeAccent.borderGlitchClass} pointer-events-none z-0`}
              style={activeThemeAccent.borderGlitchStyle}
            />

            {/* 3. Translucent Inner Card Content & Glassmorphism (Not too dark, lets theme shine) */}
            <div className="relative z-10 w-full h-full rounded-[14px] bg-slate-950/30 hover:bg-slate-950/40 backdrop-blur-md p-3.5 flex flex-col justify-between transition-colors shadow-black/20">
              {/* Top Bar: Flame Streak Pill (matches reference image) & Next Quote Shuffle */}
              <div className="flex items-center justify-between gap-2 h-7 shrink-0">
                <button
                  type="button"
                  onClick={() => setIsStreakModalOpen(true)}
                  className="flex items-center gap-2 px-3 py-1 rounded-full bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-100 shadow-sm border border-slate-200/50 dark:border-slate-700/50 transition-all cursor-pointer group/streak active:scale-95"
                  title="View your 7-day streak details"
                >
                  <Flame className="w-4 h-4 text-amber-500 fill-amber-500 group-hover:scale-110 transition-transform" />
                  <span className="font-black text-sm text-slate-900 dark:text-slate-100">{streakDays}</span>
                </button>

                <button
                  type="button"
                  onClick={handleNextSpark}
                  title="Discover Next Daily Spark"
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-emerald-200 hover:text-white hover:bg-white/10 text-xs font-semibold transition-all cursor-pointer group/spark active:scale-95"
                >
                  <Sparkles className={`w-3.5 h-3.5 ${activeThemeAccent.accentText} group-hover/spark:rotate-12 transition-transform`} />
                  <span>New Spark</span>
                </button>
              </div>

              {/* Quote Content with Typewriter Animation, Simple Modern Font & Reduced Balanced Size */}
              <div className="h-[50px] flex items-center overflow-hidden my-auto">
                <p className="text-xs sm:text-[13px] md:text-sm font-medium italic text-emerald-50 leading-snug tracking-normal line-clamp-2 select-text">
                  <span className={`${activeThemeAccent.accentText} not-italic font-serif text-sm mr-0.5 select-none opacity-90`}>“</span>
                  {displayedQuote}
                  <span className={`${activeThemeAccent.accentText} not-italic font-serif text-sm ml-0.5 select-none opacity-90`}>”</span>
                  <span
                    className={`inline-block w-1.5 h-3.5 ml-1 ${activeThemeAccent.cursorClass} rounded-2xs animate-pulse align-middle`}
                    style={{ boxShadow: activeThemeAccent.cursorShadow }}
                  />
                </p>
              </div>

              {/* Footer: Author & Category Badge */}
              <div className={`flex items-center justify-between h-4 shrink-0 text-[10px] ${activeThemeAccent.accentText} font-semibold border-t border-white/10 pt-1 opacity-85`}>
                <span className="truncate max-w-[210px] tracking-wide">— {DAILY_SPARKS[sparkIndex].author}</span>
                <span className="text-[9px] uppercase tracking-widest shrink-0 font-bold opacity-75">Daily Inspiration</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 7-Day Streak Pop-up Modal (Portaled directly to document.body to fully cover viewport including top navbar) */}
      {isStreakModalOpen &&
        typeof document !== 'undefined' &&
        createPortal(
          <div
            className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in"
            onClick={() => setIsStreakModalOpen(false)}
          >
            <div
              className="relative w-full max-w-sm bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-7 shadow-2xl border border-slate-100 dark:border-slate-800 text-center animate-scale-in"
              onClick={e => e.stopPropagation()}
              role="dialog"
              aria-label="Daily Streak Details"
            >
              {/* Close Button */}
              <button
                type="button"
                onClick={() => setIsStreakModalOpen(false)}
                className="absolute top-4 right-4 p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                title="Close"
              >
                <X className="w-4 h-4" />
              </button>

              {/* Large 3D-styled Flame Illustration */}
              <div className="relative mx-auto w-24 h-24 sm:w-28 sm:h-28 mb-3 flex items-center justify-center">
                <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-amber-500/20 via-orange-500/20 to-rose-500/10 blur-xl animate-pulse" />
                <div className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-gradient-to-b from-amber-50 via-orange-50/80 to-amber-100/70 dark:from-amber-950/40 dark:via-orange-950/30 dark:to-slate-800 border border-amber-300/40 dark:border-amber-500/30 flex items-center justify-center shadow-lg shadow-orange-500/10">
                  <Flame className="w-12 h-12 sm:w-14 sm:h-14 text-orange-500 fill-orange-500 drop-shadow-md animate-bounce-subtle" />
                </div>
              </div>

              {/* Streak Heading */}
              <h3 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
                {streakDays} day streak
              </h3>

              {/* 7-Day Week Row with Connected Active Days */}
              <div className="relative flex items-center justify-between gap-1 my-6 px-1">
                {getWeekDates().map((day, idx, arr) => {
                  const nextDay = arr[idx + 1];
                  const hasConnector = day.isActive && nextDay && nextDay.isActive;

                  return (
                    <div key={day.label} className="relative flex flex-col items-center flex-1">
                      {/* Orange Connector Bar between consecutive active days */}
                      {hasConnector && (
                        <span className="absolute top-[28px] left-[50%] w-full h-1.5 bg-amber-500 z-0 pointer-events-none" />
                      )}

                      {/* Day Name */}
                      <span
                        className={`text-xs font-bold mb-2 transition-colors ${
                          day.isActive
                            ? 'text-amber-500'
                            : day.isToday
                            ? 'text-indigo-600 dark:text-indigo-400'
                            : 'text-slate-400 dark:text-slate-500'
                        }`}
                      >
                        {day.label}
                      </span>

                      {/* Day Circle */}
                      <div
                        className={`relative z-10 w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                          day.isActive
                            ? 'bg-amber-500 text-white shadow-xs'
                            : day.isToday
                            ? 'bg-indigo-100 dark:bg-indigo-950/60 border-2 border-indigo-400 text-indigo-600 dark:text-indigo-300'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-600'
                        }`}
                      >
                        {day.isActive ? (
                          <Check className="w-4 h-4 stroke-[3]" />
                        ) : (
                          <span className="w-1.5 h-1.5 rounded-full bg-current opacity-40" />
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Motivation Subtitle */}
              <p className="text-xs sm:text-sm font-semibold text-slate-600 dark:text-slate-400 leading-relaxed px-2">
                Complete a task or log time to extend your streak!
              </p>

              {/* Keep Going Action Button */}
              <button
                type="button"
                onClick={() => setIsStreakModalOpen(false)}
                className={`w-full mt-6 py-3 px-4 rounded-xl font-bold text-sm text-white bg-gradient-to-r ${activeThemeAccent.modalBtnGradient} shadow-md active:scale-95 transition-all cursor-pointer`}
              >
                Keep It Going
              </button>
            </div>
          </div>,
          document.body
        )}

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
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-primary-400/70 dark:border-primary-500/35 shadow-sm flex flex-col transition-shadow">
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
