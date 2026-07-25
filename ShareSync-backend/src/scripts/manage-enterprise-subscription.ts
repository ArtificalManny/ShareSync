// manual-enterprise-subscription-command-v1
import * as fs from 'fs';
import * as path from 'path';
import mongoose from 'mongoose';
import {
  PLAN_CONFIGS,
} from '../subscriptions/subscriptions.service';
import {
  BillingInterval,
  SubscriptionPlan,
  SubscriptionStatus,
} from '../subscriptions/schemas/subscription.schema';

type CommandAction =
  | 'inspect'
  | 'grant-enterprise'
  | 'revoke-enterprise';

type ParsedArguments = {
  action?: CommandAction;
  email?: string;
  reason?: string;
  operator?: string;
  confirm: boolean;
  allowStripeOverlap: boolean;
  help: boolean;
};

const MANAGED_OPTIONAL_FIELDS = [
  'currentPeriodStart',
  'currentPeriodEnd',
  'cancelAt',
  'canceledAt',
] as const;

function loadEnvironmentFiles(): void {
  const externallyDefined = new Set(
    Object.keys(process.env),
  );

  for (const filename of ['.env', '.env.local']) {
    const filepath = path.resolve(process.cwd(), filename);

    if (!fs.existsSync(filepath)) continue;

    const contents = fs.readFileSync(filepath, 'utf8');

    for (const rawLine of contents.split(/\r?\n/)) {
      const line = rawLine.trim();

      if (!line || line.startsWith('#')) continue;

      const separator = line.indexOf('=');

      if (separator <= 0) continue;

      const key = line.slice(0, separator).trim();

      if (!key || externallyDefined.has(key)) continue;

      let value = line.slice(separator + 1).trim();

      if (
        value.length >= 2 &&
        (
          (value.startsWith('"') && value.endsWith('"')) ||
          (value.startsWith("'") && value.endsWith("'"))
        )
      ) {
        value = value.slice(1, -1);
      }

      process.env[key] = value;
    }
  }
}

function parseArguments(argv: string[]): ParsedArguments {
  const args: ParsedArguments = {
    confirm: false,
    allowStripeOverlap: false,
    help: false,
  };

  const action = argv[0];

  if (
    action === 'inspect' ||
    action === 'grant-enterprise' ||
    action === 'revoke-enterprise'
  ) {
    args.action = action;
  }

  for (let index = 1; index < argv.length; index += 1) {
    const token = argv[index];

    if (token === '--confirm') {
      args.confirm = true;
      continue;
    }

    if (token === '--allow-stripe-overlap') {
      args.allowStripeOverlap = true;
      continue;
    }

    if (token === '--help' || token === '-h') {
      args.help = true;
      continue;
    }

    const equalsIndex = token.indexOf('=');

    let key = token;
    let inlineValue: string | undefined;

    if (equalsIndex > 0) {
      key = token.slice(0, equalsIndex);
      inlineValue = token.slice(equalsIndex + 1);
    }

    if (
      key === '--email' ||
      key === '--reason' ||
      key === '--operator'
    ) {
      const value =
        inlineValue !== undefined
          ? inlineValue
          : argv[index + 1];

      if (
        inlineValue === undefined &&
        value !== undefined
      ) {
        index += 1;
      }

      if (key === '--email') args.email = value;
      if (key === '--reason') args.reason = value;
      if (key === '--operator') args.operator = value;

      continue;
    }

    throw new Error(`Unknown argument: ${token}`);
  }

  return args;
}

function printUsage(): void {
  console.log(`
OpenShare Enterprise subscription management

Inspect:
  npm run subscription:inspect -- --email user@example.com

Grant:
  npm run subscription:grant-enterprise -- \\
    --email user@example.com \\
    --reason "Annual Enterprise agreement" \\
    --confirm

Revoke:
  npm run subscription:revoke-enterprise -- \\
    --email user@example.com \\
    --reason "Enterprise agreement ended" \\
    --confirm

Safety:
  --confirm is required for every mutation.
  Accounts with a Stripe subscription are refused by default.
`);
}

function normalizeEmail(value: unknown): string {
  const email = String(value || '')
    .trim()
    .toLowerCase();

  if (
    !email ||
    email.length > 254 ||
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
  ) {
    throw new Error(
      'A valid exact --email address is required',
    );
  }

  return email;
}

function normalizeReason(value: unknown): string {
  const reason = String(value || '').trim();

  if (reason.length < 5) {
    throw new Error(
      '--reason must contain at least 5 characters',
    );
  }

  if (reason.length > 500) {
    throw new Error(
      '--reason cannot exceed 500 characters',
    );
  }

  return reason;
}

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function subscriptionSnapshot(
  subscription: any,
): Record<string, any> | null {
  if (!subscription) return null;

  const snapshot: Record<string, any> = {
    plan: subscription.plan,
    status: subscription.status,
    billingInterval: subscription.billingInterval,
    limits: subscription.limits || null,
  };

  for (const field of MANAGED_OPTIONAL_FIELDS) {
    if (
      Object.prototype.hasOwnProperty.call(
        subscription,
        field,
      )
    ) {
      snapshot[field] = subscription[field];
    }
  }

  return snapshot;
}

function displaySubscription(
  subscription: any,
): Record<string, any> | null {
  if (!subscription) return null;

  return {
    id: String(subscription._id),
    userId: String(subscription.userId),
    plan: subscription.plan,
    status: subscription.status,
    billingInterval: subscription.billingInterval,
    limits: subscription.limits,
    stripeCustomerId:
      subscription.stripeCustomerId || null,
    stripeSubscriptionId:
      subscription.stripeSubscriptionId || null,
    currentPeriodEnd:
      subscription.currentPeriodEnd || null,
    cancelAt: subscription.cancelAt || null,
    updatedAt: subscription.updatedAt || null,
  };
}

function assertNoStripeConflict(
  subscription: any,
  allowStripeOverlap: boolean,
): void {
  if (
    subscription?.stripeSubscriptionId &&
    !allowStripeOverlap
  ) {
    throw new Error(
      [
        'This account has a Stripe subscription.',
        'Manual Enterprise access could be overwritten by a Stripe webhook.',
        'Resolve the Stripe subscription first, or explicitly use',
        '--allow-stripe-overlap after reviewing the risk.',
      ].join(' '),
    );
  }
}

async function resolveCollectionName(
  preferredName: string,
): Promise<string> {
  const db = mongoose.connection.db;

  if (!db) {
    throw new Error('MongoDB connection is unavailable');
  }

  const collections = await db
    .listCollections({}, { nameOnly: true })
    .toArray();

  const exact = collections.find(
    (collection) => collection.name === preferredName,
  );

  if (exact) return exact.name;

  const singular = preferredName.replace(/s$/, '');

  const fallback = collections.find((collection) => {
    const normalized = collection.name.toLowerCase();

    return (
      normalized === preferredName.toLowerCase() ||
      normalized === singular.toLowerCase()
    );
  });

  return fallback?.name || preferredName;
}

async function findExactUser(
  email: string,
): Promise<any> {
  const db = mongoose.connection.db;

  if (!db) {
    throw new Error('MongoDB connection is unavailable');
  }

  const usersCollectionName =
    await resolveCollectionName('users');

  const users = db.collection(usersCollectionName);

  const matches = await users
    .find({
      email: {
        $regex: new RegExp(
          `^${escapeRegex(email)}$`,
          'i',
        ),
      },
    })
    .project({
      email: 1,
      firstName: 1,
      lastName: 1,
      username: 1,
    })
    .limit(2)
    .toArray();

  if (matches.length === 0) {
    throw new Error(
      `No OpenShare user exists with email ${email}`,
    );
  }

  if (matches.length > 1) {
    throw new Error(
      `Multiple users matched ${email}; refusing to continue`,
    );
  }

  return matches[0];
}

async function inspectAccount(
  user: any,
): Promise<void> {
  const db = mongoose.connection.db;

  if (!db) {
    throw new Error('MongoDB connection is unavailable');
  }

  const subscriptionsName =
    await resolveCollectionName('subscriptions');

  const subscriptions =
    db.collection(subscriptionsName);

  const audits =
    db.collection('subscription_access_audits');

  const subscription = await subscriptions.findOne({
    userId: user._id,
  });

  const activeGrant = await audits.findOne(
    {
      userId: user._id,
      action: 'grant-enterprise',
      status: 'active',
    },
    {
      sort: {
        createdAt: -1,
      },
    },
  );

  const name =
    [user.firstName, user.lastName]
      .filter(Boolean)
      .join(' ')
      .trim() ||
    user.username ||
    '';

  console.log(
    JSON.stringify(
      {
        database: mongoose.connection.name,
        user: {
          id: String(user._id),
          email: user.email,
          name,
        },
        subscription:
          displaySubscription(subscription),
        activeManualEnterpriseGrant: activeGrant
          ? {
              auditId: String(activeGrant._id),
              reason: activeGrant.reason,
              operator: activeGrant.operator,
              createdAt: activeGrant.createdAt,
            }
          : null,
      },
      null,
      2,
    ),
  );
}

async function grantEnterprise(
  user: any,
  args: ParsedArguments,
): Promise<void> {
  if (!args.confirm) {
    throw new Error(
      'Mutation refused: add --confirm after reviewing the email and reason',
    );
  }

  const reason = normalizeReason(args.reason);
  const db = mongoose.connection.db;

  if (!db) {
    throw new Error('MongoDB connection is unavailable');
  }

  const subscriptionsName =
    await resolveCollectionName('subscriptions');

  const subscriptions =
    db.collection(subscriptionsName);

  const audits =
    db.collection('subscription_access_audits');

  const before = await subscriptions.findOne({
    userId: user._id,
  });

  assertNoStripeConflict(
    before,
    args.allowStripeOverlap,
  );

  const existingGrant = await audits.findOne({
    userId: user._id,
    action: 'grant-enterprise',
    status: 'active',
  });

  if (
    before?.plan === SubscriptionPlan.ENTERPRISE &&
    before?.status === SubscriptionStatus.ACTIVE
  ) {
    console.log(
      'No change: this account is already Enterprise and active.',
    );

    await inspectAccount(user);
    return;
  }

  if (existingGrant) {
    throw new Error(
      'An active manual Enterprise grant already exists for this user',
    );
  }

  const now = new Date();
  const operator =
    String(
      args.operator ||
        process.env.RENDER_SERVICE_NAME ||
        process.env.USER ||
        'unknown',
    )
      .trim()
      .slice(0, 160);

  const pendingAudit = await audits.insertOne({
    action: 'grant-enterprise',
    status: 'pending',
    userId: user._id,
    email: String(user.email || '').toLowerCase(),
    reason,
    operator,
    environment:
      process.env.NODE_ENV || 'unknown',
    before: subscriptionSnapshot(before),
    createdAt: now,
    updatedAt: now,
  });

  try {
    await subscriptions.updateOne(
      {
        userId: user._id,
      },
      {
        $set: {
          plan: SubscriptionPlan.ENTERPRISE,
          status: SubscriptionStatus.ACTIVE,
          billingInterval:
            before?.billingInterval ||
            BillingInterval.MONTHLY,
          limits:
            PLAN_CONFIGS[
              SubscriptionPlan.ENTERPRISE
            ].limits,
          updatedAt: now,
        },
        $unset: {
          cancelAt: '',
          canceledAt: '',
        },
        $setOnInsert: {
          userId: user._id,
          usage: {
            projects: 0,
            storage: 0,
            aiCalls: 0,
            aiCallsThisMonth: 0,
          },
          activeMembers: 1,
          createdAt: now,
        },
      },
      {
        upsert: true,
      },
    );

    const after = await subscriptions.findOne({
      userId: user._id,
    });

    await audits.updateOne(
      {
        _id: pendingAudit.insertedId,
      },
      {
        $set: {
          status: 'active',
          after: subscriptionSnapshot(after),
          updatedAt: new Date(),
        },
      },
    );

    console.log(
      'Enterprise access granted successfully.',
    );

    await inspectAccount(user);
  } catch (error) {
    await audits.updateOne(
      {
        _id: pendingAudit.insertedId,
      },
      {
        $set: {
          status: 'failed',
          error:
            error instanceof Error
              ? error.message
              : String(error),
          updatedAt: new Date(),
        },
      },
    );

    throw error;
  }
}

async function revokeEnterprise(
  user: any,
  args: ParsedArguments,
): Promise<void> {
  if (!args.confirm) {
    throw new Error(
      'Mutation refused: add --confirm after reviewing the email and reason',
    );
  }

  const reason = normalizeReason(args.reason);
  const db = mongoose.connection.db;

  if (!db) {
    throw new Error('MongoDB connection is unavailable');
  }

  const subscriptionsName =
    await resolveCollectionName('subscriptions');

  const subscriptions =
    db.collection(subscriptionsName);

  const audits =
    db.collection('subscription_access_audits');

  const current = await subscriptions.findOne({
    userId: user._id,
  });

  if (!current) {
    throw new Error(
      'This user does not have a subscription record',
    );
  }

  assertNoStripeConflict(
    current,
    args.allowStripeOverlap,
  );

  const activeGrant = await audits.findOne(
    {
      userId: user._id,
      action: 'grant-enterprise',
      status: 'active',
    },
    {
      sort: {
        createdAt: -1,
      },
    },
  );

  if (!activeGrant) {
    throw new Error(
      'No active manual Enterprise grant exists for this user',
    );
  }

  const previous =
    activeGrant.before &&
    typeof activeGrant.before === 'object'
      ? activeGrant.before
      : null;

  const restoredPlan =
    previous?.plan || SubscriptionPlan.FREE;

  const now = new Date();

  const setValues: Record<string, any> = {
    plan: restoredPlan,
    status:
      previous?.status ||
      SubscriptionStatus.ACTIVE,
    billingInterval:
      previous?.billingInterval ||
      BillingInterval.MONTHLY,
    limits:
      previous?.limits ||
      PLAN_CONFIGS[restoredPlan]?.limits ||
      PLAN_CONFIGS[SubscriptionPlan.FREE].limits,
    updatedAt: now,
  };

  const unsetValues: Record<string, string> = {};

  for (const field of MANAGED_OPTIONAL_FIELDS) {
    if (
      previous &&
      Object.prototype.hasOwnProperty.call(
        previous,
        field,
      ) &&
      previous[field] !== null &&
      previous[field] !== undefined
    ) {
      setValues[field] = previous[field];
    } else {
      unsetValues[field] = '';
    }
  }

  const operator =
    String(
      args.operator ||
        process.env.RENDER_SERVICE_NAME ||
        process.env.USER ||
        'unknown',
    )
      .trim()
      .slice(0, 160);

  const revokeAudit = await audits.insertOne({
    action: 'revoke-enterprise',
    status: 'pending',
    grantAuditId: activeGrant._id,
    userId: user._id,
    email: String(user.email || '').toLowerCase(),
    reason,
    operator,
    environment:
      process.env.NODE_ENV || 'unknown',
    before: subscriptionSnapshot(current),
    createdAt: now,
    updatedAt: now,
  });

  try {
    await subscriptions.updateOne(
      {
        _id: current._id,
      },
      {
        $set: setValues,
        $unset: unsetValues,
      },
    );

    const after = await subscriptions.findOne({
      _id: current._id,
    });

    await audits.updateOne(
      {
        _id: activeGrant._id,
      },
      {
        $set: {
          status: 'revoked',
          revokedAt: now,
          revokeReason: reason,
          revokeOperator: operator,
          updatedAt: now,
        },
      },
    );

    await audits.updateOne(
      {
        _id: revokeAudit.insertedId,
      },
      {
        $set: {
          status: 'completed',
          after: subscriptionSnapshot(after),
          updatedAt: new Date(),
        },
      },
    );

    console.log(
      'Manual Enterprise access revoked successfully.',
    );

    await inspectAccount(user);
  } catch (error) {
    await audits.updateOne(
      {
        _id: revokeAudit.insertedId,
      },
      {
        $set: {
          status: 'failed',
          error:
            error instanceof Error
              ? error.message
              : String(error),
          updatedAt: new Date(),
        },
      },
    );

    throw error;
  }
}

async function main(): Promise<void> {
  loadEnvironmentFiles();

  const args = parseArguments(
    process.argv.slice(2),
  );

  if (args.help || !args.action) {
    printUsage();

    if (!args.help) {
      process.exitCode = 1;
    }

    return;
  }

  const email = normalizeEmail(args.email);
  const mongoUri = process.env.MONGODB_URI;

  if (!mongoUri) {
    throw new Error(
      'MONGODB_URI is not configured. Run this from the backend environment or Render Shell.',
    );
  }

  await mongoose.connect(mongoUri);

  try {
    const user = await findExactUser(email);

    console.log(
      `Connected to database "${mongoose.connection.name}".`,
    );

    if (args.action === 'inspect') {
      await inspectAccount(user);
      return;
    }

    if (args.action === 'grant-enterprise') {
      await grantEnterprise(user, args);
      return;
    }

    await revokeEnterprise(user, args);
  } finally {
    await mongoose.disconnect();
  }
}

main().catch((error) => {
  console.error(
    '\nEnterprise subscription command failed:',
  );

  console.error(
    error instanceof Error
      ? error.message
      : String(error),
  );

  process.exitCode = 1;
});
