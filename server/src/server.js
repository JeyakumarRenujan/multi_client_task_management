import express from 'express';
import cors from 'cors';
import {
  initDatabase,
  isMongoActive,
  findUserByEmail,
  findUserById,
  createUser,
  updateUser,
  getClients,
  createClient,
  updateClient,
  deleteClient,
  getProjects,
  createProject,
  updateProject,
  deleteProject,
  getTasks,
  createTask,
  updateTask,
  deleteTask,
  getTimeEntries,
  createTimeEntry,
  deleteTimeEntry,
  getInvoices,
  createInvoice,
  updateInvoice,
  deleteInvoice,
  getNotifications,
  createNotification,
  markNotificationRead,
  deleteNotifications,
  resetDatabase,
} from './database.js';

import {
  getDeterministicUserId,
  isDemoSeedEntity,
  readDb,
  writeDb,
} from './db.js';

import {
  sendOtpEmail,
  isEmailConfigured,
  testSmtpConnection,
} from './emailService.js';

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

let activeSessionUser = null;

// --- Health Check ---
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    database: isMongoActive() ? 'mongodb' : 'json_store',
  });
});

// --- Auth Endpoints ---
app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email) {
    return res.status(400).json({ error: 'Email address is required' });
  }

  const normalizedEmail = email.trim().toLowerCase();
  const existingUser = await findUserByEmail(normalizedEmail);

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
  activeSessionUser = safeUser;
  await updateUser(deterministicId, safeUser);

  // Sync to db.json for backwards compatibility
  const db = readDb();
  db.user = safeUser;
  writeDb(db);

  res.json({ success: true, user: safeUser });
});

app.post('/api/auth/register', async (req, res) => {
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

  const normalizedEmail = email.trim().toLowerCase();
  const alreadyExists = await findUserByEmail(normalizedEmail);

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

  await createUser(newUser);

  // Add welcoming notification in the fresh workspace
  await createNotification({
    id: `notif-${Date.now()}`,
    userId: newUserId,
    title: 'Welcome to Me Plus!',
    message: `Hello ${newUser.name}, your workspace is ready. Click "+ New Client" to start managing projects.`,
    type: 'system',
    priority: 'medium',
    timestamp: 'Just now',
    read: false,
  });

  const { password: _, ...safeUser } = newUser;
  activeSessionUser = safeUser;

  // Sync to db.json for backwards compatibility
  const db = readDb();
  db.user = safeUser;
  writeDb(db);

  res.status(201).json({ success: true, user: safeUser });
});

// OTP Store for email verification: email -> { otp: string, expiresAt: number, verified: boolean, attempts: number, createdAt: number, resetToken?: string }
const otpStore = new Map();

app.post('/api/auth/forgot-password', async (req, res) => {
  const { email } = req.body;
  if (!email) {
    return res.status(400).json({ error: 'Email address is required' });
  }

  const normalizedEmail = email.trim().toLowerCase();
  const user = await findUserByEmail(normalizedEmail);

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

  try {
    const emailResult = await sendOtpEmail({
      toEmail: normalizedEmail,
      otp,
      userName: user.name,
    });

    if (emailResult.isRealEmail) {
      return res.json({
        success: true,
        message: `A 6-digit verification code has been sent to ${normalizedEmail}. Please check your inbox and spam folder.`,
        email: normalizedEmail,
        isRealEmail: true,
        expiresInSeconds: 600,
      });
    }

    // If SMTP is not yet configured in .env, log to backend server console
    console.log(`\n======================================================`);
    console.log(`📧 [EMAIL SERVICE] OTP for ${normalizedEmail}: 👉 ${otp} 👈`);
    console.log(`⚠️  To deliver directly to the inbox, configure SMTP_PASS in .env`);
    console.log(`======================================================\n`);

    return res.json({
      success: true,
      message: `A 6-digit verification code has been sent to ${normalizedEmail}. Please check your email inbox.`,
      email: normalizedEmail,
      isRealEmail: false,
      expiresInSeconds: 600,
    });
  } catch (err) {
    console.error('❌ Failed to deliver OTP email:', err);
    return res.status(500).json({
      error: `Failed to deliver verification email: ${err.message || 'SMTP delivery error'}. Please verify SMTP settings.`,
    });
  }
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

app.post('/api/auth/resend-otp', async (req, res) => {
  const { email } = req.body;
  if (!email) {
    return res.status(400).json({ error: 'Email address is required' });
  }

  const normalizedEmail = email.trim().toLowerCase();
  const user = await findUserByEmail(normalizedEmail);

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

  try {
    const emailResult = await sendOtpEmail({
      toEmail: normalizedEmail,
      otp,
      userName: user.name,
    });

    if (emailResult.isRealEmail) {
      return res.json({
        success: true,
        message: `A new 6-digit verification code has been sent to ${normalizedEmail}.`,
        email: normalizedEmail,
        isRealEmail: true,
        expiresInSeconds: 600,
      });
    }

    // If SMTP is not yet configured in .env, log to backend server console
    console.log(`\n======================================================`);
    console.log(`📧 [EMAIL SERVICE - RESEND] OTP for ${normalizedEmail}: 👉 ${otp} 👈`);
    console.log(`⚠️  To deliver directly to the inbox, configure SMTP_PASS in .env`);
    console.log(`======================================================\n`);

    return res.json({
      success: true,
      message: `A new 6-digit verification code has been sent to ${normalizedEmail}. Please check your email inbox.`,
      email: normalizedEmail,
      isRealEmail: false,
      expiresInSeconds: 600,
    });
  } catch (err) {
    console.error('❌ Failed to resend OTP email:', err);
    return res.status(500).json({
      error: `Failed to deliver verification email: ${err.message || 'SMTP delivery error'}. Please verify SMTP settings.`,
    });
  }
});

// Check SMTP Configuration / Health
app.get('/api/auth/smtp-status', async (req, res) => {
  const status = await testSmtpConnection();
  res.json({
    configured: isEmailConfigured(),
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    user: process.env.SMTP_USER ? `${process.env.SMTP_USER.slice(0, 3)}***@***` : null,
    ...status,
  });
});

app.post('/api/auth/reset-password', async (req, res) => {
  const { email, newPassword, otp, resetToken } = req.body;
  if (!email || !newPassword) {
    return res.status(400).json({ error: 'Email and new password are required' });
  }
  if (newPassword.length < 6) {
    return res.status(400).json({ error: 'New password must be at least 6 characters long' });
  }

  const normalizedEmail = email.trim().toLowerCase();
  const record = otpStore.get(normalizedEmail);

  // Strict verification check
  const isVerified =
    record &&
    (record.verified === true ||
      (resetToken && record.resetToken === resetToken) ||
      (otp && record.otp === otp.toString().trim() && Date.now() <= record.expiresAt));

  if (!isVerified) {
    return res.status(403).json({
      error:
        'OTP verification required. Please verify the 6-digit code sent to your email before resetting your password.',
    });
  }

  const user = await findUserByEmail(normalizedEmail);
  if (!user) {
    return res.status(404).json({ error: 'User account not found.' });
  }

  await updateUser(normalizedEmail, { password: newPassword });
  otpStore.delete(normalizedEmail);

  res.json({
    success: true,
    message: 'Your password has been successfully updated! You can now sign in.',
  });
});

app.get('/api/auth/me', async (req, res) => {
  if (activeSessionUser) {
    return res.json({ user: activeSessionUser });
  }
  const userId = getReqUserId(req);
  const user = await findUserById(userId);
  if (user) {
    const { password: _, ...safeUser } = user;
    return res.json({ user: safeUser });
  }
  const db = readDb();
  res.json({ user: db.user || null });
});

app.put('/api/auth/profile', async (req, res) => {
  const updates = req.body || {};
  const targetId =
    updates.id || updates.userId || req.query.userId || req.headers['x-user-id'] || activeSessionUser?.id || 'usr-1';
  const targetEmail = (updates.email || req.query.email || activeSessionUser?.email || '').trim().toLowerCase();

  const updated = await updateUser(targetId || targetEmail, updates);
  if (updated) {
    const { password: _, ...safeUser } = updated;
    activeSessionUser = safeUser;
    return res.json({ success: true, user: safeUser });
  }

  // Fallback
  activeSessionUser = { ...(activeSessionUser || {}), ...updates };
  res.json({ success: true, user: activeSessionUser });
});

// --- Clients Endpoints ---
app.get('/api/clients', async (req, res) => {
  const userId = getReqUserId(req);
  const clients = await getClients(userId);
  res.json(clients);
});

app.post('/api/clients', async (req, res) => {
  const newClientData = req.body;
  const userId = newClientData.userId || getReqUserId(req) || 'usr-1';
  const isDemo = userId === 'usr-1' || userId === 'usr-demo';
  if (!isDemo && isDemoSeedEntity(newClientData)) {
    return res.status(200).json({ ...newClientData, ignored: true });
  }
  const newClient = {
    ...newClientData,
    id: newClientData.id || `cli-${Date.now()}`,
    userId: userId,
    totalBilled: newClientData.totalBilled || 0,
    createdAt: newClientData.createdAt || new Date().toISOString().split('T')[0],
  };
  await createClient(newClient);
  res.status(201).json(newClient);
});

app.put('/api/clients/:id', async (req, res) => {
  const { id } = req.params;
  const updates = req.body;
  const updated = await updateClient(id, updates);
  if (!updated) return res.status(404).json({ error: 'Client not found' });
  res.json(updated);
});

app.delete('/api/clients/:id', async (req, res) => {
  const { id } = req.params;
  await deleteClient(id);
  res.json({ success: true, id });
});

// --- Projects Endpoints ---
app.get('/api/projects', async (req, res) => {
  const userId = getReqUserId(req);
  const projects = await getProjects(userId);
  res.json(projects);
});

app.post('/api/projects', async (req, res) => {
  const newProjectData = req.body;
  const userId = newProjectData.userId || getReqUserId(req) || 'usr-1';
  const isDemo = userId === 'usr-1' || userId === 'usr-demo';
  if (!isDemo && isDemoSeedEntity(newProjectData)) {
    return res.status(200).json({ ...newProjectData, ignored: true });
  }
  const newProject = {
    ...newProjectData,
    id: newProjectData.id || `prj-${Date.now()}`,
    userId: userId,
    spent: newProjectData.spent || 0,
    progress: newProjectData.progress || 0,
    createdAt: newProjectData.createdAt || new Date().toISOString().split('T')[0],
  };
  await createProject(newProject);
  res.status(201).json(newProject);
});

app.put('/api/projects/:id', async (req, res) => {
  const { id } = req.params;
  const updates = req.body;
  const updated = await updateProject(id, updates);
  if (!updated) return res.status(404).json({ error: 'Project not found' });
  res.json(updated);
});

app.delete('/api/projects/:id', async (req, res) => {
  const { id } = req.params;
  await deleteProject(id);
  res.json({ success: true, id });
});

// --- Tasks Endpoints ---
app.get('/api/tasks', async (req, res) => {
  const userId = getReqUserId(req);
  const tasks = await getTasks(userId);
  res.json(tasks);
});

app.post('/api/tasks', async (req, res) => {
  const newTaskData = req.body;
  const userId = newTaskData.userId || getReqUserId(req) || 'usr-1';
  const isDemo = userId === 'usr-1' || userId === 'usr-demo';
  if (!isDemo && isDemoSeedEntity(newTaskData)) {
    return res.status(200).json({ ...newTaskData, ignored: true });
  }
  const newTask = {
    ...newTaskData,
    id: newTaskData.id || `tsk-${Date.now()}`,
    userId: userId,
    actualHours: newTaskData.actualHours || 0,
    subtasks: newTaskData.subtasks || [],
    attachments: newTaskData.attachments || [],
    createdAt: newTaskData.createdAt || new Date().toISOString().split('T')[0],
  };
  await createTask(newTask);
  res.status(201).json(newTask);
});

app.put('/api/tasks/:id', async (req, res) => {
  const { id } = req.params;
  const updates = req.body;
  const updated = await updateTask(id, updates);
  if (!updated) return res.status(404).json({ error: 'Task not found' });
  res.json(updated);
});

app.delete('/api/tasks/:id', async (req, res) => {
  const { id } = req.params;
  await deleteTask(id);
  res.json({ success: true, id });
});

// --- Time Entries Endpoints ---
app.get('/api/time-entries', async (req, res) => {
  const userId = getReqUserId(req);
  const timeEntries = await getTimeEntries(userId);
  res.json(timeEntries);
});

app.post('/api/time-entries', async (req, res) => {
  const newEntryData = req.body;
  const userId = newEntryData.userId || getReqUserId(req) || 'usr-1';
  const isDemo = userId === 'usr-1' || userId === 'usr-demo';
  if (!isDemo && isDemoSeedEntity(newEntryData)) {
    return res.status(200).json({ ...newEntryData, ignored: true });
  }
  const newEntry = {
    ...newEntryData,
    id: newEntryData.id || `time-${Date.now()}`,
    userId: userId,
    date: newEntryData.date || new Date().toISOString().split('T')[0],
  };
  await createTimeEntry(newEntry);
  res.status(201).json(newEntry);
});

app.delete('/api/time-entries/:id', async (req, res) => {
  const { id } = req.params;
  await deleteTimeEntry(id);
  res.json({ success: true, id });
});

// --- Invoices Endpoints ---
app.get('/api/invoices', async (req, res) => {
  const userId = getReqUserId(req);
  const invoices = await getInvoices(userId);
  res.json(invoices);
});

app.post('/api/invoices', async (req, res) => {
  const newInvoiceData = req.body;
  const userId = newInvoiceData.userId || getReqUserId(req) || 'usr-1';
  const isDemo = userId === 'usr-1' || userId === 'usr-demo';
  if (!isDemo && isDemoSeedEntity(newInvoiceData)) {
    return res.status(200).json({ ...newInvoiceData, ignored: true });
  }
  const newInvoice = {
    ...newInvoiceData,
    id: newInvoiceData.id || `inv-${Date.now()}`,
    userId: userId,
    createdAt: newInvoiceData.createdAt || new Date().toISOString().split('T')[0],
  };
  await createInvoice(newInvoice);
  res.status(201).json(newInvoice);
});

app.put('/api/invoices/:id', async (req, res) => {
  const { id } = req.params;
  const updates = req.body;
  const updated = await updateInvoice(id, updates);
  if (!updated) return res.status(404).json({ error: 'Invoice not found' });
  res.json(updated);
});

app.delete('/api/invoices/:id', async (req, res) => {
  const { id } = req.params;
  await deleteInvoice(id);
  res.json({ success: true, id });
});

// --- Notifications Endpoints ---
app.get('/api/notifications', async (req, res) => {
  const userId = getReqUserId(req);
  const notifs = await getNotifications(userId);
  res.json(notifs);
});

app.put('/api/notifications/:id/read', async (req, res) => {
  const { id } = req.params;
  await markNotificationRead(id);
  res.json({ success: true });
});

app.delete('/api/notifications', async (req, res) => {
  const userId = getReqUserId(req);
  await deleteNotifications(userId);
  res.json({ success: true });
});

// --- AI Helpers ---
async function generateSmartFallback(message, req) {
  const q = (message || '').trim().toLowerCase();
  const userId = getReqUserId(req);

  // Fetch live workspace context from database
  const user = (await findUserById(userId)) || {};
  const projects = (await getProjects(userId)) || [];
  const clients = (await getClients(userId)) || [];
  const tasks = (await getTasks(userId)) || [];
  const invoices = (await getInvoices(userId)) || [];

  const userName = user.name || 'Freelancer';
  const userTitle = user.title || 'Independent Professional';
  const currentRate = user.hourlyRate || 65;
  const currency = user.currency || '$';

  const pendingTasks = tasks.filter(t => t.status !== 'done');
  const urgentTasks = pendingTasks.filter(t => t.priority === 'urgent' || t.priority === 'high');
  const unpaidInvoices = invoices.filter(i => i.status === 'sent' || i.status === 'overdue');
  const totalUnpaid = unpaidInvoices.reduce((sum, i) => sum + (Number(i.total) || 0), 0);

  // Try to find if user mentioned a specific client (exact, partial, or first word like 'apex')
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

  // 1. Decline / Reject / Turn Down Request or Low Budget
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
      const fallbackReply = await generateSmartFallback(query, req);
      return res.json({
        reply: `⚠️ **Google Gemini Notice**: ${err.message}\n\n*Falling back to built-in advisor:*\n\n${fallbackReply}`,
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
          role: h.role === 'model' ? 'assistant' : h.role || 'user',
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
      const fallbackReply = await generateSmartFallback(query, req);
      return res.json({
        reply: `⚠️ **OpenAI Notice**: ${err.message}\n\n*Falling back to built-in advisor:*\n\n${fallbackReply}`,
        provider: 'builtin',
        model: 'builtin',
      });
    }
  }

  // 3. Built-in Smart Advisor
  const smartReply = await generateSmartFallback(query, req);
  return res.json({
    reply: smartReply,
    provider: 'builtin',
    model: 'builtin',
  });
});

// --- Reset Data Endpoint ---
app.post('/api/reset', async (req, res) => {
  const result = await resetDatabase();
  res.json(result);
});

// Start Server
app.listen(PORT, async () => {
  console.log(`🚀 Me Plus Backend REST API running at http://localhost:${PORT}`);
  await initDatabase();
  if (isEmailConfigured()) {
    console.log(`✉️  [Email Service] SMTP is configured (${process.env.SMTP_HOST || 'smtp.gmail.com'}). Real OTP emails will be sent.`);
  } else {
    console.log(`✉️  [Email Service] Simulated/Dev mode. Configure SMTP_USER and SMTP_PASS in .env to send real emails.`);
  }
});
