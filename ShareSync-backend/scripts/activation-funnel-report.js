#!/usr/bin/env node

// activation-funnel-report-v1
require('dotenv').config();

const mongoose = require('mongoose');

function readDays() {
  const raw =
    process.argv
      .slice(2)
      .find((arg) =>
        arg.startsWith('--days=')
      );

  const value =
    Number(
      raw
        ? raw.split('=')[1]
        : 30,
    );

  return Number.isFinite(value) &&
    value > 0
    ? Math.floor(value)
    : 30;
}

function readSince() {
  const raw =
    process.argv
      .slice(2)
      .find((arg) =>
        arg.startsWith('--since=')
      );

  if (!raw) {
    return null;
  }

  const value =
    new Date(
      raw.slice('--since='.length)
    );

  if (
    Number.isNaN(
      value.getTime()
    )
  ) {
    throw new Error(
      'Invalid --since date'
    );
  }

  return value;
}

function pct(
  value,
  total,
) {
  if (!total) {
    return '0.0%';
  }

  return (
    (
      (value / total) *
      100
    ).toFixed(1) + '%'
  );
}

(async () => {
  if (!process.env.MONGODB_URI) {
    throw new Error(
      'MONGODB_URI is not configured'
    );
  }

  const days = readDays();

  await mongoose.connect(
    process.env.MONGODB_URI
  );

  const db =
    mongoose.connection.db;

  const rollingStart =
    new Date(
      Date.now() -
        days *
          24 *
          60 *
          60 *
          1000
    );

  const explicitSince =
    readSince();

  // During the first weeks after instrumentation launches,
  // --since prevents pre-instrumentation accounts from
  // depressing the activation percentages.
  const start =
    explicitSince &&
    explicitSince > rollingStart
      ? explicitSince
      : rollingStart;

  const cohort =
    await db
      .collection('users')
      .find(
        {
          createdAt: {
            $gte: start,
          },
        },
        {
          projection: {
            createdAt: 1,
            activationMilestones: 1,
          },
        },
      )
      .toArray();

  const total =
    cohort.length;

  const rows = [
    [
      'Accounts created',
      total,
    ],
    [
      'Created a project',
      cohort.filter(
        (user) =>
          user
            ?.activationMilestones
            ?.projectCreatedAt
      ).length,
    ],
    [
      'Created first Move',
      cohort.filter(
        (user) =>
          user
            ?.activationMilestones
            ?.firstMoveCreatedAt
      ).length,
    ],
    [
      'Invited teammate',
      cohort.filter(
        (user) =>
          user
            ?.activationMilestones
            ?.teammateInvitedAt
      ).length,
    ],
    [
      'Completed first Move',
      cohort.filter(
        (user) =>
          user
            ?.activationMilestones
            ?.firstMoveCompletedAt
      ).length,
    ],
    [
      'Returned later',
      cohort.filter(
        (user) =>
          user
            ?.activationMilestones
            ?.returnedAt
      ).length,
    ],
  ];

  console.log('');
  console.log(
    `OpenShare Activation Funnel — last ${days} days`
  );

  console.log(
    `Cohort start: ${start.toISOString()}`
  );

  console.log('');

  const width = 24;

  for (
    const [
      label,
      value,
    ] of rows
  ) {
    console.log(
      label.padEnd(width),
      String(value).padStart(5),
      pct(value, total).padStart(8),
    );
  }

  console.log('');
  console.log(
    'Note: milestone instrumentation begins when this feature is deployed.'
  );

  await mongoose.disconnect();
})().catch(async (error) => {
  console.error(
    'Activation funnel report FAILED:',
    error?.message || error,
  );

  try {
    await mongoose.disconnect();
  } catch {}

  process.exit(1);
});
