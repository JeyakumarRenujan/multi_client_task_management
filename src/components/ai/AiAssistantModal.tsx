import React, { useState, useRef, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { api } from '../../services/api';
import {
  Sparkles,
  Send,
  User,
  Bot,
  Copy,
  Check,
  X,
  Trash2,
  RefreshCw,
  MessageSquare,
  Zap,
  Briefcase,
  DollarSign,
  ShieldAlert,
} from 'lucide-react';

interface ChatMessage {
  id: string;
  sender: 'user' | 'ai';
  text: string;
  timestamp: string;
}

export const AiAssistantModal: React.FC = () => {
  const {
    isAiModalOpen,
    setIsAiModalOpen,
    projects,
    clients,
    tasks,
    user,
    showToast,
    confirmAction,
  } = useApp();

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Initialize with greeting if empty
  useEffect(() => {
    if (isAiModalOpen && messages.length === 0) {
      const initialGreeting: ChatMessage = {
        id: 'msg-init',
        sender: 'ai',
        text: `Hello ${user?.name ? user.name.split(' ')[0] : 'there'}! 👋 I am your **Me Plus AI Freelancer Copilot**.\n\nI can help you with anything in your freelance business:\n• 💬 **Drafting client communications** (payment reminders, milestone updates, proposals)\n• 💰 **Pricing & Rate Strategy** (hourly vs fixed, rate increases, value negotiation)\n• 🛡️ **Handling Client Situations** (managing scope creep, difficult requests, contracts)\n• ⚡ **Productivity & Workflows** (time management, project planning)\n\nWhat would you like assistance with today?`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages([initialGreeting]);
    }
  }, [isAiModalOpen, user?.name, messages.length]);

  // Focus input when opened
  useEffect(() => {
    if (isAiModalOpen) {
      setTimeout(() => {
        inputRef.current?.focus();
        scrollToBottom();
      }, 100);
    }
  }, [isAiModalOpen]);

  // Scroll to bottom when messages update
  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  if (!isAiModalOpen) return null;

  const quickPrompts = [
    {
      label: '💰 Rate Increase Advice',
      prompt: 'How do I politely inform an existing client that my hourly rates are increasing?',
    },
    {
      label: '📧 Payment Follow-Up Email',
      prompt: 'Draft a polite but firm follow-up email for an overdue invoice.',
    },
    {
      label: '🛡️ Scope Creep Handling',
      prompt: 'A client is asking for additional features not in the original scope. How should I respond professionally?',
    },
    {
      label: '🚀 Proposal Pitch',
      prompt: 'Write a compelling short pitch to win a new web development and UI redesign client.',
    },
  ];

  const generateAiReply = (userQuery: string): string => {
    const q = userQuery.toLowerCase();
    const clientNames = clients.map(c => c.company).join(', ');
    const projectTitles = projects.map(p => p.title).join(', ');

    if (q.includes('rate') || q.includes('price') || q.includes('pricing') || q.includes('increase') || q.includes('how much to charge')) {
      return `### 💡 Strategy for Hourly Rate & Pricing:\n\n1. **Give Advance Notice**: Provide 30 to 45 days notice before applying new rates.\n2. **Emphasize Value & Growth**: Highlight the increased speed, reliability, and expanded skillset you bring.\n3. **Grandfathering Options**: Offer existing clients a transitional period or discount on multi-month retainers.\n\n**Sample Template to Client:**\n> *"Hi [Client Name], as I continue to expand my tools, certifications, and capabilities, my standard rate will update from $${user?.hourlyRate || 65}/hr to $${(user?.hourlyRate || 65) + 20}/hr starting next month. Because I deeply appreciate our collaboration, all ongoing projects and pre-booked hours will be honored at our current rate through next month. Looking forward to our continued success!"*`;
    }

    if (q.includes('overdue') || q.includes('invoice') || q.includes('payment') || q.includes('unpaid') || q.includes('late pay')) {
      return `### 📧 Overdue Invoice Follow-Up Draft:\n\n**Subject:** *Follow-up: Invoice status for [Project Name]*\n\n> *"Hi [Client Name],\n>\n> I hope you are having a productive week!\n>\n> I am reaching out to check on the status of invoice **#INV-2026-X**, which was due on [Due Date]. Please let me know if your accounts team requires any additional documentation, tax forms, or updated bank transfer details to process this.\n>\n> I have re-attached the invoice copy for your convenience. Thank you for your prompt attention!\n>\n> Best regards,\n> ${user?.name || 'Freelancer'}*"*\n\n**Pro-Tip:** If payment is over 14 days late, pause work on subsequent deliverables until the account balance is cleared.`;
    }

    if (q.includes('scope') || q.includes('creep') || q.includes('extra work') || q.includes('revision') || q.includes('free change')) {
      return `### 🛡️ Managing Scope Creep with Grace:\n\nWhen a client asks for tasks outside the agreed milestone, **never say a flat 'No'**—say **'Yes, and here is how we can budget it'**:\n\n**Recommended Response Template:**\n> *"Hi [Client Name],\n>\n> That is a fantastic feature idea and would certainly elevate the project! \n>\n> Since this falls outside our original milestone deliverables, I can create a quick add-on scope estimate for you (approx. 6–10 hours). We can either:\n> 1. Add it to our current sprint as Phase 2, or\n> 2. Swap out an existing lower-priority task from this sprint to keep the launch date on track.\n>\n> Let me know which approach you prefer!"*`;
    }

    if (q.includes('pitch') || q.includes('proposal') || q.includes('new client') || q.includes('win client')) {
      return `### 🎯 High-Converting Client Pitch Template:\n\n**Subject:** *Partnering on [Client Company]'s UI & Web Product Growth*\n\n> *"Hi [Client Name],\n>\n> I’ve been following [Client Company]'s recent developments and was very impressed with your latest release.\n>\n> As an independent specialist in ${user?.title || 'full-stack web development and UI/UX engineering'}, I help teams build fast, clean, and high-converting digital products.\n>\n> A few recent wins with my clients include:\n> • 40% reduction in page load times and mobile bounce rates\n> • Clean modular architecture delivered ahead of deadlines\n>\n> I’d love to share 2 quick ideas on how we can optimize your upcoming roadmap. Do you have 15 minutes for a quick introductory chat next Tuesday?\n>\n> Best,\n> ${user?.name || 'Freelancer'}*"*`;
    }

    if (q.includes('project') || q.includes('client') || q.includes('dashboard') || q.includes('task')) {
      return `### 📊 Your Workspace Overview:\n\n• **Active Clients (${clients.length})**: ${clientNames || 'None yet'}\n• **Projects (${projects.length})**: ${projectTitles || 'None yet'}\n• **Pending Tasks**: ${tasks.filter(t => t.status !== 'done').length} tasks remaining across all boards.\n\n**Freelancer Productivity Recommendation:** Focus on high-priority deadlines first, track every hour with the live stopwatch, and keep client communication transparent with weekly digest emails.`;
    }

    // Default intelligent conversational reply
    return `### 💡 Freelancer Advisor Insight:\n\nRegarding **"${userQuery}"**:\n\nHere are the top best practices to apply:\n\n1. **Clear Expectations & Deliverables**: Set defined milestones and delivery criteria so both you and the client are aligned.\n2. **Time-Boxing & Focus**: Track your focused sprint sessions using the built-in live stopwatch to accurately capture billable hours.\n3. **Proactive Updates**: Share quick progress notes every 48–72 hours to build client trust and eliminate anxiety.\n\nWould you like me to draft an email template, create an action checklist, or tailor specific advice for one of your clients (${clientNames || 'your clients'})?`;
  };

  const handleSendMessage = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const query = inputMessage.trim();
    if (!query || isTyping) return;

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text: query,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages(prev => [...prev, userMsg]);
    setInputMessage('');
    setIsTyping(true);

    api.sendAiMessage(query)
      .then(res => {
        const aiMsg: ChatMessage = {
          id: `ai-${Date.now()}`,
          sender: 'ai',
          text: res.reply || generateAiReply(query),
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        };
        setMessages(prev => [...prev, aiMsg]);
        setIsTyping(false);
      })
      .catch(() => {
        // Fallback to client-side generative response
        setTimeout(() => {
          const aiReplyText = generateAiReply(query);
          const aiMsg: ChatMessage = {
            id: `ai-${Date.now()}`,
            sender: 'ai',
            text: aiReplyText,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          };
          setMessages(prev => [...prev, aiMsg]);
          setIsTyping(false);
        }, 500);
      });
  };

  const handleQuickPrompt = (promptText: string) => {
    setInputMessage(promptText);
    setTimeout(() => {
      const userMsg: ChatMessage = {
        id: `user-${Date.now()}`,
        sender: 'user',
        text: promptText,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages(prev => [...prev, userMsg]);
      setInputMessage('');
      setIsTyping(true);

      api.sendAiMessage(promptText)
        .then(res => {
          const aiMsg: ChatMessage = {
            id: `ai-${Date.now()}`,
            sender: 'ai',
            text: res.reply || generateAiReply(promptText),
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          };
          setMessages(prev => [...prev, aiMsg]);
          setIsTyping(false);
        })
        .catch(() => {
          setTimeout(() => {
            const aiReplyText = generateAiReply(promptText);
            const aiMsg: ChatMessage = {
              id: `ai-${Date.now()}`,
              sender: 'ai',
              text: aiReplyText,
              timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            };
            setMessages(prev => [...prev, aiMsg]);
            setIsTyping(false);
          }, 500);
        });
    }, 50);
  };

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
    showToast({
      title: 'Copied!',
      message: 'AI message copied to clipboard.',
      type: 'info',
    });
  };

  const handleClearChat = () => {
    confirmAction({
      title: 'Clear Conversation?',
      message: 'Are you sure you want to clear all chat messages in this AI copilot session? Your current conversation history will be wiped.',
      confirmText: 'Clear Chat',
      danger: true,
      itemType: 'chat',
      onConfirm: () => {
        const initialGreeting: ChatMessage = {
          id: 'msg-init-reset',
          sender: 'ai',
          text: `Conversation cleared! 👋 How can I help you right now with your clients, projects, or freelance business?`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        };
        setMessages([initialGreeting]);
      },
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-sm animate-fade-in">
      <div
        className="w-full max-w-3xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col h-[85vh] max-h-[780px] overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* Header: WhatsApp / Copilot Style */}
        <div className="p-4 sm:p-5 border-b border-slate-200/80 dark:border-slate-800/80 bg-slate-50/70 dark:bg-slate-900/90 flex items-center justify-between">
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
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300">
                  Online
                </span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Freelance Business, Client Communications &amp; Strategy Assistant
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1 sm:gap-2">
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

                {/* Footer Time & Copy */}
                <div
                  className={`mt-2 flex items-center justify-between text-[10px] ${
                    msg.sender === 'user' ? 'text-emerald-100/80' : 'text-slate-400'
                  }`}
                >
                  <span>{msg.timestamp}</span>

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
              className="px-3 py-1.5 rounded-full text-[11px] font-semibold text-emerald-800 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200/80 dark:border-emerald-800/60 hover:bg-emerald-100 hover:border-emerald-300 whitespace-nowrap transition-colors flex items-center gap-1"
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
              placeholder="Ask anything about your projects, clients, rates, or email drafts..."
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
