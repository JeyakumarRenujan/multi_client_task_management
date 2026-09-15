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

// --- AI Chat Endpoint ---
app.post('/api/ai/chat', (req, res) => {
  const { message } = req.body;
  const query = (message || '').toLowerCase();

  let reply = "Here is my advice based on your current active workspace:";

  if (query.includes('price') || query.includes('rate') || query.includes('how much') || query.includes('quote')) {
    reply = "💡 **Pricing & Rate Strategy**:\n• Consider value-based pricing rather than strict hourly billing for milestones with high client impact.\n• For new projects, provide 3 tiered packages (Basic, Recommended, Premium) to anchor client expectations and maximize budget.";
  } else if (query.includes('email') || query.includes('follow up') || query.includes('invoice') || query.includes('overdue')) {
    reply = "📧 **Polite Payment Follow-up Draft**:\n\n*Hi [Client Name],*\n*Hope you're having a productive week! Just following up on invoice #[Number] sent on [Date]. Please let me know if you need any additional invoice copies or wire details.*";
  } else if (query.includes('scope') || query.includes('extra') || query.includes('change')) {
    reply = "🛡️ **Handling Scope Creep**:\n• Acknowledge the request positively: *'I love this idea and it will definitely improve the project!'*\n• Present clear timeline & budget addendum: *'Since this is beyond our initial milestone scope, this addition will require approx 5 hours ($350) and 2 days extension.'*";
  } else if (query.includes('summary') || query.includes('status') || query.includes('overview') || query.includes('work')) {
    const userId = getReqUserId(req);
    const projects = getCollection('projects', userId);
    const tasks = getCollection('tasks', userId);
    const pending = tasks.filter(t => t.status !== 'done').length;
    reply = `📊 **Workspace Status Summary**:\n• You currently have **${projects.length} active projects**.\n• **${pending} tasks** are in your pipeline.\n• Keep up the momentum! Organize your client milestones and prioritize urgent tasks.`;
  } else {
    reply = `🤖 **Me Plus AI Advisor**:\nI am here to help you manage clients, draft professional communications, negotiate milestone changes, and organize tasks. How can I assist you with your project today?`;
  }

  res.json({ reply });
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
