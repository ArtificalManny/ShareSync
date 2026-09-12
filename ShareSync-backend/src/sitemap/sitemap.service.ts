import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  User,
  UserDocument,
} from '../user/schemas/user.schema';

const SITE_ORIGIN = 'https://openshare.ca';
const MAX_PROFILE_URLS = 49_998;

type SitemapEntry = {
  loc: string;
  lastmod?: string;
};

function escapeXml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function toLastMod(value: unknown): string | undefined {
  if (!value) return undefined;

  const date = new Date(value as any);

  if (Number.isNaN(date.getTime())) {
    return undefined;
  }

  return date.toISOString();
}

@Injectable()
export class SitemapService {
  constructor(
    @InjectModel(User.name)
    private readonly userModel: Model<UserDocument>,
  ) {}

  async generateXml(): Promise<string> {
    const users: any[] = await this.userModel
      .find({
        publicProfile: true,
        searchEngineVisible: true,
        accountStatus: {
          $nin: ['suspended', 'disabled', 'banned'],
        },
        username: {
          $type: 'string',
          $ne: '',
        },
      })
      .select({
        _id: 0,
        username: 1,
        updatedAt: 1,
      })
      .sort({
        username: 1,
      })
      .limit(MAX_PROFILE_URLS)
      .lean()
      .exec();

    const entries: SitemapEntry[] = [
      {
        loc: `${SITE_ORIGIN}/`,
      },
      {
        loc: `${SITE_ORIGIN}/privacy-manifesto`,
      },
    ];

    for (const user of users) {
      const username = String(user?.username || '')
        .replace(/^@+/, '')
        .trim();

      if (!username) {
        continue;
      }

      entries.push({
        loc:
          `${SITE_ORIGIN}/profile/` +
          encodeURIComponent(username),
        lastmod: toLastMod(user?.updatedAt),
      });
    }

    const body = entries
      .map((entry) => {
        const lastmod = entry.lastmod
          ? `
    <lastmod>${escapeXml(entry.lastmod)}</lastmod>`
          : '';

        return [
          '  <url>',
          `    <loc>${escapeXml(entry.loc)}</loc>${lastmod}`,
          '  </url>',
        ].join('\n');
      })
      .join('\n');

    return [
      '<?xml version="1.0" encoding="UTF-8"?>',
      '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
      body,
      '</urlset>',
      '',
    ].join('\n');
  }
}
