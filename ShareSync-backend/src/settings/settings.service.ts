// src/settings/settings.service.ts
// ═══════════════════════════════════════════════════════════════════════════════
// SETTINGS SERVICE - Full settings management
// Phase 6: Supports all frontend Settings.jsx fields
// ═══════════════════════════════════════════════════════════════════════════════

import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Settings, SettingsDocument } from './settings.schema';

const DEFAULT_SETTINGS = {
  momentum: { dailyGoal: 5, weekendCount: true, allowFreeze: true, freezesUsedThisMonth: 0 },
  focus: { dailyTarget: 4, autoStart: false, startTime: '09:00', blockedApps: [], emergencyBreaksLeft: 1 },
  social: { showStreakTo: 'friends', celebrate: true, publicProfile: true, discoverable: false, allowDMs: true, showActivity: true },
  mentor: { enabled: true, tone: 'wise', intensity: 3 },
  legacy: { showEverywhere: true, yearlyVideo: false },
  appearance: { theme: 'system', mode: 'pro', animations: true, sounds: true },
  projectDefaults: { visibility: 'private', inviteRole: 'member', requireApproval: true, notificationLevel: 'mentions' },
  notifications: { emailActivity: true, emailDigest: true, projectInvites: true, taskAssignments: true, billingAlerts: true, pushNotifications: true, mentionAlerts: true, weeklyReport: true, shipCelebrations: true, streakReminders: true, digestFrequency: 'daily' },
  security: { twoFA: false, trustedDevices: [], loginHistory: [] },
  privacy: { profilePublic: true, showActivity: true, allowDMs: true, hideFromSearch: false, anonymousMode: false },
  presence: { showCursor: true, showOnlineStatus: true, showTypingIndicator: true, cursorColor: '#7C3AED' },
  emailNotifications: true, pushNotifications: true, publicProfile: true, discoverable: false, timezone: 'America/Los_Angeles',
};

@Injectable()
export class SettingsService {
  private readonly logger = new Logger(SettingsService.name);

  constructor(@InjectModel(Settings.name) private readonly settingsModel: Model<SettingsDocument>) {}

  async getSettings(userId: string): Promise<SettingsDocument> {
    let settings = await this.settingsModel.findOne({ userId: new Types.ObjectId(userId) });
    if (!settings) {
      this.logger.log(`Creating default settings for user ${userId}`);
      settings = await this.settingsModel.create({ userId: new Types.ObjectId(userId), ...DEFAULT_SETTINGS });
    }
    return settings;
  }

  async getSettingsPlain(userId: string): Promise<Record<string, any>> {
    const settings = await this.getSettings(userId);
    const plain = settings.toObject();
    delete plain._id; delete plain.__v;
    return plain;
  }

  async updateSettings(userId: string, update: Partial<Settings>): Promise<SettingsDocument> {
    const setObj: Record<string, any> = {};
    const flattenObject = (obj: any, prefix = '') => {
      for (const [key, value] of Object.entries(obj)) {
        const fullKey = prefix ? `${prefix}.${key}` : key;
        if (value !== null && typeof value === 'object' && !Array.isArray(value) && !(value instanceof Date)) {
          flattenObject(value, fullKey);
        } else { setObj[fullKey] = value; }
      }
    };
    flattenObject(update);
    setObj['lastSettingsUpdate'] = new Date();
    return this.settingsModel.findOneAndUpdate({ userId: new Types.ObjectId(userId) }, { $set: setObj }, { new: true, upsert: true });
  }

  async updateSection(userId: string, section: string, update: Record<string, any>): Promise<SettingsDocument> {
    const setObj: Record<string, any> = {};
    for (const [key, value] of Object.entries(update)) { setObj[`${section}.${key}`] = value; }
    setObj['lastSettingsUpdate'] = new Date();
    return this.settingsModel.findOneAndUpdate({ userId: new Types.ObjectId(userId) }, { $set: setObj }, { new: true, upsert: true });
  }

  async updateNotifications(userId: string, notifications: Partial<Settings['notifications']>): Promise<SettingsDocument> { return this.updateSection(userId, 'notifications', notifications); }
  async updatePrivacy(userId: string, privacy: Partial<Settings['privacy']>): Promise<SettingsDocument> { return this.updateSection(userId, 'privacy', privacy); }
  async updateAppearance(userId: string, appearance: Partial<Settings['appearance']>): Promise<SettingsDocument> { return this.updateSection(userId, 'appearance', appearance); }
  async updateMentor(userId: string, mentor: Partial<Settings['mentor']>): Promise<SettingsDocument> { return this.updateSection(userId, 'mentor', mentor); }
  async updateMomentum(userId: string, momentum: Partial<Settings['momentum']>): Promise<SettingsDocument> { return this.updateSection(userId, 'momentum', momentum); }
  async updateFocus(userId: string, focus: Partial<Settings['focus']>): Promise<SettingsDocument> { return this.updateSection(userId, 'focus', focus); }
  async updateSocial(userId: string, social: Partial<Settings['social']>): Promise<SettingsDocument> { return this.updateSection(userId, 'social', social); }
  async updatePresence(userId: string, presence: Partial<Settings['presence']>): Promise<SettingsDocument> { return this.updateSection(userId, 'presence', presence); }

  async useStreakFreeze(userId: string): Promise<{ success: boolean; message: string }> {
    const settings = await this.getSettings(userId);
    if (!settings.momentum.allowFreeze) return { success: false, message: 'Streak freeze is disabled in your settings' };
    const lastFreeze = settings.momentum.lastFreezeUsedAt;
    if (lastFreeze) {
      const now = new Date();
      const sameMonth = lastFreeze.getMonth() === now.getMonth() && lastFreeze.getFullYear() === now.getFullYear();
      if (sameMonth && settings.momentum.freezesUsedThisMonth >= 1) return { success: false, message: 'You already used your streak freeze this month' };
    }
    await this.settingsModel.updateOne({ userId: new Types.ObjectId(userId) }, { $set: { 'momentum.lastFreezeUsedAt': new Date(), 'momentum.freezesUsedThisMonth': (settings.momentum.freezesUsedThisMonth || 0) + 1 } });
    return { success: true, message: 'Streak freeze activated!' };
  }

  async resetMonthlyFreezes(): Promise<void> {
    await this.settingsModel.updateMany({}, { $set: { 'momentum.freezesUsedThisMonth': 0 } });
    this.logger.log('Reset monthly streak freezes for all users');
  }

  async exportSettings(userId: string): Promise<Record<string, any>> {
    const settings = await this.getSettingsPlain(userId);
    return { exportedAt: new Date().toISOString(), version: '1.0', settings };
  }

  async importSettings(userId: string, imported: Record<string, any>): Promise<SettingsDocument> {
    const { settings } = imported;
    if (!settings) throw new Error('Invalid settings import format');
    delete settings.userId; delete settings.createdAt; delete settings.updatedAt; delete settings.security;
    return this.updateSettings(userId, settings);
  }

  async resetToDefaults(userId: string): Promise<SettingsDocument> {
    return this.settingsModel.findOneAndUpdate({ userId: new Types.ObjectId(userId) }, { $set: { ...DEFAULT_SETTINGS, lastSettingsUpdate: new Date() } }, { new: true, upsert: true });
  }

  async deleteSettings(userId: string): Promise<void> {
    await this.settingsModel.deleteOne({ userId: new Types.ObjectId(userId) });
    this.logger.log(`Deleted settings for user ${userId}`);
  }
}
