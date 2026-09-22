import React, { useState, useRef, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { api } from '../../services/api';
import { ChatMessage } from '../../types';
import {
  generateSmartAdvisorFallback,
  getStoredAiSettings,
  buildWorkspaceContext,
} from '../../services/aiService';
import {
  Send,
  Bot,
  Copy,
  Check,
  X,
  Trash2,
  ExternalLink,
  ChevronRight,
  BookOpen,
  Sparkles,
  Users,
  Briefcase,
  Clock,
  FileText,
  Kanban,
  Settings,
  Keyboard,
  Compass,
  ArrowUpRight,
  CheckCircle2,
} from 'lucide-react';

export const AiAssistantModal: React.FC = () => {
  const {
    isAiModalOpen,
    setIsAiModalOpen,
    projects,
    clients,
    tasks,
    invoices,
    user,
    showToast,
    confirmAction,
  } = useApp();

  // Active Main Tab: 1 = App Guide & Help Bot, 2 = External AI (ChatGPT & Gemini)
  const [activeMainTab, setActiveMainTab] = useState<'app-guide' | 'external-ai'>('app-guide');

  // Chat State for App Guide Bot
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Active Category Filter for App Guide Starters
  const [guideCategory, setGuideCategory] = useState<'all' | 'clients' | 'projects' | 'time' | 'invoices' | 'tasks' | 'settings'>('all');

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Initial greeting if chat is empty
  useEffect(() => {
    if (isAiModalOpen && messages.length === 0) {
      const initialGreeting: ChatMessage = {
        id: 'msg-init',
        sender: 'ai',
        text: `### 📘 Welcome to the Me Plus App Guide & Help Bot!\n\nHello **${user?.name ? user.name.split(' ')[0] : 'there'}**! I am here to assist you with using this application.\n\nYou can ask me how any feature works, such as:\n• 👥 **Clients**: How to add clients, set custom hourly rates, and manage status.\n• 🚀 **Projects**: Creating projects, assigning clients, and monitoring progress.\n• ⏱️ **Time Tracking**: Using the live stopwatch timer and logging past hours.\n• 💵 **Invoices**: Creating itemized invoices, applying taxes, and exporting.\n• 📌 **Tasks**: Moving cards on the Kanban board and filtering by priority.\n• ⚙️ **Settings & Shortcuts**: Customizing rates, currency, themes, and \`Ctrl + K\`.\n\nClick any topic chip below or type your question!`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        provider: 'builtin',
        model: 'App Guide',
      };
      setMessages([initialGreeting]);
    }
  }, [isAiModalOpen, user?.name, messages.length]);

  // Focus textarea when modal opens on App Guide tab
  useEffect(() => {
    if (isAiModalOpen && activeMainTab === 'app-guide') {
      setTimeout(() => {
        textareaRef.current?.focus();
        scrollToBottom();
      }, 100);
    }
  }, [isAiModalOpen, activeMainTab]);

  // ESC key listener to dismiss modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isAiModalOpen) {
        setIsAiModalOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isAiModalOpen, setIsAiModalOpen]);

  // Scroll to bottom on message change
  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  if (!isAiModalOpen) return null;

  // App Guide Starter Questions by Category
  const guideCategories = [
    { id: 'all', label: '⭐ All Features', icon: <Compass className="w-3 h-3" /> },
    { id: 'clients', label: '👥 Clients', icon: <Users className="w-3 h-3" /> },
    { id: 'projects', label: '🚀 Projects', icon: <Briefcase className="w-3 h-3" /> },
    { id: 'time', label: '⏱️ Time Tracker', icon: <Clock className="w-3 h-3" /> },
    { id: 'invoices', label: '💵 Invoices', icon: <FileText className="w-3 h-3" /> },
    { id: 'tasks', label: '📌 Kanban Tasks', icon: <Kanban className="w-3 h-3" /> },
    { id: 'settings', label: '⚙️ Settings & Keys', icon: <Settings className="w-3 h-3" /> },
  ] as const;

  const guidePrompts: Record<typeof guideCategory, { label: string; prompt: string }[]> = {
    all: [
      { label: '👥 How do I add a new client?', prompt: 'How do I add a new client in Me Plus?' },
      { label: '🚀 How do I create a project?', prompt: 'How do I create and manage a new project?' },
      { label: '⏱️ How does the live stopwatch work?', prompt: 'How do I track billable hours with the live stopwatch?' },
      { label: '💵 How do I create an invoice?', prompt: 'How do I create and export an invoice for a client?' },
      { label: '📌 How do I move tasks on Kanban?', prompt: 'How do I move tasks on the Kanban board?' },
      { label: '⌨️ What keyboard shortcuts exist?', prompt: 'What keyboard shortcuts are available in Me Plus?' },
    ],
    clients: [
      { label: '➕ Adding a Client', prompt: 'How do I add a new client to my workspace?' },
      { label: '💲 Setting Client Hourly Rates', prompt: 'Can I set different hourly rates for different clients?' },
      { label: '📁 Client Status (Active vs Lead)', prompt: 'What do the client status badges (Active, Lead, Archived) mean?' },
    ],
    projects: [
      { label: '➕ Creating a Project', prompt: 'How do I create a new project and link it to a client?' },
      { label: '📊 Project Progress Bar', prompt: 'How is the project progress percentage calculated?' },
      { label: '📅 Managing Deadlines', prompt: 'Where can I see upcoming project deadlines?' },
    ],
    time: [
      { label: '⏱️ Using the Live Stopwatch', prompt: 'How do I start and stop the live time tracker?' },
      { label: '✍️ Logging Past / Manual Hours', prompt: 'How do I log manual time entries for work done earlier?' },
      { label: '📂 Linking Time to Projects', prompt: 'How do I link my tracked hours to a specific project?' },
    ],
    invoices: [
      { label: '🧾 Creating an Invoice', prompt: 'How do I generate an invoice for a client?' },
      { label: '➕ Adding Line Items & Taxes', prompt: 'How do I add itemized task rows and tax percentages to invoices?' },
      { label: '✅ Marking Invoices as Paid', prompt: 'How do I change an invoice status from Sent to Paid?' },
    ],
    tasks: [
      { label: '📋 Kanban 4 Columns Explained', prompt: 'How are tasks organized across the 4 Kanban columns?' },
      { label: '✋ Drag & Drop Tasks', prompt: 'How do I drag and drop tasks between To Do, In Progress, Review, and Done?' },
      { label: '🏷️ Priority & Client Filters', prompt: 'How do I filter my task board by priority or specific client?' },
    ],
    settings: [
      { label: '💰 Changing Hourly Rate & Currency', prompt: 'Where do I update my base hourly rate and currency symbol?' },
      { label: '🌙 Dark Mode & Accent Colors', prompt: 'How do I toggle Dark Mode or change accent colors?' },
      { label: '⌨️ Command Palette (Ctrl + K)', prompt: 'How does the Ctrl + K Command Palette work?' },
      { label: '🔐 Email OTP Password Reset', prompt: 'How does the email OTP password recovery work?' },
    ],
  };

  // External AI Prompts for 1-Click Copying
  const externalGeminiPrompts = [
    'Review this freelance proposal draft and suggest 3 ways to make it more persuasive.',
    'Write a polite email asking a client for feedback on a design milestone.',
    'Help me calculate a fair fixed price estimate for a 4-week freelance web development sprint.',
    'Generate 5 high-converting headlines for my freelance portfolio website.',
  ];

  const externalChatGptPrompts = [
    'Draft a professional freelance contract clause regarding revision limits and payment terms.',
    'Write a firm but polite notice informing a client that active work is paused due to unpaid invoices.',
    'Summarize these messy client meeting notes into clear, bulleted project deliverables.',
    'How should I respond to a client who wants an extra discount after agreeing to a quote?',
  ];

  const activeAi = getStoredAiSettings(user);
  const activeProvider =
    activeAi.provider === 'gemini' && activeAi.geminiApiKey?.trim()
      ? 'gemini'
      : activeAi.provider === 'openai' && activeAi.openaiApiKey?.trim()
      ? 'openai'
      : 'builtin';

  const activeKey =
    activeProvider === 'gemini'
      ? activeAi.geminiApiKey
      : activeProvider === 'openai'
      ? activeAi.openaiApiKey
      : undefined;

  const activeModel =
    activeProvider === 'gemini'
      ? activeAi.geminiModel
      : activeProvider === 'openai'
      ? activeAi.openaiModel
      : 'Me Plus Guide';

  const executeSend = async (queryText: string) => {
    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text: queryText,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages(prev => [...prev, userMsg]);
    setInputMessage('');
    setIsTyping(true);

    try {
      const workspaceContext = buildWorkspaceContext(user, clients, projects, tasks, invoices);
      // 1. Send to AI chat endpoint with active provider & credentials
      const res = await api.sendAiMessage(queryText, {
        provider: activeProvider,
        apiKey: activeKey,
        model: activeModel,
        workspaceContext,
        customInstructions: activeAi.customInstructions,
        userId: user?.id,
        history: messages.slice(-6).map(m => ({
          role: m.sender === 'user' ? 'user' : 'assistant',
          content: m.text,
        })),
      });

      if (res && res.reply) {
        const aiMsg: ChatMessage = {
          id: `ai-${Date.now()}`,
          sender: 'ai',
          text: res.reply,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          provider: (res.provider as any) || activeProvider,
          model: res.model || activeModel,
        };
        setMessages(prev => [...prev, aiMsg]);
        setIsTyping(false);
        return;
      }
    } catch (backendErr) {
      console.warn('AI request error, using client-side fallback:', backendErr);
    }

    // 2. Client-side App Guide fallback
    setTimeout(() => {
      const fallbackText = generateSmartAdvisorFallback(queryText, user, clients, projects, tasks, invoices);
      const aiMsg: ChatMessage = {
        id: `ai-${Date.now()}`,
        sender: 'ai',
        text: fallbackText,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        provider: 'builtin',
        model: 'Me Plus Guide',
      };
      setMessages(prev => [...prev, aiMsg]);
      setIsTyping(false);
    }, 300);
  };

  const handleSendMessage = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const query = inputMessage.trim();
    if (!query || isTyping) return;
    executeSend(query);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleQuickPrompt = (promptText: string) => {
    if (isTyping) return;
    executeSend(promptText);
  };

  const handleCopyText = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
    showToast({
      title: 'Copied!',
      message: 'Guide instructions copied to clipboard.',
      type: 'info',
    });
  };

  const handleCopyPromptForExternal = (promptText: string, id: string, toolName: string) => {
    navigator.clipboard.writeText(promptText);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2500);
    showToast({
      title: 'Prompt Copied!',
      message: `Ready to paste directly into ${toolName}.`,
      type: 'success',
    });
  };

  const handleClearChat = () => {
    confirmAction({
      title: 'Clear Guide Chat?',
      message: 'Are you sure you want to clear your help conversation history?',
      confirmText: 'Clear Chat',
      danger: true,
      itemType: 'chat',
      onConfirm: () => {
        const initialGreeting: ChatMessage = {
          id: `msg-init-${Date.now()}`,
          sender: 'ai',
          text: `Chat cleared! 👋 What feature in Me Plus would you like help with?`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          provider: 'builtin',
          model: 'App Guide',
        };
        setMessages([initialGreeting]);
      },
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/75 backdrop-blur-md animate-fade-in">
      <div
        className="w-full max-w-3xl bg-white dark:bg-slate-900 rounded-2xl sm:rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col h-[90vh] max-h-[850px] overflow-hidden relative"
        onClick={e => e.stopPropagation()}
      >
        {/* Top Header */}
        <div className="px-4 py-3 sm:px-6 sm:py-3.5 border-b border-slate-200/80 dark:border-slate-800/80 bg-slate-50/90 dark:bg-slate-900/90 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 sm:p-2.5 rounded-2xl bg-gradient-to-tr from-emerald-600 via-teal-600 to-whatsapp-teal text-white shadow-md shadow-emerald-700/20 shrink-0">
              <BookOpen className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-black text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <span>Me Plus Platform Assistant</span>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                  activeProvider === 'gemini'
                    ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-300/40'
                    : activeProvider === 'openai'
                    ? 'bg-cyan-100 dark:bg-cyan-950 text-cyan-800 dark:text-cyan-300 border border-cyan-300/40'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                }`}>
                  {activeProvider === 'gemini' ? 'Gemini Live' : activeProvider === 'openai' ? 'ChatGPT Live' : 'Built-in Copilot'}
                </span>
              </h2>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Application Guide &amp; External AI Launchpad
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1 sm:gap-2">
            {activeMainTab === 'app-guide' && (
              <button
                onClick={handleClearChat}
                className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
                title="Clear Guide Conversation"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
            <button
              onClick={() => setIsAiModalOpen(false)}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              title="Close (Esc)"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Segmented Control Bar: 1. Me Plus App Guide | 2. ChatGPT & Gemini AI */}
        <div className="p-2 bg-slate-100 dark:bg-slate-950/80 border-b border-slate-200/80 dark:border-slate-800/80 flex items-center gap-2">
          <button
            type="button"
            onClick={() => setActiveMainTab('app-guide')}
            className={`flex-1 py-2 px-2.5 sm:px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 sm:gap-2 cursor-pointer ${
              activeMainTab === 'app-guide'
                ? 'bg-white dark:bg-slate-800 text-emerald-800 dark:text-emerald-300 shadow-sm border border-slate-200/80 dark:border-slate-700'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <span className="hidden sm:inline">1. Me Plus App Guide &amp; Help Bot</span>
            <span className="sm:hidden">App Guide</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveMainTab('external-ai')}
            className={`flex-1 py-2 px-2.5 sm:px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 sm:gap-2 cursor-pointer ${
              activeMainTab === 'external-ai'
                ? 'bg-white dark:bg-slate-800 text-cyan-800 dark:text-cyan-300 shadow-sm border border-slate-200/80 dark:border-slate-700'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400 shrink-0" />
            <span className="hidden sm:inline">2. ChatGPT &amp; Gemini AI (No API Keys)</span>
            <span className="sm:hidden">External AI</span>
          </button>
        </div>

        {/* SECTION 1: Me Plus App Guide & Help Bot */}
        {activeMainTab === 'app-guide' && (
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Messages Stream */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 bg-slate-50/50 dark:bg-slate-950/40">
              {messages.map(msg => (
                <div
                  key={msg.id}
                  className={`flex items-start gap-2.5 sm:gap-3 ${
                    msg.sender === 'user' ? 'flex-row-reverse' : 'flex-row'
                  }`}
                >
                  {/* Avatar */}
                  {msg.sender === 'user' ? (
                    <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-gradient-to-tr from-emerald-600 to-teal-600 text-white flex items-center justify-center shrink-0 shadow-sm font-bold text-xs">
                      {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
                    </div>
                  ) : (
                    <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-sm">
                      <Bot className="w-4 h-4" />
                    </div>
                  )}

                  {/* Message Bubble */}
                  <div
                    className={`max-w-[88%] sm:max-w-[82%] rounded-2xl p-3.5 sm:p-4 text-xs sm:text-sm shadow-sm relative group ${
                      msg.sender === 'user'
                        ? 'bg-gradient-to-r from-emerald-600 via-teal-600 to-whatsapp-teal text-white rounded-tr-sm'
                        : 'bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-200/80 dark:border-slate-700/60 rounded-tl-sm'
                    }`}
                  >
                    {/* Content formatted with clean line breaks */}
                    <div className="leading-relaxed whitespace-pre-wrap font-sans space-y-2">
                      {msg.text}
                    </div>

                    {/* Footer Time & Copy Button */}
                    <div
                      className={`mt-2.5 pt-2 border-t flex items-center justify-between text-[10px] ${
                        msg.sender === 'user'
                          ? 'border-emerald-500/30 text-emerald-100/80'
                          : 'border-slate-100 dark:border-slate-700/60 text-slate-400'
                      }`}
                    >
                      <div className="flex items-center gap-1.5">
                        <span>{msg.timestamp}</span>
                        {msg.sender === 'ai' && (
                          <span className="px-1.5 py-0.5 rounded-md bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 font-bold text-[9px]">
                            {msg.model || (activeProvider === 'gemini' ? 'Gemini AI' : activeProvider === 'openai' ? 'ChatGPT' : 'Me Plus Guide')}
                          </span>
                        )}
                      </div>

                      {msg.sender === 'ai' && (
                        <button
                          onClick={() => handleCopyText(msg.text, msg.id)}
                          className="opacity-0 group-hover:opacity-100 hover:text-emerald-700 dark:hover:text-emerald-400 flex items-center gap-1 transition-opacity text-[10px] cursor-pointer"
                          title="Copy instructions"
                        >
                          {copiedId === msg.id ? (
                            <Check className="w-3 h-3 text-emerald-500" />
                          ) : (
                            <Copy className="w-3 h-3" />
                          )}
                          <span>{copiedId === msg.id ? 'Copied' : 'Copy'}</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}

              {/* Typing Indicator */}
              {isTyping && (
                <div className="flex items-start gap-2.5">
                  <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-sm">
                    <Bot className="w-4 h-4" />
                  </div>
                  <div className="bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700/60 rounded-2xl rounded-tl-sm p-3.5 shadow-sm flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-600 animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="w-2 h-2 rounded-full bg-whatsapp-teal animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="w-2 h-2 rounded-full bg-whatsapp-light animate-bounce" style={{ animationDelay: '300ms' }} />
                    <span className="text-[11px] text-slate-400 ml-1">
                      Finding app instructions...
                    </span>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Guide Topic Selector & Quick Prompt Chips */}
            <div className="border-t border-slate-200/60 dark:border-slate-800/60 bg-white/95 dark:bg-slate-900/95">
              {/* Category Filter Tabs */}
              <div className="px-3 pt-2 pb-1 overflow-x-auto flex items-center gap-1.5 border-b border-slate-100 dark:border-slate-800/50 no-scrollbar">
                {guideCategories.map(cat => (
                  <button
                    key={cat.id}
                    onClick={() => setGuideCategory(cat.id)}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-bold flex items-center gap-1.5 whitespace-nowrap transition-all shrink-0 cursor-pointer ${
                      guideCategory === cat.id
                        ? 'bg-emerald-600 text-white shadow-xs'
                        : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                  >
                    <span>{cat.label}</span>
                  </button>
                ))}
              </div>

              {/* Quick Prompt Chips */}
              <div className="px-3 py-2 overflow-x-auto flex items-center gap-2 no-scrollbar">
                {guidePrompts[guideCategory].map((p, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleQuickPrompt(p.prompt)}
                    className="px-3 py-1.5 rounded-full text-[11px] font-medium text-slate-700 dark:text-slate-300 bg-slate-100/90 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/70 hover:border-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 hover:text-emerald-800 dark:hover:text-emerald-300 whitespace-nowrap transition-all flex items-center gap-1 shrink-0 shadow-2xs group cursor-pointer"
                    title={p.prompt}
                  >
                    <span>{p.label}</span>
                    <ChevronRight className="w-3 h-3 opacity-40 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all text-emerald-600" />
                  </button>
                ))}
              </div>
            </div>

            {/* Input Bar */}
            <form
              onSubmit={handleSendMessage}
              className="p-3 sm:p-4 border-t border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-slate-900 flex items-end gap-2"
            >
              <div className="relative flex-1">
                <textarea
                  ref={textareaRef}
                  rows={1}
                  value={inputMessage}
                  onChange={e => setInputMessage(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Ask how to do anything in Me Plus (Enter to send, Shift+Enter for newline)..."
                  className="w-full pl-3.5 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs md:text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 shadow-inner resize-none min-h-[44px] max-h-[100px] leading-relaxed"
                />
              </div>

              <button
                type="submit"
                disabled={!inputMessage.trim() || isTyping}
                className={`p-3 rounded-2xl transition-all shadow-md flex items-center justify-center shrink-0 cursor-pointer ${
                  inputMessage.trim() && !isTyping
                    ? 'bg-gradient-to-r from-emerald-600 via-teal-600 to-whatsapp-teal hover:from-emerald-700 hover:to-whatsapp-dark text-white active:scale-95 shadow-emerald-700/25'
                    : 'bg-slate-200 dark:bg-slate-800 text-slate-400 cursor-not-allowed'
                }`}
                title="Send Question"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>
        )}

        {/* SECTION 2: External AI Portals (ChatGPT & Gemini) - NO API KEYS NEEDED */}
        {activeMainTab === 'external-ai' && (
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 bg-slate-50/50 dark:bg-slate-950/40">
            {/* Banner Notice */}
            <div className="p-4 rounded-2xl bg-gradient-to-r from-cyan-50 via-teal-50 to-emerald-50 dark:from-cyan-950/40 dark:via-teal-950/30 dark:to-emerald-950/40 border border-cyan-200/80 dark:border-cyan-800/60 shadow-xs">
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-xl bg-cyan-600 text-white shrink-0 shadow-sm mt-0.5">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-xs sm:text-sm font-black text-slate-900 dark:text-slate-100">
                    Direct Web Access — No Developer API Keys Required!
                  </h3>
                  <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 leading-relaxed">
                    You do not need to register developer keys or configure technical settings. Simply click below to open the official <strong>Google Gemini</strong> or <strong>ChatGPT</strong> web app in your browser, sign in with your regular Google account or email, and chat freely!
                  </p>
                </div>
              </div>
            </div>

            {/* Two Main Cards: Google Gemini & OpenAI ChatGPT */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5">
              {/* Google Gemini Card */}
              <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-sm flex flex-col justify-between hover:border-emerald-400/80 transition-all">
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-purple-600 text-white flex items-center justify-center font-bold text-sm shadow-sm">
                        G
                      </div>
                      <div>
                        <h4 className="font-extrabold text-sm text-slate-900 dark:text-slate-100">
                          Google Gemini
                        </h4>
                        <span className="text-[10px] font-semibold text-emerald-700 dark:text-emerald-400">
                          gemini.google.com
                        </span>
                      </div>
                    </div>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300">
                      Free with Google
                    </span>
                  </div>

                  <p className="text-xs text-slate-600 dark:text-slate-400 mb-4 leading-relaxed">
                    Google’s smart conversational AI. Log in with any standard Gmail or Google account to research ideas, draft communications, and review content.
                  </p>

                  {/* Launch Button */}
                  <a
                    href="https://gemini.google.com"
                    target="_blank"
                    rel="noreferrer"
                    className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-xs font-bold flex items-center justify-center gap-2 shadow-md shadow-blue-600/20 transition-all active:scale-98"
                  >
                    <span>Open Google Gemini</span>
                    <ArrowUpRight className="w-4 h-4" />
                  </a>

                  {/* Copyable Prompts for Gemini */}
                  <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800">
                    <div className="text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-2 flex items-center gap-1.5">
                      <Copy className="w-3 h-3 text-blue-500" />
                      <span>Click to copy a starter prompt:</span>
                    </div>
                    <div className="space-y-1.5">
                      {externalGeminiPrompts.map((p, idx) => (
                        <button
                          key={idx}
                          onClick={() => handleCopyPromptForExternal(p, `gemini-${idx}`, 'Google Gemini')}
                          className="w-full text-left p-2 rounded-lg bg-slate-50 dark:bg-slate-800/60 hover:bg-blue-50 dark:hover:bg-blue-950/40 border border-slate-200/60 dark:border-slate-800 text-[11px] text-slate-700 dark:text-slate-300 transition-colors flex items-center justify-between group cursor-pointer"
                        >
                          <span className="truncate pr-2">{p}</span>
                          <span className="shrink-0 text-[10px] font-semibold text-blue-600 dark:text-blue-400 opacity-80 group-hover:opacity-100">
                            {copiedId === `gemini-${idx}` ? 'Copied!' : 'Copy'}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* OpenAI ChatGPT Card */}
              <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-sm flex flex-col justify-between hover:border-teal-400/80 transition-all">
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-teal-600 via-emerald-600 to-cyan-600 text-white flex items-center justify-center font-bold text-sm shadow-sm">
                        AI
                      </div>
                      <div>
                        <h4 className="font-extrabold text-sm text-slate-900 dark:text-slate-100">
                          OpenAI ChatGPT
                        </h4>
                        <span className="text-[10px] font-semibold text-teal-700 dark:text-teal-400">
                          chatgpt.com
                        </span>
                      </div>
                    </div>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-cyan-100 dark:bg-cyan-950 text-cyan-800 dark:text-cyan-300">
                      Free with Any Email
                    </span>
                  </div>

                  <p className="text-xs text-slate-600 dark:text-slate-400 mb-4 leading-relaxed">
                    OpenAI’s conversational model. Sign up or log in with any email, Microsoft, or Google account to draft contracts, write proposals, and brainstorm.
                  </p>

                  {/* Launch Button */}
                  <a
                    href="https://chatgpt.com"
                    target="_blank"
                    rel="noreferrer"
                    className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 text-white text-xs font-bold flex items-center justify-center gap-2 shadow-md shadow-teal-600/20 transition-all active:scale-98"
                  >
                    <span>Open OpenAI ChatGPT</span>
                    <ArrowUpRight className="w-4 h-4" />
                  </a>

                  {/* Copyable Prompts for ChatGPT */}
                  <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800">
                    <div className="text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-2 flex items-center gap-1.5">
                      <Copy className="w-3 h-3 text-teal-500" />
                      <span>Click to copy a starter prompt:</span>
                    </div>
                    <div className="space-y-1.5">
                      {externalChatGptPrompts.map((p, idx) => (
                        <button
                          key={idx}
                          onClick={() => handleCopyPromptForExternal(p, `chatgpt-${idx}`, 'ChatGPT')}
                          className="w-full text-left p-2 rounded-lg bg-slate-50 dark:bg-slate-800/60 hover:bg-teal-50 dark:hover:bg-teal-950/40 border border-slate-200/60 dark:border-slate-800 text-[11px] text-slate-700 dark:text-slate-300 transition-colors flex items-center justify-between group cursor-pointer"
                        >
                          <span className="truncate pr-2">{p}</span>
                          <span className="shrink-0 text-[10px] font-semibold text-teal-600 dark:text-teal-400 opacity-80 group-hover:opacity-100">
                            {copiedId === `chatgpt-${idx}` ? 'Copied!' : 'Copy'}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Helpful How-To Footnote */}
            <div className="p-4 rounded-2xl bg-slate-100/80 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/60 text-xs text-slate-600 dark:text-slate-300 flex items-start gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold text-slate-900 dark:text-slate-100">Workflow Tip: </span>
                Click <strong>"Copy"</strong> on any prompt above, click <strong>"Open Google Gemini"</strong> or <strong>"Open ChatGPT"</strong>, and paste the prompt into their chat box to receive immediate answers without any technical configuration!
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
