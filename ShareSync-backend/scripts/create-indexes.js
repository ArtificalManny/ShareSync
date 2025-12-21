/**
 * create-indexes.js
 * Create all database indexes for optimal performance
 */

const mongoose = require('mongoose');
require('dotenv').config();

async function createAllIndexes() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB');
    
    const db = mongoose.connection.db;
    
    // ============================================
    // USERS COLLECTION
    // ============================================
    console.log('\n📊 Creating User indexes...');
    
    await db.collection('users').createIndex({ email: 1 }, { unique: true });
    await db.collection('users').createIndex({ username: 1 }, { unique: true });
    await db.collection('users').createIndex({ 'gamification.totalXP': -1 });
    await db.collection('users').createIndex({ 'gamification.level': -1 });
    await db.collection('users').createIndex({ 'gamification.currentStreak': -1 });
    await db.collection('users').createIndex({ createdAt: -1 });
    
    // Text search indexes
    await db.collection('users').createIndex(
      { username: 'text', firstName: 'text', lastName: 'text', email: 'text' },
      { name: 'user_text_search' }
    );
    
    console.log('✅ User indexes created');
    
    // ============================================
    // PROJECTS COLLECTION
    // ============================================
    console.log('\n📊 Creating Project indexes...');
    
    await db.collection('projects').createIndex({ owner: 1 });
    await db.collection('projects').createIndex({ 'members.user': 1 });
    await db.collection('projects').createIndex({ status: 1 });
    await db.collection('projects').createIndex({ privacy: 1 });
    await db.collection('projects').createIndex({ createdAt: -1 });
    await db.collection('projects').createIndex({ updatedAt: -1 });
    
    // Compound indexes for common queries
    await db.collection('projects').createIndex({ owner: 1, status: 1 });
    await db.collection('projects').createIndex({ owner: 1, createdAt: -1 });
    
    // Text search indexes
    await db.collection('projects').createIndex(
      { title: 'text', description: 'text' },
      { name: 'project_text_search' }
    );
    
    console.log('✅ Project indexes created');
    
    // ============================================
    // FOCUS SESSIONS COLLECTION
    // ============================================
    console.log('\n📊 Creating Focus Session indexes...');
    
    try {
      await db.collection('focus_sessions').createIndex({ userId: 1 });
      await db.collection('focus_sessions').createIndex({ userId: 1, startTime: -1 });
      await db.collection('focus_sessions').createIndex({ status: 1 });
      await db.collection('focus_sessions').createIndex({ status: 1, userId: 1 });
      await db.collection('focus_sessions').createIndex({ projectId: 1, startTime: -1 });
      await db.collection('focus_sessions').createIndex({ createdAt: -1 });
      
      console.log('✅ Focus Session indexes created');
    } catch (error) {
      console.log('⚠️  Focus Sessions collection not found (may not exist yet)');
    }
    
    // ============================================
    // MESSAGES COLLECTION (if exists)
    // ============================================
    console.log('\n📊 Creating Message indexes...');
    
    try {
      await db.collection('messages').createIndex({ projectId: 1 });
      await db.collection('messages').createIndex({ sender: 1 });
      await db.collection('messages').createIndex({ projectId: 1, createdAt: -1 });
      await db.collection('messages').createIndex({ createdAt: -1 });
      
      // Text search
      await db.collection('messages').createIndex(
        { content: 'text' },
        { name: 'message_text_search' }
      );
      
      console.log('✅ Message indexes created');
    } catch (error) {
      console.log('⚠️  Messages collection not found (may not exist yet)');
    }
    
    // ============================================
    // LIST ALL INDEXES
    // ============================================
    console.log('\n📋 Summary of all indexes:');
    
    const collections = ['users', 'projects', 'focus_sessions', 'messages'];
    
    for (const collectionName of collections) {
      try {
        const indexes = await db.collection(collectionName).indexes();
        console.log(`\n${collectionName}:`);
        indexes.forEach(index => {
          console.log(`  - ${index.name}`);
        });
      } catch (error) {
        console.log(`\n${collectionName}: Collection not found`);
      }
    }
    
    console.log('\n✅ All indexes created successfully!');
    
    await mongoose.disconnect();
  } catch (error) {
    console.error('❌ Error creating indexes:', error);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  createAllIndexes();
}

module.exports = createAllIndexes;
