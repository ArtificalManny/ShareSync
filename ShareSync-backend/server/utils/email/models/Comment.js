//server/utils/email/models/Comment.js
const mongoose = require('mongoose');

const CommentSchema = new mongoose.Schema(
    {
        postId: { type: mongoose.Schema.Types.ObjectId, ref: 'Post', required: true, index: true },
        projectId: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true, index: true },
        authorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },

        text: { type: String, trim: true, required: true },


        createdAt: { type: Date, default: Date.now, index: true },
        editedAt: { type: Date, default: null },
    },
    { versionKey: false }
);

//Helpful compund index for fetching post thread
CommentSchema.index({ postId: 1, createdAt: 1 });

//Edit helper
CommentSchema.methods.editText = async function editText(newText) {
    this.text = newText ?? '';
    this.editedAt = new Date();
    return this.save();
};

module.exports = mongoose.models.Comment || mongoose.model('Comment',CommentSchema);