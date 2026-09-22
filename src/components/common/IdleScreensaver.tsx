import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../../context/AppContext';
import { useIdleTimer } from '../../hooks/useIdleTimer';
import { useTheme } from '../../context/ThemeContext';
import { Timer as TimerIcon } from 'lucide-react';

export const IdleScreensaver: React.FC = () => {
  const { user, activeTimer } = useApp();
  const { accentColor } = useTheme();
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

  // Theme palette mapping based on user's active accent color
  const getThemePalette = (accent: string) => {
    switch (accent) {
      case 'rose':
        return {
          bg: 'bg-gradient-to-br from-[#35101a]/95 via-[#4a1826]/90 to-[#35101a]/95',
          glow1: 'bg-rose-400/20',
          glow2: 'bg-pink-300/18',
          glowCenter: 'bg-[#be123c]/20',
          textPrimary: 'text-rose-100',
          textAccent: 'text-rose-300',
          textSecondary: 'text-rose-200/80',
          badgeBg: 'bg-rose-950/60 border-rose-400/30 text-rose-200',
          borderAccent: 'border-rose-400/30',
          ring1: 'border-rose-400/25 shadow-[0_0_80px_rgba(244,63,94,0.25)]',
          ring2: 'border-pink-300/30',
          ringFill: 'from-rose-400/15 via-pink-300/10 to-transparent',
          ledColor: 'text-rose-300 drop-shadow-[0_0_40px_rgba(244,63,94,0.6)]',
          barGradient: 'from-rose-500 via-pink-400 to-rose-300 shadow-[0_0_12px_rgba(244,63,94,0.9)]',
          serifGradient: 'from-white via-rose-100 to-rose-200 drop-shadow-[0_0_40px_rgba(244,63,94,0.5)]',
          orbitBorder: 'border-rose-300/30',
          particleRgb: '251, 113, 133',
          lineRgb: '244, 114, 182',
          glowRgb: '244, 63, 94',
        };
      case 'blue':
        return {
          bg: 'bg-gradient-to-br from-[#0c223a]/95 via-[#133152]/90 to-[#0c223a]/95',
          glow1: 'bg-blue-400/20',
          glow2: 'bg-sky-300/18',
          glowCenter: 'bg-[#1d4ed8]/20',
          textPrimary: 'text-blue-100',
          textAccent: 'text-blue-300',
          textSecondary: 'text-blue-200/80',
          badgeBg: 'bg-blue-950/60 border-blue-400/30 text-blue-200',
          borderAccent: 'border-blue-400/30',
          ring1: 'border-blue-400/25 shadow-[0_0_80px_rgba(59,130,246,0.25)]',
          ring2: 'border-sky-300/30',
          ringFill: 'from-blue-400/15 via-sky-300/10 to-transparent',
          ledColor: 'text-blue-300 drop-shadow-[0_0_40px_rgba(59,130,246,0.6)]',
          barGradient: 'from-blue-500 via-sky-400 to-blue-300 shadow-[0_0_12px_rgba(59,130,246,0.9)]',
          serifGradient: 'from-white via-blue-100 to-sky-200 drop-shadow-[0_0_40px_rgba(59,130,246,0.5)]',
          orbitBorder: 'border-sky-300/30',
          particleRgb: '96, 165, 250',
          lineRgb: '56, 189, 248',
          glowRgb: '59, 130, 246',
        };
      case 'purple':
        return {
          bg: 'bg-gradient-to-br from-[#20113a]/95 via-[#311a58]/90 to-[#20113a]/95',
          glow1: 'bg-purple-400/20',
          glow2: 'bg-indigo-300/18',
          glowCenter: 'bg-[#7e22ce]/20',
          textPrimary: 'text-purple-100',
          textAccent: 'text-purple-300',
          textSecondary: 'text-purple-200/80',
          badgeBg: 'bg-purple-950/60 border-purple-400/30 text-purple-200',
          borderAccent: 'border-purple-400/30',
          ring1: 'border-purple-400/25 shadow-[0_0_80px_rgba(168,85,247,0.25)]',
          ring2: 'border-indigo-300/30',
          ringFill: 'from-purple-400/15 via-indigo-300/10 to-transparent',
          ledColor: 'text-purple-300 drop-shadow-[0_0_40px_rgba(168,85,247,0.6)]',
          barGradient: 'from-purple-500 via-indigo-400 to-purple-300 shadow-[0_0_12px_rgba(168,85,247,0.9)]',
          serifGradient: 'from-white via-purple-100 to-indigo-200 drop-shadow-[0_0_40px_rgba(168,85,247,0.5)]',
          orbitBorder: 'border-indigo-300/30',
          particleRgb: '192, 132, 252',
          lineRgb: '165, 180, 252',
          glowRgb: '168, 85, 247',
        };
      case 'amber':
        return {
          bg: 'bg-gradient-to-br from-[#33200a]/95 via-[#4a2e0e]/90 to-[#33200a]/95',
          glow1: 'bg-amber-400/20',
          glow2: 'bg-orange-300/18',
          glowCenter: 'bg-[#b45309]/20',
          textPrimary: 'text-amber-100',
          textAccent: 'text-amber-300',
          textSecondary: 'text-amber-200/80',
          badgeBg: 'bg-amber-950/60 border-amber-400/30 text-amber-200',
          borderAccent: 'border-amber-400/30',
          ring1: 'border-amber-400/25 shadow-[0_0_80px_rgba(245,158,11,0.25)]',
          ring2: 'border-orange-300/30',
          ringFill: 'from-amber-400/15 via-orange-300/10 to-transparent',
          ledColor: 'text-amber-300 drop-shadow-[0_0_40px_rgba(245,158,11,0.6)]',
          barGradient: 'from-amber-500 via-orange-400 to-amber-300 shadow-[0_0_12px_rgba(245,158,11,0.9)]',
          serifGradient: 'from-white via-amber-100 to-orange-200 drop-shadow-[0_0_40px_rgba(245,158,11,0.5)]',
          orbitBorder: 'border-orange-300/30',
          particleRgb: '251, 191, 36',
          lineRgb: '251, 146, 60',
          glowRgb: '245, 158, 11',
        };
      case 'emerald':
      default:
        return {
          bg: 'bg-gradient-to-br from-[#0c332b]/95 via-[#104237]/90 to-[#0c332b]/95',
          glow1: 'bg-emerald-400/20',
          glow2: 'bg-teal-300/18',
          glowCenter: 'bg-[#128C7E]/20',
          textPrimary: 'text-emerald-100',
          textAccent: 'text-emerald-300',
          textSecondary: 'text-emerald-200/80',
          badgeBg: 'bg-emerald-950/60 border-emerald-400/30 text-emerald-200',
          borderAccent: 'border-emerald-400/30',
          ring1: 'border-emerald-400/25 shadow-[0_0_80px_rgba(18,140,126,0.25)]',
          ring2: 'border-teal-300/30',
          ringFill: 'from-emerald-400/15 via-teal-300/10 to-transparent',
          ledColor: 'text-emerald-300 drop-shadow-[0_0_40px_rgba(20,184,166,0.6)]',
          barGradient: 'from-teal-400 via-emerald-300 to-whatsapp-light shadow-[0_0_12px_rgba(52,211,153,0.9)]',
          serifGradient: 'from-white via-teal-100 to-teal-200 drop-shadow-[0_0_40px_rgba(45,212,191,0.5)]',
          orbitBorder: 'border-teal-300/30',
          particleRgb: '52, 211, 153',
          lineRgb: '45, 212, 191',
          glowRgb: '37, 211, 102',
        };
    }
  };

  const theme = getThemePalette(accentColor);

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

  // Ambient Canvas Animations Tailored per Style and Theme Color
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

    let shootingStar: { x: number; y: number; length: number; speed: number; opacity: number } | null = null;
    let nextShootingStarTime = Date.now() + 2000;

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      // In Clock mode, draw subtle matrix scanlines
      if (isClockMode) {
        ctx.strokeStyle = `rgba(${theme.particleRgb}, 0.05)`;
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
              ctx.strokeStyle = `rgba(${theme.lineRgb}, ${lineAlpha})`;
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
        ctx.fillStyle = `rgba(${theme.particleRgb}, ${currentAlpha})`;
        ctx.shadowBlur = isParticlesMode ? 12 : 8;
        ctx.shadowColor = `rgba(${theme.glowRgb}, 0.5)`;
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
          gradient.addColorStop(0.4, `rgba(${theme.lineRgb}, ${shootingStar.opacity * 0.8})`);
          gradient.addColorStop(1, `rgba(${theme.lineRgb}, 0)`);

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
  }, [shouldShow, style, theme]);

  if (!shouldShow) return null;

  // Strict 2-digit minutes and seconds formatting (e.g., 5 mins is ALWAYS "05")
  const hours12 = (currentTime.getHours() % 12 || 12).toString();
  const hours24 = currentTime.getHours().toString().padStart(2, '0');
  const minutes = currentTime.getMinutes().toString().padStart(2, '0'); // ALWAYS 05, not 5
  const seconds = currentTime.getSeconds().toString().padStart(2, '0');
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
      className={`fixed inset-0 z-[100] flex flex-col justify-between p-8 sm:p-14 ${theme.bg} backdrop-blur-3xl text-white select-none transition-all duration-700 cursor-pointer animate-fade-in`}
    >
      {/* Background Animated Canvas */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 pointer-events-none z-0 opacity-80"
      />

      {/* Balanced Twilight Lighting Orbs Tailored to Current Theme */}
      <div className={`absolute top-1/4 -left-20 w-[450px] h-[450px] rounded-full ${theme.glow1} blur-[120px] animate-float-slow pointer-events-none`} />
      <div className={`absolute bottom-1/4 -right-20 w-[450px] h-[450px] rounded-full ${theme.glow2} blur-[120px] animate-float-reverse pointer-events-none`} />
      <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[550px] h-[550px] rounded-full ${theme.glowCenter} blur-[130px] pointer-events-none`} />

      {/* Top Header */}
      <header className="relative z-10 w-full flex items-center justify-between">
        <div className="flex items-center gap-2.5 opacity-75 hover:opacity-100 transition-opacity">
          <span className="relative flex h-2.5 w-2.5">
            <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${theme.glow1} opacity-75`}></span>
            <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${theme.textAccent} bg-current`}></span>
          </span>
          <span className={`font-bold text-xs tracking-[0.25em] uppercase ${theme.textPrimary}`}>
            Me Plus
          </span>
        </div>

        {/* Focus Timer Status Pill */}
        {activeTimer.isRunning && (
          <div className={`flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-900/40 ${theme.borderAccent} ${theme.textAccent} text-xs font-mono backdrop-blur-md shadow-sm`}>
            <TimerIcon className={`w-3.5 h-3.5 ${theme.textAccent} animate-spin`} style={{ animationDuration: '4s' }} />
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
            <div className={`absolute w-72 h-72 sm:w-96 sm:h-96 rounded-full ${theme.ring1} animate-breathe-slow pointer-events-none`} />
            <div className={`absolute w-60 h-60 sm:w-80 sm:h-80 rounded-full ${theme.ring2} animate-breathe-slow [animation-delay:-3s] pointer-events-none`} />
            <div className={`absolute w-44 h-44 sm:w-64 sm:h-64 rounded-full bg-gradient-to-tr ${theme.ringFill} blur-xl pointer-events-none`} />

            <div className="relative z-10 flex flex-col items-center font-['Plus_Jakarta_Sans',sans-serif]">
              {/* Minimalist Clock with Always 2-Digit Minutes */}
              <div className="flex items-baseline justify-center">
                <span className="text-7xl sm:text-9xl font-extralight tracking-tight text-white drop-shadow-[0_0_40px_rgba(255,255,255,0.2)]">
                  {hours12}:{minutes}
                </span>
                <div className="flex flex-col items-start ml-3 sm:ml-4 text-left">
                  <span className={`text-xs sm:text-sm font-bold tracking-widest ${theme.textAccent} uppercase`}>
                    {ampm}
                  </span>
                  <span className={`text-lg sm:text-2xl font-light ${theme.textSecondary} font-mono`}>
                    :{seconds}
                  </span>
                </div>
              </div>

              {/* Date */}
              <p className={`text-xs sm:text-sm font-medium tracking-[0.25em] uppercase ${theme.textPrimary} mt-4 sm:mt-5 drop-shadow-sm`}>
                {formattedDate}
              </p>

              {/* Style Badge */}
              <div className={`mt-5 px-3.5 py-1 rounded-full ${theme.badgeBg} text-[10px] tracking-[0.25em] uppercase font-semibold backdrop-blur-xs`}>
                Zen Sanctuary Mode
              </div>
            </div>
          </div>
        )}

        {/* ================= STYLE 2: CLOCK (High-Tech Bold Digital Monospace LED Chronometer) ================= */}
        {style === 'clock' && (
          <div className="relative flex flex-col items-center justify-center font-mono">
            {/* Studio Badge */}
            <div className={`mb-4 flex items-center gap-2 px-3.5 py-1 rounded-md bg-slate-900/50 ${theme.borderAccent} ${theme.textAccent} text-[11px] font-bold tracking-[0.25em] uppercase shadow-sm backdrop-blur-xs`}>
              <span className={`w-2 h-2 rounded-sm ${theme.textAccent} bg-current animate-pulse`} />
              <span>DIGITAL CHRONOMETER • 24H MATRIX</span>
            </div>

            {/* Heavy Monospace LED Digits with Always 2-Digit Minutes */}
            <div className={`flex items-center justify-center font-black text-6xl sm:text-8xl md:text-9xl tracking-wider ${theme.ledColor} select-none`}>
              <span>{hours24}</span>
              <span className={`mx-1 sm:mx-3 ${theme.textAccent} animate-pulse`}>:</span>
              <span>{minutes}</span>
              <span className={`mx-1 sm:mx-3 ${theme.textAccent} animate-pulse`}>:</span>
              <span className="opacity-90">{seconds}</span>
            </div>

            {/* 60-Second Live Gauge */}
            <div className="w-full max-w-sm sm:max-w-md mt-6">
              <div className={`h-2.5 w-full bg-slate-900/60 rounded-full overflow-hidden ${theme.borderAccent} p-0.5 backdrop-blur-xs`}>
                <div
                  className={`h-full bg-gradient-to-r ${theme.barGradient} rounded-full transition-all duration-1000`}
                  style={{ width: `${((secondsNumeric + 1) / 60) * 100}%` }}
                />
              </div>
              <div className={`flex justify-between items-center text-[10px] ${theme.textSecondary} mt-2 tracking-widest font-semibold uppercase`}>
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
            <div className={`absolute w-80 h-80 sm:w-[28rem] sm:h-[28rem] rounded-full ${theme.orbitBorder} border-dashed animate-spin [animation-duration:100s] pointer-events-none`} />

            {/* Celestial Star Tag */}
            <div className={`mb-4 flex items-center gap-2 px-4 py-1 rounded-full ${theme.badgeBg} italic text-xs tracking-[0.2em] shadow-sm backdrop-blur-xs`}>
              <span>✦ Celestial Constellation ✦</span>
            </div>

            {/* Editorial Luxury Serif Time with Always 2-Digit Minutes */}
            <div className="flex items-baseline justify-center">
              <span className={`text-7xl sm:text-9xl font-light italic tracking-wide text-transparent bg-clip-text bg-gradient-to-b ${theme.serifGradient}`}>
                {hours12}
              </span>
              <span className={`mx-2 sm:mx-4 text-4xl sm:text-6xl ${theme.textAccent} opacity-70 font-light italic`}>·</span>
              <span className={`text-7xl sm:text-9xl font-light italic tracking-wide text-transparent bg-clip-text bg-gradient-to-b ${theme.serifGradient}`}>
                {minutes}
              </span>
              <div className="ml-3 sm:ml-5 text-left font-sans">
                <span className={`text-xs font-semibold tracking-[0.25em] ${theme.textAccent} block uppercase`}>
                  {ampm}
                </span>
                <span className={`text-sm sm:text-base font-mono ${theme.textSecondary}`}>
                  {seconds}s
                </span>
              </div>
            </div>

            {/* Date in Editorial Serif */}
            <p className={`font-serif italic text-sm sm:text-base ${theme.textPrimary} mt-5 tracking-[0.2em] drop-shadow-sm`}>
              {formattedDate}
            </p>
          </div>
        )}
      </main>

      {/* Bottom Wakeup Hint */}
      <footer className="relative z-10 w-full flex items-center justify-center">
        <div className={`opacity-60 hover:opacity-100 transition-opacity flex items-center gap-2 text-[11px] tracking-[0.25em] uppercase font-medium ${theme.textAccent}`}>
          <span className={`w-1.5 h-1.5 rounded-full ${theme.textAccent} bg-current animate-pulse`} />
          <span>Press any key or click anywhere to resume</span>
        </div>
      </footer>
    </div>
  );
};

