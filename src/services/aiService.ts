import {
  AiProvider,
  AiSettings,
  AiModelInfo,
  UserProfile,
  Client,
  Project,
  Task,
  Invoice,
} from '../types';
import { api } from './api';

export const AI_MODELS: Record<AiProvider, AiModelInfo[]> = {
  gemini: [
    {
      id: 'gemini-1.5-flash',
      name: 'Gemini 1.5 Flash',
      provider: 'gemini',
      description: 'Super fast, high quality & recommended. Generous free tier via Google AI Studio.',
      tag: 'Recommended (Free)',
      badgeColor: 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300',
    },
    {
      id: 'gemini-2.0-flash',
      name: 'Gemini 2.0 Flash',
      provider: 'gemini',
      description: 'Google’s next-generation multimodal model with ultra-fast latency.',
      tag: 'Next-Gen',
      badgeColor: 'bg-cyan-100 dark:bg-cyan-950 text-cyan-700 dark:text-cyan-300',
    },
    {
      id: 'gemini-1.5-pro',
      name: 'Gemini 1.5 Pro',
      provider: 'gemini',
      description: 'Advanced reasoning, complex task planning and deep business contract review.',
      tag: 'Deep Reasoning',
      badgeColor: 'bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300',
    },
  ],
  openai: [
    {
      id: 'gpt-4o-mini',
      name: 'GPT-4o Mini',
      provider: 'openai',
      description: 'OpenAI’s fastest, most intelligent affordable model for daily freelance tasks.',
      tag: 'Recommended',
      badgeColor: 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300',
    },
    {
      id: 'gpt-4o',
      name: 'GPT-4o (Omni)',
      provider: 'openai',
      description: 'OpenAI’s flagship model for complex client negotiation, pitch writing & code analysis.',
      tag: 'Flagship',
      badgeColor: 'bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300',
    },
    {
      id: 'gpt-3.5-turbo',
      name: 'GPT-3.5 Turbo',
      provider: 'openai',
      description: 'Standard fast conversational model for quick email templates and message drafts.',
      tag: 'Classic',
      badgeColor: 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300',
    },
  ],
  builtin: [
    {
      id: 'builtin',
      name: 'Me Plus Smart Advisor',
      provider: 'builtin',
      description: 'Instant built-in intelligent freelance rules and workspace assistant (no key needed).',
      tag: 'Offline Ready',
      badgeColor: 'bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300',
    },
  ],
};

const STORAGE_KEY_AI_SETTINGS = 'meplus_ai_settings';

export const getDefaultAiSettings = (): AiSettings => ({
  provider: 'builtin',
  geminiModel: 'gemini-1.5-flash',
  openaiModel: 'gpt-4o-mini',
  geminiApiKey: '',
  openaiApiKey: '',
  customInstructions: '',
});

export const getStoredAiSettings = (user?: UserProfile | null): AiSettings => {
  if (user?.aiSettings) {
    return { ...getDefaultAiSettings(), ...user.aiSettings };
  }
  try {
    const raw = localStorage.getItem(STORAGE_KEY_AI_SETTINGS);
    if (raw) {
      return { ...getDefaultAiSettings(), ...JSON.parse(raw) };
    }
  } catch (e) {
    console.warn('Could not read AI settings from localStorage', e);
  }
  return getDefaultAiSettings();
};

export const saveStoredAiSettings = (settings: AiSettings) => {
  try {
    localStorage.setItem(STORAGE_KEY_AI_SETTINGS, JSON.stringify(settings));
  } catch (e) {
    console.warn('Could not save AI settings to localStorage', e);
  }
};

/**
 * Builds rich, structured context of the freelancer's active business
 */
export const buildWorkspaceContext = (
  user: UserProfile | null,
  clients: Client[],
  projects: Project[],
  tasks: Task[],
  invoices?: Invoice[]
): string => {
  const userName = user?.name || 'Freelancer';
  const userTitle = user?.title || 'Independent Professional';
  const hourlyRate = user?.hourlyRate ? `$${user.hourlyRate}/hr` : '$65/hr';
  const currency = user?.currency || '$';

  const activeClients = clients.slice(0, 8).map(c => `• ${c.name} (${c.company}) - Status: ${c.status}, Rate: ${c.hourlyRate ? currency + c.hourlyRate + '/hr' : 'Default'}`).join('\n');
  const activeProjects = projects.slice(0, 8).map(p => `• "${p.title}" - Status: ${p.status}, Progress: ${p.progress}%, Due: ${p.deadline || 'N/A'}`).join('\n');
  const urgentTasks = tasks
    .filter(t => t.status !== 'done')
    .slice(0, 10)
    .map(t => `• [${t.priority.toUpperCase()}] "${t.title}" (Status: ${t.status}, Due: ${t.dueDate || 'No deadline'})`)
    .join('\n');

  let invoiceSummary = '';
  if (invoices && invoices.length > 0) {
    const unpaid = invoices.filter(i => i.status === 'sent' || i.status === 'overdue');
    const totalUnpaid = unpaid.reduce((sum, i) => sum + (i.total || 0), 0);
    invoiceSummary = `\n- Unpaid Invoices: ${unpaid.length} totaling ${currency}${totalUnpaid}`;
  }

  return `
FREELANCER PROFILE:
- Name: ${userName}
- Title / Specialization: ${userTitle}
- Base Rate: ${hourlyRate}
- Currency: ${currency}

ACTIVE CLIENTS (${clients.length} total):
${activeClients || 'No clients added yet.'}

PROJECTS (${projects.length} total):
${activeProjects || 'No active projects yet.'}

UPCOMING / PENDING TASKS (${tasks.filter(t => t.status !== 'done').length} remaining):
${urgentTasks || 'All tasks are complete!'}
${invoiceSummary}
`.trim();
};

export const buildSystemPrompt = (workspaceContext: string, customInstructions?: string): string => {
  return `You are the "Me Plus AI Copilot", an elite, world-class business advisor, project strategist, and communication coach built directly into the Me Plus freelance task management platform.

Your mission is to help the freelancer thrive, charge premium rates, communicate with clients professionally, manage scope creep, hit milestones on time, and handle difficult negotiations with calm confidence.

LIVE WORKSPACE CONTEXT:
${workspaceContext}

GUIDELINES FOR YOUR RESPONSES:
1. Be concise, actionable, and empathetic to the freelancer's daily pressures.
2. When drafting client emails or proposals:
   - Provide a catchy subject line.
   - Use polite, firm, and collaborative phrasing.
   - Include realistic place-holders like [Client Name] or actual names from the workspace context.
3. When giving pricing advice:
   - Reference the freelancer's base rate and explain value pricing vs hourly billing.
4. When dealing with scope creep:
   - Emphasize never saying a flat "no", but offering "yes, with an add-on budget/timeline".
5. Use markdown formatting: clean bold headers, bullet lists, blockquotes for drafts, and key takeaways.
${customInstructions ? `\nUSER CUSTOM INSTRUCTIONS:\n${customInstructions}` : ''}
`.trim();
};

/**
 * Direct call to Google Gemini API from browser (CORS supported)
 */
export const callGeminiDirect = async (
  apiKey: string,
  model: string,
  systemPrompt: string,
  history: { role: 'user' | 'model' | 'assistant'; content: string }[],
  latestPrompt: string
): Promise<string> => {
  const modelName = model || 'gemini-1.5-flash';
  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`;

  const contents = [
    ...history.slice(-8).map(h => ({
      role: h.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: h.content }],
    })),
    {
      role: 'user',
      parts: [{ text: latestPrompt }],
    },
  ];

  const body = {
    contents,
    systemInstruction: {
      parts: [{ text: systemPrompt }],
    },
    generationConfig: {
      temperature: 0.7,
      maxOutputTokens: 2048,
    },
  };

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    let errorDetail = response.statusText;
    try {
      const errJson = await response.json();
      errorDetail = errJson.error?.message || errorDetail;
    } catch {}
    throw new Error(`Google Gemini API error (${response.status}): ${errorDetail}`);
  }

  const data = await response.json();
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) {
    throw new Error('Gemini did not return any text response.');
  }
  return text;
};

/**
 * Direct call to OpenAI ChatGPT API from browser
 */
export const callOpenAiDirect = async (
  apiKey: string,
  model: string,
  systemPrompt: string,
  history: { role: 'user' | 'model' | 'assistant'; content: string }[],
  latestPrompt: string
): Promise<string> => {
  const modelName = model || 'gpt-4o-mini';
  const endpoint = 'https://api.openai.com/v1/chat/completions';

  const messages = [
    { role: 'system', content: systemPrompt },
    ...history.slice(-8).map(h => ({
      role: h.role === 'model' ? 'assistant' : h.role,
      content: h.content,
    })),
    { role: 'user', content: latestPrompt },
  ];

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: modelName,
      messages,
      temperature: 0.7,
    }),
  });

  if (!response.ok) {
    let errorDetail = response.statusText;
    try {
      const errJson = await response.json();
      errorDetail = errJson.error?.message || errorDetail;
    } catch {}
    throw new Error(`OpenAI API error (${response.status}): ${errorDetail}`);
  }

  const data = await response.json();
  const text = data.choices?.[0]?.message?.content;
  if (!text) {
    throw new Error('OpenAI did not return any message content.');
  }
  return text;
};

/**
 * Test AI API connection with a minimal probe request
 */
export const testAiConnection = async (
  provider: 'gemini' | 'openai',
  apiKey: string,
  model?: string
): Promise<{ success: boolean; message: string; latencyMs?: number }> => {
  if (!apiKey || !apiKey.trim()) {
    return {
      success: false,
      message: `Please enter your ${provider === 'gemini' ? 'Google Gemini' : 'OpenAI'} API key.`,
    };
  }

  const startTime = Date.now();

  // 1. Try Backend Proxy endpoint first
  try {
    const res = await api.testAiConnection({
      provider,
      apiKey: apiKey.trim(),
      model,
    });
    if (res.success) {
      return res;
    }
  } catch (err: any) {
    // If backend is not available or threw an error, fall back to direct ping from browser
  }

  // 2. Client-side direct verification fallback
  try {
    if (provider === 'gemini') {
      const testModel = model || 'gemini-1.5-flash';
      const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${testModel}:generateContent?key=${apiKey.trim()}`;
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ role: 'user', parts: [{ text: 'Respond with the single word "OK"' }] }],
          generationConfig: { maxOutputTokens: 5 },
        }),
      });

      const latencyMs = Date.now() - startTime;
      if (!res.ok) {
        let msg = `HTTP ${res.status}: ${res.statusText}`;
        try {
          const errData = await res.json();
          msg = errData.error?.message || msg;
        } catch {}
        return { success: false, message: msg };
      }
      return {
        success: true,
        message: `Successfully connected to Google Gemini (${testModel})!`,
        latencyMs,
      };
    } else {
      const testModel = model || 'gpt-4o-mini';
      const endpoint = 'https://api.openai.com/v1/chat/completions';
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey.trim()}`,
        },
        body: JSON.stringify({
          model: testModel,
          messages: [{ role: 'user', content: 'Say OK' }],
          max_tokens: 5,
        }),
      });

      const latencyMs = Date.now() - startTime;
      if (!res.ok) {
        let msg = `HTTP ${res.status}: ${res.statusText}`;
        try {
          const errData = await res.json();
          msg = errData.error?.message || msg;
        } catch {}
        return { success: false, message: msg };
      }
      return {
        success: true,
        message: `Successfully connected to OpenAI (${testModel})!`,
        latencyMs,
      };
    }
  } catch (err: any) {
    return {
      success: false,
      message: err.message || 'Connection test failed. Please check network and API key.',
    };
  }
};
