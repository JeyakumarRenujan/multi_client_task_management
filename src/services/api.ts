import {
  UserProfile,
  Client,
  Project,
  Task,
  TimeEntry,
  Invoice,
  AppNotification,
} from '../types';

const API_BASE = '/api';

async function fetchJson<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${url}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(options?.headers || {}),
    },
    ...options,
  });

  if (!res.ok) {
    const errorBody = await res.json().catch(() => ({}));
    throw new Error(errorBody.error || `Request failed with status ${res.status}`);
  }

  return res.json();
}

export const api = {
  // Health
  checkHealth: () => fetchJson<{ status: string }>('/health'),

  // Auth
  login: (email: string, password?: string) =>
    fetchJson<{ success: boolean; user: UserProfile }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),

  sendRegistrationOtp: (email: string, name?: string) =>
    fetchJson<{
      success: boolean;
      message: string;
      email: string;
      otpPreview?: string;
      isRealEmail?: boolean;
      expiresInSeconds?: number;
    }>('/auth/send-registration-otp', {
      method: 'POST',
      body: JSON.stringify({ email, name }),
    }),

  register: (name: string, email: string, password?: string, profession?: string, otp?: string) =>
    fetchJson<{ success: boolean; user: UserProfile }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ name, email, password, profession, otp }),
    }),

  forgotPassword: (email: string) =>
    fetchJson<{
      success: boolean;
      message: string;
      email: string;
      otpPreview?: string;
      isRealEmail?: boolean;
      expiresInSeconds?: number;
    }>('/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email }),
    }),

  verifyOtp: (email: string, otp: string) =>
    fetchJson<{ success: boolean; message: string; email: string; resetToken?: string }>('/auth/verify-otp', {
      method: 'POST',
      body: JSON.stringify({ email, otp }),
    }),

  resendOtp: (email: string) =>
    fetchJson<{
      success: boolean;
      message: string;
      email: string;
      otpPreview?: string;
      isRealEmail?: boolean;
      expiresInSeconds?: number;
    }>('/auth/resend-otp', {
      method: 'POST',
      body: JSON.stringify({ email }),
    }),

  getSmtpStatus: () =>
    fetchJson<{
      configured: boolean;
      host: string;
      user: string | null;
      connected?: boolean;
      error?: string;
      message?: string;
    }>('/auth/smtp-status'),

  resetPassword: (email: string, newPassword: string, otp?: string, resetToken?: string) =>
    fetchJson<{ success: boolean; message: string }>('/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify({ email, newPassword, otp, resetToken }),
    }),

  getCurrentUser: () => fetchJson<{ user: UserProfile | null }>('/auth/me'),

  updateProfile: (profile: Partial<UserProfile>, userId?: string) =>
    fetchJson<{ success: boolean; user: UserProfile }>(
      userId ? `/auth/profile?userId=${encodeURIComponent(userId)}` : '/auth/profile',
      {
        method: 'PUT',
        body: JSON.stringify({ ...profile, userId }),
      }
    ),

  // Clients
  getClients: (userId?: string) =>
    fetchJson<Client[]>(userId ? `/clients?userId=${encodeURIComponent(userId)}` : '/clients'),
  createClient: (client: Omit<Client, 'id' | 'createdAt' | 'totalBilled'>) =>
    fetchJson<Client>('/clients', {
      method: 'POST',
      body: JSON.stringify(client),
    }),
  updateClient: (id: string, updates: Partial<Client>) =>
    fetchJson<Client>(`/clients/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    }),
  deleteClient: (id: string) =>
    fetchJson<{ success: boolean; id: string }>(`/clients/${id}`, {
      method: 'DELETE',
    }),

  // Projects
  getProjects: (userId?: string) =>
    fetchJson<Project[]>(userId ? `/projects?userId=${encodeURIComponent(userId)}` : '/projects'),
  createProject: (project: Omit<Project, 'id' | 'createdAt' | 'spent' | 'progress'>) =>
    fetchJson<Project>('/projects', {
      method: 'POST',
      body: JSON.stringify(project),
    }),
  updateProject: (id: string, updates: Partial<Project>) =>
    fetchJson<Project>(`/projects/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    }),
  deleteProject: (id: string) =>
    fetchJson<{ success: boolean; id: string }>(`/projects/${id}`, {
      method: 'DELETE',
    }),

  // Tasks
  getTasks: (userId?: string) =>
    fetchJson<Task[]>(userId ? `/tasks?userId=${encodeURIComponent(userId)}` : '/tasks'),
  createTask: (task: Omit<Task, 'id' | 'createdAt' | 'actualHours'>) =>
    fetchJson<Task>('/tasks', {
      method: 'POST',
      body: JSON.stringify(task),
    }),
  updateTask: (id: string, updates: Partial<Task>) =>
    fetchJson<Task>(`/tasks/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    }),
  deleteTask: (id: string) =>
    fetchJson<{ success: boolean; id: string }>(`/tasks/${id}`, {
      method: 'DELETE',
    }),

  // Time Entries
  getTimeEntries: (userId?: string) =>
    fetchJson<TimeEntry[]>(userId ? `/time-entries?userId=${encodeURIComponent(userId)}` : '/time-entries'),
  createTimeEntry: (entry: Omit<TimeEntry, 'id'>) =>
    fetchJson<TimeEntry>('/time-entries', {
      method: 'POST',
      body: JSON.stringify(entry),
    }),
  deleteTimeEntry: (id: string) =>
    fetchJson<{ success: boolean; id: string }>(`/time-entries/${id}`, {
      method: 'DELETE',
    }),

  // Invoices
  getInvoices: (userId?: string) =>
    fetchJson<Invoice[]>(userId ? `/invoices?userId=${encodeURIComponent(userId)}` : '/invoices'),
  createInvoice: (invoice: Omit<Invoice, 'id' | 'createdAt'>) =>
    fetchJson<Invoice>('/invoices', {
      method: 'POST',
      body: JSON.stringify(invoice),
    }),
  updateInvoice: (id: string, updates: Partial<Invoice>) =>
    fetchJson<Invoice>(`/invoices/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    }),
  deleteInvoice: (id: string) =>
    fetchJson<{ success: boolean; id: string }>(`/invoices/${id}`, {
      method: 'DELETE',
    }),

  // Notifications
  getNotifications: (userId?: string) =>
    fetchJson<AppNotification[]>(userId ? `/notifications?userId=${encodeURIComponent(userId)}` : '/notifications'),
  markNotificationRead: (id: string) =>
    fetchJson<{ success: boolean }>(`/notifications/${id}/read`, {
      method: 'PUT',
    }),
  clearNotifications: () =>
    fetchJson<{ success: boolean }>('/notifications', {
      method: 'DELETE',
    }),
  sendEmailAlert: (data: {
    toEmail?: string;
    userName?: string;
    alertType?: string;
    reminderStage?: string;
    hoursRemaining?: number;
    task?: {
      id?: string;
      title: string;
      projectName?: string;
      clientName?: string;
      dueDate?: string;
      dueTime?: string;
      priority?: string;
      status?: string;
    };
    urgentCount?: number;
    summary?: string;
    userId?: string;
  }) =>
    fetchJson<{ success: boolean; deliveredTo: string; isRealEmail: boolean; messageId?: string }>(
      '/notifications/send-email-alert',
      {
        method: 'POST',
        body: JSON.stringify(data),
      }
    ),
  checkDeadlines: () =>
    fetchJson<{
      success: boolean;
      scannedTasks: number;
      dispatchedAlerts: Array<{
        taskId: string;
        taskTitle: string;
        stage: string;
        targetEmail: string;
        emailSent: boolean;
        dueDisplay: string;
      }>;
      skipped: number;
    }>('/notifications/check-deadlines', {
      method: 'POST',
    }),
  getSchedulerStatus: () =>
    fetchJson<{
      isRunning: boolean;
      lastScanTime: string | null;
      stats: { totalScans: number; lastAlertCount: number; totalAlertsDispatched: number };
      smtpConfigured: boolean;
    }>('/notifications/scheduler-status'),

  // AI Chat & Multi-Provider Connection
  sendAiMessage: (
    message: string,
    options?: {
      history?: { role: 'user' | 'model' | 'assistant'; content: string }[];
      provider?: 'builtin' | 'gemini' | 'openai';
      apiKey?: string;
      model?: string;
      workspaceContext?: string;
      customInstructions?: string;
      userId?: string;
    }
  ) =>
    fetchJson<{ reply: string; provider?: string; model?: string }>('/ai/chat', {
      method: 'POST',
      body: JSON.stringify({ message, ...options }),
    }),

  testAiConnection: (options: {
    provider: 'gemini' | 'openai';
    apiKey: string;
    model?: string;
  }) =>
    fetchJson<{ success: boolean; message: string; latencyMs?: number }>('/ai/test-connection', {
      method: 'POST',
      body: JSON.stringify(options),
    }),

  // Reset Data
  resetData: () => fetchJson<{ success: boolean }>('/reset', { method: 'POST' }),
};
