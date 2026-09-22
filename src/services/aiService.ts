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

/**
 * Robust, client-side Me Plus App Guide & Help Assistant
 */
export const generateSmartAdvisorFallback = (
  message: string,
  user: UserProfile | null,
  clients: Client[],
  projects: Project[],
  tasks: Task[],
  invoices?: Invoice[]
): string => {
  const q = (message || '').trim().toLowerCase();

  const currency = user?.currency || '$';
  const hourlyRate = user?.hourlyRate || 65;

  // 1. Clients Management Guide
  if (/\b(client|clients|customer|contact|add\s*client|create\s*client|new\s*client)\b/i.test(q)) {
    return `### 👥 How to Manage Clients in Me Plus

You currently have **${clients.length} registered client(s)** in your workspace.

#### 📌 Step-by-Step: Adding a New Client
1. Click **"Clients"** in the left sidebar (or press \`Ctrl + K\` and type *"New Client"*).
2. Click the green **"+ New Client"** button in the top right.
3. Fill in the client profile:
   • **Client Name & Company**: (e.g. *Apex Robotics & IoT*)
   • **Email & Phone**: Contact details for milestone correspondence and invoicing.
   • **Hourly Rate**: You can set a client-specific hourly rate (default: ${currency}${hourlyRate}/hr).
   • **Status**: Mark as \`Active\`, \`Lead\`, or \`Archived\`.
4. Click **"Save Client"**.

💡 **Pro-Tip:** Once a client is created, you can link projects, assign tasks, and track billable time directly to their account!`;
  }

  // 2. Projects & Milestones Guide
  if (/\b(project|projects|milestone|deadline|add\s*project|create\s*project|new\s*project)\b/i.test(q)) {
    return `### 🚀 How to Manage Projects & Milestones

You currently have **${projects.length} project(s)** in progress.

#### 📌 Step-by-Step: Creating a Project
1. Navigate to **"Projects"** from the left navigation bar.
2. Click the **"+ New Project"** button.
3. Configure your project deliverables:
   • **Project Title**: Give it a clear name (e.g. *Website Redesign & Mobile MVP*).
   • **Select Client**: Link it to an existing client from your dropdown.
   • **Category & Budget**: Assign a project category and fixed or hourly budget.
   • **Target Deadline**: Select your milestone completion date.
4. Click **"Create Project"**.

💡 **Progress Bar Tip:** Your project progress percentage updates dynamically as you move associated tasks into the **"Done"** column on your task board!`;
  }

  // 3. Time Tracker & Live Stopwatch Guide
  if (/\b(time|timer|stopwatch|track\s*time|tracking|log\s*hours|billable|manual\s*entry|hours)\b/i.test(q)) {
    return `### ⏱️ How to Track Time & Billable Hours in Me Plus

Me Plus includes both a **Live Real-time Stopwatch** and a **Manual Entry Log**.

#### 📌 Using the Live Stopwatch:
1. Click **"Time Tracker"** in the sidebar.
2. Select the **Client** and **Project** you are working on.
3. Type a brief note (e.g., *"Sprint 2 UI wireframes"*).
4. Click the green **"Start"** button to start the live timer.
5. When taking a break or finishing, click **"Stop"** — the time entry is automatically saved to your database and ready for invoicing!

#### 📌 Adding Past / Manual Hours:
1. In the **Time Tracker** screen, click **"+ Manual Log"**.
2. Select the date, start time, end time, and project.
3. Click **"Save Entry"**.

💡 **Did you know?** The live timer keeps running accurately in the background even if you switch tabs or navigate across other pages.`;
  }

  // 4. Invoices & Revenue Billing Guide
  if (/\b(invoice|invoices|bill|billing|tax|download\s*invoice|pdf|create\s*invoice|unpaid|revenue)\b/i.test(q)) {
    const unpaid = (invoices || []).filter(i => i.status === 'sent' || i.status === 'overdue');
    return `### 💵 How to Create Invoices & Track Revenue in Me Plus

You have **${(invoices || []).length} total invoice(s)** (${unpaid.length} currently pending payment).

#### 📌 Simple 3-Step Project Budget Invoicing:
1. Click **"Invoices"** in the left sidebar.
2. Click the green **"+ Create Invoice"** button.
3. Fill in the simple details:
   • **Client**: Select who you are billing.
   • **Project (Optional)**: Selecting a project **automatically pre-fills that project's agreed budget**!
   • **Service Description**: Briefly state what was delivered (e.g., *"Logo Design & Brand Guidelines"*).
   • **Project Budget / Amount ($)**: Enter your flat agreed fee (no tedious hours math required!).
   • **Payment Due Date**: Choose payment deadline (defaults to 14 days).
4. Click **"Generate Invoice"**.

#### 💰 1-Click Payment & Revenue Tracking:
• **Total Invoiced**: Shows all money billed across all your client jobs.
• **Paid Revenue**: Real earnings received. Click the **"Mark Paid"** button next to any invoice to instantly move it into your Paid Revenue!
• **Pending Receivables**: Live total of all money clients currently owe you.
• **Printable Slip**: Click the print icon on any invoice to view and print an executive slip!`;
  }

  // 5. Tasks & Kanban Board Guide
  if (/\b(task|tasks|kanban|board|drag|drop|todo|in\s*progress|review|done|priority)\b/i.test(q)) {
    return `### 📌 How to Organize Tasks on the Kanban Board

You currently have **${tasks.filter(t => t.status !== 'done').length} pending task(s)** across your workspace.

#### 📌 Using the 4 Kanban Columns:
• **To Do**: Backlog and upcoming task items.
• **In Progress**: Tasks actively being worked on right now.
• **Review**: Work delivered to the client awaiting feedback.
• **Done**: Approved and finished tasks.

#### 📌 How to Move Tasks:
• **Drag & Drop**: Simply click and hold any task card, then drag it across columns.
• **Quick Edit**: Click on any card to update its title, description, priority (\`Low\`, \`Medium\`, \`High\`, \`Urgent\`), and due date.

💡 **Filter Chips:** Use the filter buttons at the top of the Tasks page to filter your board by specific Client or Priority with a single click!`;
  }

  // 6. Settings, Profile, Currency & Theme Guide
  if (/\b(setting|settings|profile|rate|hourly\s*rate|currency|theme|dark\s*mode|light\s*mode|color|avatar)\b/i.test(q)) {
    return `### ⚙️ How to Customize Your Settings & Profile

You can personalize your freelance workspace anytime in the **Settings** view:

#### 📌 Profile & Rates:
1. Click **"Settings"** at the bottom of the left sidebar.
2. In the **Profile** section, you can update:
   • **Your Name & Professional Title** (e.g., *Senior Graphic & UI Designer*)
   • **Base Hourly Rate**: Your default rate (currently ${currency}${hourlyRate}/hr).
   • **Currency Symbol**: Choose between \`$\`, \`€\`, \`£\`, \`₹\`, or any custom currency.

#### 📌 Appearance & Dark Mode:
• Toggle between **Light Mode** and **Dark Mode** at the top right of the screen or in Settings.
• Choose from custom accent colors (Emerald, Ocean Blue, Violet, Amber) using the palette icon in the top navbar.

#### 📌 Idle Screensaver:
• Me Plus includes a Zen screensaver that gently dims your display when you step away from your desk. Configure timeout minutes under Settings ➔ Inactivity.`;
  }

  // 7. Keyboard Shortcuts & Quick Navigation
  if (/\b(shortcut|shortcuts|hotkey|command|palette|ctrl\s*\+\s*k|cmd\s*\+\s*k|keyboard|esc)\b/i.test(q)) {
    return `### ⌨️ Me Plus Keyboard Shortcuts & Pro Navigation

Boost your daily speed with these built-in keyboard shortcuts:

• \`Ctrl + K\` (or \`Cmd + K\` on Mac): **Command Palette**
  Open the universal quick switcher to jump directly to any client, project, or task, or trigger instant actions like *"New Task"* or *"Start Timer"*.

• \`Esc\`: **Close Any Window / Modal**
  Instantly dismiss any open popup, drawer, or modal without clicking the close icon.

• \`Enter\` / \`Shift + Enter\`: **Chat Bot Navigation**
  Press \`Enter\` to send questions to this App Guide, or \`Shift + Enter\` for a clean new line.

💡 **Try it now:** Press \`Ctrl + K\` on your keyboard to test the Command Palette!`;
  }

  // 8. Password Reset & OTP Email Verification
  if (/\b(password|reset\s*password|forgot\s*password|otp|email\s*otp|login|security)\b/i.test(q)) {
    return `### 🔐 Password Reset & Real Email OTP Verification

Me Plus includes an authentic security system for account recovery:

1. On the login screen, click **"Forgot Password?"**.
2. Type your registered account email.
3. Click **"Send Verification Code"** — our backend sends a real 6-digit OTP security code directly to your email inbox via Gmail SMTP.
4. Open your email, copy the 6-digit code, and enter it into the verification screen.
5. Set your new password and log in immediately!`;
  }

  // 9. External AI (ChatGPT & Gemini) Info
  if (/\b(chatgpt|gemini|external\s*ai|ai|gpt|openai|google\s*ai)\b/i.test(q)) {
    return `### 🤖 Using External AI (ChatGPT & Google Gemini)

You don't need any complex developer API keys or setup to use ChatGPT or Google Gemini with Me Plus!

#### 📌 How to Access Them:
1. Look at the top of this window and click the **"🤖 External AI (ChatGPT & Gemini)"** tab.
2. Click **"Launch Google Gemini"** or **"Launch ChatGPT"**.
3. It opens directly in your browser. Simply sign in with your regular Google/Gmail account or email.
4. You can use our 1-click **"Copy Prompt"** chips to copy proven freelance prompts and paste them right into ChatGPT or Gemini!`;
  }

  // 10. General Platform Guide
  return `### 📘 Welcome to the Me Plus Platform Guide!

I am here to help you get the absolute most out of the **Me Plus Multi-Client Freelance Platform**.

Here is what you can ask me:
• 👥 *"How do I add a new client?"*
• 🚀 *"How do I create and manage projects?"*
• ⏱️ *"How does the live stopwatch time tracker work?"*
• 💵 *"How do I create, customize, and export invoices?"*
• 📌 *"How do I move tasks on the Kanban board?"*
• ⚙️ *"Where do I change my hourly rate, currency, or theme?"*
• ⌨️ *"What keyboard shortcuts can I use?"*

👉 **Looking for ChatGPT or Google Gemini?** Click the **"🤖 External AI"** tab at the top of this window to open them directly in your browser!`;
};
