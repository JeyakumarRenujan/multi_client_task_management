import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../../context/AppContext';
import { useIdleTimer } from '../../hooks/useIdleTimer';
import { Timer as TimerIcon } from 'lucide-react';

export const IdleScreensaver: React.FC = () => {
  const { user, activeTimer } = useApp();
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

  // Ambient Starry Constellation Canvas
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

    const particleCount = style === 'particles' ? 75 : 45;
    const maxLineDist = style === 'particles' ? 120 : 90;

    const particles = Array.from({ length: particleCount }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      radius: Math.random() * 1.8 + 0.8,
      speedX: (Math.random() - 0.5) * 0.35,
      speedY: (Math.random() - 0.5) * 0.35,
      baseAlpha: Math.random() * 0.5 + 0.25,
      pulse: Math.random() * Math.PI * 2,
    }));

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      // Draw faint delicate constellation connection lines
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < maxLineDist) {
            const lineAlpha = (1 - dist / maxLineDist) * 0.15;
            ctx.beginPath();
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.strokeStyle = `rgba(45, 212, 191, ${lineAlpha})`;
            ctx.lineWidth = 0.7;
            ctx.stroke();
          }
        }
      }

      // Draw luminous particles
      particles.forEach(p => {
        p.x += p.speedX;
        p.y += p.speedY;
        p.pulse += 0.02;
        const currentAlpha = Math.max(0.1, p.baseAlpha + Math.sin(p.pulse) * 0.2);

        if (p.x < 0) p.x = width;
        if (p.x > width) p.x = 0;
        if (p.y < 0) p.y = height;
        if (p.y > height) p.y = 0;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(52, 211, 153, ${currentAlpha})`;
        ctx.shadowBlur = 10;
        ctx.shadowColor = 'rgba(37, 211, 102, 0.4)';
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

  const hours12 = currentTime.toLocaleTimeString([], {
    hour: 'numeric',
    hour12: true,
  }).replace(/\s*(AM|PM)/i, '');
  const minutes12 = currentTime.toLocaleTimeString([], {
    minute: '2-digit',
  });
  const seconds12 = currentTime.toLocaleTimeString([], {
    second: '2-digit',
  });
  const ampm = currentTime.getHours() >= 12 ? 'PM' : 'AM';

  const formattedDate = currentTime.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });

  return (
    <div
      onClick={handleDismiss}
      className="fixed inset-0 z-[100] flex flex-col justify-between p-8 sm:p-14 bg-[#050b0a]/95 backdrop-blur-2xl text-white select-none transition-all duration-700 cursor-pointer animate-fade-in"
    >
      {/* Background Animated Stardust Canvas */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 pointer-events-none z-0 opacity-80"
      />

      {/* Ambient Floating Glow Halos */}
      <div className="absolute top-1/4 -left-20 w-[450px] h-[450px] rounded-full bg-emerald-500/12 blur-[100px] animate-float-slow pointer-events-none" />
      <div className="absolute bottom-1/4 -right-20 w-[450px] h-[450px] rounded-full bg-teal-400/10 blur-[100px] animate-float-reverse pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-emerald-950/40 blur-[120px] pointer-events-none" />

      {/* Top Header: Minimal Brand Watermark */}
      <header className="relative z-10 w-full flex items-center justify-between">
        <div className="flex items-center gap-2.5 opacity-60 hover:opacity-100 transition-opacity">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400"></span>
          </span>
          <span className="font-semibold text-xs tracking-[0.2em] uppercase text-slate-300">
            Me Plus
          </span>
        </div>

        {/* Focus Timer Status Pill (Only shown if running) */}
        {activeTimer.isRunning && (
          <div className="flex items-center gap-2 px-3.5 py-1 rounded-full bg-emerald-950/60 border border-emerald-500/30 text-emerald-300 text-xs font-mono backdrop-blur-md shadow-sm">
            <TimerIcon className="w-3.5 h-3.5 text-emerald-400 animate-spin" style={{ animationDuration: '4s' }} />
            <span className="text-[11px] font-semibold tracking-wider">TIMER ACTIVE</span>
          </div>
        )}
      </header>

      {/* Centerpiece: Aesthetic Minimalist Time & Breathing Ambient Ring */}
      <main className="relative z-10 flex flex-col items-center justify-center my-auto text-center">
        {style === 'zen' && (
          <div className="relative flex items-center justify-center">
            {/* Luminous Breathing Ring */}
            <div className="absolute w-72 h-72 sm:w-96 sm:h-96 rounded-full border border-emerald-500/15 animate-breathe-slow shadow-[0_0_80px_rgba(16,185,129,0.15)] pointer-events-none" />
            <div className="absolute w-60 h-60 sm:w-80 sm:h-80 rounded-full border border-teal-400/20 animate-breathe-slow [animation-delay:-3s] pointer-events-none" />
            <div className="absolute w-44 h-44 sm:w-64 sm:h-64 rounded-full bg-gradient-to-tr from-emerald-500/10 via-teal-500/5 to-transparent blur-xl pointer-events-none" />
          </div>
        )}

        {/* Minimalist Typographic Clock */}
        <div className="relative z-10 flex flex-col items-center">
          <div className="flex items-baseline justify-center">
            <span className="text-7xl sm:text-9xl font-extralight tracking-tighter text-white font-mono drop-shadow-[0_0_40px_rgba(255,255,255,0.12)]">
              {hours12}:{minutes12}
            </span>
            <div className="flex flex-col items-start ml-3 sm:ml-4 text-left">
              <span className="text-xs sm:text-sm font-bold tracking-widest text-emerald-400 uppercase">
                {ampm}
              </span>
              <span className="text-lg sm:text-2xl font-light text-emerald-300/80 font-mono">
                :{seconds12}
              </span>
            </div>
          </div>

          {/* Minimalist Elegant Date */}
          <p className="text-xs sm:text-sm font-medium tracking-[0.25em] uppercase text-emerald-200/70 mt-4 sm:mt-5 drop-shadow-sm">
            {formattedDate}
          </p>
        </div>
      </main>

      {/* Bottom Wakeup Hint */}
      <footer className="relative z-10 w-full flex items-center justify-center">
        <div className="opacity-40 hover:opacity-80 transition-opacity flex items-center gap-2 text-[11px] tracking-[0.2em] uppercase font-medium text-slate-400">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          <span>Press any key or click anywhere to resume</span>
        </div>
      </footer>
    </div>
  );
};
