import express from 'express';
import cors from 'cors';
import {
  readDb,
  writeDb,
  getCollection,
  saveCollection,
  resetDbToSeed,
  getDeterministicUserId,
  isDemoSeedEntity,
} from './db.js';

const app = express();
const PORT = process.env.PORT || 5000;

// Middlewares
app.use(cors());
app.use(express.json({ limit: '15mb' }));
app.use(express.urlencoded({ limit: '15mb', extended: true }));

// Request logger for API calls
app.use((req, res, next) => {
  if (req.url.startsWith('/api')) {
    console.log(`[API ${req.method}] ${req.url}`);
  }
  next();
});

// Helper to get active userId from request
function getReqUserId(req) {
  const raw = req.query.userId || req.headers['x-user-id'] || req.body?.userId || req.body?.id;
  if (!raw) return 'usr-1';
  if (raw.includes('@')) return getDeterministicUserId(raw);
  return raw;
}

// --- Health Check ---
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// --- Auth Endpoints ---
app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;
  if (!email) {
    return res.status(400).json({ error: 'Email address is required' });
  }

  const db = readDb();
  const users = db.users || [];
  const normalizedEmail = email.trim().toLowerCase();

  // Find user by email
  const existingUser = users.find(u => u.email.toLowerCase() === normalizedEmail);

  if (!existingUser) {
    return res.status(401).json({
      error: 'Invalid credentials: No account is registered with this email. Please create an account first.',
    });
  }

  // If password provided, verify password
  if (password && existingUser.password && existingUser.password !== password) {
    return res.status(401).json({
      error: 'Invalid credentials: The password you entered is incorrect. Please check and try again.',
    });
  }

  // Normalize deterministic ID
  const deterministicId = getDeterministicUserId(normalizedEmail);
  existingUser.id = deterministicId;

  // Remove password before sending to client
  const { password: _, ...safeUser } = existingUser;
  db.user = safeUser;
  writeDb(db);

  res.json({ success: true, user: safeUser });
});

app.post('/api/auth/register', (req, res) => {
  const { name, email, password, profession } = req.body;

  if (!name || !name.trim()) {
    return res.status(400).json({ error: 'Full name is required' });
  }
  if (!email || !email.includes('@')) {
    return res.status(400).json({ error: 'A valid email address is required' });
  }
  if (!password || password.length < 6) {
    return res.status(400).json({ error: 'Password must be at least 6 characters long' });
  }

  const db = readDb();
  const users = db.users || [];
  const normalizedEmail = email.trim().toLowerCase();

  // Check duplicate email
  const alreadyExists = users.some(u => u.email.toLowerCase() === normalizedEmail);
  if (alreadyExists) {
    return res.status(409).json({
      error: 'An account with this email address already exists. Please sign in instead.',
    });
  }

  const newUserId = getDeterministicUserId(normalizedEmail);
  const newUser = {
    id: newUserId,
    name: name.trim(),
    email: normalizedEmail,
    password,
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=256',
    title: profession || 'Independent Freelancer',
    hourlyRate: 65,
    currency: '$',
    bio: `Freelancer specializing in ${profession || 'creative and technical services'}.`,
    notificationSettings: {
      email: true,
      sms: true,
      browser: true,
      sound: true,
      deadlineReminderHours: 24,
    },
  };

  users.push(newUser);
  db.users = users;

  // Add a welcoming notification for this new user in their fresh workspace
  const notifications = db.notifications || [];
  notifications.unshift({
    id: `notif-${Date.now()}`,
    userId: newUserId,
    title: 'Welcome to Me Plus!',
    message: `Hello ${newUser.name}, your workspace is ready. Click "+ New Client" to start managing projects.`,
    type: 'system',
    priority: 'medium',
    timestamp: 'Just now',
    read: false,
  });
  db.notifications = notifications;

  const { password: _, ...safeUser } = newUser;
  db.user = safeUser;
  writeDb(db);

  res.status(201).json({ success: true, user: safeUser });
});

// OTP Store for email verification: email -> { otp: string, expiresAt: number, verified: boolean, attempts: number, createdAt: number, resetToken?: string }
const otpStore = new Map();

app.post('/api/auth/forgot-password', (req, res) => {
  const { email } = req.body;
  if (!email) {
    return res.status(400).json({ error: 'Email address is required' });
  }

  const db = readDb();
  const users = db.users || [];
  const normalizedEmail = email.trim().toLowerCase();
  const user = users.find(u => u.email.toLowerCase() === normalizedEmail);

  if (!user) {
    return res.status(404).json({
      error: 'No registered account found with this email address. Please verify your email.',
    });
  }

  // Generate a secure 6-digit numeric OTP
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  const expiresAt = Date.now() + 10 * 60 * 1000; // 10 minutes

  otpStore.set(normalizedEmail, {
    otp,
    expiresAt,
    verified: false,
    attempts: 0,
    createdAt: Date.now(),
  });

  console.log(`\n======================================================`);
  console.log(`📧 [EMAIL SERVICE - PASSWORD RESET OTP]`);
  console.log(`To: ${normalizedEmail}`);
  console.log(`Subject: Your Me Plus Password Reset Verification Code`);
  console.log(`Your 6-Digit OTP Code is: 👉 ${otp} 👈 (Valid for 10 minutes)`);
  console.log(`======================================================\n`);

  res.json({
    success: true,
    message: `A 6-digit verification code has been sent to ${normalizedEmail}.`,
    email: normalizedEmail,
    otpPreview: otp, // Enables visual test preview in local dev
    expiresInSeconds: 600,
  });
});

app.post('/api/auth/verify-otp', (req, res) => {
  const { email, otp } = req.body;
  if (!email || !otp) {
    return res.status(400).json({ error: 'Email address and 6-digit verification code are required' });
  }

  const normalizedEmail = email.trim().toLowerCase();
  const record = otpStore.get(normalizedEmail);

  if (!record) {
    return res.status(400).json({
      error: 'No verification code was requested for this email, or it has expired. Please request a new code.',
    });
  }

  if (Date.now() > record.expiresAt) {
    otpStore.delete(normalizedEmail);
    return res.status(400).json({
      error: 'The verification code has expired. Please request a new code.',
    });
  }

  if (record.attempts >= 5) {
    otpStore.delete(normalizedEmail);
    return res.status(429).json({
      error: 'Too many incorrect attempts. For security reasons, please request a new verification code.',
    });
  }

  const cleanedOtp = otp.toString().trim();
  if (record.otp !== cleanedOtp) {
    record.attempts += 1;
    const remaining = 5 - record.attempts;
    return res.status(400).json({
      error: `Invalid verification code. Please check and try again (${remaining} attempts remaining).`,
    });
  }

  // OTP verified successfully
  const resetToken = `rst_${Date.now()}_${Math.random().toString(36).substring(2, 10)}`;
  record.verified = true;
  record.resetToken = resetToken;
  record.verifiedAt = Date.now();
  otpStore.set(normalizedEmail, record);

  res.json({
    success: true,
    message: 'OTP verification successful! You can now set your new password.',
    email: normalizedEmail,
    resetToken,
  });
});

app.post('/api/auth/resend-otp', (req, res) => {
  const { email } = req.body;
  if (!email) {
    return res.status(400).json({ error: 'Email address is required' });
  }

  const db = readDb();
  const users = db.users || [];
  const normalizedEmail = email.trim().toLowerCase();
  const user = users.find(u => u.email.toLowerCase() === normalizedEmail);

  if (!user) {
    return res.status(404).json({ error: 'No registered account found with this email address.' });
  }

  const existing = otpStore.get(normalizedEmail);
  if (existing && Date.now() - existing.createdAt < 30000) {
    const waitSeconds = Math.ceil((30000 - (Date.now() - existing.createdAt)) / 1000);
    return res.status(429).json({
      error: `Please wait ${waitSeconds} seconds before requesting a new code.`,
    });
  }

  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  const expiresAt = Date.now() + 10 * 60 * 1000;

  otpStore.set(normalizedEmail, {
    otp,
    expiresAt,
    verified: false,
    attempts: 0,
    createdAt: Date.now(),
  });

  console.log(`\n======================================================`);
  console.log(`📧 [EMAIL SERVICE - RESENT OTP]`);
  console.log(`To: ${normalizedEmail}`);
  console.log(`Your New 6-Digit OTP Code is: 👉 ${otp} 👈`);
  console.log(`======================================================\n`);

  res.json({
    success: true,
    message: `A new 6-digit verification code has been sent to ${normalizedEmail}.`,
    email: normalizedEmail,
    otpPreview: otp,
    expiresInSeconds: 600,
  });
});

app.post('/api/auth/reset-password', (req, res) => {
  const { email, newPassword, otp, resetToken } = req.body;
  if (!email || !newPassword) {
    return res.status(400).json({ error: 'Email and new password are required' });
  }
  if (newPassword.length < 6) {
    return res.status(400).json({ error: 'New password must be at least 6 characters long' });
  }

  const normalizedEmail = email.trim().toLowerCase();
  const record = otpStore.get(normalizedEmail);

  // Strict verification check:
  // Must have a record that was marked verified OR provided matching valid resetToken/OTP
  const isVerified = record && (
    record.verified === true ||
    (resetToken && record.resetToken === resetToken) ||
    (otp && record.otp === otp.toString().trim() && Date.now() <= record.expiresAt)
  );

  if (!isVerified) {
    return res.status(403).json({
      error: 'OTP verification required. Please verify the 6-digit code sent to your email before resetting your password.',
    });
  }

  const db = readDb();
  const users = db.users || [];
  const index = users.findIndex(u => u.email.toLowerCase() === normalizedEmail);

  if (index === -1) {
    return res.status(404).json({ error: 'User account not found.' });
  }

  users[index].password = newPassword;
  db.users = users;
  writeDb(db);

  // Clear OTP record after successful reset
  otpStore.delete(normalizedEmail);

  res.json({
    success: true,
    message: 'Your password has been successfully updated! You can now sign in.',
  });
});

app.get('/api/auth/me', (req, res) => {
  const db = readDb();
  res.json({ user: db.user || null });
});

app.put('/api/auth/profile', (req, res) => {
  const updates = req.body || {};
  const db = readDb();
  const users = db.users || [];

  const targetId = updates.id || updates.userId || req.query.userId || req.headers['x-user-id'] || db.user?.id;
  const targetEmail = (updates.email || req.query.email || db.user?.email || '').trim().toLowerCase();

  let targetIdx = -1;
  if (targetId) {
    targetIdx = users.findIndex(u => u.id === targetId);
  }
  if (targetIdx === -1 && targetEmail) {
    targetIdx = users.findIndex(u => u.email.toLowerCase() === targetEmail);
  }

  if (targetIdx !== -1) {
    users[targetIdx] = { ...users[targetIdx], ...updates };
    const { password: _, ...safeUser } = users[targetIdx];
    db.users = users;
    db.user = safeUser;
    writeDb(db);
    return res.json({ success: true, user: safeUser });
  }

  // Fallback
  db.user = { ...(db.user || {}), ...updates };
  writeDb(db);
  res.json({ success: true, user: db.user });
});

// --- Clients Endpoints ---
app.get('/api/clients', (req, res) => {
  const userId = getReqUserId(req);
  const clients = getCollection('clients', userId);
  res.json(clients);
});

app.post('/api/clients', (req, res) => {
  const newClientData = req.body;
  const userId = newClientData.userId || getReqUserId(req) || 'usr-1';
  const isDemo = userId === 'usr-1' || userId === 'usr-demo';
  if (!isDemo && isDemoSeedEntity(newClientData)) {
    return res.status(200).json({ ...newClientData, ignored: true });
  }
  const clients = getCollection('clients');
  const newClient = {
    ...newClientData,
    id: newClientData.id || `cli-${Date.now()}`,
    userId: userId,
    totalBilled: newClientData.totalBilled || 0,
    createdAt: newClientData.createdAt || new Date().toISOString().split('T')[0],
  };
  const existingIdx = clients.findIndex(c => c.id === newClient.id);
  if (existingIdx >= 0) {
    clients[existingIdx] = newClient;
  } else {
    clients.unshift(newClient);
  }
  saveCollection('clients', clients);
  res.status(201).json(newClient);
});

app.put('/api/clients/:id', (req, res) => {
  const { id } = req.params;
  const updates = req.body;
  const clients = getCollection('clients');
  const index = clients.findIndex(c => c.id === id);
  if (index === -1) return res.status(404).json({ error: 'Client not found' });

  clients[index] = { ...clients[index], ...updates };
  saveCollection('clients', clients);
  res.json(clients[index]);
});

app.delete('/api/clients/:id', (req, res) => {
  const { id } = req.params;
  let clients = getCollection('clients');
  clients = clients.filter(c => c.id !== id);
  saveCollection('clients', clients);
  res.json({ success: true, id });
});

// --- Projects Endpoints ---
app.get('/api/projects', (req, res) => {
  const userId = getReqUserId(req);
  const projects = getCollection('projects', userId);
  res.json(projects);
});

app.post('/api/projects', (req, res) => {
  const newProjectData = req.body;
  const userId = newProjectData.userId || getReqUserId(req) || 'usr-1';
  const isDemo = userId === 'usr-1' || userId === 'usr-demo';
  if (!isDemo && isDemoSeedEntity(newProjectData)) {
    return res.status(200).json({ ...newProjectData, ignored: true });
  }
  const projects = getCollection('projects');
  const newProject = {
    ...newProjectData,
    id: newProjectData.id || `prj-${Date.now()}`,
    userId: userId,
    spent: newProjectData.spent || 0,
    progress: newProjectData.progress || 0,
    createdAt: newProjectData.createdAt || new Date().toISOString().split('T')[0],
  };
  const existingIdx = projects.findIndex(p => p.id === newProject.id);
  if (existingIdx >= 0) {
    projects[existingIdx] = newProject;
  } else {
    projects.unshift(newProject);
  }
  saveCollection('projects', projects);
  res.status(201).json(newProject);
});

app.put('/api/projects/:id', (req, res) => {
  const { id } = req.params;
  const updates = req.body;
  const projects = getCollection('projects');
  const index = projects.findIndex(p => p.id === id);
  if (index === -1) return res.status(404).json({ error: 'Project not found' });

  projects[index] = { ...projects[index], ...updates };
  saveCollection('projects', projects);
  res.json(projects[index]);
});

app.delete('/api/projects/:id', (req, res) => {
  const { id } = req.params;
  let projects = getCollection('projects');
  projects = projects.filter(p => p.id !== id);
  saveCollection('projects', projects);
  res.json({ success: true, id });
});

// --- Tasks Endpoints ---
app.get('/api/tasks', (req, res) => {
  const userId = getReqUserId(req);
  const tasks = getCollection('tasks', userId);
  res.json(tasks);
});

app.post('/api/tasks', (req, res) => {
  const newTaskData = req.body;
  const userId = newTaskData.userId || getReqUserId(req) || 'usr-1';
  const isDemo = userId === 'usr-1' || userId === 'usr-demo';
  if (!isDemo && isDemoSeedEntity(newTaskData)) {
    return res.status(200).json({ ...newTaskData, ignored: true });
  }
  const tasks = getCollection('tasks');
  const newTask = {
    ...newTaskData,
    id: newTaskData.id || `tsk-${Date.now()}`,
    userId: userId,
    actualHours: newTaskData.actualHours || 0,
    subtasks: newTaskData.subtasks || [],
    attachments: newTaskData.attachments || [],
    createdAt: newTaskData.createdAt || new Date().toISOString().split('T')[0],
  };
  const existingIdx = tasks.findIndex(t => t.id === newTask.id);
  if (existingIdx >= 0) {
    tasks[existingIdx] = newTask;
  } else {
    tasks.unshift(newTask);
  }
  saveCollection('tasks', tasks);
  res.status(201).json(newTask);
});

app.put('/api/tasks/:id', (req, res) => {
  const { id } = req.params;
  const updates = req.body;
  const tasks = getCollection('tasks');
  const index = tasks.findIndex(t => t.id === id);
  if (index === -1) return res.status(404).json({ error: 'Task not found' });

  tasks[index] = { ...tasks[index], ...updates };
  saveCollection('tasks', tasks);
  res.json(tasks[index]);
});

app.delete('/api/tasks/:id', (req, res) => {
  const { id } = req.params;
  let tasks = getCollection('tasks');
  tasks = tasks.filter(t => t.id !== id);
  saveCollection('tasks', tasks);
  res.json({ success: true, id });
});

// --- Time Entries Endpoints ---
app.get('/api/time-entries', (req, res) => {
  const userId = getReqUserId(req);
  const timeEntries = getCollection('timeEntries', userId);
  res.json(timeEntries);
});

app.post('/api/time-entries', (req, res) => {
  const newEntryData = req.body;
  const userId = newEntryData.userId || getReqUserId(req) || 'usr-1';
  const isDemo = userId === 'usr-1' || userId === 'usr-demo';
  if (!isDemo && isDemoSeedEntity(newEntryData)) {
    return res.status(200).json({ ...newEntryData, ignored: true });
  }
  const timeEntries = getCollection('timeEntries');
  const newEntry = {
    ...newEntryData,
    id: newEntryData.id || `time-${Date.now()}`,
    userId: userId,
    date: newEntryData.date || new Date().toISOString().split('T')[0],
  };
  const existingIdx = timeEntries.findIndex(t => t.id === newEntry.id);
  if (existingIdx >= 0) {
    timeEntries[existingIdx] = newEntry;
  } else {
    timeEntries.unshift(newEntry);
  }
  saveCollection('timeEntries', timeEntries);
  res.status(201).json(newEntry);
});

app.delete('/api/time-entries/:id', (req, res) => {
  const { id } = req.params;
  let timeEntries = getCollection('timeEntries');
  timeEntries = timeEntries.filter(t => t.id !== id);
  saveCollection('timeEntries', timeEntries);
  res.json({ success: true, id });
});

// --- Invoices Endpoints ---
app.get('/api/invoices', (req, res) => {
  const userId = getReqUserId(req);
  const invoices = getCollection('invoices', userId);
  res.json(invoices);
});

app.post('/api/invoices', (req, res) => {
  const newInvoiceData = req.body;
  const userId = newInvoiceData.userId || getReqUserId(req) || 'usr-1';
  const isDemo = userId === 'usr-1' || userId === 'usr-demo';
  if (!isDemo && isDemoSeedEntity(newInvoiceData)) {
    return res.status(200).json({ ...newInvoiceData, ignored: true });
  }
  const invoices = getCollection('invoices');
  const newInvoice = {
    ...newInvoiceData,
    id: newInvoiceData.id || `inv-${Date.now()}`,
    userId: userId,
    createdAt: newInvoiceData.createdAt || new Date().toISOString().split('T')[0],
  };
  const existingIdx = invoices.findIndex(i => i.id === newInvoice.id);
  if (existingIdx >= 0) {
    invoices[existingIdx] = newInvoice;
  } else {
    invoices.unshift(newInvoice);
  }
  saveCollection('invoices', invoices);
  res.status(201).json(newInvoice);
});

app.put('/api/invoices/:id', (req, res) => {
  const { id } = req.params;
  const updates = req.body;
  const invoices = getCollection('invoices');
  const index = invoices.findIndex(i => i.id === id);
  if (index === -1) return res.status(404).json({ error: 'Invoice not found' });

  invoices[index] = { ...invoices[index], ...updates };
  saveCollection('invoices', invoices);
  res.json(invoices[index]);
});

app.delete('/api/invoices/:id', (req, res) => {
  const { id } = req.params;
  let invoices = getCollection('invoices');
  invoices = invoices.filter(i => i.id !== id);
  saveCollection('invoices', invoices);
  res.json({ success: true, id });
});

// --- Notifications Endpoints ---
app.get('/api/notifications', (req, res) => {
  const userId = getReqUserId(req);
  const notifs = getCollection('notifications', userId);
  res.json(notifs);
});

app.put('/api/notifications/:id/read', (req, res) => {
  const { id } = req.params;
  const notifs = getCollection('notifications');
  const item = notifs.find(n => n.id === id);
  if (item) item.read = true;
  saveCollection('notifications', notifs);
  res.json({ success: true });
});

app.delete('/api/notifications', (req, res) => {
  const userId = getReqUserId(req);
  let notifs = getCollection('notifications');
  if (userId) {
    notifs = notifs.filter(n => n.userId !== userId);
  } else {
    notifs = [];
  }
  saveCollection('notifications', notifs);
  res.json({ success: true });
});

// --- AI Helpers ---
function generateSmartFallback(message, req) {
  const q = (message || '').toLowerCase();
  const userId = getReqUserId(req);
  const projects = getCollection('projects', userId);
  const clients = getCollection('clients', userId);
  const tasks = getCollection('tasks', userId);
  const pending = tasks.filter(t => t.status !== 'done').length;
  const clientNames = clients.map(c => c.company || c.name).slice(0, 5).join(', ');

  if (q.includes('price') || q.includes('rate') || q.includes('how much') || q.includes('quote') || q.includes('increase')) {
    return `### 💡 Strategy for Hourly Rate & Pricing:\n\n1. **Give Advance Notice**: Provide 30 to 45 days notice before applying new rates.\n2. **Emphasize Value & Growth**: Highlight your increased speed, reliability, and expanded capabilities.\n3. **Grandfathering Options**: Offer existing clients a transitional period or retainer discount.\n\n**Sample Template to Client:**\n> *"Hi [Client Name], as I continue to expand my tools and capabilities, my standard rate will update starting next month. Because I deeply appreciate our collaboration, all ongoing projects and pre-booked hours will be honored at our current rate through next month. Looking forward to our continued success!"*`;
  }
  if (q.includes('email') || q.includes('follow up') || q.includes('invoice') || q.includes('overdue') || q.includes('unpaid')) {
    return `### 📧 Overdue Invoice Follow-Up Draft:\n\n**Subject:** *Follow-up: Invoice status for [Project Name]*\n\n> *"Hi [Client Name],\n>\n> I hope you are having a productive week!\n>\n> I am reaching out to check on the status of invoice **#INV-2026-X**, which was due recently. Please let me know if your accounts team requires any additional documentation or updated bank details to process this.\n>\n> Thank you for your prompt attention!\n>\n> Best regards,\n> Freelancer*"*`;
  }
  if (q.includes('scope') || q.includes('extra') || q.includes('creep') || q.includes('change')) {
    return `### 🛡️ Managing Scope Creep with Grace:\n\nWhen a client asks for tasks outside the agreed milestone, **never say a flat 'No'**—say **'Yes, and here is how we can budget it'**:\n\n**Recommended Response Template:**\n> *"Hi [Client Name],\n>\n> That is a fantastic feature idea and would certainly elevate the project!\n>\n> Since this falls outside our original milestone deliverables, I can create a quick add-on scope estimate for you (approx. 5–8 hours). We can either:\n> 1. Add it to our current sprint as Phase 2, or\n> 2. Swap out an existing lower-priority task from this sprint to keep the launch date on track.\n>\n> Let me know which approach you prefer!"*`;
  }
  if (q.includes('pitch') || q.includes('proposal') || q.includes('new client') || q.includes('win client')) {
    return `### 🎯 High-Converting Client Pitch Template:\n\n**Subject:** *Partnering on [Client Company]'s UI & Web Product Growth*\n\n> *"Hi [Client Name],\n>\n> I’ve been following [Client Company]'s recent developments and was very impressed with your latest release.\n>\n> As an independent specialist, I help teams build fast, clean, and high-converting digital products.\n>\n> I’d love to share 2 quick ideas on how we can optimize your upcoming roadmap. Do you have 15 minutes for a quick introductory chat next Tuesday?\n>\n> Best regards*"*`;
  }
  if (q.includes('summary') || q.includes('status') || q.includes('overview') || q.includes('work') || q.includes('dashboard') || q.includes('client') || q.includes('project')) {
    return `### 📊 Workspace Overview:\n\n• **Active Clients (${clients.length})**: ${clientNames || 'None yet'}\n• **Projects (${projects.length})**: ${projects.map(p => p.title).slice(0, 5).join(', ') || 'None yet'}\n• **Pending Tasks**: **${pending} tasks** remaining across all boards.\n\n**Freelancer Productivity Recommendation:** Focus on high-priority deadlines first, track every hour with the live stopwatch, and keep client communication transparent with weekly digest emails.`;
  }

  return `### 🤖 Me Plus AI Freelancer Advisor:\n\nRegarding **"${message}"**:\n\nHere are the top best practices to apply:\n\n1. **Clear Expectations & Deliverables**: Set defined milestones and delivery criteria so both you and the client are aligned.\n2. **Time-Boxing & Focus**: Track your focused sprint sessions using the built-in live stopwatch to accurately capture billable hours.\n3. **Proactive Updates**: Share quick progress notes every 48–72 hours to build client trust and eliminate anxiety.\n\n*Tip: Connect your Google Gemini (Free) or OpenAI ChatGPT account in AI Settings to chat with full live generative intelligence!*`;
}

// --- AI Test Connection Endpoint ---
app.post('/api/ai/test-connection', async (req, res) => {
  const { provider, apiKey, model } = req.body || {};

  if (!apiKey || !apiKey.trim()) {
    return res.status(400).json({
      success: false,
      message: `Please provide a valid ${provider === 'gemini' ? 'Google Gemini' : 'OpenAI'} API key.`,
    });
  }

  const cleanKey = apiKey.trim();
  const startTime = Date.now();

  try {
    if (provider === 'gemini') {
      const targetModel = model || 'gemini-1.5-flash';
      const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${targetModel}:generateContent?key=${cleanKey}`;
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ role: 'user', parts: [{ text: 'Respond with OK' }] }],
          generationConfig: { maxOutputTokens: 5 },
        }),
      });

      const latencyMs = Date.now() - startTime;
      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        const msg = errData.error?.message || `Gemini API returned status ${response.status}`;
        return res.status(400).json({ success: false, message: msg });
      }

      return res.json({
        success: true,
        message: `Connected to Google Gemini (${targetModel}) successfully!`,
        latencyMs,
      });
    } else if (provider === 'openai') {
      const targetModel = model || 'gpt-4o-mini';
      const endpoint = 'https://api.openai.com/v1/chat/completions';
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${cleanKey}`,
        },
        body: JSON.stringify({
          model: targetModel,
          messages: [{ role: 'user', content: 'Say OK' }],
          max_tokens: 5,
        }),
      });

      const latencyMs = Date.now() - startTime;
      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        const msg = errData.error?.message || `OpenAI API returned status ${response.status}`;
        return res.status(400).json({ success: false, message: msg });
      }

      return res.json({
        success: true,
        message: `Connected to OpenAI (${targetModel}) successfully!`,
        latencyMs,
      });
    } else {
      return res.json({
        success: true,
        message: 'Built-in Freelance Copilot is active and ready (no key required).',
        latencyMs: 12,
      });
    }
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: err.message || 'Unable to connect to AI provider.',
    });
  }
});

// --- AI Chat Endpoint ---
app.post('/api/ai/chat', async (req, res) => {
  const {
    message,
    history = [],
    provider = 'builtin',
    apiKey,
    model,
    workspaceContext = '',
    customInstructions = '',
  } = req.body || {};

  const query = (message || '').trim();
  if (!query) {
    return res.status(400).json({ error: 'Message cannot be empty.' });
  }

  // 1. Google Gemini
  if (provider === 'gemini' && apiKey && apiKey.trim()) {
    try {
      const targetModel = model || 'gemini-1.5-flash';
      const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${targetModel}:generateContent?key=${apiKey.trim()}`;

      const systemPrompt = `You are the Me Plus AI Copilot, a top-tier business, client communication, and freelance strategist.
LIVE WORKSPACE CONTEXT:
${workspaceContext || 'Freelancer task & client management platform.'}

GUIDELINES:
- Be concise, practical, empowering, and polite.
- Help draft emails, invoices, rate increases, manage scope creep, and organize milestones.
- Format responses cleanly with markdown bolding, bullet points, and quotes.
${customInstructions ? `\nCUSTOM INSTRUCTIONS:\n${customInstructions}` : ''}`;

      const contents = [
        ...history.slice(-8).map(h => ({
          role: h.role === 'assistant' ? 'model' : 'user',
          parts: [{ text: h.content || h.text || '' }],
        })),
        { role: 'user', parts: [{ text: query }] },
      ];

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents,
          systemInstruction: { parts: [{ text: systemPrompt }] },
          generationConfig: { temperature: 0.7, maxOutputTokens: 2048 },
        }),
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error?.message || `Gemini API returned ${response.status}`);
      }

      const data = await response.json();
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
      if (text) {
        return res.json({ reply: text, provider: 'gemini', model: targetModel });
      }
    } catch (err) {
      console.warn('Gemini API call failed, falling back to smart reply:', err.message);
      return res.json({
        reply: `⚠️ **Google Gemini Notice**: ${err.message}\n\n*Falling back to built-in advisor:*\n\n${generateSmartFallback(query, req)}`,
        provider: 'builtin',
        model: 'builtin',
      });
    }
  }

  // 2. OpenAI ChatGPT
  if (provider === 'openai' && apiKey && apiKey.trim()) {
    try {
      const targetModel = model || 'gpt-4o-mini';
      const endpoint = 'https://api.openai.com/v1/chat/completions';

      const systemPrompt = `You are the Me Plus AI Copilot, a top-tier business, client communication, and freelance strategist.
LIVE WORKSPACE CONTEXT:
${workspaceContext || 'Freelancer task & client management platform.'}

GUIDELINES:
- Be concise, practical, empowering, and polite.
- Help draft emails, invoices, rate increases, manage scope creep, and organize milestones.
- Format responses cleanly with markdown bolding, bullet points, and quotes.
${customInstructions ? `\nCUSTOM INSTRUCTIONS:\n${customInstructions}` : ''}`;

      const messages = [
        { role: 'system', content: systemPrompt },
        ...history.slice(-8).map(h => ({
          role: h.role === 'model' ? 'assistant' : (h.role || 'user'),
          content: h.content || h.text || '',
        })),
        { role: 'user', content: query },
      ];

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey.trim()}`,
        },
        body: JSON.stringify({
          model: targetModel,
          messages,
          temperature: 0.7,
        }),
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error?.message || `OpenAI API returned ${response.status}`);
      }

      const data = await response.json();
      const text = data.choices?.[0]?.message?.content;
      if (text) {
        return res.json({ reply: text, provider: 'openai', model: targetModel });
      }
    } catch (err) {
      console.warn('OpenAI API call failed, falling back to smart reply:', err.message);
      return res.json({
        reply: `⚠️ **OpenAI Notice**: ${err.message}\n\n*Falling back to built-in advisor:*\n\n${generateSmartFallback(query, req)}`,
        provider: 'builtin',
        model: 'builtin',
      });
    }
  }

  // 3. Built-in Smart Advisor
  return res.json({
    reply: generateSmartFallback(query, req),
    provider: 'builtin',
    model: 'builtin',
  });
});

// --- Reset Data Endpoint ---
app.post('/api/reset', (req, res) => {
  const data = resetDbToSeed();
  res.json({ success: true, data });
});

// Start Server
app.listen(PORT, () => {
  console.log(`🚀 Me Plus Backend REST API running at http://localhost:${PORT}`);
});
