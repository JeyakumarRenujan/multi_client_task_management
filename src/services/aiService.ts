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
 * Robust, client-side fallback advisor with live workspace awareness
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

  const userName = user?.name || 'Freelancer';
  const userTitle = user?.title || 'Independent Professional';
  const currentRate = user?.hourlyRate || 65;
  const currency = user?.currency || '$';

  const pendingTasks = tasks.filter(t => t.status !== 'done');
  const unpaidInvoices = (invoices || []).filter(i => i.status === 'sent' || i.status === 'overdue');
  const totalUnpaid = unpaidInvoices.reduce((sum, i) => sum + (Number(i.total) || 0), 0);

  // Try to find if user mentioned a specific client
  const matchedClient = clients.find(c => {
    const cName = (c.name || '').toLowerCase().trim();
    const cComp = (c.company || '').toLowerCase().trim();
    const firstWordName = cName.split(/\s+/)[0];
    const firstWordComp = cComp.split(/\s+/)[0];
    return (
      (cName && q.includes(cName)) ||
      (cComp && q.includes(cComp)) ||
      (firstWordName && firstWordName.length >= 3 && q.includes(firstWordName)) ||
      (firstWordComp && firstWordComp.length >= 3 && q.includes(firstWordComp))
    );
  });
  const clientPlaceholder = matchedClient ? (matchedClient.company || matchedClient.name) : '[Client Name]';

  // 1. Decline / Turn Down Request or Low Budget
  if (/\b(decline|turn\s*down|reject|say\s*no|not\s*interested|cannot\s*take|can't\s*take|low\s*budget|fire\s*client|end\s*contract|terminate)\b/i.test(q)) {
    return `### 🛡️ How to Politely Decline a Project or Low-Budget Request

When turning down an inquiry, protect your time while remaining professional and leaving the door open for future high-budget opportunities.

---

#### 📧 Template A: Fully Booked / Schedule Capacity
**Subject:** *Thank you for considering me — Project inquiry*

> *"Hi ${clientPlaceholder},\n>\n> Thank you so much for reaching out! Your project sounds very exciting, and I appreciate you considering me.\n>\n> Currently, my production schedule is fully committed through next month to ensure my ongoing deliverables receive my undivided focus. Because of this, I won't be able to take this on with the turnaround you deserve.\n>\n> If your timeline has flexibility for next quarter, I’d love to revisit this. Alternatively, I would be happy to introduce you to another trusted peer in my network who may have immediate availability.\n>\n> Wishing you great success with the launch!\n>\n> Best regards,\n> ${userName}*\n> *${userTitle}*"

---

#### 📧 Template B: Budget Below Your Minimum Engagement
**Subject:** *Re: Project scope & budget discussion*

> *"Hi ${clientPlaceholder},\n>\n> Thank you for sharing the project brief and target budget.\n>\n> To deliver the high level of quality, testing, and dedicated support my clients rely on, my minimum project engagement begins at ${currency}2,500 (or ${currency}${currentRate}/hr). Given your current budget constraints, we wouldn't be able to cover the full scope outlined.\n>\n> If you'd like, we can explore narrowing the scope to a streamlined Phase 1 MVP that fits within your budget. Otherwise, I completely understand if you need to find an alternative partner.\n>\n> Let me know how you'd like to proceed!\n>\n> Warm regards,\n> ${userName}*"

---
💡 **Freelance Strategy Tip:** Never apologize for your rates. Position your pricing around business outcome, reliability, and peace of mind.`;
  }

  // 2. Overdue Invoices & Payment Chasing
  if (/\b(overdue|unpaid|late\s*pay|invoice|chase\s*payment|remind\s*payment|not\s*paid|payment\s*delay|pending\s*payment)\b/i.test(q)) {
    let workspaceInvoiceNote = '';
    if (unpaidInvoices.length > 0) {
      workspaceInvoiceNote = `\n> 📌 **Workspace Alert:** You currently have **${unpaidInvoices.length} unpaid invoice(s)** totaling **${currency}${totalUnpaid.toLocaleString()}**.\n`;
    }

    return `### 💰 Overdue Invoice Follow-Up System
${workspaceInvoiceNote}
Late payments disrupt your cash flow. Follow this progressive 3-tier escalation strategy:

---

#### 📧 Level 1: Friendly Reminder (1–3 Days Past Due)
**Subject:** *Friendly Reminder: Invoice for ${clientPlaceholder}*

> *"Hi ${clientPlaceholder},\n>\n> I hope you're having a productive week!\n>\n> Just a quick note to remind you that invoice **#INV-2026-01** (${currency}${unpaidInvoices[0]?.total || '1,250'}) was due on **${unpaidInvoices[0]?.dueDate || 'recently'}**.\n>\n> I’ve re-attached a copy for your convenience. Please let me know if your finance team needs any additional details or purchase order references to process this.\n>\n> Thank you!\n>\n> Best regards,\n> ${userName}*"

---

#### 📧 Level 2: Direct Check-in (7 Days Past Due)
**Subject:** *Follow-up: Past due invoice #INV-2026-01*

> *"Hi ${clientPlaceholder},\n>\n> I’m following up on my note from last week regarding invoice **#INV-2026-01** for ${currency}${unpaidInvoices[0]?.total || '1,250'}, which is now 7 days overdue.\n>\n> Could you please check with your accounts payable department on the scheduled disbursement date? If there are any discrepancies with the deliverables or invoice details, let me know so we can resolve them right away.\n>\n> Appreciate your prompt response!\n>\n> Best,\n> ${userName}*"

---

#### 📧 Level 3: Work Pause Notice (14+ Days Past Due)
**Subject:** *Urgent: Outstanding payment & project milestone status*

> *"Hi ${clientPlaceholder},\n>\n> As our agreed invoice **#INV-2026-01** is now two weeks past due without receipt, our company policy requires us to temporarily pause active work on upcoming milestones until outstanding balances are cleared.\n>\n> Once payment is confirmed, I will immediately resume active development and get our next sprint back on track. You can process payment via the bank details on the invoice.\n>\n> Thank you for your cooperation in getting this settled today.\n>\n> Sincerely,\n> ${userName}*"

---
💡 **Golden Rule:** Never deliver final production assets or transfer full copyright until the final invoice is paid in full.`;
  }

  // 3. Scope Creep & Extra Requests
  if (/\b(scope|creep|out\s*of\s*scope|extra\s*feature|extra\s*work|unplanned|additional\s*task|change\s*request|add-on)\b/i.test(q)) {
    return `### 🛡️ Managing Scope Creep with High Professionalism

The Golden Rule of freelance scope management: **Never say a flat "No" — say "Yes, and here is how we can budget and schedule it."**

---

#### 📧 Scope Add-On & Change Order Email
**Subject:** *Feature request & add-on estimate for ${clientPlaceholder}*

> *"Hi ${clientPlaceholder},\n>\n> That is a great feature idea! It would definitely add significant value to the end-user experience.\n>\n> Because this feature falls outside the original scope agreed in our milestone roadmap, I have put together two quick options so we can accommodate it cleanly:\n>\n> **Option 1: Add as an Add-On Scope**\n> • Estimated effort: ~6–10 hours\n> • Add-on investment: ${currency}${(currentRate * 8).toLocaleString()} (based on standard rate of ${currency}${currentRate}/hr)\n> • Timeline impact: Adds 3 business days to the final launch date.\n>\n> **Option 2: Task Swap (No extra cost)**\n> • We can replace an existing lower-priority feature from this sprint with this new one, keeping our original budget and launch date unchanged.\n>\n> Let me know which direction aligns best with your goals, and I'll update our project board accordingly!\n>\n> Best regards,\n> ${userName}*"

---
💡 **Contract Safeguard:** Always confirm scope changes in writing before beginning development. You can log extra hours in the Me Plus **Time Tracker** with a dedicated tag: \`[Add-on Scope]\`.`;
  }

  // 4. Rate Increase & Pricing Strategy
  if (/\b(rate\s*increase|raise\s*rates?|pricing|price|how\s*much\s*to\s*charge|hourly\s*rate|increase\s*rates?|charging\s*more|charge\s*higher|value\s*pricing)\b/i.test(q)) {
    const newRate15 = Math.round(currentRate * 1.15);
    const newRate25 = Math.round(currentRate * 1.25);

    return `### 💡 Freelance Pricing Strategy & Rate Increase Notice

Your current base rate in Me Plus is **${currency}${currentRate}/hr**.
• **+15% Adjustment:** ${currency}${newRate15}/hr (Standard annual cost-of-living & skillset bump)
• **+25% Adjustment:** ${currency}${newRate25}/hr (For high-demand specialists with full pipelines)

---

#### 📧 Rate Increase Letter for Existing Clients (30-Day Notice)
**Subject:** *Update on our partnership & upcoming 2026 rates*

> *"Hi ${clientPlaceholder},\n>\n> I want to take a moment to thank you for our continued collaboration on our recent milestones. Working with your team has been a true pleasure!\n>\n> As part of my annual business review and investments in advanced tools, tooling infrastructure, and expanded capabilities, my standard hourly rate will adjust from **${currency}${currentRate}/hr** to **${currency}${newRate15}/hr**, effective **30 days from today**.\n>\n> **Grandfathering Courtesy for Our Ongoing Work:**\n> Because I deeply value our long-standing relationship, all existing milestone commitments and any sprint hours booked before the end of this month will be honored at our current **${currency}${currentRate}/hr** rate.\n>\n> Thank you again for your partnership, and I look forward to continuing to deliver outstanding results for your team!\n>\n> Warm regards,\n> ${userName}*\n> *${userTitle}*"

---
💡 **Psychology Tip:** Existing clients rarely leave over a 10–20% rate increase when given 30 days notice and reminded of the consistency and trust you deliver.`;
  }

  // 5. Client Conflict / Feedback / Revisions
  if (/\b(unhappy|angry|complaint|dissatisfied|conflict|argument|dispute|too\s*many\s*revision|revision\s*limit|client\s*is\s*mad|refund|chargeback)\b/i.test(q)) {
    return `### 🤝 De-Escalating Client Tension & Revision Fatigue

When client feedback gets tense or revisions exceed expectations, use the **Acknowledge ➔ Align ➔ Action** framework to regain leadership of the project.

---

#### 📧 De-Escalation & Revision Alignment Email
**Subject:** *Aligning on next steps for ${clientPlaceholder}*

> *"Hi ${clientPlaceholder},\n>\n> Thank you for sharing your candid thoughts. I completely understand your desire to get this milestone exactly right, and I share that goal with you 100%.\n>\n> To make sure we don't spin wheels or introduce conflicting changes, let’s consolidate all feedback into one prioritized punch-list. Here is how I propose we resolve this efficiently:\n>\n> 1. **Consolidated Review:** Please review the draft with your key stakeholders and compile one bulleted list of essential adjustments.\n> 2. **Focused Revision Sprint:** I will execute these items in one dedicated revision block within 48 hours.\n> 3. **Live 15-Min Walkthrough:** Once updated, we will jump on a brief screen share to confirm everything is approved before locking the milestone.\n>\n> Let me know if that structured approach works for you, and I’ll get started right away!\n>\n> Best regards,\n> ${userName}*"

---
💡 **Professional Boundary:** If the client requests changes that contradict previously approved wireframes, gently reference the sign-off date and position the changes as an iteration phase.`;
  }

  // 6. Delays & Deadline Extensions
  if (/\b(delay|behind\s*schedule|missed\s*deadline|late\s*deliver|emergency|sick|extension|cannot\s*finish\s*on\s*time)\b/i.test(q)) {
    return `### ⏰ Communicating Project Delays Like a Pro

The cardinal rule: **Never notify a client of a delay on the day of the deadline.** Notify them 48+ hours in advance, explain the reason briefly, and offer a concrete revised delivery date.

---

#### 📧 Proactive Milestone Extension Notice
**Subject:** *Progress update & revised delivery schedule for ${clientPlaceholder}*

> *"Hi ${clientPlaceholder},\n>\n> I wanted to provide a proactive status update on our current milestone deliverables.\n>\n> While the core components are progressing well, [brief reason: e.g., resolving complex edge-case testing / unexpected technical hurdles] has taken more dedicated attention than initially estimated.\n>\n> Rather than rushing a compromised version to meet our original deadline, I want to ensure the deliverables meet the highest standard of reliability. I am adjusting our delivery date by **[2 business days]** to **[New Date, e.g. Thursday at 4 PM EST]**.\n>\n> In the meantime, I have staged a live progress preview here for your review: **[Link/Attachment]**.\n>\n> Thank you for your understanding and partnership!\n>\n> Best regards,\n> ${userName}*"

---
💡 **Trust Factor:** Clients respect honesty and early notice. Sharing partial work proves you have made substantial progress and are not simply stalling.`;
  }

  // 7. Proposals, Pitches & Cold Inquiries
  if (/\b(pitch|proposal|cold\s*email|outreach|win\s*client|rfp|introductory\s*email|new\s*client|portfolio\s*intro)\b/i.test(q)) {
    return `### 🎯 High-Converting Freelance Pitch & Proposal

Clients hire freelancers who show they understand the client's business problem, not freelancers who simply list their resume skills.

---

#### 📧 3-Part High-Converting Pitch Template
**Subject:** *Quick idea regarding ${clientPlaceholder}'s digital experience*

> *"Hi [First Name],\n>\n> I came across [Company Name]'s recent launch and was really impressed by [Specific Feature / Campaign].\n>\n> As an independent ${userTitle}, I specialize in helping fast-moving companies build high-converting, reliable digital products without the overhead of a bloated agency.\n>\n> I noticed a quick opportunity to optimize your [e.g. mobile onboarding flow / page load speed / dashboard analytics], which could noticeably boost your user retention.\n>\n> I recently delivered a similar project for a client that increased completion rates by 28%.\n>\n> Are you open to a brief 10-minute exploratory chat next Tuesday at 2 PM to see if partnering makes sense for your upcoming roadmap?\n>\n> Best regards,\n> ${userName}*\n> *Portfolio: [Your Portfolio Link]*"

---
💡 **Closing Tip:** Keep outreach under 150 words. Ask for an easy, low-friction micro-commitment (a 10-minute chat) rather than asking them to buy immediately.`;
  }

  // 8. Testimonials, Reviews & Case Studies
  if (/\b(testimonial|review|case\s*study|referral|recommendation|linkedin\s*review|google\s*review)\b/i.test(q)) {
    return `### ⭐ Asking for 5-Star Testimonials & Referrals

The best time to ask for a testimonial is **within 48 hours of delivering a successful milestone** when client satisfaction is at its peak.

---

#### 📧 The 3-Question Testimonial Request
**Subject:** *Thank you! + Quick 2-minute favor for ${clientPlaceholder}*

> *"Hi ${clientPlaceholder},\n>\n> It has been an absolute pleasure collaborating on this milestone and seeing the positive feedback on launch!\n>\n> As an independent professional, genuine client feedback is the lifeblood of my business. Would you be willing to share 2–3 sentences about your experience working together?\n>\n> To make it effortless, here are 3 quick prompts you can answer in bullet points:\n> 1. *What was the primary challenge you faced before we started?*\n> 2. *How did our collaboration and communication help resolve it?*\n> 3. *What specific result or improvement did you appreciate the most?*\n>\n> Feel free to reply directly to this email or leave a quick recommendation on my LinkedIn profile: [Link].\n>\n> Thank you so much for your support!\n>\n> Warmly,\n> ${userName}*"

---
💡 **Power Move:** If they are busy, offer: *"If you're pressed for time, I can draft a brief 2-sentence quote based on our results for you to approve with one click!"*`;
  }

  // 9. Workspace Status, Daily Priorities & Sprints
  if (/\b(workspace\s*status|status\s*summary|daily\s*priority|priorities|what\s*should\s*i\s*work\s*on|overview\s*of\s*my\s*work|my\s*digest|today\s*plan|sprint\s*plan|backlog|workload)\b/i.test(q)) {
    const clientList = clients.length > 0 ? clients.map(c => `• **${c.name}** (${c.company || 'Client'}) — Status: \`${c.status || 'Active'}\``).slice(0, 5).join('\n') : '• *No clients registered yet.*';
    const projectList = projects.length > 0 ? projects.map(p => `• **${p.title}** — ${p.progress || 0}% complete (Due: ${p.deadline || 'No deadline'})`).slice(0, 5).join('\n') : '• *No projects registered yet.*';
    const taskList = pendingTasks.length > 0 ? pendingTasks.slice(0, 5).map(t => `• [${t.priority.toUpperCase()}] **${t.title}** (Status: \`${t.status}\`, Due: ${t.dueDate || 'Today'})`).join('\n') : '• *All tasks are completed! Awesome job.*';

    return `### 📊 Live Workspace Intelligence & Daily Battle Plan

**FREELANCER PROFILE:**
• **Professional:** ${userName} (${userTitle})
• **Base Rate:** ${currency}${currentRate}/hr
• **Total Pipeline:** ${clients.length} Clients | ${projects.length} Projects | ${pendingTasks.length} Pending Tasks

---

#### 📋 Active Clients (${clients.length})
${clientList}

#### 🚀 Key Projects in Flight (${projects.length})
${projectList}

#### ⚡ Top Priority Tasks (${pendingTasks.length} remaining)
${taskList}

---

### 🎯 Recommended 3-Step Focus for Today:
1. **Tackle Urgent Tasks First:** Complete the high-priority deliverables above before opening new inbox threads.
2. **Log Billable Hours:** Track your focused sprints using the Me Plus **Live Stopwatch** to ensure no billable minutes slip through the cracks.
3. **Proactive Client Touchpoint:** Send a 2-minute status check-in to your most active client to maintain strong engagement and confidence.`;
  }

  // 10. General Freelance Business Synthesis
  const sampleClient = clients[0]?.name || clients[0]?.company || 'your active client';
  const sampleProject = projects[0]?.title || 'your current project';

  return `### 💡 Me Plus AI Freelance Advisor

Regarding: **"${message}"**

Here is strategic guidance tailored to your freelance practice:

1. **Clear Milestones & Alignment:**
   Ensure deliverables for ${sampleProject} have unambiguous acceptance criteria. This prevents misunderstandings and guarantees faster milestone approvals.

2. **Accurate Time & Value Capture:**
   At your baseline rate of **${currency}${currentRate}/hr**, every hour of unplanned revisions costs real revenue. Log sprint intervals in the **Time Tracking** tab to capture billable work precisely.

3. **Proactive Client Communication:**
   Reach out to ${sampleClient} with quick 48-hour progress notes. Frequent short updates eliminate client anxiety and build long-term retention.

---
*Tip: To have an open-ended interactive conversation on any topic, connect your Google Gemini (Free) or OpenAI API key in AI Settings!*`;
};
