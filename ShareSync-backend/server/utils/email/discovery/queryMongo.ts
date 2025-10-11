// server/utils/email/discovery/queryMongo.ts
// MongoDB aggregation to fetch public/discoverable projects + compute signals,
// then score with score.ts. Safe fallbacks if collections are sparse.

import mongoose from "mongoose";
import { ObjectId } from "mongodb";
import {
  scoreProject,
  weightsForMix,
  parseLimit,
  parseTimeRange,
  windowStart,
  decodeCursor,
  encodeCursor,
  type ProjectSignals,
} from "./score";

import {
  type DiscoveryQuery,
  type DiscoveryResult,
  type DiscoveryItem,
  type MixMode,
} from "../types/discovery";

// ---- Assumed Mongoose models (adjust names/paths as needed) ----
const Project =
  mongoose.models.Project ||
  mongoose.model(
    "Project",
    new mongoose.Schema(
      {
        title: String,
        icon: { kind: String, value: String },
        public: { type: Boolean, default: false },
        discoverable: { type: Boolean, default: false }, // allow discoverable as an alternative to public
        ownerId: { type: mongoose.Schema.Types.ObjectId, ref: "User" }, // project owner
        transparencyScore: { type: Number, default: 1 }, // 0..1 optional
        updatedAt: Date,
        createdAt: Date,
        deletedAt: { type: Date, default: null },
      },
      { timestamps: true, collection: "projects" }
    )
  );

const Task =
  mongoose.models.Task ||
  mongoose.model(
    "Task",
    new mongoose.Schema(
      {
        projectId: mongoose.Schema.Types.ObjectId,
        status: String, // "done" | "open" | etc.
        createdAt: Date,
        completedAt: Date,
      },
      { timestamps: true, collection: "tasks" }
    )
  );

const Activity =
  mongoose.models.Activity ||
  mongoose.model(
    "Activity",
    new mongoose.Schema(
      {
        projectId: mongoose.Schema.Types.ObjectId,
        kind: String, // "comment" | "like" | "file" | ...
        createdAt: Date,
      },
      { timestamps: true, collection: "activities" }
    )
  );

const XPEvent =
  mongoose.models.XPEvent ||
  mongoose.model(
    "XPEvent",
    new mongoose.Schema(
      {
        projectId: mongoose.Schema.Types.ObjectId,
        amount: Number, // positive delta
        createdAt: Date,
      },
      { timestamps: true, collection: "xp_events" }
    )
  );

const User =
  mongoose.models.User ||
  mongoose.model(
    "User",
    new mongoose.Schema(
      {
        firstName: String,
        lastName: String,
        username: String,
        publicProfile: { type: Boolean, default: false }, // owner opt-in for public name/username
        displayName: String, // optional precomputed public label
      },
      { timestamps: true, collection: "users" } // <-- FIX: no trailing space
    )
  );

// ---------- Helpers ----------
function toIcon(
  raw:
    | { kind?: string | null; value?: string | null }
    | null
    | undefined
): { kind: string; value: string } | undefined {
  if (!raw) return undefined;
  const kind = raw.kind ?? "";
  const value = raw.value ?? "";
  if (!kind || !value) return undefined;
  return { kind: String(kind), value: String(value) };
}

type PublicOwner = {
  displayName: string;
  username?: string;
};

function buildPublicOwner(ownerDoc: any | null | undefined): PublicOwner | undefined {
  if (!ownerDoc) return undefined;

  const publicOptIn = !!ownerDoc.publicProfile;
  if (publicOptIn) {
    // Prefer displayName if present, else username, else "First L."
    const disp =
      ownerDoc.displayName ||
      ownerDoc.username ||
      [ownerDoc.firstName, ownerDoc.lastName ? `${String(ownerDoc.lastName)[0]}.` : ""]
        .filter(Boolean)
        .join(" ")
        .trim() ||
      "Team member";
    const out: PublicOwner = { displayName: String(disp) };
    if (ownerDoc.username) out.username = String(ownerDoc.username);
    return out;
  }

  // Not opted in → only show First L. (no username)
  const fallback =
    [ownerDoc.firstName, ownerDoc.lastName ? `${String(ownerDoc.lastName)[0]}.` : ""]
      .filter(Boolean)
      .join(" ")
      .trim() || "Team member";

  return { displayName: fallback };
}

/** Ensure only safe fields are returned to the client */
function sanitizeItem(x: any) {
  return {
    id: x.id,
    title: x.title,
    icon: x.icon,
    public: x.public,
    transparency: x.transparency,
    score: x.score,
    signals: x.signals,
    lastActivityAt: x.lastActivityAt,
    owner: x.owner ? { displayName: x.owner.displayName, username: x.owner.username } : undefined,
  };
}

/**
 * Aggregate raw metrics from Mongo for each public/discoverable project in the chosen window.
 * We compute:
 *  - velocityPerWeek (tasks done / weeks in window)
 *  - xpGrowth (sum XPEvent amounts in window)
 *  - reactions (count of Activity kind in ["comment","like"] in window)
 *  - lastActivityAt (max of Activity.createdAt or Project.updatedAt)
 */
export async function queryDiscoveryMongo(
  params: DiscoveryQuery
): Promise<DiscoveryResult> {
  const limit = parseLimit(params.limit, 20, 50);
  const mix: MixMode = (params.mix ?? "blended") as MixMode;
  const timeRange = parseTimeRange(params.timeRange);
  const since = windowStart(timeRange);
  const now = new Date();

  const followingBoost = !!params.followingBoost; // (stub)
  const onlyTransparent = !!params.onlyTransparent;

  // Cursor handling
  const cursor = decodeCursor(params.cursor ?? null);

  // Fetch public (or discoverable) projects only; exclude soft-deleted
  const matchProject: any = {
    $and: [
      { $or: [{ deletedAt: null }, { deletedAt: { $exists: false } }] },
      { $or: [{ public: true }, { discoverable: true }] },
    ],
  };
  if (onlyTransparent) {
    // optional additional gate on transparency
    matchProject.transparencyScore = { $gte: 1 };
  }

  const projects = await Project.find(matchProject, {
    title: 1,
    icon: 1,
    public: 1,
    transparencyScore: 1,
    updatedAt: 1,
    createdAt: 1,
    ownerId: 1, // <-- include owner id so we can build public owner
  }).lean();

  if (!projects.length) {
    return { items: [], nextCursor: null };
  }

  // Fetch owners in bulk for display names (safe fields only)
  const ownerIds = Array.from(
    new Set(
      projects.map((p: any) => (p.ownerId ? String(p.ownerId) : null)).filter(Boolean)
    )
  );

  const ownersById = new Map<string, any>();
  if (ownerIds.length) {
    const ownerDocs = await User.find(
      { _id: { $in: ownerIds as any } },
      { firstName: 1, lastName: 1, username: 1, publicProfile: 1, displayName: 1 }
    ).lean();
    for (const u of ownerDocs) ownersById.set(String(u._id), u);
  }

  const projectIds = projects.map((p: any) => p._id);

  // Tasks done in window
  const tasksDone = await Task.aggregate([
    {
      $match: {
        projectId: { $in: projectIds },
        completedAt: { $gte: since, $lte: now },
        status: "done",
      },
    },
    { $group: { _id: "$projectId", doneCount: { $sum: 1 } } },
  ]);

  const doneMap = new Map<string, number>();
  for (const row of tasksDone) doneMap.set(String(row._id), row.doneCount);

  // XP growth in window
  const xpRows = await XPEvent.aggregate([
    {
      $match: {
        projectId: { $in: projectIds },
        createdAt: { $gte: since, $lte: now },
      },
    },
    { $group: { _id: "$projectId", xpSum: { $sum: "$amount" } } },
  ]);

  const xpMap = new Map<string, number>();
  for (const row of xpRows) xpMap.set(String(row._id), row.xpSum);

  // Reactions in window (comments + likes)
  const reactionsRows = await Activity.aggregate([
    {
      $match: {
        projectId: { $in: projectIds },
        createdAt: { $gte: since, $lte: now },
        kind: { $in: ["comment", "like"] },
      },
    },
    { $group: { _id: "$projectId", reactions: { $sum: 1 } } },
  ]);

  const reactMap = new Map<string, number>();
  for (const row of reactionsRows) reactMap.set(String(row._id), row.reactions);

  // Last activity timestamp (fallback to project.updatedAt/createdAt)
  const lastActivityRows = await Activity.aggregate([
    { $match: { projectId: { $in: projectIds } } },
    { $group: { _id: "$projectId", lastActivityAt: { $max: "$createdAt" } } },
  ]);

  const lastActMap = new Map<string, Date>();
  for (const row of lastActivityRows) lastActMap.set(String(row._id), row.lastActivityAt);

  // Compute signals + score for each project
  const weeks = timeRange === "7d" ? 1 : timeRange === "30d" ? 30 / 7 : 90 / 7;
  const weights = weightsForMix(mix);

  const scored = projects.map((p: any) => {
    const pid = String(p._id);
    const done = doneMap.get(pid) ?? 0;
    const xp = xpMap.get(pid) ?? 0;
    const reactions = reactMap.get(pid) ?? 0;
    const lastActivity = lastActMap.get(pid) ?? p.updatedAt ?? p.createdAt ?? now;

    const inactivityHrs = Math.max(
      0,
      (now.getTime() - new Date(lastActivity).getTime()) / (1000 * 60 * 60)
    );
    const transparency =
      typeof p.transparencyScore === "number"
        ? p.transparencyScore
        : p.public
        ? 1
        : 0;

    const signals: ProjectSignals = {
      velocityPerWeek: weeks > 0 ? done / weeks : done,
      xpGrowth: xp,
      reactions,
      transparency,
      inactivityHours: inactivityHrs,
    };

    let score = scoreProject(signals, weights);

    if (followingBoost && params.userId) {
      // TODO: If user follows this project/team, boost by +k
      // score += 1.0;
    }

    const icon = toIcon(p.icon);
    const ownerDoc = p.ownerId ? ownersById.get(String(p.ownerId)) : null;
    const ownerPublic = buildPublicOwner(ownerDoc);

    return {
      id: pid,
      title: p.title ?? "Untitled Project",
      icon,
      public: !!p.public,
      transparency,
      signals,
      score,
      lastActivityAt: new Date(lastActivity).toISOString(),
      owner: ownerPublic, // strictly public-safe owner info
    };
  });

  // Sort by score desc, then lastActivity desc, then id desc
  scored.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    if (b.lastActivityAt !== a.lastActivityAt)
      return b.lastActivityAt.localeCompare(a.lastActivityAt);
    return b.id.localeCompare(a.id);
  });

  // Cursor paging (after sort)
  const cursorPayload = cursor;
  let sliced = scored;
  if (cursorPayload) {
    sliced = scored.filter((item) => {
      if (item.score < cursorPayload.score) return true;
      if (item.score > cursorPayload.score) return false;
      if (item.lastActivityAt < cursorPayload.lastActivity) return true;
      if (item.lastActivityAt > cursorPayload.lastActivity) return false;
      return item.id < cursorPayload.id;
    });
  }

  const page = sliced.slice(0, limit);
  const last = page[page.length - 1];

  const nextCursor: string | null = last
    ? encodeCursor({
        score: last.score,
        lastActivity: last.lastActivityAt,
        id: last.id,
      })
    : null;

  // Sanitize to ensure only safe fields are returned
  const items: DiscoveryItem[] = page.map((x) =>
    sanitizeItem({
      ...x,
      score: Number(x.score.toFixed(4)),
    })
  );

  return { items, nextCursor };
}

/* ------------------------------------------------------------------
   Native Mongo driver version (matches your sketch, id-cursor style)
-------------------------------------------------------------------*/

type NativeArgs = {
  limit?: number;
  cursor?: string | null;
  timeRangeDays?: number;
  personalized?: boolean;
  userId?: string | null;
  onlyTransparent?: boolean;
};

// Opaque cursor helpers (id-only, base64 JSON)
function _encodeIdCursor(id: string): string {
  return Buffer.from(JSON.stringify({ id })).toString("base64");
}
function _decodeIdCursor(raw?: string | null): { id: string } | null {
  if (!raw) return null;
  try {
    return JSON.parse(Buffer.from(String(raw), "base64").toString("utf8"));
  } catch {
    return null;
  }
}

// IMPORTANT: `db` must be a MongoDB Database instance from the native driver
export async function queryDiscoveryMongoNative(
  db: any,
  { limit = 20, cursor, timeRangeDays = 7, personalized = false, userId = null, onlyTransparent = false }: NativeArgs
): Promise<DiscoveryResult> {
  const since = new Date(Date.now() - timeRangeDays * 24 * 3600 * 1000);

  const match: any = {
    $and: [
      { $or: [{ deletedAt: null }, { deletedAt: { $exists: false } }] },
      { public: true }, // native path: keep strict public; extend if you want discoverable here too
    ],
  };
  if (onlyTransparent) {
    // match.transparencyScore = { $gte: 1 }; // enable if your schema supports it
  }

  const after = _decodeIdCursor(cursor);
  const sort = { _id: 1 };
  if (after?.id) match._id = { $gt: new ObjectId(after.id) };

  const rows = await db
    .collection("projects")
    .aggregate([
      { $match: match },
      {
        $lookup: {
          from: "posts",
          let: { pid: "$_id" },
          pipeline: [
            {
              $match: {
                $expr: { $eq: ["$projectId", "$$pid"] },
                createdAt: { $gte: since },
              },
            },
            { $sort: { createdAt: -1 } },
            { $limit: 1 },
          ],
          as: "latestUpdate",
        },
      },
      {
        $lookup: {
          from: "metrics",
          localField: "_id",
          foreignField: "projectId",
          as: "metrics",
        },
      },
      {
        $project: {
          title: 1,
          icon: 1,
          public: 1,
          ownerId: 1,
          updatedAt: 1,
          createdAt: 1,
          latestUpdate: { $first: "$latestUpdate" },
          m: { $first: "$metrics" },
        },
      },
      { $sort: sort },
      { $limit: limit + 1 },
    ])
    .toArray();

  const items = rows.slice(0, limit).map((p: any) => {
    const velocity =
      p?.m?.throughputPerWeek?.value ?? p?.m?.throughputPerWeek ?? 0;
    const xpGrowth = p?.m?.xpDelta7d ?? p?.m?.xpDelta ?? 0;
    const reactions = p?.m?.reactions7d ?? 0;
    const transparency = !!p.public;

    const lastWhen = p.updatedAt || p.createdAt || new Date();
    const inactivityHours = Math.max(
      0,
      (Date.now() - new Date(lastWhen).getTime()) / 36e5
    );

    const projectScore = scoreProject({
      velocityPerWeek: velocity,
      xpGrowth,
      reactions,
      transparency: transparency ? 1 : 0,
      inactivityHours,
    });

    return sanitizeItem({
      id: p._id.toString(),
      title: p.title ?? "Untitled Project",
      icon: p.icon,
      public: p.public,
      score: Number(projectScore.toFixed(4)),
      signals: {
        velocityPerWeek: velocity,
        xpGrowth,
        reactions,
        transparency: transparency ? 1 : 0,
        inactivityHours,
      },
      lastActivityAt: new Date(lastWhen).toISOString(),
      transparency: transparency ? 1 : 0,
      // owner: compute with a separate join if needed
    });
  });

  const personalizedItems =
    personalized && userId ? items /* hook boost here */ : items;

  personalizedItems.sort((a, b) => b.score - a.score);

  const hasMore = rows.length > limit;
  const nextCursor = hasMore ? _encodeIdCursor(rows[limit]._id.toString()) : null;

  return { items: personalizedItems, nextCursor };
}