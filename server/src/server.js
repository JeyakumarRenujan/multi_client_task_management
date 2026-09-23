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
  sendUrgentWorkEmail,
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
    avatar: 'https://api.dicebear.com/7.x/adventurer/svg?seed=Alex&backgroundColor=b6e3f4',
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

app.post('/api/notifications/send-email-alert', async (req, res) => {
  try {
    const userId = getReqUserId(req);
    const user = (await findUserById(userId)) || {};
    const {
      toEmail,
      userName,
      alertType = 'urgent_task',
      task,
      urgentCount = 1,
      summary,
    } = req.body || {};

    const targetEmail = (toEmail || user.email || activeSessionUser?.email || '').trim().toLowerCase();
    if (!targetEmail) {
      return res.status(400).json({ error: 'No recipient email found' });
    }

    const result = await sendUrgentWorkEmail({
      toEmail: targetEmail,
      userName: userName || user.name || activeSessionUser?.name || 'Freelancer',
      alertType,
      task,
      urgentCount,
      summary,
    });

    res.json({
      success: true,
      deliveredTo: targetEmail,
      isRealEmail: result.isRealEmail,
      messageId: result.messageId,
    });
  } catch (err) {
    console.error('Failed to send email alert:', err);
    res.status(500).json({ error: err.message || 'Failed to dispatch email alert' });
  }
});

// --- AI Helpers (Me Plus App Guide & Platform Assistant) ---
async function generateSmartFallback(message, req) {
  const q = (message || '').trim().toLowerCase();
  const userId = getReqUserId(req);

  // Fetch live workspace metrics for context
  const user = (await findUserById(userId)) || {};
  const projects = (await getProjects(userId)) || [];
  const clients = (await getClients(userId)) || [];
  const tasks = (await getTasks(userId)) || [];
  const invoices = (await getInvoices(userId)) || [];

  const userName = user.name || 'Freelancer';
  const currency = user.currency || '$';
  const hourlyRate = user.hourlyRate || 65;

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

  // 4. Invoices & Billing Guide
  if (/\b(invoice|invoices|bill|billing|tax|download\s*invoice|pdf|create\s*invoice|unpaid)\b/i.test(q)) {
    const unpaid = invoices.filter(i => i.status === 'sent' || i.status === 'overdue');
    return `### 💵 How to Create & Export Invoices in Me Plus

You have **${invoices.length} total invoice(s)** (${unpaid.length} currently unpaid).

#### 📌 Step-by-Step: Creating an Invoice
1. Go to **"Invoices"** in the sidebar.
2. Click the green **"+ Create Invoice"** button.
3. Select your **Client** — their email and address will auto-populate.
4. Add line items:
   • Click **"+ Add Item"**
   • Enter the task/milestone description, quantity/hours, and rate per hour.
5. Set the **Issue Date**, **Payment Due Date**, and optional **Tax Rate** (e.g. 5% or 10%).
6. Choose the initial status (\`Draft\`, \`Sent\`, or \`Paid\`).
7. Click **"Generate Invoice"**.

💡 **Exporting & Sharing:** Click on any invoice in your list to view the branded preview, download it, or change its status to \`Paid\` when your client transfers funds!`;
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

// Export Express App for Vercel Serverless Function & Testing
export { app };
export default app;

// Start Server only if running standalone / locally (not inside Vercel Serverless Function)
if (!process.env.VERCEL && !process.env.AWS_LAMBDA_FUNCTION_NAME) {
  app.listen(PORT, async () => {
    console.log(`🚀 Me Plus Backend REST API running at http://localhost:${PORT}`);
    await initDatabase();
    if (isEmailConfigured()) {
      console.log(`✉️  [Email Service] SMTP is configured (${process.env.SMTP_HOST || 'smtp.gmail.com'}). Real OTP emails will be sent.`);
    } else {
      console.log(`✉️  [Email Service] Simulated/Dev mode. Configure SMTP_USER and SMTP_PASS in .env to send real emails.`);
    }
  });
}
