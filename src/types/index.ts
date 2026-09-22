export type PriorityLevel = 'low' | 'medium' | 'high' | 'urgent';

export type TaskStatus = 'todo' | 'in-progress' | 'review' | 'done';

export type ProjectStatus = 'planning' | 'in-progress' | 'in-review' | 'completed' | 'archived';

export type ClientStatus = 'active' | 'inactive' | 'lead';

export type InvoiceStatus = 'draft' | 'sent' | 'paid' | 'overdue';

export type AccentColor = 'emerald' | 'rose' | 'blue' | 'purple' | 'amber';

export interface IdleSettings {
  enabled: boolean;
  timeoutMinutes: number; // e.g. 1, 2, 5, 10 (default 2)
  style: 'zen' | 'clock' | 'particles';
}

export type AiProvider = 'builtin' | 'gemini' | 'openai';

export interface AiSettings {
  provider: AiProvider;
  geminiApiKey?: string;
  geminiModel?: string; // e.g. 'gemini-1.5-flash' | 'gemini-2.0-flash' | 'gemini-1.5-pro'
  openaiApiKey?: string;
  openaiModel?: string; // e.g. 'gpt-4o-mini' | 'gpt-4o' | 'gpt-3.5-turbo'
  customInstructions?: string;
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  avatar: string;
  title: string;
  hourlyRate: number;
  currency: string;
  bio: string;
  skills: string[];
  notificationSettings: {
    email: boolean;
    sms: boolean;
    browser: boolean;
    sound: boolean;
    deadlineReminderHours: number;
  };
  theme: 'light' | 'dark' | 'system';
  accentColor?: AccentColor;
  idleSettings?: IdleSettings;
  aiSettings?: AiSettings;
}

export interface Client {
  id: string;
  userId?: string;
  name: string;
  company: string;
  email: string;
  phone: string;
  avatar?: string;
  color: string;
  status: ClientStatus;
  hourlyRate: number;
  currency: string;
  totalBilled: number;
  notes: string;
  address?: string;
  website?: string;
  createdAt: string;
}

export interface Project {
  id: string;
  userId?: string;
  clientId: string;
  title: string;
  description: string;
  status: ProjectStatus;
  priority: PriorityLevel;
  budget: number;
  spent: number;
  startDate: string;
  deadline: string;
  progress: number; // 0 - 100
  tags: string[];
  createdAt: string;
  completedAt?: string;
}

export interface SubTask {
  id: string;
  title: string;
  completed: boolean;
}

export interface TaskAttachment {
  id: string;
  name: string;
  size: string;
  type: string;
  uploadedAt: string;
}

export interface Task {
  id: string;
  userId?: string;
  projectId: string;
  clientId: string;
  title: string;
  description: string;
  status: TaskStatus;
  priority: PriorityLevel;
  dueDate: string;
  estimatedHours: number;
  actualHours: number;
  subtasks: SubTask[];
  tags: string[];
  attachments: TaskAttachment[];
  createdAt: string;
  completedAt?: string;
}

export interface TimeEntry {
  id: string;
  userId?: string;
  projectId: string;
  taskId?: string;
  clientId: string;
  description: string;
  durationSeconds: number;
  startTime: string;
  endTime?: string;
  isBillable: boolean;
  hourlyRate: number;
  isBilled: boolean;
  date: string;
}

export interface InvoiceItem {
  id: string;
  description: string;
  quantity: number;
  rate: number;
  amount: number;
}

export interface Invoice {
  id: string;
  userId?: string;
  invoiceNumber: string;
  clientId: string;
  projectId?: string;
  issueDate: string;
  dueDate: string;
  status: InvoiceStatus;
  items: InvoiceItem[];
  subtotal: number;
  taxRate: number;
  taxAmount: number;
  discount: number;
  total: number;
  currency: string;
  notes?: string;
  clientName: string;
  clientCompany: string;
  clientEmail: string;
  createdAt: string;
}

export interface AppNotification {
  id: string;
  userId?: string;
  title: string;
  message: string;
  type: 'deadline' | 'project' | 'invoice' | 'system' | 'reminder' | 'client';
  priority: PriorityLevel;
  timestamp: string;
  read: boolean;
  relatedId?: string;
  relatedType?: 'task' | 'project' | 'client' | 'invoice';
}

export interface ActiveTimer {
  isRunning: boolean;
  projectId: string;
  taskId?: string;
  clientId: string;
  description: string;
  startTime: number;
  elapsedSeconds: number;
}

export interface ConfirmationModalState {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  danger?: boolean;
  itemType?: 'client' | 'project' | 'task' | 'invoice' | 'time' | 'chat' | 'general' | 'logout';
  onConfirm: () => void | Promise<void>;
  onCancel?: () => void;
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'ai';
  text: string;
  timestamp: string;
  provider?: AiProvider;
  model?: string;
}

export interface AiModelInfo {
  id: string;
  name: string;
  provider: AiProvider;
  description: string;
  tag?: string;
  badgeColor?: string;
}


