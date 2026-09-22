import React, { useState, useRef, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { useTheme } from '../../context/ThemeContext';
import {
  User,
  Bell,
  Camera,
  Upload,
  Check,
  Palette,
  Sun,
  Moon,
  Layout,
  Sparkles,
  Timer,
  Coffee,
  Bot,
  Eye,
  ExternalLink,
  ArrowUpRight,
  Zap,
  RotateCcw,
  GraduationCap,
} from 'lucide-react';
import { playNotificationTone } from '../../services/soundService';

const getIdleThemeStyles = (color: string) => {
  switch (color) {
    case 'rose':
      return {
        activeCard: 'border-rose-500 bg-rose-50/50 dark:bg-rose-950/40 text-rose-800 dark:text-rose-300 ring-2 ring-rose-500/20 shadow-xs',
        icon: 'text-rose-600 dark:text-rose-400',
        badge: 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300',
        previewBtn: 'bg-rose-50 dark:bg-rose-950/60 hover:bg-rose-100 dark:hover:bg-rose-900/60 text-rose-800 dark:text-rose-300 border border-rose-200 dark:border-rose-800',
        toggle: 'bg-rose-600',
      };
    case 'blue':
      return {
        activeCard: 'border-blue-500 bg-blue-50/50 dark:bg-blue-950/40 text-blue-800 dark:text-blue-300 ring-2 ring-blue-500/20 shadow-xs',
        icon: 'text-blue-600 dark:text-blue-400',
        badge: 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300',
        previewBtn: 'bg-blue-50 dark:bg-blue-950/60 hover:bg-blue-100 dark:hover:bg-blue-900/60 text-blue-800 dark:text-blue-300 border border-blue-200 dark:border-blue-800',
        toggle: 'bg-blue-600',
      };
    case 'purple':
      return {
        activeCard: 'border-purple-500 bg-purple-50/50 dark:bg-purple-950/40 text-purple-800 dark:text-purple-300 ring-2 ring-purple-500/20 shadow-xs',
        icon: 'text-purple-600 dark:text-purple-400',
        badge: 'bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300',
        previewBtn: 'bg-purple-50 dark:bg-purple-950/60 hover:bg-purple-100 dark:hover:bg-purple-900/60 text-purple-800 dark:text-purple-300 border border-purple-200 dark:border-purple-800',
        toggle: 'bg-purple-600',
      };
    case 'amber':
      return {
        activeCard: 'border-amber-500 bg-amber-50/50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 ring-2 ring-amber-500/20 shadow-xs',
        icon: 'text-amber-600 dark:text-amber-400',
        badge: 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300',
        previewBtn: 'bg-amber-50 dark:bg-amber-950/60 hover:bg-amber-100 dark:hover:bg-amber-900/60 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800',
        toggle: 'bg-amber-600',
      };
    case 'emerald':
    default:
      return {
        activeCard: 'border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 ring-2 ring-emerald-500/20 shadow-xs',
        icon: 'text-emerald-600 dark:text-emerald-400',
        badge: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300',
        previewBtn: 'bg-emerald-50 dark:bg-emerald-950/60 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800',
        toggle: 'bg-emerald-600',
      };
  }
};

export const SettingsView: React.FC = () => {
  const {
    user,
    updateUserProfile,
    showToast,
    resetDemoData,
    setIsAiModalOpen,
  } = useApp();

  const { theme, setTheme, actualTheme, toggleTheme, sidebarTheme, setSidebarTheme, accentColor, setAccentColor } = useTheme();

  const fileInputRef = useRef<HTMLInputElement>(null);

  const [name, setName] = useState(user?.name || '');
  const [title, setTitle] = useState(user?.title || '');
  const [bio, setBio] = useState(user?.bio || '');
  const [avatar, setAvatar] = useState(user?.avatar || 'https://api.dicebear.com/7.x/adventurer/svg?seed=Alex&backgroundColor=b6e3f4');
  
  const [emailAlerts, setEmailAlerts] = useState(user?.notificationSettings?.email ?? true);
  const [smsAlerts, setSmsAlerts] = useState(user?.notificationSettings?.sms ?? true);
  const [browserAlerts, setBrowserAlerts] = useState(user?.notificationSettings?.browser ?? true);
  const [soundAlerts, setSoundAlerts] = useState(user?.notificationSettings?.sound ?? true);

  // Inactivity / Idle Screensaver Settings
  const [idleEnabled, setIdleEnabled] = useState(user?.idleSettings?.enabled ?? true);
  const [idleTimeout, setIdleTimeout] = useState<number>(user?.idleSettings?.timeoutMinutes ?? 2);
  const [idleStyle, setIdleStyle] = useState<'zen' | 'clock' | 'particles'>(user?.idleSettings?.style ?? 'zen');

  // Sync state when active user updates
  useEffect(() => {
    if (user) {
      setName(user.name || '');
      setTitle(user.title || '');
      setBio(user.bio || '');
      if (user.avatar) setAvatar(user.avatar);
      if (user.notificationSettings) {
        setEmailAlerts(user.notificationSettings.email ?? true);
        setSmsAlerts(user.notificationSettings.sms ?? true);
        setBrowserAlerts(user.notificationSettings.browser ?? true);
        setSoundAlerts(user.notificationSettings.sound ?? true);
      }
      if (user.idleSettings) {
        setIdleEnabled(user.idleSettings.enabled ?? true);
        setIdleTimeout(user.idleSettings.timeoutMinutes ?? 2);
        setIdleStyle(user.idleSettings.style ?? 'zen');
      }
    }
  }, [user]);

  const updateIdlePreferences = (updates: Partial<{ enabled: boolean; timeoutMinutes: number; style: 'zen' | 'clock' | 'particles' }>) => {
    const newEnabled = updates.enabled !== undefined ? updates.enabled : idleEnabled;
    const newTimeout = updates.timeoutMinutes !== undefined ? updates.timeoutMinutes : idleTimeout;
    const newStyle = updates.style !== undefined ? updates.style : idleStyle;

    if (updates.enabled !== undefined) setIdleEnabled(newEnabled);
    if (updates.timeoutMinutes !== undefined) setIdleTimeout(newTimeout);
    if (updates.style !== undefined) setIdleStyle(newStyle);

    updateUserProfile(
      {
        idleSettings: {
          enabled: newEnabled,
          timeoutMinutes: newTimeout,
          style: newStyle,
        },
      },
      { silent: true }
    );
  };

  const handleToggleNotificationSetting = (
    key: 'email' | 'sms' | 'sound',
    nextValue: boolean
  ) => {
    if (key === 'email') setEmailAlerts(nextValue);
    if (key === 'sms') setSmsAlerts(nextValue);
    if (key === 'sound') setSoundAlerts(nextValue);

    if (key === 'sound') {
      playNotificationTone(nextValue ? 'enable' : 'disable');
    }

    if (user) {
      updateUserProfile(
        {
          notificationSettings: {
            ...(user.notificationSettings || {
              email: true,
              sms: true,
              browser: true,
              sound: true,
              deadlineReminderHours: 24,
            }),
            [key]: nextValue,
          },
        },
        { silent: true }
      );
    }

    showToast({
      title:
        key === 'sound'
          ? nextValue
            ? '🔊 Audio Sound Feedback Enabled'
            : '🔇 Audio Sound Feedback Muted'
          : key === 'email'
          ? nextValue
            ? '📧 Email Notifications Enabled'
            : '📧 Email Notifications Disabled'
          : nextValue
          ? '📱 SMS Urgent Alerts Enabled'
          : '📱 SMS Urgent Alerts Disabled',
      message:
        key === 'sound'
          ? nextValue
            ? 'Audible chime will play for task deadlines and timer alerts.'
            : 'In-app audio alert sounds are now muted.'
          : key === 'email'
          ? nextValue
            ? 'You will receive email digests for upcoming client deliverables.'
            : 'Email deadline alerts paused.'
          : nextValue
          ? 'Urgent SMS pings will be dispatched for due deadlines.'
          : 'SMS alerts paused.',
      type: nextValue ? 'success' : 'info',
    });
  };


  const handlePreviewScreensaver = () => {
    window.dispatchEvent(new CustomEvent('meplus:trigger-screensaver-preview'));
    window.dispatchEvent(
      new CustomEvent('meplus:trigger-screensaver-preview', {
        detail: { style: idleStyle },
      })
    );
  };

  const presetAvatars = [
    'https://api.dicebear.com/7.x/adventurer/svg?seed=Alex&backgroundColor=b6e3f4',
    'https://api.dicebear.com/7.x/adventurer/svg?seed=Aneka&backgroundColor=ffd5dc',
    'https://api.dicebear.com/7.x/adventurer/svg?seed=Felix&backgroundColor=d1d4f9',
    'https://api.dicebear.com/7.x/adventurer/svg?seed=Luna&backgroundColor=c0aede',
    'https://api.dicebear.com/7.x/adventurer/svg?seed=Oliver&backgroundColor=ffdfbf',
    'https://api.dicebear.com/7.x/bottts/svg?seed=Cosmo&backgroundColor=b6e3f4',
    'https://api.dicebear.com/7.x/avataaars/svg?seed=Maya&backgroundColor=ffd5dc',
    'https://api.dicebear.com/7.x/lorelei/svg?seed=Leo&backgroundColor=d1d4f9',
  ];

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    updateUserProfile({
      name,
      title,
      avatar,
      bio,
      notificationSettings: {
        email: emailAlerts,
        sms: smsAlerts,
        browser: browserAlerts,
        sound: soundAlerts,
        deadlineReminderHours: user?.notificationSettings?.deadlineReminderHours || 24,
      },
      idleSettings: {
        enabled: idleEnabled,
        timeoutMinutes: idleTimeout,
        style: idleStyle,
      },
      accentColor,
    });
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Convert file to optimized Base64 Data URL so it can be saved locally and synchronized permanently
    const reader = new FileReader();
    reader.onload = event => {
      const rawDataUrl = event.target?.result as string;
      if (!rawDataUrl) return;

      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_SIZE = 256;
        let width = img.width;
        let height = img.height;
        if (width > height) {
          if (width > MAX_SIZE) {
            height = Math.round((height * MAX_SIZE) / width);
            width = MAX_SIZE;
          }
        } else {
          if (height > MAX_SIZE) {
            width = Math.round((width * MAX_SIZE) / height);
            height = MAX_SIZE;
          }
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        let finalUrl = rawDataUrl;
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          finalUrl = canvas.toDataURL('image/jpeg', 0.85);
        }

        setAvatar(finalUrl);
        // Persist immediately like real applications (Slack, GitHub, Twitter)
        updateUserProfile({ avatar: finalUrl }, { silent: true });
        showToast({
          title: 'Photo Uploaded! 🎨',
          message: 'Your profile photo has been updated and permanently saved.',
          type: 'success',
        });
      };
      img.onerror = () => {
        setAvatar(rawDataUrl);
        updateUserProfile({ avatar: rawDataUrl }, { silent: true });
      };
      img.src = rawDataUrl;
    };
    reader.readAsDataURL(file);
    // Reset file input value so user can upload the same file again if desired
    e.target.value = '';
  };


  return (
    <div className="space-y-6 max-w-4xl mx-auto animate-fade-in pb-12">
      {/* View Header */}
      <div>
        <h1 className="text-xl md:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
          Profile &amp; Settings
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
          Update your profile picture, name, bio, and notification preferences.
        </p>
      </div>

      {/* Profile Form */}
      <form
        onSubmit={handleSaveProfile}
        className="p-4 sm:p-6 md:p-8 rounded-2xl sm:rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 shadow-sm space-y-5 sm:space-y-6"
      >
        {/* Profile Picture Section */}
        <div className="pb-6 border-b border-slate-100 dark:border-slate-800">
          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-3">
            Profile Photo
          </label>
          <div className="flex flex-col sm:flex-row sm:items-center gap-5">
            <div className="relative group self-start">
              <img
                src={avatar}
                alt={name || 'Profile'}
                className="w-20 h-20 sm:w-24 sm:h-24 rounded-3xl object-cover ring-4 ring-emerald-500/30 shadow-md"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="absolute inset-0 rounded-3xl bg-slate-950/40 text-white flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-xs cursor-pointer"
                title="Upload Photo"
              >
                <Camera className="w-5 h-5" />
                <span className="text-[10px] font-bold mt-1">Change</span>
              </button>
            </div>

            <div className="space-y-2.5">
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="px-4 py-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 text-emerald-800 dark:text-emerald-300 text-xs font-bold border border-emerald-200 dark:border-emerald-800 transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>Upload From Computer</span>
                </button>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleImageUpload}
                  accept="image/*"
                  className="hidden"
                />
              </div>

              {/* Preset Avatars */}
              <div>
                <span className="text-[11px] text-slate-400 block mb-1.5 font-medium">
                  Or pick a preset avatar:
                </span>
                <div className="flex flex-wrap items-center gap-2">
                  {presetAvatars.map((url, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => {
                        setAvatar(url);
                        updateUserProfile({ avatar: url });
                      }}
                      className={`relative rounded-2xl overflow-hidden ring-2 transition-transform cursor-pointer ${
                        avatar === url
                          ? 'ring-emerald-600 scale-110 shadow-sm shadow-emerald-600/30'
                          : 'ring-transparent opacity-75 hover:opacity-100 hover:scale-105'
                      }`}
                      title={`Animated Avatar Preset ${idx + 1}`}
                    >
                      <img src={url} alt={`Animated Preset ${idx + 1}`} className="w-8 h-8 object-cover bg-slate-100 dark:bg-slate-800" />
                      {avatar === url && (
                        <span className="absolute inset-0 bg-emerald-600/30 flex items-center justify-center">
                          <Check className="w-3.5 h-3.5 text-white" />
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Name and Professional Title */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Full Name *
            </label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="e.g. Alex Rivera"
              className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-xs md:text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-semibold"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Professional Title / What You Do
            </label>
            <input
              type="text"
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="e.g. Graphic Designer, Freelance Writer, Photographer, Consultant"
              className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-xs md:text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
            Short Bio / About Yourself
          </label>
          <textarea
            value={bio}
            onChange={e => setBio(e.target.value)}
            rows={3}
            placeholder="Tell clients a bit about your freelance services, experience, and background."
            className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-xs md:text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>

        <div className="flex justify-end pt-2">
          <button
            type="submit"
            className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-whatsapp-teal hover:from-emerald-700 hover:to-whatsapp-dark text-white text-xs md:text-sm font-bold shadow-md shadow-emerald-700/25 active:scale-95 transition-all cursor-pointer"
          >
            Save Profile
          </button>
        </div>
      </form>

      {/* Appearance & Navigation Customization */}
      <div className="p-4 sm:p-6 md:p-8 rounded-2xl sm:rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 shadow-sm space-y-5 sm:space-y-6">
        <div className="flex items-center gap-3 pb-4 border-b border-slate-100 dark:border-slate-800">
          <div className="p-2.5 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white shadow-md shadow-emerald-700/20">
            <Palette className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white">
              Appearance &amp; Navigation Styling
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Personalize colors, contrast, and left sidebar appearance to reduce glare and differentiate workspaces
            </p>
          </div>
        </div>

        {/* Global Color Theme Toggle */}
        <div>
          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">
            Color Scheme
          </label>
          <div className="grid grid-cols-3 gap-3 max-w-md">
            <button
              type="button"
              onClick={() => setTheme('light')}
              className={`p-3 rounded-2xl border text-center transition-all flex flex-col items-center gap-2 cursor-pointer ${
                theme === 'light'
                  ? 'border-emerald-500 bg-emerald-50/50 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300 font-bold ring-2 ring-emerald-500/20 shadow-xs'
                  : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 text-slate-600 dark:text-slate-300'
              }`}
            >
              <Sun className="w-4 h-4 text-amber-500" />
              <span className="text-xs font-semibold">Light Mode</span>
            </button>

            <button
              type="button"
              onClick={() => setTheme('dark')}
              className={`p-3 rounded-2xl border text-center transition-all flex flex-col items-center gap-2 cursor-pointer ${
                theme === 'dark'
                  ? 'border-emerald-500 bg-emerald-50/50 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300 font-bold ring-2 ring-emerald-500/20 shadow-xs'
                  : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 text-slate-600 dark:text-slate-300'
              }`}
            >
              <Moon className="w-4 h-4 text-indigo-400" />
              <span className="text-xs font-semibold">Dark Mode</span>
            </button>

            <button
              type="button"
              onClick={() => setTheme('system')}
              className={`p-3 rounded-2xl border text-center transition-all flex flex-col items-center gap-2 cursor-pointer ${
                theme === 'system'
                  ? 'border-emerald-500 bg-emerald-50/50 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300 font-bold ring-2 ring-emerald-500/20 shadow-xs'
                  : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 text-slate-600 dark:text-slate-300'
              }`}
            >
              <Layout className="w-4 h-4 text-slate-500" />
              <span className="text-xs font-semibold">System Auto</span>
            </button>
          </div>
        </div>

        {/* Primary Accent Color Switcher (1-Click Color Themes) */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                Primary Accent Color (1-Click Full UI Theme)
              </label>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Instantly transforms buttons, navigation tabs, status badges, focus rings, and highlights across the entire platform
              </p>
            </div>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
              Live Switcher
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 pt-1">
            {[
              {
                id: 'emerald' as const,
                name: 'Emerald Green',
                desc: 'WhatsApp & Natural',
                previewBg: 'bg-[#10b981]',
              },
              {
                id: 'rose' as const,
                name: 'Rose Pink',
                desc: 'Vibrant & Creative',
                previewBg: 'bg-[#f43f5e]',
              },
              {
                id: 'blue' as const,
                name: 'Ocean Blue',
                desc: 'Clean & Trustworthy',
                previewBg: 'bg-[#3b82f6]',
              },
              {
                id: 'purple' as const,
                name: 'Royal Purple',
                desc: 'Deep & Elegant',
                previewBg: 'bg-[#8b5cf6]',
              },
              {
                id: 'amber' as const,
                name: 'Sunset Amber',
                desc: 'Warm & Energetic',
                previewBg: 'bg-[#f59e0b]',
              },
            ].map(c => (
              <button
                key={c.id}
                type="button"
                onClick={() => setAccentColor(c.id)}
                className={`p-3.5 rounded-2xl border text-left transition-all relative cursor-pointer group ${
                  accentColor === c.id
                    ? 'border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/40 ring-2 ring-emerald-500/20 shadow-xs'
                    : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
                }`}
              >
                <div className="flex items-center gap-2 mb-2">
                  <span className={`w-4 h-4 rounded-full ${c.previewBg} shadow-sm group-hover:scale-110 transition-transform`} />
                  <span className="text-xs font-bold text-slate-900 dark:text-white">
                    {c.name}
                  </span>
                  {accentColor === c.id && (
                    <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 ml-auto" />
                  )}
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-tight">
                  {c.desc}
                </p>
              </button>
            ))}
          </div>

          {/* Live Preview Sample */}
          <div className="mt-3.5 p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/70 dark:border-slate-700/70 flex flex-wrap items-center justify-between gap-3 text-xs">
            <span className="text-slate-600 dark:text-slate-400 font-medium">
              Live Preview with your chosen color:
            </span>
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 rounded-xl bg-emerald-600 text-white font-bold shadow-xs">
                Sample Button
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 font-bold text-[11px]">
                Active Badge
              </span>
              <span className="text-emerald-600 dark:text-emerald-400 font-bold">
                Highlighted Text
              </span>
            </div>
          </div>
        </div>

        {/* Left Sidebar Contrast & Color Mode */}
        <div>
          <div className="mb-2">
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
              Left Navigation Bar Style (Light Theme)
            </label>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Choose a distinct tone for the left sidebar so it doesn't blend into the white content area
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-1">
            {/* Slate (Default) */}
            <button
              type="button"
              onClick={() => setSidebarTheme('slate')}
              className={`p-3.5 rounded-2xl border text-left transition-all relative cursor-pointer ${
                sidebarTheme === 'slate'
                  ? 'border-emerald-500 bg-slate-100/90 dark:bg-slate-800/80 ring-2 ring-emerald-500/30 shadow-xs'
                  : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
              }`}
            >
              <div className="flex items-center gap-2 mb-2">
                <span className="w-4 h-4 rounded-full bg-[#cbd5e1] border border-slate-400 shadow-2xs" />
                <span className="text-xs font-bold text-slate-900 dark:text-white">Cool Slate</span>
                {sidebarTheme === 'slate' && (
                  <span className={`ml-auto text-[10px] font-bold ${getIdleThemeStyles(accentColor).icon}`}>Active</span>
                )}
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-tight">
                Cool blue-gray tone with distinct contrast.
              </p>
            </button>

            {/* Soft Sage */}
            <button
              type="button"
              onClick={() => setSidebarTheme('sage')}
              className={`p-3.5 rounded-2xl border text-left transition-all relative cursor-pointer ${
                sidebarTheme === 'sage'
                  ? 'border-emerald-500 bg-emerald-50 dark:bg-slate-800/80 ring-2 ring-emerald-500/30 shadow-xs'
                  : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
              }`}
            >
              <div className="flex items-center gap-2 mb-2">
                <span className="w-4 h-4 rounded-full bg-[#82d6b3] border border-emerald-500 shadow-2xs" />
                <span className="text-xs font-bold text-slate-900 dark:text-white">Soft Sage</span>
                {sidebarTheme === 'sage' && (
                  <span className={`ml-auto text-[10px] font-bold ${getIdleThemeStyles(accentColor).icon}`}>Active</span>
                )}
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-tight">
                Fresh soothing sage green tone.
              </p>
            </button>

            {/* Deep Slate (High Contrast) */}
            <button
              type="button"
              onClick={() => setSidebarTheme('dark')}
              className={`p-3.5 rounded-2xl border text-left transition-all relative cursor-pointer ${
                sidebarTheme === 'dark'
                  ? 'border-emerald-500 bg-slate-50/80 dark:bg-slate-800/80 ring-2 ring-emerald-500/30 shadow-xs'
                  : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
              }`}
            >
              <div className="flex items-center gap-2 mb-2">
                <span className="w-4 h-4 rounded-full bg-slate-900 border border-slate-700 shadow-2xs" />
                <span className="text-xs font-bold text-slate-900 dark:text-white">Deep Slate</span>
                {sidebarTheme === 'dark' && (
                  <span className={`ml-auto text-[10px] font-bold ${getIdleThemeStyles(accentColor).icon}`}>Active</span>
                )}
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-tight">
                High-contrast dark sidebar for focus.
              </p>
            </button>

            {/* Classic White */}
            <button
              type="button"
              onClick={() => setSidebarTheme('white')}
              className={`p-3.5 rounded-2xl border text-left transition-all relative cursor-pointer ${
                sidebarTheme === 'white'
                  ? 'border-emerald-500 bg-slate-50/80 dark:bg-slate-800/80 ring-2 ring-emerald-500/30 shadow-xs'
                  : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
              }`}
            >
              <div className="flex items-center gap-2 mb-2">
                <span className="w-4 h-4 rounded-full bg-white border border-slate-300 shadow-2xs" />
                <span className="text-xs font-bold text-slate-900 dark:text-white">Classic White</span>
                {sidebarTheme === 'white' && (
                  <span className={`ml-auto text-[10px] font-bold ${getIdleThemeStyles(accentColor).icon}`}>Active</span>
                )}
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-tight">
                Minimal monochrome clean white.
              </p>
            </button>
          </div>
        </div>
      </div>

      {/* Idle Animation & Inactivity Screensaver */}
      <div className="p-4 sm:p-6 md:p-8 rounded-2xl sm:rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 shadow-sm space-y-5 sm:space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-gradient-to-tr from-emerald-600 to-whatsapp-teal text-white shadow-md shadow-emerald-700/20">
              <Sparkles className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-slate-900 dark:text-white">
                  Idle Animation &amp; Screensaver
                </h2>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${getIdleThemeStyles(accentColor).badge}`}>
                  2-Min Default
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Display an ambient screensaver when no mouse or keyboard activity is detected
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handlePreviewScreensaver}
            className={`self-start sm:self-auto flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-xs active:scale-95 ${getIdleThemeStyles(accentColor).previewBtn}`}
            title="Preview how the screensaver animation looks right now"
          >
            <Eye className={`w-3.5 h-3.5 ${getIdleThemeStyles(accentColor).icon}`} />
            <span>Preview Screensaver Now</span>
          </button>
        </div>

        {/* Master Toggle */}
        <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/70 dark:border-slate-700/70">
          <div>
            <span className="text-xs font-bold text-slate-900 dark:text-white block">
              Enable Inactivity Screensaver
            </span>
            <span className="text-[11px] text-slate-500 dark:text-slate-400">
              Turn off if you prefer the screen to remain static when away from your keyboard
            </span>
          </div>
          <button
            type="button"
            onClick={() => updateIdlePreferences({ enabled: !idleEnabled })}
            className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
              idleEnabled ? getIdleThemeStyles(accentColor).toggle : 'bg-slate-300 dark:bg-slate-700'
            }`}
          >
            <span
              className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                idleEnabled ? 'translate-x-5' : 'translate-x-0'
              }`}
            />
          </button>
        </div>

        {idleEnabled && (
          <>
            {/* Timeout Selection */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                  Inactivity Waiting Duration
                </label>
                <span className="text-[11px] text-slate-400">
                  Triggers after no mouse or keyboard input
                </span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  { value: 1, label: '1 Minute', desc: 'Quick testing' },
                  { value: 2, label: '2 Minutes', desc: 'Recommended default' },
                  { value: 5, label: '5 Minutes', desc: 'Standard pause' },
                  { value: 10, label: '10 Minutes', desc: 'Extended focus' },
                ].map(opt => {
                  const isSelected = idleTimeout === opt.value;
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => updateIdlePreferences({ timeoutMinutes: opt.value })}
                      className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                        isSelected
                          ? `${getIdleThemeStyles(accentColor).activeCard} font-bold`
                          : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-bold">{opt.label}</span>
                        {isSelected && (
                          <Check className={`w-3.5 h-3.5 ${getIdleThemeStyles(accentColor).icon}`} />
                        )}
                      </div>
                      <span className="text-[10px] text-slate-400 block">{opt.desc}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Animation Style Selection */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">
                Animation Theme &amp; Style
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {[
                  {
                    id: 'zen' as const,
                    title: 'Ambient Zen Ring',
                    desc: 'Breathing halo & minimal clock',
                    icon: Coffee,
                  },
                  {
                    id: 'clock' as const,
                    title: 'Studio Digital Clock',
                    desc: 'Digital LED & live chronometer',
                    icon: Timer,
                  },
                  {
                    id: 'particles' as const,
                    title: 'Celestial Constellation',
                    desc: 'Starfield & luxury serif clock',
                    icon: Sparkles,
                  },
                ].map(st => {
                  const Icon = st.icon;
                  const isSelected = idleStyle === st.id;
                  return (
                    <button
                      key={st.id}
                      type="button"
                      onClick={() => updateIdlePreferences({ style: st.id })}
                      className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer ${
                        isSelected
                          ? getIdleThemeStyles(accentColor).activeCard
                          : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-1.5">
                        <Icon className={`w-4 h-4 ${isSelected ? getIdleThemeStyles(accentColor).icon : 'text-slate-500 dark:text-slate-400'}`} />
                        <span className="text-xs font-bold text-slate-900 dark:text-white">
                          {st.title}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-tight">
                        {st.desc}
                      </p>
                    </button>
                  );
                })}
              </div>
            </div>

            <p className="text-[11px] text-slate-400 dark:text-slate-500 italic">
              Tip: Moving the mouse, tapping any key, or clicking "Resume Workspace" instantly returns you to your work with zero lost data.
            </p>
          </>
        )}
      </div>

      {/* Direct AI Tools & Workspace Guide (No Developer API Keys Required) */}
      <div className="p-4 sm:p-6 md:p-8 rounded-2xl sm:rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 shadow-sm space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-gradient-to-tr from-emerald-600 to-whatsapp-teal text-white shadow-md shadow-emerald-700/20">
              <Bot className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-slate-900 dark:text-white">
                  Direct AI Tools &amp; Assistant
                </h2>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                  No API Key Required
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Direct access to Google Gemini and OpenAI ChatGPT, plus the built-in Me Plus Guide
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setIsAiModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md shadow-emerald-700/20 active:scale-95 transition-all self-start sm:self-auto cursor-pointer"
          >
            <Sparkles className="w-4 h-4" />
            <span>Open In-App Guide</span>
          </button>
        </div>

        {/* Direct Access Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Google Gemini Direct */}
          <div className="p-4 sm:p-5 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 bg-slate-50/50 dark:bg-slate-800/40 flex flex-col justify-between hover:border-emerald-400/80 transition-all">
            <div>
              <div className="flex items-center justify-between mb-2.5">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-purple-600 text-white flex items-center justify-center font-bold text-xs shadow-sm">
                    G
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-slate-900 dark:text-white">Google Gemini</h3>
                    <span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">gemini.google.com</span>
                  </div>
                </div>
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-100 dark:bg-emerald-900 text-emerald-800 dark:text-emerald-200">
                  Direct Web Access
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-3 leading-relaxed">
                Research ideas, review proposals, and draft client communications.
              </p>
            </div>
            <a
              href="https://gemini.google.com"
              target="_blank"
              rel="noreferrer"
              className="py-2.5 px-4 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-xs font-bold flex items-center justify-center gap-2 shadow-sm transition-all"
            >
              <span>Launch Google Gemini</span>
              <ArrowUpRight className="w-4 h-4" />
            </a>
          </div>

          {/* OpenAI ChatGPT Direct */}
          <div className="p-4 sm:p-5 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 bg-slate-50/50 dark:bg-slate-800/40 flex flex-col justify-between hover:border-cyan-400/80 transition-all">
            <div>
              <div className="flex items-center justify-between mb-2.5">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-teal-600 to-emerald-600 text-white flex items-center justify-center font-bold text-xs shadow-sm">
                    <Bot className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-slate-900 dark:text-white">OpenAI ChatGPT</h3>
                    <span className="text-[10px] font-semibold text-cyan-600 dark:text-cyan-400">chatgpt.com</span>
                  </div>
                </div>
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-cyan-100 dark:bg-cyan-900 text-cyan-800 dark:text-cyan-200">
                  Direct Web Access
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-3 leading-relaxed">
                Draft freelance contracts, write proposals, and negotiate terms.
              </p>
            </div>
            <a
              href="https://chatgpt.com"
              target="_blank"
              rel="noreferrer"
              className="py-2.5 px-4 rounded-xl bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 text-white text-xs font-bold flex items-center justify-center gap-2 shadow-sm transition-all"
            >
              <span>Launch OpenAI ChatGPT</span>
              <ArrowUpRight className="w-4 h-4" />
            </a>
          </div>
        </div>
      </div>

      {/* Notifications & Sound Settings */}
      <div className="p-4 sm:p-6 md:p-8 rounded-2xl sm:rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 shadow-sm space-y-4">
        <div className="flex items-center gap-3 pb-4 border-b border-slate-100 dark:border-slate-800">
          <div className="p-2.5 rounded-xl bg-emerald-600 text-white shadow-md shadow-emerald-700/20">
            <Bell className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white">
              Notifications &amp; Reminders
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Control how you get alerted for task deadlines and updates
            </p>
          </div>
        </div>

        <div className="space-y-3">
          <label className="flex items-center justify-between p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-700/60 cursor-pointer hover:border-emerald-500/40 transition-colors">
            <div>
              <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 block">
                Email Notifications for Upcoming Deadlines
              </span>
              <span className="text-[10px] text-slate-500 dark:text-slate-400">
                Receive daily summaries and deadline digest reminders via email
              </span>
            </div>
            <input
              type="checkbox"
              checked={emailAlerts}
              onChange={e => handleToggleNotificationSetting('email', e.target.checked)}
              className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 cursor-pointer"
            />
          </label>

          <label className="flex items-center justify-between p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-700/60 cursor-pointer hover:border-emerald-500/40 transition-colors">
            <div>
              <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 block">
                SMS Urgent Alerts
              </span>
              <span className="text-[10px] text-slate-500 dark:text-slate-400">
                Automated SMS pings via Twilio for deliverables due within 24 hours
              </span>
            </div>
            <input
              type="checkbox"
              checked={smsAlerts}
              onChange={e => handleToggleNotificationSetting('sms', e.target.checked)}
              className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 cursor-pointer"
            />
          </label>

          <label className="flex items-center justify-between p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-700/60 cursor-pointer hover:border-emerald-500/40 transition-colors">
            <div>
              <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 block">
                In-App Audio Sound Feedback on Timer &amp; Alerts
              </span>
              <span className="text-[10px] text-slate-500 dark:text-slate-400">
                Audible Web Audio chime played on deadlines and Pomodoro timer intervals
              </span>
            </div>
            <input
              type="checkbox"
              checked={soundAlerts}
              onChange={e => handleToggleNotificationSetting('sound', e.target.checked)}
              className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 cursor-pointer"
            />
          </label>
        </div>
      </div>

      {/* University Presentation & Demo Data */}
      <div className="p-4 sm:p-6 md:p-8 rounded-2xl sm:rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 shadow-sm space-y-4">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-indigo-600 text-white shadow-md shadow-indigo-700/20">
              <GraduationCap className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                HCI University Presentation &amp; Demo Data
                <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 border border-indigo-200/60 dark:border-indigo-800/50">
                  Viva Ready
                </span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Instantly restore realistic, cohesive sample data across Clients, Projects, Kanban, Time Logs, and Invoices.
              </p>
            </div>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-indigo-50/70 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-900/40 text-xs text-slate-700 dark:text-slate-300 space-y-2">
          <div className="font-semibold text-indigo-900 dark:text-indigo-300 flex items-center gap-1.5">
            <span>✨ Included in Presentation Preset:</span>
          </div>
          <ul className="grid grid-cols-1 md:grid-cols-2 gap-2 text-[11px] text-slate-600 dark:text-slate-400">
            <li className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-500"></span>
              <span><strong>5 Clients</strong> (Nova Studio, FinTech Pulse, EduVerse, Apex IoT, BioHealth)</span>
            </li>
            <li className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-500"></span>
              <span><strong>5 Projects</strong> with realistic budgets, timelines &amp; progress</span>
            </li>
            <li className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-500"></span>
              <span><strong>8 Tasks</strong> distributed across all 4 Kanban board columns</span>
            </li>
            <li className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-500"></span>
              <span><strong>6 Time Logs</strong> (~17.5h) tracking project work time &amp; CSV export</span>
            </li>
            <li className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-500"></span>
              <span><strong>4 Invoices</strong> demonstrating Paid ($3.5k), Sent ($6.5k), Overdue ($2.2k) &amp; Draft ($2.8k)</span>
            </li>
            <li className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-500"></span>
              <span><strong>5 Notifications</strong> with deadline warnings and payment alerts</span>
            </li>
          </ul>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
          <p className="text-[11px] text-slate-500 dark:text-slate-400">
            Use this button during your presentation to quickly clean up and return to the showcase baseline.
          </p>
          <button
            type="button"
            onClick={resetDemoData}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-xs text-white bg-indigo-600 hover:bg-indigo-700 active:scale-[0.98] transition shadow-md shadow-indigo-600/20"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Reset Demo Presentation Data</span>
          </button>
        </div>
      </div>
    </div>
  );
};
