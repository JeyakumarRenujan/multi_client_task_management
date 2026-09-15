import React, { useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { AlertTriangle, Trash2, X, AlertCircle } from 'lucide-react';

export const ConfirmModal: React.FC = () => {
  const { confirmModal, closeConfirmModal } = useApp();

  // Keyboard shortcut listeners (Esc to cancel, Enter to confirm)
  useEffect(() => {
    if (!confirmModal.isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        closeConfirmModal();
      } else if (e.key === 'Enter') {
        e.preventDefault();
        handleConfirm();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [confirmModal]);

  if (!confirmModal.isOpen) return null;

  const handleConfirm = async () => {
    try {
      await confirmModal.onConfirm();
    } catch (err) {
      console.error('Error executing confirmation action:', err);
    } finally {
      closeConfirmModal();
    }
  };

  const isDanger = confirmModal.danger !== false;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/65 backdrop-blur-sm animate-fade-in"
      onClick={closeConfirmModal}
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-modal-title"
    >
      <div
        className="w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200/90 dark:border-slate-800 overflow-hidden relative animate-scale-up"
        onClick={e => e.stopPropagation()}
      >
        {/* Top Accent Strip */}
        <div
          className={`h-1.5 w-full ${
            isDanger
              ? 'bg-gradient-to-r from-rose-500 via-rose-600 to-red-600'
              : 'bg-gradient-to-r from-emerald-500 via-teal-500 to-whatsapp-teal'
          }`}
        />

        {/* Close Icon Top-Right */}
        <button
          type="button"
          onClick={closeConfirmModal}
          className="absolute top-4 right-4 p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          aria-label="Cancel and close dialog"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Content Area */}
        <div className="p-5 sm:p-6">
          <div className="flex items-start gap-3.5">
            {/* Warning Icon Badge */}
            <div
              className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 shadow-inner ${
                isDanger
                  ? 'bg-rose-100 dark:bg-rose-950/80 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-900/60'
                  : 'bg-emerald-100 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-900/60'
              }`}
            >
              {isDanger ? <AlertTriangle className="w-5 h-5" /> : <Trash2 className="w-5 h-5" />}
            </div>

            {/* Title & Category Indicator */}
            <div className="flex-1 pr-6">
              <h3
                id="confirm-modal-title"
                className="text-base sm:text-lg font-bold text-slate-900 dark:text-white leading-tight"
              >
                {confirmModal.title}
              </h3>
              <p
                className={`text-[11px] font-semibold mt-0.5 ${
                  isDanger ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600 dark:text-emerald-400'
                }`}
              >
                {isDanger ? 'Irreversible Action' : 'Confirmation Required'}
              </p>
            </div>
          </div>

          {/* Detailed Message */}
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 mt-3.5 leading-relaxed">
            {confirmModal.message}
          </p>

          {/* Cascading Notice for Clients & Projects */}
          {(confirmModal.itemType === 'client' || confirmModal.itemType === 'project') && (
            <div className="mt-3.5 p-2.5 rounded-xl bg-amber-50/90 dark:bg-amber-950/50 border border-amber-200/90 dark:border-amber-900/60 text-[11px] text-amber-900 dark:text-amber-300 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
              <span className="leading-normal font-medium">
                {confirmModal.itemType === 'client'
                  ? 'Notice: Deleting this client will also cascade and remove all associated projects, tasks, and billed statistics.'
                  : 'Notice: Deleting this project will also remove its associated tasks, deadlines, and time entries.'}
              </span>
            </div>
          )}

          {/* Action Buttons */}
          <div className="mt-6 flex items-center justify-end gap-2.5 pt-2">
            <button
              type="button"
              onClick={closeConfirmModal}
              className="px-4 py-2 sm:py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs sm:text-sm font-semibold transition-all cursor-pointer active:scale-95"
            >
              {confirmModal.cancelText || 'Cancel'}
            </button>

            <button
              type="button"
              onClick={handleConfirm}
              autoFocus
              className={`px-5 py-2 sm:py-2.5 rounded-xl text-white text-xs sm:text-sm font-bold shadow-md active:scale-95 transition-all cursor-pointer flex items-center gap-1.5 ${
                isDanger
                  ? 'bg-gradient-to-r from-rose-600 via-rose-600 to-red-600 hover:from-rose-700 hover:to-red-700 shadow-rose-600/25'
                  : 'bg-gradient-to-r from-emerald-600 to-whatsapp-teal hover:from-emerald-700 hover:to-whatsapp-dark shadow-emerald-600/25'
              }`}
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>{confirmModal.confirmText || 'Delete'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

