"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.queryDiscoveryMongo = queryDiscoveryMongo;
exports.queryDiscoveryMongoNative = queryDiscoveryMongoNative;
const mongoose_1 = __importDefault(require("mongoose"));
const mongodb_1 = require("mongodb");
const score_1 = require("./score");
const Project = mongoose_1.default.models.Project ||
    mongoose_1.default.model("Project", new mongoose_1.default.Schema({
        title: String,
        icon: { kind: String, value: String },
        public: { type: Boolean, default: false },
        discoverable: { type: Boolean, default: false },
        ownerId: { type: mongoose_1.default.Schema.Types.ObjectId, ref: "User" },
        transparencyScore: { type: Number, default: 1 },
        updatedAt: Date,
        createdAt: Date,
        deletedAt: { type: Date, default: null },
    }, { timestamps: true, collection: "projects" }));
const Task = mongoose_1.default.models.Task ||
    mongoose_1.default.model("Task", new mongoose_1.default.Schema({
        projectId: mongoose_1.default.Schema.Types.ObjectId,
        status: String,
        createdAt: Date,
        completedAt: Date,
    }, { timestamps: true, collection: "tasks" }));
const Activity = mongoose_1.default.models.Activity ||
    mongoose_1.default.model("Activity", new mongoose_1.default.Schema({
        projectId: mongoose_1.default.Schema.Types.ObjectId,
        kind: String,
        createdAt: Date,
    }, { timestamps: true, collection: "activities" }));
const XPEvent = mongoose_1.default.models.XPEvent ||
    mongoose_1.default.model("XPEvent", new mongoose_1.default.Schema({
        projectId: mongoose_1.default.Schema.Types.ObjectId,
        amount: Number,
        createdAt: Date,
    }, { timestamps: true, collection: "xp_events" }));
const User = mongoose_1.default.models.User ||
    mongoose_1.default.model("User", new mongoose_1.default.Schema({
        firstName: String,
        lastName: String,
        username: String,
        publicProfile: { type: Boolean, default: false },
        displayName: String,
    }, { timestamps: true, collection: "users" }));
function toIcon(raw) {
    var _a, _b;
    if (!raw)
        return undefined;
    const kind = (_a = raw.kind) !== null && _a !== void 0 ? _a : "";
    const value = (_b = raw.value) !== null && _b !== void 0 ? _b : "";
    if (!kind || !value)
        return undefined;
    return { kind: String(kind), value: String(value) };
}
function buildPublicOwner(ownerDoc) {
    if (!ownerDoc)
        return undefined;
    const publicOptIn = !!ownerDoc.publicProfile;
    if (publicOptIn) {
        const disp = ownerDoc.displayName ||
            ownerDoc.username ||
            [ownerDoc.firstName, ownerDoc.lastName ? `${String(ownerDoc.lastName)[0]}.` : ""]
                .filter(Boolean)
                .join(" ")
                .trim() ||
            "Team member";
        const out = { displayName: String(disp) };
        if (ownerDoc.username)
            out.username = String(ownerDoc.username);
        return out;
    }
    const fallback = [ownerDoc.firstName, ownerDoc.lastName ? `${String(ownerDoc.lastName)[0]}.` : ""]
        .filter(Boolean)
        .join(" ")
        .trim() || "Team member";
    return { displayName: fallback };
}
function sanitizeItem(x) {
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
async function queryDiscoveryMongo(params) {
    var _a, _b;
    const limit = (0, score_1.parseLimit)(params.limit, 20, 50);
    const mix = ((_a = params.mix) !== null && _a !== void 0 ? _a : "blended");
    const timeRange = (0, score_1.parseTimeRange)(params.timeRange);
    const since = (0, score_1.windowStart)(timeRange);
    const now = new Date();
    const followingBoost = !!params.followingBoost;
    const onlyTransparent = !!params.onlyTransparent;
    const cursor = (0, score_1.decodeCursor)((_b = params.cursor) !== null && _b !== void 0 ? _b : null);
    const matchProject = {
        $and: [
            { $or: [{ deletedAt: null }, { deletedAt: { $exists: false } }] },
            { $or: [{ public: true }, { discoverable: true }] },
        ],
    };
    if (onlyTransparent) {
        matchProject.transparencyScore = { $gte: 1 };
    }
    const projects = await Project.find(matchProject, {
        title: 1,
        icon: 1,
        public: 1,
        transparencyScore: 1,
        updatedAt: 1,
        createdAt: 1,
        ownerId: 1,
    }).lean();
    if (!projects.length) {
        return { items: [], nextCursor: null };
    }
    const ownerIds = Array.from(new Set(projects.map((p) => (p.ownerId ? String(p.ownerId) : null)).filter(Boolean)));
    const ownersById = new Map();
    if (ownerIds.length) {
        const ownerDocs = await User.find({ _id: { $in: ownerIds } }, { firstName: 1, lastName: 1, username: 1, publicProfile: 1, displayName: 1 }).lean();
        for (const u of ownerDocs)
            ownersById.set(String(u._id), u);
    }
    const projectIds = projects.map((p) => p._id);
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
    const doneMap = new Map();
    for (const row of tasksDone)
        doneMap.set(String(row._id), row.doneCount);
    const xpRows = await XPEvent.aggregate([
        {
            $match: {
                projectId: { $in: projectIds },
                createdAt: { $gte: since, $lte: now },
            },
        },
        { $group: { _id: "$projectId", xpSum: { $sum: "$amount" } } },
    ]);
    const xpMap = new Map();
    for (const row of xpRows)
        xpMap.set(String(row._id), row.xpSum);
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
    const reactMap = new Map();
    for (const row of reactionsRows)
        reactMap.set(String(row._id), row.reactions);
    const lastActivityRows = await Activity.aggregate([
        { $match: { projectId: { $in: projectIds } } },
        { $group: { _id: "$projectId", lastActivityAt: { $max: "$createdAt" } } },
    ]);
    const lastActMap = new Map();
    for (const row of lastActivityRows)
        lastActMap.set(String(row._id), row.lastActivityAt);
    const weeks = timeRange === "7d" ? 1 : timeRange === "30d" ? 30 / 7 : 90 / 7;
    const weights = (0, score_1.weightsForMix)(mix);
    const scored = projects.map((p) => {
        var _a, _b, _c, _d, _e, _f, _g;
        const pid = String(p._id);
        const done = (_a = doneMap.get(pid)) !== null && _a !== void 0 ? _a : 0;
        const xp = (_b = xpMap.get(pid)) !== null && _b !== void 0 ? _b : 0;
        const reactions = (_c = reactMap.get(pid)) !== null && _c !== void 0 ? _c : 0;
        const lastActivity = (_f = (_e = (_d = lastActMap.get(pid)) !== null && _d !== void 0 ? _d : p.updatedAt) !== null && _e !== void 0 ? _e : p.createdAt) !== null && _f !== void 0 ? _f : now;
        const inactivityHrs = Math.max(0, (now.getTime() - new Date(lastActivity).getTime()) / (1000 * 60 * 60));
        const transparency = typeof p.transparencyScore === "number"
            ? p.transparencyScore
            : p.public
                ? 1
                : 0;
        const signals = {
            velocityPerWeek: weeks > 0 ? done / weeks : done,
            xpGrowth: xp,
            reactions,
            transparency,
            inactivityHours: inactivityHrs,
        };
        let score = (0, score_1.scoreProject)(signals, weights);
        if (followingBoost && params.userId) {
        }
        const icon = toIcon(p.icon);
        const ownerDoc = p.ownerId ? ownersById.get(String(p.ownerId)) : null;
        const ownerPublic = buildPublicOwner(ownerDoc);
        return {
            id: pid,
            title: (_g = p.title) !== null && _g !== void 0 ? _g : "Untitled Project",
            icon,
            public: !!p.public,
            transparency,
            signals,
            score,
            lastActivityAt: new Date(lastActivity).toISOString(),
            owner: ownerPublic,
        };
    });
    scored.sort((a, b) => {
        if (b.score !== a.score)
            return b.score - a.score;
        if (b.lastActivityAt !== a.lastActivityAt)
            return b.lastActivityAt.localeCompare(a.lastActivityAt);
        return b.id.localeCompare(a.id);
    });
    const cursorPayload = cursor;
    let sliced = scored;
    if (cursorPayload) {
        sliced = scored.filter((item) => {
            if (item.score < cursorPayload.score)
                return true;
            if (item.score > cursorPayload.score)
                return false;
            if (item.lastActivityAt < cursorPayload.lastActivity)
                return true;
            if (item.lastActivityAt > cursorPayload.lastActivity)
                return false;
            return item.id < cursorPayload.id;
        });
    }
    const page = sliced.slice(0, limit);
    const last = page[page.length - 1];
    const nextCursor = last
        ? (0, score_1.encodeCursor)({
            score: last.score,
            lastActivity: last.lastActivityAt,
            id: last.id,
        })
        : null;
    const items = page.map((x) => sanitizeItem(Object.assign(Object.assign({}, x), { score: Number(x.score.toFixed(4)) })));
    return { items, nextCursor };
}
function _encodeIdCursor(id) {
    return Buffer.from(JSON.stringify({ id })).toString("base64");
}
function _decodeIdCursor(raw) {
    if (!raw)
        return null;
    try {
        return JSON.parse(Buffer.from(String(raw), "base64").toString("utf8"));
    }
    catch (_a) {
        return null;
    }
}
async function queryDiscoveryMongoNative(db, { limit = 20, cursor, timeRangeDays = 7, personalized = false, userId = null, onlyTransparent = false }) {
    const since = new Date(Date.now() - timeRangeDays * 24 * 3600 * 1000);
    const match = {
        $and: [
            { $or: [{ deletedAt: null }, { deletedAt: { $exists: false } }] },
            { public: true },
        ],
    };
    if (onlyTransparent) {
    }
    const after = _decodeIdCursor(cursor);
    const sort = { _id: 1 };
    if (after === null || after === void 0 ? void 0 : after.id)
        match._id = { $gt: new mongodb_1.ObjectId(after.id) };
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
    const items = rows.slice(0, limit).map((p) => {
        var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m;
        const velocity = (_e = (_c = (_b = (_a = p === null || p === void 0 ? void 0 : p.m) === null || _a === void 0 ? void 0 : _a.throughputPerWeek) === null || _b === void 0 ? void 0 : _b.value) !== null && _c !== void 0 ? _c : (_d = p === null || p === void 0 ? void 0 : p.m) === null || _d === void 0 ? void 0 : _d.throughputPerWeek) !== null && _e !== void 0 ? _e : 0;
        const xpGrowth = (_j = (_g = (_f = p === null || p === void 0 ? void 0 : p.m) === null || _f === void 0 ? void 0 : _f.xpDelta7d) !== null && _g !== void 0 ? _g : (_h = p === null || p === void 0 ? void 0 : p.m) === null || _h === void 0 ? void 0 : _h.xpDelta) !== null && _j !== void 0 ? _j : 0;
        const reactions = (_l = (_k = p === null || p === void 0 ? void 0 : p.m) === null || _k === void 0 ? void 0 : _k.reactions7d) !== null && _l !== void 0 ? _l : 0;
        const transparency = !!p.public;
        const lastWhen = p.updatedAt || p.createdAt || new Date();
        const inactivityHours = Math.max(0, (Date.now() - new Date(lastWhen).getTime()) / 36e5);
        const projectScore = (0, score_1.scoreProject)({
            velocityPerWeek: velocity,
            xpGrowth,
            reactions,
            transparency: transparency ? 1 : 0,
            inactivityHours,
        });
        return sanitizeItem({
            id: p._id.toString(),
            title: (_m = p.title) !== null && _m !== void 0 ? _m : "Untitled Project",
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
        });
    });
    const personalizedItems = personalized && userId ? items : items;
    personalizedItems.sort((a, b) => b.score - a.score);
    const hasMore = rows.length > limit;
    const nextCursor = hasMore ? _encodeIdCursor(rows[limit]._id.toString()) : null;
    return { items: personalizedItems, nextCursor };
}
//# sourceMappingURL=queryMongo.js.map