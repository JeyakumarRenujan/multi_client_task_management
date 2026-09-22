import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

import { initialSeed, readDb } from '../src/db.js';
import { seedMongoFromSeed } from '../src/database.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../../.env') });

async function runSeed() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error('❌ MONGODB_URI is not defined in your .env file.');
    console.log('Please set MONGODB_URI in .env, e.g.:');
    console.log('MONGODB_URI=mongodb+srv://<username>:<password>@cluster.mongodb.net/meplus?retryWrites=true&w=majority');
    process.exit(1);
  }

  console.log('🍃 Connecting to MongoDB:', uri.split('@')[1] || uri);
  await mongoose.connect(uri);

  console.log('📥 Reading current seed / db.json data...');
  const currentDb = readDb();
  const seedData = currentDb.users?.length ? currentDb : initialSeed;

  console.log(`🌱 Seeding ${seedData.users?.length || 0} users, ${seedData.clients?.length || 0} clients, ${seedData.projects?.length || 0} projects, ${seedData.tasks?.length || 0} tasks...`);
  await seedMongoFromSeed(seedData);

  console.log('✅ Successfully seeded MongoDB database!');
  await mongoose.disconnect();
  process.exit(0);
}

runSeed().catch(err => {
  console.error('❌ Seeding failed:', err);
  process.exit(1);
});

