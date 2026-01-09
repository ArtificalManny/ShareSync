"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const MONGO_URL = process.env.MONGO_URL;
const DB_NAME = process.env.MONGO_DB_NAME || undefined;
async function main() {
    await mongoose_1.default.connect(MONGO_URL, DB_NAME ? { dbName: DB_NAME } : undefined);
    const Project = mongoose_1.default.model("Project", new mongoose_1.default.Schema({ title: String, public: Boolean, discoverable: Boolean, updatedAt: Date }, { collection: "projects" }));
    const Task = mongoose_1.default.model("Task", new mongoose_1.default.Schema({ projectId: mongoose_1.default.Schema.Types.ObjectId, status: String, completedAt: Date }, { collection: "tasks" }));
    const Activity = mongoose_1.default.model("Activity", new mongoose_1.default.Schema({ projectId: mongoose_1.default.Schema.Types.ObjectId, kind: String, createdAt: Date }, { collection: "activities" }));
    const XPEvent = mongoose_1.default.model("XPEvent", new mongoose_1.default.Schema({ projectId: mongoose_1.default.Schema.Types.ObjectId, amount: Number, createdAt: Date }, { collection: "xp_events" }));
    const Metrics = mongoose_1.default.model("Metrics", new mongoose_1.default.Schema({
        projectId: mongoose_1.default.Schema.Types.ObjectId,
        throughputPerWeek: Number,
        xpDelta7d: Number,
        reactions7d: Number,
        updatedAt: Date,
        xpDelta30d: Number, xpDelta90d: Number,
        reactions30d: Number, reactions90d: Number,
    }, { collection: "metrics" }));
    const now = new Date();
    const since7 = new Date(now.getTime() - 7 * 24 * 3600 * 1000);
    const since30 = new Date(now.getTime() - 30 * 24 * 3600 * 1000);
    const since90 = new Date(now.getTime() - 90 * 24 * 3600 * 1000);
    const projects = await Project.find({
        $or: [{ public: true }, { discoverable: true }]
    }, { _id: 1 }).lean();
    const pids = projects.map(p => p._id);
    if (!pids.length) {
        await mongoose_1.default.disconnect();
        return;
    }
    const done7 = await Task.aggregate([
        { $match: { projectId: { $in: pids }, status: "done", completedAt: { $gte: since7, $lte: now } } },
        { $group: { _id: "$projectId", c: { $sum: 1 } } },
    ]);
    const xp7 = await XPEvent.aggregate([
        { $match: { projectId: { $in: pids }, createdAt: { $gte: since7, $lte: now } } },
        { $group: { _id: "$projectId", s: { $sum: "$amount" } } },
    ]);
    const react7 = await Activity.aggregate([
        { $match: { projectId: { $in: pids }, createdAt: { $gte: since7, $lte: now }, kind: { $in: ["comment", "like"] } } },
        { $group: { _id: "$projectId", c: { $sum: 1 } } },
    ]);
    const xp30 = await XPEvent.aggregate([
        { $match: { projectId: { $in: pids }, createdAt: { $gte: since30, $lte: now } } },
        { $group: { _id: "$projectId", s: { $sum: "$amount" } } },
    ]);
    const xp90 = await XPEvent.aggregate([
        { $match: { projectId: { $in: pids }, createdAt: { $gte: since90, $lte: now } } },
        { $group: { _id: "$projectId", s: { $sum: "$amount" } } },
    ]);
    const react30 = await Activity.aggregate([
        { $match: { projectId: { $in: pids }, createdAt: { $gte: since30, $lte: now }, kind: { $in: ["comment", "like"] } } },
        { $group: { _id: "$projectId", c: { $sum: 1 } } },
    ]);
    const react90 = await Activity.aggregate([
        { $match: { projectId: { $in: pids }, createdAt: { $gte: since90, $lte: now }, kind: { $in: ["comment", "like"] } } },
        { $group: { _id: "$projectId", c: { $sum: 1 } } },
    ]);
    const mDone7 = new Map(done7.map(r => [String(r._id), r.c]));
    const mXp7 = new Map(xp7.map(r => [String(r._id), r.s]));
    const mRx7 = new Map(react7.map(r => [String(r._id), r.c]));
    const mXp30 = new Map(xp30.map(r => [String(r._id), r.s]));
    const mXp90 = new Map(xp90.map(r => [String(r._id), r.s]));
    const mRx30 = new Map(react30.map(r => [String(r._id), r.c]));
    const mRx90 = new Map(react90.map(r => [String(r._id), r.c]));
    const weeks = 1;
    for (const pid of pids) {
        const key = String(pid);
        const doc = {
            projectId: pid,
            throughputPerWeek: (mDone7.get(key) || 0) / weeks,
            xpDelta7d: mXp7.get(key) || 0,
            reactions7d: mRx7.get(key) || 0,
            xpDelta30d: mXp30.get(key) || 0,
            xpDelta90d: mXp90.get(key) || 0,
            reactions30d: mRx30.get(key) || 0,
            reactions90d: mRx90.get(key) || 0,
            updatedAt: now,
        };
        await Metrics.updateOne({ projectId: pid }, { $set: doc }, { upsert: true });
    }
    await mongoose_1.default.disconnect();
}
main().catch((e) => {
    console.error("[metrics] recompute failed:", e);
    process.exitCode = 1;
});
//# sourceMappingURL=recomputeMetrics.js.map