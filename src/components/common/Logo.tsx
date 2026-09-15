import React from 'react';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg';
  showText?: boolean;
}

export const Logo: React.FC<LogoProps> = ({ size = 'md', showText = true }) => {
  const iconSizes = {
    sm: 'w-7 h-7',
    md: 'w-9 h-9',
    lg: 'w-12 h-12',
  };

  const textSizes = {
    sm: 'text-lg',
    md: 'text-xl',
    lg: 'text-2xl',
  };

  return (
    <div className="flex items-center gap-2.5 select-none group">
      {/* Logo Icon with Dynamic Theme Gradient */}
      <div
        className={`${iconSizes[size]} relative rounded-xl bg-gradient-to-tr from-emerald-600 via-teal-600 to-whatsapp-light p-0.5 shadow-md shadow-emerald-600/20 transition-all duration-300 group-hover:scale-105 group-hover:shadow-emerald-600/30 flex items-center justify-center`}
      >
        <div className="w-full h-full bg-slate-900/10 dark:bg-slate-950/20 rounded-[10px] flex items-center justify-center text-white font-black tracking-tighter">
          <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 text-white">
            <path d="M4 19V5h3.5l4.5 8 4.5-8H20v14h-3v-8.5l-3.5 6.5h-2L8 10.5V19H4zm14-6h4v2h-4v-2zm2-3v8h-2v-8h2z" />
          </svg>
        </div>
        <div className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-whatsapp-light border-2 border-white dark:border-slate-900 rounded-full animate-pulse" />
      </div>

      {showText && (
        <div className="flex flex-col leading-none">
          <div className="flex items-center gap-1">
            <span className={`${textSizes[size]} font-extrabold tracking-tight text-slate-900 dark:text-white`}>
              Me
            </span>
            <span className={`${textSizes[size]} font-extrabold text-emerald-600 dark:text-emerald-400`}>
              Plus
            </span>
            <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 ml-0.5 uppercase tracking-wider">
              Pro
            </span>
          </div>
          <span className="text-[9px] font-medium tracking-wide text-slate-500 dark:text-slate-400 uppercase mt-0.5">
            Freelancer OS
          </span>
        </div>
      )}
    </div>
  );
};
