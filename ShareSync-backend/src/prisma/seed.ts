import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const userId = process.env.SEED_USER_ID;
  if (!userId) {
    console.log('Set SEED_USER_ID');
    return;
  }

  await prisma.habitsPrefs.upsert({
    where: { userId },
    create: {
      userId,
      workdays: [1,2,3,4,5],
      workStart: '09:00',
      workEnd: '17:00',
      quietStart: '22:00',
      quietEnd: '07:00',
      nudgeSprint: true,
      nudgeUpdate: true,
      nudgeConvert: true,
      weeklyDay: 5,
      weeklyTime: '16:00',
    },
    update: {},
  });

  console.log(`Seeded habits prefs for ${userId}`);
}
main().finally(() => prisma.$disconnect());
