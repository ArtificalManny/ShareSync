import { Injectable } from '@nestjs/common';

type TransporterLike = {
  sendMail: (args: {
    from: string;
    to: string;
    subject: string;
    html?: string;
    text?: string;
  }) => Promise<any>;
};

type EmailChannelState = {
  verified?: boolean;
  optIn?: boolean;
  email?: string;
};

type UserLike = {
  email?: string;
  notificationChannels?: {
    email?: EmailChannelState;
  };
  notificationPrefs?: {
    channels?: {
      email?: boolean;
    };
  };
};

@Injectable()
export class EmailService {
  private transporter?: TransporterLike;
  private readonly fromAddress: string;
  private readonly resendApiKey?: string;
  private readonly resendFromAddress?: string;

  constructor() {
    this.resendApiKey = process.env.RESEND_API_KEY || undefined;
    this.resendFromAddress = process.env.RESEND_FROM || process.env.EMAIL_FROM || undefined;
    this.fromAddress =
      this.resendFromAddress ||
      process.env.EMAIL_FROM ||
      (process.env.SMTP_USER ? `"ShareSync" <${process.env.SMTP_USER}>` : `"ShareSync" <no-reply@sharesync.local>`);

    // Optional dependency: do not break build if nodemailer isn't installed
    let nodemailer: any;
    try {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      nodemailer = require('nodemailer');
    } catch (_err) {
      console.warn('Nodemailer not installed - Email notifications disabled');
      this.transporter = undefined;
      return;
    }

    // If SMTP isn't configured, keep email disabled (SAFE)
    const host = process.env.SMTP_HOST;
    const portRaw = process.env.SMTP_PORT;
    const user = process.env.SMTP_USER;
    const pass = process.env.SMTP_PASS;

    if (!host || !portRaw || !user || !pass) {
      console.warn('SMTP env not configured - Email notifications disabled');
      this.transporter = undefined;
      return;
    }

    const port = Number(portRaw);
    if (!Number.isFinite(port)) {
      console.warn('SMTP_PORT invalid - Email notifications disabled');
      this.transporter = undefined;
      return;
    }

    this.transporter = nodemailer.createTransport({
      host,
      port,
      secure: port === 465, // common convention
      auth: { user, pass },
    });
  }

  async sendDirectEmail(args: {
    to: string;
    subject: string;
    html?: string;
    text?: string;
  }): Promise<void> {
    const to = String(args?.to || '').trim().toLowerCase();
    if (!to) return;

    if (this.resendApiKey && this.resendFromAddress) {
      await this.sendViaResend({
        to,
        subject: args.subject,
        html: args.html,
        text: args.text,
      });
      return;
    }

    if (!this.transporter) {
      console.warn('Email transport not configured - direct email skipped');
      return;
    }

    try {
      await this.transporter.sendMail({
        from: this.fromAddress,
        to,
        subject: args.subject,
        html: args.html,
        text: args.text,
      });
    } catch (error) {
      console.error('Failed to send direct Email:', error);
    }
  }

  /**
   * PHASE 4 RULE:
   * - No email until user has verified + opted in
   * - Keep in-app as primary; email is best-effort + gated
   */
  async sendNotification(user: UserLike, notification: any): Promise<void> {
    const to = this.resolveEmail(user);

    // Gating: no verified+opt-in => do nothing (SAFE)
    if (!to || !this.isEmailAllowed(user)) return;

    const emailHtml = this.buildEmailTemplate(notification);

    if (this.resendApiKey && this.resendFromAddress) {
      await this.sendViaResend({
        to,
        subject: notification?.title || 'ShareSync Update',
        html: emailHtml,
        text: notification?.message || notification?.body || '',
      });
      return;
    }

    if (!this.transporter) {
      console.warn('Email transport not configured - Email notification skipped');
      return;
    }

    try {
      await this.transporter.sendMail({
        from: this.fromAddress,
        to,
        subject: notification?.title || 'ShareSync Update',
        html: emailHtml,
        text: notification?.message || notification?.body || '',
      });
    } catch (error) {
      console.error('Failed to send Email:', error);
    }
  }

  /**
   * Digest sending is safest for MVP — still must be verified + opt-in.
   */
  async sendDailyDigest(user: UserLike, notifications: any[]): Promise<void> {
    const to = this.resolveEmail(user);
    if (!to || !this.isEmailAllowed(user)) return;

    if (!this.resendApiKey && !this.transporter) {
      console.warn('Email transport not configured - Daily digest skipped');
      return;
    }

    const byProject = (notifications || []).reduce((acc: any, n: any) => {
      const key = n?.projectId?.toString?.() || 'general';
      if (!acc[key]) acc[key] = [];
      acc[key].push(n);
      return acc;
    }, {});

    const html = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          body { margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f4f4f5; }
        </style>
      </head>
      <body style="margin: 0; padding: 0; background-color: #f4f4f5; font-family: -apple-system, sans-serif;">
        <center style="width: 100%; table-layout: fixed; background-color: #f4f4f5; padding: 40px 0;">
          <table width="100%" style="max-width: 600px; background-color: #ffffff; margin: 0 auto; border-radius: 12px; overflow: hidden; border-collapse: collapse; box-shadow: 0 10px 25px -5px rgba(0,0,0,0.05);">
            <tr>
              <td style="padding: 30px 40px; text-align: center; background-color: #0F172A;">
                <img src="https://via.placeholder.com/180x40/0F172A/06B6D4?text=OPENSHARE" alt="OpenShare" width="180" style="display: block; margin: 0 auto;">
              </td>
            </tr>
            <tr>
              <td style="padding: 40px 40px 30px; background-color: #1E1B4B; border-bottom: 3px solid #06B6D4; text-align: center;">
                <h1 style="margin: 0; color: #ffffff; font-size: 22px; font-weight: 600;">Your Daily Digest</h1>
                <p style="margin: 10px 0 0; color: #94A3B8; font-size: 15px;">${new Date().toLocaleDateString()} &bull; ${notifications?.length || 0} updates</p>
              </td>
            </tr>
            <tr>
              <td style="padding: 40px;">
                ${Object.entries(byProject)
                  .map(([projectId, notifs]: [string, any]) => `
                    <div style="margin-bottom: 32px;">
                      <h2 style="margin: 0 0 16px; color: #0F172A; font-size: 14px; border-bottom: 2px solid #F1F5F9; padding-bottom: 8px; text-transform: uppercase; letter-spacing: 1px;">${projectId === 'general' ? 'General' : 'Project Updates'}</h2>
                      <ul style="margin: 0; padding: 0; list-style-type: none;">
                        ${(notifs || []).map((n: any) => `
                          <li style="margin-bottom: 16px; padding-left: 16px; border-left: 3px solid #7C3AED;">
                            <strong style="color: #1E293B; display: block; font-size: 15px; margin-bottom: 4px;">${this.escapeHtml(n?.title || 'Update')}</strong>
                            <span style="color: #64748B; font-size: 14px; line-height: 1.5;">${this.escapeHtml(n?.message || '')}</span>
                          </li>
                        `).join('')}
                      </ul>
                    </div>
                  `)
                  .join('')}
              </td>
            </tr>
            <tr>
              <td style="padding: 30px 40px; background-color: #F8FAFC; text-align: center; border-top: 1px solid #E2E8F0;">
                <p style="margin: 0; font-size: 13px; color: #64748B;">
                  <a href="${process.env.FRONTEND_URL ? `${process.env.FRONTEND_URL}/settings` : '#'}" style="color: #06B6D4; text-decoration: none; font-weight: 600;">Manage preferences</a> in OpenShare settings.
                </p>
              </td>
            </tr>
          </table>
        </center>
      </body>
      </html>
    `;

    if (this.resendApiKey && this.resendFromAddress) {
      await this.sendViaResend({
        to,
        subject: `Daily Digest — ${notifications?.length || 0} updates`,
        html,
      });
      return;
    }

    if (!this.transporter) {
      console.warn('Email transport not configured - Daily digest skipped');
      return;
    }

    try {
      await this.transporter.sendMail({
        from: this.fromAddress,
        to,
        subject: `Daily Digest — ${notifications?.length || 0} updates`,
        html,
      });
    } catch (error) {
      console.error('Failed to send Daily Digest Email:', error);
    }
  }

  private async sendViaResend(args: {
    to: string;
    subject: string;
    html?: string;
    text?: string;
  }): Promise<void> {
    if (!this.resendApiKey || !this.resendFromAddress) {
      console.warn('Resend env not configured - Email notification skipped');
      return;
    }

    const fetchFn = globalThis.fetch;

    if (typeof fetchFn !== 'function') {
      console.warn('Global fetch unavailable - Resend email notification skipped');
      return;
    }

    try {
      const response = await fetchFn('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.resendApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: this.resendFromAddress,
          to: args.to,
          subject: args.subject,
          html: args.html,
          text: args.text,
        }),
      });

      if (!response.ok) {
        const body = await response.text().catch(() => '');
        console.warn(`Resend email failed (${response.status}): ${body}`);
      }
    } catch (error) {
      console.error('Failed to send Resend Email:', error);
    }
  }

  private resolveEmail(user: UserLike): string | null {
    const e =
      user?.notificationChannels?.email?.email ||
      user?.email ||
      null;

    if (!e) return null;
    return String(e).trim().toLowerCase();
  }

  private isEmailAllowed(user: UserLike): boolean {
    const verified = Boolean(user?.notificationChannels?.email?.verified);
    const optIn = Boolean(user?.notificationChannels?.email?.optIn);

    // Optional global/channel prefs (default true if undefined; gating already strict)
    const channelEnabled = user?.notificationPrefs?.channels?.email;
    const channelOk = channelEnabled === undefined ? true : Boolean(channelEnabled);

    return verified && optIn && channelOk;
  }

  private buildFrontendUrl(rawUrl?: string): string {
    const url = String(rawUrl || '').trim();
    if (!url) return '';

    if (/^https?:\/\//i.test(url)) {
      return url;
    }

    const frontendBase = String(process.env.FRONTEND_URL || '').replace(/\/+$/, '');

    if (!frontendBase) {
      return url;
    }

    return url.startsWith('/')
      ? `${frontendBase}${url}`
      : `${frontendBase}/${url}`;
  }

  private buildEmailTemplate(notification: any): string {
    const emoji = this.getEmojiForType(notification?.type);

    const title = this.escapeHtml(notification?.title || 'ShareSync Update');
    const msg = this.escapeHtml(notification?.message || notification?.body || '');

    const actionUrl = this.buildFrontendUrl(notification?.actionData?.url);
    const button = actionUrl
      ? `<table width="100%" border="0" cellspacing="0" cellpadding="0"><tr><td align="center"><a href="${this.escapeAttr(actionUrl)}" style="background-color: #7C3AED; color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 8px; display: inline-block; font-weight: 600; font-size: 15px; box-shadow: 0 4px 6px -1px rgba(124, 58, 237, 0.2);">View in OpenShare</a></td></tr></table>`
      : '';

    const settingsUrl = process.env.FRONTEND_URL
      ? `${process.env.FRONTEND_URL}/settings`
      : '#';

    return `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          body { margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f4f4f5; }
          table { border-spacing: 0; }
          td { padding: 0; }
          img { border: 0; }
        </style>
      </head>
      <body style="margin: 0; padding: 0; background-color: #f4f4f5; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
        <center style="width: 100%; table-layout: fixed; background-color: #f4f4f5; padding: 40px 0;">
          <table width="100%" style="max-width: 600px; background-color: #ffffff; margin: 0 auto; border-radius: 12px; overflow: hidden; border-collapse: collapse; box-shadow: 0 10px 25px -5px rgba(0,0,0,0.05), 0 8px 10px -6px rgba(0,0,0,0.01);">
            <tr>
              <td style="padding: 30px 40px; text-align: center; background-color: #0F172A;">
                <img src="https://openshare.ca/icon-192.png" width="72" height="72" alt="OpenShare" style="display:block; border:0; border-radius:16px;" />
              </td>
            </tr>
            <tr>
              <td style="padding: 40px 40px 30px; text-align: center; background-color: #1E1B4B; border-bottom: 3px solid #06B6D4;">
                <h1 style="margin: 0; color: #ffffff; font-size: 22px; font-weight: 600; letter-spacing: -0.5px;">
                  <span style="font-size: 26px;">${emoji}</span> &nbsp; ${title}
                </h1>
              </td>
            </tr>
            <tr>
              <td style="padding: 40px;">
                <p style="margin: 0 0 32px; color: #334155; font-size: 16px; line-height: 1.6; text-align: center;">
                  ${msg}
                </p>
                ${button}
              </td>
            </tr>
            <tr>
              <td style="padding: 30px 40px; background-color: #F8FAFC; text-align: center; border-top: 1px solid #E2E8F0;">
                <p style="margin: 0 0 12px; color: #64748B; font-size: 13px; line-height: 1.5;">
                  You're receiving this because you opted in to email updates in OpenShare.
                </p>
                <p style="margin: 0; font-size: 13px;">
                  <a href="${this.escapeAttr(settingsUrl)}" style="color: #06B6D4; text-decoration: none; font-weight: 600;">Manage preferences</a>
                </p>
              </td>
            </tr>
          </table>
        </center>
      </body>
      </html>
    `;
  }

  private getEmojiForType(type: string): string {
    const emojiMap: Record<string, string> = {
      announcement_created: '📢',
      mention: '@',
      task_assigned: '📋',
      file_uploaded: '📎',
      deadline_reminder: '⏰',
      project_invite: '👋',
      comment_added: '💬',
      follow_created: '⭐',
      project_ship_update: '🚀',
      project_milestone_reached: '🏁',
    };
    return emojiMap[type] || '🔔';
  }

  private escapeHtml(s: string): string {
    return String(s)
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;')
      .replaceAll("'", '&#39;');
  }

  private escapeAttr(s: string): string {
    // Enough for URLs
    return this.escapeHtml(s);
  }
}
