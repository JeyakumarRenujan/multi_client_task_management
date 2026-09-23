import dns from 'dns';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { resetDbToSeed } from '../src/db.js';

try {
  dns.setServers(['8.8.8.8', '1.1.1.1']);
} catch {
  // ignore
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../../.env') });

const DEMO_EMAILS = ['alex.rivera@gmail.com', 'demo@meplus.io'];
const DEMO_USER_IDS = ['usr-1', 'usr-demo'];

async function cleanAccounts() {
  console.log('🧹 [Cleanup] Starting purge of non-demo accounts...');

  // 1. Reset local db.json to initial demo seed
  console.log('📁 [JSON Store] Resetting server/data/db.json to clean demo seed...');
  resetDbToSeed();
  console.log('✅ [JSON Store] server/data/db.json has been reset to demo seed.');

  // 2. Clean MongoDB Atlas
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.warn('⚠️ MONGODB_URI not found. Skipping MongoDB cleanup.');
    process.exit(0);
  }

  console.log('🍃 [MongoDB] Connecting to MongoDB Atlas...');
  await mongoose.connect(uri);
  const db = mongoose.connection.db;

  // Users
  const userRes = await db.collection('users').deleteMany({
    email: { $nin: DEMO_EMAILS },
  });
  console.log(`✅ [MongoDB] Removed ${userRes.deletedCount} non-demo user accounts.`);

  // Clients
  const clientRes = await db.collection('clients').deleteMany({
    userId: { $nin: DEMO_USER_IDS },
  });
  console.log(`✅ [MongoDB] Removed ${clientRes.deletedCount} non-demo client records.`);

  // Projects
  const projectRes = await db.collection('projects').deleteMany({
    userId: { $nin: DEMO_USER_IDS },
  });
  console.log(`✅ [MongoDB] Removed ${projectRes.deletedCount} non-demo project records.`);

  // Tasks
  const taskRes = await db.collection('tasks').deleteMany({
    userId: { $nin: DEMO_USER_IDS },
  });
  console.log(`✅ [MongoDB] Removed ${taskRes.deletedCount} non-demo task records.`);

  // Time Entries
  const timeRes = await db.collection('timeentries').deleteMany({
    userId: { $nin: DEMO_USER_IDS },
  });
  console.log(`✅ [MongoDB] Removed ${timeRes.deletedCount} non-demo time entries.`);

  // Invoices
  const invRes = await db.collection('invoices').deleteMany({
    userId: { $nin: DEMO_USER_IDS },
  });
  console.log(`✅ [MongoDB] Removed ${invRes.deletedCount} non-demo invoices.`);

  // Notifications
  const notifRes = await db.collection('notifications').deleteMany({
    userId: { $nin: DEMO_USER_IDS },
  });
  console.log(`✅ [MongoDB] Removed ${notifRes.deletedCount} non-demo notifications.`);

  // OTPs
  const otpRes = await db.collection('otps').deleteMany({});
  console.log(`✅ [MongoDB] Cleared ${otpRes.deletedCount} old OTP records.`);

  // Inspect remaining users
  const remainingUsers = await db.collection('users').find({}).toArray();
  console.log('\n✨ [Verification] Remaining accounts in MongoDB:');
  remainingUsers.forEach(u => {
    console.log(`  - ${u.name} (${u.email}) [ID: ${u.id}]`);
  });

  await mongoose.disconnect();
  console.log('\n🎉 [Complete] All unverified accounts have been purged. Only demo accounts remain.');
  process.exit(0);
}

cleanAccounts().catch(err => {
  console.error('❌ [Cleanup Error]:', err);
  process.exit(1);
});
