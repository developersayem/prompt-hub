"use strict";
// utils/populateRepliesRecursively.ts
Object.defineProperty(exports, "__esModule", { value: true });
exports.populateRepliesRecursively = void 0;
const comments_model_1 = require("../models/comments.model");
const populateRepliesRecursively = async (comment) => {
    await comments_model_1.Comment.populate(comment, {
        path: "user",
        select: "name avatar",
    });
    await comments_model_1.Comment.populate(comment, {
        path: "replies",
        select: "text createdAt user replies likes",
    });
    if (comment.replies && comment.replies.length > 0) {
        for (const reply of comment.replies) {
            await (0, exports.populateRepliesRecursively)(reply);
        }
    }
    return comment;
};
exports.populateRepliesRecursively = populateRepliesRecursively;
