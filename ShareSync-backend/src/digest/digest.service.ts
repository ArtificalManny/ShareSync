// src/digest/digest.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, FilterQuery } from 'mongoose';
import { Cron, CronExpression } from '@nestjs/schedule';
import { MailerService } from '@nestjs-modules/mailer';

type ProjectDoc = any;

@Injectable()
export class DigestService {
  private readonly logger = new Logger(DigestService.name);

  constructor(
    @InjectModel('Project') private readonly projectModel: Model<ProjectDoc>,
    private readonly mailer: MailerService,
  ) {}

  /** ---------- no-arg preview for controller ---------- */
  async previewWeekly() {
    const userId = process.env.DIGEST_PREVIEW_USER_ID?.trim();

    if (!userId) {
      return this.emptyDigest('Last 7 days');
    }

    try {
      return await this.buildWeeklyDigest(userId);
    } catch (err: any) {
      this.logger.warn(`previewWeekly fallback (userId=${userId}): ${err?.message ?? err}`);
      return this.emptyDigest('Last 7 days');
    }
  }

  /** ---------- test sender for controller (no args) ---------- */
  async sendWeekly(): Promise<void> {
    const toEmail =
      process.env.TEST_DIGEST_TO?.trim() ||
      process.env.SMTP_USER?.trim() ||
      'no-recipient@example.com';

    const userId = process.env.DIGEST_PREVIEW_USER_ID?.trim();

    try {
      if (userId) {
        await this.sendWeeklyDigest(userId, toEmail);
      } else {
        const d = this.emptyDigest('Last 7 days');
        await this.mailer.sendMail({
          to: toEmail,
          subject: `ShareSync — Weekly Digest — ${d.range}`,
          text: this.renderText(d),
          html: this.renderHtml(d),
        });
        this.logger.log(`Weekly digest (empty) sent to ${toEmail}`);
      }
    } catch (err: any) {
      this.logger.warn(`sendWeekly skipped/failed: ${err?.message ?? err}`);
    }
  }

  /** Build the weekly digest data for a specific user */
  async buildWeeklyDigest(userId: string) {
    const since = new Date(Date.now() - 7 * 24 * 3600 * 1000);

    const q: FilterQuery<ProjectDoc> = {
      userId,
      updatedAt: { $gte: since },
    };

    const projects = await this.projectModel
      .find(q)
      .select({
        title: 1,
        status: 1,
        updatedAt: 1,
        lastActivityAt: 1,
        tasks: 1,
        members: 1,
      })
      .sort({ updatedAt: -1 })
      .lean();

    const summary = projects.map((p: any) => {
      const tasks = Array.isArray(p.tasks) ? p.tasks : [];
      const done = tasks.filter((t: any) => t.status === 'Completed').length;
      const open = tasks.length - done;
      return {
        id: String(p._id),
        title: p.title,
        status: p.status,
        updatedAt: p.updatedAt || p.lastActivityAt,
        tasksDone: done,
        tasksOpen: open,
        members: (p.members || []).length,
      };
    });

    const totals = summary.reduce(
      (acc, s) => {
        acc.projects += 1;
        acc.tasksDone += s.tasksDone;
        acc.tasksOpen += s.tasksOpen;
        return acc;
      },
      { projects: 0, tasksDone: 0, tasksOpen: 0 },
    );

    return {
      range: 'Last 7 days',
      generatedAt: new Date().toISOString(),
      totals,
      projects: summary,
    };
  }

  /** Send the weekly digest email for a specific user */
  async sendWeeklyDigest(userId: string, toEmail: string) {
    const digest = await this.buildWeeklyDigest(userId);

    const subject = `Your ShareSync weekly digest — ${digest.range}`;
    const text = this.renderText(digest);
    const html = this.renderHtml(digest);

    await this.mailer.sendMail({
      to: toEmail,
      subject,
      text,
      html,
    });

    this.logger.log(`Weekly digest sent to ${toEmail} (userId=${userId})`);
    return { ok: true, sentTo: toEmail, subject, digest };
  }

  // ---- Optional weekly cron (Mon 8am). Reuses the no-arg sender above. ----
  // Use a literal cron string because CronExpression has no EVERY_MONDAY_AT_8AM
  @Cron('0 8 * * 1')
  async weeklyCron() {
    this.logger.log('Cron: sending weekly digest…');
    await this.sendWeekly();
  }

  /** ---------- helpers ---------- */

  private emptyDigest(range = 'Last 7 days') {
    return {
      range,
      generatedAt: new Date().toISOString(),
      totals: { projects: 0, tasksDone: 0, tasksOpen: 0 },
      projects: [] as Array<{
        id: string;
        title: string;
        status: string;
        updatedAt: string;
        tasksDone: number;
        tasksOpen: number;
        members: number;
      }>,
    };
  }

  private renderText(d: any) {
    const lines: string[] = [];
    lines.push(`ShareSync — Weekly Digest (${d.range})`);
    lines.push(`Generated: ${new Date(d.generatedAt).toLocaleString()}`);
    lines.push('');
    lines.push(`Totals:`);
    lines.push(` • Projects: ${d.totals.projects}`);
    lines.push(` • Tasks Done: ${d.totals.tasksDone}`);
    lines.push(` • Tasks Open: ${d.totals.tasksOpen}`);
    lines.push('');
    if (d.projects.length === 0) {
      lines.push('No project activity this week.');
    } else {
      lines.push('Projects:');
      d.projects.forEach((p: any) => {
        lines.push(
          ` • ${p.title} — ${p.status} — Done: ${p.tasksDone}, Open: ${p.tasksOpen} (Updated: ${new Date(
            p.updatedAt || Date.now(),
          ).toLocaleDateString()})`,
        );
      });
    }
    lines.push('');
    lines.push('— ShareSync');
    return lines.join('\n');
  }

  private renderHtml(d: any) {
    const rows =
      d.projects.length === 0
        ? `<tr><td colspan="4" style="padding:8px;color:#475569;">No project activity this week.</td></tr>`
        : d.projects
            .map(
              (p: any) => `
          <tr>
            <td style="padding:8px;border-bottom:1px solid #e5e7eb;">${this.escape(
              p.title,
            )}</td>
            <td style="padding:8px;border-bottom:1px solid #e5e7eb;">${this.escape(
              p.status,
            )}</td>
            <td style="padding:8px;border-bottom:1px solid #e5e7eb;">Done: ${
              p.tasksDone
            } / Open: ${p.tasksOpen}</td>
            <td style="padding:8px;border-bottom:1px solid #e5e7eb;">${new Date(
              p.updatedAt || Date.now(),
            ).toLocaleDateString()}</td>
          </tr>`,
            )
            .join('');

    return `
      <!doctype html>
      <html>
        <body style="margin:0;padding:0;background:#f8fafc;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc;padding:24px 0;">
            <tr>
              <td align="center">
                <table width="640" cellpadding="0" cellspacing="0" style="background:#ffffff;border:1px solid #e5e7eb;border-radius:12px;padding:24px;font-family:Inter,Arial,sans-serif;color:#0f172a;">
                  <tr>
                    <td style="font-size:18px;font-weight:700;">ShareSync — Weekly Digest</td>
                  </tr>
                  <tr>
                    <td style="padding-top:4px;color:#475569;">${this.escape(
                      d.range,
                    )} · Generated ${new Date(d.generatedAt).toLocaleString()}</td>
                  </tr>

                  <tr><td style="height:16px;"></td></tr>

                  <tr>
                    <td>
                      <table cellpadding="0" cellspacing="0" style="width:100%;border:1px solid #e2e8f0;border-radius:10px;">
                        <tr>
                          <td style="padding:12px;font-weight:600;">Totals</td>
                        </tr>
                        <tr>
                          <td style="padding:0 12px 12px 12px;color:#334155;">
                            <div>Projects: <strong>${d.totals.projects}</strong></div>
                            <div>Tasks Done: <strong>${d.totals.tasksDone}</strong></div>
                            <div>Tasks Open: <strong>${d.totals.tasksOpen}</strong></div>
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>

                  <tr><td style="height:16px;"></td></tr>

                  <tr>
                    <td>
                      <table cellpadding="0" cellspacing="0" style="width:100%;border-collapse:collapse;">
                        <thead>
                          <tr>
                            <th align="left" style="padding:8px;border-bottom:2px solid #0ea5e9;">Project</th>
                            <th align="left" style="padding:8px;border-bottom:2px solid #0ea5e9;">Status</th>
                            <th align="left" style="padding:8px;border-bottom:2px solid #0ea5e9;">Tasks</th>
                            <th align="left" style="padding:8px;border-bottom:2px solid #0ea5e9;">Updated</th>
                          </tr>
                        </thead>
                        <tbody>
                          ${rows}
                        </tbody>
                      </table>
                    </td>
                  </tr>

                  <tr><td style="height:20px;"></td></tr>

                  <tr>
                    <td style="font-size:12px;color:#64748b;">
                      You received this because you’re using ShareSync. To stop these, disable “Weekly Digest” in Settings.
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </body>
      </html>
    `;
  }

  private escape(s: string) {
    return String(s ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  }
}