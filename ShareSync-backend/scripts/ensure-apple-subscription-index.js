#!/usr/bin/env node

'use strict';

// openshare-apple-subscription-index-v1
//
// Production keeps Mongoose autoIndex disabled. This script explicitly
// deploys the unique App Store subscription-lineage index.
//
// Safe default:
//   node scripts/ensure-apple-subscription-index.js
//
// Mutating mode:
//   node scripts/ensure-apple-subscription-index.js --apply
//
// MONGODB_URI must always be supplied explicitly.

const mongoose = require('mongoose');

const APPLY = process.argv.includes('--apply');

const COLLECTION = 'subscriptions';

const FIELD = 'appleOriginalTransactionId';

const INDEX_NAME =
  'uniq_subscriptions_apple_original_transaction_id';

const EXPECTED_KEY = {
  [FIELD]: 1,
};

const EXPECTED_OPTIONS = {
  name: INDEX_NAME,
  unique: true,
  sparse: true,
};

function fail(message) {
  console.error(`ERROR: ${message}`);
  process.exitCode = 1;
}

function sameKey(left, right) {
  return (
    left &&
    right &&
    Number(left[FIELD]) === 1 &&
    Number(right[FIELD]) === 1 &&
    Object.keys(left).length === 1 &&
    Object.keys(right).length === 1
  );
}

async function main() {
  const uri = String(
    process.env.MONGODB_URI || ''
  ).trim();

  if (!uri) {
    throw new Error(
      'MONGODB_URI is required. Refusing to guess a database.'
    );
  }

  console.log(
    `MODE=${APPLY ? 'apply' : 'check'}`
  );

  await mongoose.connect(
    uri,
    {
      autoIndex: false,
    }
  );

  const db = mongoose.connection.db;

  if (!db) {
    throw new Error(
      'MongoDB connection did not expose a database handle.'
    );
  }

  console.log(
    `DATABASE=${db.databaseName}`
  );

  const collections =
    await db
      .listCollections(
        {
          name: COLLECTION,
        },
        {
          nameOnly: true,
        }
      )
      .toArray();

  if (collections.length !== 1) {
    throw new Error(
      `Expected existing '${COLLECTION}' collection; found ${collections.length}.`
    );
  }

  const collection =
    db.collection(
      COLLECTION
    );

  // ------------------------------------------------------------
  // 1. DUPLICATE PREFLIGHT
  // ------------------------------------------------------------

  const duplicates =
    await collection.aggregate([
      {
        $match: {
          [FIELD]: {
            $type: 'string',
            $ne: '',
          },
        },
      },
      {
        $group: {
          _id: `$${FIELD}`,
          count: {
            $sum: 1,
          },
          documentIds: {
            $push: '$_id',
          },
        },
      },
      {
        $match: {
          count: {
            $gt: 1,
          },
        },
      },
      {
        $limit: 20,
      },
    ]).toArray();

  console.log(
    `DUPLICATE_LINEAGE_COUNT=${duplicates.length}`
  );

  if (duplicates.length > 0) {
    console.error(
      'Duplicate App Store subscription lineage values exist.'
    );

    for (
      const duplicate
      of duplicates
    ) {
      console.error(
        JSON.stringify({
          appleOriginalTransactionId:
            duplicate._id,

          count:
            duplicate.count,

          documentIds:
            duplicate.documentIds
              .map(
                (id) =>
                  String(id)
              ),
        })
      );
    }

    throw new Error(
      'Refusing to create unique index until duplicates are resolved.'
    );
  }

  // ------------------------------------------------------------
  // 2. EXISTING INDEX CLASSIFICATION
  // ------------------------------------------------------------

  const indexes =
    await collection
      .listIndexes()
      .toArray();

  const sameName =
    indexes.find(
      (index) =>
        index.name ===
        INDEX_NAME
    );

  const sameKeyIndex =
    indexes.find(
      (index) =>
        sameKey(
          index.key,
          EXPECTED_KEY
        )
    );

  if (sameName) {
    const exact =
      sameKey(
        sameName.key,
        EXPECTED_KEY
      ) &&
      sameName.unique === true &&
      sameName.sparse === true;

    console.log(
      `INDEX_NAME_PRESENT=yes`
    );

    console.log(
      `INDEX_NAME_EXACT=${exact ? 'yes' : 'no'}`
    );

    if (!exact) {
      throw new Error(
        `Index '${INDEX_NAME}' exists with incompatible options.`
      );
    }

    console.log(
      'APPLE_SUBSCRIPTION_INDEX_READY=yes'
    );

    return;
  }

  console.log(
    'INDEX_NAME_PRESENT=no'
  );

  if (sameKeyIndex) {
    const compatible =
      sameKeyIndex.unique === true &&
      sameKeyIndex.sparse === true;

    console.log(
      `EQUIVALENT_KEY_INDEX=${sameKeyIndex.name}`
    );

    console.log(
      `EQUIVALENT_KEY_COMPATIBLE=${
        compatible
          ? 'yes'
          : 'no'
      }`
    );

    if (!compatible) {
      throw new Error(
        'An index already exists on appleOriginalTransactionId with incompatible options.'
      );
    }

    console.log(
      'APPLE_SUBSCRIPTION_INDEX_READY=yes'
    );

    return;
  }

  console.log(
    'APPLE_SUBSCRIPTION_INDEX_READY=no'
  );

  // ------------------------------------------------------------
  // 3. CHECK MODE STOPS HERE
  // ------------------------------------------------------------

  if (!APPLY) {
    console.log(
      'WOULD_CREATE_INDEX=yes'
    );

    console.log(
      'NO_DATABASE_MUTATION=yes'
    );

    return;
  }

  // ------------------------------------------------------------
  // 4. EXPLICIT APPLY
  // ------------------------------------------------------------

  console.log(
    'CREATE_INDEX_REQUESTED=yes'
  );

  const createdName =
    await collection.createIndex(
      EXPECTED_KEY,
      EXPECTED_OPTIONS
    );

  console.log(
    `CREATED_INDEX=${createdName}`
  );

  // Verify what MongoDB actually installed.
  const after =
    await collection
      .listIndexes()
      .toArray();

  const installed =
    after.find(
      (index) =>
        (
          index.name ===
          INDEX_NAME
        ) ||
        sameKey(
          index.key,
          EXPECTED_KEY
        )
    );

  const installedExact =
    Boolean(
      installed &&
      sameKey(
        installed.key,
        EXPECTED_KEY
      ) &&
      installed.unique === true &&
      installed.sparse === true
    );

  console.log(
    `INSTALLED_INDEX_EXACT=${
      installedExact
        ? 'yes'
        : 'no'
    }`
  );

  if (!installedExact) {
    throw new Error(
      'MongoDB did not report the expected unique sparse index after creation.'
    );
  }

  console.log(
    'APPLE_SUBSCRIPTION_INDEX_READY=yes'
  );
}

main()
  .catch(
    (error) => {
      fail(
        error?.stack ||
        error?.message ||
        String(error)
      );
    }
  )
  .finally(
    async () => {
      try {
        await mongoose.disconnect();
      } catch (error) {
        console.error(
          'WARN: MongoDB disconnect failed:',
          error?.message ||
          error
        );

        if (
          process.exitCode == null ||
          process.exitCode === 0
        ) {
          process.exitCode = 1;
        }
      }
    }
  );
