import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { useTheme } from '../../context/ThemeContext';
import { Logo } from '../common/Logo';
import {
  Mail,
  Lock,
  User,
  Briefcase,
  Sparkles,
  ArrowRight,
  CheckCircle2,
  Users,
  FolderKanban,
  Calendar,
  FileText,
  Clock,
  ShieldCheck,
  Zap,
  Eye,
  EyeOff,
  Sun,
  Moon,
  ArrowLeft,
  KeyRound,
  Check,
  AlertCircle,
  PenTool,
  RefreshCw,
  Inbox,
  Copy,
  Palette,
} from 'lucide-react';

export const AuthPage: React.FC = () => {
  const { login, register, forgotPassword, verifyOtp, resendOtp, resetPassword, loginDemoUser } = useApp();
  const { actualTheme, toggleTheme, accentColor, setAccentColor } = useTheme();
  const [isAccentMenuOpen, setIsAccentMenuOpen] = useState(false);
  const [mode, setMode] = useState<'login' | 'register' | 'forgot'>('login');

  // Form fields
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [name, setName] = useState('');
  const [profession, setProfession] = useState('Graphic Designer & Illustrator');
  const [customProfession, setCustomProfession] = useState('');

  // Password visibility
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Forgot password OTP flow state: 'email' -> 'otp' -> 'reset' -> 'success'
  const [forgotStep, setForgotStep] = useState<'email' | 'otp' | 'reset' | 'success'>('email');
  const [otp, setOtp] = useState('');
  const [otpPreview, setOtpPreview] = useState('');
  const [resetToken, setResetToken] = useState('');
  const [resendCooldown, setResendCooldown] = useState(0);
  const [isResending, setIsResending] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmNewPassword, setShowConfirmNewPassword] = useState(false);

  // Status & Feedback
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  const professionsList = [
    'Graphic Designer & Illustrator',
    'UI/UX & Product Designer',
    'Content Writer & Copywriter',
    'Photographer & Videographer',
    'Digital Marketing Specialist',
    'Virtual Assistant & Project Coordinator',
    'Business Consultant & Strategist',
    'Software & Web Developer',
    'Accountant & Bookkeeper',
    'Translator & Voice Artist',
    'General Freelancer',
    'Other (Specify your own)',
  ];

  useEffect(() => {
    let timer: ReturnType<typeof setInterval>;
    if (resendCooldown > 0) {
      timer = setInterval(() => {
        setResendCooldown(prev => (prev > 0 ? prev - 1 : 0));
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [resendCooldown]);

  const resetAllFormStates = (newMode: 'login' | 'register' | 'forgot') => {
    setMode(newMode);
    setError('');
    setSuccessMessage('');
    setPassword('');
    setConfirmPassword('');
    setNewPassword('');
    setConfirmNewPassword('');
    setOtp('');
    setOtpPreview('');
    setResetToken('');
    setResendCooldown(0);
    setForgotStep('email');
    setIsLoading(false);
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');

    if (!email || !email.includes('@')) {
      setError('Please enter a valid email address.');
      return;
    }

    if (!password) {
      setError('Please enter your password.');
      return;
    }

    setIsLoading(true);
    const res = await login(email, password);
    setIsLoading(false);

    if (!res.success && res.error) {
      setError(res.error);
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');

    if (!name.trim()) {
      setError('Please enter your full name.');
      return;
    }

    if (!email || !email.includes('@')) {
      setError('Please enter a valid email address.');
      return;
    }

    if (!password || password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match. Please verify and confirm your password.');
      return;
    }

    const isOther = profession === 'Other (Specify your own)';
    if (isOther && !customProfession.trim()) {
      setError('Please specify your custom freelance profession.');
      return;
    }

    const finalProfession = isOther ? customProfession.trim() : profession;

    setIsLoading(true);
    const res = await register(name, email, password, finalProfession);
    setIsLoading(false);

    if (!res.success && res.error) {
      setError(res.error);
    }
  };

  const handleForgotStep1Submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');

    if (!email || !email.includes('@')) {
      setError('Please enter a valid registered email address.');
      return;
    }

    setIsLoading(true);
    const res = await forgotPassword(email);
    setIsLoading(false);

    if (!res.success) {
      setError(res.error || 'No registered account found with this email.');
      return;
    }

    setOtpPreview(res.otpPreview || '');
    setResendCooldown(60);
    setForgotStep('otp');
    setSuccessMessage(res.message || `A 6-digit verification code has been sent to ${email}.`);
  };

  const handleForgotStep2OtpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');

    const cleanOtp = otp.trim();
    if (!cleanOtp || cleanOtp.length !== 6) {
      setError('Please enter the complete 6-digit verification code.');
      return;
    }

    setIsLoading(true);
    const res = await verifyOtp(email, cleanOtp);
    setIsLoading(false);

    if (!res.success) {
      setError(res.error || 'Invalid or expired verification code.');
      return;
    }

    setResetToken(res.resetToken || '');
    setForgotStep('reset');
    setSuccessMessage('Email verified successfully! You may now set your new password.');
  };

  const handleResendOtp = async () => {
    if (resendCooldown > 0 || isResending) return;
    setError('');
    setIsResending(true);
    const res = await resendOtp(email);
    setIsResending(false);

    if (!res.success) {
      setError(res.error || 'Failed to resend code.');
      return;
    }

    setOtpPreview(res.otpPreview || '');
    setResendCooldown(60);
    setSuccessMessage(res.message || 'A new 6-digit verification code has been sent to your email.');
  };

  const handleForgotStep3Submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');

    if (!newPassword || newPassword.length < 6) {
      setError('New password must be at least 6 characters long.');
      return;
    }

    if (newPassword !== confirmNewPassword) {
      setError('New passwords do not match. Please make sure both fields match.');
      return;
    }

    setIsLoading(true);
    const res = await resetPassword(email, newPassword, otp, resetToken);
    setIsLoading(false);

    if (!res.success) {
      setError(res.error || 'Failed to update password.');
      return;
    }

    setForgotStep('success');
    setSuccessMessage(res.message || 'Your password has been successfully updated! You can now sign in.');
  };

  return (
    <div className="min-h-screen overflow-y-auto overflow-x-hidden bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col justify-between selection:bg-emerald-500 selection:text-white transition-colors duration-200 relative">
      {/* Decorative Ambient Background Gradients & Grid Pattern */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {/* Top-left ambient primary glow */}
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-emerald-400/15 dark:bg-emerald-600/10 rounded-full blur-3xl" />
        {/* Center-right ambient brand glow */}
        <div className="absolute top-1/3 -right-32 w-[500px] h-[500px] bg-teal-400/15 dark:bg-whatsapp-teal/10 rounded-full blur-3xl" />
        {/* Bottom-left ambient light glow */}
        <div className="absolute -bottom-40 left-1/4 w-96 h-96 bg-whatsapp-light/10 dark:bg-emerald-500/10 rounded-full blur-3xl" />

        {/* Subtle geometric dot grid pattern */}
        <div className="absolute inset-0 bg-[radial-gradient(currentColor_1px,transparent_1px)] [background-size:28px_28px] opacity-[0.03] dark:opacity-[0.05] text-emerald-600" />
      </div>

      {/* Top Simple Navigation Header */}
      <header className="w-full h-13 sm:h-14 border-b border-slate-200/80 dark:border-slate-800/80 px-4 sm:px-6 lg:px-10 flex items-center justify-between bg-white/80 dark:bg-slate-900/80 backdrop-blur-md shrink-0 z-30 shadow-xs">
        <Logo size="md" />

        <div className="flex items-center gap-2.5 sm:gap-4">
          {/* Quick Accent Color Dropdown */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setIsAccentMenuOpen(!isAccentMenuOpen)}
              title="Theme Color"
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors border border-slate-200/90 dark:border-slate-700/80 bg-white dark:bg-slate-800 shadow-2xs cursor-pointer"
            >
              <Palette className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              <span className="text-xs font-semibold capitalize hidden sm:inline">{accentColor}</span>
              <span className="w-2 h-2 rounded-full bg-emerald-500 ring-1 ring-white dark:ring-slate-900" />
            </button>

            {isAccentMenuOpen && (
              <div className="absolute right-0 top-9 w-44 bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 p-2 z-50 animate-slide-up">
                <div className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider px-2 py-1 mb-1">
                  Accent Color
                </div>
                <div className="space-y-1">
                  {[
                    { id: 'emerald' as const, name: 'Emerald Green', bg: 'bg-[#10b981]' },
                    { id: 'rose' as const, name: 'Rose Pink', bg: 'bg-[#f43f5e]' },
                    { id: 'blue' as const, name: 'Ocean Blue', bg: 'bg-[#3b82f6]' },
                    { id: 'purple' as const, name: 'Royal Purple', bg: 'bg-[#8b5cf6]' },
                    { id: 'amber' as const, name: 'Sunset Amber', bg: 'bg-[#f59e0b]' },
                  ].map(c => (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => {
                        setAccentColor(c.id);
                        setIsAccentMenuOpen(false);
                      }}
                      className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-xl text-xs font-semibold transition-colors cursor-pointer ${
                        accentColor === c.id
                          ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 font-bold'
                          : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span className={`w-3.5 h-3.5 rounded-full ${c.bg} shadow-2xs`} />
                        <span>{c.name}</span>
                      </div>
                      {accentColor === c.id && (
                        <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Theme Mode Toggle (Light / Dark) */}
          <button
            type="button"
            onClick={toggleTheme}
            title={`Switch to ${actualTheme === 'dark' ? 'Light' : 'Dark'} mode`}
            className="p-1.5 sm:p-2 text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors border border-slate-200/90 dark:border-slate-700/80 bg-white dark:bg-slate-800 shadow-2xs cursor-pointer"
          >
            {actualTheme === 'dark' ? (
              <Sun className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-400" />
            ) : (
              <Moon className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-slate-600" />
            )}
          </button>

          {/* Switch Mode Button */}
          <button
            type="button"
            onClick={() => {
              setMode(mode === 'login' ? 'register' : 'login');
              setError('');
              setSuccessMessage('');
            }}
            className="text-xs font-bold text-emerald-700 hover:text-emerald-800 dark:text-emerald-400 dark:hover:text-emerald-300 px-3 py-1.5 rounded-full bg-emerald-50/80 dark:bg-emerald-950/60 border border-emerald-200/80 dark:border-emerald-800/80 transition-colors cursor-pointer"
          >
            {mode === 'login'
              ? 'Create Account'
              : 'Sign In'}
          </button>
        </div>
      </header>

      {/* Main Content Hero */}
      <main className="flex-1 flex items-center justify-center p-3 sm:p-4 lg:p-6 relative z-10 py-4 sm:py-6 lg:py-8">
        <div className="w-full max-w-6xl grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-center relative my-auto">
          
          {/* Left Column: Hero & 4 Feature Icons (7 Cols) */}
          <div className="lg:col-span-7 flex flex-col justify-center space-y-3 sm:space-y-4 lg:space-y-5">
            {/* Top Workspace Status Tag */}
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/70 border border-emerald-200/90 dark:border-emerald-800/80 text-emerald-800 dark:text-emerald-300 text-xs font-semibold shadow-2xs">
                <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse" />
                <span>All-in-One Freelancer Workspace</span>
              </div>
            </div>

            {/* Headline */}
            <div className="space-y-2 sm:space-y-2.5">
              <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-[48px] xl:text-[56px] font-black text-slate-900 dark:text-white tracking-tight leading-[1.1]">
                Work Smarter,<br />
                <span className="text-emerald-600 dark:text-emerald-400">Freelance Happier</span>
              </h1>
              <p className="text-xs sm:text-sm md:text-base text-slate-600 dark:text-slate-300 leading-relaxed max-w-lg">
                Manage clients, track deadlines, and stay organized — all in one place.
              </p>
            </div>

            {/* 4 Feature Icon Blocks: Multiple Clients, Deadline Tracking, Task Management, Easy Invoicing */}
            <div className="grid grid-cols-4 gap-2 sm:gap-3 max-w-md pt-0.5">
              {/* 1. Multiple Clients */}
              <div className="flex flex-col items-center text-center gap-1.5 group cursor-pointer">
                <div className="w-11 h-11 sm:w-13 sm:h-13 rounded-2xl bg-emerald-50 dark:bg-emerald-950/70 border border-emerald-200/60 dark:border-emerald-800/60 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shadow-2xs group-hover:scale-105 group-hover:shadow-xs transition-all">
                  <Users className="w-5 h-5" />
                </div>
                <span className="text-[10px] sm:text-[11px] font-bold text-slate-700 dark:text-slate-300 leading-tight">
                  Multiple<br />Clients
                </span>
              </div>

              {/* 2. Deadline Tracking */}
              <div className="flex flex-col items-center text-center gap-1.5 group cursor-pointer">
                <div className="w-11 h-11 sm:w-13 sm:h-13 rounded-2xl bg-[#fff3e0] dark:bg-amber-950/70 border border-amber-200/60 dark:border-amber-800/60 flex items-center justify-center text-[#f97316] dark:text-amber-400 shadow-2xs group-hover:scale-105 group-hover:shadow-xs transition-all">
                  <Calendar className="w-5 h-5" />
                </div>
                <span className="text-[10px] sm:text-[11px] font-bold text-slate-700 dark:text-slate-300 leading-tight">
                  Deadline<br />Tracking
                </span>
              </div>

              {/* 3. Task Management */}
              <div className="flex flex-col items-center text-center gap-1.5 group cursor-pointer">
                <div className="w-11 h-11 sm:w-13 sm:h-13 rounded-2xl bg-[#f3e8ff] dark:bg-purple-950/70 border border-purple-200/60 dark:border-purple-800/60 flex items-center justify-center text-[#9333ea] dark:text-purple-400 shadow-2xs group-hover:scale-105 group-hover:shadow-xs transition-all">
                  <FolderKanban className="w-5 h-5" />
                </div>
                <span className="text-[10px] sm:text-[11px] font-bold text-slate-700 dark:text-slate-300 leading-tight">
                  Task<br />Management
                </span>
              </div>

              {/* 4. Easy Invoicing */}
              <div className="flex flex-col items-center text-center gap-1.5 group cursor-pointer">
                <div className="w-11 h-11 sm:w-13 sm:h-13 rounded-2xl bg-[#e0f2fe] dark:bg-blue-950/70 border border-blue-200/60 dark:border-blue-800/60 flex items-center justify-center text-[#0284c7] dark:text-blue-400 shadow-2xs group-hover:scale-105 group-hover:shadow-xs transition-all">
                  <FileText className="w-5 h-5" />
                </div>
                <span className="text-[10px] sm:text-[11px] font-bold text-slate-700 dark:text-slate-300 leading-tight">
                  Easy<br />Invoicing
                </span>
              </div>
            </div>

            {/* "Built for Freelancers" handwritten doodle */}
            <div className="pt-1">
              <div className="inline-block transform -rotate-2 text-slate-400 dark:text-slate-500 font-['Caveat',cursive] text-xl sm:text-2xl tracking-wide select-none">
                <span>Built for Freelancers</span>
                <svg className="w-32 sm:w-36 h-2 text-emerald-500/70 mt-[-2px]" viewBox="0 0 140 10" fill="none">
                  <path d="M2 7C40 2 95 2 138 6" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
                </svg>
              </div>
            </div>
          </div>

          {/* Right Column: Authentication Form Card (5 Cols) */}
          <div className="lg:col-span-5 relative">
            {/* Ambient backlight glow */}
            <div className="absolute -inset-2 bg-gradient-to-r from-emerald-500/25 via-teal-500/20 to-whatsapp-light/25 rounded-[34px] blur-xl opacity-80 pointer-events-none" />

            {/* High-Contrast Card Outer Border & Elevation Frame */}
            <div className="p-[2.5px] rounded-[26px] sm:rounded-[30px] bg-gradient-to-b from-emerald-500/70 via-emerald-400/40 to-teal-600/70 dark:from-emerald-500/80 dark:via-slate-700 dark:to-teal-500/80 shadow-[0_20px_50px_-10px_rgba(5,150,105,0.25),0_12px_28px_-6px_rgba(0,0,0,0.14)] dark:shadow-[0_25px_60px_-15px_rgba(0,0,0,0.8)] transition-all">
              <div className="bg-white dark:bg-slate-900 rounded-[23.5px] sm:rounded-[27.5px] border border-emerald-100/90 dark:border-slate-800 p-3.5 sm:p-5 lg:p-6 flex flex-col relative">
                {/* Solid Green Top Accent Bar with gradient glow */}
                <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-emerald-600 via-teal-500 to-whatsapp-teal rounded-t-[23.5px] sm:rounded-t-[27.5px]" />

                {/* 1-Click Demo Banner (only in login/register mode) */}
                {mode !== 'forgot' && (
                  <div className="mb-3 p-2.5 rounded-xl bg-emerald-50/70 dark:bg-emerald-950/40 border border-emerald-200/80 dark:border-emerald-800/60 flex items-center justify-between shadow-2xs">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-2xs">
                        <Zap className="w-3.5 h-3.5 fill-white" />
                      </div>
                      <div>
                        <div className="text-xs font-bold text-slate-900 dark:text-slate-100 leading-tight">
                          Explore Demo Account
                        </div>
                        <div className="text-[10px] text-slate-500 dark:text-slate-400">
                          Try with sample clients
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={loginDemoUser}
                      type="button"
                      className="px-2.5 py-1.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-xs shadow-emerald-700/20 active:scale-95 transition-all flex items-center gap-1 cursor-pointer shrink-0"
                    >
                      <span>1-Click Login</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  </div>
                )}

                {/* Segmented Tab Switcher: Sign In / Create Account */}
                {mode !== 'forgot' ? (
                  <div className="p-1 bg-slate-100 dark:bg-slate-800/90 border border-slate-200/90 dark:border-slate-700/80 rounded-xl grid grid-cols-2 gap-1 mb-3 text-xs font-bold shadow-inner">
                    <button
                      type="button"
                      onClick={() => resetAllFormStates('login')}
                      className={`py-1.5 rounded-lg transition-all cursor-pointer ${
                        mode === 'login'
                          ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                          : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                      }`}
                    >
                      Sign In
                    </button>
                    <button
                      type="button"
                      onClick={() => resetAllFormStates('register')}
                      className={`py-1.5 rounded-lg transition-all cursor-pointer ${
                        mode === 'register'
                          ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                          : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                      }`}
                    >
                      Create Account
                    </button>
                  </div>
                ) : (
                  <div className="mb-2.5">
                    <button
                      type="button"
                      onClick={() => resetAllFormStates('login')}
                      className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700 dark:text-emerald-400 hover:underline cursor-pointer"
                    >
                      <ArrowLeft className="w-3.5 h-3.5" />
                      <span>Back to Sign In</span>
                    </button>
                  </div>
                )}

                {/* Form Title & Subtitle */}
                <div className="mb-3">
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/70 border border-emerald-200/90 dark:border-emerald-800/80 text-emerald-800 dark:text-emerald-300 text-[10px] font-bold mb-1.5">
                    <ShieldCheck className="w-3 h-3 text-emerald-600" />
                    <span>Freelancer Portal</span>
                  </div>
                  <h2 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white flex items-center gap-2">
                  {mode === 'forgot' ? (
                    <>
                      <KeyRound className="w-4 h-4 text-emerald-600" />
                      <span>
                        {forgotStep === 'email'
                          ? 'Reset Password'
                          : forgotStep === 'otp'
                          ? 'Verify Email OTP'
                          : forgotStep === 'reset'
                          ? 'Set New Password'
                          : 'Password Reset Successful'}
                      </span>
                    </>
                  ) : mode === 'login' ? (
                    'Sign In to Workspace'
                  ) : (
                    'Create Your Workspace'
                  )}
                </h2>
                <p className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  {mode === 'forgot'
                    ? forgotStep === 'email'
                      ? 'Enter your registered email address to receive a verification code'
                      : forgotStep === 'otp'
                      ? `Enter the 6-digit verification code sent to ${email}`
                      : forgotStep === 'reset'
                      ? 'Create and confirm your new secure password below'
                      : 'Your password has been changed. You can now log in.'
                    : mode === 'login'
                    ? 'Enter your email and password to continue'
                    : 'Fill in your details to create your freelancer account'}
                </p>
              </div>

              {/* Error Alert Box */}
              {error && (
                <div className="mb-3 p-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-900/80 text-rose-700 dark:text-rose-300 text-xs font-medium flex items-start gap-2 animate-shake">
                  <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                  <span className="leading-tight">{error}</span>
                </div>
              )}

              {/* Success Alert Box */}
              {successMessage && (
                <div className="mb-3 p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-xs space-y-0.5">
                  <div className="font-bold flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                    <span>Success</span>
                  </div>
                  <p className="text-[11px] text-emerald-700 dark:text-emerald-400 leading-normal">
                    {successMessage}
                  </p>
                </div>
              )}

              {/* --- 1. SIGN IN FORM --- */}
              {mode === 'login' && (
                <form onSubmit={handleLoginSubmit} className="space-y-3">
                  <div>
                    <label className="block text-[11px] sm:text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Email Address *
                    </label>
                    <div className="relative">
                      <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-2.5 sm:top-3" />
                      <input
                        type="email"
                        value={email}
                        onChange={e => setEmail(e.target.value)}
                        placeholder="renujanrenu03@gmail.com"
                        className="w-full pl-9 pr-3.5 py-2 sm:py-2.5 bg-[#f0f4fa] dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700 rounded-xl text-xs sm:text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white dark:focus:bg-slate-800 transition-all"
                        required
                        disabled={isLoading}
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-[11px] sm:text-xs font-bold text-slate-700 dark:text-slate-300">
                        Password *
                      </label>
                      <button
                        type="button"
                        onClick={() => resetAllFormStates('forgot')}
                        className="text-[11px] font-bold text-emerald-700 dark:text-emerald-400 hover:underline cursor-pointer"
                      >
                        Forgot Password?
                      </button>
                    </div>
                    <div className="relative">
                      <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-2.5 sm:top-3" />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={password}
                        onChange={e => setPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full pl-9 pr-10 py-2 sm:py-2.5 bg-[#f0f4fa] dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700 rounded-xl text-xs sm:text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white dark:focus:bg-slate-800 transition-all"
                        required
                        disabled={isLoading}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-2.5 sm:top-3 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                        tabIndex={-1}
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full mt-3 py-2.5 sm:py-3 rounded-xl bg-gradient-to-r from-emerald-600 via-teal-600 to-whatsapp-teal hover:from-emerald-700 hover:to-whatsapp-dark text-white font-bold text-xs sm:text-sm shadow-md shadow-emerald-700/25 active:scale-[0.98] transition-all cursor-pointer flex items-center justify-center gap-2 disabled:opacity-60"
                  >
                    <span>{isLoading ? 'Signing In...' : 'Sign In to Workspace'}</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </form>
              )}

              {/* --- 2. CREATE ACCOUNT FORM --- */}
              {mode === 'register' && (
                <form onSubmit={handleRegisterSubmit} className="space-y-2.5">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {/* Full Name */}
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-0.5">
                        Full Name *
                      </label>
                      <div className="relative">
                        <User className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5 sm:top-3" />
                        <input
                          type="text"
                          value={name}
                          onChange={e => setName(e.target.value)}
                          placeholder="Alex Rivera"
                          className="w-full pl-8 pr-2.5 py-1.5 sm:py-2 bg-[#f0f4fa] dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white dark:focus:bg-slate-800 transition-all"
                          required
                          disabled={isLoading}
                        />
                      </div>
                    </div>

                    {/* Profession */}
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-0.5">
                        Profession *
                      </label>
                      <div className="relative">
                        <Briefcase className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5 sm:top-3" />
                        <select
                          value={profession}
                          onChange={e => setProfession(e.target.value)}
                          className="w-full pl-8 pr-2 py-1.5 sm:py-2 bg-[#f0f4fa] dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white dark:focus:bg-slate-800 transition-all font-medium cursor-pointer"
                          disabled={isLoading}
                        >
                          {professionsList.map(p => (
                            <option key={p} value={p}>
                              {p}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Dynamic Custom Profession Input when 'Other' is selected */}
                  {profession === 'Other (Specify your own)' && (
                    <div className="animate-fade-in">
                      <label className="block text-[11px] font-bold text-emerald-700 dark:text-emerald-400 mb-0.5 flex items-center gap-1">
                        <PenTool className="w-3 h-3" />
                        <span>Specify Your Profession *</span>
                      </label>
                      <div className="relative">
                        <input
                          type="text"
                          value={customProfession}
                          onChange={e => setCustomProfession(e.target.value)}
                          placeholder="e.g. 3D Animator, Voiceover Artist"
                          className="w-full px-2.5 py-1.5 bg-emerald-50/60 dark:bg-emerald-950/30 border border-emerald-300 dark:border-emerald-700 rounded-xl text-xs text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all font-medium"
                          required
                          disabled={isLoading}
                          autoFocus
                        />
                      </div>
                    </div>
                  )}

                  {/* Email */}
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-0.5">
                      Email Address *
                    </label>
                    <div className="relative">
                      <Mail className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5 sm:top-3" />
                      <input
                        type="email"
                        value={email}
                        onChange={e => setEmail(e.target.value)}
                        placeholder="renujanrenu03@gmail.com"
                        className="w-full pl-8 pr-2.5 py-1.5 sm:py-2 bg-[#f0f4fa] dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white dark:focus:bg-slate-800 transition-all"
                        required
                        disabled={isLoading}
                      />
                    </div>
                  </div>

                  {/* Password & Confirm in 2 columns */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {/* Password */}
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-0.5">
                        Password * (min. 6)
                      </label>
                      <div className="relative">
                        <Lock className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5 sm:top-3" />
                        <input
                          type={showPassword ? 'text' : 'password'}
                          value={password}
                          onChange={e => setPassword(e.target.value)}
                          placeholder="••••••••"
                          className="w-full pl-8 pr-7 py-1.5 sm:py-2 bg-[#f0f4fa] dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white dark:focus:bg-slate-800 transition-all"
                          required
                          disabled={isLoading}
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-2 top-2 sm:top-2.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                          tabIndex={-1}
                        >
                          {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    </div>

                    {/* Confirm Password */}
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-0.5">
                        Confirm Password *
                      </label>
                      <div className="relative">
                        <Lock className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5 sm:top-3" />
                        <input
                          type={showConfirmPassword ? 'text' : 'password'}
                          value={confirmPassword}
                          onChange={e => setConfirmPassword(e.target.value)}
                          placeholder="••••••••"
                          className={`w-full pl-8 pr-7 py-1.5 sm:py-2 bg-[#f0f4fa] dark:bg-slate-800/80 border rounded-xl text-xs text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 transition-all ${
                            confirmPassword && confirmPassword !== password
                              ? 'border-rose-400 focus:ring-rose-400'
                              : confirmPassword && confirmPassword === password
                              ? 'border-emerald-400 focus:ring-emerald-500'
                              : 'border-slate-200/80 dark:border-slate-700 focus:ring-emerald-500'
                          }`}
                          required
                          disabled={isLoading}
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          className="absolute right-2 top-2 sm:top-2.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                          tabIndex={-1}
                        >
                          {showConfirmPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    </div>
                  </div>

                  {confirmPassword && confirmPassword === password && (
                    <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
                      <Check className="w-3 h-3" /> Passwords match
                    </p>
                  )}

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full mt-2 py-2.5 sm:py-3 rounded-xl bg-gradient-to-r from-emerald-600 via-teal-600 to-whatsapp-teal hover:from-emerald-700 hover:to-whatsapp-dark text-white font-bold text-xs sm:text-sm shadow-md shadow-emerald-700/20 active:scale-[0.98] transition-all cursor-pointer flex items-center justify-center gap-2 disabled:opacity-60"
                  >
                    <span>{isLoading ? 'Creating Account...' : 'Create Free Account'}</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </form>
              )}

              {/* --- 3. FORGOT / RESET PASSWORD FLOW --- */}
              {mode === 'forgot' && (
                <div>
                  {/* Step 1: Check Registered Email */}
                  {forgotStep === 'email' && (
                    <form onSubmit={handleForgotStep1Submit} className="space-y-3">
                      <div>
                        <label className="block text-[11px] sm:text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                          Registered Email Address *
                        </label>
                        <div className="relative">
                          <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-2.5 sm:top-3" />
                          <input
                            type="email"
                            value={email}
                            onChange={e => setEmail(e.target.value)}
                            placeholder="renujanrenu03@gmail.com"
                            className="w-full pl-9 pr-3 py-2 sm:py-2.5 bg-[#f0f4fa] dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700 rounded-xl text-xs sm:text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
                            required
                            disabled={isLoading}
                            autoFocus
                          />
                        </div>
                        <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1">
                          We will send a 6-digit one-time password (OTP) to this email address.
                        </p>
                      </div>

                      <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full mt-2.5 py-2.5 sm:py-3 rounded-xl bg-gradient-to-r from-emerald-600 via-teal-600 to-whatsapp-teal hover:from-emerald-700 hover:to-whatsapp-dark text-white font-bold text-xs sm:text-sm shadow-md shadow-emerald-700/20 active:scale-[0.98] transition-all cursor-pointer flex items-center justify-center gap-2 disabled:opacity-60"
                      >
                        <span>{isLoading ? 'Sending Code...' : 'Send Verification Code'}</span>
                        <ArrowRight className="w-4 h-4" />
                      </button>
                    </form>
                  )}

                  {/* Step 2: Verify 6-Digit OTP */}
                  {forgotStep === 'otp' && (
                    <form onSubmit={handleForgotStep2OtpSubmit} className="space-y-3">
                      {/* Sent-to banner with Change option */}
                      <div className="p-2 rounded-xl bg-emerald-50/80 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 text-[11px] text-emerald-800 dark:text-emerald-300 flex items-center justify-between">
                        <div className="flex items-center gap-1.5 truncate">
                          <Mail className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                          <span className="truncate">Sent to: <strong>{email}</strong></span>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            setForgotStep('email');
                            setOtp('');
                            setError('');
                          }}
                          className="text-[10px] font-bold text-emerald-700 dark:text-emerald-400 hover:underline cursor-pointer ml-2 shrink-0"
                        >
                          Change
                        </button>
                      </div>

                      {/* Production Email Dispatched Banner */}
                      <div className="p-3 rounded-xl bg-emerald-50/70 dark:bg-emerald-950/40 border border-emerald-200/80 dark:border-emerald-800/60 text-slate-800 dark:text-slate-200 text-xs">
                        <div className="flex items-start gap-2.5">
                          <Mail className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                          <div>
                            <div className="font-bold text-emerald-950 dark:text-emerald-300">Verification Email Dispatched</div>
                            <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-0.5 leading-relaxed">
                              We've sent your 6-digit security code to <strong>{email}</strong>. Please check your inbox (and spam/junk folder) and enter it below.
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* OTP Input Field */}
                      <div>
                        <label className="block text-[11px] sm:text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                          6-Digit Verification Code *
                        </label>
                        <div className="relative">
                          <KeyRound className="w-4 h-4 text-slate-400 absolute left-3 top-2.5 sm:top-3" />
                          <input
                            type="text"
                            inputMode="numeric"
                            pattern="[0-9]*"
                            maxLength={6}
                            value={otp}
                            onChange={e => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                            placeholder="000000"
                            className="w-full pl-9 pr-3 py-2 sm:py-2.5 bg-[#f0f4fa] dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700 rounded-xl text-center text-base sm:text-lg font-mono font-black tracking-[0.35em] text-slate-900 dark:text-slate-100 placeholder-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
                            required
                            disabled={isLoading}
                            autoFocus
                          />
                        </div>
                      </div>

                      {/* Resend OTP Bar */}
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="text-slate-500 dark:text-slate-400">Didn't receive the code?</span>
                        {resendCooldown > 0 ? (
                          <span className="text-slate-400 font-medium">
                            Resend in <strong className="font-mono text-emerald-600 dark:text-emerald-400">{resendCooldown}s</strong>
                          </span>
                        ) : (
                          <button
                            type="button"
                            onClick={handleResendOtp}
                            disabled={isResending}
                            className="font-bold text-emerald-700 dark:text-emerald-400 hover:underline cursor-pointer inline-flex items-center gap-1 disabled:opacity-50"
                          >
                            <RefreshCw className={`w-3 h-3 ${isResending ? 'animate-spin' : ''}`} />
                            <span>Resend Code</span>
                          </button>
                        )}
                      </div>

                      {/* Submit OTP */}
                      <button
                        type="submit"
                        disabled={isLoading || otp.length !== 6}
                        className="w-full mt-2 py-2.5 sm:py-3 rounded-xl bg-gradient-to-r from-emerald-600 via-teal-600 to-whatsapp-teal hover:from-emerald-700 hover:to-whatsapp-dark text-white font-bold text-xs sm:text-sm shadow-md shadow-emerald-700/20 active:scale-[0.98] transition-all cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
                      >
                        <span>{isLoading ? 'Verifying Code...' : 'Verify Code & Proceed'}</span>
                        <ArrowRight className="w-4 h-4" />
                      </button>
                    </form>
                  )}

                  {/* Step 3: Set New Password & Confirm */}
                  {forgotStep === 'reset' && (
                    <form onSubmit={handleForgotStep3Submit} className="space-y-2.5">
                      <div className="p-2 rounded-xl bg-emerald-50/80 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 text-[11px] text-emerald-800 dark:text-emerald-300 flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                          <span>OTP Verified for <strong>{email}</strong></span>
                        </div>
                      </div>

                      {/* Password & Confirm in 2 columns */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {/* New Password */}
                        <div>
                          <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-0.5">
                            New Password * (min. 6)
                          </label>
                          <div className="relative">
                            <Lock className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5 sm:top-3" />
                            <input
                              type={showNewPassword ? 'text' : 'password'}
                              value={newPassword}
                              onChange={e => setNewPassword(e.target.value)}
                              placeholder="••••••••"
                              className="w-full pl-8 pr-7 py-1.5 sm:py-2 bg-[#f0f4fa] dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
                              required
                              disabled={isLoading}
                              autoFocus
                            />
                            <button
                              type="button"
                              onClick={() => setShowNewPassword(!showNewPassword)}
                              className="absolute right-2 top-2 sm:top-2.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                              tabIndex={-1}
                            >
                              {showNewPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                            </button>
                          </div>
                        </div>

                        {/* Confirm New Password */}
                        <div>
                          <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-0.5">
                            Confirm New Password *
                          </label>
                          <div className="relative">
                            <Lock className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5 sm:top-3" />
                            <input
                              type={showConfirmNewPassword ? 'text' : 'password'}
                              value={confirmNewPassword}
                              onChange={e => setConfirmNewPassword(e.target.value)}
                              placeholder="••••••••"
                              className={`w-full pl-8 pr-7 py-1.5 sm:py-2 bg-[#f0f4fa] dark:bg-slate-800/80 border rounded-xl text-xs text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 transition-all ${
                                confirmNewPassword && confirmNewPassword !== newPassword
                                  ? 'border-rose-400 focus:ring-rose-400'
                                  : confirmNewPassword && confirmNewPassword === newPassword
                                  ? 'border-emerald-400 focus:ring-emerald-500'
                                  : 'border-slate-200/80 dark:border-slate-700 focus:ring-emerald-500'
                              }`}
                              required
                              disabled={isLoading}
                            />
                            <button
                              type="button"
                              onClick={() => setShowConfirmNewPassword(!showConfirmNewPassword)}
                              className="absolute right-2 top-2 sm:top-2.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                              tabIndex={-1}
                            >
                              {showConfirmNewPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                            </button>
                          </div>
                        </div>
                      </div>

                      {confirmNewPassword && confirmNewPassword === newPassword && (
                        <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
                          <Check className="w-3 h-3" /> Passwords match
                        </p>
                      )}

                      <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full mt-2 py-2.5 sm:py-3 rounded-xl bg-gradient-to-r from-emerald-600 via-teal-600 to-whatsapp-teal hover:from-emerald-700 hover:to-whatsapp-dark text-white font-bold text-xs sm:text-sm shadow-md shadow-emerald-700/20 active:scale-[0.98] transition-all cursor-pointer flex items-center justify-center gap-2 disabled:opacity-60"
                      >
                        <span>{isLoading ? 'Updating Password...' : 'Save New Password & Continue'}</span>
                        <ArrowRight className="w-4 h-4" />
                      </button>
                    </form>
                  )}

                  {/* Step 4: Success View */}
                  {forgotStep === 'success' && (
                    <div className="space-y-3 text-center py-2">
                      <div className="w-10 h-10 rounded-full bg-emerald-100 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto shadow-inner">
                        <CheckCircle2 className="w-6 h-6" />
                      </div>
                      <div>
                        <h3 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
                          Password Updated Successfully!
                        </h3>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                          You can now sign in to your workspace using your new password.
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          resetAllFormStates('login');
                        }}
                        className="w-full py-2.5 sm:py-3 rounded-xl bg-gradient-to-r from-emerald-600 via-teal-600 to-whatsapp-teal hover:from-emerald-700 hover:to-whatsapp-dark text-white font-bold text-xs sm:text-sm shadow-md shadow-emerald-700/20 active:scale-[0.98] transition-all cursor-pointer flex items-center justify-center gap-2"
                      >
                        <span>Sign In with New Password</span>
                        <ArrowRight className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* Terms / Back footer */}
              <div className="mt-3 text-center text-[10px] sm:text-[11px] text-slate-400">
                {mode === 'forgot' ? (
                  <button
                    type="button"
                    onClick={() => resetAllFormStates('login')}
                    className="font-bold text-emerald-700 dark:text-emerald-400 hover:underline cursor-pointer"
                  >
                    Remember your password? Sign in here
                  </button>
                ) : (
                  <span>By continuing, you agree to Me Plus Terms of Service</span>
                )}
              </div>
            </div>
          </div>

            {/* Artistic Handwritten Accents (Matching Mockup) */}
            <div className="hidden xl:flex flex-col items-center absolute -right-20 top-4 select-none pointer-events-none rotate-2">
              <div className="font-['Caveat',cursive] text-base sm:text-lg text-emerald-800/75 dark:text-emerald-400/80 leading-tight text-center">
                Organize<br />
                today<br />
                Create a<br />
                brighter<br />
                tomorrow<br />
                ♡
              </div>
              <svg className="w-12 h-20 text-emerald-500/40 mt-0.5" viewBox="0 0 50 100" fill="none">
                <path d="M15 5 C40 30, 45 70, 15 95" stroke="currentColor" strokeWidth="1.5" strokeDasharray="3 3" />
              </svg>
            </div>

            <div className="hidden xl:block absolute -right-16 -bottom-2 select-none pointer-events-none">
              <span className="font-['Caveat',cursive] text-[11px] tracking-widest text-emerald-800/60 dark:text-emerald-400/60 uppercase">
                FREELANCE<br />WITHOUT<br />LIMITS
              </span>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="w-full py-2.5 border-t border-slate-200/80 dark:border-slate-800/80 px-4 text-center text-[11px] text-slate-400 bg-white/60 dark:bg-slate-900/60 shrink-0 z-10">
        <span>&copy; 2026 Me Plus Freelancer Platform &bull; Professional Multi-Client Task Management</span>
      </footer>
    </div>
  );
};
