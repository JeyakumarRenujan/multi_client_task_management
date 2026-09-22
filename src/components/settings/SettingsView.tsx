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
  Eye,
  EyeOff,
  Coffee,
  Bot,
  Cpu,
  Key,
  ExternalLink,
  ShieldCheck,
  AlertCircle,
  Loader2,
  CheckCircle2,
  Zap,
  RotateCcw,
  GraduationCap,
} from 'lucide-react';
import { AiProvider, AiSettings } from '../../types';
import {
  AI_MODELS,
  getStoredAiSettings,
  saveStoredAiSettings,
  testAiConnection,
} from '../../services/aiService';

export const SettingsView: React.FC = () => {
  const {
    user,
    updateUserProfile,
    showToast,
    resetDemoData,
  } = useApp();

  const { theme, setTheme, actualTheme, toggleTheme, sidebarTheme, setSidebarTheme, accentColor, setAccentColor } = useTheme();

  const fileInputRef = useRef<HTMLInputElement>(null);

  const [name, setName] = useState(user?.name || '');
  const [title, setTitle] = useState(user?.title || '');
  const [bio, setBio] = useState(user?.bio || '');
  const [avatar, setAvatar] = useState(user?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=256');
  
  const [emailAlerts, setEmailAlerts] = useState(user?.notificationSettings?.email ?? true);
  const [smsAlerts, setSmsAlerts] = useState(user?.notificationSettings?.sms ?? true);
  const [browserAlerts, setBrowserAlerts] = useState(user?.notificationSettings?.browser ?? true);
  const [soundAlerts, setSoundAlerts] = useState(user?.notificationSettings?.sound ?? true);

  // Inactivity / Idle Screensaver Settings
  const [idleEnabled, setIdleEnabled] = useState(user?.idleSettings?.enabled ?? true);
  const [idleTimeout, setIdleTimeout] = useState<number>(user?.idleSettings?.timeoutMinutes ?? 2);
  const [idleStyle, setIdleStyle] = useState<'zen' | 'clock' | 'particles'>(user?.idleSettings?.style ?? 'zen');

  // AI Copilot Settings
  const initialAi = getStoredAiSettings(user);
  const [aiProvider, setAiProvider] = useState<AiProvider>(initialAi.provider || 'builtin');
  const [geminiKey, setGeminiKey] = useState(initialAi.geminiApiKey || '');
  const [openAiKey, setOpenAiKey] = useState(initialAi.openaiApiKey || '');
  const [geminiModel, setGeminiModel] = useState(initialAi.geminiModel || 'gemini-1.5-flash');
  const [openAiModel, setOpenAiModel] = useState(initialAi.openaiModel || 'gpt-4o-mini');
  const [aiInstructions, setAiInstructions] = useState(initialAi.customInstructions || '');
  const [showAiKey, setShowAiKey] = useState(false);
  const [isTestingAi, setIsTestingAi] = useState(false);
  const [aiTestResult, setAiTestResult] = useState<{
    success?: boolean;
    message?: string;
    latencyMs?: number;
  } | null>(null);

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
      if (user.aiSettings) {
        setAiProvider(user.aiSettings.provider || 'builtin');
        setGeminiKey(user.aiSettings.geminiApiKey || '');
        setOpenAiKey(user.aiSettings.openaiApiKey || '');
        setGeminiModel(user.aiSettings.geminiModel || 'gemini-1.5-flash');
        setOpenAiModel(user.aiSettings.openaiModel || 'gpt-4o-mini');
        setAiInstructions(user.aiSettings.customInstructions || '');
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

    updateUserProfile({
      idleSettings: {
        enabled: newEnabled,
        timeoutMinutes: newTimeout,
        style: newStyle,
      },
    });
  };

  const handleTestAi = async () => {
    if (aiProvider === 'builtin') {
      setAiTestResult({
        success: true,
        message: 'Built-in Smart Advisor is active and requires no API key.',
        latencyMs: 10,
      });
      return;
    }

    const key = aiProvider === 'gemini' ? geminiKey : openAiKey;
    const model = aiProvider === 'gemini' ? geminiModel : openAiModel;

    if (!key || !key.trim()) {
      setAiTestResult({
        success: false,
        message: `Please enter your ${aiProvider === 'gemini' ? 'Google Gemini' : 'OpenAI'} API key.`,
      });
      return;
    }

    setIsTestingAi(true);
    setAiTestResult(null);
    const res = await testAiConnection(aiProvider, key.trim(), model);
    setIsTestingAi(false);
    setAiTestResult(res);
  };

  const handleSaveAiSettings = () => {
    const updated: AiSettings = {
      provider: aiProvider,
      geminiApiKey: geminiKey.trim(),
      geminiModel,
      openaiApiKey: openAiKey.trim(),
      openaiModel: openAiModel,
      customInstructions: aiInstructions.trim(),
    };

    saveStoredAiSettings(updated);
    updateUserProfile({ aiSettings: updated });
    setAiTestResult(null);

    const providerLabel =
      updated.provider === 'gemini'
        ? 'Google Gemini (' + updated.geminiModel + ')'
        : updated.provider === 'openai'
        ? 'OpenAI ChatGPT (' + updated.openaiModel + ')'
        : 'Built-in Smart Advisor';

    showToast({
      title: 'AI Settings Saved',
      message: `Active copilot model set to ${providerLabel}.`,
      type: 'success',
    });
  };

  const handlePreviewScreensaver = () => {
    window.dispatchEvent(new CustomEvent('meplus:trigger-screensaver-preview'));
  };

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
      idleSettings: {
        enabled: idleEnabled,
        timeoutMinutes: idleTimeout,
        style: idleStyle,
      },
      aiSettings: {
        provider: aiProvider,
        geminiApiKey: geminiKey.trim(),
        geminiModel,
        openaiApiKey: openAiKey.trim(),
        openaiModel: openAiModel,
        customInstructions: aiInstructions.trim(),
      },
      accentColor,
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
            className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-whatsapp-teal hover:from-emerald-700 hover:to-whatsapp-dark text-white text-xs md:text-sm font-bold shadow-md shadow-emerald-700/25 active:scale-95 transition-all cursor-pointer"
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

      {/* Idle Animation & Inactivity Screensaver */}
      <div className="p-6 md:p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 shadow-sm space-y-6">
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
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
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
            className="self-start sm:self-auto flex items-center gap-2 px-3.5 py-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 text-xs font-bold transition-all cursor-pointer shadow-xs active:scale-95"
            title="Preview how the screensaver animation looks right now"
          >
            <Eye className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
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
              idleEnabled ? 'bg-emerald-600' : 'bg-slate-300 dark:bg-slate-700'
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
                ].map(opt => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => updateIdlePreferences({ timeoutMinutes: opt.value })}
                    className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                      idleTimeout === opt.value
                        ? 'border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 ring-2 ring-emerald-500/20 font-bold shadow-xs'
                        : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-bold">{opt.label}</span>
                      {idleTimeout === opt.value && (
                        <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                      )}
                    </div>
                    <span className="text-[10px] text-slate-400 block">{opt.desc}</span>
                  </button>
                ))}
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
                    desc: 'Calming breathing rhythm circle, motivating quote, and live digital clock',
                    icon: Coffee,
                  },
                  {
                    id: 'clock' as const,
                    title: 'Digital Clock & Focus',
                    desc: 'Minimalist large typography clock and active workspace summary',
                    icon: Timer,
                  },
                  {
                    id: 'particles' as const,
                    title: 'Floating Starfield',
                    desc: 'Organic glowing teal particle flow and restful ambient backdrop',
                    icon: Sparkles,
                  },
                ].map(st => {
                  const Icon = st.icon;
                  return (
                    <button
                      key={st.id}
                      type="button"
                      onClick={() => updateIdlePreferences({ style: st.id })}
                      className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer ${
                        idleStyle === st.id
                          ? 'border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 ring-2 ring-emerald-500/20 shadow-xs'
                          : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-1.5">
                        <Icon className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
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

      {/* AI Copilot & Models Configuration */}
      <div className="p-6 md:p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-gradient-to-tr from-emerald-600 to-whatsapp-teal text-white shadow-md shadow-emerald-700/20">
              <Bot className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-slate-900 dark:text-white">
                  AI Copilot &amp; Models Configuration
                </h2>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                  {aiProvider === 'gemini' ? 'Gemini Live' : aiProvider === 'openai' ? 'ChatGPT Live' : 'Built-in Advisor'}
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Connect your Google Gemini or OpenAI account for real generative intelligence across all workspace tools
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {aiProvider !== 'builtin' && (
              <button
                type="button"
                onClick={handleTestAi}
                disabled={isTestingAi}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold transition-all shadow-xs disabled:opacity-50"
              >
                {isTestingAi ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Testing...</span>
                  </>
                ) : (
                  <>
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                    <span>Test Connection</span>
                  </>
                )}
              </button>
            )}

            <button
              type="button"
              onClick={handleSaveAiSettings}
              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md shadow-emerald-700/20 active:scale-95 transition-all"
            >
              Save AI Settings
            </button>
          </div>
        </div>

        {/* Provider Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* Google Gemini */}
          <button
            type="button"
            onClick={() => {
              setAiProvider('gemini');
              setAiTestResult(null);
            }}
            className={`p-4 rounded-2xl border text-left flex flex-col justify-between transition-all cursor-pointer ${
              aiProvider === 'gemini'
                ? 'border-emerald-500 bg-emerald-50/60 dark:bg-emerald-950/40 ring-2 ring-emerald-500/25 shadow-xs'
                : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
            }`}
          >
            <div className="flex items-center justify-between w-full mb-2">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span className="text-xs font-bold text-slate-900 dark:text-white">Google Gemini</span>
              </div>
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-100 dark:bg-emerald-900 text-emerald-800 dark:text-emerald-200">
                Free Tier
              </span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              High speed &amp; quality. Generous free API limits on Google AI Studio.
            </p>
          </button>

          {/* OpenAI ChatGPT */}
          <button
            type="button"
            onClick={() => {
              setAiProvider('openai');
              setAiTestResult(null);
            }}
            className={`p-4 rounded-2xl border text-left flex flex-col justify-between transition-all cursor-pointer ${
              aiProvider === 'openai'
                ? 'border-cyan-500 bg-cyan-50/60 dark:bg-cyan-950/40 ring-2 ring-cyan-500/25 shadow-xs'
                : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
            }`}
          >
            <div className="flex items-center justify-between w-full mb-2">
              <div className="flex items-center gap-2">
                <Bot className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
                <span className="text-xs font-bold text-slate-900 dark:text-white">OpenAI ChatGPT</span>
              </div>
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-cyan-100 dark:bg-cyan-900 text-cyan-800 dark:text-cyan-200">
                GPT-4o
              </span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Connect directly to GPT-4o Mini or GPT-4o using your OpenAI API key.
            </p>
          </button>

          {/* Built-in Smart Advisor */}
          <button
            type="button"
            onClick={() => {
              setAiProvider('builtin');
              setAiTestResult(null);
            }}
            className={`p-4 rounded-2xl border text-left flex flex-col justify-between transition-all cursor-pointer ${
              aiProvider === 'builtin'
                ? 'border-amber-500 bg-amber-50/60 dark:bg-amber-950/40 ring-2 ring-amber-500/25 shadow-xs'
                : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
            }`}
          >
            <div className="flex items-center justify-between w-full mb-2">
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-amber-500" />
                <span className="text-xs font-bold text-slate-900 dark:text-white">Built-in Copilot</span>
              </div>
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-100 dark:bg-amber-900 text-amber-800 dark:text-amber-200">
                No Key
              </span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Intelligent freelance rule templates &amp; workspace digest without external accounts.
            </p>
          </button>
        </div>

        {/* Model & API Key Configuration */}
        {aiProvider === 'gemini' && (
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
              <label className="text-xs font-bold text-slate-800 dark:text-slate-200">
                Selected Gemini Model
              </label>
              <a
                href="https://aistudio.google.com/app/apikey"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-600 hover:text-emerald-700 hover:underline"
              >
                <span>Get a free Google Gemini API Key at Google AI Studio</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>

            <select
              value={geminiModel}
              onChange={e => setGeminiModel(e.target.value)}
              className="w-full px-3.5 py-2.5 text-xs rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              {AI_MODELS.gemini.map(m => (
                <option key={m.id} value={m.id}>
                  {m.name} — {m.description}
                </option>
              ))}
            </select>

            <div>
              <label className="text-xs font-bold text-slate-800 dark:text-slate-200 mb-1.5 block">
                Google Gemini API Key
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Key className="w-4 h-4" />
                </div>
                <input
                  type={showAiKey ? 'text' : 'password'}
                  value={geminiKey}
                  onChange={e => setGeminiKey(e.target.value)}
                  placeholder="AIzaSy..."
                  className="w-full pl-10 pr-10 py-2.5 text-xs rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 text-slate-800 dark:text-slate-200 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono"
                />
                <button
                  type="button"
                  onClick={() => setShowAiKey(!showAiKey)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                >
                  {showAiKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
          </div>
        )}

        {aiProvider === 'openai' && (
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
              <label className="text-xs font-bold text-slate-800 dark:text-slate-200">
                Selected OpenAI Model
              </label>
              <a
                href="https://platform.openai.com/api-keys"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 text-xs font-semibold text-cyan-600 hover:text-cyan-700 hover:underline"
              >
                <span>Get your OpenAI API Key at platform.openai.com</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>

            <select
              value={openAiModel}
              onChange={e => setOpenAiModel(e.target.value)}
              className="w-full px-3.5 py-2.5 text-xs rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              {AI_MODELS.openai.map(m => (
                <option key={m.id} value={m.id}>
                  {m.name} — {m.description}
                </option>
              ))}
            </select>

            <div>
              <label className="text-xs font-bold text-slate-800 dark:text-slate-200 mb-1.5 block">
                OpenAI API Key
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Key className="w-4 h-4" />
                </div>
                <input
                  type={showAiKey ? 'text' : 'password'}
                  value={openAiKey}
                  onChange={e => setOpenAiKey(e.target.value)}
                  placeholder="sk-proj-..."
                  className="w-full pl-10 pr-10 py-2.5 text-xs rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 text-slate-800 dark:text-slate-200 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono"
                />
                <button
                  type="button"
                  onClick={() => setShowAiKey(!showAiKey)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                >
                  {showAiKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Custom Instructions Textarea */}
        <div>
          <label className="text-xs font-bold text-slate-800 dark:text-slate-200 mb-1.5 block">
            Custom System Instructions / Persona Guidance (Optional)
          </label>
          <textarea
            value={aiInstructions}
            onChange={e => setAiInstructions(e.target.value)}
            rows={2}
            placeholder="e.g. Always write polite but firm email drafts under 150 words. Suggest a 20% margin on all project scope change estimates."
            className="w-full px-3.5 py-2.5 text-xs rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>

        {/* Connection Test Banner */}
        {aiTestResult && (
          <div
            className={`p-3.5 rounded-2xl text-xs flex items-start gap-2.5 ${
              aiTestResult.success
                ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-900 dark:text-emerald-200 border border-emerald-200 dark:border-emerald-800'
                : 'bg-rose-50 dark:bg-rose-950/60 text-rose-900 dark:text-rose-200 border border-rose-200 dark:border-rose-800'
            }`}
          >
            {aiTestResult.success ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
            )}
            <div>
              <div className="font-semibold">{aiTestResult.message}</div>
              {aiTestResult.latencyMs && (
                <div className="text-[10px] opacity-75 mt-0.5">
                  Latency: {aiTestResult.latencyMs}ms
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Notifications & Sound Settings */}
      <div className="p-6 md:p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 shadow-sm space-y-4">
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

      {/* University Presentation & Demo Data */}
      <div className="p-6 md:p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 shadow-sm space-y-4">
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
              <span><strong>6 Time Logs</strong> (~17.5h) with billable rates &amp; CSV export</span>
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
