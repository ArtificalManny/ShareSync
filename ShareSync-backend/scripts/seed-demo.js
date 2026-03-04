/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * SHARESYNC DEMO SEED SCRIPT (Phase 9)
 * ═══════════════════════════════════════════════════════════════════════════════
 * Purpose: Generates a pristine, highly-active "Golden Path" database for pitches.
 * Usage: `node scripts/seed-demo.js`
 * WARNING: This clears the connected database before seeding.
 */

const mongoose = require('mongoose');
require('dotenv').config();

// Safety Check
if (process.env.NODE_ENV === 'production' && process.env.FORCE_SEED !== 'true') {
  console.error('⚠️  WARNING: Attempting to run seed script in production environment.');
  console.error('If you really want to do this, run with FORCE_SEED=true');
  process.exit(1);
}

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/sharesync';

// Dynamic schemas (strict: false) so we don't need to import exact app models
const User = mongoose.models.User || mongoose.model('User', new mongoose.Schema({}, { strict: false }));
const Project = mongoose.models.Project || mongoose.model('Project', new mongoose.Schema({}, { strict: false }));
const Task = mongoose.models.Task || mongoose.model('Task', new mongoose.Schema({}, { strict: false }));
const Activity = mongoose.models.Activity || mongoose.model('Activity', new mongoose.Schema({}, { strict: false }));

const seedData = async () => {
  try {
    console.log(`🔌 Connecting to MongoDB: ${MONGODB_URI}...`);
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected.');

    console.log('🧹 Wiping existing demo data...');
    await Promise.all([
      User.deleteMany({}),
      Project.deleteMany({}),
      Task.deleteMany({}),
      Activity.deleteMany({})
    ]);

    // ─────────────────────────────────────────────────────────────────
    // 1. Create Demo Users
    // ─────────────────────────────────────────────────────────────────
    console.log('👥 Creating users...');
    const usersData = [
      { firstName: 'Manny', lastName: 'Rivas', email: 'demo@sharesync.com', password: 'password123', role: 'admin', streakDays: 14, shipsToday: 3, xp: 4250, level: 12, archetype: 'Visionary' },
      { firstName: 'Jane', lastName: 'Chen', email: 'jane@sharesync.com', role: 'member', streakDays: 42, shipsToday: 5, xp: 8400, level: 21, archetype: 'Shipping Machine' },
      { firstName: 'Alex', lastName: 'Rivera', email: 'alex@sharesync.com', role: 'member', streakDays: 3, shipsToday: 1, xp: 1200, level: 4, archetype: 'Builder' },
      { firstName: 'Sarah', lastName: 'Jenkins', email: 'sarah@sharesync.com', role: 'member', streakDays: 8, shipsToday: 2, xp: 3100, level: 9, archetype: 'Strategist' }
    ];
    const users = await User.insertMany(usersData);
    const mainUser = users[0];

    // ─────────────────────────────────────────────────────────────────
    // 2. Create Projects
    // ─────────────────────────────────────────────────────────────────
    console.log('📁 Creating projects...');
    const projectsData = [
      { name: 'ShareSync Core', color: '#7C3AED', status: 'active', progress: 85, ownerId: mainUser._id, members: users.map(u => u._id), emoji: '🚀' },
      { name: 'Marketing Launch', color: '#F59E0B', status: 'active', progress: 40, ownerId: mainUser._id, members: [users[0]._id, users[3]._id], emoji: '📣' },
      { name: 'Mobile App Beta', color: '#2DD4BF', status: 'active', progress: 15, ownerId: users[1]._id, members: [users[0]._id, users[1]._id, users[2]._id], emoji: '📱' },
      { name: 'API v2 Upgrade', color: '#3B82F6', status: 'completed', progress: 100, ownerId: users[2]._id, members: [users[0]._id, users[2]._id], emoji: '⚡' }
    ];
    const projects = await Project.insertMany(projectsData);

    // ─────────────────────────────────────────────────────────────────
    // 3. Create Tasks (Distribution: 60% done, 25% in-progress, 15% pending)
    // ─────────────────────────────────────────────────────────────────
    console.log('✅ Creating tasks...');
    const tasksData = [];
    const taskTitles = [
      'Design auth flow', 'Setup database schemas', 'Write API endpoints', 'Frontend layout', 'Mobile responsiveness',
      'User testing round 1', 'Fix navigation bugs', 'Implement dark mode', 'Launch landing page', 'Setup Stripe billing'
    ];

    projects.forEach(project => {
      taskTitles.forEach((title, index) => {
        let status = 'pending';
        if (index < 6) status = 'completed';
        else if (index < 8) status = 'in_progress';

        tasksData.push({
          title: `${title} - ${project.name}`,
          projectId: project._id,
          assigneeId: users[index % users.length]._id,
          status,
          priority: index === 8 ? 'high' : 'normal',
          createdAt: new Date(Date.now() - Math.random() * 10000000000),
          completedAt: status === 'completed' ? new Date(Date.now() - Math.random() * 5000000000) : null
        });
      });
    });
    const tasks = await Task.insertMany(tasksData);

    // ─────────────────────────────────────────────────────────────────
    // 4. Create Activity History (Momentum Engine fuel)
    // ─────────────────────────────────────────────────────────────────
    console.log('📈 Generating 7-day activity timeline...');
    const activitiesData = [];
    for (let i = 0; i < 40; i++) {
      const randomUser = users[Math.floor(Math.random() * users.length)];
      const randomProject = projects[Math.floor(Math.random() * projects.length)];
      
      // Spread dates mostly over the last 7 days
      const daysAgo = Math.random() * 7;
      const createdAt = new Date(Date.now() - (daysAgo * 24 * 60 * 60 * 1000));

      activitiesData.push({
        type: 'task_completed',
        userId: randomUser._id,
        projectId: randomProject._id,
        description: `${randomUser.firstName} shipped a task in ${randomProject.name}`,
        metadata: { xpEarned: Math.floor(Math.random() * 50) + 10 },
        createdAt
      });
    }
    await Activity.insertMany(activitiesData);

    console.log('✨ Seed complete! The Demo Gods are appeased.');
    process.exit(0);
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  }
};

seedData();
