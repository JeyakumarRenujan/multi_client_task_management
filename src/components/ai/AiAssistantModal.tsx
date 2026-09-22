import React, { useState, useRef, useEffect, useMemo } from 'react';
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
  generateSmartAdvisorFallback,
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
  Mail,
  Coins,
  ShieldAlert,
  ListChecks,
  Star,
  Clock,
  ChevronRight,
  Info,
} from 'lucide-react';

// ==========================================
// Formatted AI Message Renderer Component
// ==========================================

interface FormattedAiMessageProps {
  text: string;
  onCopyDraft: (draftText: string, draftId: string) => void;
  copiedId: string | null;
  messageId: string;
}

const FormattedAiMessage: React.FC<FormattedAiMessageProps> = ({
  text,
  onCopyDraft,
  copiedId,
  messageId,
}) => {
  // Parse message into structured sections: headers, email draft boxes, callout tips, and standard text
  const renderedElements = useMemo(() => {
    const lines = text.split('\n');
    const elements: React.ReactNode[] = [];
    let currentBlockquote: string[] = [];
    let inBlockquote = false;
    let blockquoteSubject = '';
    let draftIndex = 0;

    const flushBlockquote = () => {
      if (currentBlockquote.length > 0) {
        const fullDraft = currentBlockquote.join('\n').trim();
        const draftKey = `${messageId}-draft-${draftIndex++}`;
        const isCopied = copiedId === draftKey;

        // Strip leading quote markers and formatting for clean clipboard copy
        const cleanClipboardText = fullDraft
          .split('\n')
          .map(l => l.replace(/^>\s*(\*)?/, '').replace(/(\*)?$/, ''))
          .join('\n')
          .trim();

        elements.push(
          <div
            key={draftKey}
            className="my-3 rounded-2xl bg-slate-50 dark:bg-slate-900/90 border border-emerald-500/30 dark:border-emerald-500/20 shadow-xs overflow-hidden"
          >
            {/* Draft Header */}
            <div className="px-3.5 py-2 bg-emerald-50/80 dark:bg-emerald-950/50 border-b border-emerald-200/50 dark:border-emerald-800/40 flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-emerald-800 dark:text-emerald-300 font-bold text-[11px]">
                <Mail className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                <span>Ready-to-Send Client Draft</span>
              </div>

              <button
                type="button"
                onClick={() => onCopyDraft(cleanClipboardText, draftKey)}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-bold bg-white dark:bg-slate-800 hover:bg-emerald-100 dark:hover:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 transition-colors shadow-2xs"
                title="Copy ready-to-send draft to clipboard"
              >
                {isCopied ? (
                  <>
                    <Check className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                    <span>Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3 h-3" />
                    <span>Copy Draft</span>
                  </>
                )}
              </button>
            </div>

            {/* Draft Content */}
            <div className="p-3.5 sm:p-4 text-xs font-sans text-slate-800 dark:text-slate-200 space-y-2 leading-relaxed">
              {blockquoteSubject && (
                <div className="pb-2 mb-2 border-b border-slate-200/70 dark:border-slate-800 flex items-center gap-1.5 text-[11px] font-semibold text-slate-600 dark:text-slate-300">
                  <span className="text-slate-400 font-normal">Subject:</span>
                  <span className="font-mono text-emerald-700 dark:text-emerald-400 font-bold">
                    {blockquoteSubject}
                  </span>
                </div>
              )}
              {currentBlockquote.map((line, idx) => {
                const cleanLine = line.replace(/^>\s*/, '').replace(/^\*"|"\*$/g, '');
                if (!cleanLine.trim()) return <div key={idx} className="h-1.5" />;
                return <p key={idx}>{cleanLine}</p>;
              })}
            </div>
          </div>
        );

        currentBlockquote = [];
        inBlockquote = false;
        blockquoteSubject = '';
      }
    };

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      // Detect Subject Line
      if (line.includes('**Subject:**') || line.startsWith('Subject:')) {
        const rawSubject = line.replace(/.*\*\*Subject:\*\*\s*\*?|\*?/g, '').replace(/Subject:\s*/, '').replace(/^\*|\*$/g, '').trim();
        blockquoteSubject = rawSubject;
        continue;
      }

      // Detect Blockquote (Email Template)
      if (line.startsWith('>')) {
        inBlockquote = true;
        currentBlockquote.push(line);
        continue;
      } else if (inBlockquote) {
        // End of blockquote
        flushBlockquote();
      }

      // Detect Heading 3
      if (line.startsWith('### ')) {
        const title = line.replace('### ', '');
        elements.push(
          <div key={`h3-${i}`} className="mt-4 mb-2 flex items-center gap-2">
            <h3 className="text-xs sm:text-sm font-black text-slate-900 dark:text-slate-100 tracking-tight">
              {title}
            </h3>
          </div>
        );
        continue;
      }

      // Detect Heading 4
      if (line.startsWith('#### ')) {
        const title = line.replace('#### ', '');
        elements.push(
          <h4 key={`h4-${i}`} className="mt-3 mb-1 text-xs font-bold text-slate-800 dark:text-slate-200">
            {title}
          </h4>
        );
        continue;
      }

      // Detect Horizontal Dividers
      if (line.trim() === '---') {
        elements.push(
          <hr key={`hr-${i}`} className="my-3 border-slate-200/80 dark:border-slate-800" />
        );
        continue;
      }

      // Detect Callout Tips & Workspace Alerts
      if (line.includes('💡') || line.includes('📌') || line.startsWith('*Tip:')) {
        elements.push(
          <div
            key={`tip-${i}`}
            className="my-2.5 p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 dark:bg-amber-950/20 text-slate-700 dark:text-slate-300 text-xs flex items-start gap-2 leading-relaxed"
          >
            <div className="shrink-0 mt-0.5 font-bold">💡</div>
            <div>{line.replace(/^💡\s*|\*Tip:\s*/, '')}</div>
          </div>
        );
        continue;
      }

      // Detect Bullet points
      if (line.startsWith('• ') || line.startsWith('- ') || line.startsWith('* ')) {
        const cleanItem = line.replace(/^[•\-\*]\s*/, '');
        elements.push(
          <div key={`bullet-${i}`} className="flex items-start gap-2 text-xs leading-relaxed my-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 dark:bg-emerald-400 mt-1.5 shrink-0" />
            <span>{cleanItem}</span>
          </div>
        );
        continue;
      }

      // Empty Lines
      if (!line.trim()) {
        elements.push(<div key={`empty-${i}`} className="h-2" />);
        continue;
      }

      // Standard Paragraph
      elements.push(
        <p key={`p-${i}`} className="text-xs leading-relaxed text-slate-800 dark:text-slate-200">
          {line}
        </p>
      );
    }

    // Flush any pending blockquote at the end
    flushBlockquote();

    return elements;
  }, [text, messageId, copiedId, onCopyDraft]);

  return <div className="space-y-1 font-sans">{renderedElements}</div>;
};

// ==========================================
// Main AI Assistant Modal Component
// ==========================================

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
  const [activeCategory, setActiveCategory] = useState<'popular' | 'emails' | 'rates' | 'scope' | 'sprints'>('popular');

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

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
          : 'Me Plus Smart Advisor (Offline-Ready)';

      const initialGreeting: ChatMessage = {
        id: 'msg-init',
        sender: 'ai',
        text: `### 👋 Welcome to Me Plus Freelancer Copilot!\n\nHello **${user?.name ? user.name.split(' ')[0] : 'there'}**! I am your executive business strategist and communications coach, currently active with **${activeModelName}**.\n\nI have live awareness of your **${clients.length} clients**, **${projects.length} projects**, and **${tasks.filter(t => t.status !== 'done').length} pending tasks**.\n\nHere are popular ways I can help right now:\n• 💬 **Draft ready-to-send client emails** (invoices, proposals, delays, reviews)\n• 💰 **Calculate rate increases** & write 30-day client adjustment notices\n• 🛡️ **Push back on scope creep** with structured add-on pricing\n• ⚡ **Prioritize your daily sprint** based on active deadlines\n\nChoose an action chip below or type any question to begin!`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        provider: aiSettings.provider,
        model: activeModelName,
      };
      setMessages([initialGreeting]);
    }
  }, [isAiModalOpen, user?.name, messages.length, aiSettings.provider, aiSettings.geminiModel, aiSettings.openaiModel, clients.length, projects.length, tasks]);

  // Focus input when modal opens
  useEffect(() => {
    if (isAiModalOpen && !isSettingsOpen) {
      setTimeout(() => {
        textareaRef.current?.focus();
        scrollToBottom();
      }, 100);
    }
  }, [isAiModalOpen, isSettingsOpen]);

  // ESC key listener to dismiss modal or settings drawer
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isAiModalOpen) {
        if (isSettingsOpen) {
          setIsSettingsOpen(false);
        } else {
          setIsAiModalOpen(false);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isAiModalOpen, isSettingsOpen, setIsAiModalOpen]);

  // Scroll to bottom on message change
  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  if (!isAiModalOpen) return null;

  // Categorized Starter Action Chips
  const promptCategories = [
    { id: 'popular', label: '🌟 Top Starters', icon: <Star className="w-3 h-3" /> },
    { id: 'emails', label: '✉️ Client Emails', icon: <Mail className="w-3 h-3" /> },
    { id: 'rates', label: '💰 Rates & Invoices', icon: <Coins className="w-3 h-3" /> },
    { id: 'scope', label: '🛡️ Scope & Boundaries', icon: <ShieldAlert className="w-3 h-3" /> },
    { id: 'sprints', label: '⚡ Daily Priorities', icon: <ListChecks className="w-3 h-3" /> },
  ] as const;

  const promptsByCategory: Record<typeof activeCategory, { label: string; prompt: string }[]> = {
    popular: [
      {
        label: '💰 Rate Increase Notice (+15%)',
        prompt: 'How do I politely inform an existing client that my hourly rates are increasing by 15%?',
      },
      {
        label: '📧 Friendly Overdue Invoice Check-in',
        prompt: 'Draft a polite level 1 follow-up email for an invoice that is 3 days overdue with re-attached invoice.',
      },
      {
        label: '🛡️ Out-of-Scope Feature Pushback',
        prompt: 'A client requested 3 additional unplanned features. How should I propose an add-on budget or task swap?',
      },
      {
        label: '📊 Today\'s 3-Priority Battle Plan',
        prompt: 'Summarize my current clients and urgent tasks, and give me a 3-priority focus plan for today.',
      },
      {
        label: '🚫 Politely Decline Low Budget Request',
        prompt: 'How do I politely decline a project inquiry because their budget is far below my minimum engagement?',
      },
    ],
    emails: [
      {
        label: '📧 Friendly Invoice Reminder (Level 1)',
        prompt: 'Draft a polite level 1 reminder email for an overdue invoice with a clear payment check-in.',
      },
      {
        label: '🚨 Past Due Pause Work Notice (Level 3)',
        prompt: 'Draft a firm 14-day past due invoice notice stating active development is paused until payment clears.',
      },
      {
        label: '⏰ Milestone Delivery Extension',
        prompt: 'Draft a proactive email notifying a client of a 2-day delivery extension with revised milestone timeline.',
      },
      {
        label: '🎯 High-Converting Client Pitch',
        prompt: 'Write a high-converting short proposal pitch to win a new web design & development project.',
      },
      {
        label: '⭐ 5-Star Testimonial & Referral Request',
        prompt: 'Draft an email asking a satisfied client for a short 3-question testimonial and LinkedIn recommendation.',
      },
    ],
    rates: [
      {
        label: '📈 30-Day Rate Adjustment Letter',
        prompt: 'Draft a professional 30-day notice letter for existing clients honoring current milestone commitments.',
      },
      {
        label: '💵 Transition to Value-Based Pricing',
        prompt: 'Explain how I should transition from hourly billing to value-based project pricing for new clients.',
      },
      {
        label: '🛑 50% Upfront Deposit Agreement',
        prompt: 'How do I explain my requirement for a 50% upfront deposit to a new client without sounding pushy?',
      },
      {
        label: '⚡ Weekend / 25% Rush Fee Policy',
        prompt: 'How do I communicate a 25% rush fee when a client needs a deliverable completed over the weekend?',
      },
    ],
    scope: [
      {
        label: '🛡️ Scope Creep Add-On Estimate',
        prompt: 'Draft an email offering two choices for unplanned work: an add-on scope quote or a task swap.',
      },
      {
        label: '🤝 De-escalate Revision Fatigue',
        prompt: 'A client is frustrated with recent revisions. How do I de-escalate and organize a single consolidated punch-list?',
      },
      {
        label: '🚫 Decline Project (Fully Booked)',
        prompt: 'Draft a polite email turning down a project inquiry because my schedule is fully committed through next month.',
      },
      {
        label: '🔄 Limiting Endless Revision Rounds',
        prompt: 'How do I politely tell a client that they have reached their 2-revision limit without burning the relationship?',
      },
    ],
    sprints: [
      {
        label: '📊 Workspace Intelligence & Sprint Digest',
        prompt: 'Review my current workspace clients, pending deadlines, and provide a 3-step action plan for today.',
      },
      {
        label: '⏱️ Time-Boxing & Billable Hours Audit',
        prompt: 'Give me a practical time-boxing routine to maximize my billable hours and prevent freelance burnout.',
      },
      {
        label: '🚀 Milestone Handover & Sign-Off Checklist',
        prompt: 'What should be included in a professional final milestone delivery package to guarantee immediate client sign-off?',
      },
    ],
  };

  const handleTestConnection = async () => {
    if (tempProvider === 'builtin') {
      setTestResult({
        success: true,
        message: 'Built-in Freelance Copilot is ready and requires zero configuration.',
        latencyMs: 8,
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
        : 'Me Plus Built-in Copilot';

    showToast({
      title: 'AI Copilot Updated',
      message: `Active AI set to ${providerLabel}. Ready for action!`,
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
      // 1. Backend /api/ai/chat
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
      console.warn('Backend AI chat request error, attempting direct client fallback:', backendErr);
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
        text: `⚠️ **Could not connect to ${activeProvider === 'gemini' ? 'Google Gemini' : 'OpenAI'}**: ${directErr.message || 'Network error'}\n\n*Here is built-in workspace guidance instead:*\n\n${generateSmartAdvisorFallback(queryText, user, clients, projects, tasks, invoices)}`,
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
      const fallbackText = generateSmartAdvisorFallback(queryText, user, clients, projects, tasks, invoices);
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
    }, 350);
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

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
    showToast({
      title: 'Copied!',
      message: 'Full response copied to clipboard.',
      type: 'info',
    });
  };

  const handleCopyDraft = (draftText: string, draftId: string) => {
    navigator.clipboard.writeText(draftText);
    setCopiedId(draftId);
    setTimeout(() => setCopiedId(null), 2000);
    showToast({
      title: 'Draft Copied!',
      message: 'Ready-to-send draft copied to clipboard.',
      type: 'success',
    });
  };

  const handleClearChat = () => {
    confirmAction({
      title: 'Clear AI Conversation?',
      message: 'Are you sure you want to reset this conversation history? Your active projects and workspace data will not be affected.',
      confirmText: 'Clear Chat',
      danger: true,
      itemType: 'chat',
      onConfirm: () => {
        const initialGreeting: ChatMessage = {
          id: `msg-init-${Date.now()}`,
          sender: 'ai',
          text: `Conversation cleared! 👋 How can I help you right now with your projects, clients, rates, or email drafts?`,
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
        statusText: 'Connected to Google AI Studio',
      };
    }
    if (aiSettings.provider === 'openai') {
      return {
        label: `ChatGPT: ${aiSettings.openaiModel || '4o-mini'}`,
        color: 'bg-cyan-100 dark:bg-cyan-950 text-cyan-800 dark:text-cyan-300 border-cyan-300 dark:border-cyan-800',
        icon: <Bot className="w-3 h-3 text-cyan-600 dark:text-cyan-400" />,
        statusText: 'Connected to OpenAI',
      };
    }
    return {
      label: 'Built-in Copilot (Free)',
      color: 'bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 border-amber-300 dark:border-amber-800',
      icon: <Zap className="w-3 h-3 text-amber-500" />,
      statusText: 'Live Workspace Intelligence (No API key required)',
    };
  };

  const pill = getProviderPill();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/75 backdrop-blur-md animate-fade-in">
      <div
        className="w-full max-w-3xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col h-[90vh] max-h-[850px] overflow-hidden relative"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-4 py-3 sm:px-6 sm:py-4 border-b border-slate-200/80 dark:border-slate-800/80 bg-slate-50/90 dark:bg-slate-900/90 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="p-2.5 rounded-2xl bg-gradient-to-tr from-whatsapp-dark via-whatsapp-teal to-whatsapp-light text-white shadow-md shadow-emerald-700/20">
                <Bot className="w-5 h-5" />
              </div>
              <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-whatsapp-light rounded-full border-2 border-white dark:border-slate-900 ring-1 ring-emerald-600 animate-pulse" />
            </div>

            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-sm sm:text-base font-black text-slate-900 dark:text-slate-100">
                  Me Plus AI Copilot
                </h2>

                {/* Provider Pill Button */}
                <button
                  onClick={() => setIsSettingsOpen(prev => !prev)}
                  className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold border transition-all hover:scale-105 active:scale-95 shadow-xs ${pill.color}`}
                  title="Click to configure AI Model & API Key"
                >
                  {pill.icon}
                  <span>{pill.label}</span>
                  <Sliders className="w-3 h-3 ml-0.5 opacity-60" />
                </button>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                {pill.statusText}
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
              title="AI Connection Settings"
            >
              <Sliders className="w-4 h-4" />
            </button>
            <button
              onClick={handleClearChat}
              className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
              title="Clear Conversation History"
            >
              <Trash2 className="w-4 h-4" />
            </button>
            <button
              onClick={() => setIsAiModalOpen(false)}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              title="Close (Esc)"
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
              Choose between the <strong>100% Free Built-in Advisor</strong> (works offline with zero setup) or connect your personal <strong>Google Gemini</strong> or <strong>OpenAI</strong> key for open-ended conversation.
            </p>

            {/* Provider Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 mb-4">
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
                    No Key Needed
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Instant freelance rules, invoice drafts &amp; workspace intelligence.
                </p>
              </button>

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
                  Ultra-fast generative intelligence via free Google AI Studio key.
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
                    GPT-4o Mini
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Connect GPT-4o Mini or GPT-4o with your personal API key.
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
                Custom Instructions / Freelance Persona (Optional)
              </label>
              <textarea
                value={tempInstructions}
                onChange={e => setTempInstructions(e.target.value)}
                rows={2}
                placeholder="e.g., Keep email drafts concise and under 120 words. Always suggest a 20% advance milestone."
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
                className={`max-w-[88%] sm:max-w-[82%] rounded-2xl p-3.5 sm:p-4 text-xs sm:text-sm shadow-sm relative group ${
                  msg.sender === 'user'
                    ? 'bg-gradient-to-r from-emerald-600 via-teal-600 to-whatsapp-teal text-white rounded-tr-sm'
                    : 'bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-200/80 dark:border-slate-700/60 rounded-tl-sm'
                }`}
              >
                {/* Content formatted with clean line breaks & markdown highlights */}
                {msg.sender === 'ai' ? (
                  <FormattedAiMessage
                    text={msg.text}
                    onCopyDraft={handleCopyDraft}
                    copiedId={copiedId}
                    messageId={msg.id}
                  />
                ) : (
                  <div className="leading-relaxed whitespace-pre-wrap font-sans">
                    {msg.text}
                  </div>
                )}

                {/* Footer Time, Model Tag & Copy Button */}
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
                      <span className="px-1.5 py-0.5 rounded-md bg-slate-100 dark:bg-slate-700/70 text-slate-600 dark:text-slate-300 font-mono text-[9px]">
                        {msg.model || (msg.provider === 'gemini' ? 'Gemini' : msg.provider === 'openai' ? 'ChatGPT' : 'Smart Advisor')}
                      </span>
                    )}
                  </div>

                  {msg.sender === 'ai' && (
                    <button
                      onClick={() => handleCopy(msg.text, msg.id)}
                      className="opacity-0 group-hover:opacity-100 hover:text-emerald-700 dark:hover:text-emerald-400 flex items-center gap-1 transition-opacity text-[10px]"
                      title="Copy full text"
                    >
                      {copiedId === msg.id ? (
                        <Check className="w-3 h-3 text-emerald-500" />
                      ) : (
                        <Copy className="w-3 h-3" />
                      )}
                      <span>{copiedId === msg.id ? 'Copied' : 'Copy Full Response'}</span>
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
                  {aiSettings.provider === 'gemini' ? 'Gemini is drafting...' : aiSettings.provider === 'openai' ? 'ChatGPT is thinking...' : 'Analyzing live workspace & synthesizing...'}
                </span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Categorized Quick Action Selector */}
        <div className="border-t border-slate-200/60 dark:border-slate-800/60 bg-white/95 dark:bg-slate-900/95">
          {/* Category Tabs */}
          <div className="px-3 pt-2 pb-1 overflow-x-auto flex items-center gap-1.5 border-b border-slate-100 dark:border-slate-800/50 no-scrollbar">
            {promptCategories.map(cat => (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold flex items-center gap-1.5 whitespace-nowrap transition-all shrink-0 ${
                  activeCategory === cat.id
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <span>{cat.label}</span>
              </button>
            ))}
          </div>

          {/* Quick Suggestion Chips for Active Category */}
          <div className="px-3 py-2 overflow-x-auto flex items-center gap-2 no-scrollbar">
            {promptsByCategory[activeCategory].map((p, idx) => (
              <button
                key={idx}
                onClick={() => handleQuickPrompt(p.prompt)}
                className="px-3 py-1.5 rounded-full text-[11px] font-medium text-slate-700 dark:text-slate-300 bg-slate-100/90 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/70 hover:border-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 hover:text-emerald-800 dark:hover:text-emerald-300 whitespace-nowrap transition-all flex items-center gap-1 shrink-0 shadow-2xs group"
                title={p.prompt}
              >
                <span>{p.label}</span>
                <ChevronRight className="w-3 h-3 opacity-40 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all text-emerald-600" />
              </button>
            ))}
          </div>
        </div>

        {/* Chat Input Bar */}
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
              placeholder={
                aiSettings.provider === 'gemini'
                  ? 'Ask Gemini anything (Enter to send, Shift+Enter for new line)...'
                  : aiSettings.provider === 'openai'
                  ? 'Ask ChatGPT anything (Enter to send, Shift+Enter for new line)...'
                  : 'Ask anything or request email drafts (Enter to send, Shift+Enter for new line)...'
              }
              className="w-full pl-3.5 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs md:text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 shadow-inner resize-none min-h-[44px] max-h-[100px] leading-relaxed"
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
            title="Send Message"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
};
