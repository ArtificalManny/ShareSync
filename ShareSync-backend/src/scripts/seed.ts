// src/scripts/seed.ts
// ═══════════════════════════════════════════════════════════════════════════════
// COMPLETE DATABASE SEED SCRIPT - FIXED VERSION (Sprint meta + Task ceremonyTier)
// ═══════════════════════════════════════════════════════════════════════════════

import mongoose from 'mongoose';
import * as bcrypt from 'bcrypt';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/sharesync';

async function seed() {
  console.log('🔌 Connecting to MongoDB...');
  console.log(`   URI: ${MONGODB_URI.replace(/\/\/.*@/, '//***@')}`);

  await mongoose.connect(MONGODB_URI);

  const db = mongoose.connection;

  while (!db.db) {
    await new Promise((resolve) => setTimeout(resolve, 100));
  }

  const nativeDb = db.db;
  console.log('✅ Connected\n');

  const now = new Date();
  const { Types } = mongoose;

  // ═══════════════════════════════════════════════════════════════
  // STEP 1: Clear ALL existing data
  // ═══════════════════════════════════════════════════════════════
  console.log('🗑️  Clearing existing data...');
  const collections = [
    'users',
    'userstats',
    'projects',
    'tasks',
    'sprints',
    'badges',
    'halloffameentries',
    'ceremonies',
    'notifications',
    'messages',
    'conversations',
    'calendarevents',
    'focussessions',
  ];

  for (const col of collections) {
    try {
      const result = await nativeDb.collection(col).deleteMany({});
      if (result.deletedCount > 0) {
        console.log(`   ✓ Cleared ${col} (${result.deletedCount} docs)`);
      }
    } catch (e) {
      // Collection might not exist - that's fine
    }
  }
  console.log('');

  // ═══════════════════════════════════════════════════════════════
  // STEP 2: Create Demo User
  // ═══════════════════════════════════════════════════════════════
  console.log('👤 Creating demo user...');
  const userId = new Types.ObjectId();
  const hashedPassword = await bcrypt.hash('demo123', 10);

  await nativeDb.collection('users').insertOne({
    _id: userId,
    email: 'demo@sharesync.io',
    password: hashedPassword,
    firstName: 'Demo',
    lastName: 'User',
    displayName: 'Demo User',
    username: 'demo',
    avatar: null,
    role: 'user',
    roles: ['user'],
    isEmailVerified: true,
    isActive: true,
    preferences: {
      theme: 'dark',
      notifications: { email: true, push: true, inApp: true },
      defaultProjectView: 'stack',
    },
    onboardingCompleted: true,
    lastActiveAt: now,
    createdAt: now,
    updatedAt: now,
  });
  console.log(`   ✅ User created: demo@sharesync.io`);
  console.log(`   📌 User ID: ${userId.toString()}\n`);

  // ═══════════════════════════════════════════════════════════════
  // STEP 3: Create User Stats (CRITICAL for gamification)
  // ═══════════════════════════════════════════════════════════════
  console.log('📊 Creating user stats...');
  await nativeDb.collection('userstats').insertOne({
    _id: new Types.ObjectId(),
    userId: userId,

    // XP & Level
    totalXP: 0,
    level: 1,
    levelProgress: 0,
    xpToNextLevel: 100,
    todayXP: 0,
    weeklyXP: 0,
    monthlyXP: 0,
    xpHistory: [],

    // Streak (nested object)
    streak: {
      currentStreak: 0,
      longestStreak: 0,
      freezesAvailable: 1,
      freezesUsed: 0,
      activeDays: [],
      atRisk: false,
      milestones: [],
      lastActivityDate: null,
    },

    // Badges
    earnedBadges: [],
    showcaseBadges: [],

    // Task Counters
    tasksCompleted: 0,
    tasksCompletedToday: 0,
    tasksCompletedThisWeek: 0,
    tasksCompletedOnTime: 0,
    blockingTasksCompleted: 0,
    focusTasksCompleted: 0,
    earlyTasks: 0,
    lateTasks: 0,

    // Project Counters
    projectsCompleted: 0,
    sprintsCompleted: 0,
    shipsCount: 0,
    legendaryShipsCount: 0,

    // Bonus Counters
    bonusesEarned: 0,
    multipliersTriggered: 0,
    legendaryHits: 0,

    // Social
    messagesSent: 0,
    collaborators: [],

    // Focus
    totalFocusMinutes: 0,
    todayFocusMinutes: 0,
    focusSessions: [],
    dailyStats: [],

    createdAt: now,
    updatedAt: now,
  });
  console.log('   ✅ User stats created (Level 1, 0 XP)\n');

  // ═══════════════════════════════════════════════════════════════
  // STEP 4: Create Project
  // ═══════════════════════════════════════════════════════════════
  console.log('📁 Creating project...');
  const projectId = new Types.ObjectId();

  await nativeDb.collection('projects').insertOne({
    _id: projectId,
    name: 'ShareSync v2',
    description: 'Momentum-based project management platform',
    emoji: '🚀',
    color: '#8B5CF6',
    status: 'active',
    visibility: 'private',
    privacy: 'private',

    // Owner & Members
    ownerId: userId,
    owner: userId,
    members: [
      {
        userId: userId,
        user: userId,
        role: 'owner',
        joinedAt: now,
        permissions: ['all'],
      },
    ],

    settings: {
      defaultView: 'stack',
      enableGamification: true,
      enableAI: true,
    },

    // Metrics
    metrics: {
      momentum: 0,
      velocity: 0,
      totalTasks: 5,
      completedTasks: 0,
      totalXP: 0,
      lastActivityAt: now,
      weeklyShips: 0,
      momentumTrend: 0,
    },
    momentum: 0,
    totalTasks: 5,
    completedTasks: 0,

    // Flags
    isStarred: false,
    isArchived: false,

    goals: [],
    invites: [],
    tags: [],

    createdAt: now,
    updatedAt: now,
  });
  console.log(`   ✅ Project created: ShareSync v2`);
  console.log(`   📌 Project ID: ${projectId.toString()}\n`);

  // ═══════════════════════════════════════════════════════════════
  // STEP 5: Create Tasks
  // ═══════════════════════════════════════════════════════════════
  console.log('📋 Creating tasks...');

  const tasksData = [
    {
      title: 'Fix authentication timeout bug',
      description: 'Users getting logged out after 15 minutes - need to extend JWT expiry',
      priority: 'critical',
      isBlocking: true,
      storyPoints: 5,
      days: 1,
      tags: ['bug', 'auth', 'critical'],
      xpValue: 75,
    },
    {
      title: 'Merge momentum engine feature',
      description: 'Complete the momentum calculation system and merge to main',
      priority: 'high',
      isBlocking: true,
      storyPoints: 8,
      days: 2,
      tags: ['feature', 'momentum'],
      xpValue: 50,
    },
    {
      title: 'Update API documentation',
      description: 'Document all Phase 5 endpoints in Swagger',
      priority: 'medium',
      isBlocking: false,
      storyPoints: 3,
      days: 5,
      tags: ['docs', 'api'],
      xpValue: 25,
    },
    {
      title: 'Design new onboarding flow',
      description: 'Create wireframes for first-time user experience',
      priority: 'high',
      isBlocking: false,
      storyPoints: 5,
      days: 7,
      tags: ['design', 'ux'],
      xpValue: 40,
    },
    {
      title: 'Performance optimization',
      description: 'Reduce bundle size and implement code splitting',
      priority: 'medium',
      isBlocking: false,
      storyPoints: 5,
      days: 10,
      tags: ['performance', 'optimization'],
      xpValue: 25,
    },
  ];

  const taskIds: mongoose.Types.ObjectId[] = [];

  for (let i = 0; i < tasksData.length; i++) {
    const t = tasksData[i];
    const taskId = new Types.ObjectId();
    taskIds.push(taskId);

    await nativeDb.collection('tasks').insertOne({
      _id: taskId,
      projectId: projectId,

      // Basic info
      title: t.title,
      description: t.description,
      status: 'todo',
      priority: t.priority,

      // Assignment
      assigneeId: userId,
      assignee: userId,
      reporterId: userId,
      reporter: userId,
      createdBy: userId,

      // Scheduling
      dueDate: new Date(Date.now() + t.days * 24 * 60 * 60 * 1000),

      // Gamification
      storyPoints: t.storyPoints,
      xpValue: t.xpValue,
      isBlocking: t.isBlocking,
      blockingCount: t.isBlocking ? 1 : 0,

      // Metadata
      tags: t.tags,
      labels: {},
      order: i,
      stackOrder: i,

      // Arrays
      attachments: [],
      comments: [],
      timeLogs: [],
      blockedBy: [],
      blocks: [],
      subtasks: [],

      // Completion
      completedAt: null,
      completedBy: null,
      bonusXP: 0,
      isLegendary: false,

      // ✅ IMPORTANT: do NOT seed ceremonyTier as null (schema expects enum string)
      ceremonyTier: 'standard',

      createdAt: now,
      updatedAt: now,
    });

    console.log(`   ✅ Task ${i + 1}: ${t.title.substring(0, 40)}...`);
  }
  console.log('');

  // ═══════════════════════════════════════════════════════════════
  // STEP 6: Create Sprint
  // ═══════════════════════════════════════════════════════════════
  console.log('🏃 Creating sprint...');
  const sprintId = new Types.ObjectId();
  const sprintStart = new Date();
  const sprintEnd = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000);
  const totalPoints = tasksData.reduce((sum, t) => sum + t.storyPoints, 0);

  await nativeDb.collection('sprints').insertOne({
    _id: sprintId,
    projectId: projectId,
    name: 'Sprint 1: Beta Launch',
    sprintNumber: 1,
    status: 'active',

    // Dates
    startDate: sprintStart,
    endDate: sprintEnd,
    actualStartDate: sprintStart,
    actualEndDate: null,

    // Goals
    goals: [
      { id: new Types.ObjectId().toString(), description: 'Complete Beta Launch', isAchieved: false, progress: 0 },
      { id: new Types.ObjectId().toString(), description: 'API v2 Complete', isAchieved: false, progress: 0 },
      { id: new Types.ObjectId().toString(), description: 'Documentation Updated', isAchieved: false, progress: 0 },
    ],

    // Tasks
    taskIds: taskIds,

    // Team
    capacityHours: 40,
    teamMembers: [userId],

    // Metrics
    metrics: {
      plannedPoints: totalPoints,
      completedPoints: 0,
      plannedTasks: tasksData.length,
      completedTasks: 0,
      addedPoints: 0,
      addedTasks: 0,
      removedPoints: 0,
      velocity: 0,
      capacityUtilization: 0,
      avgTaskCompletionTime: 0,
      blockedTaskCount: 2,
    },

    // Burndown
    burndown: [
      {
        date: sprintStart,
        remainingPoints: totalPoints,
        remainingTasks: tasksData.length,
        completedPoints: 0,
        completedTasks: 0,
        addedPoints: 0,
        addedTasks: 0,
      },
    ],

    // ✅ Additive: meta snapshots (safe / optional)
    burndownMeta: {
      lastCalculatedAt: now,
      projectedCompletion: null,
      projectedDaysRemaining: 0,
    },

    retrospective: null,

    // ✅ Additive: empty retro summary (safe / optional)
    retrospectiveSummary: {
      summary: '',
      keyWins: [],
      keyRisks: [],
    },

    createdBy: userId,
    createdAt: now,
    updatedAt: now,
  });
  console.log(`   ✅ Sprint created: Sprint 1: Beta Launch\n`);

  // ═══════════════════════════════════════════════════════════════
  // STEP 7: Create Badge Definitions
  // ═══════════════════════════════════════════════════════════════
  console.log('�� Creating badges...');
  const badges = [
    { id: 'first_task', name: 'First Steps', description: 'Complete your first task', icon: '🎯', category: 'milestone', rarity: 'common', xpReward: 50, criteria: { type: 'tasks_completed', count: 1 } },
    { id: 'task_10', name: 'Getting Started', description: 'Complete 10 tasks', icon: '✅', category: 'milestone', rarity: 'common', xpReward: 100, criteria: { type: 'tasks_completed', count: 10 } },
    { id: 'task_50', name: 'Productive', description: 'Complete 50 tasks', icon: '🏆', category: 'milestone', rarity: 'uncommon', xpReward: 250, criteria: { type: 'tasks_completed', count: 50 } },
    { id: 'task_100', name: 'Centurion', description: 'Complete 100 tasks', icon: '💯', category: 'milestone', rarity: 'rare', xpReward: 500, criteria: { type: 'tasks_completed', count: 100 } },
    { id: 'streak_3', name: 'Consistent', description: 'Maintain a 3-day streak', icon: '🔥', category: 'streak', rarity: 'common', xpReward: 100, criteria: { type: 'streak', count: 3 } },
    { id: 'streak_7', name: 'Week Warrior', description: 'Maintain a 7-day streak', icon: '⚡', category: 'streak', rarity: 'rare', xpReward: 250, criteria: { type: 'streak', count: 7 } },
    { id: 'streak_30', name: 'Momentum Master', description: 'Maintain a 30-day streak', icon: '🌟', category: 'streak', rarity: 'legendary', xpReward: 1000, criteria: { type: 'streak', count: 30 } },
    { id: 'early_bird', name: 'Early Bird', description: 'Complete 5 tasks before 9 AM', icon: '🌅', category: 'time', rarity: 'uncommon', xpReward: 150, criteria: { type: 'early_tasks', count: 5 } },
    { id: 'blocker_buster', name: 'Blocker Buster', description: 'Complete 10 blocking tasks', icon: '💥', category: 'impact', rarity: 'rare', xpReward: 300, criteria: { type: 'blocking_tasks', count: 10 } },
    { id: 'focus_champion', name: 'Focus Champion', description: 'Complete 20 focus sessions', icon: '🧘', category: 'focus', rarity: 'rare', xpReward: 350, criteria: { type: 'focus_sessions', count: 20 } },
  ];

  for (const badge of badges) {
    await nativeDb.collection('badges').insertOne({
      _id: new Types.ObjectId(),
      ...badge,
      isActive: true,
      createdAt: now,
    });
  }
  console.log(`   ✅ Created ${badges.length} badge definitions\n`);

  // ═══════════════════════════════════════════════════════════════
  // VERIFICATION
  // ═══════════════════════════════════════════════════════════════
  console.log('🔍 Verifying seed data...');

  const userCount = await nativeDb.collection('users').countDocuments();
  const statsCount = await nativeDb.collection('userstats').countDocuments();
  const projectCount = await nativeDb.collection('projects').countDocuments();
  const taskCount = await nativeDb.collection('tasks').countDocuments();
  const sprintCount = await nativeDb.collection('sprints').countDocuments();
  const badgeCount = await nativeDb.collection('badges').countDocuments();

  console.log(`   Users: ${userCount}`);
  console.log(`   UserStats: ${statsCount}`);
  console.log(`   Projects: ${projectCount}`);
  console.log(`   Tasks: ${taskCount}`);
  console.log(`   Sprints: ${sprintCount}`);
  console.log(`   Badges: ${badgeCount}`);

  // ═══════════════════════════════════════════════════════════════
  // DONE
  // ═══════════════════════════════════════════════════════════════
  console.log('\n═══════════════════════════════════════════════════════════════');
  console.log('                    ✅ SEED COMPLETE!');
  console.log('═══════════════════════════════════════════════════════════════\n');
  console.log('Login Credentials:');
  console.log('   📧 Email:    demo@sharesync.io');
  console.log('   🔑 Password: demo123\n');
  console.log('Starting State:');
  console.log('   📊 Level: 1');
  console.log('   ⚡ XP: 0');
  console.log('   🔥 Streak: 0 days');
  console.log('   📁 Projects: 1 (ShareSync v2)');
  console.log('   📋 Tasks: 5 (all TODO status)\n');
  console.log('User ID (for debugging):');
  console.log(`   ${userId.toString()}\n`);

  await mongoose.disconnect();
  console.log('🔌 Disconnected from MongoDB\n');
}

seed().catch((err) => {
  console.error('❌ Seed failed:', err);
  process.exit(1);
});
