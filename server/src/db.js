import fs from 'fs';
import path from 'path';
import os from 'os';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// In serverless / Vercel, the app directory is read-only.
// We use /tmp if running under Vercel / serverless, and maintain an in-memory cache.
const isServerless = Boolean(process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME);
const BUNDLED_DATA_DIR = path.join(__dirname, '../data');
const BUNDLED_DB_FILE = path.join(BUNDLED_DATA_DIR, 'db.json');

const DATA_DIR = isServerless ? os.tmpdir() : BUNDLED_DATA_DIR;
const DB_FILE = isServerless ? path.join(os.tmpdir(), 'hci_db.json') : BUNDLED_DB_FILE;

let inMemoryDb = null;

// Initial seed data with userId isolation
export const initialSeed = {
  users: [
    {
      id: 'usr-1',
      name: 'Alex Rivera',
      email: 'alex.rivera@gmail.com',
      password: 'password123',
      avatar: 'https://api.dicebear.com/7.x/adventurer/svg?seed=Alex&backgroundColor=b6e3f4',
      title: 'Senior UI/UX & Full-Stack Freelancer',
      hourlyRate: 75,
      currency: '$',
      bio: 'Specialized in building modern web apps, design systems, and responsive digital interfaces for startups and enterprises.',
      notificationSettings: {
        email: true,
        sms: true,
        browser: true,
        sound: true,
        deadlineReminderHours: 24,
      },
    },
    {
      id: 'usr-demo',
      name: 'Alex Rivera',
      email: 'demo@meplus.io',
      password: 'password123',
      avatar: 'https://api.dicebear.com/7.x/adventurer/svg?seed=Alex&backgroundColor=b6e3f4',
      title: 'Senior Graphic & UI Designer',
      hourlyRate: 65,
      currency: '$',
      bio: 'Specialized in building modern web interfaces, digital branding, and UI systems.',
      notificationSettings: {
        email: true,
        sms: true,
        browser: true,
        sound: true,
        deadlineReminderHours: 24,
      },
    },
  ],
  user: null,
  clients: [
    {
      id: 'cli-1',
      userId: 'usr-1',
      name: 'Sarah Jenkins',
      company: 'Nova Brand Studio',
      email: 'sarah.j@novastudio.design',
      phone: '+1 (555) 234-5678',
      color: '#8b5cf6',
      status: 'active',
      hourlyRate: 85,
      currency: '$',
      totalBilled: 14500,
      notes: 'Key client for branding websites and creative landing pages.',
      createdAt: '2026-01-10',
    },
    {
      id: 'cli-2',
      userId: 'usr-1',
      name: 'Marcus Vance',
      company: 'FinTech Pulse Corp',
      email: 'mvance@fintechpulse.io',
      phone: '+1 (555) 876-5432',
      color: '#3b82f6',
      status: 'active',
      hourlyRate: 95,
      currency: '$',
      totalBilled: 24000,
      notes: 'Working on real-time crypto trading dashboards and charts.',
      createdAt: '2026-02-01',
    },
    {
      id: 'cli-3',
      userId: 'usr-1',
      name: 'Elena Rostova',
      company: 'EduVerse Learning',
      email: 'elena@eduverse.org',
      phone: '+44 20 7946 0912',
      color: '#10b981',
      status: 'active',
      hourlyRate: 70,
      currency: '$',
      totalBilled: 8200,
      notes: 'Building interactive student quiz modules and responsive frontend.',
      createdAt: '2026-03-15',
    },
    {
      id: 'cli-4',
      userId: 'usr-1',
      name: 'David Kim',
      company: 'Apex Robotics & IoT',
      email: 'dkim@apexrobotics.tech',
      phone: '+1 (555) 432-8901',
      color: '#f59e0b',
      status: 'active',
      hourlyRate: 85,
      currency: '$',
      totalBilled: 11500,
      notes: 'Telemetry sensor data visualization and real-time IoT diagnostic monitoring portal.',
      createdAt: '2026-04-20',
    },
    {
      id: 'cli-5',
      userId: 'usr-1',
      name: 'Clara Oswald',
      company: 'BioHealth Solutions',
      email: 'clara@biohealth.co',
      phone: '+1 (555) 654-3210',
      color: '#f43f5e',
      status: 'lead',
      hourlyRate: 75,
      currency: '$',
      totalBilled: 4800,
      notes: 'Completed patient intake mobile flow. Discussing phase 2 telemedicine video integration.',
      createdAt: '2026-08-10',
    },
  ],
  projects: [
    {
      id: 'prj-1',
      userId: 'usr-1',
      clientId: 'cli-1',
      title: 'Nova Design System & E-Commerce Landing',
      description: 'Complete overhaul of design tokens, accessible UI components, and high-conversion e-commerce landing page.',
      status: 'in-progress',
      priority: 'high',
      budget: 6500,
      spent: 4200,
      startDate: '2026-08-15',
      deadline: '2026-09-25',
      progress: 75,
      tags: ['UI/UX Design', 'Design System', 'Tailwind CSS', 'Figma'],
      createdAt: '2026-08-15',
    },
    {
      id: 'prj-2',
      userId: 'usr-1',
      clientId: 'cli-2',
      title: 'FinTech Pulse Real-Time Analytics Dashboard',
      description: 'High frequency trading chart widgets, real-time WebSockets data feeds, and multi-currency portfolio tracking.',
      status: 'in-progress',
      priority: 'urgent',
      budget: 12000,
      spent: 9600,
      startDate: '2026-08-01',
      deadline: '2026-09-23',
      progress: 88,
      tags: ['FinTech', 'Dashboard', 'WebSockets', 'Data Viz'],
      createdAt: '2026-08-01',
    },
    {
      id: 'prj-3',
      userId: 'usr-1',
      clientId: 'cli-3',
      title: 'EduVerse Interactive LMS Gamification',
      description: 'Student reward badges, interactive drag-and-drop quizzes, and automated certificate generation module.',
      status: 'in-progress',
      priority: 'medium',
      budget: 4500,
      spent: 1800,
      startDate: '2026-08-25',
      deadline: '2026-10-06',
      progress: 40,
      tags: ['EdTech', 'Gamification', 'Interactive UI', 'SVG'],
      createdAt: '2026-08-25',
    },
    {
      id: 'prj-4',
      userId: 'usr-1',
      clientId: 'cli-4',
      title: 'Apex IoT Sensor Telemetry Portal',
      description: 'Live sensor monitoring, heatmaps, alert notifications, and automated device diagnostics.',
      status: 'planning',
      priority: 'medium',
      budget: 8000,
      spent: 1200,
      startDate: '2026-09-24',
      deadline: '2026-10-27',
      progress: 20,
      tags: ['IoT', 'Telemetry', 'Hardware UI', 'Real-time'],
      createdAt: '2026-09-14',
    },
    {
      id: 'prj-5',
      userId: 'usr-1',
      clientId: 'cli-5',
      title: 'BioHealth Patient Intake Mobile Flow',
      description: 'HIPAA-compliant patient onboarding wizard, medical history forms, and digital signature capture.',
      status: 'completed',
      priority: 'low',
      budget: 3500,
      spent: 3500,
      startDate: '2026-07-20',
      deadline: '2026-09-12',
      progress: 100,
      tags: ['Mobile UX', 'Healthcare', 'Accessibility'],
      createdAt: '2026-07-20',
      completedAt: '2026-09-12',
    },
  ],
  tasks: [
    {
      id: 'tsk-1',
      userId: 'usr-1',
      projectId: 'prj-2',
      clientId: 'cli-2',
      title: 'Finalize Dark Theme Contrast & WCAG 2.1 AA Audit',
      description: 'Ensure financial charts, metrics, and transaction tables exceed accessibility contrast ratios in dark mode.',
      status: 'todo',
      priority: 'urgent',
      dueDate: '2026-09-22',
      estimatedHours: 4,
      actualHours: 0,
      subtasks: [
        { id: 'st-1', title: 'Audit color tokens against WCAG contrast grid', completed: true },
        { id: 'st-2', title: 'Update Tailwind dark theme tokens', completed: false },
        { id: 'st-3', title: 'Test chart readability with color-blind simulator', completed: false },
      ],
      tags: ['Accessibility', 'UI/UX', 'Dark Theme'],
      attachments: [],
      createdAt: '2026-09-20',
    },
    {
      id: 'tsk-2',
      userId: 'usr-1',
      projectId: 'prj-5',
      clientId: 'cli-5',
      title: 'Design Patient Symptom Step-by-Step Wizard',
      description: 'Intuitive multi-step form with body mapping selection and quick-select common symptoms.',
      status: 'todo',
      priority: 'medium',
      dueDate: '2026-09-27',
      estimatedHours: 5,
      actualHours: 0,
      subtasks: [
        { id: 'st-4', title: 'Create wireframe progression flow', completed: true },
        { id: 'st-5', title: 'Design interactive body map vector pins', completed: false },
        { id: 'st-6', title: 'Add keyboard navigation & accessibility tags', completed: false },
      ],
      tags: ['Mobile UI', 'Form Flow'],
      attachments: [],
      createdAt: '2026-09-19',
    },
    {
      id: 'tsk-3',
      userId: 'usr-1',
      projectId: 'prj-1',
      clientId: 'cli-1',
      title: 'Build Interactive Checkout Form & Promo Validation',
      description: 'Multi-step checkout with instant inline promo validation and dynamic shipping calculation.',
      status: 'in-progress',
      priority: 'high',
      dueDate: '2026-09-23',
      estimatedHours: 6,
      actualHours: 3.5,
      subtasks: [
        { id: 'st-7', title: 'Build promo coupon input with debounce check', completed: true },
        { id: 'st-8', title: 'Calculate shipping cost by zip code API', completed: true },
        { id: 'st-9', title: 'Add accessible aria-live validation messages', completed: false },
      ],
      tags: ['Checkout', 'Forms', 'Validation'],
      attachments: [],
      createdAt: '2026-09-18',
    },
    {
      id: 'tsk-4',
      userId: 'usr-1',
      projectId: 'prj-2',
      clientId: 'cli-2',
      title: 'Implement WebSocket Live Feed & Heartbeat Reconnect',
      description: 'Ensure trading feed recovers automatically after network interruptions without page refresh.',
      status: 'in-progress',
      priority: 'urgent',
      dueDate: '2026-09-24',
      estimatedHours: 5,
      actualHours: 3.0,
      subtasks: [
        { id: 'st-10', title: 'Exponential backoff reconnection logic', completed: true },
        { id: 'st-11', title: 'Ping/Pong heartbeat interval (30s)', completed: true },
        { id: 'st-12', title: 'Visual toast notification when connection drops', completed: false },
      ],
      tags: ['WebSockets', 'Network', 'Real-time'],
      attachments: [],
      createdAt: '2026-09-17',
    },
    {
      id: 'tsk-5',
      userId: 'usr-1',
      projectId: 'prj-1',
      clientId: 'cli-1',
      title: 'Design Hero Vector Illustrations & Icon Library',
      description: 'Custom SVG asset pack for landing page hero, feature highlights, and trust badges.',
      status: 'review',
      priority: 'medium',
      dueDate: '2026-09-26',
      estimatedHours: 5,
      actualHours: 5.0,
      subtasks: [
        { id: 'st-13', title: 'Draft 3 illustration concepts in Figma', completed: true },
        { id: 'st-14', title: 'Export clean SVGs optimized with SVGO', completed: true },
      ],
      tags: ['Illustrations', 'Assets', 'Figma'],
      attachments: [],
      createdAt: '2026-09-16',
    },
    {
      id: 'tsk-6',
      userId: 'usr-1',
      projectId: 'prj-3',
      clientId: 'cli-3',
      title: 'Gamified Student Badge Animation & Sound Feedback',
      description: 'Micro-interactions when students complete quizzes and level up their learning streak.',
      status: 'review',
      priority: 'medium',
      dueDate: '2026-09-28',
      estimatedHours: 4,
      actualHours: 4.0,
      subtasks: [
        { id: 'st-15', title: 'Design 5 achievement milestone badges', completed: true },
        { id: 'st-16', title: 'Add smooth CSS scale/burst confetti effect', completed: true },
      ],
      tags: ['Gamification', 'Animation', 'Micro-interactions'],
      attachments: [],
      createdAt: '2026-09-15',
    },
    {
      id: 'tsk-7',
      userId: 'usr-1',
      projectId: 'prj-1',
      clientId: 'cli-1',
      title: 'Figma Component Library & Global Design Tokens',
      description: 'Defined color palette, typography scale, spacing tokens, and button states in Figma.',
      status: 'done',
      priority: 'high',
      dueDate: '2026-09-17',
      estimatedHours: 8,
      actualHours: 8.0,
      subtasks: [
        { id: 'st-17', title: 'Setup auto-layout components in Figma', completed: true },
        { id: 'st-18', title: 'Export design tokens as Tailwind config', completed: true },
      ],
      tags: ['Design System', 'Tokens'],
      attachments: [],
      createdAt: '2026-09-07',
      completedAt: '2026-09-17',
    },
    {
      id: 'tsk-8',
      userId: 'usr-1',
      projectId: 'prj-3',
      clientId: 'cli-3',
      title: 'Interactive Quiz Component & Score Calculator',
      description: 'Built multiple-choice question layout with instant score calculation and timer.',
      status: 'done',
      priority: 'medium',
      dueDate: '2026-09-14',
      estimatedHours: 6,
      actualHours: 6.0,
      subtasks: [
        { id: 'st-19', title: 'Implement question card transition animations', completed: true },
        { id: 'st-20', title: 'Calculate accuracy percentage and grade tier', completed: true },
      ],
      tags: ['Quiz', 'Component', 'EdTech'],
      attachments: [],
      createdAt: '2026-09-02',
      completedAt: '2026-09-14',
    },
  ],
  timeEntries: [
    {
      id: 'time-1',
      userId: 'usr-1',
      projectId: 'prj-2',
      taskId: 'tsk-1',
      clientId: 'cli-2',
      description: 'Live testing dark mode contrast on financial chart widgets',
      durationSeconds: 9000,
      hourlyRate: 95,
      date: '2026-09-22',
      isBillable: true,
      isBilled: false,
    },
    {
      id: 'time-2',
      userId: 'usr-1',
      projectId: 'prj-1',
      taskId: 'tsk-3',
      clientId: 'cli-1',
      description: 'Designing interactive checkout validation flow & error states',
      durationSeconds: 12600,
      hourlyRate: 85,
      date: '2026-09-21',
      isBillable: true,
      isBilled: false,
    },
    {
      id: 'time-3',
      userId: 'usr-1',
      projectId: 'prj-1',
      taskId: 'tsk-3',
      clientId: 'cli-1',
      description: 'Building promo coupon dynamic discount calculator',
      durationSeconds: 7200,
      hourlyRate: 85,
      date: '2026-09-20',
      isBillable: true,
      isBilled: false,
    },
    {
      id: 'time-4',
      userId: 'usr-1',
      projectId: 'prj-3',
      taskId: 'tsk-6',
      clientId: 'cli-3',
      description: 'Gamified student badge structure & animation tuning',
      durationSeconds: 10800,
      hourlyRate: 70,
      date: '2026-09-19',
      isBillable: true,
      isBilled: false,
    },
    {
      id: 'time-5',
      userId: 'usr-1',
      projectId: 'prj-4',
      clientId: 'cli-4',
      description: 'Sensor heatmap data visualization & telemetry layout',
      durationSeconds: 14400,
      hourlyRate: 85,
      date: '2026-09-18',
      isBillable: true,
      isBilled: true,
    },
    {
      id: 'time-6',
      userId: 'usr-1',
      projectId: 'prj-5',
      taskId: 'tsk-2',
      clientId: 'cli-5',
      description: 'BioHealth patient intake usability testing & UI touchups',
      durationSeconds: 9000,
      hourlyRate: 75,
      date: '2026-09-17',
      isBillable: true,
      isBilled: true,
    },
  ],
  invoices: [
    {
      id: 'inv-101',
      userId: 'usr-1',
      invoiceNumber: 'INV-2026-001',
      clientId: 'cli-1',
      projectId: 'prj-1',
      issueDate: '2026-08-28',
      dueDate: '2026-09-12',
      status: 'paid',
      items: [
        {
          id: 'item-1',
          description: 'Nova Design System Tokens & Component Architecture (Milestone 1)',
          quantity: 1,
          rate: 3500,
          amount: 3500,
        },
      ],
      subtotal: 3500,
      taxRate: 0,
      taxAmount: 0,
      discount: 0,
      total: 3500,
      currency: '$',
      notes: '',
      clientName: 'Sarah Jenkins',
      clientCompany: 'Nova Brand Studio',
      clientEmail: 'sarah.j@novastudio.design',
      createdAt: '2026-08-28',
    },
    {
      id: 'inv-102',
      userId: 'usr-1',
      invoiceNumber: 'INV-2026-002',
      clientId: 'cli-2',
      projectId: 'prj-2',
      issueDate: '2026-09-17',
      dueDate: '2026-10-01',
      status: 'sent',
      items: [
        {
          id: 'item-2',
          description: 'Real-time Crypto Chart Engine & Portfolio Analytics (Milestone 1)',
          quantity: 1,
          rate: 6500,
          amount: 6500,
        },
      ],
      subtotal: 6500,
      taxRate: 0,
      taxAmount: 0,
      discount: 0,
      total: 6500,
      currency: '$',
      notes: '',
      clientName: 'Marcus Vance',
      clientCompany: 'FinTech Pulse Corp',
      clientEmail: 'mvance@fintechpulse.io',
      createdAt: '2026-09-17',
    },
    {
      id: 'inv-103',
      userId: 'usr-1',
      invoiceNumber: 'INV-2026-003',
      clientId: 'cli-3',
      projectId: 'prj-3',
      issueDate: '2026-09-02',
      dueDate: '2026-09-19',
      status: 'overdue',
      items: [
        {
          id: 'item-3',
          description: 'EduVerse Interactive LMS Gamification & Quiz Engine MVP',
          quantity: 1,
          rate: 2200,
          amount: 2200,
        },
      ],
      subtotal: 2200,
      taxRate: 0,
      taxAmount: 0,
      discount: 0,
      total: 2200,
      currency: '$',
      notes: '',
      clientName: 'Elena Rostova',
      clientCompany: 'EduVerse Learning',
      clientEmail: 'elena@eduverse.org',
      createdAt: '2026-09-02',
    },
    {
      id: 'inv-104',
      userId: 'usr-1',
      invoiceNumber: 'INV-2026-004',
      clientId: 'cli-4',
      projectId: 'prj-4',
      issueDate: '2026-09-22',
      dueDate: '2026-10-06',
      status: 'draft',
      items: [
        {
          id: 'item-4',
          description: 'IoT Sensor Telemetry Portal Architecture & Wireframes',
          quantity: 1,
          rate: 2800,
          amount: 2800,
        },
      ],
      subtotal: 2800,
      taxRate: 0,
      taxAmount: 0,
      discount: 0,
      total: 2800,
      currency: '$',
      notes: '',
      clientName: 'David Kim',
      clientCompany: 'Apex Robotics & IoT',
      clientEmail: 'dkim@apexrobotics.tech',
      createdAt: '2026-09-22',
    },
  ],
  notifications: [
    {
      id: 'notif-1',
      userId: 'usr-1',
      title: '🚨 Urgent Deadline Today!',
      message: 'Task "Finalize Dark Theme Contrast & WCAG 2.1 Audit" for FinTech Pulse is due today at 6:00 PM.',
      type: 'deadline',
      priority: 'urgent',
      timestamp: '15 minutes ago',
      read: false,
      relatedId: 'tsk-1',
      relatedType: 'task',
    },
    {
      id: 'notif-2',
      userId: 'usr-1',
      title: '📅 Project Milestone Approaching',
      message: '"Nova Design System & E-Commerce Landing" is due in 3 days. Current progress: 75%.',
      type: 'deadline',
      priority: 'high',
      timestamp: '2 hours ago',
      read: false,
      relatedId: 'prj-1',
      relatedType: 'project',
    },
    {
      id: 'notif-3',
      userId: 'usr-1',
      title: '⚠️ Overdue Invoice Alert',
      message: 'Invoice INV-2026-003 ($2,200) for EduVerse Learning is currently 3 days past due.',
      type: 'invoice',
      priority: 'high',
      timestamp: 'Yesterday',
      read: false,
      relatedId: 'inv-103',
      relatedType: 'invoice',
    },
    {
      id: 'notif-4',
      userId: 'usr-1',
      title: '💰 Payment Received & Settled',
      message: 'Sarah Jenkins from Nova Brand Studio settled Invoice INV-2026-001 ($3,500). Added to Paid Revenue.',
      type: 'invoice',
      priority: 'medium',
      timestamp: '3 days ago',
      read: true,
      relatedId: 'inv-101',
      relatedType: 'invoice',
    },
    {
      id: 'notif-5',
      userId: 'usr-1',
      title: '🤝 Phase 2 Proposal Requested',
      message: 'Clara Oswald from BioHealth Solutions requested a proposal review for Telemedicine Video MVP.',
      type: 'client',
      priority: 'low',
      timestamp: '4 days ago',
      read: true,
      relatedId: 'cli-5',
      relatedType: 'client',
    },
  ],
};

// Demo Identification Sets
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

export function isDemoSeedEntity(item) {
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

// Deterministic user ID generator based on email
export const getDeterministicUserId = (email) => {
  const norm = (email || '').trim().toLowerCase();
  if (!norm) return 'usr-1';
  if (norm === 'demo@meplus.io' || norm === 'usr-demo') return 'usr-demo';
  if (norm === 'alex.rivera@gmail.com' || norm === 'usr-1') return 'usr-1';
  return `usr_${norm.replace(/[^a-z0-9]/g, '_')}`;
};

// Initialize DB file if not exists
export const initDb = () => {
  if (inMemoryDb) return;

  // Load bundled seed or bundled db.json if available
  let seedToUse = initialSeed;
  try {
    if (fs.existsSync(BUNDLED_DB_FILE)) {
      const raw = fs.readFileSync(BUNDLED_DB_FILE, 'utf-8');
      seedToUse = JSON.parse(raw);
    }
  } catch {
    seedToUse = initialSeed;
  }

  if (isServerless) {
    try {
      if (!fs.existsSync(DB_FILE)) {
        fs.writeFileSync(DB_FILE, JSON.stringify(seedToUse, null, 2), 'utf-8');
      }
      const raw = fs.readFileSync(DB_FILE, 'utf-8');
      inMemoryDb = JSON.parse(raw);
    } catch {
      inMemoryDb = JSON.parse(JSON.stringify(seedToUse));
    }
    return;
  }

  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    if (!fs.existsSync(DB_FILE)) {
      fs.writeFileSync(DB_FILE, JSON.stringify(seedToUse, null, 2), 'utf-8');
    }
  } catch {
    inMemoryDb = JSON.parse(JSON.stringify(seedToUse));
  }
};

// Read whole DB
export const readDb = () => {
  initDb();
  if (inMemoryDb) return inMemoryDb;
  try {
    const raw = fs.readFileSync(DB_FILE, 'utf-8');
    const parsed = JSON.parse(raw);
    if (!parsed.users) {
      parsed.users = initialSeed.users;
    }
    return parsed;
  } catch (error) {
    return inMemoryDb || initialSeed;
  }
};

// Write whole DB
export const writeDb = (data) => {
  inMemoryDb = data;
  try {
    initDb();
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf-8');
  } catch (err) {
    // Graceful fallback for read-only environments
    console.warn('[Storage] File write skipped (in-memory store retained):', err.message);
  }
};

// Collection helpers
export const getCollection = (collectionName, userId) => {
  const db = readDb();
  const items = db[collectionName] || [];
  if (!userId) return items;
  // If demo account (usr-1 or usr-demo), allow access to demo seed items
  const isDemo = userId === 'usr-1' || userId === 'usr-demo';
  if (isDemo) {
    return items.filter(item => item.userId === 'usr-1' || item.userId === 'usr-demo' || !item.userId);
  }
  // Real registered users strictly receive only their own non-demo items
  return items.filter(item => item.userId === userId && !isDemoSeedEntity(item));
};

export const saveCollection = (collectionName, items) => {
  const db = readDb();
  db[collectionName] = items;
  writeDb(db);
  return items;
};

export const resetDbToSeed = () => {
  writeDb(initialSeed);
  return initialSeed;
};

