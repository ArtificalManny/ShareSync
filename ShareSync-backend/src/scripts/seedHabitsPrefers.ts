import mongoose from 'mongoose';
import { HabitsPrefsSchema } from '../habits/habits.schemas';

const HabitsPrefs = mongoose.model('HabitsPrefs', HabitsPrefsSchema);

async function main() {
  const MONGO = process.env.MONGO_URL || 'mongodb://localhost:27017/sharesync';
  await mongoose.connect(MONGO);

  // Seed for all users or a subset; here’s an example for one user:
  const userId = process.env.SEED_USER_ID;
  if (!userId) {
    console.log('Set SEED_USER_ID to seed a specific user.');
    process.exit(0);
  }

  await HabitsPrefs.updateOne(
    { userId },
    {
      $setOnInsert: {
        workdays: [1,2,3,4,5],
        workHours: { start: '09:00', end: '17:00' },
        quietHours: { start: '22:00', end: '07:00' },
        nudges: { sprint: true, update: true, convertTask: true },
        weeklyReminder: { day: 5, time: '16:00' },
      },
    },
    { upsert: true }
  );

  console.log(`Seeded habits prefs for user ${userId}`);
  await mongoose.disconnect();
}
main().catch((e) => { console.error(e); process.exit(1); });
