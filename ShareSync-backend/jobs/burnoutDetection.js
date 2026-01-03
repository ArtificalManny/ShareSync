const cron = require('node-cron');
const burnoutService = require('../services/burnoutService');

/**
 * Burnout Detection Cron Job
 * Runs daily at 6:00 AM to check for burnout signals
 */

function startBurnoutDetection() {
  // Run every day at 6:00 AM
  cron.schedule('0 6 * * *', async () => {
    console.log('🔍 Running daily burnout detection...');
    
    try {
      const usersAtRisk = await burnoutService.getUsersAtRisk();
      
      console.log(`📊 Found ${usersAtRisk.length} users at risk of burnout`);
      
      for (const { user, analysis } of usersAtRisk) {
        console.log(`⚠️  ${user.name} (${user.email}): ${analysis.level} risk`);
        
        // TODO: Send email notification
        // await sendEmail(user.email, {
        //   subject: 'Burnout Alert',
        //   template: 'burnout-alert',
        //   data: analysis
        // });
        
        // TODO: Create in-app notification
        // await createNotification(user._id, {
        //   type: 'burnout-alert',
        //   level: analysis.level,
        //   data: analysis
        // });
      }
      
      console.log('✅ Burnout detection complete');
    } catch (error) {
      console.error('❌ Burnout detection failed:', error);
    }
  });
  
  console.log('✅ Burnout detection cron job scheduled (daily at 6:00 AM)');
}

module.exports = startBurnoutDetection;
