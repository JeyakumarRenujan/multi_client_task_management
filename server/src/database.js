import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

import {
  readDb,
  writeDb,
  getCollection,
  saveCollection,
  resetDbToSeed,
  initialSeed,
  isDemoSeedEntity,
  getDeterministicUserId,
} from './db.js';

import { UserModel } from './models/User.js';
import { ClientModel } from './models/Client.js';
import { ProjectModel } from './models/Project.js';
import { TaskModel } from './models/Task.js';
import { TimeEntryModel } from './models/TimeEntry.js';
import { InvoiceModel } from './models/Invoice.js';
import { NotificationModel } from './models/Notification.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../../.env') });

let isMongoConnected = false;

/**
 * Initialize Database Connection
 * Tries external MongoDB first; falls back to embedded JSON store if unavailable or unconfigured.
 */
export async function initDatabase() {
  const uri = process.env.MONGODB_URI;

  if (uri && uri.trim()) {
    try {
      console.log(`🍃 [Database] Attempting connection to external MongoDB...`);
      await mongoose.connect(uri.trim(), {
        serverSelectionTimeoutMS: 5000,
      });
      isMongoConnected = true;
      console.log(`🍃 [MongoDB] Connected successfully to external database: ${mongoose.connection.host}`);

      // Check if DB is fresh/empty; if so, auto-seed with initialSeed
      const userCount = await UserModel.countDocuments();
      if (userCount === 0) {
        console.log(`🌱 [MongoDB] Empty database detected. Auto-seeding initial demo data...`);
        await seedMongoFromSeed(initialSeed);
        console.log(`✅ [MongoDB] Auto-seeding complete.`);
      }
      return { mode: 'mongodb', host: mongoose.connection.host };
    } catch (err) {
      isMongoConnected = false;
      console.warn(`⚠️  [MongoDB] Connection failed: ${err.message}`);
      console.warn(`📦 [Database] Resilient Fallback: Active database is local Embedded JSON store.`);
      return { mode: 'json_fallback', error: err.message };
    }
  } else {
    isMongoConnected = false;
    console.log(`📦 [Database] Running with Embedded JSON store (server/data/db.json).`);
    console.log(`💡 [Tip] To connect to MongoDB, set MONGODB_URI in .env`);
    return { mode: 'json' };
  }
}

export function isMongoActive() {
  return isMongoConnected && mongoose.connection.readyState === 1;
}

/**
 * Seed MongoDB with provided seed data
 */
export async function seedMongoFromSeed(seedData = initialSeed) {
  if (!isMongoActive()) return false;

  await Promise.all([
    UserModel.deleteMany({}),
    ClientModel.deleteMany({}),
    ProjectModel.deleteMany({}),
    TaskModel.deleteMany({}),
    TimeEntryModel.deleteMany({}),
    InvoiceModel.deleteMany({}),
    NotificationModel.deleteMany({}),
  ]);

  if (seedData.users?.length) await UserModel.insertMany(seedData.users);
  if (seedData.clients?.length) await ClientModel.insertMany(seedData.clients);
  if (seedData.projects?.length) await ProjectModel.insertMany(seedData.projects);
  if (seedData.tasks?.length) await TaskModel.insertMany(seedData.tasks);
  if (seedData.timeEntries?.length) await TimeEntryModel.insertMany(seedData.timeEntries);
  if (seedData.invoices?.length) await InvoiceModel.insertMany(seedData.invoices);
  if (seedData.notifications?.length) await NotificationModel.insertMany(seedData.notifications);

  return true;
}

// -------------------------------------------------------------
// USER OPERATIONS
// -------------------------------------------------------------
export async function findUserByEmail(email) {
  const norm = (email || '').trim().toLowerCase();
  if (isMongoActive()) {
    return await UserModel.findOne({ email: norm }).lean();
  }
  const db = readDb();
  const users = db.users || [];
  return users.find(u => u.email.toLowerCase() === norm) || null;
}

export async function findUserById(id) {
  if (isMongoActive()) {
    return await UserModel.findOne({ id }).lean();
  }
  const db = readDb();
  const users = db.users || [];
  return users.find(u => u.id === id) || null;
}

export async function createUser(userData) {
  if (isMongoActive()) {
    const doc = new UserModel(userData);
    await doc.save();
    return doc.toJSON();
  }
  const db = readDb();
  const users = db.users || [];
  users.push(userData);
  db.users = users;
  writeDb(db);
  return userData;
}

export async function updateUser(targetIdOrEmail, updates) {
  if (isMongoActive()) {
    const filter = targetIdOrEmail.includes('@')
      ? { email: targetIdOrEmail.trim().toLowerCase() }
      : { id: targetIdOrEmail };
    const doc = await UserModel.findOneAndUpdate(filter, { $set: updates }, { new: true }).lean();
    return doc;
  }
  const db = readDb();
  const users = db.users || [];
  const idx = users.findIndex(
    u => u.id === targetIdOrEmail || u.email.toLowerCase() === targetIdOrEmail.trim().toLowerCase()
  );
  if (idx !== -1) {
    users[idx] = { ...users[idx], ...updates };
    db.users = users;
    writeDb(db);
    return users[idx];
  }
  return null;
}

// -------------------------------------------------------------
// CLIENT OPERATIONS
// -------------------------------------------------------------
export async function getClients(userId) {
  if (isMongoActive()) {
    const isDemo = userId === 'usr-1' || userId === 'usr-demo';
    const filter = isDemo
      ? { userId: { $in: ['usr-1', 'usr-demo'] } }
      : { userId };
    const items = await ClientModel.find(filter).sort({ createdAt: -1 }).lean();
    if (!isDemo) {
      return items.filter(item => !isDemoSeedEntity(item));
    }
    return items;
  }
  return getCollection('clients', userId);
}

export async function createClient(clientData) {
  if (isMongoActive()) {
    await ClientModel.updateOne({ id: clientData.id }, clientData, { upsert: true });
    return clientData;
  }
  const clients = getCollection('clients');
  const idx = clients.findIndex(c => c.id === clientData.id);
  if (idx >= 0) {
    clients[idx] = clientData;
  } else {
    clients.unshift(clientData);
  }
  saveCollection('clients', clients);
  return clientData;
}

export async function updateClient(id, updates) {
  if (isMongoActive()) {
    const updated = await ClientModel.findOneAndUpdate({ id }, { $set: updates }, { new: true }).lean();
    return updated;
  }
  const clients = getCollection('clients');
  const idx = clients.findIndex(c => c.id === id);
  if (idx === -1) return null;
  clients[idx] = { ...clients[idx], ...updates };
  saveCollection('clients', clients);
  return clients[idx];
}

export async function deleteClient(id) {
  if (isMongoActive()) {
    await Promise.all([
      ClientModel.deleteOne({ id }),
      ProjectModel.deleteMany({ clientId: id }),
      TaskModel.deleteMany({ clientId: id }),
      InvoiceModel.deleteMany({ clientId: id }),
      TimeEntryModel.deleteMany({ clientId: id }),
    ]);
    return { success: true, id };
  }
  // Cascading deletion in JSON store
  let clients = getCollection('clients').filter(c => c.id !== id);
  let projects = getCollection('projects').filter(p => p.clientId !== id);
  let tasks = getCollection('tasks').filter(t => t.clientId !== id);
  let invoices = getCollection('invoices').filter(i => i.clientId !== id);
  let timeEntries = getCollection('timeEntries').filter(te => te.clientId !== id);

  saveCollection('clients', clients);
  saveCollection('projects', projects);
  saveCollection('tasks', tasks);
  saveCollection('invoices', invoices);
  saveCollection('timeEntries', timeEntries);
  return { success: true, id };
}

// -------------------------------------------------------------
// PROJECT OPERATIONS
// -------------------------------------------------------------
export async function getProjects(userId) {
  if (isMongoActive()) {
    const isDemo = userId === 'usr-1' || userId === 'usr-demo';
    const filter = isDemo
      ? { userId: { $in: ['usr-1', 'usr-demo'] } }
      : { userId };
    const items = await ProjectModel.find(filter).sort({ createdAt: -1 }).lean();
    if (!isDemo) {
      return items.filter(item => !isDemoSeedEntity(item));
    }
    return items;
  }
  return getCollection('projects', userId);
}

export async function createProject(projectData) {
  if (isMongoActive()) {
    await ProjectModel.updateOne({ id: projectData.id }, projectData, { upsert: true });
    return projectData;
  }
  const projects = getCollection('projects');
  const idx = projects.findIndex(p => p.id === projectData.id);
  if (idx >= 0) {
    projects[idx] = projectData;
  } else {
    projects.unshift(projectData);
  }
  saveCollection('projects', projects);
  return projectData;
}

export async function updateProject(id, updates) {
  if (isMongoActive()) {
    const updated = await ProjectModel.findOneAndUpdate({ id }, { $set: updates }, { new: true }).lean();
    return updated;
  }
  const projects = getCollection('projects');
  const idx = projects.findIndex(p => p.id === id);
  if (idx === -1) return null;
  projects[idx] = { ...projects[idx], ...updates };
  saveCollection('projects', projects);
  return projects[idx];
}

export async function deleteProject(id) {
  if (isMongoActive()) {
    await Promise.all([
      ProjectModel.deleteOne({ id }),
      TaskModel.deleteMany({ projectId: id }),
      TimeEntryModel.deleteMany({ projectId: id }),
    ]);
    return { success: true, id };
  }
  let projects = getCollection('projects').filter(p => p.id !== id);
  let tasks = getCollection('tasks').filter(t => t.projectId !== id);
  let timeEntries = getCollection('timeEntries').filter(te => te.projectId !== id);

  saveCollection('projects', projects);
  saveCollection('tasks', tasks);
  saveCollection('timeEntries', timeEntries);
  return { success: true, id };
}

// -------------------------------------------------------------
// TASK OPERATIONS
// -------------------------------------------------------------
export async function getTasks(userId) {
  if (isMongoActive()) {
    const isDemo = userId === 'usr-1' || userId === 'usr-demo';
    const filter = isDemo
      ? { userId: { $in: ['usr-1', 'usr-demo'] } }
      : { userId };
    const items = await TaskModel.find(filter).sort({ createdAt: -1 }).lean();
    if (!isDemo) {
      return items.filter(item => !isDemoSeedEntity(item));
    }
    return items;
  }
  return getCollection('tasks', userId);
}

export async function createTask(taskData) {
  if (isMongoActive()) {
    await TaskModel.updateOne({ id: taskData.id }, taskData, { upsert: true });
    return taskData;
  }
  const tasks = getCollection('tasks');
  const idx = tasks.findIndex(t => t.id === taskData.id);
  if (idx >= 0) {
    tasks[idx] = taskData;
  } else {
    tasks.unshift(taskData);
  }
  saveCollection('tasks', tasks);
  return taskData;
}

export async function updateTask(id, updates) {
  if (isMongoActive()) {
    const updated = await TaskModel.findOneAndUpdate({ id }, { $set: updates }, { new: true }).lean();
    return updated;
  }
  const tasks = getCollection('tasks');
  const idx = tasks.findIndex(t => t.id === id);
  if (idx === -1) return null;
  tasks[idx] = { ...tasks[idx], ...updates };
  saveCollection('tasks', tasks);
  return tasks[idx];
}

export async function deleteTask(id) {
  if (isMongoActive()) {
    await TaskModel.deleteOne({ id });
    return { success: true, id };
  }
  let tasks = getCollection('tasks').filter(t => t.id !== id);
  saveCollection('tasks', tasks);
  return { success: true, id };
}

// -------------------------------------------------------------
// TIME ENTRY OPERATIONS
// -------------------------------------------------------------
export async function getTimeEntries(userId) {
  if (isMongoActive()) {
    const isDemo = userId === 'usr-1' || userId === 'usr-demo';
    const filter = isDemo
      ? { userId: { $in: ['usr-1', 'usr-demo'] } }
      : { userId };
    const items = await TimeEntryModel.find(filter).sort({ date: -1 }).lean();
    if (!isDemo) {
      return items.filter(item => !isDemoSeedEntity(item));
    }
    return items;
  }
  return getCollection('timeEntries', userId);
}

export async function createTimeEntry(entryData) {
  if (isMongoActive()) {
    await TimeEntryModel.updateOne({ id: entryData.id }, entryData, { upsert: true });
    return entryData;
  }
  const entries = getCollection('timeEntries');
  const idx = entries.findIndex(t => t.id === entryData.id);
  if (idx >= 0) {
    entries[idx] = entryData;
  } else {
    entries.unshift(entryData);
  }
  saveCollection('timeEntries', entries);
  return entryData;
}

export async function deleteTimeEntry(id) {
  if (isMongoActive()) {
    await TimeEntryModel.deleteOne({ id });
    return { success: true, id };
  }
  let entries = getCollection('timeEntries').filter(t => t.id !== id);
  saveCollection('timeEntries', entries);
  return { success: true, id };
}

// -------------------------------------------------------------
// INVOICE OPERATIONS
// -------------------------------------------------------------
export async function getInvoices(userId) {
  if (isMongoActive()) {
    const isDemo = userId === 'usr-1' || userId === 'usr-demo';
    const filter = isDemo
      ? { userId: { $in: ['usr-1', 'usr-demo'] } }
      : { userId };
    const items = await InvoiceModel.find(filter).sort({ issueDate: -1 }).lean();
    if (!isDemo) {
      return items.filter(item => !isDemoSeedEntity(item));
    }
    return items;
  }
  return getCollection('invoices', userId);
}

export async function createInvoice(invoiceData) {
  if (isMongoActive()) {
    await InvoiceModel.updateOne({ id: invoiceData.id }, invoiceData, { upsert: true });
    return invoiceData;
  }
  const invoices = getCollection('invoices');
  const idx = invoices.findIndex(i => i.id === invoiceData.id);
  if (idx >= 0) {
    invoices[idx] = invoiceData;
  } else {
    invoices.unshift(invoiceData);
  }
  saveCollection('invoices', invoices);
  return invoiceData;
}

export async function updateInvoice(id, updates) {
  if (isMongoActive()) {
    const updated = await InvoiceModel.findOneAndUpdate({ id }, { $set: updates }, { new: true }).lean();
    return updated;
  }
  const invoices = getCollection('invoices');
  const idx = invoices.findIndex(i => i.id === id);
  if (idx === -1) return null;
  invoices[idx] = { ...invoices[idx], ...updates };
  saveCollection('invoices', invoices);
  return invoices[idx];
}

export async function deleteInvoice(id) {
  if (isMongoActive()) {
    await InvoiceModel.deleteOne({ id });
    return { success: true, id };
  }
  let invoices = getCollection('invoices').filter(i => i.id !== id);
  saveCollection('invoices', invoices);
  return { success: true, id };
}

// -------------------------------------------------------------
// NOTIFICATION OPERATIONS
// -------------------------------------------------------------
export async function getNotifications(userId) {
  if (isMongoActive()) {
    const filter = userId ? { userId } : {};
    return await NotificationModel.find(filter).sort({ createdAt: -1 }).lean();
  }
  return getCollection('notifications', userId);
}

export async function createNotification(notifData) {
  if (isMongoActive()) {
    const doc = new NotificationModel(notifData);
    await doc.save();
    return doc.toJSON();
  }
  const notifs = getCollection('notifications');
  notifs.unshift(notifData);
  saveCollection('notifications', notifs);
  return notifData;
}

export async function markNotificationRead(id) {
  if (isMongoActive()) {
    await NotificationModel.updateOne({ id }, { $set: { read: true } });
    return { success: true };
  }
  const notifs = getCollection('notifications');
  const item = notifs.find(n => n.id === id);
  if (item) item.read = true;
  saveCollection('notifications', notifs);
  return { success: true };
}

export async function deleteNotifications(userId) {
  if (isMongoActive()) {
    const filter = userId ? { userId } : {};
    await NotificationModel.deleteMany(filter);
    return { success: true };
  }
  let notifs = getCollection('notifications');
  if (userId) {
    notifs = notifs.filter(n => n.userId !== userId);
  } else {
    notifs = [];
  }
  saveCollection('notifications', notifs);
  return { success: true };
}

// -------------------------------------------------------------
// DATABASE RESET
// -------------------------------------------------------------
export async function resetDatabase() {
  if (isMongoActive()) {
    await seedMongoFromSeed(initialSeed);
    return { success: true, mode: 'mongodb' };
  }
  const data = resetDbToSeed();
  return { success: true, mode: 'json', data };
}
