
import { Injectable } from '@nestjs/common';
import * as nodemailer from 'nodemailer';

@Injectable()
export class EmailService {
  private transporter: nodemailer.Transporter;

  constructor() {
    this.transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  }

  async sendNotification(user: any, notification: any): Promise<void> {
    const emailHtml = this.buildEmailTemplate(notification);

    await this.transporter.sendMail({
      from: `"ShareSync" <${process.env.SMTP_USER}>`,
      to: user.email,
      subject: notification.title,
      html: emailHtml,
    });
  }

  private buildEmailTemplate(notification: any): string {
    const emoji = this.getEmojiForType(notification.type);
    
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #9333ea, #c026d3); padding: 30px; border-radius: 12px; }
            .title { color: white; font-size: 24px; margin: 0; }
            .content { background: #f8fafc; padding: 30px; border-radius: 12px; margin-top: 20px; }
            .message { color: #334155; line-height: 1.6; }
            .button { display: inline-block; background: #9333ea; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; margin-top: 20px; }
            .footer { text-align: center; color: #94a3b8; font-size: 12px; margin-top: 30px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1 class="title">${emoji} ${notification.title}</h1>
            </div>
            <div class="content">
              <p class="message">${notification.message}</p>
              ${notification.actionData?.url ? `
                <a href="${notification.actionData.url}" class="button">View in ShareSync</a>
              ` : ''}
            </div>
            <div class="footer">
              <p>You're receiving this because of your notification settings in ShareSync.</p>
              <p><a href="${process.env.FRONTEND_URL}/settings">Manage preferences</a></p>
            </div>
          </div>
        </body>
      </html>
    `;
  }

  private getEmojiForType(type: string): string {
    const emojiMap: Record<string, string> = {
      'announcement_created': '📢',
      'mention': '@',
      'task_assigned': '📋',
      'file_uploaded': '📎',
      'deadline_reminder': '⏰',
      'project_invite': '👋',
      'comment_added': '💬',
    };
    return emojiMap[type] || '🔔';
  }

  async sendDailyDigest(user: any, notifications: any[]): Promise<void> {
    // Group by project
    const byProject = notifications.reduce((acc: any, n: any) => {
      const key = n.projectId?.toString() || 'general';
      if (!acc[key]) acc[key] = [];
      acc[key].push(n);
      return acc;
    }, {});

    const html = `
      <!DOCTYPE html>
      <html>
        <body>
          <h1>Your Daily Digest - ${new Date().toLocaleDateString()}</h1>
          ${Object.entries(byProject).map(([projectId, notifs]: [string, any]) => `
            <h2>Project Updates</h2>
            <ul>
              ${notifs.map((n: any) => `<li>${n.title}: ${n.message}</li>`).join('')}
            </ul>
          `).join('')}
        </body>
      </html>
    `;

    await this.transporter.sendMail({
      from: `"ShareSync" <${process.env.SMTP_USER}>`,
      to: user.email,
      subject: `Daily Digest - ${notifications.length} updates`,
      html,
    });
  }
}
