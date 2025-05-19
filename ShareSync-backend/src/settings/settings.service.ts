import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Settings } from './settings.schema';

@Injectable()
export class SettingsService {
  constructor(@InjectModel(Settings.name) private settingsModel: Model<Settings>) {}

  async getSettings(userId: string): Promise<Settings> {
    let settings = await this.settingsModel.findOne({ userId }).exec();
    if (!settings) {
      settings = new this.settingsModel({ userId });
      await settings.save();
    }
    return settings;
  }

  async updateSettings(userId: string, update: Partial<Settings>): Promise<Settings> {
    return this.settingsModel
      .findOneAndUpdate({ userId }, update, { new: true, upsert: true })
      .exec();
  }
}