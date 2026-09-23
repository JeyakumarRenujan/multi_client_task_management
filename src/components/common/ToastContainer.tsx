import React from 'react';
import { useApp } from '../../context/AppContext';
import { CheckCircle2, Info, AlertTriangle, XCircle, X, RotateCcw } from 'lucide-react';

export const ToastContainer: React.FC = () => {
  const { toasts, dismissToast } = useApp();

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2.5 max-w-sm w-full pointer-events-none">
      {toasts.map(toast => {
        const typeConfig = {
          success: {
            icon: <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />,
            border: 'border-emerald-500/30 dark:border-emerald-500/20',
            bg: 'bg-white/95 dark:bg-slate-900/95',
            accent: 'bg-emerald-600',
          },
          info: {
            icon: <Info className="w-5 h-5 text-emerald-600 shrink-0" />,
            border: 'border-emerald-500/30 dark:border-emerald-500/20',
            bg: 'bg-white/95 dark:bg-slate-900/95',
            accent: 'bg-emerald-600',
          },
          warning: {
            icon: <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0" />,
            border: 'border-amber-500/30 dark:border-amber-500/20',
            bg: 'bg-white/95 dark:bg-slate-900/95',
            accent: 'bg-amber-500',
          },
          error: {
            icon: <XCircle className="w-5 h-5 text-rose-500 shrink-0" />,
            border: 'border-rose-500/30 dark:border-rose-500/20',
            bg: 'bg-white/95 dark:bg-slate-900/95',
            accent: 'bg-rose-500',
          },
        }[toast.type];

        return (
          <div
            key={toast.id}
            className={`pointer-events-auto flex items-start gap-3 p-4 rounded-xl shadow-xl border backdrop-blur-md transition-all duration-300 transform translate-y-0 animate-slide-up ${typeConfig.border} ${typeConfig.bg}`}
          >
            {typeConfig.icon}
            <div className="flex-1 min-w-0">
              <h4 className="text-sm font-semibold text-slate-900 dark:text-slate-100 leading-tight">
                {toast.title}
              </h4>
              <p className="text-xs text-slate-600 dark:text-slate-300 mt-0.5 break-words">
                {toast.message}
              </p>

              {toast.undoAction && (
                <button
                  type="button"
                  onClick={e => {
                    e.stopPropagation();
                    toast.undoAction!();
                    dismissToast(toast.id);
                  }}
                  className="mt-2 inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700 dark:text-emerald-400 hover:text-emerald-800 dark:hover:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 px-2.5 py-1 rounded-lg transition-all cursor-pointer active:scale-95 shadow-2xs"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  {toast.undoLabel || 'Undo Action'}
                </button>
              )}
            </div>

            <button
              onClick={() => dismissToast(toast.id)}
              className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors p-1"
              aria-label="Close notification"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
};
