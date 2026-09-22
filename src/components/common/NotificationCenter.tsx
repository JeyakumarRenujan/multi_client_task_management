import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import {
  Bell,
  CheckCircle2,
  Clock,
  AlertTriangle,
  FolderKanban,
  FileText,
  Volume2,
  VolumeX,
  Mail,
  Smartphone,
  Check,
  X,
} from 'lucide-react';

interface NotificationCenterProps {
  isOpen: boolean;
  onClose: () => void;
}

// Synthesize real audible notification tone with Web Audio API
const playNotificationTone = (action: 'enable' | 'disable' | 'chime') => {
  try {
    const AudioContextClass =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();

    if (ctx.state === 'suspended') {
      ctx.resume();
    }

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);

    const now = ctx.currentTime;

    if (action === 'enable' || action === 'chime') {
      // Pleasant harmonic ascending chime: D5 (587.33Hz) -> A5 (880Hz)
      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, now);
      osc.frequency.setValueAtTime(880, now + 0.1);

      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

      osc.start(now);
      osc.stop(now + 0.35);
    } else {
      // Gentle descending tone for mute: A4 (440Hz) -> D4 (293.66Hz)
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(440, now);
      osc.frequency.setValueAtTime(293.66, now + 0.08);

      gain.gain.setValueAtTime(0.12, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);

      osc.start(now);
      osc.stop(now + 0.22);
    }
  } catch (err) {
    console.warn('Notification audio feedback blocked or unavailable:', err);
  }
};

export const NotificationCenter: React.FC<NotificationCenterProps> = ({ isOpen, onClose }) => {
  const {
    notifications,
    unreadNotificationsCount,
    markNotificationAsRead,
    markAllNotificationsAsRead,
    clearAllNotifications,
    user,
    updateUserProfile,
    setActiveTab,
    showToast,
  } = useApp();

  const [activeFilter, setActiveFilter] = useState<'all' | 'unread'>('all');
  const [showSimulatedPreview, setShowSimulatedPreview] = useState<boolean>(false);

  // Close on Escape key
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const filteredNotifs = notifications.filter(n => (activeFilter === 'unread' ? !n.read : true));
  const isSoundOn = user?.notificationSettings?.sound ?? true;

  const toggleSound = (e: React.MouseEvent) => {
    e.stopPropagation();
    const nextSound = !isSoundOn;

    // Immediately play the corresponding audio tone
    playNotificationTone(nextSound ? 'enable' : 'disable');

    if (user) {
      updateUserProfile(
        {
          notificationSettings: {
            ...user.notificationSettings,
            sound: nextSound,
          },
        },
        { silent: true }
      );
    }

    showToast({
      title: nextSound ? 'Notification Sound Enabled' : 'Notification Sound Muted',
      message: nextSound
        ? 'Audible chime will play for task deadlines and timer alerts.'
        : 'Notification alert sounds have been muted.',
      type: nextSound ? 'success' : 'info',
    });
  };

  const handleSimulatePush = () => {
    const nextState = !showSimulatedPreview;
    setShowSimulatedPreview(nextState);
    if (nextState && isSoundOn) {
      playNotificationTone('chime');
    }
  };

  const getNotificationIcon = (type: string, priority: string) => {
    if (priority === 'urgent' || priority === 'high') {
      return <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0" />;
    }
    switch (type) {
      case 'deadline':
        return <Clock className="w-4 h-4 text-amber-500 shrink-0" />;
      case 'project':
        return <FolderKanban className="w-4 h-4 text-emerald-600 shrink-0" />;
      case 'invoice':
        return <FileText className="w-4 h-4 text-teal-600 shrink-0" />;
      default:
        return <Bell className="w-4 h-4 text-emerald-600 shrink-0" />;
    }
  };

  const handleNotificationClick = (notifId: string, relatedType?: string) => {
    markNotificationAsRead(notifId);
    if (relatedType === 'task') setActiveTab('tasks');
    else if (relatedType === 'project') setActiveTab('projects');
    else if (relatedType === 'invoice') setActiveTab('invoices');
    else if (relatedType === 'client') setActiveTab('clients');
    onClose();
  };

  return (
    <>
      {/* Invisible Global Backdrop to close notification on click anywhere */}
      <div
        className="fixed inset-0 z-40 bg-black/5 dark:bg-black/20 cursor-default"
        onClick={onClose}
        aria-hidden="true"
      />

      <div
        className="absolute right-0 top-14 w-96 max-w-[92vw] bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 z-50 overflow-hidden flex flex-col max-h-[80vh] animate-slide-up"
        onClick={e => e.stopPropagation()}
        role="dialog"
        aria-label="Notification Center"
      >
        {/* Header */}
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/50">
          <div className="flex items-center gap-2">
            <Bell className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            <h3 className="font-bold text-slate-900 dark:text-slate-100 text-sm">Notifications</h3>
            {unreadNotificationsCount > 0 && (
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-600 text-white">
                {unreadNotificationsCount} new
              </span>
            )}
          </div>

          <div className="flex items-center gap-1.5">
            {/* Functional Audio Sound Toggle */}
            <button
              type="button"
              onClick={toggleSound}
              title={isSoundOn ? 'Notification Sound: ON (Click to mute)' : 'Notification Sound: MUTED (Click to enable)'}
              className={`px-2 py-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
                isSoundOn
                  ? 'text-emerald-700 dark:text-emerald-300 bg-emerald-100/70 dark:bg-emerald-950/60 hover:bg-emerald-200/70 border border-emerald-300/60 dark:border-emerald-800/60'
                  : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-800 border border-transparent'
              }`}
              aria-label={isSoundOn ? 'Mute notification sound' : 'Enable notification sound'}
            >
              {isSoundOn ? (
                <Volume2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              ) : (
                <VolumeX className="w-4 h-4 text-slate-400" />
              )}
              <span className="text-[10px] font-bold hidden sm:inline">
                {isSoundOn ? 'Sound On' : 'Muted'}
              </span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
              title="Close Notifications (Esc)"
              aria-label="Close"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

      {/* Tabs & Controls */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-slate-100 dark:border-slate-800/60 bg-slate-50/30 dark:bg-slate-900/30 text-xs">
        <div className="flex items-center gap-1 bg-slate-200/60 dark:bg-slate-800 p-0.5 rounded-lg">
          <button
            onClick={() => setActiveFilter('all')}
            className={`px-2.5 py-1 rounded-md font-semibold transition-all ${
              activeFilter === 'all'
                ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            All ({notifications.length})
          </button>
          <button
            onClick={() => setActiveFilter('unread')}
            className={`px-2.5 py-1 rounded-md font-semibold transition-all ${
              activeFilter === 'unread'
                ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            Unread ({unreadNotificationsCount})
          </button>
        </div>

        {unreadNotificationsCount > 0 && (
          <button
            onClick={markAllNotificationsAsRead}
            className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-400 hover:underline flex items-center gap-1"
          >
            <Check className="w-3 h-3" /> Mark all read
          </button>
        )}
      </div>

      {/* Notification List */}
      <div className="flex-1 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/60 p-1">
        {filteredNotifs.length === 0 ? (
          <div className="py-10 text-center text-slate-400">
            <CheckCircle2 className="w-8 h-8 mx-auto mb-2 text-emerald-500 opacity-60" />
            <p className="text-sm font-medium text-slate-600 dark:text-slate-300">
              All caught up!
            </p>
            <p className="text-xs text-slate-400 mt-0.5">No pending alerts at the moment.</p>
          </div>
        ) : (
          filteredNotifs.map(notif => (
            <div
              key={notif.id}
              onClick={() => handleNotificationClick(notif.id, notif.relatedType)}
              className={`p-3 rounded-xl transition-all cursor-pointer flex items-start gap-3 hover:bg-slate-100 dark:hover:bg-slate-800/60 ${
                !notif.read ? 'bg-emerald-50/50 dark:bg-emerald-950/20' : ''
              }`}
            >
              <div className="mt-0.5 p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800">
                {getNotificationIcon(notif.type, notif.priority)}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-1">
                  <h4
                    className={`text-xs font-bold leading-tight truncate ${
                      !notif.read
                        ? 'text-slate-900 dark:text-white'
                        : 'text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    {notif.title}
                  </h4>
                  <span className="text-[10px] text-slate-400 shrink-0">{notif.timestamp}</span>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-normal line-clamp-2">
                  {notif.message}
                </p>

                {notif.priority === 'urgent' && (
                  <span className="inline-block mt-1.5 text-[10px] font-bold px-1.5 py-0.2 rounded bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400">
                    High Priority Alert
                  </span>
                )}
              </div>

              {!notif.read && (
                <div className="w-2 h-2 rounded-full bg-emerald-600 mt-1.5 shrink-0" />
              )}
            </div>
          ))
        )}
      </div>

      {/* Multi-Channel Simulation Bar */}
      <div className="p-3 bg-slate-50 dark:bg-slate-900/80 border-t border-slate-200 dark:border-slate-800 text-xs">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-medium text-slate-500">
            Channels: Email &bull; SMS &bull; Browser
          </span>
          <button
            onClick={handleSimulatePush}
            className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-400 hover:underline cursor-pointer"
          >
            {showSimulatedPreview ? 'Hide Sim' : 'Simulate Push'}
          </button>
        </div>

        {showSimulatedPreview && (
          <div className="mt-2.5 p-2.5 rounded-lg bg-emerald-50/80 dark:bg-emerald-950/50 border border-emerald-200/50 dark:border-emerald-800/40 text-[11px] space-y-1.5 animate-fade-in">
            <div className="flex items-center gap-1.5 text-emerald-800 dark:text-emerald-300 font-bold">
              <Mail className="w-3.5 h-3.5" />
              <span>Email Digest to {user?.email}</span>
            </div>
            <p className="text-slate-600 dark:text-slate-300">
              &quot;Daily Brief: 1 task due today, 1 invoice awaiting payment.&quot;
            </p>
            <div className="flex items-center gap-1.5 text-teal-800 dark:text-teal-400 font-bold pt-1">
              <Smartphone className="w-3.5 h-3.5" />
              <span>SMS Ping via Twilio: &quot;FinTech task deadline at 6 PM&quot;</span>
            </div>
          </div>
        )}
      </div>
    </div>
  </>
);
};
