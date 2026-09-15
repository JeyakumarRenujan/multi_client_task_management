import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Logo } from '../common/Logo';
import {
  Mail,
  Lock,
  User,
  Briefcase,
  Zap,
  ArrowRight,
  ArrowLeft,
  X,
  KeyRound,
  CheckCircle2,
  AlertCircle,
  Check,
  Eye,
  EyeOff,
  PenTool,
} from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose }) => {
  const { login, register, forgotPassword, resetPassword, loginDemoUser } = useApp();
  const [mode, setMode] = useState<'login' | 'register' | 'forgot'>('login');

  // Form states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [name, setName] = useState('');
  const [profession, setProfession] = useState('Graphic Designer & Illustrator');
  const [customProfession, setCustomProfession] = useState('');

  // Visibility states
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Forgot password states
  const [forgotStep, setForgotStep] = useState<'email' | 'reset' | 'success'>('email');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmNewPassword, setShowConfirmNewPassword] = useState(false);

  // Error & Status
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  if (!isOpen) return null;

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

  const resetAllFormStates = (newMode: 'login' | 'register' | 'forgot') => {
    setMode(newMode);
    setError('');
    setSuccessMessage('');
    setPassword('');
    setConfirmPassword('');
    setNewPassword('');
    setConfirmNewPassword('');
    setForgotStep('email');
    setIsLoading(false);
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

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

    if (res.success) {
      onClose();
    } else if (res.error) {
      setError(res.error);
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

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

    if (res.success) {
      onClose();
    } else if (res.error) {
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

    setForgotStep('reset');
  };

  const handleForgotStep2Submit = async (e: React.FormEvent) => {
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
    const res = await resetPassword(email, newPassword);
    setIsLoading(false);

    if (!res.success) {
      setError(res.error || 'Failed to update password.');
      return;
    }

    setForgotStep('success');
    setSuccessMessage(res.message || 'Your password has been successfully updated! You can now sign in.');
  };

  const handleDemoLogin = () => {
    loginDemoUser();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fade-in">
      <div
        className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 p-6 md:p-8 flex flex-col relative overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* Top green accent bar */}
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-emerald-500 via-teal-500 to-whatsapp-light" />

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="mb-6 flex flex-col items-center text-center">
          <Logo size="lg" />
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
            Multi-Client Freelancer Task Workspace
          </p>
        </div>

        {/* 1-Click Demo Evaluation Banner */}
        {mode !== 'forgot' && (
          <div className="mb-5 p-3 rounded-2xl bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-950/40 dark:to-teal-950/40 border border-emerald-200 dark:border-emerald-800/60 flex items-center justify-between shadow-2xs">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-xl bg-emerald-600 text-white">
                <Zap className="w-3.5 h-3.5" />
              </div>
              <div className="text-left">
                <div className="text-xs font-bold text-slate-900 dark:text-slate-100">
                  Quick Demo Login
                </div>
                <div className="text-[10px] text-slate-500 dark:text-slate-400">
                  Sample clients &amp; projects
                </div>
              </div>
            </div>

            <button
              onClick={handleDemoLogin}
              className="px-3 py-1.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-md shadow-emerald-700/20 active:scale-95 transition-all flex items-center gap-1 cursor-pointer"
            >
              <span>1-Click Login</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>
        )}

        {/* Tab switch */}
        {mode !== 'forgot' ? (
          <div className="flex rounded-2xl bg-slate-100 dark:bg-slate-800 p-1 mb-6 border border-slate-200 dark:border-slate-700">
            <button
              type="button"
              onClick={() => resetAllFormStates('login')}
              className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                mode === 'login'
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => resetAllFormStates('register')}
              className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                mode === 'register'
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Create Account
            </button>
          </div>
        ) : (
          <div className="mb-4 flex items-center gap-2">
            <button
              type="button"
              onClick={() => resetAllFormStates('login')}
              className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 dark:text-emerald-400 hover:underline cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Sign In</span>
            </button>
          </div>
        )}

        {/* Error notification */}
        {error && (
          <div className="mb-4 p-3 rounded-xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-900/80 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Success notification */}
        {successMessage && (
          <div className="mb-4 p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-xs space-y-1">
            <div className="font-bold flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span>Success</span>
            </div>
            <p className="text-[11px] text-emerald-700 dark:text-emerald-400">
              {successMessage}
            </p>
          </div>
        )}

        {/* --- 1. SIGN IN FORM --- */}
        {mode === 'login' && (
          <form onSubmit={handleLoginSubmit} className="space-y-3.5">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="you@gmail.com"
                  className="w-full pl-9 pr-3 py-2.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-xs md:text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
                  required
                  disabled={isLoading}
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                  Password
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
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-9 pr-10 py-2.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-xs md:text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
                  required
                  disabled={isLoading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full mt-2 py-3 rounded-xl bg-gradient-to-r from-emerald-600 via-teal-600 to-whatsapp-teal hover:from-emerald-700 hover:to-whatsapp-dark text-white font-bold text-xs md:text-sm shadow-lg shadow-emerald-700/25 active:scale-[0.98] transition-all cursor-pointer flex items-center justify-center gap-1.5 disabled:opacity-60"
            >
              <span>{isLoading ? 'Signing In...' : 'Sign In to Workspace'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        )}

        {/* --- 2. REGISTER FORM --- */}
        {mode === 'register' && (
          <form onSubmit={handleRegisterSubmit} className="space-y-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Full Name
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="e.g. Alex Rivera"
                  className="w-full pl-9 pr-3 py-2.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-xs md:text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
                  required
                  disabled={isLoading}
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Freelance Profession
              </label>
              <div className="relative">
                <Briefcase className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <select
                  value={profession}
                  onChange={e => setProfession(e.target.value)}
                  className="w-full pl-9 pr-3 py-2.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-xs md:text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all font-medium cursor-pointer"
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

            {/* Custom Profession when 'Other' */}
            {profession === 'Other (Specify your own)' && (
              <div className="animate-fade-in">
                <label className="block text-xs font-bold text-emerald-700 dark:text-emerald-400 mb-1 flex items-center gap-1.5">
                  <PenTool className="w-3.5 h-3.5" />
                  <span>Specify Your Profession *</span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={customProfession}
                    onChange={e => setCustomProfession(e.target.value)}
                    placeholder="e.g. 3D Animator, Voiceover Artist, SEO Specialist"
                    className="w-full px-3 py-2.5 bg-emerald-50/60 dark:bg-emerald-950/30 border border-emerald-300 dark:border-emerald-700 rounded-xl text-xs md:text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all font-medium"
                    required
                    disabled={isLoading}
                    autoFocus
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="you@gmail.com"
                  className="w-full pl-9 pr-3 py-2.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-xs md:text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
                  required
                  disabled={isLoading}
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Password (min. 6 characters)
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-9 pr-10 py-2.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-xs md:text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
                  required
                  disabled={isLoading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Confirm Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  className={`w-full pl-9 pr-10 py-2.5 bg-slate-50 dark:bg-slate-800/60 border rounded-xl text-xs md:text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 transition-all ${
                    confirmPassword && confirmPassword !== password
                      ? 'border-rose-400 focus:ring-rose-400'
                      : confirmPassword && confirmPassword === password
                      ? 'border-emerald-400 focus:ring-emerald-500'
                      : 'border-slate-200 dark:border-slate-700 focus:ring-emerald-500'
                  }`}
                  required
                  disabled={isLoading}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-3 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                  tabIndex={-1}
                >
                  {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {confirmPassword && confirmPassword === password && (
                <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold mt-1 flex items-center gap-1">
                  <Check className="w-3 h-3" /> Passwords match
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full mt-2 py-3 rounded-xl bg-gradient-to-r from-emerald-600 via-teal-600 to-whatsapp-teal hover:from-emerald-700 hover:to-whatsapp-dark text-white font-bold text-xs md:text-sm shadow-lg shadow-emerald-700/25 active:scale-[0.98] transition-all cursor-pointer flex items-center justify-center gap-1.5 disabled:opacity-60"
            >
              <span>{isLoading ? 'Creating Account...' : 'Create Free Account'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        )}

        {/* --- 3. FORGOT / RESET PASSWORD FLOW --- */}
        {mode === 'forgot' && (
          <div>
            {forgotStep === 'email' && (
              <form onSubmit={handleForgotStep1Submit} className="space-y-3.5">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Registered Email Address
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                    <input
                      type="email"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      placeholder="alex.rivera@gmail.com"
                      className="w-full pl-9 pr-3 py-2.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-xs md:text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
                      required
                      disabled={isLoading}
                      autoFocus
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full mt-2 py-3 rounded-xl bg-gradient-to-r from-emerald-600 via-teal-600 to-whatsapp-teal hover:from-emerald-700 hover:to-whatsapp-dark text-white font-bold text-xs md:text-sm shadow-lg shadow-emerald-700/25 active:scale-[0.98] transition-all cursor-pointer flex items-center justify-center gap-1.5 disabled:opacity-60"
                >
                  <span>{isLoading ? 'Verifying Account...' : 'Verify Email & Proceed'}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </form>
            )}

            {forgotStep === 'reset' && (
              <form onSubmit={handleForgotStep2Submit} className="space-y-3">
                <div className="p-2.5 rounded-xl bg-emerald-50/80 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 text-[11px] text-emerald-800 dark:text-emerald-300 flex items-center justify-between">
                  <div>
                    Verified Account: <strong>{email}</strong>
                  </div>
                  <button
                    type="button"
                    onClick={() => setForgotStep('email')}
                    className="text-[10px] font-bold text-emerald-700 dark:text-emerald-400 underline cursor-pointer"
                  >
                    Change
                  </button>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    New Password (min. 6 characters)
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                    <input
                      type={showNewPassword ? 'text' : 'password'}
                      value={newPassword}
                      onChange={e => setNewPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full pl-9 pr-10 py-2.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-xs md:text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
                      required
                      disabled={isLoading}
                      autoFocus
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute right-3 top-3 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                      tabIndex={-1}
                    >
                      {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Confirm New Password
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                    <input
                      type={showConfirmNewPassword ? 'text' : 'password'}
                      value={confirmNewPassword}
                      onChange={e => setConfirmNewPassword(e.target.value)}
                      placeholder="••••••••"
                      className={`w-full pl-9 pr-10 py-2.5 bg-slate-50 dark:bg-slate-800/60 border rounded-xl text-xs md:text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 transition-all ${
                        confirmNewPassword && confirmNewPassword !== newPassword
                          ? 'border-rose-400 focus:ring-rose-400'
                          : confirmNewPassword && confirmNewPassword === newPassword
                          ? 'border-emerald-400 focus:ring-emerald-500'
                          : 'border-slate-200 dark:border-slate-700 focus:ring-emerald-500'
                      }`}
                      required
                      disabled={isLoading}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmNewPassword(!showConfirmNewPassword)}
                      className="absolute right-3 top-3 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                      tabIndex={-1}
                    >
                      {showConfirmNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {confirmNewPassword && confirmNewPassword === newPassword && (
                    <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold mt-1 flex items-center gap-1">
                      <Check className="w-3 h-3" /> Passwords match
                    </p>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full mt-2 py-3 rounded-xl bg-gradient-to-r from-emerald-600 via-teal-600 to-whatsapp-teal hover:from-emerald-700 hover:to-whatsapp-dark text-white font-bold text-xs md:text-sm shadow-lg shadow-emerald-700/25 active:scale-[0.98] transition-all cursor-pointer flex items-center justify-center gap-1.5 disabled:opacity-60"
                >
                  <span>{isLoading ? 'Updating Password...' : 'Save New Password & Sign In'}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </form>
            )}

            {forgotStep === 'success' && (
              <div className="space-y-4 text-center py-2">
                <div className="w-12 h-12 rounded-full bg-emerald-100 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto shadow-inner">
                  <CheckCircle2 className="w-7 h-7" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    Password Updated Successfully!
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    You can now sign in using your new password.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setMode('login');
                    setPassword('');
                    setError('');
                  }}
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-emerald-600 via-teal-600 to-whatsapp-teal hover:from-emerald-700 hover:to-whatsapp-dark text-white font-bold text-xs md:text-sm shadow-lg shadow-emerald-700/25 active:scale-[0.98] transition-all cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <span>Sign In with New Password</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        )}

        {/* Footer info */}
        <div className="mt-5 text-center text-[11px] text-slate-400">
          {mode === 'forgot' ? (
            <button
              type="button"
              onClick={() => resetAllFormStates('login')}
              className="font-bold text-emerald-700 dark:text-emerald-400 hover:underline cursor-pointer"
            >
              Remember password? Sign In
            </button>
          ) : (
            <span>By signing in, you agree to Me Plus Terms of Service</span>
          )}
        </div>
      </div>
    </div>
  );
};
