/**
 * emailNotifications.js
 * Email notification service (optional - requires Nodemailer setup)
 */

// NOTE: This requires email configuration
// Set these in your .env file:
// EMAIL_HOST=smtp.gmail.com
// EMAIL_PORT=587
// EMAIL_USER=your-email@gmail.com
// EMAIL_PASS=your-app-password

/**
 * Send email notification
 * 
 * To enable this:
 * 1. npm install nodemailer
 * 2. Add email credentials to .env
 * 3. Uncomment the code below
 */

/*
const nodemailer = require('nodemailer');

// Create transporter
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: process.env.EMAIL_PORT,
  secure: false, // true for 465, false for other ports
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

async function sendEmail({ to, subject, html, text }) {
  try {
    const info = await transporter.sendMail({
      from: `"ShareSync" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      text,
      html,
    });
    
    console.log('📧 Email sent:', info.messageId);
    return info;
  } catch (error) {
    console.error('Email send error:', error);
    return null;
  }
}

async function sendNotificationEmail(user, notification) {
  const subject = `ShareSync: ${notification.message}`;
  
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #4F46E5;">ShareSync Notification</h2>
      <p>${notification.message}</p>
      <a href="https://sharesync.app/notifications" 
         style="display: inline-block; margin-top: 20px; padding: 10px 20px; 
                background-color: #4F46E5; color: white; text-decoration: none; 
                border-radius: 5px;">
        View in ShareSync
      </a>
    </div>
  `;
  
  return await sendEmail({
    to: user.email,
    subject,
    html,
    text: notification.message,
  });
}

module.exports = {
  sendEmail,
  sendNotificationEmail,
};
*/

// Placeholder functions when email is not configured
module.exports = {
  sendEmail: async () => console.log('⚠️ Email not configured'),
  sendNotificationEmail: async () => console.log('⚠️ Email not configured'),
};
