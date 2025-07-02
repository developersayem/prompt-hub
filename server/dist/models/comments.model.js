"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Comment = void 0;
// models/comment.model.ts
const mongoose_1 = require("mongoose");
const commentSchema = new mongoose_1.Schema({
    user: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
    prompt: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: "Prompt",
        required: true,
    },
    text: {
        type: String,
        required: true,
        trim: true,
    },
    replies: [
        {
            type: mongoose_1.Schema.Types.ObjectId,
            ref: "Comment",
        },
    ],
    parentComment: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: "Comment",
        default: null,
    },
    likes: [{ type: mongoose_1.Schema.Types.ObjectId, ref: "User", default: [] }],
}, {
    timestamps: true,
});
exports.Comment = mongoose_1.models.Comment || (0, mongoose_1.model)("Comment", commentSchema);
