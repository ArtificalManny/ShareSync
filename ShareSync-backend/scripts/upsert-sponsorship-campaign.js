/* eslint-disable no-console */
const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
const dotenv = require('dotenv');

const backendRoot = path.resolve(__dirname, '..');

dotenv.config({
  path: path.join(backendRoot, '.env.local'),
});

dotenv.config({
  path: path.join(backendRoot, '.env'),
});

const inputPath = process.argv[2];

if (!inputPath) {
  console.error(
    'Usage: node scripts/upsert-sponsorship-campaign.js <campaign.json>'
  );
  process.exit(1);
}

const absoluteInput = path.resolve(inputPath);

if (!fs.existsSync(absoluteInput)) {
  console.error('Campaign JSON not found:', absoluteInput);
  process.exit(1);
}

const raw = JSON.parse(
  fs.readFileSync(absoluteInput, 'utf8')
);

const allowedPlacements = new Set([
  'discover_sidebar',
  'discover_feed',
  'digest_email',
]);

const allowedTypes = new Set([
  'resource',
  'template',
  'challenge',
  'event',
  'community',
  'partner',
]);

const allowedStatuses = new Set([
  'draft',
  'active',
  'paused',
  'ended',
]);

function required(name) {
  const value = raw[name];

  if (
    value === undefined ||
    value === null ||
    String(value).trim() === ''
  ) {
    throw new Error(`${name} is required`);
  }

  return value;
}

const campaign = {
  campaignId: String(required('campaignId')).trim(),
  status: String(required('status')).trim(),
  placement: String(required('placement')).trim(),
  type: String(required('type')).trim(),
  sponsorName: String(required('sponsorName')).trim(),
  sponsorLogo: String(raw.sponsorLogo || '').trim(),
  eyebrow: String(
    raw.eyebrow || 'Partner Spotlight'
  ).trim(),
  title: String(required('title')).trim(),
  description: String(required('description')).trim(),
  ctaLabel: String(
    raw.ctaLabel || 'Explore resource'
  ).trim(),
  destinationUrl: String(
    required('destinationUrl')
  ).trim(),
  startsAt: new Date(required('startsAt')),
  endsAt: new Date(required('endsAt')),
  priority: Number(raw.priority || 0),
};

if (!allowedStatuses.has(campaign.status)) {
  throw new Error('Invalid status');
}

if (!allowedPlacements.has(campaign.placement)) {
  throw new Error('Invalid placement');
}

if (!allowedTypes.has(campaign.type)) {
  throw new Error('Invalid type');
}

if (
  Number.isNaN(campaign.startsAt.getTime()) ||
  Number.isNaN(campaign.endsAt.getTime())
) {
  throw new Error('Invalid campaign date');
}

if (campaign.endsAt <= campaign.startsAt) {
  throw new Error(
    'endsAt must occur after startsAt'
  );
}

const parsedDestination = new URL(
  campaign.destinationUrl,
  'https://openshare.ca'
);

if (
  !['http:', 'https:'].includes(
    parsedDestination.protocol
  )
) {
  throw new Error(
    'destinationUrl must use http or https'
  );
}

async function main() {
  const mongoUri = process.env.MONGODB_URI;

  if (!mongoUri) {
    throw new Error(
      'MONGODB_URI is not configured'
    );
  }

  await mongoose.connect(mongoUri);

  const collection =
    mongoose.connection.collection(
      'sponsorship_campaigns'
    );

  const now = new Date();

  const result = await collection.updateOne(
    {
      campaignId: campaign.campaignId,
    },
    {
      $set: {
        ...campaign,
        updatedAt: now,
      },
      $setOnInsert: {
        impressions: 0,
        clicks: 0,
        createdAt: now,
      },
    },
    {
      upsert: true,
    }
  );

  console.log('Campaign upsert complete');
  console.log({
    campaignId: campaign.campaignId,
    status: campaign.status,
    placement: campaign.placement,
    matchedCount: result.matchedCount,
    modifiedCount: result.modifiedCount,
    upsertedId: result.upsertedId || null,
  });

  await mongoose.disconnect();
}

main().catch(async (error) => {
  console.error(error);
  try {
    await mongoose.disconnect();
  } catch {}
  process.exit(1);
});
