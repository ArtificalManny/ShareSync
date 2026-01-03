const mongoose = require('mongoose');
const analyticsService = require('../services/analyticsService');
require('dotenv').config();

async function testAnalytics() {
  try {
    // Connect to DB
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/sharesync');
    console.log('✅ Connected to MongoDB');
    
    // Create test user ID
    const testUserId = new mongoose.Types.ObjectId();
    console.log('\n📊 Testing Analytics Service');
    console.log('User ID:', testUserId);
    
    // 1. Track some activities
    console.log('\n1. Tracking activities...');
    
    await analyticsService.trackActivity(testUserId, 'ship', null, {
      shipDescription: 'Fixed login bug',
      xp: 50,
      complexity: 'medium'
    });
    
    await analyticsService.trackActivity(testUserId, 'task_complete', null, {
      complexity: 'high',
      completionTime: 45,
      energy: 4
    });
    
    await analyticsService.trackActivity(testUserId, 'session_start', null, {});
    
    console.log('✅ Activities tracked');
    
    // 2. Compute patterns
    console.log('\n2. Computing patterns...');
    const patterns = await analyticsService.computePatterns(testUserId);
    console.log('✅ Patterns computed:', JSON.stringify(patterns, null, 2));
    
    // 3. Get summary
    console.log('\n3. Getting activity summary...');
    const summary = await analyticsService.getActivitySummary(testUserId, 7);
    console.log('✅ Summary:', JSON.stringify(summary, null, 2));
    
    console.log('\n✅ All tests passed!');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await mongoose.connection.close();
    console.log('\n👋 Disconnected from MongoDB');
    process.exit(0);
  }
}

testAnalytics();
