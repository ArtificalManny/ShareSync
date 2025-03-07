"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("mongoose");
const ProjectSchema = new mongoose_1.Schema({
    name: { type: String, required: true },
    description: { type: String, required: true },
    admin: { type: String, required: true },
    sharedWith: [{ type: String }],
    announcements: [{
            content: String,
            media: String,
            user: String,
            likes: { type: Number, default: 0 },
            comments: [{ user: String, text: String }],
        }],
    tasks: [{
            title: String,
            assignee: String,
            dueDate: Date,
            status: { type: String, default: 'In Progress' },
            user: String,
            comments: [{ user: String, text: String }],
        }],
});
exports.default = (0, mongoose_1.model)('Project', ProjectSchema);
