import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../../context/AppContext';
import { useIdleTimer } from '../../hooks/useIdleTimer';
import {
  Clock,
  Sparkles,
  Play,
  Coffee,
  ShieldCheck,
  MousePointer,
  CheckCircle2,
  FolderKanban,
  Timer as TimerIcon,
} from 'lucide-react';

export const IdleScreensaver: React.FC = () => {
  const { user, activeTimer, tasks, projects } = useApp();
  const [currentTime, setCurrentTime] = useState<Date>(new Date());
  const [previewActive, setPreviewActive] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const idleSettings = user?.idleSettings || {
    enabled: true,
    timeoutMinutes: 2,
    style: 'zen',
  };

  const isEnabled = idleSettings.enabled;
  const timeoutMinutes = idleSettings.timeoutMinutes || 2;
  const style = idleSettings.style || 'zen';

  // Idle timer hook
  const { isIdle, setIsIdle } = useIdleTimer({
    enabled: isEnabled,
    timeoutMinutes: timeoutMinutes,
  });

  // Listen for manual "Preview" triggers dispatched from Settings
  useEffect(() => {
    const handlePreview = () => {
      setPreviewActive(true);
    };

    window.addEventListener('meplus:trigger-screensaver-preview', handlePreview);
    return () => {
      window.removeEventListener('meplus:trigger-screensaver-preview', handlePreview);
    };
  }, []);

  const shouldShow = (isIdle || previewActive) && isEnabled;

  // Live clock tick
  useEffect(() => {
    if (!shouldShow) return;
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(interval);
  }, [shouldShow]);

  // Ambient Starry Particles Canvas (Active for 'particles' or subtle background)
  useEffect(() => {
    if (!shouldShow) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', handleResize);

    const particleCount = style === 'particles' ? 65 : 35;
    const particles = Array.from({ length: particleCount }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      radius: Math.random() * 2.2 + 0.8,
      speedX: (Math.random() - 0.5) * 0.45,
      speedY: (Math.random() - 0.5) * 0.45,
      alpha: Math.random() * 0.5 + 0.2,
      fadeSpeed: (Math.random() * 0.01 + 0.005) * (Math.random() > 0.5 ? 1 : -1),
    }));

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      particles.forEach(p => {
        p.x += p.speedX;
        p.y += p.speedY;
        p.alpha += p.fadeSpeed;

        if (p.alpha > 0.75 || p.alpha < 0.15) {
          p.fadeSpeed = -p.fadeSpeed;
        }

        if (p.x < 0) p.x = width;
        if (p.x > width) p.x = 0;
        if (p.y < 0) p.y = height;
        if (p.y > height) p.y = 0;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(18, 140, 126, ${p.alpha})`; // Emerald Teal
        ctx.shadowBlur = 8;
        ctx.shadowColor = 'rgba(37, 211, 102, 0.5)';
        ctx.fill();
      });

      animationId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener('resize', handleResize);
    };
  }, [shouldShow, style]);

  const handleDismiss = () => {
    setIsIdle(false);
    setPreviewActive(false);
  };

  if (!shouldShow) return null;

  const formattedHoursMinutes = currentTime.toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  });
  const formattedSeconds = currentTime.toLocaleTimeString([], {
    second: '2-digit',
  });
  const formattedDate = currentTime.toLocaleDateString([], {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });

  const activeTasksCount = tasks.filter(t => t.status !== 'done').length;
  const activeProjectsCount = projects.filter(p => p.status === 'in-progress').length;

  return (
    <div
      onClick={handleDismiss}
      className="fixed inset-0 z-[100] flex flex-col items-center justify-between p-6 sm:p-12 bg-slate-950/92 backdrop-blur-xl text-white select-none transition-opacity duration-700 cursor-pointer animate-fade-in"
    >
      {/* Dynamic Background Canvas for Floating Particles */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 pointer-events-none z-0 opacity-80"
      />

      {/* Floating Organic Glow Orbs */}
      <div className="absolute top-1/4 -left-20 w-96 h-96 rounded-full bg-emerald-500/20 blur-3xl animate-float-slow pointer-events-none" />
      <div className="absolute bottom-1/4 -right-20 w-96 h-96 rounded-full bg-teal-500/20 blur-3xl animate-float-reverse pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[550px] h-[550px] rounded-full bg-whatsapp-teal/15 blur-3xl pointer-events-none" />

      {/* Top Header Bar */}
      <header className="relative z-10 w-full max-w-5xl flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-emerald-500 to-whatsapp-teal flex items-center justify-center text-white shadow-lg shadow-emerald-500/25">
            <Sparkles className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-base tracking-tight bg-gradient-to-r from-white via-slate-200 to-emerald-200 bg-clip-text text-transparent">
                Me Plus
              </span>
              <span className="text-[10px] uppercase font-bold tracking-widest px-2 py-0.5 rounded-full bg-emerald-950/80 text-emerald-400 border border-emerald-800/60">
                Zen Mode
              </span>
            </div>
            <p className="text-[11px] text-slate-400">Freelance Workspace Resting</p>
          </div>
        </div>

        {/* Live Active Timer Badge if running */}
        {activeTimer.isRunning && (
          <div className="flex items-center gap-2.5 px-3.5 py-1.5 rounded-full bg-emerald-950/80 border border-emerald-500/40 text-emerald-300 text-xs font-semibold animate-pulse shadow-md">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            <TimerIcon className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Active Tracker Running</span>
          </div>
        )}
      </header>

      {/* Center Body: Clock, Breathing Zen Ring, or Motivating Prompt */}
      <main className="relative z-10 flex flex-col items-center text-center my-auto max-w-xl">
        {style === 'zen' && (
          <div className="relative flex items-center justify-center mb-8">
            {/* Outer Breathing Rings */}
            <div className="w-48 h-48 sm:w-56 sm:h-56 rounded-full border border-emerald-500/30 animate-breathe-slow flex items-center justify-center shadow-2xl shadow-emerald-500/20">
              <div className="w-36 h-36 sm:w-44 sm:h-44 rounded-full border border-teal-400/40 bg-gradient-to-tr from-emerald-900/30 via-teal-900/20 to-transparent backdrop-blur-xs flex items-center justify-center">
                <Coffee className="w-10 h-10 text-emerald-400 animate-pulse" />
              </div>
            </div>
          </div>
        )}

        {/* Digital Time Display */}
        <div className="flex items-baseline gap-2 mb-2">
          <h1 className="text-6xl sm:text-8xl font-black tracking-tight text-white drop-shadow-md">
            {formattedHoursMinutes}
          </h1>
          <span className="text-xl sm:text-2xl font-bold text-emerald-400 drop-shadow-xs">
            {formattedSeconds}
          </span>
        </div>

        {/* Date Display */}
        <p className="text-base sm:text-lg font-medium text-slate-300 mb-6">
          {formattedDate}
        </p>

        {/* Motivating Freelancer Quote & Peace of Mind */}
        <div className="p-4 sm:p-5 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md max-w-md mb-6 shadow-xl">
          <p className="text-sm sm:text-base font-semibold text-emerald-300 mb-1">
            "Work Smarter, Freelance Happier"
          </p>
          <p className="text-xs text-slate-400 leading-relaxed">
            Taking a breather? Your workspace is safe. All deadlines, client projects, and active records are preserved.
          </p>
        </div>

        {/* Workspace Quick Pulse Snapshot */}
        <div className="flex flex-wrap items-center justify-center gap-3">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900/70 border border-slate-800 text-slate-300 text-xs font-semibold">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            <span>{activeTasksCount} Pending Tasks</span>
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900/70 border border-slate-800 text-slate-300 text-xs font-semibold">
            <FolderKanban className="w-3.5 h-3.5 text-teal-400" />
            <span>{activeProjectsCount} Projects In Progress</span>
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900/70 border border-slate-800 text-slate-300 text-xs font-semibold">
            <ShieldCheck className="w-3.5 h-3.5 text-sky-400" />
            <span>Encrypted &amp; Auto-Saved</span>
          </div>
        </div>
      </main>

      {/* Bottom Wakeup Bar & Resume CTA */}
      <footer className="relative z-10 flex flex-col sm:flex-row items-center gap-4 text-center">
        <div className="flex items-center gap-2 text-xs text-slate-400 font-medium">
          <MousePointer className="w-4 h-4 text-emerald-400 animate-bounce" />
          <span>Move your mouse or press any key to resume</span>
        </div>

        <button
          type="button"
          onClick={e => {
            e.stopPropagation();
            handleDismiss();
          }}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 via-teal-600 to-whatsapp-teal hover:from-emerald-500 hover:to-whatsapp-dark text-white text-xs font-bold shadow-lg shadow-emerald-600/30 hover:scale-105 active:scale-95 transition-all cursor-pointer"
        >
          <Play className="w-3.5 h-3.5 fill-current" />
          <span>Resume Workspace</span>
        </button>
      </footer>
    </div>
  );
};

