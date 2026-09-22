import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../../context/AppContext';
import { useIdleTimer } from '../../hooks/useIdleTimer';
import { Timer as TimerIcon } from 'lucide-react';

export const IdleScreensaver: React.FC = () => {
  const { user, activeTimer } = useApp();
  const [currentTime, setCurrentTime] = useState<Date>(new Date());
  const [previewActive, setPreviewActive] = useState(false);
  const [previewStyle, setPreviewStyle] = useState<'zen' | 'clock' | 'particles' | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const idleSettings = user?.idleSettings || {
    enabled: true,
    timeoutMinutes: 2,
    style: 'zen',
  };

  const isEnabled = idleSettings.enabled;
  const timeoutMinutes = idleSettings.timeoutMinutes || 2;
  const configuredStyle = idleSettings.style || 'zen';

  // If preview was triggered, use the previewed style; otherwise use user settings
  const style = previewActive && previewStyle ? previewStyle : configuredStyle;

  // Idle timer hook
  const { isIdle, setIsIdle } = useIdleTimer({
    enabled: isEnabled,
    timeoutMinutes: timeoutMinutes,
  });

  // Listen for manual "Preview" triggers dispatched from Settings with style detail
  useEffect(() => {
    const handlePreview = (e: Event) => {
      const customEvent = e as CustomEvent<{ style?: 'zen' | 'clock' | 'particles' }>;
      if (customEvent.detail?.style) {
        setPreviewStyle(customEvent.detail.style);
      }
      setPreviewActive(true);
    };

    window.addEventListener('meplus:trigger-screensaver-preview', handlePreview);
    return () => {
      window.removeEventListener('meplus:trigger-screensaver-preview', handlePreview);
    };
  }, []);

  const shouldShow = (isIdle || previewActive) && isEnabled;

  const handleDismiss = () => {
    setIsIdle(false);
    setPreviewActive(false);
    setPreviewStyle(null);
  };

  // Immediate keyboard and user interaction wake-up listener
  useEffect(() => {
    if (!shouldShow) return;

    const handleWakeup = () => {
      handleDismiss();
    };

    const handleKeyDown = () => {
      handleWakeup();
    };

    window.addEventListener('keydown', handleKeyDown);

    // Mouse movement listener with short grace period so the triggering click doesn't instantly dismiss
    const timeout = setTimeout(() => {
      window.addEventListener('mousemove', handleWakeup);
      window.addEventListener('touchstart', handleWakeup);
    }, 300);

    return () => {
      clearTimeout(timeout);
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('mousemove', handleWakeup);
      window.removeEventListener('touchstart', handleWakeup);
    };
  }, [shouldShow]);

  // Live clock tick
  useEffect(() => {
    if (!shouldShow) return;
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(interval);
  }, [shouldShow]);

  // Ambient Canvas Animations Tailored per Style
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

    const isParticlesMode = style === 'particles';
    const isClockMode = style === 'clock';

    const particleCount = isParticlesMode ? 85 : isClockMode ? 35 : 50;
    const maxLineDist = isParticlesMode ? 125 : 85;

    const particles = Array.from({ length: particleCount }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      radius: Math.random() * 2 + (isParticlesMode ? 1 : 0.8),
      speedX: (Math.random() - 0.5) * (isParticlesMode ? 0.45 : 0.25),
      speedY: (Math.random() - 0.5) * (isParticlesMode ? 0.45 : 0.25),
      baseAlpha: Math.random() * 0.5 + 0.2,
      pulse: Math.random() * Math.PI * 2,
    }));

    // Shooting comet for celestial particles mode
    let shootingStar: { x: number; y: number; length: number; speed: number; opacity: number } | null = null;
    let nextShootingStarTime = Date.now() + 2000;

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      // In Clock mode, draw subtle matrix scanlines
      if (isClockMode) {
        ctx.strokeStyle = 'rgba(20, 184, 166, 0.06)';
        ctx.lineWidth = 1;
        for (let y = 0; y < height; y += 10) {
          ctx.beginPath();
          ctx.moveTo(0, y);
          ctx.lineTo(width, y);
          ctx.stroke();
        }
      }

      // Constellation Connection Lines for particles / zen mode
      if (!isClockMode) {
        for (let i = 0; i < particles.length; i++) {
          for (let j = i + 1; j < particles.length; j++) {
            const dx = particles[i].x - particles[j].x;
            const dy = particles[i].y - particles[j].y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < maxLineDist) {
              const lineAlpha = (1 - dist / maxLineDist) * (isParticlesMode ? 0.22 : 0.12);
              ctx.beginPath();
              ctx.moveTo(particles[i].x, particles[i].y);
              ctx.lineTo(particles[j].x, particles[j].y);
              ctx.strokeStyle = isParticlesMode
                ? `rgba(94, 234, 212, ${lineAlpha})`
                : `rgba(52, 211, 153, ${lineAlpha})`;
              ctx.lineWidth = isParticlesMode ? 0.8 : 0.6;
              ctx.stroke();
            }
          }
        }
      }

      // Render Particles
      particles.forEach(p => {
        p.x += p.speedX;
        p.y += p.speedY;
        p.pulse += 0.02;
        const currentAlpha = Math.max(0.1, p.baseAlpha + Math.sin(p.pulse) * 0.25);

        if (p.x < 0) p.x = width;
        if (p.x > width) p.x = 0;
        if (p.y < 0) p.y = height;
        if (p.y > height) p.y = 0;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = isParticlesMode
          ? `rgba(94, 234, 212, ${currentAlpha})`
          : isClockMode
          ? `rgba(45, 212, 191, ${currentAlpha * 0.7})`
          : `rgba(52, 211, 153, ${currentAlpha})`;
        ctx.shadowBlur = isParticlesMode ? 12 : 8;
        ctx.shadowColor = isParticlesMode ? 'rgba(45, 212, 191, 0.6)' : 'rgba(37, 211, 102, 0.4)';
        ctx.fill();
      });

      // Shooting stars in Celestial Particles mode
      if (isParticlesMode) {
        const now = Date.now();
        if (!shootingStar && now > nextShootingStarTime) {
          shootingStar = {
            x: Math.random() * width * 0.8,
            y: Math.random() * height * 0.4,
            length: Math.random() * 80 + 60,
            speed: Math.random() * 12 + 10,
            opacity: 1,
          };
          nextShootingStarTime = now + Math.random() * 6000 + 4000;
        }

        if (shootingStar) {
          ctx.beginPath();
          const endX = shootingStar.x - shootingStar.length;
          const endY = shootingStar.y - shootingStar.length * 0.5;
          const gradient = ctx.createLinearGradient(shootingStar.x, shootingStar.y, endX, endY);
          gradient.addColorStop(0, `rgba(255, 255, 255, ${shootingStar.opacity})`);
          gradient.addColorStop(0.4, `rgba(45, 212, 191, ${shootingStar.opacity * 0.8})`);
          gradient.addColorStop(1, 'rgba(45, 212, 191, 0)');

          ctx.strokeStyle = gradient;
          ctx.lineWidth = 1.8;
          ctx.moveTo(shootingStar.x, shootingStar.y);
          ctx.lineTo(endX, endY);
          ctx.stroke();

          shootingStar.x += shootingStar.speed;
          shootingStar.y += shootingStar.speed * 0.5;
          shootingStar.opacity -= 0.02;

          if (shootingStar.opacity <= 0 || shootingStar.x > width || shootingStar.y > height) {
            shootingStar = null;
          }
        }
      }

      animationId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener('resize', handleResize);
    };
  }, [shouldShow, style]);

  if (!shouldShow) return null;

  // Time formatting variables
  const hours12 = currentTime.toLocaleTimeString([], {
    hour: 'numeric',
    hour12: true,
  }).replace(/\s*(AM|PM)/i, '');
  const hours24 = currentTime.getHours().toString().padStart(2, '0');
  const minutes = currentTime.toLocaleTimeString([], {
    minute: '2-digit',
  });
  const seconds = currentTime.toLocaleTimeString([], {
    second: '2-digit',
  });
  const ampm = currentTime.getHours() >= 12 ? 'PM' : 'AM';

  const formattedDate = currentTime.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });

  const secondsNumeric = parseInt(seconds, 10);

  return (
    <div
      onClick={handleDismiss}
      className="fixed inset-0 z-[100] flex flex-col justify-between p-8 sm:p-14 bg-gradient-to-br from-[#0c332b]/95 via-[#104237]/90 to-[#0c332b]/95 backdrop-blur-3xl text-white select-none transition-all duration-700 cursor-pointer animate-fade-in"
    >
      {/* Background Animated Canvas */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 pointer-events-none z-0 opacity-80"
      />

      {/* Balanced Twilight Lighting Orbs (In the middle of light and dark) */}
      <div className="absolute top-1/4 -left-20 w-[450px] h-[450px] rounded-full bg-emerald-400/20 blur-[120px] animate-float-slow pointer-events-none" />
      <div className="absolute bottom-1/4 -right-20 w-[450px] h-[450px] rounded-full bg-teal-300/18 blur-[120px] animate-float-reverse pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[550px] h-[550px] rounded-full bg-[#128C7E]/20 blur-[130px] pointer-events-none" />

      {/* Top Header */}
      <header className="relative z-10 w-full flex items-center justify-between">
        <div className="flex items-center gap-2.5 opacity-75 hover:opacity-100 transition-opacity">
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-300 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-300"></span>
          </span>
          <span className="font-bold text-xs tracking-[0.25em] uppercase text-emerald-100">
            Me Plus
          </span>
        </div>

        {/* Focus Timer Status Pill */}
        {activeTimer.isRunning && (
          <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-900/40 border border-emerald-400/30 text-emerald-200 text-xs font-mono backdrop-blur-md shadow-sm">
            <TimerIcon className="w-3.5 h-3.5 text-emerald-300 animate-spin" style={{ animationDuration: '4s' }} />
            <span className="text-[11px] font-semibold tracking-wider">TIMER ACTIVE</span>
          </div>
        )}
      </header>

      {/* Centerpiece: 3 Radically Distinct Aesthetic Styles */}
      <main className="relative z-10 flex flex-col items-center justify-center my-auto text-center">
        {/* ================= STYLE 1: ZEN (Modern Ultra-Light Geometric Sans with Breathing Aura) ================= */}
        {style === 'zen' && (
          <div className="relative flex flex-col items-center justify-center">
            {/* Luminous Breathing Aura Rings */}
            <div className="absolute w-72 h-72 sm:w-96 sm:h-96 rounded-full border border-emerald-400/25 animate-breathe-slow shadow-[0_0_80px_rgba(18,140,126,0.25)] pointer-events-none" />
            <div className="absolute w-60 h-60 sm:w-80 sm:h-80 rounded-full border border-teal-300/30 animate-breathe-slow [animation-delay:-3s] pointer-events-none" />
            <div className="absolute w-44 h-44 sm:w-64 sm:h-64 rounded-full bg-gradient-to-tr from-emerald-400/15 via-teal-300/10 to-transparent blur-xl pointer-events-none" />

            <div className="relative z-10 flex flex-col items-center font-['Plus_Jakarta_Sans',sans-serif]">
              {/* Minimalist Clock */}
              <div className="flex items-baseline justify-center">
                <span className="text-7xl sm:text-9xl font-extralight tracking-tight text-white drop-shadow-[0_0_40px_rgba(255,255,255,0.2)]">
                  {hours12}:{minutes}
                </span>
                <div className="flex flex-col items-start ml-3 sm:ml-4 text-left">
                  <span className="text-xs sm:text-sm font-bold tracking-widest text-emerald-300 uppercase">
                    {ampm}
                  </span>
                  <span className="text-lg sm:text-2xl font-light text-emerald-200/80 font-mono">
                    :{seconds}
                  </span>
                </div>
              </div>

              {/* Date */}
              <p className="text-xs sm:text-sm font-medium tracking-[0.25em] uppercase text-emerald-100 mt-4 sm:mt-5 drop-shadow-sm">
                {formattedDate}
              </p>

              {/* Style Badge */}
              <div className="mt-5 px-3.5 py-1 rounded-full bg-slate-900/30 border border-emerald-400/30 text-emerald-200 text-[10px] tracking-[0.25em] uppercase font-semibold backdrop-blur-xs">
                Zen Sanctuary Mode
              </div>
            </div>
          </div>
        )}

        {/* ================= STYLE 2: CLOCK (High-Tech Bold Digital Monospace LED Chronometer) ================= */}
        {style === 'clock' && (
          <div className="relative flex flex-col items-center justify-center font-mono">
            {/* Tech Matrix Backdrop Pattern */}
            <div className="absolute -inset-10 bg-[linear-gradient(to_right,rgba(45,212,191,0.08)_1px,transparent_1px),linear-gradient(to_bottom,rgba(45,212,191,0.08)_1px,transparent_1px)] bg-[size:28px_28px] pointer-events-none rounded-3xl" />

            {/* Studio Badge */}
            <div className="mb-4 flex items-center gap-2 px-3.5 py-1 rounded-md bg-slate-900/50 border border-teal-400/40 text-teal-300 text-[11px] font-bold tracking-[0.25em] uppercase shadow-sm backdrop-blur-xs">
              <span className="w-2 h-2 rounded-sm bg-teal-300 animate-pulse" />
              <span>DIGITAL CHRONOMETER • 24H MATRIX</span>
            </div>

            {/* Heavy Monospace LED Digits */}
            <div className="flex items-center justify-center font-black text-6xl sm:text-8xl md:text-9xl tracking-wider text-emerald-300 drop-shadow-[0_0_40px_rgba(20,184,166,0.6)] select-none">
              <span>{hours24}</span>
              <span className="mx-1 sm:mx-3 text-teal-200 animate-pulse">:</span>
              <span>{minutes}</span>
              <span className="mx-1 sm:mx-3 text-teal-200 animate-pulse">:</span>
              <span className="text-emerald-100">{seconds}</span>
            </div>

            {/* 60-Second Live Gauge */}
            <div className="w-full max-w-sm sm:max-w-md mt-6">
              <div className="h-2.5 w-full bg-slate-900/60 rounded-full overflow-hidden border border-emerald-400/30 p-0.5 backdrop-blur-xs">
                <div
                  className="h-full bg-gradient-to-r from-teal-400 via-emerald-300 to-whatsapp-light rounded-full transition-all duration-1000 shadow-[0_0_12px_rgba(52,211,153,0.9)]"
                  style={{ width: `${((secondsNumeric + 1) / 60) * 100}%` }}
                />
              </div>
              <div className="flex justify-between items-center text-[10px] text-emerald-200 mt-2 tracking-widest font-semibold uppercase">
                <span>00s</span>
                <span>{formattedDate}</span>
                <span>60s</span>
              </div>
            </div>
          </div>
        )}

        {/* ================= STYLE 3: PARTICLES (Deep Celestial Cosmos & Editorial Luxury Serif) ================= */}
        {style === 'particles' && (
          <div className="relative flex flex-col items-center justify-center font-serif">
            {/* Celestial Orbit Ring */}
            <div className="absolute w-80 h-80 sm:w-[28rem] sm:h-[28rem] rounded-full border border-teal-300/30 border-dashed animate-spin [animation-duration:100s] pointer-events-none" />
            <div className="absolute w-64 h-64 sm:w-80 sm:h-80 rounded-full border border-emerald-300/20 pointer-events-none" />

            {/* Celestial Star Tag */}
            <div className="mb-4 flex items-center gap-2 px-4 py-1 rounded-full bg-slate-900/40 border border-teal-300/40 text-teal-100 italic text-xs tracking-[0.2em] shadow-sm backdrop-blur-xs">
              <span>✦ Celestial Constellation ✦</span>
            </div>

            {/* Editorial Luxury Serif Time */}
            <div className="flex items-baseline justify-center">
              <span className="text-7xl sm:text-9xl font-light italic tracking-wide text-transparent bg-clip-text bg-gradient-to-b from-white via-teal-100 to-teal-200 drop-shadow-[0_0_40px_rgba(45,212,191,0.5)]">
                {hours12}
              </span>
              <span className="mx-2 sm:mx-4 text-4xl sm:text-6xl text-teal-200/70 font-light italic">·</span>
              <span className="text-7xl sm:text-9xl font-light italic tracking-wide text-transparent bg-clip-text bg-gradient-to-b from-white via-teal-100 to-teal-200 drop-shadow-[0_0_40px_rgba(45,212,191,0.5)]">
                {minutes}
              </span>
              <div className="ml-3 sm:ml-5 text-left font-sans">
                <span className="text-xs font-semibold tracking-[0.25em] text-teal-200 block uppercase">
                  {ampm}
                </span>
                <span className="text-sm sm:text-base font-mono text-teal-100">
                  {seconds}s
                </span>
              </div>
            </div>

            {/* Date in Editorial Serif */}
            <p className="font-serif italic text-sm sm:text-base text-teal-100 mt-5 tracking-[0.2em] drop-shadow-sm">
              {formattedDate}
            </p>
          </div>
        )}
      </main>

      {/* Bottom Wakeup Hint */}
      <footer className="relative z-10 w-full flex items-center justify-center">
        <div className="opacity-60 hover:opacity-100 transition-opacity flex items-center gap-2 text-[11px] tracking-[0.25em] uppercase font-medium text-emerald-200">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-300 animate-pulse" />
          <span>Press any key or click anywhere to resume</span>
        </div>
      </footer>
    </div>
  );
};
