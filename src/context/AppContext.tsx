import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import confetti from 'canvas-confetti';
import {
  UserProfile,
  Client,
  Project,
  Task,
  TaskStatus,
  TimeEntry,
  Invoice,
  InvoiceStatus,
  AppNotification,
  ActiveTimer,
  ConfirmationModalState,
} from '../types';
import {
  initialUser,
  initialClients,
  initialProjects,
  initialTasks,
  initialTimeEntries,
  initialInvoices,
  initialNotifications,
} from '../data/initialData';
import { api } from '../services/api';
import { playNotificationTone } from '../services/soundService';
import { useDeadlineScheduler, parseTaskDeadline } from '../hooks/useDeadlineScheduler';

export interface ToastMessage {
  id: string;
  title: string;
  message: string;
  type: 'success' | 'info' | 'warning' | 'error';
  undoAction?: () => void;
  undoLabel?: string;
  duration?: number;
}

interface AppContextType {
  // Navigation & Active View
  activeTab: string;
  setActiveTab: (tab: string) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  highlightedClientId: string | null;
  setHighlightedClientId: (id: string | null) => void;

  // Auth & User
  user: UserProfile | null;
  isAuthenticated: boolean;
  login: (email: string, password?: string) => Promise<{ success: boolean; error?: string }>;
  register: (name: string, email: string, password: string, profession?: string) => Promise<{ success: boolean; error?: string }>;
  forgotPassword: (email: string) => Promise<{ success: boolean; error?: string; message?: string; otpPreview?: string; isRealEmail?: boolean; expiresInSeconds?: number }>;
  verifyOtp: (email: string, otp: string) => Promise<{ success: boolean; error?: string; message?: string; resetToken?: string }>;
  resendOtp: (email: string) => Promise<{ success: boolean; error?: string; message?: string; otpPreview?: string; isRealEmail?: boolean; expiresInSeconds?: number }>;
  resetPassword: (email: string, newPassword: string, otp?: string, resetToken?: string) => Promise<{ success: boolean; error?: string; message?: string }>;
  loginDemoUser: () => void;
  resetDemoData: () => void;
  logout: () => void;
  updateUserProfile: (profile: Partial<UserProfile>, options?: { silent?: boolean }) => void;

  // Clients
  clients: Client[];
  addClient: (client: Omit<Client, 'id' | 'createdAt' | 'totalBilled'>) => Client;
  updateClient: (id: string, updates: Partial<Client>) => void;
  deleteClient: (id: string) => void;
  getClientById: (id: string) => Client | undefined;

  // Projects
  projects: Project[];
  addProject: (project: Omit<Project, 'id' | 'createdAt' | 'spent' | 'progress'>) => Project;
  updateProject: (id: string, updates: Partial<Project>) => void;
  deleteProject: (id: string) => void;
  archiveProject: (id: string) => void;
  restoreProject: (id: string) => void;
  getProjectById: (id: string) => Project | undefined;

  // Tasks
  tasks: Task[];
  addTask: (task: Omit<Task, 'id' | 'createdAt' | 'actualHours'>) => Task;
  updateTask: (id: string, updates: Partial<Task>) => void;
  deleteTask: (id: string) => void;
  moveTaskStatus: (id: string, newStatus: TaskStatus) => void;
  toggleSubtask: (taskId: string, subtaskId: string) => void;
  getTaskById: (id: string) => Task | undefined;

  // Time Tracker
  activeTimer: ActiveTimer;
  startTimer: (projectId: string, clientId: string, taskId?: string, description?: string) => void;
  pauseTimer: () => void;
  resumeTimer: () => void;
  stopTimer: () => void;
  resetTimer: () => void;
  updateTimerDescription: (desc: string) => void;
  timeEntries: TimeEntry[];
  addTimeEntry: (entry: Omit<TimeEntry, 'id'>, prevActiveTimer?: ActiveTimer) => void;
  deleteTimeEntry: (id: string) => void;

  // Invoices
  invoices: Invoice[];
  addInvoice: (invoice: Omit<Invoice, 'id' | 'createdAt'>) => Invoice;
  updateInvoice: (id: string, updates: Partial<Invoice>) => void;
  deleteInvoice: (id: string) => void;
  updateInvoiceStatus: (id: string, status: InvoiceStatus) => void;

  // Notifications
  notifications: AppNotification[];
  unreadNotificationsCount: number;
  markNotificationAsRead: (id: string) => void;
  markAllNotificationsAsRead: () => void;
  addNotification: (notif: Omit<AppNotification, 'id' | 'timestamp' | 'read'>) => void;
  clearAllNotifications: () => void;
  sendUrgentEmailAlert: (
    task?: Partial<Task>,
    reason?: string,
    options?: { stage?: '24h' | 'imminent' | 'overdue' | 'urgent_task'; hoursRemaining?: number }
  ) => Promise<boolean>;
  checkAllDeadlinesNow: () => Promise<{ scanned: number; alertsDispatched: number }>;
  lastDeadlineScanTime: Date | null;

  // Toast Alerts
  toasts: ToastMessage[];
  showToast: (toast: Omit<ToastMessage, 'id'>) => void;
  dismissToast: (id: string) => void;

  // Global Dialogs & Modals
  isCommandPaletteOpen: boolean;
  setIsCommandPaletteOpen: (open: boolean) => void;
  isAiModalOpen: boolean;
  setIsAiModalOpen: (open: boolean) => void;
  isClientModalOpen: boolean;
  setIsClientModalOpen: (open: boolean) => void;
  selectedClientForEdit: Client | null;
  setSelectedClientForEdit: (client: Client | null) => void;
  isProjectModalOpen: boolean;
  setIsProjectModalOpen: (open: boolean) => void;
  selectedProjectForEdit: Project | null;
  setSelectedProjectForEdit: (project: Project | null) => void;
  isTaskModalOpen: boolean;
  setIsTaskModalOpen: (open: boolean) => void;
  selectedTaskForEdit: Task | null;
  setSelectedTaskForEdit: (task: Task | null) => void;
  isInvoiceModalOpen: boolean;
  setIsInvoiceModalOpen: (open: boolean) => void;
  selectedInvoiceForEdit: Invoice | null;
  setSelectedInvoiceForEdit: (invoice: Invoice | null) => void;
  isTimeLogModalOpen: boolean;
  setIsTimeLogModalOpen: (open: boolean) => void;

  // Confirmation Dialog
  confirmModal: ConfirmationModalState;
  confirmAction: (options: Omit<ConfirmationModalState, 'isOpen'>) => void;
  closeConfirmModal: () => void;

  // Data Reset / Export / Import
  resetAllDataToDemo: () => void;
  exportDataAsJson: () => void;
  importDataFromJson: (jsonData: string) => boolean;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const STORAGE_KEYS = {
  USER: 'meplus_user_v1',
  USERS: 'meplus_registered_users_v1',
  ACTIVE_TIMER: 'meplus_active_timer_v1',
  CLIENTS_PREFIX: 'meplus_clients_user_',
  PROJECTS_PREFIX: 'meplus_projects_user_',
  TASKS_PREFIX: 'meplus_tasks_user_',
  TIME_PREFIX: 'meplus_time_user_',
  INVOICES_PREFIX: 'meplus_invoices_user_',
  NOTIFS_PREFIX: 'meplus_notifs_user_',
};

interface RegisteredAccount {
  id: string;
  name: string;
  email: string;
  password?: string;
  title?: string;
  avatar?: string;
  hourlyRate?: number;
  currency?: string;
  bio?: string;
}

export function getDeterministicUserId(email: string): string {
  const norm = (email || '').trim().toLowerCase();
  if (!norm) return 'usr-1';
  if (norm === 'demo@meplus.io' || norm === 'usr-demo') return 'usr-demo';
  if (norm === 'alex.rivera@gmail.com' || norm === 'usr-1') return 'usr-1';
  return `usr_${norm.replace(/[^a-z0-9]/g, '_')}`;
}

const defaultRegisteredUsers: RegisteredAccount[] = [
  {
    id: 'usr-1',
    name: 'Alex Rivera',
    email: 'alex.rivera@gmail.com',
    password: 'password123',
    title: 'Senior UI/UX & Full-Stack Freelancer',
    avatar: 'https://api.dicebear.com/7.x/adventurer/svg?seed=Alex&backgroundColor=b6e3f4',
    hourlyRate: 75,
    currency: '$',
    bio: 'Specialized in building modern web apps, design systems, and responsive digital interfaces for startups and enterprises.',
  },
  {
    id: 'usr-demo',
    name: 'Alex Rivera',
    email: 'demo@meplus.io',
    password: 'password123',
    title: 'Senior UI/UX & Full-Stack Freelancer',
    avatar: 'https://api.dicebear.com/7.x/adventurer/svg?seed=Alex&backgroundColor=b6e3f4',
    hourlyRate: 65,
    currency: '$',
    bio: 'Specialized in building modern web interfaces, digital branding, and UI systems.',
  },
];

function isDemoAccount(u: UserProfile | null | undefined): boolean {
  if (!u) return false;
  return u.id === 'usr-1' || u.id === 'usr-demo' || u.email === 'alex.rivera@gmail.com' || u.email === 'demo@meplus.io';
}

function safeGetStorage<T>(key: string, fallback: T): T {
  try {
    const saved = localStorage.getItem(key);
    if (!saved) return fallback;
    return JSON.parse(saved);
  } catch (e) {
    console.warn(`Error parsing localStorage for ${key}`, e);
    return fallback;
  }
}

const DEMO_PROJECT_TITLES = new Set([
  'nova design system & e-commerce landing',
  'fintech pulse analytics & crypto dashboard',
  'pulse financial analytics dashboard',
  'eduverse interactive lms gamification',
  'eduverse interactive student portal',
  'apex iot telemetry real-time portal',
  'nova studio brand identity guidelines pdf',
]);

const DEMO_CLIENT_NAMES = new Set([
  'sarah jenkins',
  'marcus vance',
  'elena rostova',
  'david kim',
  'clara oswald',
  'nova brand studio',
  'fintech pulse corp',
  'eduverse learning',
  'apex robotics & iot',
  'biohealth solutions',
  'nova studio',
  'fintech pulse',
]);

const DEMO_CLIENT_EMAILS = new Set([
  'sarah.j@novastudio.design',
  'sarah.j@gmail.com',
  'mvance@fintechpulse.io',
  'mvance@gmail.com',
  'elena@eduverse.org',
  'elena@gmail.com',
  'david.kim@apexrobotics.io',
  'clara.o@biohealth.co',
]);

const DEMO_INVOICE_NUMBERS = new Set([
  'inv-2026-001',
  'inv-2026-002',
  'inv-2026-003',
  'inv-2026-004',
  'inv-2026-005',
  'inv-2026-006',
]);

const DEMO_IDS = new Set([
  'cli-1', 'cli-2', 'cli-3', 'cli-4', 'cli-5',
  'prj-1', 'prj-2', 'prj-3', 'prj-4', 'prj-5',
  'tsk-1', 'tsk-2', 'tsk-3', 'tsk-4', 'tsk-5', 'tsk-6', 'tsk-7', 'tsk-8',
  'inv-101', 'inv-102', 'inv-103', 'inv-1', 'inv-2', 'inv-3',
  'time-1', 'time-2', 'time-3', 'time-4',
  'notif-1', 'notif-2', 'notif-3', 'notif-4',
]);

export function isDemoSeedEntity(item: any): boolean {
  if (!item) return false;
  if (item.userId === 'usr-1' || item.userId === 'usr-demo') return true;

  if (typeof item.id === 'string') {
    const idLower = item.id.toLowerCase();
    if (DEMO_IDS.has(idLower)) return true;
    if (idLower.startsWith('cli-') && idLower.length <= 6) return true;
    if (idLower.startsWith('prj-') && idLower.length <= 6) return true;
    if (idLower.startsWith('tsk-') && !idLower.includes('tsk-1788') && idLower.length <= 8) return true;
    if (idLower.startsWith('inv-') && (idLower.length <= 8 || idLower.startsWith('inv-10'))) return true;
    if (idLower.startsWith('time-') && (idLower.length <= 8 || idLower.startsWith('time-10'))) return true;
    if (idLower.startsWith('notif-') && idLower.length <= 8) return true;
  }

  if (item.invoiceNumber && DEMO_INVOICE_NUMBERS.has(item.invoiceNumber.trim().toLowerCase())) return true;

  if (item.clientName && DEMO_CLIENT_NAMES.has(item.clientName.trim().toLowerCase())) return true;
  if (item.clientCompany && DEMO_CLIENT_NAMES.has(item.clientCompany.trim().toLowerCase())) return true;
  if (item.clientEmail && DEMO_CLIENT_EMAILS.has(item.clientEmail.trim().toLowerCase())) return true;

  if (item.name && DEMO_CLIENT_NAMES.has(item.name.trim().toLowerCase())) return true;
  if (item.company && DEMO_CLIENT_NAMES.has(item.company.trim().toLowerCase())) return true;
  if (item.email && DEMO_CLIENT_EMAILS.has(item.email.trim().toLowerCase())) return true;

  if (item.clientId && ['cli-1', 'cli-2', 'cli-3', 'cli-4', 'cli-5'].includes(item.clientId)) return true;
  if (item.projectId && ['prj-1', 'prj-2', 'prj-3', 'prj-4', 'prj-5'].includes(item.projectId)) return true;

  if (item.title) {
    const t = item.title.trim().toLowerCase();
    if (DEMO_PROJECT_TITLES.has(t)) return true;
    if (
      t.includes('nova design system') ||
      t.includes('pulse financial') ||
      t.includes('fintech pulse') ||
      t.includes('eduverse interactive') ||
      t.includes('apex iot telemetry') ||
      t.includes('nova studio brand') ||
      t.includes('websocket reconnect') ||
      t.includes('refactor checkout cart') ||
      t.includes('mobile navigation drawer') ||
      t.includes('audit high-contrast theme') ||
      t.includes('quiz component') ||
      t.includes('interactive quiz') ||
      t.includes('iot telemetry dashboard') ||
      t.includes('svg icon sprite') ||
      t.includes('two-factor auth') ||
      t.includes('dark theme contrast') ||
      t.includes('interactive checkout form') ||
      t.includes('hero illustration')
    ) {
      return true;
    }
  }

  if (item.description) {
    const d = item.description.trim().toLowerCase();
    if (
      d.includes('websocket reconnect') ||
      d.includes('promo code dynamic discount') ||
      d.includes('mobile gesture swipe drawer') ||
      d.includes('gamified student badge') ||
      d.includes('dark mode contrast on financial') ||
      d.includes('interactive checkout validation') ||
      d.includes('sprint planning and milestone alignment')
    ) {
      return true;
    }
  }

  return false;
}

function getSavedUserDataWithMigration<T>(prefix: string, currentUser: UserProfile | null, fallback: T): T {
  if (!currentUser) return fallback;
  const isDemo = isDemoAccount(currentUser);
  const directKey = `${prefix}${currentUser.id}`;
  const directSaved = localStorage.getItem(directKey);

  if (directSaved) {
    try {
      const parsed = JSON.parse(directSaved);
      if (Array.isArray(parsed)) {
        if (!isDemo) {
          // Strictly remove any demo items
          const cleaned = parsed.filter(item => !isDemoSeedEntity(item));
          if (cleaned.length !== parsed.length) {
            localStorage.setItem(directKey, JSON.stringify(cleaned));
          }
          return cleaned as T;
        }
        return parsed as T;
      }
      if (parsed) return parsed as T;
    } catch {
      // continue to legacy check
    }
  }

  // Scan localStorage for any legacy key belonging to this NON-DEMO user
  if (!isDemo) {
    try {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (
          key &&
          key.startsWith(prefix) &&
          key !== directKey &&
          !key.endsWith('usr-1') &&
          !key.endsWith('usr-demo')
        ) {
          const val = localStorage.getItem(key);
          if (val) {
            const parsed = JSON.parse(val);
            if (Array.isArray(parsed) && parsed.length > 0) {
              const cleaned = parsed.filter(item => !isDemoSeedEntity(item));
              if (cleaned.length > 0) {
                localStorage.setItem(directKey, JSON.stringify(cleaned));
                return cleaned as T;
              }
            }
          }
        }
      }
    } catch {
      // ignore
    }
  }

  return fallback;
}

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Navigation State
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [highlightedClientId, setHighlightedClientId] = useState<string | null>(null);

  // Registered Users Directory
  const [registeredUsers, setRegisteredUsers] = useState<RegisteredAccount[]>(() => {
    return safeGetStorage<RegisteredAccount[]>(STORAGE_KEYS.USERS, defaultRegisteredUsers);
  });

  // User & Auth State
  const [user, setUser] = useState<UserProfile | null>(() => {
    const u = safeGetStorage<UserProfile | null>(STORAGE_KEYS.USER, null);
    if (u && u.email) {
      const deterministicId = getDeterministicUserId(u.email);
      const backupAvatar =
        safeGetStorage<string | null>(`meplus_avatar_${deterministicId}`, null) ||
        safeGetStorage<string | null>(`meplus_avatar_${u.id}`, null) ||
        safeGetStorage<string | null>(`meplus_avatar_${u.email.toLowerCase()}`, null);
      return {
        ...u,
        id: deterministicId,
        avatar: backupAvatar || u.avatar || initialUser.avatar,
      };
    }
    return u;
  });

  // Per-User Collections Initializers
  const [clients, setClients] = useState<Client[]>(() => {
    const initial = safeGetStorage<UserProfile | null>(STORAGE_KEYS.USER, null);
    if (!initial) return [];
    if (isDemoAccount(initial)) {
      return safeGetStorage<Client[]>(`${STORAGE_KEYS.CLIENTS_PREFIX}${initial.id}`, initialClients);
    }
    return getSavedUserDataWithMigration<Client[]>(STORAGE_KEYS.CLIENTS_PREFIX, initial, []);
  });

  const [projects, setProjects] = useState<Project[]>(() => {
    const initial = safeGetStorage<UserProfile | null>(STORAGE_KEYS.USER, null);
    if (!initial) return [];
    if (isDemoAccount(initial)) {
      return safeGetStorage<Project[]>(`${STORAGE_KEYS.PROJECTS_PREFIX}${initial.id}`, initialProjects);
    }
    return getSavedUserDataWithMigration<Project[]>(STORAGE_KEYS.PROJECTS_PREFIX, initial, []);
  });

  const [tasks, setTasks] = useState<Task[]>(() => {
    const initial = safeGetStorage<UserProfile | null>(STORAGE_KEYS.USER, null);
    if (!initial) return [];
    if (isDemoAccount(initial)) {
      return safeGetStorage<Task[]>(`${STORAGE_KEYS.TASKS_PREFIX}${initial.id}`, initialTasks);
    }
    return getSavedUserDataWithMigration<Task[]>(STORAGE_KEYS.TASKS_PREFIX, initial, []);
  });

  const [timeEntries, setTimeEntries] = useState<TimeEntry[]>(() => {
    const initial = safeGetStorage<UserProfile | null>(STORAGE_KEYS.USER, null);
    if (!initial) return [];
    if (isDemoAccount(initial)) {
      return safeGetStorage<TimeEntry[]>(`${STORAGE_KEYS.TIME_PREFIX}${initial.id}`, initialTimeEntries);
    }
    return getSavedUserDataWithMigration<TimeEntry[]>(STORAGE_KEYS.TIME_PREFIX, initial, []);
  });

  const [invoices, setInvoices] = useState<Invoice[]>(() => {
    const initial = safeGetStorage<UserProfile | null>(STORAGE_KEYS.USER, null);
    if (!initial) return [];
    if (isDemoAccount(initial)) {
      return safeGetStorage<Invoice[]>(`${STORAGE_KEYS.INVOICES_PREFIX}${initial.id}`, initialInvoices);
    }
    return getSavedUserDataWithMigration<Invoice[]>(STORAGE_KEYS.INVOICES_PREFIX, initial, []);
  });

  const [notifications, setNotifications] = useState<AppNotification[]>(() => {
    const initial = safeGetStorage<UserProfile | null>(STORAGE_KEYS.USER, null);
    if (!initial) return [];
    if (isDemoAccount(initial)) {
      return safeGetStorage<AppNotification[]>(`${STORAGE_KEYS.NOTIFS_PREFIX}${initial.id}`, initialNotifications);
    }
    const defaultWelcomeNotif: AppNotification[] = [
      {
        id: `notif-welcome-${initial.id}`,
        userId: initial.id,
        title: 'Welcome to Me Plus!',
        message: `Hello ${initial.name}, your workspace is ready. Click "+ New Client" to start managing projects.`,
        type: 'system',
        priority: 'medium',
        timestamp: 'Just now',
        read: false,
      },
    ];
    return getSavedUserDataWithMigration<AppNotification[]>(STORAGE_KEYS.NOTIFS_PREFIX, initial, defaultWelcomeNotif);
  });

  // Active Stopwatch Timer
  const [activeTimer, setActiveTimer] = useState<ActiveTimer>(() => {
    return safeGetStorage<ActiveTimer>(STORAGE_KEYS.ACTIVE_TIMER, {
      isRunning: false,
      projectId: '',
      taskId: '',
      clientId: '',
      description: '',
      startTime: 0,
      elapsedSeconds: 0,
    });
  });

  // Toasts
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  // Modals & Dialogs
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [isAiModalOpen, setIsAiModalOpen] = useState(false);
  const [isClientModalOpen, setIsClientModalOpen] = useState(false);
  const [selectedClientForEdit, setSelectedClientForEdit] = useState<Client | null>(null);
  const [isProjectModalOpen, setIsProjectModalOpen] = useState(false);
  const [selectedProjectForEdit, setSelectedProjectForEdit] = useState<Project | null>(null);
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [selectedTaskForEdit, setSelectedTaskForEdit] = useState<Task | null>(null);
  const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false);
  const [selectedInvoiceForEdit, setSelectedInvoiceForEdit] = useState<Invoice | null>(null);
  const [isTimeLogModalOpen, setIsTimeLogModalOpen] = useState(false);

  // Global Confirmation Dialog State
  const [confirmModal, setConfirmModal] = useState<ConfirmationModalState>({
    isOpen: false,
    title: '',
    message: '',
    confirmText: 'Delete',
    cancelText: 'Cancel',
    danger: true,
    itemType: 'general',
    onConfirm: () => {},
  });

  const confirmAction = useCallback((options: Omit<ConfirmationModalState, 'isOpen'>) => {
    setConfirmModal({
      isOpen: true,
      title: options.title,
      message: options.message,
      confirmText: options.confirmText || 'Delete',
      cancelText: options.cancelText || 'Cancel',
      danger: options.danger !== false,
      itemType: options.itemType || 'general',
      onConfirm: options.onConfirm,
      onCancel: options.onCancel,
    });
  }, []);

  const closeConfirmModal = useCallback(() => {
    setConfirmModal(prev => {
      if (prev.onCancel) {
        try {
          prev.onCancel();
        } catch (err) {
          console.error('Error in onCancel callback:', err);
        }
      }
      return { ...prev, isOpen: false };
    });
  }, []);

  // Load and sync isolated data when active user changes
  const loadUserData = useCallback((currentUser: UserProfile | null) => {
    if (!currentUser) {
      setClients([]);
      setProjects([]);
      setTasks([]);
      setTimeEntries([]);
      setInvoices([]);
      setNotifications([]);
      return;
    }

    const isDemo = isDemoAccount(currentUser);

    // Initial local storage read for immediate rendering
    const localClients = getSavedUserDataWithMigration<Client[]>(
      STORAGE_KEYS.CLIENTS_PREFIX,
      currentUser,
      isDemo ? initialClients : []
    );
    const localProjects = getSavedUserDataWithMigration<Project[]>(
      STORAGE_KEYS.PROJECTS_PREFIX,
      currentUser,
      isDemo ? initialProjects : []
    );
    const localTasks = getSavedUserDataWithMigration<Task[]>(
      STORAGE_KEYS.TASKS_PREFIX,
      currentUser,
      isDemo ? initialTasks : []
    );
    const localTime = getSavedUserDataWithMigration<TimeEntry[]>(
      STORAGE_KEYS.TIME_PREFIX,
      currentUser,
      isDemo ? initialTimeEntries : []
    );
    const localInvoices = getSavedUserDataWithMigration<Invoice[]>(
      STORAGE_KEYS.INVOICES_PREFIX,
      currentUser,
      isDemo ? initialInvoices : []
    );
    const defaultWelcomeNotif: AppNotification[] = [
      {
        id: `notif-welcome-${currentUser.id}`,
        userId: currentUser.id,
        title: 'Welcome to Me Plus!',
        message: `Hello ${currentUser.name}, your workspace is ready. Click "+ New Client" to start managing projects.`,
        type: 'system',
        priority: 'medium',
        timestamp: 'Just now',
        read: false,
      },
    ];
    const localNotifs = getSavedUserDataWithMigration<AppNotification[]>(
      STORAGE_KEYS.NOTIFS_PREFIX,
      currentUser,
      isDemo ? initialNotifications : defaultWelcomeNotif
    );

    setClients(localClients);
    setProjects(localProjects);
    setTasks(localTasks);
    setTimeEntries(localTime);
    setInvoices(localInvoices);
    setNotifications(localNotifs);

    // Sync from Backend REST API for this specific user with Two-Way Merge
    Promise.all([
      api.getClients(currentUser.id).catch(() => null),
      api.getProjects(currentUser.id).catch(() => null),
      api.getTasks(currentUser.id).catch(() => null),
      api.getTimeEntries(currentUser.id).catch(() => null),
      api.getInvoices(currentUser.id).catch(() => null),
      api.getNotifications(currentUser.id).catch(() => null),
    ]).then(([apiClients, apiProjects, apiTasks, apiTime, apiInvoices, apiNotifs]) => {
      if (apiClients !== null) {
        setClients(prev => {
          const map = new Map<string, Client>();
          prev.filter(c => isDemo || !isDemoSeedEntity(c)).forEach(c => map.set(c.id, { ...c, userId: currentUser.id }));
          apiClients.filter(c => isDemo || !isDemoSeedEntity(c)).forEach(c => map.set(c.id, { ...c, userId: currentUser.id }));
          const merged = Array.from(map.values());
          if (!isDemo) {
            localStorage.setItem(`${STORAGE_KEYS.CLIENTS_PREFIX}${currentUser.id}`, JSON.stringify(merged));
          }
          // Sync local-only items to backend
          prev.forEach(item => {
            if ((isDemo || !isDemoSeedEntity(item)) && !apiClients.some(ac => ac.id === item.id)) {
              api.createClient({ ...item, userId: currentUser.id }).catch(() => {});
            }
          });
          return merged;
        });
      }
      if (apiProjects !== null) {
        setProjects(prev => {
          const map = new Map<string, Project>();
          prev.filter(p => isDemo || !isDemoSeedEntity(p)).forEach(p => map.set(p.id, { ...p, userId: currentUser.id }));
          apiProjects.filter(p => isDemo || !isDemoSeedEntity(p)).forEach(p => map.set(p.id, { ...p, userId: currentUser.id }));
          const merged = Array.from(map.values());
          if (!isDemo) {
            localStorage.setItem(`${STORAGE_KEYS.PROJECTS_PREFIX}${currentUser.id}`, JSON.stringify(merged));
          }
          prev.forEach(item => {
            if ((isDemo || !isDemoSeedEntity(item)) && !apiProjects.some(ap => ap.id === item.id)) {
              api.createProject({ ...item, userId: currentUser.id }).catch(() => {});
            }
          });
          return merged;
        });
      }
      if (apiTasks !== null) {
        setTasks(prev => {
          const map = new Map<string, Task>();
          prev.filter(t => isDemo || !isDemoSeedEntity(t)).forEach(t => map.set(t.id, { ...t, userId: currentUser.id }));
          apiTasks.filter(t => isDemo || !isDemoSeedEntity(t)).forEach(t => map.set(t.id, { ...t, userId: currentUser.id }));
          const merged = Array.from(map.values());
          if (!isDemo) {
            localStorage.setItem(`${STORAGE_KEYS.TASKS_PREFIX}${currentUser.id}`, JSON.stringify(merged));
          }
          prev.forEach(item => {
            if ((isDemo || !isDemoSeedEntity(item)) && !apiTasks.some(at => at.id === item.id)) {
              api.createTask({ ...item, userId: currentUser.id }).catch(() => {});
            }
          });
          return merged;
        });
      }
      if (apiTime !== null) {
        setTimeEntries(prev => {
          const map = new Map<string, TimeEntry>();
          prev.filter(t => isDemo || !isDemoSeedEntity(t)).forEach(t => map.set(t.id, { ...t, userId: currentUser.id }));
          apiTime.filter(t => isDemo || !isDemoSeedEntity(t)).forEach(t => map.set(t.id, { ...t, userId: currentUser.id }));
          const merged = Array.from(map.values());
          if (!isDemo) {
            localStorage.setItem(`${STORAGE_KEYS.TIME_PREFIX}${currentUser.id}`, JSON.stringify(merged));
          }
          prev.forEach(item => {
            if ((isDemo || !isDemoSeedEntity(item)) && !apiTime.some(at => at.id === item.id)) {
              api.createTimeEntry({ ...item, userId: currentUser.id }).catch(() => {});
            }
          });
          return merged;
        });
      }
      if (apiInvoices !== null) {
        setInvoices(prev => {
          const map = new Map<string, Invoice>();
          prev.filter(i => isDemo || !isDemoSeedEntity(i)).forEach(i => map.set(i.id, { ...i, userId: currentUser.id }));
          apiInvoices.filter(i => isDemo || !isDemoSeedEntity(i)).forEach(i => map.set(i.id, { ...i, userId: currentUser.id }));
          const merged = Array.from(map.values());
          if (!isDemo) {
            localStorage.setItem(`${STORAGE_KEYS.INVOICES_PREFIX}${currentUser.id}`, JSON.stringify(merged));
          }
          prev.forEach(item => {
            if ((isDemo || !isDemoSeedEntity(item)) && !apiInvoices.some(ai => ai.id === item.id)) {
              api.createInvoice({ ...item, userId: currentUser.id }).catch(() => {});
            }
          });
          return merged;
        });
      }
      if (apiNotifs !== null) {
        if (apiNotifs.length > 0) setNotifications(apiNotifs);
        else if (!isDemo) setNotifications(defaultWelcomeNotif);
      }
    });
  }, []);

  // When user changes, load their isolated data and sanitize storage
  useEffect(() => {
    if (user) {
      localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));
      const isDemo = isDemoAccount(user);
      if (!isDemo) {
        // Sanitize all local storage keys for this user to purge old cached demo data
        const sanitizeKey = (key: string) => {
          try {
            const raw = localStorage.getItem(key);
            if (raw) {
              const parsed = JSON.parse(raw);
              if (Array.isArray(parsed)) {
                const cleaned = parsed.filter(item => !isDemoSeedEntity(item));
                localStorage.setItem(key, JSON.stringify(cleaned));
              }
            }
          } catch {}
        };
        sanitizeKey(`${STORAGE_KEYS.CLIENTS_PREFIX}${user.id}`);
        sanitizeKey(`${STORAGE_KEYS.PROJECTS_PREFIX}${user.id}`);
        sanitizeKey(`${STORAGE_KEYS.TASKS_PREFIX}${user.id}`);
        sanitizeKey(`${STORAGE_KEYS.TIME_PREFIX}${user.id}`);
        sanitizeKey(`${STORAGE_KEYS.INVOICES_PREFIX}${user.id}`);
      }
      loadUserData(user);
    } else {
      localStorage.removeItem(STORAGE_KEYS.USER);
      loadUserData(null);
    }
  }, [user?.id]);

  // Persist user collections to isolated local storage keys
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(registeredUsers));
  }, [registeredUsers]);

  useEffect(() => {
    if (user) {
      const isDemo = isDemoAccount(user);
      const dataToSave = isDemo ? clients : clients.filter(c => !isDemoSeedEntity(c));
      localStorage.setItem(`${STORAGE_KEYS.CLIENTS_PREFIX}${user.id}`, JSON.stringify(dataToSave));
    }
  }, [clients, user?.id]);

  useEffect(() => {
    if (user) {
      const isDemo = isDemoAccount(user);
      const dataToSave = isDemo ? projects : projects.filter(p => !isDemoSeedEntity(p));
      localStorage.setItem(`${STORAGE_KEYS.PROJECTS_PREFIX}${user.id}`, JSON.stringify(dataToSave));
    }
  }, [projects, user?.id]);

  useEffect(() => {
    if (user) {
      const isDemo = isDemoAccount(user);
      const dataToSave = isDemo ? tasks : tasks.filter(t => !isDemoSeedEntity(t));
      localStorage.setItem(`${STORAGE_KEYS.TASKS_PREFIX}${user.id}`, JSON.stringify(dataToSave));
    }
  }, [tasks, user?.id]);

  useEffect(() => {
    if (user) {
      const isDemo = isDemoAccount(user);
      const dataToSave = isDemo ? timeEntries : timeEntries.filter(t => !isDemoSeedEntity(t));
      localStorage.setItem(`${STORAGE_KEYS.TIME_PREFIX}${user.id}`, JSON.stringify(dataToSave));
    }
  }, [timeEntries, user?.id]);

  useEffect(() => {
    if (user) {
      const isDemo = isDemoAccount(user);
      const dataToSave = isDemo ? invoices : invoices.filter(i => !isDemoSeedEntity(i));
      localStorage.setItem(`${STORAGE_KEYS.INVOICES_PREFIX}${user.id}`, JSON.stringify(dataToSave));
    }
  }, [invoices, user?.id]);

  useEffect(() => {
    if (user) {
      localStorage.setItem(`${STORAGE_KEYS.NOTIFS_PREFIX}${user.id}`, JSON.stringify(notifications));
    }
  }, [notifications, user?.id]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.ACTIVE_TIMER, JSON.stringify(activeTimer));
  }, [activeTimer]);

  // Active Timer Tick Handler
  const timerIntervalRef = useRef<number | null>(null);
  useEffect(() => {
    if (activeTimer.isRunning) {
      timerIntervalRef.current = window.setInterval(() => {
        setActiveTimer(prev => ({
          ...prev,
          elapsedSeconds: prev.elapsedSeconds + 1,
        }));
      }, 1000);
    } else {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
        timerIntervalRef.current = null;
      }
    }
    return () => {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    };
  }, [activeTimer.isRunning]);

  // Global Keyboard Shortcuts (Ctrl+K for Command Palette, Esc to close)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsCommandPaletteOpen(prev => !prev);
      } else if (e.key === 'Escape') {
        setIsCommandPaletteOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Toast Manager
  const showToast = useCallback((toast: Omit<ToastMessage, 'id'>) => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`;
    const newToast: ToastMessage = { ...toast, id };
    setToasts(prev => [newToast, ...prev].slice(0, 5));

    const duration = toast.duration || 4500;
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, duration);
  }, []);

  const dismissToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  // Sound chime for high priority alerts
  const playAlertChime = useCallback(() => {
    if (!user?.notificationSettings?.sound) return;
    playNotificationTone('chime');
  }, [user]);

  const addNotification = useCallback((notif: Omit<AppNotification, 'id' | 'timestamp' | 'read'>) => {
    const newNotif: AppNotification = {
      ...notif,
      id: `notif-${Date.now()}`,
      userId: user?.id || 'usr-1',
      timestamp: new Date().toISOString(),
      read: false,
    };
    setNotifications(prev => [newNotif, ...prev]);

    if (notif.priority === 'urgent' || notif.priority === 'high') {
      playAlertChime();
    }
  }, [user, playAlertChime]);

  // Urgent Work Email Dispatcher (Delivers alerts to user's registered login email via SMTP)
  // Urgent Work & Multi-Stage Deadline Email Dispatcher
  const sendUrgentEmailAlert = useCallback(
    async (
      targetTask?: Partial<Task>,
      reason?: string,
      options?: { stage?: '24h' | 'imminent' | 'overdue' | 'urgent_task'; hoursRemaining?: number }
    ): Promise<boolean> => {
      const targetEmail = user?.email?.trim();
      if (!targetEmail) {
        showToast({
          title: 'Email Alert',
          message: 'No login email registered with your account.',
          type: 'warning',
        });
        return false;
      }

      const taskToAlert =
        targetTask ||
        tasks.find(t => t.priority === 'urgent' && t.status !== 'done') ||
        tasks.find(t => t.status !== 'done') ||
        tasks[0];

      const project = projects.find(p => p.id === taskToAlert?.projectId);
      const client = clients.find(c => c.id === taskToAlert?.clientId || c.id === project?.clientId);
      const urgentCount = tasks.filter(t => t.priority === 'urgent' && t.status !== 'done').length;
      const stage = options?.stage || 'urgent_task';

      try {
        const res = await api.sendEmailAlert({
          toEmail: targetEmail,
          userName: user?.name || 'Freelancer',
          alertType: `deadline_${stage}`,
          reminderStage: stage,
          hoursRemaining: options?.hoursRemaining,
          summary:
            reason ||
            (taskToAlert
              ? `Deliverable "${taskToAlert.title}" requires attention: ${stage.toUpperCase()}.`
              : 'Workspace deadlines and tasks are awaiting your attention.'),
          task: taskToAlert
            ? {
                id: taskToAlert.id,
                title: taskToAlert.title || 'Urgent Deliverable',
                projectName: project?.title || 'Active Project',
                clientName: client?.name || 'Valued Client',
                dueDate: taskToAlert.dueDate,
                dueTime: taskToAlert.dueTime,
                priority: taskToAlert.priority,
                status: taskToAlert.status,
              }
            : undefined,
          urgentCount: Math.max(1, urgentCount),
          userId: user?.id,
        });

        if (res?.success) {
          const stageBadge =
            stage === '24h'
              ? '📅 Tomorrow Alert'
              : stage === 'imminent'
              ? '⏰ Final Warning'
              : stage === 'overdue'
              ? '⚠️ Overdue Notice'
              : '🚨 Urgent Alert';
          showToast({
            title: `📨 ${stageBadge} Dispatched`,
            message: `Delivery sent to ${res.deliveredTo || targetEmail}. Check your inbox!`,
            type: 'success',
          });
          return true;
        }
        return false;
      } catch (err: any) {
        console.warn('Failed to send urgent email notification:', err);
        showToast({
          title: 'Alert Notice',
          message: 'Could not send email alert at this time.',
          type: 'warning',
        });
        return false;
      }
    },
    [user, tasks, projects, clients, showToast]
  );

  const maybeSendUrgentEmail = useCallback(
    (
      task: Task,
      reason?: string,
      stage: '24h' | 'imminent' | 'overdue' | 'urgent_task' = 'urgent_task',
      hoursRemaining?: number
    ) => {
      if (!user?.email) return;
      if (user.notificationSettings?.email === false) return;

      const sentStages = new Set(Array.isArray(task.reminderStagesSent) ? task.reminderStagesSent : []);
      if (stage !== 'urgent_task' && sentStages.has(stage)) {
        return; // Already sent this stage
      }

      const dedupKey = `meplus_last_alert_${user.id || 'usr'}_${task.id}_${stage}`;
      const lastSent = Number(localStorage.getItem(dedupKey) || 0);
      const now = Date.now();
      // 6-hour throttle for identical task & stage
      if (now - lastSent < 6 * 60 * 60 * 1000) {
        return;
      }
      localStorage.setItem(dedupKey, String(now));

      if (stage !== 'urgent_task') {
        sentStages.add(stage);
        const updatedStages = Array.from(sentStages);
        setTasks(prev => prev.map(t => (t.id === task.id ? { ...t, reminderStagesSent: updatedStages } : t)));
        api.updateTask(task.id, { reminderStagesSent: updatedStages }).catch(() => {});
      }

      sendUrgentEmailAlert(task, reason, { stage, hoursRemaining }).catch(() => {});
    },
    [user, sendUrgentEmailAlert]
  );

  // Update task reminder stages sent callback for useDeadlineScheduler
  const handleUpdateTaskSentStages = useCallback((taskId: string, stages: string[]) => {
    setTasks(prev => prev.map(t => (t.id === taskId ? { ...t, reminderStagesSent: stages } : t)));
    api.updateTask(taskId, { reminderStagesSent: stages }).catch(() => {});
  }, []);

  // Handle client-side deadline alert dispatch
  const handleDispatchDeadlineAlert = useCallback(
    async (task: Task, stage: '24h' | 'imminent' | 'overdue', hoursLeft?: number) => {
      const dueDisplay = `${task.dueDate}${task.dueTime ? ` at ${task.dueTime}` : ''}`;
      let notifTitle = '⏰ Approaching Task Deadline';
      let notifMessage = `Deliverable "${task.title}" requires attention. Due: ${dueDisplay}`;
      let notifPriority: 'urgent' | 'high' = 'high';

      if (stage === '24h') {
        notifTitle = '📅 Deadline Tomorrow!';
        notifMessage = `Deliverable "${task.title}" is due tomorrow (${dueDisplay}). Finish review today to stay on schedule.`;
        notifPriority = 'high';
      } else if (stage === 'imminent') {
        const hText = hoursLeft ? `${hoursLeft}h` : '1-2h';
        notifTitle = `🚨 Final Warning: Due in ${hText}!`;
        notifMessage = `Deliverable "${task.title}" is due in approximately ${hText} (${dueDisplay}). Finalize now!`;
        notifPriority = 'urgent';
      } else if (stage === 'overdue') {
        notifTitle = '⚠️ Overdue Deliverable Notice';
        notifMessage = `Deadline for "${task.title}" was ${dueDisplay} and is now overdue. Please submit or communicate extension.`;
        notifPriority = 'urgent';
      }

      addNotification({
        title: notifTitle,
        message: notifMessage,
        type: 'deadline',
        priority: notifPriority,
        relatedId: task.id,
        relatedType: 'task',
      });

      if (user?.notificationSettings?.email !== false) {
        return await sendUrgentEmailAlert(task, notifMessage, { stage, hoursRemaining: hoursLeft });
      }
      return true;
    },
    [user, addNotification, sendUrgentEmailAlert]
  );

  // Automated 60-Second Real-Time Deadline Scanner
  const { lastCheckTime: lastDeadlineScanTime, scanNow: runClientScan } = useDeadlineScheduler({
    user,
    tasks,
    onDispatchAlert: handleDispatchDeadlineAlert,
    onUpdateTaskSentStages: handleUpdateTaskSentStages,
  });

  const checkAllDeadlinesNow = useCallback(async () => {
    try {
      await runClientScan();
      const res = await api.checkDeadlines();
      if (res && res.success) {
        showToast({
          title: 'Deadline Scan Complete 🎯',
          message: `Scanned ${res.scannedTasks} tasks. ${
            res.dispatchedAlerts?.length > 0
              ? `Dispatched ${res.dispatchedAlerts.length} alert email(s)!`
              : 'All active deliverables are on schedule.'
          }`,
          type: res.dispatchedAlerts?.length > 0 ? 'warning' : 'success',
        });
        return {
          scanned: res.scannedTasks || 0,
          alertsDispatched: res.dispatchedAlerts?.length || 0,
        };
      }
    } catch (e: any) {
      console.warn('Manual deadline scan failed:', e);
      showToast({
        title: 'Scan Error',
        message: 'Could not connect to backend deadline scanner.',
        type: 'error',
      });
    }
    return { scanned: 0, alertsDispatched: 0 };
  }, [runClientScan, showToast]);

  // User Actions - Strict Authentication with Bidirectional Persistence Sync
  const login = async (email: string, password?: string): Promise<{ success: boolean; error?: string }> => {
    const normalizedEmail = (email || '').trim().toLowerCase();

    if (!normalizedEmail || !normalizedEmail.includes('@')) {
      return { success: false, error: 'Please enter a valid email address.' };
    }
    if (!password) {
      return { success: false, error: 'Please enter your password.' };
    }

    const deterministicId = getDeterministicUserId(normalizedEmail);

    // 1. Try backend REST API first
    try {
      const res = await api.login(normalizedEmail, password);
      if (res && res.user) {
        const backupAvatar =
          safeGetStorage<string | null>(`meplus_avatar_${deterministicId}`, null) ||
          safeGetStorage<string | null>(`meplus_avatar_${normalizedEmail}`, null);
        const authenticatedUser: UserProfile = {
          ...res.user,
          id: deterministicId,
          avatar: res.user.avatar || backupAvatar || initialUser.avatar,
        };
        setUser(authenticatedUser);
        localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(authenticatedUser));

        // Ensure user is synced in registeredUsers local directory with latest avatar and profile
        setRegisteredUsers(prev => {
          const exists = prev.some(u => u.email.toLowerCase() === normalizedEmail);
          let next: RegisteredAccount[];
          if (!exists) {
            next = [
              ...prev,
              {
                id: deterministicId,
                name: res.user.name,
                email: normalizedEmail,
                password,
                title: res.user.title,
                avatar: res.user.avatar || backupAvatar || initialUser.avatar,
                bio: res.user.bio,
                hourlyRate: res.user.hourlyRate,
                currency: res.user.currency,
              },
            ];
          } else {
            next = prev.map(u =>
              u.email.toLowerCase() === normalizedEmail
                ? {
                    ...u,
                    id: deterministicId,
                    name: res.user.name || u.name,
                    title: res.user.title || u.title,
                    avatar: res.user.avatar || backupAvatar || u.avatar || initialUser.avatar,
                    bio: res.user.bio ?? u.bio,
                    hourlyRate: res.user.hourlyRate ?? u.hourlyRate,
                    currency: res.user.currency ?? u.currency,
                  }
                : u
            );
          }
          localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(next));
          return next;
        });

        showToast({
          title: 'Welcome back!',
          message: `Signed in as ${res.user.name || res.user.email}`,
          type: 'success',
        });
        return { success: true };
      }
    } catch (err: any) {
      // If backend explicitly rejected due to wrong password for an account it has, return that error
      if (err?.message?.includes('password you entered is incorrect')) {
        return { success: false, error: err.message };
      }
      // If backend returned "no account registered" or network error, fall through to check local storage directory
    }

    // 2. Check local registered users directory (ensures persistence across browser sessions & Vercel deployment)
    const matched = registeredUsers.find(u => u.email.toLowerCase() === normalizedEmail);
    if (!matched) {
      return {
        success: false,
        error: 'Invalid credentials: No account is registered with this email. Please create an account first.',
      };
    }

    if (matched.password && matched.password !== password) {
      return {
        success: false,
        error: 'Invalid credentials: The password you entered is incorrect. Please check and try again.',
      };
    }

    // Seamless auto-sync to backend in background if backend was missing this user
    api.register(matched.name, matched.email, password, matched.title).catch(() => {});

    const backupAvatar =
      safeGetStorage<string | null>(`meplus_avatar_${deterministicId}`, null) ||
      safeGetStorage<string | null>(`meplus_avatar_${matched.email.toLowerCase()}`, null);

    const authenticatedUser: UserProfile = {
      id: deterministicId,
      name: matched.name,
      email: matched.email,
      avatar: matched.avatar || backupAvatar || initialUser.avatar,
      title: matched.title || initialUser.title,
      hourlyRate: matched.hourlyRate || 65,
      currency: matched.currency || '$',
      bio: matched.bio || initialUser.bio,
      skills: initialUser.skills,
      notificationSettings: initialUser.notificationSettings,
      theme: 'light',
    };

    setUser(authenticatedUser);
    localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(authenticatedUser));
    showToast({
      title: 'Welcome back!',
      message: `Signed in as ${authenticatedUser.name}`,
      type: 'success',
    });
    return { success: true };
  };

  const register = async (
    name: string,
    email: string,
    password: string,
    profession?: string
  ): Promise<{ success: boolean; error?: string }> => {
    const normalizedEmail = (email || '').trim().toLowerCase();

    if (!name || !name.trim()) {
      return { success: false, error: 'Please enter your full name.' };
    }
    if (!normalizedEmail || !normalizedEmail.includes('@')) {
      return { success: false, error: 'Please enter a valid email address.' };
    }
    if (!password || password.length < 6) {
      return { success: false, error: 'Password must be at least 6 characters long.' };
    }

    const deterministicId = getDeterministicUserId(normalizedEmail);

    // 1. Try backend REST API
    try {
      const res = await api.register(name.trim(), normalizedEmail, password, profession);
      if (res && res.user) {
        const authenticatedUser: UserProfile = {
          ...res.user,
          id: deterministicId,
        };
        setUser(authenticatedUser);
        setRegisteredUsers(prev => [
          ...prev.filter(u => u.email.toLowerCase() !== normalizedEmail),
          {
            id: deterministicId,
            name: res.user.name,
            email: normalizedEmail,
            password,
            title: res.user.title,
          },
        ]);
        showToast({
          title: 'Account Created!',
          message: `Welcome to Me Plus, ${name}! Your fresh workspace is ready.`,
          type: 'success',
        });
        return { success: true };
      }
    } catch (err: any) {
      if (err?.message?.includes('already exists')) {
        return { success: false, error: err.message };
      }
    }

    // Check duplicate in local directory if backend was offline
    const existsLocally = registeredUsers.some(u => u.email.toLowerCase() === normalizedEmail);
    if (existsLocally) {
      return {
        success: false,
        error: 'An account with this email address already exists. Please sign in instead.',
      };
    }

    // Local client registration fallback (e.g. for static/Vercel environments)
    const newUserAccount: RegisteredAccount = {
      id: deterministicId,
      name: name.trim(),
      email: normalizedEmail,
      password,
      title: profession || 'Independent Freelancer',
      avatar: initialUser.avatar,
    };

    setRegisteredUsers(prev => [...prev, newUserAccount]);

    const newUserProfile: UserProfile = {
      id: deterministicId,
      name: newUserAccount.name,
      email: newUserAccount.email,
      avatar: initialUser.avatar,
      title: newUserAccount.title || 'Independent Freelancer',
      hourlyRate: 65,
      currency: '$',
      bio: `Freelancer specializing in ${profession || 'creative and digital services'}.`,
      skills: initialUser.skills,
      notificationSettings: initialUser.notificationSettings,
      theme: 'light',
    };

    setUser(newUserProfile);
    showToast({
      title: 'Account Created!',
      message: `Welcome to Me Plus, ${name}! Your fresh workspace is ready.`,
      type: 'success',
    });
    return { success: true };
  };

  const forgotPassword = async (
    email: string
  ): Promise<{ success: boolean; error?: string; message?: string; otpPreview?: string; isRealEmail?: boolean; expiresInSeconds?: number }> => {
    const normalizedEmail = (email || '').trim().toLowerCase();

    if (!normalizedEmail || !normalizedEmail.includes('@')) {
      return { success: false, error: 'Please enter a valid email address.' };
    }

    try {
      const res = await api.forgotPassword(normalizedEmail);
      if (res && res.success) {
        return {
          success: true,
          message: res.message,
          otpPreview: res.otpPreview,
          isRealEmail: res.isRealEmail,
          expiresInSeconds: res.expiresInSeconds,
        };
      }
    } catch (err: any) {
      return { success: false, error: err?.message || 'No account found with this email address.' };
    }

    const found = registeredUsers.some(u => u.email.toLowerCase() === normalizedEmail);
    if (!found) {
      return {
        success: false,
        error: 'No registered account found with this email address. Please verify your email.',
      };
    }

    const dummyOtp = Math.floor(100000 + Math.random() * 900000).toString();
    return {
      success: true,
      message: `A 6-digit verification code has been sent to ${normalizedEmail}.`,
      otpPreview: dummyOtp,
      isRealEmail: false,
      expiresInSeconds: 600,
    };
  };

  const verifyOtp = async (
    email: string,
    otp: string
  ): Promise<{ success: boolean; error?: string; message?: string; resetToken?: string }> => {
    const normalizedEmail = (email || '').trim().toLowerCase();
    const cleanOtp = (otp || '').trim();

    if (!cleanOtp || cleanOtp.length !== 6) {
      return { success: false, error: 'Please enter a valid 6-digit verification code.' };
    }

    try {
      const res = await api.verifyOtp(normalizedEmail, cleanOtp);
      if (res && res.success) {
        return { success: true, message: res.message, resetToken: res.resetToken };
      }
    } catch (err: any) {
      return { success: false, error: err?.message || 'Invalid or expired verification code.' };
    }

    return {
      success: true,
      message: 'OTP verification successful! You can now set your new password.',
      resetToken: `rst_${Date.now()}`,
    };
  };

  const resendOtp = async (
    email: string
  ): Promise<{ success: boolean; error?: string; message?: string; otpPreview?: string; isRealEmail?: boolean; expiresInSeconds?: number }> => {
    const normalizedEmail = (email || '').trim().toLowerCase();
    try {
      const res = await api.resendOtp(normalizedEmail);
      return {
        success: true,
        message: res.message,
        otpPreview: res.otpPreview,
        isRealEmail: res.isRealEmail,
        expiresInSeconds: res.expiresInSeconds,
      };
    } catch (err: any) {
      return { success: false, error: err?.message || 'Failed to resend verification code.' };
    }
  };

  const resetPassword = async (
    email: string,
    newPassword: string,
    otp?: string,
    resetToken?: string
  ): Promise<{ success: boolean; error?: string; message?: string }> => {
    const normalizedEmail = (email || '').trim().toLowerCase();

    if (!newPassword || newPassword.length < 6) {
      return { success: false, error: 'Password must be at least 6 characters long.' };
    }

    try {
      await api.resetPassword(normalizedEmail, newPassword, otp, resetToken);
    } catch (err: any) {
      return { success: false, error: err?.message || 'Failed to update password.' };
    }

    setRegisteredUsers(prev =>
      prev.map(u => (u.email.toLowerCase() === normalizedEmail ? { ...u, password: newPassword } : u))
    );

    showToast({
      title: 'Password Updated',
      message: 'Your password has been changed. You can now sign in with your new password.',
      type: 'success',
    });

    return {
      success: true,
      message: 'Your password has been successfully updated! You can now sign in.',
    };
  };

  const resetDemoData = () => {
    try {
      localStorage.removeItem(`${STORAGE_KEYS.CLIENTS_PREFIX}usr-1`);
      localStorage.removeItem(`${STORAGE_KEYS.PROJECTS_PREFIX}usr-1`);
      localStorage.removeItem(`${STORAGE_KEYS.TASKS_PREFIX}usr-1`);
      localStorage.removeItem(`${STORAGE_KEYS.TIME_PREFIX}usr-1`);
      localStorage.removeItem(`${STORAGE_KEYS.INVOICES_PREFIX}usr-1`);
      localStorage.removeItem(`${STORAGE_KEYS.NOTIFS_PREFIX}usr-1`);
      localStorage.removeItem(`${STORAGE_KEYS.CLIENTS_PREFIX}usr-demo`);
      localStorage.removeItem(`${STORAGE_KEYS.PROJECTS_PREFIX}usr-demo`);
      localStorage.removeItem(`${STORAGE_KEYS.TASKS_PREFIX}usr-demo`);
      localStorage.removeItem(`${STORAGE_KEYS.TIME_PREFIX}usr-demo`);
      localStorage.removeItem(`${STORAGE_KEYS.INVOICES_PREFIX}usr-demo`);
      localStorage.removeItem(`${STORAGE_KEYS.NOTIFS_PREFIX}usr-demo`);
    } catch (e) {
      console.warn('Error clearing cached demo keys', e);
    }

    const backupAvatar =
      safeGetStorage<string | null>('meplus_avatar_usr-1', null) ||
      safeGetStorage<string | null>('meplus_avatar_alex.rivera@gmail.com', null);

    const resetUser: UserProfile = {
      ...initialUser,
      avatar: backupAvatar || initialUser.avatar,
    };

    setUser(resetUser);
    setClients(initialClients);
    setProjects(initialProjects);
    setTasks(initialTasks);
    setTimeEntries(initialTimeEntries);
    setInvoices(initialInvoices);
    setNotifications(initialNotifications);

    localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(resetUser));
    localStorage.setItem(`${STORAGE_KEYS.CLIENTS_PREFIX}usr-1`, JSON.stringify(initialClients));
    localStorage.setItem(`${STORAGE_KEYS.PROJECTS_PREFIX}usr-1`, JSON.stringify(initialProjects));
    localStorage.setItem(`${STORAGE_KEYS.TASKS_PREFIX}usr-1`, JSON.stringify(initialTasks));
    localStorage.setItem(`${STORAGE_KEYS.TIME_PREFIX}usr-1`, JSON.stringify(initialTimeEntries));
    localStorage.setItem(`${STORAGE_KEYS.INVOICES_PREFIX}usr-1`, JSON.stringify(initialInvoices));
    localStorage.setItem(`${STORAGE_KEYS.NOTIFS_PREFIX}usr-1`, JSON.stringify(initialNotifications));

    showToast({
      title: 'Sample Data Restored! 🚀',
      message: 'Restored fresh sample clients, projects, tasks, invoices & time logs.',
      type: 'success',
    });
  };

  const loginDemoUser = () => {
    const backupAvatar =
      safeGetStorage<string | null>('meplus_avatar_usr-1', null) ||
      safeGetStorage<string | null>('meplus_avatar_alex.rivera@gmail.com', null);
    const demoUserWithAvatar: UserProfile = {
      ...initialUser,
      avatar: backupAvatar || initialUser.avatar,
    };
    setUser(demoUserWithAvatar);
    localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(demoUserWithAvatar));
    loadUserData(demoUserWithAvatar);
    api.login(initialUser.email, 'password123').catch(() => {});
  };

  const logout = () => {
    if (user) {
      try {
        localStorage.setItem(`${STORAGE_KEYS.CLIENTS_PREFIX}${user.id}`, JSON.stringify(clients));
        localStorage.setItem(`${STORAGE_KEYS.PROJECTS_PREFIX}${user.id}`, JSON.stringify(projects));
        localStorage.setItem(`${STORAGE_KEYS.TASKS_PREFIX}${user.id}`, JSON.stringify(tasks));
        localStorage.setItem(`${STORAGE_KEYS.TIME_PREFIX}${user.id}`, JSON.stringify(timeEntries));
        localStorage.setItem(`${STORAGE_KEYS.INVOICES_PREFIX}${user.id}`, JSON.stringify(invoices));
        localStorage.setItem(`${STORAGE_KEYS.NOTIFS_PREFIX}${user.id}`, JSON.stringify(notifications));
      } catch (e) {
        console.warn('Error saving data on logout', e);
      }
    }
    resetTimer();
    setUser(null);
    showToast({
      title: 'Logged Out',
      message: 'You have safely signed out of Me Plus.',
      type: 'info',
    });
  };

  const updateUserProfile = (profile: Partial<UserProfile>, options?: { silent?: boolean }) => {
    if (!user) return;
    const updatedUser: UserProfile = { ...user, ...profile };
    setUser(updatedUser);
    localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(updatedUser));

    if (profile.avatar) {
      try {
        localStorage.setItem(`meplus_avatar_${user.id}`, profile.avatar);
        if (user.email) {
          localStorage.setItem(`meplus_avatar_${user.email.toLowerCase()}`, profile.avatar);
        }
      } catch (e) {
        console.warn('Could not cache backup avatar', e);
      }
    }

    // Update in registered users list so it persists across logouts and logins
    setRegisteredUsers(prev => {
      const next = prev.map(u => {
        if (
          u.id === user.id ||
          (u.email && user.email && u.email.toLowerCase() === user.email.toLowerCase())
        ) {
          return {
            ...u,
            ...profile,
            name: profile.name !== undefined ? profile.name : u.name,
            title: profile.title !== undefined ? profile.title : u.title,
            avatar: profile.avatar !== undefined ? profile.avatar : u.avatar,
            bio: profile.bio !== undefined ? profile.bio : u.bio,
            hourlyRate: profile.hourlyRate !== undefined ? profile.hourlyRate : u.hourlyRate,
            currency: profile.currency !== undefined ? profile.currency : u.currency,
          };
        }
        return u;
      });
      localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(next));
      return next;
    });

    api.updateProfile({ ...profile, id: user.id, email: user.email }, user.id).catch(err => {
      console.warn('Could not sync profile to backend:', err);
    });

    if (!options?.silent) {
      showToast({
        title: 'Profile Updated',
        message: 'Your personal settings and profile photo have been saved.',
        type: 'success',
      });
    }
  };

  // Client Actions
  const addClient = (newClientData: Omit<Client, 'id' | 'createdAt' | 'totalBilled'>) => {
    const activeUserId = user?.id || (user?.email ? getDeterministicUserId(user.email) : 'usr-1');
    const newClient: Client = {
      ...newClientData,
      id: `cli-${Date.now()}`,
      userId: activeUserId,
      createdAt: new Date().toISOString().split('T')[0],
      totalBilled: 0,
    };
    setClients(prev => {
      const next = [newClient, ...prev];
      if (user) {
        localStorage.setItem(`${STORAGE_KEYS.CLIENTS_PREFIX}${user.id}`, JSON.stringify(next));
      }
      return next;
    });
    api.createClient(newClient).catch(() => {});
    showToast({
      title: 'Client Added',
      message: `${newClient.name} (${newClient.company}) has been added.`,
      type: 'success',
      undoAction: () => {
        setClients(prev => prev.filter(c => c.id !== newClient.id));
        api.deleteClient(newClient.id).catch(() => {});
      },
      undoLabel: 'Undo',
    });
    return newClient;
  };

  const updateClient = (id: string, updates: Partial<Client>) => {
    setClients(prev => prev.map(c => (c.id === id ? { ...c, ...updates } : c)));
    api.updateClient(id, updates).catch(() => {});
    showToast({
      title: 'Client Updated',
      message: 'Client information has been updated.',
      type: 'success',
    });
  };

  const deleteClient = (id: string) => {
    const clientToDelete = clients.find(c => c.id === id);
    if (!clientToDelete) return;

    setClients(prev => prev.filter(c => c.id !== id));
    api.deleteClient(id).catch(() => {});
    showToast({
      title: 'Client Deleted',
      message: `${clientToDelete.name} was removed.`,
      type: 'warning',
      undoAction: () => {
        setClients(prev => [clientToDelete, ...prev]);
        api.createClient(clientToDelete).catch(() => {});
      },
      undoLabel: 'Restore Client',
    });
  };

  const getClientById = (id: string) => clients.find(c => c.id === id);

  // Project Actions & Recalculating Progress
  const recalculateProjectProgress = (projId: string, currentTasks: Task[]) => {
    const projTasks = currentTasks.filter(t => t.projectId === projId);
    if (projTasks.length === 0) return;
    const doneTasks = projTasks.filter(t => t.status === 'done').length;
    const progress = Math.round((doneTasks / projTasks.length) * 100);
    setProjects(prev =>
      prev.map(p => {
        if (p.id === projId) {
          const newStatus = progress === 100 ? 'completed' : p.status === 'completed' ? 'in-progress' : p.status;
          return { ...p, progress, status: newStatus };
        }
        return p;
      })
    );
  };

  const addProject = (projectData: Omit<Project, 'id' | 'createdAt' | 'spent' | 'progress'>) => {
    const activeUserId = user?.id || (user?.email ? getDeterministicUserId(user.email) : 'usr-1');
    const newProject: Project = {
      ...projectData,
      id: `prj-${Date.now()}`,
      userId: activeUserId,
      spent: 0,
      progress: 0,
      createdAt: new Date().toISOString().split('T')[0],
    };
    setProjects(prev => {
      const next = [newProject, ...prev];
      if (user) {
        localStorage.setItem(`${STORAGE_KEYS.PROJECTS_PREFIX}${user.id}`, JSON.stringify(next));
      }
      return next;
    });
    api.createProject(newProject).catch(() => {});
    showToast({
      title: 'Project Created',
      message: `Project "${newProject.title}" was launched.`,
      type: 'success',
      undoAction: () => {
        setProjects(prev => prev.filter(p => p.id !== newProject.id));
        api.deleteProject(newProject.id).catch(() => {});
      },
      undoLabel: 'Undo',
    });
    return newProject;
  };

  const updateProject = (id: string, updates: Partial<Project>) => {
    setProjects(prev => prev.map(p => (p.id === id ? { ...p, ...updates } : p)));
    api.updateProject(id, updates).catch(() => {});
    showToast({
      title: 'Project Saved',
      message: 'Project details have been updated.',
      type: 'success',
    });
  };

  const deleteProject = (id: string) => {
    const projToDelete = projects.find(p => p.id === id);
    if (!projToDelete) return;
    setProjects(prev => prev.filter(p => p.id !== id));
    api.deleteProject(id).catch(() => {});
    showToast({
      title: 'Project Deleted',
      message: `Project "${projToDelete.title}" was deleted.`,
      type: 'warning',
      undoAction: () => {
        setProjects(prev => [projToDelete, ...prev]);
        api.createProject(projToDelete).catch(() => {});
      },
      undoLabel: 'Restore',
    });
  };

  const archiveProject = (id: string) => {
    setProjects(prev => prev.map(p => (p.id === id ? { ...p, status: 'archived' } : p)));
    api.updateProject(id, { status: 'archived' }).catch(() => {});
    showToast({
      title: 'Project Archived',
      message: 'Project has been moved to archive.',
      type: 'info',
      undoAction: () => {
        setProjects(prev => prev.map(p => (p.id === id ? { ...p, status: 'in-progress' } : p)));
        api.updateProject(id, { status: 'in-progress' }).catch(() => {});
      },
      undoLabel: 'Unarchive',
    });
  };

  const restoreProject = (id: string) => {
    setProjects(prev => prev.map(p => (p.id === id ? { ...p, status: 'in-progress' } : p)));
    api.updateProject(id, { status: 'in-progress' }).catch(() => {});
    showToast({
      title: 'Project Restored',
      message: 'Project moved back to active status.',
      type: 'success',
    });
  };

  const getProjectById = (id: string) => projects.find(p => p.id === id);

  // Task Actions
  const addTask = (taskData: Omit<Task, 'id' | 'createdAt' | 'actualHours'>) => {
    const activeUserId = user?.id || (user?.email ? getDeterministicUserId(user.email) : 'usr-1');
    const newTask: Task = {
      ...taskData,
      id: `tsk-${Date.now()}`,
      userId: activeUserId,
      actualHours: 0,
      createdAt: new Date().toISOString().split('T')[0],
    };
    setTasks(prev => {
      const next = [newTask, ...prev];
      if (user) {
        localStorage.setItem(`${STORAGE_KEYS.TASKS_PREFIX}${user.id}`, JSON.stringify(next));
      }
      recalculateProjectProgress(newTask.projectId, next);
      return next;
    });
    api.createTask(newTask).catch(() => {});

    showToast({
      title: 'Task Created',
      message: `"${newTask.title}" added to list.`,
      type: 'success',
      undoAction: () => {
        setTasks(prev => prev.filter(t => t.id !== newTask.id));
        api.deleteTask(newTask.id).catch(() => {});
      },
      undoLabel: 'Undo',
    });

    // Real-Time Deadline Sound & Notification Trigger with Stage Awareness
    if (newTask.dueDate) {
      const targetDeadline = parseTaskDeadline(newTask.dueDate, newTask.dueTime);
      if (targetDeadline) {
        const now = new Date();
        const diffMs = targetDeadline.getTime() - now.getTime();
        const diffHours = diffMs / (1000 * 60 * 60);
        const hoursThreshold = Math.max(1, Number(user?.notificationSettings?.emailHoursBefore) || 2);

        if (diffHours > hoursThreshold && diffHours <= 26 && diffHours >= 14) {
          // Tomorrow (Stage 1)
          addNotification({
            title: '📅 Deadline Tomorrow!',
            message: `Task "${newTask.title}" is due tomorrow (${newTask.dueDate}${newTask.dueTime ? ` at ${newTask.dueTime}` : ''}).`,
            type: 'deadline',
            priority: 'high',
            relatedId: newTask.id,
            relatedType: 'task',
          });
          maybeSendUrgentEmail(newTask, `Deliverable "${newTask.title}" is due tomorrow (${newTask.dueDate}).`, '24h', 24);
        } else if (diffHours > 0 && diffHours <= hoursThreshold) {
          // Imminent / 1h or 2h warning (Stage 2)
          const hLeft = Math.max(1, Math.round(diffHours));
          addNotification({
            title: `🚨 Final Warning: Due in ${hLeft}h!`,
            message: `Task "${newTask.title}" is due in approximately ${hLeft} hour${hLeft === 1 ? '' : 's'}.`,
            type: 'deadline',
            priority: 'urgent',
            relatedId: newTask.id,
            relatedType: 'task',
          });
          maybeSendUrgentEmail(newTask, `Urgent: Task "${newTask.title}" is due in ${hLeft} hour${hLeft === 1 ? '' : 's'}!`, 'imminent', hLeft);
        } else if (diffHours < 0 && diffHours >= -48) {
          // Overdue (Stage 3)
          addNotification({
            title: '🚨 Overdue Task Alert!',
            message: `Task "${newTask.title}" is already past its due date (${newTask.dueDate}).`,
            type: 'deadline',
            priority: 'urgent',
            relatedId: newTask.id,
            relatedType: 'task',
          });
          maybeSendUrgentEmail(newTask, `Task "${newTask.title}" is past its due date.`, 'overdue');
        } else if (newTask.priority === 'urgent') {
          addNotification({
            title: '⏰ Urgent Priority Task Scheduled',
            message: `Task "${newTask.title}" is marked as Urgent Priority.`,
            type: 'deadline',
            priority: 'urgent',
            relatedId: newTask.id,
            relatedType: 'task',
          });
          maybeSendUrgentEmail(newTask, `Urgent deliverable "${newTask.title}" was scheduled.`, 'urgent_task');
        }
      }
    }

    return newTask;
  };

  const updateTask = (id: string, updates: Partial<Task>) => {
    setTasks(prev => {
      const next = prev.map(t => (t.id === id ? { ...t, ...updates } : t));
      const target = next.find(t => t.id === id);
      if (target) recalculateProjectProgress(target.projectId, next);
      return next;
    });
    api.updateTask(id, updates).catch(() => {});

    if (updates.dueDate || updates.dueTime || updates.priority) {
      const target = tasks.find(t => t.id === id);
      const newDue = updates.dueDate || target?.dueDate;
      const newTime = updates.dueTime || target?.dueTime;
      const newPriority = updates.priority || target?.priority;

      if (newDue) {
        const targetDeadline = parseTaskDeadline(newDue, newTime);
        if (targetDeadline) {
          const now = new Date();
          const diffMs = targetDeadline.getTime() - now.getTime();
          const diffHours = diffMs / (1000 * 60 * 60);
          const hoursThreshold = Math.max(1, Number(user?.notificationSettings?.emailHoursBefore) || 2);
          const updatedObj = { ...target, ...updates } as Task;

          if (diffHours > hoursThreshold && diffHours <= 26 && diffHours >= 14) {
            addNotification({
              title: '📅 Deadline Tomorrow!',
              message: `Task "${target?.title || 'Task'}" deadline is due tomorrow (${newDue}${newTime ? ` at ${newTime}` : ''}).`,
              type: 'deadline',
              priority: 'high',
              relatedId: id,
              relatedType: 'task',
            });
            maybeSendUrgentEmail(updatedObj, `Task "${updatedObj.title}" deadline set to tomorrow.`, '24h', 24);
          } else if (diffHours > 0 && diffHours <= hoursThreshold) {
            const hLeft = Math.max(1, Math.round(diffHours));
            addNotification({
              title: `🚨 Final Warning: Due in ${hLeft}h!`,
              message: `Task "${target?.title || 'Task'}" is due in ${hLeft} hour${hLeft === 1 ? '' : 's'} (${newDue}${newTime ? ` at ${newTime}` : ''}).`,
              type: 'deadline',
              priority: 'urgent',
              relatedId: id,
              relatedType: 'task',
            });
            maybeSendUrgentEmail(updatedObj, `Task "${updatedObj.title}" is due in ${hLeft} hour${hLeft === 1 ? '' : 's'}.`, 'imminent', hLeft);
          } else if (newPriority === 'urgent' || (diffHours < 0 && diffHours >= -48)) {
            addNotification({
              title: diffHours < 0 ? '🚨 Overdue Task Alert!' : '🚨 Urgent Priority Task',
              message: `Task "${target?.title || 'Task'}" requires immediate attention.`,
              type: 'deadline',
              priority: 'urgent',
              relatedId: id,
              relatedType: 'task',
            });
            maybeSendUrgentEmail(updatedObj, `Task "${updatedObj.title}" updated to urgent deadline: ${newDue}.`);
          }
        }
      }
    }

    showToast({
      title: 'Task Updated',
      message: 'Task changes saved successfully.',
      type: 'success',
    });
  };

  const deleteTask = (id: string) => {
    const taskToDelete = tasks.find(t => t.id === id);
    if (!taskToDelete) return;
    const nextTasks = tasks.filter(t => t.id !== id);
    setTasks(nextTasks);
    recalculateProjectProgress(taskToDelete.projectId, nextTasks);
    api.deleteTask(id).catch(() => {});
    showToast({
      title: 'Task Deleted',
      message: `"${taskToDelete.title}" removed.`,
      type: 'warning',
      undoAction: () => {
        setTasks(prev => [taskToDelete, ...prev]);
        api.createTask(taskToDelete).catch(() => {});
      },
      undoLabel: 'Restore',
    });
  };

  const moveTaskStatus = (id: string, newStatus: TaskStatus) => {
    setTasks(prev => {
      const targetTask = prev.find(t => t.id === id);
      if (!targetTask) return prev;

      const wasNotDone = targetTask.status !== 'done';
      const isNowDone = newStatus === 'done';

      const next = prev.map(t => (t.id === id ? { ...t, status: newStatus } : t));
      recalculateProjectProgress(targetTask.projectId, next);

      // Trigger Confetti Celebration on task completion!
      if (wasNotDone && isNowDone) {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#128C7E', '#25D366', '#34B7F1', '#ECE5DD', '#10B981'],
        });
      }

      return next;
    });
    api.updateTask(id, { status: newStatus }).catch(() => {});
  };

  const toggleSubtask = (taskId: string, subtaskId: string) => {
    setTasks(prev => {
      const next = prev.map(t => {
        if (t.id === taskId && t.subtasks) {
          const updatedSubtasks = t.subtasks.map(st =>
            st.id === subtaskId ? { ...st, completed: !st.completed } : st
          );
          return { ...t, subtasks: updatedSubtasks };
        }
        return t;
      });
      const target = next.find(t => t.id === taskId);
      if (target) {
        api.updateTask(taskId, { subtasks: target.subtasks }).catch(() => {});
      }
      return next;
    });
  };

  const getTaskById = (id: string) => tasks.find(t => t.id === id);

  // Time Tracker Actions
  const startTimer = (projectId: string, clientId: string, taskId?: string, description?: string) => {
    setActiveTimer({
      isRunning: true,
      projectId,
      clientId,
      taskId: taskId || '',
      description: description || '',
      startTime: Date.now(),
      elapsedSeconds: 0,
    });
    showToast({
      title: 'Timer Started',
      message: 'Time tracking is now live.',
      type: 'info',
    });
  };

  const pauseTimer = () => {
    setActiveTimer(prev => ({ ...prev, isRunning: false }));
    showToast({
      title: 'Timer Paused',
      message: 'Tracking paused. You can resume anytime.',
      type: 'info',
    });
  };

  const resumeTimer = () => {
    setActiveTimer(prev => ({ ...prev, isRunning: true }));
  };

  const stopTimer = () => {
    if (activeTimer.elapsedSeconds > 0) {
      const activeClient = clients.find(c => c.id === activeTimer.clientId);
      const effectiveRate = activeClient?.hourlyRate || user?.hourlyRate || 65;
      const timerSnapshot: ActiveTimer = { ...activeTimer };
      const newEntry: Omit<TimeEntry, 'id'> = {
        userId: user?.id || 'usr-1',
        projectId: activeTimer.projectId,
        clientId: activeTimer.clientId,
        taskId: activeTimer.taskId || undefined,
        description: activeTimer.description || 'Tracked Freelance Session',
        durationSeconds: activeTimer.elapsedSeconds,
        startTime: new Date(activeTimer.startTime || Date.now() - activeTimer.elapsedSeconds * 1000).toISOString(),
        endTime: new Date().toISOString(),
        isBillable: true,
        hourlyRate: effectiveRate,
        isBilled: false,
        date: new Date().toISOString().split('T')[0],
      };
      addTimeEntry(newEntry, timerSnapshot);
    }
    resetTimer();
  };

  const resetTimer = () => {
    setActiveTimer({
      isRunning: false,
      projectId: '',
      taskId: '',
      clientId: '',
      description: '',
      startTime: 0,
      elapsedSeconds: 0,
    });
  };

  const updateTimerDescription = (description: string) => {
    setActiveTimer(prev => ({ ...prev, description }));
  };

  const addTimeEntry = (entryData: Omit<TimeEntry, 'id'>, prevActiveTimer?: ActiveTimer) => {
    const activeUserId = user?.id || (user?.email ? getDeterministicUserId(user.email) : 'usr-1');
    const newEntry: TimeEntry = {
      ...entryData,
      id: `time-${Date.now()}`,
      userId: activeUserId,
    };
    setTimeEntries(prev => {
      const next = [newEntry, ...prev];
      if (user) {
        localStorage.setItem(`${STORAGE_KEYS.TIME_PREFIX}${user.id}`, JSON.stringify(next));
      }
      return next;
    });
    api.createTimeEntry(newEntry).catch(() => {});

    // Also update actual hours on task if specified
    if (newEntry.taskId) {
      const addedHours = Number((newEntry.durationSeconds / 3600).toFixed(2));
      setTasks(prev => {
        const next = prev.map(t =>
          t.id === newEntry.taskId
            ? { ...t, actualHours: Number(((t.actualHours || 0) + addedHours).toFixed(2)) }
            : t
        );
        if (user) {
          localStorage.setItem(`${STORAGE_KEYS.TASKS_PREFIX}${user.id}`, JSON.stringify(next));
        }
        return next;
      });
    }

    // Accurate human-friendly duration for the toast message
    const totalSecs = newEntry.durationSeconds || 0;
    const formatDurationAccurate = (secs: number) => {
      if (secs < 60) {
        return `${secs}s`;
      }
      const hrs = Math.floor(secs / 3600);
      const mins = Math.floor((secs % 3600) / 60);
      const remSecs = secs % 60;
      if (hrs === 0) {
        return remSecs > 0 ? `${mins}m ${remSecs}s` : `${mins}m`;
      }
      const decimalHrs = (secs / 3600).toFixed(1);
      return `${hrs}h ${mins > 0 ? `${mins}m ` : ''}(${decimalHrs} hrs)`;
    };

    const accurateDuration = formatDurationAccurate(totalSecs);

    showToast({
      title: 'Time Logged',
      message: `${accurateDuration} recorded successfully.`,
      type: 'success',
      duration: 6500,
      undoAction: () => {
        // 1. Remove from React state and sync localStorage
        setTimeEntries(prev => {
          const next = prev.filter(e => e.id !== newEntry.id);
          if (user) {
            localStorage.setItem(`${STORAGE_KEYS.TIME_PREFIX}${user.id}`, JSON.stringify(next));
          }
          return next;
        });

        // 2. Call backend delete API
        api.deleteTimeEntry(newEntry.id).catch(() => {});

        // 3. Revert task actualHours if linked to a task
        if (newEntry.taskId) {
          const addedHours = Number((newEntry.durationSeconds / 3600).toFixed(2));
          setTasks(prev => {
            const next = prev.map(t =>
              t.id === newEntry.taskId
                ? { ...t, actualHours: Math.max(0, Number(((t.actualHours || 0) - addedHours).toFixed(2))) }
                : t
            );
            if (user) {
              localStorage.setItem(`${STORAGE_KEYS.TASKS_PREFIX}${user.id}`, JSON.stringify(next));
            }
            return next;
          });
        }

        // 4. Restore active stopwatch timer if session came from stopTimer
        if (prevActiveTimer && prevActiveTimer.elapsedSeconds > 0) {
          setActiveTimer({ ...prevActiveTimer, isRunning: false });
        }

        // 5. Provide immediate feedback confirmation toast
        showToast({
          title: 'Time Log Undone',
          message: prevActiveTimer && prevActiveTimer.elapsedSeconds > 0
            ? 'Time entry removed and timer restored.'
            : 'Logged time entry removed.',
          type: 'info',
        });
      },
      undoLabel: 'Undo',
    });
  };

  const deleteTimeEntry = (id: string) => {
    setTimeEntries(prev => {
      const next = prev.filter(e => e.id !== id);
      if (user) {
        localStorage.setItem(`${STORAGE_KEYS.TIME_PREFIX}${user.id}`, JSON.stringify(next));
      }
      return next;
    });
    api.deleteTimeEntry(id).catch(() => {});
    showToast({
      title: 'Time Entry Deleted',
      message: 'Log entry removed.',
      type: 'info',
    });
  };

  // Invoice Actions
  const addInvoice = (invoiceData: Omit<Invoice, 'id' | 'createdAt'>) => {
    const activeUserId = user?.id || (user?.email ? getDeterministicUserId(user.email) : 'usr-1');
    const newInvoice: Invoice = {
      ...invoiceData,
      id: `inv-${Date.now()}`,
      userId: activeUserId,
      createdAt: new Date().toISOString().split('T')[0],
    };
    setInvoices(prev => {
      const next = [newInvoice, ...prev];
      if (user) {
        localStorage.setItem(`${STORAGE_KEYS.INVOICES_PREFIX}${user.id}`, JSON.stringify(next));
      }
      return next;
    });
    api.createInvoice(newInvoice).catch(() => {});

    // Update Client's total billed
    setClients(prev => {
      const next = prev.map(c =>
        c.id === newInvoice.clientId
          ? { ...c, totalBilled: (c.totalBilled || 0) + newInvoice.total }
          : c
      );
      if (user) {
        localStorage.setItem(`${STORAGE_KEYS.CLIENTS_PREFIX}${user.id}`, JSON.stringify(next));
      }
      return next;
    });

    showToast({
      title: 'Invoice Created',
      message: `Invoice #${newInvoice.invoiceNumber} created.`,
      type: 'success',
      undoAction: () => {
        setInvoices(prev => prev.filter(i => i.id !== newInvoice.id));
        api.deleteInvoice(newInvoice.id).catch(() => {});
      },
      undoLabel: 'Undo',
    });
    return newInvoice;
  };

  const updateInvoice = (id: string, updates: Partial<Invoice>) => {
    setInvoices(prev => prev.map(i => (i.id === id ? { ...i, ...updates } : i)));
    api.updateInvoice(id, updates).catch(() => {});
    showToast({
      title: 'Invoice Saved',
      message: 'Invoice has been updated.',
      type: 'success',
    });
  };

  const deleteInvoice = (id: string) => {
    setInvoices(prev => prev.filter(i => i.id !== id));
    api.deleteInvoice(id).catch(() => {});
    showToast({
      title: 'Invoice Deleted',
      message: 'Invoice removed.',
      type: 'warning',
    });
  };

  const updateInvoiceStatus = (id: string, status: InvoiceStatus) => {
    setInvoices(prev => prev.map(i => (i.id === id ? { ...i, status } : i)));
    api.updateInvoice(id, { status }).catch(() => {});
    showToast({
      title: 'Status Updated',
      message: `Invoice marked as ${status.toUpperCase()}.`,
      type: 'info',
    });
  };

  // Notification Actions
  const unreadNotificationsCount = notifications.filter(n => !n.read).length;

  const markNotificationAsRead = (id: string) => {
    setNotifications(prev => prev.map(n => (n.id === id ? { ...n, read: true } : n)));
    api.markNotificationRead(id).catch(() => {});
  };

  const markAllNotificationsAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const clearAllNotifications = () => {
    setNotifications([]);
    api.clearNotifications().catch(() => {});
    showToast({
      title: 'Notifications Cleared',
      message: 'All notifications cleared.',
      type: 'info',
    });
  };

  // Data Reset & Backup
  const resetAllDataToDemo = () => {
    localStorage.clear();
    setUser(null);
    setRegisteredUsers(defaultRegisteredUsers);
    setClients([]);
    setProjects([]);
    setTasks([]);
    setTimeEntries([]);
    setInvoices([]);
    setNotifications([]);
    resetTimer();
    api.resetData().catch(() => {});
    showToast({
      title: 'Demo Data Reset',
      message: 'All application state restored to default demo state.',
      type: 'info',
    });
  };

  const exportDataAsJson = () => {
    const exportObject = {
      version: '1.0',
      exportedAt: new Date().toISOString(),
      user,
      clients,
      projects,
      tasks,
      timeEntries,
      invoices,
      notifications,
    };

    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(exportObject, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `meplus_freelancer_backup_${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();

    showToast({
      title: 'Backup Downloaded',
      message: 'Your workspace backup has been exported as JSON.',
      type: 'success',
    });
  };

  const importDataFromJson = (jsonData: string): boolean => {
    try {
      const parsed = JSON.parse(jsonData);
      if (parsed.user) setUser(parsed.user);
      if (Array.isArray(parsed.clients)) setClients(parsed.clients);
      if (Array.isArray(parsed.projects)) setProjects(parsed.projects);
      if (Array.isArray(parsed.tasks)) setTasks(parsed.tasks);
      if (Array.isArray(parsed.timeEntries)) setTimeEntries(parsed.timeEntries);
      if (Array.isArray(parsed.invoices)) setInvoices(parsed.invoices);
      if (Array.isArray(parsed.notifications)) setNotifications(parsed.notifications);

      showToast({
        title: 'Data Restored',
        message: 'Successfully imported backup data.',
        type: 'success',
      });
      return true;
    } catch {
      showToast({
        title: 'Import Failed',
        message: 'Invalid JSON backup format.',
        type: 'error',
      });
      return false;
    }
  };

  return (
    <AppContext.Provider
      value={{
        activeTab,
        setActiveTab,
        searchQuery,
        setSearchQuery,
        highlightedClientId,
        setHighlightedClientId,
        user,
        isAuthenticated: !!user,
        login,
        register,
        forgotPassword,
        verifyOtp,
        resendOtp,
        resetPassword,
        loginDemoUser,
        logout,
        updateUserProfile,
        clients,
        addClient,
        updateClient,
        deleteClient,
        getClientById,
        projects,
        addProject,
        updateProject,
        deleteProject,
        archiveProject,
        restoreProject,
        getProjectById,
        tasks,
        addTask,
        updateTask,
        deleteTask,
        moveTaskStatus,
        toggleSubtask,
        getTaskById,
        activeTimer,
        startTimer,
        pauseTimer,
        resumeTimer,
        stopTimer,
        resetTimer,
        updateTimerDescription,
        timeEntries,
        addTimeEntry,
        deleteTimeEntry,
        invoices,
        addInvoice,
        updateInvoice,
        deleteInvoice,
        updateInvoiceStatus,
        notifications,
        unreadNotificationsCount,
        markNotificationAsRead,
        markAllNotificationsAsRead,
        addNotification,
        clearAllNotifications,
        sendUrgentEmailAlert,
        checkAllDeadlinesNow,
        lastDeadlineScanTime,
        toasts,
        showToast,
        dismissToast,
        isCommandPaletteOpen,
        setIsCommandPaletteOpen,
        isAiModalOpen,
        setIsAiModalOpen,
        isClientModalOpen,
        setIsClientModalOpen,
        selectedClientForEdit,
        setSelectedClientForEdit,
        isProjectModalOpen,
        setIsProjectModalOpen,
        selectedProjectForEdit,
        setSelectedProjectForEdit,
        isTaskModalOpen,
        setIsTaskModalOpen,
        selectedTaskForEdit,
        setSelectedTaskForEdit,
        isInvoiceModalOpen,
        setIsInvoiceModalOpen,
        selectedInvoiceForEdit,
        setSelectedInvoiceForEdit,
        isTimeLogModalOpen,
        setIsTimeLogModalOpen,
        confirmModal,
        confirmAction,
        closeConfirmModal,
        resetAllDataToDemo,
        resetDemoData,
        exportDataAsJson,
        importDataFromJson,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used within an AppProvider');
  return context;
};
