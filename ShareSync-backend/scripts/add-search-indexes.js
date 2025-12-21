/**
 * add-search-indexes.js
 * Add database indexes for search performance
 */

const mongoose = require('mongoose');
require('dotenv').config();

async function addSearchIndexes() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || process.env.MONGO_URI);
    console.log('Connected to MongoDB');
    
    const db = mongoose.connection.db;
    
    // Project indexes for search
    await db.collection('projects').createIndex(
      { title: 'text', description: 'text' },
      { name: 'project_text_search' }
    );
    console.log('✅ Created text index on projects (title, description)');
    
    // User indexes for search
    await db.collection('users').createIndex(
      { username: 'text', firstName: 'text', lastName: 'text', email: 'text' },
      { name: 'user_text_search' }
    );
    console.log('✅ Created text index on users (username, firstName, lastName, email)');
    
    // Additional useful indexes
    await db.collection('projects').createIndex({ status: 1 });
    await db.collection('projects').createIndex({ createdAt: -1 });
    await db.collection('projects').createIndex({ owner: 1 });
    await db.collection('projects').createIndex({ 'members.user': 1 });
    console.log('✅ Created additional project indexes');
    
    console.log('\n🎉 All search indexes created successfully!');
    
    await mongoose.disconnect();
  } catch (error) {
    console.error('Error creating indexes:', error);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  addSearchIndexes();
}

module.exports = addSearchIndexes;
