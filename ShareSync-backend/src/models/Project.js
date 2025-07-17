const mongoose = require('mongoose');
const projectSchema = new mongoose.Schema({
    title: String,
    description: String,
    category: String,
    status: String,
    privacy: String,
    userId: String,
    members: [{
        email: String,
        role: String
    }],
    sharedWith: [String],
    announcements: [{
        id: Number,
        content: String,
        media: String,
        likes: { type: Number, default: 0 },
        comments: [{ user: String, text: String }],
        user: String
    }],
    tasks: [{
        id: Number,
        title: String,
        assignee: String,
        dueDate: Date,
        status: String,
        comments: [{ user: String, text: String }],
        user: String
    }]
});
module.exports = mongoose.model('Project', projectSchema);