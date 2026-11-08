#!/usr/bin/env node

'use strict';

// openshare-vault-private-migration-v1 (F100R8R64R48b, R48c)
//
// Moves Vault files that still live in the public R2 bucket into the private Vault
// bucket added in R48, replaces the public link stored on each Vault record and on
// its copies (task attachments, milestone / announcement / team-room file
// references), deletes the public copies, and removes Vault files whose project no
// longer exists. It also takes over anything the earlier copy-only migration did
// (its progress is in the vaultprivatemigrations collection), so those public
// copies are deleted as well.
//
// Safe default (read-only report):
//   node scripts/migrate-vault-to-private.js
// Every run first prints the database it is connected to and how many projects it has.
//
// Steps, in this order. Each one only previews unless --apply is given; --limit N
// handles at most N files. Every step can be stopped and run again: finished files
// are skipped.
//   node scripts/migrate-vault-to-private.js --copy [--apply] [--limit N]
//   node scripts/migrate-vault-to-private.js --delete-public [--apply] [--limit N]
//   node scripts/migrate-vault-to-private.js --remove-orphans [--apply] [--limit N]
//
// Required settings (never stored by this script): MONGODB_URI, R2_ENDPOINT,
// R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET, R2_PUBLIC_BASE_URL,
// R2_VAULT_BUCKET.

const crypto = require('crypto');
const path = require('path');

const COLLECTIONS = {
  files: 'vaultfiles',
  folders: 'vaultfolders',
  projects: 'projects',
  tasks: 'tasks',
  milestones: 'milestones',
  announcements: 'announcements',
  threadMessages: 'threadmessages',
  log: 'vault_private_migrations',
  earlier: 'vaultprivatemigrations',
};

const REQUIRED_ENV = [
  'MONGODB_URI',
  'R2_ENDPOINT',
  'R2_ACCESS_KEY_ID',
  'R2_SECRET_ACCESS_KEY',
  'R2_BUCKET',
  'R2_PUBLIC_BASE_URL',
  'R2_VAULT_BUCKET',
];

// Must match R48 (src/vault/vault.service.ts and src/uploads/uploads.service.ts).
const PRIVATE_URL_PREFIX = 'vault-private:';
const PRIVATE_PROVIDER = 'r2-private';
const PRIVATE_INLINE_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'image/avif',
  'image/bmp',
  'application/pdf',
]);

// The only object names this script copies from or deletes: public uploads as the
// app names them (uploads/<id><ext>) and private Vault copies as R48 names them.
const PUBLIC_KEY_PATTERN = /^uploads\/[^/]+$/;
const PRIVATE_KEY_PATTERN = /^vault\/[A-Za-z0-9_-]{1,64}\/[0-9a-f-]{36}(\.[a-z0-9]{1,16})?$/;

// Each file is held in memory while it is copied and checked.
const MAX_FILE_BYTES = 200 * 1024 * 1024;

function contentDispositionFor(fileName, mime, forceDownload) {
  const name =
    String(fileName || '')
      .replace(/[\u0000-\u001f\u007f]/g, '')
      .trim() || 'file';

  const asciiName = name
    .replace(/[^\x20-\x7e]/g, '_')
    .replace(/["\\]/g, '_');

  const encodedName = encodeURIComponent(name).replace(
    /['()*]/g,
    (char) => `%${char.charCodeAt(0).toString(16).toUpperCase()}`,
  );

  const type =
    !forceDownload &&
    PRIVATE_INLINE_TYPES.has(String(mime || '').toLowerCase())
      ? 'inline'
      : 'attachment';

  return `${type}; filename="${asciiName}"; filename*=UTF-8''${encodedName}`;
}

// The same file always gets the same private name, so a rerun overwrites its own
// earlier copy instead of creating a second one.
function privateObjectId(fileId) {
  const hex = crypto
    .createHash('sha256')
    .update(`openshare-vault-private:${fileId}`)
    .digest('hex');

  return [
    hex.slice(0, 8),
    hex.slice(8, 12),
    `5${hex.slice(13, 16)}`,
    `${((parseInt(hex.slice(16, 17), 16) & 0x3) | 0x8).toString(16)}${hex.slice(17, 20)}`,
    hex.slice(20, 32),
  ].join('-');
}

function safeExtension(...candidates) {
  for (const candidate of candidates) {
    const ext = path.extname(String(candidate || '')).toLowerCase();
    if (/^\.[a-z0-9]{1,16}$/.test(ext)) return ext;
  }
  return '';
}

// Mongoose gives ObjectId an _id that returns itself, so ObjectIds are checked first.
function idString(value) {
  if (!value) return '';
  if (typeof value === 'string') return value;
  if (typeof value.toHexString === 'function') return value.toHexString();
  if (value._id && value._id !== value) return idString(value._id);
  return String(value);
}

function trimSlash(value) {
  return String(value || '').trim().replace(/\/+$/, '');
}

function sha256(bytes) {
  return crypto.createHash('sha256').update(bytes).digest('hex');
}

function parseArgs(argv) {
  const args = { mode: 'report', apply: false, limit: Infinity };
  const modes = { '--copy': 'copy', '--delete-public': 'delete-public', '--remove-orphans': 'remove-orphans' };
  const chosen = [];

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (modes[arg]) {
      chosen.push(modes[arg]);
    } else if (arg === '--apply') {
      args.apply = true;
    } else if (arg === '--limit') {
      const value = Number(argv[i + 1]);
      if (!Number.isInteger(value) || value < 1) throw new Error('--limit needs a whole number of at least 1');
      args.limit = value;
      i += 1;
    } else {
      throw new Error(`Unknown option: ${arg}`);
    }
  }

  if (chosen.length > 1) throw new Error('Choose only one of --copy, --delete-public, --remove-orphans');
  if (chosen.length === 1) args.mode = chosen[0];
  if (args.apply && args.mode === 'report') throw new Error('--apply needs --copy, --delete-public or --remove-orphans');
  return args;
}

function readConfig(env) {
  const missing = REQUIRED_ENV.filter((key) => !String(env[key] || '').trim());
  if (missing.length) throw new Error(`Missing settings: ${missing.join(', ')}`);

  const config = {
    publicBucket: String(env.R2_BUCKET).trim(),
    privateBucket: String(env.R2_VAULT_BUCKET).trim(),
    publicBase: trimSlash(env.R2_PUBLIC_BASE_URL),
  };

  if (config.publicBucket === config.privateBucket) {
    throw new Error('R2_VAULT_BUCKET must be a different bucket from R2_BUCKET');
  }

  return config;
}

// Sorts a Vault record into one of the kinds the report shows.
function classify(file, config) {
  const url = String(file.fileUrl || '').trim();

  if (String(file.storageProvider || '') === PRIVATE_PROVIDER && file.storageKey) {
    return { kind: 'private' };
  }

  // Same key the app uses when it deletes a public upload (resolveR2KeyFromUrl).
  if (config.publicBase && url.startsWith(`${config.publicBase}/`)) {
    const key = url
      .slice(config.publicBase.length + 1)
      .split(/[?#]/, 1)[0]
      .replace(/^\/+/, '');
    if (PUBLIC_KEY_PATTERN.test(key)) return { kind: 'public', key, url };
    return { kind: 'other', host: 'public bucket, unexpected name' };
  }

  if (url.startsWith(PRIVATE_URL_PREFIX)) return { kind: 'broken-placeholder' };
  if (/^https?:\/\/storage\.sharesync\.app\//i.test(url)) return { kind: 'legacy' };
  if (url.startsWith('/uploads/') || url.startsWith('uploads/')) return { kind: 'server-disk' };

  if (/^https?:\/\//i.test(url)) {
    try {
      const parsed = new URL(url);
      if (parsed.pathname.startsWith('/uploads/')) return { kind: 'server-disk', host: parsed.host };
      return { kind: 'other', host: parsed.host };
    } catch {
      return { kind: 'other', host: 'unparseable' };
    }
  }

  return { kind: 'other', host: url ? 'not a link' : 'empty' };
}

async function readBody(body) {
  if (!body) throw new Error('empty object body');
  if (typeof body.transformToByteArray === 'function') {
    return Buffer.from(await body.transformToByteArray());
  }
  const chunks = [];
  for await (const chunk of body) chunks.push(Buffer.from(chunk));
  return Buffer.concat(chunks);
}

function isMissingObject(error) {
  const name = String((error && (error.name || error.Code)) || '');
  const status = error && error.$metadata && error.$metadata.httpStatusCode;
  return name === 'NoSuchKey' || name === 'NotFound' || status === 404;
}

async function run({ argv, env, db, s3, sdk, ObjectId = null, log = console.log, now = () => new Date() }) {
  const args = parseArgs(argv);
  const config = readConfig(env);
  const { GetObjectCommand, PutObjectCommand, HeadObjectCommand, DeleteObjectCommand } = sdk;
  const col = (name) => db.collection(COLLECTIONS[name]);
  const summary = { errors: 0 };
  const bump = (key, by = 1) => { summary[key] = (summary[key] || 0) + by; };
  const errorText = (error) => (error && error.message ? error.message : String(error));
  const databaseName = String((db && db.databaseName) || '(unknown)');

  const projectIds = new Set(
    (await col('projects').find({}, { projection: { _id: 1 } }).toArray()).map((p) => idString(p._id)),
  );
  const files = await col('files').find({}).sort({ _id: 1 }).toArray();
  log(`Database: ${databaseName} (${projectIds.size} projects, ${files.length} Vault files)`);
  // Vault files but no projects means the wrong database (or a broken restore): every
  // file would look like it belongs to a deleted project.
  if (files.length && !projectIds.size) {
    if (args.mode !== 'report') {
      throw new Error(`Database ${databaseName} has Vault files but no projects. Wrong database? Nothing was changed.`);
    }
    log('WARNING: this database has Vault files but no projects. Check MONGODB_URI before any --apply.');
  }
  const fileById = new Map(files.map((file) => [idString(file._id), file]));
  const projectExists = (file) => projectIds.has(idString(file.projectId));
  const publicKeyUsers = (key, exceptId, onlyExistingProjects) => files.filter((f) => {
    if (idString(f._id) === exceptId) return false;
    if (onlyExistingProjects && !projectExists(f)) return false;
    const c = classify(f, config);
    return c.kind === 'public' && c.key === key;
  });

  // What the earlier copy-only migration did, as seen from the records now.
  const ownEntries = new Map((await col('log').find({}).toArray()).map((e) => [idString(e._id), e]));
  const earlier = (await col('earlier').find({}).sort({ _id: 1 }).toArray()).map((entry) => {
    const fileId = idString(entry.fileId || entry._id);
    const record = fileById.get(fileId);
    let status = 'not-switched';
    if (ownEntries.has(fileId)) status = 'taken-over';
    else if (!record) status = 'record-gone';
    else if (String(record.storageProvider || '') === PRIVATE_PROVIDER && record.storageKey === entry.destinationKey) status = 'moved';
    return { entry, fileId, status };
  });
  const earlierByFile = new Map(earlier.map((x) => [x.fileId, x]));
  const pendingTakeover = earlier.filter((x) => x.status === 'moved' || x.status === 'record-gone');
  const requireTakeover = () => {
    if (pendingTakeover.length) {
      throw new Error(`Run --copy --apply first: it takes over ${pendingTakeover.length} file(s) the earlier copy-only migration handled.`);
    }
  };

  const placeholderFor = (fileId) => `${PRIVATE_URL_PREFIX}${fileId}`;

  // The schemas store file IDs as text; older or hand-written data may hold ObjectIds.
  const idForms = (fileId) => {
    const forms = [fileId];
    if (ObjectId && /^[0-9a-f]{24}$/i.test(fileId)) forms.push(new ObjectId(fileId));
    return forms;
  };

  // Replace the stored link in every copy of one Vault file. Safe to repeat.
  async function rewriteCopies(fileId) {
    const placeholder = placeholderFor(fileId);
    const ids = { $in: idForms(fileId) };
    const results = await Promise.all([
      col('tasks').updateMany(
        { attachments: { $elemMatch: { fileId: ids, source: 'project_file' } } },
        { $set: { 'attachments.$[a].fileUrl': placeholder, 'attachments.$[a].url': placeholder } },
        { arrayFilters: [{ 'a.fileId': ids, 'a.source': 'project_file' }] },
      ),
      ...['milestones', 'announcements', 'threadMessages'].map((name) =>
        col(name).updateMany(
          { 'fileReferences.fileId': ids },
          { $set: { 'fileReferences.$[r].fileUrl': placeholder } },
          { arrayFilters: [{ 'r.fileId': ids }] },
        ),
      ),
    ]);
    return results.reduce((sum, r) => sum + Number((r && r.modifiedCount) || 0), 0);
  }

  // Places that still hold this exact public link after the rewrite: links the rewrite
  // can't tie to the file by its ID (for example a task attachment not marked as a
  // project file). Deleting the public copy would break them, so it is kept.
  async function linkedElsewhere(url) {
    if (!url) return 0;
    const counts = await Promise.all([
      col('tasks').countDocuments({ $or: [{ 'attachments.fileUrl': url }, { 'attachments.url': url }] }),
      col('milestones').countDocuments({ 'fileReferences.fileUrl': url }),
      col('announcements').countDocuments({ $or: [{ 'fileReferences.fileUrl': url }, { attachments: url }, { 'comments.attachments': url }] }),
      col('threadMessages').countDocuments({ $or: [{ 'fileReferences.fileUrl': url }, { 'attachments.fileUrl': url }, { 'attachments.url': url }] }),
    ]);
    return counts.reduce((sum, n) => sum + n, 0);
  }

  // Remove a private copy this run wrote but did not switch to, unless the record
  // already points at it (another run finished the same file first).
  async function discardPrivateCopy(file, targetKey) {
    const current = await col('files').findOne({ _id: file._id });
    if (current && current.storageKey === targetKey) return false;
    await s3.send(new DeleteObjectCommand({ Bucket: config.privateBucket, Key: targetKey }));
    await col('log').deleteOne({ _id: idString(file._id), targetKey, switchedAt: { $exists: false } });
    return true;
  }

  // Delete a private copy that no Vault record points at.
  async function deleteUnusedPrivate(bucket, key) {
    const target = String(bucket || config.privateBucket);
    if (!PRIVATE_KEY_PATTERN.test(String(key || '')) || target === config.publicBucket) {
      throw new Error(`unexpected private copy ${target}/${key}; nothing deleted`);
    }
    if (await col('files').findOne({ storageKey: key })) return false;
    await s3.send(new DeleteObjectCommand({ Bucket: target, Key: key }));
    return true;
  }

  async function deletePublic(key) {
    if (!PUBLIC_KEY_PATTERN.test(String(key || ''))) {
      throw new Error(`unexpected public name ${key}; nothing deleted`);
    }
    await s3.send(new DeleteObjectCommand({ Bucket: config.publicBucket, Key: key }));
  }

  function printDeletedUrls(urls) {
    if (!urls.length) return;
    log('Public links now removed (purge these from the Cloudflare cache if your public files use your own domain):');
    for (const url of urls) log(`  ${url}`);
  }

  // ── Report ──────────────────────────────────────────────────────────────
  if (args.mode === 'report') {
    const kinds = {};
    const hosts = {};
    let orphans = 0;
    const orphanKinds = {};
    for (const file of files) {
      const c = classify(file, config);
      if (!projectExists(file)) {
        orphans += 1;
        orphanKinds[c.kind] = (orphanKinds[c.kind] || 0) + 1;
        continue;
      }
      kinds[c.kind] = (kinds[c.kind] || 0) + 1;
      if (c.host) hosts[`${c.kind} @ ${c.host}`] = (hosts[`${c.kind} @ ${c.host}`] || 0) + 1;
    }
    const logEntries = [...ownEntries.values()];
    const copies = {
      tasks: await col('tasks').countDocuments({ 'attachments.source': 'project_file' }),
      milestones: await col('milestones').countDocuments({ 'fileReferences.0': { $exists: true } }),
      announcements: await col('announcements').countDocuments({ 'fileReferences.0': { $exists: true } }),
      threadMessages: await col('threadMessages').countDocuments({ 'fileReferences.0': { $exists: true } }),
    };
    const earlierCounts = {};
    for (const x of earlier) earlierCounts[x.status] = (earlierCounts[x.status] || 0) + 1;
    // Public Vault links (still public, or moved but not yet deleted) stored where --copy
    // can't tie them to the file by its ID.
    const publicUrls = [...new Set([
      ...files.map((f) => classify(f, config)).filter((c) => c.kind === 'public').map((c) => c.url),
      ...logEntries.filter((e) => e.sourceUrl && !e.publicDeletedAt).map((e) => e.sourceUrl),
    ])];
    const unmarked = { tasks: 0, announcements: 0, threadMessages: 0 };
    if (publicUrls.length) {
      const anyOf = { $in: publicUrls };
      unmarked.tasks = await col('tasks').countDocuments({
        attachments: { $elemMatch: { source: { $ne: 'project_file' }, $or: [{ fileUrl: anyOf }, { url: anyOf }] } },
      });
      unmarked.announcements = await col('announcements').countDocuments({
        $or: [{ attachments: anyOf }, { 'comments.attachments': anyOf }],
      });
      unmarked.threadMessages = await col('threadMessages').countDocuments({
        $or: [{ 'attachments.fileUrl': anyOf }, { 'attachments.url': anyOf }],
      });
    }

    log('=== Vault private migration — report (read-only) ===');
    log(`Vault files: ${files.length}`);
    log(`  in projects that exist: ${files.length - orphans}`);
    log(`    public R2, to move with --copy:        ${kinds.public || 0}`);
    log(`    already private:                       ${kinds.private || 0}`);
    log(`    on the server's own disk (not moved):  ${kinds['server-disk'] || 0}`);
    log(`    broken legacy links (not moved):       ${kinds.legacy || 0}`);
    log(`    placeholder without storage (check):   ${kinds['broken-placeholder'] || 0}`);
    log(`    other links (check):                   ${kinds.other || 0}`);
    for (const [label, count] of Object.entries(hosts)) log(`      ${label}: ${count}`);
    log(`  in deleted projects, removed with --remove-orphans: ${orphans}`);
    for (const [kind, count] of Object.entries(orphanKinds)) log(`    ${kind}: ${count}`);
    log('Documents holding copies of Vault links:');
    log(`  task attachments: ${copies.tasks}`);
    log(`  milestones: ${copies.milestones}`);
    log(`  announcements: ${copies.announcements}`);
    log(`  team-room messages: ${copies.threadMessages}`);
    log('Vault links stored without the file ID (--delete-public keeps those public copies):');
    log(`  task attachments not marked as project files: ${unmarked.tasks}`);
    log(`  announcement and announcement-comment attachments: ${unmarked.announcements}`);
    log(`  team-room uploads: ${unmarked.threadMessages}`);
    log(`Earlier copy-only migration (${COLLECTIONS.earlier}): ${earlier.length} file(s)`);
    if (earlier.length) {
      log(`  moved by it, --copy takes them over:          ${earlierCounts.moved || 0}`);
      log(`  copied by it, not switched (--copy reuses):   ${earlierCounts['not-switched'] || 0}`);
      log(`  deleted in the app since, --copy takes over:  ${earlierCounts['record-gone'] || 0}`);
      log(`  already taken over:                           ${earlierCounts['taken-over'] || 0}`);
    }
    log('Migration progress:');
    log(`  copied but not finished (run --copy again): ${logEntries.filter((e) => !e.copiesUpdatedAt).length}`);
    log(`  moved to private: ${logEntries.filter((e) => e.switchedAt && e.copiesUpdatedAt).length}`);
    log(`  public copy deleted: ${logEntries.filter((e) => e.publicDeletedAt).length}`);
    log(`  still to delete with --delete-public: ${logEntries.filter((e) => e.switchedAt && !e.publicDeletedAt).length}`);
    return { ...summary, mode: 'report', database: databaseName, kinds, orphans, copies, unmarked, earlier: earlierCounts };
  }

  // ── Copy ────────────────────────────────────────────────────────────────
  if (args.mode === 'copy') {
    log(`=== Vault private migration — copy (${args.apply ? 'APPLY' : 'preview'}) ===`);
    let handled = 0;

    // Take over what the earlier copy-only migration finished, so the next steps
    // delete those public copies (and any copy left behind by a deleted file).
    for (const x of pendingTakeover) {
      if (handled >= args.limit) break;
      handled += 1;
      const e = x.entry;
      if (!args.apply) {
        log(`would take over ${x.fileId} from the earlier migration (${x.status})`);
        bump('plannedTakeover');
        continue;
      }
      try {
        await col('log').updateOne(
          { _id: x.fileId },
          { $set: {
            projectId: idString(e.projectId),
            sourceKey: String(e.sourceKey || ''),
            sourceUrl: String(e.sourceUrl || ''),
            targetKey: String(e.destinationKey || ''),
            bucket: String(e.destinationBucket || config.privateBucket),
            size: Number(e.sizeInBytes),
            sha256: e.verifiedSHA256 || null,
            takenOverFrom: COLLECTIONS.earlier,
            recordGone: x.status === 'record-gone',
            copiedAt: e.createdAt || now(),
            switchedAt: now(),
          } },
          { upsert: true },
        );
        const changed = await rewriteCopies(x.fileId);
        await col('log').updateOne({ _id: x.fileId }, { $set: { copiesUpdatedAt: now(), copiesChanged: changed } });
        bump('takenOver');
        log(`took over ${x.fileId} (${x.status}, ${changed} copies updated)`);
      } catch (error) {
        summary.errors += 1;
        log(`ERROR ${x.fileId}: ${errorText(error)}`);
      }
    }

    for (const file of files) {
      if (handled >= args.limit) break;
      if (!projectExists(file)) continue;
      const fileId = idString(file._id);
      const c = classify(file, config);

      // Finish files an interrupted run already switched to private.
      if (c.kind === 'private') {
        const entry = await col('log').findOne({ _id: fileId });
        if (entry && !entry.copiesUpdatedAt && file.storageKey === entry.targetKey) {
          handled += 1;
          if (!args.apply) { log(`would finish copies for ${fileId}`); continue; }
          if (!entry.switchedAt) {
            await col('log').updateOne({ _id: fileId }, { $set: { switchedAt: now() } });
          }
          const changed = await rewriteCopies(fileId);
          await col('log').updateOne({ _id: fileId }, { $set: { copiesUpdatedAt: now(), copiesChanged: changed } });
          bump('finished');
          log(`finished copies for ${fileId} (${changed} updated)`);
        }
        continue;
      }
      if (c.kind !== 'public') continue;

      handled += 1;
      const projectId = idString(file.projectId);
      // A copy the earlier migration made of this same link is reused (and rewritten).
      const prior = earlierByFile.get(fileId);
      const reuse = prior && prior.status === 'not-switched' &&
        String(prior.entry.sourceUrl || '') === String(file.fileUrl || '') &&
        String(prior.entry.destinationBucket || '') === config.privateBucket &&
        PRIVATE_KEY_PATTERN.test(String(prior.entry.destinationKey || '')) &&
        String(prior.entry.destinationKey).startsWith(`vault/${projectId}/`);
      const targetKey = reuse
        ? String(prior.entry.destinationKey)
        : `vault/${projectId}/${privateObjectId(fileId)}${safeExtension(c.key, file.originalName)}`;

      if (!args.apply) {
        log(`would move ${fileId}: ${c.key} -> ${config.privateBucket}/${targetKey}`);
        bump('planned');
        continue;
      }

      // Until the switch below is sent, nothing points at the new private copy, so a
      // failure before then can remove it. After that, it stays: a rerun finishes.
      let wrotePrivate = false;
      let switchSent = false;
      try {
        let source;
        try {
          source = await s3.send(new GetObjectCommand({ Bucket: config.publicBucket, Key: c.key }));
        } catch (error) {
          if (isMissingObject(error)) {
            bump('sourceMissing');
            log(`SKIP ${fileId}: public object ${c.key} not found`);
            continue;
          }
          throw error;
        }
        if (Number(source.ContentLength) > MAX_FILE_BYTES) {
          throw new Error(`public object is ${source.ContentLength} bytes, more than this script copies; not moved`);
        }
        const bytes = await readBody(source.Body);
        const digest = sha256(bytes);
        const mime = String(file.mimeType || source.ContentType || 'application/octet-stream');

        wrotePrivate = true;
        await s3.send(new PutObjectCommand({
          Bucket: config.privateBucket,
          Key: targetKey,
          Body: bytes,
          ContentType: mime,
          CacheControl: 'private, no-store',
          ContentDisposition: contentDispositionFor(file.originalName, mime, false),
        }));

        // Read the private copy back: same size and same SHA-256 before anything
        // points at it.
        const head = await s3.send(new HeadObjectCommand({ Bucket: config.privateBucket, Key: targetKey }));
        if (Number(head.ContentLength) !== bytes.length) {
          throw new Error(`private copy size ${head.ContentLength} does not match ${bytes.length}`);
        }
        const back = await s3.send(new GetObjectCommand({ Bucket: config.privateBucket, Key: targetKey }));
        if (sha256(await readBody(back.Body)) !== digest) {
          throw new Error('private copy content does not match the public file');
        }

        await col('log').updateOne(
          { _id: fileId },
          { $set: { projectId, sourceKey: c.key, sourceUrl: c.url, targetKey, bucket: config.privateBucket, size: bytes.length, sha256: digest, reusedEarlierCopy: Boolean(reuse), copiedAt: now() } },
          { upsert: true },
        );

        // Switch the record only if it still points at the public copy we moved.
        switchSent = true;
        const switched = await col('files').updateOne(
          { _id: file._id, fileUrl: file.fileUrl, storageProvider: { $ne: PRIVATE_PROVIDER } },
          { $set: { fileUrl: placeholderFor(fileId), storageProvider: PRIVATE_PROVIDER, storageBucket: config.privateBucket, storageKey: targetKey } },
        );

        if (!switched || Number(switched.matchedCount) !== 1) {
          const removed = await discardPrivateCopy(file, targetKey);
          bump('changedDuringRun');
          log(removed
            ? `SKIP ${fileId}: changed or deleted during the run; its new private copy was removed`
            : `SKIP ${fileId}: already moved by another run`);
          continue;
        }

        await col('log').updateOne({ _id: fileId }, { $set: { switchedAt: now() } });
        const changed = await rewriteCopies(fileId);
        await col('log').updateOne({ _id: fileId }, { $set: { copiesUpdatedAt: now(), copiesChanged: changed } });
        bump('moved');
        log(`moved ${fileId} (${bytes.length} bytes, SHA-256 checked, ${changed} copies updated)`);

        // An unused copy from the earlier migration (made from another link).
        if (prior && !reuse && prior.entry.destinationKey && prior.entry.destinationKey !== targetKey) {
          await deleteUnusedPrivate(prior.entry.destinationBucket, prior.entry.destinationKey).catch((error) => {
            log(`  note: its earlier private copy was kept: ${errorText(error)}`);
          });
        }
      } catch (error) {
        summary.errors += 1;
        log(`ERROR ${fileId}: ${errorText(error)}`);
        if (wrotePrivate && !switchSent) {
          await discardPrivateCopy(file, targetKey).catch(() => {
            log('  its unused private copy could not be removed; the next --copy run overwrites it');
          });
        }
      }
    }

    log(`done: ${JSON.stringify(summary)}`);
    return { ...summary, mode: 'copy' };
  }

  // ── Delete public copies ────────────────────────────────────────────────
  if (args.mode === 'delete-public') {
    log(`=== Vault private migration — delete public copies (${args.apply ? 'APPLY' : 'preview'}) ===`);
    requireTakeover();
    const entries = (await col('log').find({}).sort({ _id: 1 }).toArray()).filter((e) => e.switchedAt && !e.publicDeletedAt);
    const deletedUrls = [];
    let handled = 0;

    for (const entry of entries) {
      if (handled >= args.limit) break;
      handled += 1;
      const fileId = idString(entry._id);

      if (!args.apply) {
        log(`would delete public ${entry.sourceKey} (file ${fileId})`);
        bump('planned');
        continue;
      }

      try {
        if (!PUBLIC_KEY_PATTERN.test(String(entry.sourceKey || ''))) {
          throw new Error(`unexpected public name ${entry.sourceKey}; nothing deleted`);
        }
        let head = null;
        if (PRIVATE_KEY_PATTERN.test(String(entry.targetKey || ''))) {
          try {
            head = await s3.send(new HeadObjectCommand({ Bucket: entry.bucket || config.privateBucket, Key: entry.targetKey }));
          } catch (error) {
            if (!isMissingObject(error)) throw error;
          }
        }
        // A file deleted in the app after it moved: its public copy goes too.
        const known = fileById.get(fileId);
        const record = known ? await col('files').findOne({ _id: known._id }) : null;
        const recordGone = !record;
        if (!recordGone && (!head || Number(head.ContentLength) !== Number(entry.size))) {
          throw new Error('private copy is missing or the wrong size; public copy kept');
        }

        // Another record still using the same public object keeps it alive.
        const sharedBy = publicKeyUsers(entry.sourceKey, fileId, false);
        if (sharedBy.length) {
          bump('keptShared');
          log(`KEEP ${entry.sourceKey}: still used by ${sharedBy.map((f) => idString(f._id)).join(', ')}`);
          continue;
        }

        // Copies linked while the move was running may still hold the public link.
        await rewriteCopies(fileId);
        const stillLinked = await linkedElsewhere(entry.sourceUrl);
        if (stillLinked) {
          bump('keptLinked');
          log(`KEEP ${entry.sourceKey}: its public link is still stored in ${stillLinked} document(s) without the file ID (see the report)`);
          continue;
        }
        await deletePublic(entry.sourceKey);
        // The file itself is gone, so a private copy nothing points at goes too.
        if (recordGone && head) {
          await deleteUnusedPrivate(entry.bucket, entry.targetKey).catch((error) => {
            log(`  note: private copy of deleted file ${fileId} kept: ${errorText(error)}`);
          });
        }
        await col('log').updateOne({ _id: entry._id }, { $set: { publicDeletedAt: now() } });
        deletedUrls.push(entry.sourceUrl || `${config.publicBase}/${entry.sourceKey}`);
        bump('deleted');
      } catch (error) {
        summary.errors += 1;
        log(`ERROR ${fileId}: ${errorText(error)}`);
      }
    }

    printDeletedUrls(deletedUrls);
    log(`done: ${JSON.stringify(summary)}`);
    return { ...summary, mode: 'delete-public', deletedUrls };
  }

  // ── Remove files of deleted projects ─────────────────────────────────────
  log(`=== Vault private migration — remove files of deleted projects (${args.apply ? 'APPLY' : 'preview'}) ===`);
  requireTakeover();
  const orphans = files.filter((file) => !projectExists(file));
  const orphanUrls = [];
  let handled = 0;

  for (const file of orphans) {
    if (handled >= args.limit) break;
    handled += 1;
    const fileId = idString(file._id);
    const c = classify(file, config);

    if (!args.apply) {
      log(`would remove ${fileId} (${c.kind}) from deleted project ${idString(file.projectId)}`);
      bump('planned');
      continue;
    }

    try {
      // Its copies lose the public link first. Anything still holding that link is a
      // link the rewrite can't tie to the file, which keeps the file and its record.
      if (c.kind === 'public' || c.kind === 'private') await rewriteCopies(fileId);
      const entry = c.kind === 'private' ? await col('log').findOne({ _id: fileId }) : null;
      const publicLink = c.kind === 'public' ? c.url : (entry && entry.sourceKey && !entry.publicDeletedAt ? entry.sourceUrl : '');
      const stillLinked = await linkedElsewhere(publicLink);
      if (stillLinked) {
        bump('keptLinked');
        log(`KEEP ${fileId}: its public link is still stored in ${stillLinked} document(s) without the file ID (see the report)`);
        continue;
      }
      if (c.kind === 'private') {
        if (!PRIVATE_KEY_PATTERN.test(String(file.storageKey)) || String(file.storageBucket || config.privateBucket) === config.publicBucket) {
          throw new Error(`unexpected private storage key ${file.storageKey}; nothing deleted`);
        }
        await s3.send(new DeleteObjectCommand({ Bucket: file.storageBucket || config.privateBucket, Key: file.storageKey }));
        // Moved earlier but its project was deleted before the public copy went.
        if (entry && entry.sourceKey && !entry.publicDeletedAt && !publicKeyUsers(entry.sourceKey, fileId, true).length) {
          await deletePublic(entry.sourceKey);
          await col('log').updateOne({ _id: fileId }, { $set: { publicDeletedAt: now() } });
          orphanUrls.push(entry.sourceUrl || `${config.publicBase}/${entry.sourceKey}`);
        }
      } else if (c.kind === 'public') {
        if (publicKeyUsers(c.key, fileId, true).length) {
          bump('keptShared');
          log(`KEEP ${c.key}: still used by a file in an existing project`);
        } else {
          await deletePublic(c.key);
          orphanUrls.push(c.url);
        }
        // A private copy the earlier migration made but never switched to.
        const prior = earlierByFile.get(fileId);
        if (prior && prior.entry.destinationKey) {
          await deleteUnusedPrivate(prior.entry.destinationBucket, prior.entry.destinationKey).catch((error) => {
            log(`  note: earlier private copy of ${fileId} kept: ${errorText(error)}`);
          });
        }
      }
      await col('files').deleteOne({ _id: file._id });
      bump('removed');
    } catch (error) {
      summary.errors += 1;
      log(`ERROR ${fileId}: ${errorText(error)}`);
    }
  }

  // Folders go last, once every file of the deleted projects is gone.
  const orphanFolders = (await col('folders').find({}).toArray())
    .filter((folder) => !projectIds.has(idString(folder.projectId)));
  if (!args.apply) {
    log(`would remove ${orphanFolders.length} folder(s) of deleted projects after their files`);
  } else if (handled === orphans.length && summary.errors === 0 && !summary.keptLinked) {
    for (const folder of orphanFolders) {
      await col('folders').deleteOne({ _id: folder._id });
      bump('foldersRemoved');
    }
  }

  printDeletedUrls(orphanUrls);
  log(`done: ${JSON.stringify(summary)}`);
  return { ...summary, mode: 'remove-orphans', deletedUrls: orphanUrls };
}

async function main() {
  let mongoose;
  try {
    const args = process.argv.slice(2);
    parseArgs(args);
    readConfig(process.env);

    mongoose = require('mongoose');
    const sdk = require('@aws-sdk/client-s3');
    // Same connection settings the app uses (src/app.module.ts).
    await mongoose.connect(String(process.env.MONGODB_URI).trim(), {
      serverSelectionTimeoutMS: 15000,
      retryWrites: false,
      w: 'majority',
    });
    const s3 = new sdk.S3Client({
      region: 'auto',
      endpoint: process.env.R2_ENDPOINT,
      credentials: {
        accessKeyId: process.env.R2_ACCESS_KEY_ID,
        secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
      },
    });

    // The driver's own ObjectId, for file IDs stored as ObjectIds in copies.
    const result = await run({ argv: args, env: process.env, db: mongoose.connection.db, s3, sdk, ObjectId: mongoose.mongo.ObjectId });
    if (result.errors) process.exitCode = 1;
  } catch (error) {
    console.error(`ERROR: ${error && error.message ? error.message : error}`);
    process.exitCode = 1;
  } finally {
    if (mongoose) await mongoose.disconnect().catch(() => {});
  }
}

module.exports = { run, parseArgs, classify, contentDispositionFor, privateObjectId, safeExtension, COLLECTIONS };

if (require.main === module) {
  main();
}
