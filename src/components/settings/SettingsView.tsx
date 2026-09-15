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
} from 'lucide-react';

export const SettingsView: React.FC = () => {
  const {
    user,
    updateUserProfile,
  } = useApp();

  const { theme, setTheme, actualTheme, toggleTheme, sidebarTheme, setSidebarTheme } = useTheme();

  const fileInputRef = useRef<HTMLInputElement>(null);

  const [name, setName] = useState(user?.name || '');
  const [title, setTitle] = useState(user?.title || '');
  const [bio, setBio] = useState(user?.bio || '');
  const [avatar, setAvatar] = useState(user?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=256');
  
  const [emailAlerts, setEmailAlerts] = useState(user?.notificationSettings?.email ?? true);
  const [smsAlerts, setSmsAlerts] = useState(user?.notificationSettings?.sms ?? true);
  const [browserAlerts, setBrowserAlerts] = useState(user?.notificationSettings?.browser ?? true);
  const [soundAlerts, setSoundAlerts] = useState(user?.notificationSettings?.sound ?? true);

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
    }
  }, [user]);

  const presetAvatars = [
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=256',
    'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=256',
    'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=256',
    'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=256',
    'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=256',
    'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&q=80&w=256',
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
    });
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Convert file to optimized Base64 Data URL so it can be saved locally and synchronized
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
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.88);
          setAvatar(compressedDataUrl);
        } else {
          setAvatar(rawDataUrl);
        }
      };
      img.onerror = () => {
        setAvatar(rawDataUrl);
      };
      img.src = rawDataUrl;
    };
    reader.readAsDataURL(file);
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
        className="p-6 md:p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 shadow-sm space-y-6"
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
                <div className="flex items-center gap-2">
                  {presetAvatars.map((url, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setAvatar(url)}
                      className={`relative rounded-xl overflow-hidden ring-2 transition-transform cursor-pointer ${
                        avatar === url
                          ? 'ring-emerald-600 scale-110'
                          : 'ring-transparent opacity-70 hover:opacity-100'
                      }`}
                    >
                      <img src={url} alt="preset" className="w-8 h-8 object-cover" />
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
            className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-[#128C7E] hover:from-emerald-700 hover:to-[#075E54] text-white text-xs md:text-sm font-bold shadow-md shadow-emerald-700/25 active:scale-95 transition-all cursor-pointer"
          >
            Save Profile
          </button>
        </div>
      </form>

      {/* Appearance & Navigation Customization */}
      <div className="p-6 md:p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 shadow-sm space-y-6">
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

        {/* Left Sidebar Contrast & Color Mode */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                Left Navigation Bar Style (Light Theme)
              </label>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Choose a distinct tone for the left sidebar so it doesn't blend into the white content area
              </p>
            </div>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
              HCI Heuristic #7
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-1">
            {/* Slate (Default) */}
            <button
              type="button"
              onClick={() => setSidebarTheme('slate')}
              className={`p-3.5 rounded-2xl border text-left transition-all relative cursor-pointer ${
                sidebarTheme === 'slate'
                  ? 'border-emerald-500 bg-slate-50/80 dark:bg-slate-800/80 ring-2 ring-emerald-500/30 shadow-xs'
                  : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
              }`}
            >
              <div className="flex items-center gap-2 mb-2">
                <span className="w-4 h-4 rounded-full bg-[#eef2f6] border border-slate-300 shadow-2xs" />
                <span className="text-xs font-bold text-slate-900 dark:text-white">Cool Slate</span>
                {sidebarTheme === 'slate' && (
                  <span className="ml-auto text-[10px] font-bold text-emerald-600">Active</span>
                )}
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-tight">
                Modern soft blue-gray tone. Differentiates sidebar without strong contrast.
              </p>
            </button>

            {/* Soft Sage */}
            <button
              type="button"
              onClick={() => setSidebarTheme('sage')}
              className={`p-3.5 rounded-2xl border text-left transition-all relative cursor-pointer ${
                sidebarTheme === 'sage'
                  ? 'border-emerald-500 bg-emerald-50/40 dark:bg-slate-800/80 ring-2 ring-emerald-500/30 shadow-xs'
                  : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
              }`}
            >
              <div className="flex items-center gap-2 mb-2">
                <span className="w-4 h-4 rounded-full bg-[#edf6f2] border border-emerald-300 shadow-2xs" />
                <span className="text-xs font-bold text-slate-900 dark:text-white">Soft Sage</span>
                {sidebarTheme === 'sage' && (
                  <span className="ml-auto text-[10px] font-bold text-emerald-600">Active</span>
                )}
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-tight">
                Branded subtle teal/mint tint. Pairs harmoniously with emerald accents.
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
                  <span className="ml-auto text-[10px] font-bold text-emerald-600">Active</span>
                )}
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-tight">
                High contrast dark sidebar in light mode (Slack &amp; Stripe style).
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
                <span className="w-4 h-4 rounded-full bg-white border border-slate-200 shadow-2xs" />
                <span className="text-xs font-bold text-slate-900 dark:text-white">Classic White</span>
                {sidebarTheme === 'white' && (
                  <span className="ml-auto text-[10px] font-bold text-emerald-600">Active</span>
                )}
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-tight">
                Monochrome minimal all-white clean aesthetic.
              </p>
            </button>
          </div>
        </div>
      </div>

      {/* Notifications & Sound Settings */}
      <div className="p-6 md:p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 shadow-sm space-y-4">
        <div className="flex items-center gap-3 pb-4 border-b border-slate-100 dark:border-slate-800">
          <div className="p-2.5 rounded-xl bg-[#128C7E] text-white shadow-md shadow-emerald-700/20">
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
          <label className="flex items-center justify-between p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-700/60 cursor-pointer">
            <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">
              Email Notifications for Upcoming Deadlines
            </span>
            <input
              type="checkbox"
              checked={emailAlerts}
              onChange={e => setEmailAlerts(e.target.checked)}
              className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500"
            />
          </label>

          <label className="flex items-center justify-between p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-700/60 cursor-pointer">
            <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">
              SMS Urgent Alerts
            </span>
            <input
              type="checkbox"
              checked={smsAlerts}
              onChange={e => setSmsAlerts(e.target.checked)}
              className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500"
            />
          </label>

          <label className="flex items-center justify-between p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-700/60 cursor-pointer">
            <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">
              In-App Audio Sound Feedback on Timer &amp; Alerts
            </span>
            <input
              type="checkbox"
              checked={soundAlerts}
              onChange={e => setSoundAlerts(e.target.checked)}
              className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500"
            />
          </label>
        </div>
      </div>
    </div>
  );
};
