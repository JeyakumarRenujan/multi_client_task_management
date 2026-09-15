import React, { useState, useRef, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { api } from '../../services/api';
import {
  AiProvider,
  AiSettings,
  ChatMessage,
} from '../../types';
import {
  AI_MODELS,
  getStoredAiSettings,
  saveStoredAiSettings,
  buildWorkspaceContext,
  buildSystemPrompt,
  callGeminiDirect,
  callOpenAiDirect,
  testAiConnection,
} from '../../services/aiService';
import {
  Sparkles,
  Send,
  Bot,
  Copy,
  Check,
  X,
  Trash2,
  Sliders,
  Key,
  ExternalLink,
  ShieldCheck,
  AlertCircle,
  Loader2,
  CheckCircle2,
  Eye,
  EyeOff,
  Zap,
  Cpu,
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
    updateUserProfile,
    showToast,
    confirmAction,
  } = useApp();

  // AI Configuration State
  const [aiSettings, setAiSettings] = useState<AiSettings>(() => getStoredAiSettings(user));
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // In-Drawer Settings Form State
  const [tempProvider, setTempProvider] = useState<AiProvider>(aiSettings.provider || 'builtin');
  const [tempGeminiKey, setTempGeminiKey] = useState(aiSettings.geminiApiKey || '');
  const [tempOpenAiKey, setTempOpenAiKey] = useState(aiSettings.openaiApiKey || '');
  const [tempGeminiModel, setTempGeminiModel] = useState(aiSettings.geminiModel || 'gemini-1.5-flash');
  const [tempOpenAiModel, setTempOpenAiModel] = useState(aiSettings.openaiModel || 'gpt-4o-mini');
  const [tempInstructions, setTempInstructions] = useState(aiSettings.customInstructions || '');
  const [showApiKey, setShowApiKey] = useState(false);

  // Connection Testing State
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{
    success?: boolean;
    message?: string;
    latencyMs?: number;
  } | null>(null);

  // Chat State
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Sync AI Settings if user profile updates
  useEffect(() => {
    if (user?.aiSettings) {
      setAiSettings(user.aiSettings);
      setTempProvider(user.aiSettings.provider);
      setTempGeminiKey(user.aiSettings.geminiApiKey || '');
      setTempOpenAiKey(user.aiSettings.openaiApiKey || '');
      setTempGeminiModel(user.aiSettings.geminiModel || 'gemini-1.5-flash');
      setTempOpenAiModel(user.aiSettings.openaiModel || 'gpt-4o-mini');
      setTempInstructions(user.aiSettings.customInstructions || '');
    }
  }, [user?.aiSettings]);

  // Initial greeting if chat is empty
  useEffect(() => {
    if (isAiModalOpen && messages.length === 0) {
      const activeModelName =
        aiSettings.provider === 'gemini'
          ? 'Google Gemini (' + (aiSettings.geminiModel || 'gemini-1.5-flash') + ')'
          : aiSettings.provider === 'openai'
          ? 'OpenAI ChatGPT (' + (aiSettings.openaiModel || 'gpt-4o-mini') + ')'
          : 'Me Plus Smart Advisor';

      const initialGreeting: ChatMessage = {
        id: 'msg-init',
        sender: 'ai',
        text: `Hello ${user?.name ? user.name.split(' ')[0] : 'there'}! 👋 I am your **Me Plus AI Freelancer Copilot**, currently powered by **${activeModelName}**.\n\nI have full awareness of your current projects, clients, and deadlines. I can assist you with:\n• 💬 **Drafting client communications** (payment follow-ups, proposals, milestone updates)\n• 💰 **Pricing & Rate Strategy** (hourly vs fixed pricing, rate increase notices)\n• 🛡️ **Managing Scope Creep** (polite pushback, budget addendums, contract terms)\n• ⚡ **Daily Task Prioritization** (sprint planning, deadline risk assessment)\n\nWhat would you like assistance with today?`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        provider: aiSettings.provider,
        model: activeModelName,
      };
      setMessages([initialGreeting]);
    }
  }, [isAiModalOpen, user?.name, messages.length, aiSettings.provider, aiSettings.geminiModel, aiSettings.openaiModel]);

  // Focus input when modal opens
  useEffect(() => {
    if (isAiModalOpen && !isSettingsOpen) {
      setTimeout(() => {
        inputRef.current?.focus();
        scrollToBottom();
      }, 100);
    }
  }, [isAiModalOpen, isSettingsOpen]);

  // Scroll to bottom on message change
  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  if (!isAiModalOpen) return null;

  const quickPrompts = [
    {
      label: '💰 Rate Increase Notice',
      prompt: 'How do I politely inform an existing client that my hourly rates are increasing by $15?',
    },
    {
      label: '📧 Overdue Invoice Follow-Up',
      prompt: 'Draft a polite but firm follow-up email for an overdue invoice with a clear payment deadline.',
    },
    {
      label: '🛡️ Scope Creep Handling',
      prompt: 'A client is requesting 3 additional unplanned features. How should I propose an add-on budget professionally?',
    },
    {
      label: '📊 Workspace Status Digest',
      prompt: 'Summarize my current clients and urgent tasks, and recommend 3 priorities for today.',
    },
    {
      label: '🚀 Client Proposal Pitch',
      prompt: 'Write a high-converting short proposal pitch to win a new web design & development project.',
    },
  ];

  // Client-side fallback rule generator
  const generateAiReply = (userQuery: string): string => {
    const q = userQuery.toLowerCase();
    const clientNames = clients.map(c => c.company || c.name).slice(0, 5).join(', ');
    const projectTitles = projects.map(p => p.title).slice(0, 5).join(', ');

    if (q.includes('rate') || q.includes('price') || q.includes('pricing') || q.includes('increase')) {
      return `### 💡 Strategy for Hourly Rate & Pricing:\n\n1. **Give 30-45 Days Notice**: Provide ample runway before applying new rates.\n2. **Highlight Compounded Value**: Point out your improved turnaround speed and senior skillset.\n3. **Grandfathering Discount**: Offer existing clients a grace month for pre-booked milestone blocks.\n\n**Draft Email Template:**\n> *"Hi [Client Name], as I continue to expand my tools, certifications, and capabilities, my standard rate will adjust from $${user?.hourlyRate || 65}/hr to $${(user?.hourlyRate || 65) + 15}/hr starting next month. Because I deeply appreciate our long-standing partnership, all ongoing projects and hours booked this month will be honored at our current rate. Looking forward to our continued success!"*`;
    }

    if (q.includes('overdue') || q.includes('invoice') || q.includes('payment') || q.includes('unpaid')) {
      return `### 📧 Overdue Invoice Follow-Up Draft:\n\n**Subject:** *Follow-up: Invoice status for [Project Name]*\n\n> *"Hi [Client Name],\n>\n> I hope you are having a productive week!\n>\n> I am following up on invoice **#INV-2026-X**, which was due recently. Please let me know if your finance team requires any additional documentation, tax forms, or updated bank details to process this.\n>\n> I have re-attached the invoice copy for your convenience. Thank you for your prompt attention!\n>\n> Best regards,\n> ${user?.name || 'Freelancer'}*"*\n\n**Tip:** If payment is overdue by 14+ days, politely pause subsequent milestones until cleared.`;
    }

    if (q.includes('scope') || q.includes('creep') || q.includes('extra') || q.includes('change')) {
      return `### 🛡️ Managing Scope Creep with Grace:\n\nWhen a client asks for tasks outside the agreed milestone, **never say a flat 'No'**—say **'Yes, and here is how we can budget it'**:\n\n**Recommended Response Template:**\n> *"Hi [Client Name],\n>\n> That is a fantastic feature idea and would certainly elevate the project! \n>\n> Since this falls outside our original milestone deliverables, I can create a quick add-on scope estimate for you (approx. 5–8 hours). We can either:\n> 1. Add it to our current sprint as Phase 2, or\n> 2. Swap out an existing lower-priority task from this sprint to keep the launch date on track.\n>\n> Let me know which approach you prefer!"*`;
    }

    if (q.includes('pitch') || q.includes('proposal') || q.includes('new client') || q.includes('win client')) {
      return `### 🎯 High-Converting Client Pitch Template:\n\n**Subject:** *Partnering on [Client Company]'s UI & Web Product Growth*\n\n> *"Hi [Client Name],\n>\n> I’ve been following [Client Company]'s recent developments and was very impressed with your latest release.\n>\n> As an independent specialist in ${user?.title || 'full-stack web development and UI/UX engineering'}, I help teams build fast, clean, and high-converting digital products.\n>\n> I’d love to share 2 quick ideas on how we can optimize your upcoming roadmap. Do you have 15 minutes for a quick introductory chat next Tuesday?\n>\n> Best,\n> ${user?.name || 'Freelancer'}*"*`;
    }

    return `### 📊 Workspace Overview & Action Plan:\n\n• **Active Clients (${clients.length})**: ${clientNames || 'None yet'}\n• **Projects (${projects.length})**: ${projectTitles || 'None yet'}\n• **Pending Tasks**: ${tasks.filter(t => t.status !== 'done').length} tasks remaining across all boards.\n\n**Productivity Recommendation:** Focus on urgent deadlines first, log time with the live stopwatch, and share proactive status updates with clients every 48 hours to maintain high trust.\n\n*Tip: Switch provider to Google Gemini or OpenAI ChatGPT in the settings to chat with live generative intelligence!*`;
  };

  const handleTestConnection = async () => {
    if (tempProvider === 'builtin') {
      setTestResult({
        success: true,
        message: 'Built-in Smart Advisor is ready and requires no API key.',
        latencyMs: 10,
      });
      return;
    }

    const key = tempProvider === 'gemini' ? tempGeminiKey : tempOpenAiKey;
    const model = tempProvider === 'gemini' ? tempGeminiModel : tempOpenAiModel;

    if (!key || !key.trim()) {
      setTestResult({
        success: false,
        message: `Please paste your ${tempProvider === 'gemini' ? 'Google Gemini' : 'OpenAI'} API key first.`,
      });
      return;
    }

    setIsTesting(true);
    setTestResult(null);

    const res = await testAiConnection(tempProvider, key.trim(), model);
    setIsTesting(false);
    setTestResult(res);
  };

  const handleSaveAiSettings = () => {
    const updated: AiSettings = {
      provider: tempProvider,
      geminiApiKey: tempGeminiKey.trim(),
      geminiModel: tempGeminiModel,
      openaiApiKey: tempOpenAiKey.trim(),
      openaiModel: tempOpenAiModel,
      customInstructions: tempInstructions.trim(),
    };

    setAiSettings(updated);
    saveStoredAiSettings(updated);
    updateUserProfile({ aiSettings: updated });

    setIsSettingsOpen(false);
    setTestResult(null);

    const providerLabel =
      updated.provider === 'gemini'
        ? 'Google Gemini (' + updated.geminiModel + ')'
        : updated.provider === 'openai'
        ? 'OpenAI ChatGPT (' + updated.openaiModel + ')'
        : 'Me Plus Built-in Advisor';

    showToast({
      title: 'AI Copilot Configured',
      message: `Active AI set to ${providerLabel}. Ready to chat!`,
      type: 'success',
    });
  };

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

    const workspaceContext = buildWorkspaceContext(user, clients, projects, tasks, invoices);
    const systemPrompt = buildSystemPrompt(workspaceContext, aiSettings.customInstructions);

    // Prepare history for multi-turn conversations
    const historyPayload = messages.slice(-8).map(m => ({
      role: (m.sender === 'user' ? 'user' : 'assistant') as 'user' | 'assistant',
      content: m.text,
    }));

    const activeProvider = aiSettings.provider;
    const activeKey =
      activeProvider === 'gemini'
        ? aiSettings.geminiApiKey
        : activeProvider === 'openai'
        ? aiSettings.openaiApiKey
        : '';
    const activeModel =
      activeProvider === 'gemini'
        ? aiSettings.geminiModel || 'gemini-1.5-flash'
        : activeProvider === 'openai'
        ? aiSettings.openaiModel || 'gpt-4o-mini'
        : 'Smart Advisor';

    try {
      // 1. Try backend /api/ai/chat
      const res = await api.sendAiMessage(queryText, {
        history: historyPayload,
        provider: activeProvider,
        apiKey: activeKey,
        model: activeModel,
        workspaceContext,
        customInstructions: aiSettings.customInstructions,
        userId: user?.id,
      });

      if (res && res.reply) {
        const aiMsg: ChatMessage = {
          id: `ai-${Date.now()}`,
          sender: 'ai',
          text: res.reply,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          provider: (res.provider as AiProvider) || activeProvider,
          model: res.model || activeModel,
        };
        setMessages(prev => [...prev, aiMsg]);
        setIsTyping(false);
        return;
      }
    } catch (backendErr) {
      console.warn('Backend AI chat error, attempting direct client fallback:', backendErr);
    }

    // 2. Direct client fallback if backend is unreachable
    try {
      if (activeProvider === 'gemini' && activeKey) {
        const directReply = await callGeminiDirect(
          activeKey,
          activeModel,
          systemPrompt,
          historyPayload,
          queryText
        );
        const aiMsg: ChatMessage = {
          id: `ai-${Date.now()}`,
          sender: 'ai',
          text: directReply,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          provider: 'gemini',
          model: activeModel,
        };
        setMessages(prev => [...prev, aiMsg]);
        setIsTyping(false);
        return;
      }

      if (activeProvider === 'openai' && activeKey) {
        const directReply = await callOpenAiDirect(
          activeKey,
          activeModel,
          systemPrompt,
          historyPayload,
          queryText
        );
        const aiMsg: ChatMessage = {
          id: `ai-${Date.now()}`,
          sender: 'ai',
          text: directReply,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          provider: 'openai',
          model: activeModel,
        };
        setMessages(prev => [...prev, aiMsg]);
        setIsTyping(false);
        return;
      }
    } catch (directErr: any) {
      console.warn('Direct AI provider call failed:', directErr);
      const errorMsg: ChatMessage = {
        id: `ai-${Date.now()}`,
        sender: 'ai',
        text: `⚠️ **Could not connect to ${activeProvider === 'gemini' ? 'Google Gemini' : 'OpenAI'}**: ${directErr.message || 'Network error'}\n\n*Here is built-in workspace guidance instead:*\n\n${generateAiReply(queryText)}`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        provider: 'builtin',
        model: 'Fallback Advisor',
      };
      setMessages(prev => [...prev, errorMsg]);
      setIsTyping(false);
      return;
    }

    // 3. Built-in Smart Advisor fallback
    setTimeout(() => {
      const fallbackText = generateAiReply(queryText);
      const aiMsg: ChatMessage = {
        id: `ai-${Date.now()}`,
        sender: 'ai',
        text: fallbackText,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        provider: 'builtin',
        model: 'Smart Advisor',
      };
      setMessages(prev => [...prev, aiMsg]);
      setIsTyping(false);
    }, 450);
  };

  const handleSendMessage = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const query = inputMessage.trim();
    if (!query || isTyping) return;
    executeSend(query);
  };

  const handleQuickPrompt = (promptText: string) => {
    if (isTyping) return;
    executeSend(promptText);
  };

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
    showToast({
      title: 'Copied!',
      message: 'AI response copied to clipboard.',
      type: 'info',
    });
  };

  const handleClearChat = () => {
    confirmAction({
      title: 'Clear Conversation?',
      message: 'Are you sure you want to clear all chat messages in this AI copilot session? Your conversation history will be reset.',
      confirmText: 'Clear Chat',
      danger: true,
      itemType: 'chat',
      onConfirm: () => {
        const initialGreeting: ChatMessage = {
          id: `msg-init-${Date.now()}`,
          sender: 'ai',
          text: `Conversation cleared! 👋 How can I help you right now with your projects, clients, or rates?`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          provider: aiSettings.provider,
        };
        setMessages([initialGreeting]);
      },
    });
  };

  // Provider Pill Label & Icon
  const getProviderPill = () => {
    if (aiSettings.provider === 'gemini') {
      return {
        label: `Gemini: ${aiSettings.geminiModel || '1.5 Flash'}`,
        color: 'bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800',
        icon: <Sparkles className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />,
      };
    }
    if (aiSettings.provider === 'openai') {
      return {
        label: `ChatGPT: ${aiSettings.openaiModel || '4o-mini'}`,
        color: 'bg-cyan-100 dark:bg-cyan-950 text-cyan-800 dark:text-cyan-300 border-cyan-300 dark:border-cyan-800',
        icon: <Bot className="w-3 h-3 text-cyan-600 dark:text-cyan-400" />,
      };
    }
    return {
      label: 'Built-in Copilot',
      color: 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-700',
      icon: <Zap className="w-3 h-3 text-amber-500" />,
    };
  };

  const pill = getProviderPill();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-sm animate-fade-in">
      <div
        className="w-full max-w-3xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col h-[88vh] max-h-[800px] overflow-hidden relative"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-200/80 dark:border-slate-800/80 bg-slate-50/80 dark:bg-slate-900/90 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="p-2.5 rounded-2xl bg-gradient-to-tr from-whatsapp-dark via-whatsapp-teal to-whatsapp-light text-white shadow-md shadow-emerald-700/20">
                <Bot className="w-5 h-5" />
              </div>
              <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-whatsapp-light rounded-full border-2 border-white dark:border-slate-900 ring-1 ring-emerald-600 animate-pulse" />
            </div>

            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm sm:text-base font-black text-slate-900 dark:text-slate-100">
                  Me Plus AI Copilot
                </h2>

                {/* Provider Pill Button */}
                <button
                  onClick={() => setIsSettingsOpen(prev => !prev)}
                  className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold border transition-all hover:scale-105 active:scale-95 shadow-xs ${pill.color}`}
                  title="Click to change AI Model & API Key"
                >
                  {pill.icon}
                  <span>{pill.label}</span>
                  <Sliders className="w-3 h-3 ml-0.5 opacity-60" />
                </button>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Freelance Business, Client Communications &amp; Strategy Assistant
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1 sm:gap-2">
            <button
              onClick={() => setIsSettingsOpen(prev => !prev)}
              className={`p-2 rounded-xl transition-colors ${
                isSettingsOpen
                  ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300'
                  : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
              title="AI Connection & API Key Settings"
            >
              <Sliders className="w-4 h-4" />
            </button>
            <button
              onClick={handleClearChat}
              className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
              title="Clear Conversation"
            >
              <Trash2 className="w-4 h-4" />
            </button>
            <button
              onClick={() => setIsAiModalOpen(false)}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* In-Modal Settings / Provider Connection Drawer */}
        {isSettingsOpen && (
          <div className="absolute inset-x-0 top-[73px] bottom-0 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md z-20 flex flex-col p-5 overflow-y-auto animate-fade-in border-b border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <Cpu className="w-5 h-5 text-emerald-600" />
                <h3 className="font-bold text-sm sm:text-base text-slate-900 dark:text-slate-100">
                  AI Model &amp; Account Connection
                </h3>
              </div>
              <button
                onClick={() => setIsSettingsOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 mb-4">
              Connect your own AI account to empower the copilot with real, cutting-edge generative AI models.
              Your keys are stored securely in your private workspace.
            </p>

            {/* Provider Tabs */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 mb-4">
              {/* Google Gemini Card */}
              <button
                type="button"
                onClick={() => {
                  setTempProvider('gemini');
                  setTestResult(null);
                }}
                className={`p-3.5 rounded-2xl border text-left flex flex-col justify-between transition-all ${
                  tempProvider === 'gemini'
                    ? 'border-emerald-500 bg-emerald-50/70 dark:bg-emerald-950/40 ring-2 ring-emerald-500/20'
                    : 'border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/40 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center justify-between w-full mb-2">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                    <span className="font-bold text-xs sm:text-sm text-slate-900 dark:text-slate-100">
                      Google Gemini
                    </span>
                  </div>
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-100 dark:bg-emerald-900 text-emerald-800 dark:text-emerald-200">
                    Free Tier
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Fast, accurate &amp; free tier via Google AI Studio.
                </p>
              </button>

              {/* OpenAI ChatGPT Card */}
              <button
                type="button"
                onClick={() => {
                  setTempProvider('openai');
                  setTestResult(null);
                }}
                className={`p-3.5 rounded-2xl border text-left flex flex-col justify-between transition-all ${
                  tempProvider === 'openai'
                    ? 'border-cyan-500 bg-cyan-50/70 dark:bg-cyan-950/40 ring-2 ring-cyan-500/20'
                    : 'border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/40 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center justify-between w-full mb-2">
                  <div className="flex items-center gap-2">
                    <Bot className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
                    <span className="font-bold text-xs sm:text-sm text-slate-900 dark:text-slate-100">
                      OpenAI ChatGPT
                    </span>
                  </div>
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-cyan-100 dark:bg-cyan-900 text-cyan-800 dark:text-cyan-200">
                    GPT-4o
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Direct connection with GPT-4o Mini or GPT-4o.
                </p>
              </button>

              {/* Built-in Smart Advisor Card */}
              <button
                type="button"
                onClick={() => {
                  setTempProvider('builtin');
                  setTestResult(null);
                }}
                className={`p-3.5 rounded-2xl border text-left flex flex-col justify-between transition-all ${
                  tempProvider === 'builtin'
                    ? 'border-amber-500 bg-amber-50/70 dark:bg-amber-950/40 ring-2 ring-amber-500/20'
                    : 'border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/40 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center justify-between w-full mb-2">
                  <div className="flex items-center gap-2">
                    <Zap className="w-4 h-4 text-amber-500" />
                    <span className="font-bold text-xs sm:text-sm text-slate-900 dark:text-slate-100">
                      Built-in Advisor
                    </span>
                  </div>
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-100 dark:bg-amber-900 text-amber-800 dark:text-amber-200">
                    No Key
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Workspace rule-based advice &amp; templates without API keys.
                </p>
              </button>
            </div>

            {/* Provider Configuration Details */}
            {tempProvider === 'gemini' && (
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-3.5 mb-4">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    Google Gemini Model
                  </label>
                  <a
                    href="https://aistudio.google.com/app/apikey"
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600 hover:text-emerald-700 hover:underline"
                  >
                    <span>Get free Google Gemini API Key</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>

                <select
                  value={tempGeminiModel}
                  onChange={e => setTempGeminiModel(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  {AI_MODELS.gemini.map(m => (
                    <option key={m.id} value={m.id}>
                      {m.name} — {m.description}
                    </option>
                  ))}
                </select>

                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-1 block">
                    Gemini API Key
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                      <Key className="w-3.5 h-3.5" />
                    </div>
                    <input
                      type={showApiKey ? 'text' : 'password'}
                      value={tempGeminiKey}
                      onChange={e => setTempGeminiKey(e.target.value)}
                      placeholder="AIzaSy..."
                      className="w-full pl-9 pr-10 py-2 text-xs rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 text-slate-800 dark:text-slate-200 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono"
                    />
                    <button
                      type="button"
                      onClick={() => setShowApiKey(!showApiKey)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                    >
                      {showApiKey ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {tempProvider === 'openai' && (
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-3.5 mb-4">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    OpenAI Model
                  </label>
                  <a
                    href="https://platform.openai.com/api-keys"
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-[11px] font-semibold text-cyan-600 hover:text-cyan-700 hover:underline"
                  >
                    <span>Get OpenAI API Key</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>

                <select
                  value={tempOpenAiModel}
                  onChange={e => setTempOpenAiModel(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  {AI_MODELS.openai.map(m => (
                    <option key={m.id} value={m.id}>
                      {m.name} — {m.description}
                    </option>
                  ))}
                </select>

                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-1 block">
                    OpenAI API Key
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                      <Key className="w-3.5 h-3.5" />
                    </div>
                    <input
                      type={showApiKey ? 'text' : 'password'}
                      value={tempOpenAiKey}
                      onChange={e => setTempOpenAiKey(e.target.value)}
                      placeholder="sk-proj-..."
                      className="w-full pl-9 pr-10 py-2 text-xs rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 text-slate-800 dark:text-slate-200 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono"
                    />
                    <button
                      type="button"
                      onClick={() => setShowApiKey(!showApiKey)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                    >
                      {showApiKey ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Custom Instructions (Optional) */}
            <div className="mb-4">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-1 block">
                Custom Instructions / AI Persona (Optional)
              </label>
              <textarea
                value={tempInstructions}
                onChange={e => setTempInstructions(e.target.value)}
                rows={2}
                placeholder="e.g., Keep email drafts under 120 words. Always suggest charging 20% higher than the client's initial budget."
                className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            {/* Test Result Message */}
            {testResult && (
              <div
                className={`p-3 rounded-xl text-xs mb-4 flex items-start gap-2 ${
                  testResult.success
                    ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                    : 'bg-rose-50 dark:bg-rose-950/60 text-rose-800 dark:text-rose-300 border border-rose-200 dark:border-rose-800'
                }`}
              >
                {testResult.success ? (
                  <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-500 mt-0.5" />
                ) : (
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-500 mt-0.5" />
                )}
                <div>
                  <div className="font-semibold">{testResult.message}</div>
                  {testResult.latencyMs && (
                    <div className="text-[10px] opacity-75 mt-0.5">
                      Response latency: {testResult.latencyMs}ms
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Bottom Actions */}
            <div className="mt-auto pt-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3">
              {tempProvider !== 'builtin' ? (
                <button
                  type="button"
                  onClick={handleTestConnection}
                  disabled={isTesting}
                  className="px-3.5 py-2 rounded-xl text-xs font-bold border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 flex items-center gap-1.5 transition-colors disabled:opacity-50"
                >
                  {isTesting ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Testing Key...</span>
                    </>
                  ) : (
                    <>
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                      <span>Test Connection</span>
                    </>
                  )}
                </button>
              ) : (
                <div />
              )}

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsSettingsOpen(false)}
                  className="px-3 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSaveAiSettings}
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-700/20 active:scale-95 transition-all"
                >
                  Save &amp; Apply
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Promotional Connect Banner when in Built-in Mode */}
        {aiSettings.provider === 'builtin' && (
          <div className="px-4 py-2 bg-gradient-to-r from-emerald-50 via-teal-50 to-cyan-50 dark:from-emerald-950/50 dark:via-teal-950/40 dark:to-cyan-950/50 border-b border-emerald-200/60 dark:border-emerald-800/50 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2 text-emerald-900 dark:text-emerald-200">
              <Sparkles className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
              <span>
                Want real-time AI? Connect your <strong>Google Gemini (Free)</strong> or <strong>ChatGPT</strong> key in 1 click.
              </span>
            </div>
            <button
              onClick={() => setIsSettingsOpen(true)}
              className="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-emerald-600 hover:bg-emerald-700 text-white shrink-0 ml-2 shadow-xs transition-colors"
            >
              Connect Real AI
            </button>
          </div>
        )}

        {/* Chat Message Stream */}
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
                className={`max-w-[85%] sm:max-w-[78%] rounded-2xl p-3.5 sm:p-4 text-xs sm:text-sm shadow-sm relative group ${
                  msg.sender === 'user'
                    ? 'bg-gradient-to-r from-emerald-600 via-teal-600 to-whatsapp-teal text-white rounded-tr-sm'
                    : 'bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-200/80 dark:border-slate-700/60 rounded-tl-sm'
                }`}
              >
                {/* Content formatted with clean line breaks & markdown highlights */}
                <div className="leading-relaxed whitespace-pre-wrap font-sans">
                  {msg.text}
                </div>

                {/* Footer Time, Model Tag & Copy Button */}
                <div
                  className={`mt-2.5 flex items-center justify-between text-[10px] ${
                    msg.sender === 'user' ? 'text-emerald-100/80' : 'text-slate-400'
                  }`}
                >
                  <div className="flex items-center gap-1.5">
                    <span>{msg.timestamp}</span>
                    {msg.sender === 'ai' && (
                      <span className="px-1.5 py-0.5 rounded-md bg-slate-100 dark:bg-slate-700/70 text-slate-600 dark:text-slate-300 font-mono text-[9px]">
                        {msg.model || (msg.provider === 'gemini' ? 'Gemini' : msg.provider === 'openai' ? 'ChatGPT' : 'Smart Advisor')}
                      </span>
                    )}
                  </div>

                  {msg.sender === 'ai' && (
                    <button
                      onClick={() => handleCopy(msg.text, msg.id)}
                      className="opacity-0 group-hover:opacity-100 hover:text-emerald-700 dark:hover:text-emerald-400 flex items-center gap-1 transition-opacity"
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
                  {aiSettings.provider === 'gemini' ? 'Gemini thinking...' : aiSettings.provider === 'openai' ? 'ChatGPT thinking...' : 'Analyzing workspace...'}
                </span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Quick Suggestion Prompts */}
        <div className="px-4 py-2 border-t border-slate-200/60 dark:border-slate-800/60 bg-white/80 dark:bg-slate-900/80 overflow-x-auto flex items-center gap-2 no-scrollbar">
          {quickPrompts.map((p, idx) => (
            <button
              key={idx}
              onClick={() => handleQuickPrompt(p.prompt)}
              className="px-3 py-1.5 rounded-full text-[11px] font-semibold text-emerald-800 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200/80 dark:border-emerald-800/60 hover:bg-emerald-100 hover:border-emerald-300 whitespace-nowrap transition-colors flex items-center gap-1 shrink-0"
            >
              <span>{p.label}</span>
            </button>
          ))}
        </div>

        {/* Chat Input Bar */}
        <form
          onSubmit={handleSendMessage}
          className="p-3 sm:p-4 border-t border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-slate-900 flex items-center gap-2"
        >
          <div className="relative flex-1">
            <input
              ref={inputRef}
              type="text"
              value={inputMessage}
              onChange={e => setInputMessage(e.target.value)}
              placeholder={
                aiSettings.provider === 'gemini'
                  ? 'Ask Gemini anything with live context of your projects, clients, or rates...'
                  : aiSettings.provider === 'openai'
                  ? 'Ask ChatGPT anything about your tasks, invoices, or client emails...'
                  : 'Ask anything about your projects, clients, rates, or email drafts...'
              }
              className="w-full pl-4 pr-4 py-3 bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs md:text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 shadow-inner"
            />
          </div>

          <button
            type="submit"
            disabled={!inputMessage.trim() || isTyping}
            className={`p-3 rounded-2xl transition-all shadow-md flex items-center justify-center shrink-0 ${
              inputMessage.trim() && !isTyping
                ? 'bg-gradient-to-r from-emerald-600 via-teal-600 to-whatsapp-teal hover:from-emerald-700 hover:to-whatsapp-dark text-white active:scale-95 shadow-emerald-700/25'
                : 'bg-slate-200 dark:bg-slate-800 text-slate-400 cursor-not-allowed'
            }`}
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
};
