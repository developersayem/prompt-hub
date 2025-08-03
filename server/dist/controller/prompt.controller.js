"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAllPromptsByUserSlugController = exports.removePromptFromBookmarksController = exports.getAllMyBookmarkedPromptsController = exports.savePromptAsBookmarkController = exports.publishPromptFromDraftsController = exports.getAllMyDraftPromptsController = exports.savePromptAsDraftController = exports.getPromptBySlugController = exports.getMyPurchasesController = exports.buyPromptController = exports.deletePromptController = exports.updatePromptController = exports.getSinglePromptController = exports.getMyPromptsController = exports.likeCommentController = exports.replyCommentController = exports.deleteCommentController = exports.updateCommentController = exports.createCommentController = exports.likePromptController = exports.increasePromptViewsController = exports.createPromptController = exports.getTrendingPrompts = exports.getAllPromptsController = void 0;
const ApiError_1 = require("../utils/ApiError");
const ApiResponse_1 = require("../utils/ApiResponse");
const asyncHandler_1 = __importDefault(require("../utils/asyncHandler"));
const cloudinary_1 = require("../utils/cloudinary");
const prompts_model_1 = require("../models/prompts.model");
const users_model_1 = require("../models/users.model");
const mongoose_1 = __importDefault(require("mongoose"));
const like_model_1 = require("../models/like.model");
const comments_model_1 = require("../models/comments.model");
const populateRepliesRecursively_1 = require("../utils/populateRepliesRecursively");
const purchaseHistory_model_1 = require("../models/purchaseHistory.model");
const getAllNestedCommentIds_1 = require("../helper/getAllNestedCommentIds");
const cleanInvalidPromptReferences_1 = require("../utils/cleanInvalidPromptReferences");
// Helper: check if a string is a valid URL
const isValidUrl = (urlString) => {
    try {
        new URL(urlString);
        return true;
    }
    catch {
        return false;
    }
};
// Controller for get all prompts
const getAllPromptsController = (0, asyncHandler_1.default)(async (req, res) => {
    const { category, isPaid, searchString } = req.query;
    const query = {};
    if (category)
        query.category = category;
    if (isPaid === "true")
        query.isPaid = true;
    if (typeof searchString === "string" && searchString.trim() !== "") {
        query.$or = [
            { title: { $regex: new RegExp(searchString, "i") } },
            { description: { $regex: new RegExp(searchString, "i") } },
        ];
    }
    const prompts = await prompts_model_1.Prompt.aggregate([
        { $match: { ...query, isDraft: false } },
        { $sort: { createdAt: -1 } },
        {
            $lookup: {
                from: "users",
                foreignField: "_id",
                localField: "creator",
                as: "creator",
                pipeline: [{ $project: {
                            slug: 1, // add this line to include slug
                            name: 1, // optional, keep if you want to display name too
                            avatar: 1,
                        } }],
            },
        },
        {
            $unwind: {
                path: "$creator",
                preserveNullAndEmptyArrays: true,
            },
        },
        {
            $lookup: {
                from: "comments",
                foreignField: "prompt",
                localField: "_id",
                as: "comments",
                pipeline: [
                    { $match: { parentComment: null } },
                    {
                        $project: {
                            text: 1,
                            createdAt: 1,
                            user: 1,
                            replies: 1,
                            likes: 1,
                        },
                    },
                ],
            },
        },
    ]);
    // Recursively populate nested replies + user data
    for (const prompt of prompts) {
        for (const comment of prompt.comments) {
            await (0, populateRepliesRecursively_1.populateRepliesRecursively)(comment);
        }
    }
    // Attach likes for prompts
    const promptLikes = await like_model_1.Like.find({ prompt: { $ne: null } }).lean();
    const likeMap = {};
    for (const like of promptLikes) {
        const promptId = String(like.prompt);
        const userId = String(like.user);
        if (!likeMap[promptId])
            likeMap[promptId] = [];
        likeMap[promptId].push(userId);
    }
    const promptsWithLikes = prompts.map((prompt) => ({
        ...prompt,
        likes: likeMap[String(prompt._id)] || [],
    }));
    res.status(200).json(new ApiResponse_1.ApiResponse(200, promptsWithLikes, "Prompts fetched successfully"));
});
exports.getAllPromptsController = getAllPromptsController;
// Controller to get trending prompts
const getTrendingPrompts = (0, asyncHandler_1.default)(async (req, res) => {
    const prompts = await prompts_model_1.Prompt.aggregate([
        {
            $match: {
                isDraft: false,
                isPublic: true,
            },
        },
        {
            $addFields: {
                likeCount: { $size: "$likes" },
                purchaseCount: { $size: "$purchasedBy" },
                viewCount: "$views",
                shareCount: "$shareCount",
            },
        },
        {
            $addFields: {
                trendingScore: {
                    $add: [
                        { $multiply: ["$likeCount", 2] },
                        { $multiply: ["$purchaseCount", 3] },
                        "$viewCount",
                        "$shareCount",
                    ],
                },
            },
        },
        {
            $sort: { trendingScore: -1, createdAt: -1 },
        },
        {
            $limit: 10,
        },
        {
            $lookup: {
                from: "users",
                localField: "creator",
                foreignField: "_id",
                as: "creator",
                pipeline: [{ $project: { password: 0, refreshToken: 0 } }],
            },
        },
        {
            $unwind: {
                path: "$creator",
                preserveNullAndEmptyArrays: true,
            },
        },
        {
            $lookup: {
                from: "comments",
                localField: "_id",
                foreignField: "prompt",
                as: "comments",
                pipeline: [
                    { $match: { parentComment: null } },
                    {
                        $project: {
                            text: 1,
                            createdAt: 1,
                            user: 1,
                            replies: 1,
                            likes: 1,
                        },
                    },
                ],
            },
        },
    ]);
    // Recursively populate nested replies
    for (const prompt of prompts) {
        for (const comment of prompt.comments) {
            await (0, populateRepliesRecursively_1.populateRepliesRecursively)(comment);
        }
    }
    // Attach likes (mapped to user IDs)
    const promptLikes = await like_model_1.Like.find({ prompt: { $ne: null } }).lean();
    const likeMap = {};
    for (const like of promptLikes) {
        const promptId = String(like.prompt);
        const userId = String(like.user);
        if (!likeMap[promptId])
            likeMap[promptId] = [];
        likeMap[promptId].push(userId);
    }
    const promptsWithLikes = prompts.map((prompt) => ({
        ...prompt,
        likes: likeMap[String(prompt._id)] || [],
    }));
    res
        .status(200)
        .json(new ApiResponse_1.ApiResponse(200, promptsWithLikes, "Trending prompts fetched successfully"));
});
exports.getTrendingPrompts = getTrendingPrompts;
// Controller for create prompt
const createPromptController = (0, asyncHandler_1.default)(async (req, res) => {
    const { title, description, tags, category, promptText, resultType, resultContent: rawResultContent, aiModel, price, paymentStatus, } = req.body;
    const userId = req.user?._id;
    if (!userId)
        throw new ApiError_1.ApiError(401, "Unauthorized");
    // Validate required fields
    if (!title || !category || !promptText || !resultType || !aiModel || !paymentStatus) {
        throw new ApiError_1.ApiError(400, "Missing required fields");
    }
    // Validate payment status
    if (!["free", "paid"].includes(paymentStatus)) {
        throw new ApiError_1.ApiError(400, "Invalid payment status");
    }
    // Parse and normalize tags
    let parsedTags = tags;
    if (typeof tags === "string") {
        try {
            parsedTags = JSON.parse(tags);
        }
        catch {
            console.warn("Failed to parse tags JSON:", tags);
            parsedTags = [];
        }
    }
    const normalizedTags = Array.isArray(parsedTags)
        ? parsedTags.flatMap((tag) => tag.split(",").map((t) => t.trim()))
        : [];
    // Handle result content
    let finalResultContent = "";
    if (resultType === "text") {
        if (!rawResultContent || rawResultContent.trim() === "") {
            throw new ApiError_1.ApiError(400, "Text result content is required");
        }
        finalResultContent = rawResultContent.trim();
    }
    else if (["image", "video"].includes(resultType)) {
        if (rawResultContent && rawResultContent.trim() !== "") {
            // Use pasted URL if valid
            if (!isValidUrl(rawResultContent.trim())) {
                throw new ApiError_1.ApiError(400, "Invalid URL provided for media content");
            }
            finalResultContent = rawResultContent.trim();
        }
        else {
            // Otherwise expect uploaded file
            const file = req.files?.promptContent?.[0];
            if (!file || !file.path) {
                throw new ApiError_1.ApiError(400, `Media file or URL is required for ${resultType} prompt`);
            }
            const uploaded = await (0, cloudinary_1.uploadOnCloudinary)(file.path);
            if (!uploaded || !uploaded.secure_url) {
                throw new ApiError_1.ApiError(500, "Failed to upload media to Cloudinary");
            }
            finalResultContent = uploaded.secure_url;
        }
    }
    else {
        throw new ApiError_1.ApiError(400, "Invalid result type");
    }
    // Create the prompt
    const newPrompt = await prompts_model_1.Prompt.create({
        title,
        description,
        tags: normalizedTags,
        category,
        promptText,
        resultType,
        resultContent: finalResultContent,
        aiModel,
        price: paymentStatus === "paid" ? Number(price) || 0 : 0,
        paymentStatus,
        creator: userId,
        likes: [],
        comments: [],
        views: 0,
        viewedBy: [],
        viewedIPs: [],
        purchasedBy: [],
    });
    if (!newPrompt) {
        throw new ApiError_1.ApiError(500, "Failed to create prompt");
    }
    res
        .status(201)
        .json(new ApiResponse_1.ApiResponse(201, newPrompt, "Prompt created successfully"));
});
exports.createPromptController = createPromptController;
// Controller to increase prompt views
const increasePromptViewsController = (0, asyncHandler_1.default)(async (req, res) => {
    const userId = req.user?._id;
    if (!userId)
        throw new ApiError_1.ApiError(401, "Unauthorized");
    const promptId = req.params.id;
    if (!promptId || !mongoose_1.default.Types.ObjectId.isValid(promptId)) {
        throw new ApiError_1.ApiError(400, "Valid Prompt ID is required");
    }
    const prompt = await prompts_model_1.Prompt.findById(promptId);
    if (!prompt) {
        throw new ApiError_1.ApiError(404, "Prompt not found");
    }
    const ip = req.clientIP;
    const alreadyViewedByUser = userId && prompt.viewedBy.includes(userId);
    const alreadyViewedByIP = ip && prompt.viewedIPs.includes(ip);
    if (!alreadyViewedByUser && !alreadyViewedByIP) {
        prompt.views += 1;
        if (userId)
            prompt.viewedBy.push(userId);
        if (ip)
            prompt.viewedIPs.push(ip);
        await prompt.save();
    }
    return res.status(200).json(new ApiResponse_1.ApiResponse(200, { views: prompt.views }, alreadyViewedByUser || alreadyViewedByIP
        ? "Already viewed"
        : "View recorded"));
});
exports.increasePromptViewsController = increasePromptViewsController;
// Controller for like prompt
const likePromptController = (0, asyncHandler_1.default)(async (req, res) => {
    const userId = req?.user?._id;
    if (!userId)
        throw new ApiError_1.ApiError(401, "Unauthorized");
    const { promptId } = req.body;
    if (!promptId)
        throw new ApiError_1.ApiError(400, "Prompt ID is required");
    const prompt = await prompts_model_1.Prompt.findById(promptId);
    if (!prompt)
        throw new ApiError_1.ApiError(404, "Prompt not found");
    const existingLike = await like_model_1.Like.findOne({ user: userId, prompt: promptId });
    if (existingLike) {
        await like_model_1.Like.findByIdAndDelete(existingLike._id);
        const updatedLikes = await like_model_1.Like.find({ prompt: promptId }).select("_id");
        prompt.likes = updatedLikes.map((like) => like._id);
        await prompt.save();
        return res.status(200).json(new ApiResponse_1.ApiResponse(200, { data: null }, "Disliked successfully"));
    }
    try {
        const newLike = await like_model_1.Like.create({ user: userId, prompt: promptId });
        const updatedLikes = await like_model_1.Like.find({ prompt: promptId }).select("_id");
        prompt.likes = updatedLikes.map((like) => like._id);
        await prompt.save();
        return res.status(200).json(new ApiResponse_1.ApiResponse(200, { data: null }, "Liked successfully"));
    }
    catch (err) {
        if (err.code === 11000) {
            return res.status(400).json(new ApiResponse_1.ApiResponse(400, null, "Already liked"));
        }
        throw new ApiError_1.ApiError(500, "Something went wrong while liking the prompt");
    }
});
exports.likePromptController = likePromptController;
//Controller for comments
const createCommentController = (0, asyncHandler_1.default)(async (req, res) => {
    const userId = req.user?._id;
    const { promptId, text } = req.body;
    if (!userId)
        throw new ApiError_1.ApiError(401, "Unauthorized");
    if (!promptId || !text)
        throw new ApiError_1.ApiError(400, "Prompt ID and text are required");
    // Optional: check if prompt exists
    const promptExists = await prompts_model_1.Prompt.findById(promptId);
    if (!promptExists)
        throw new ApiError_1.ApiError(404, "Prompt not found");
    // Create new comment
    const newComment = await comments_model_1.Comment.create({
        user: userId,
        prompt: promptId,
        text,
    });
    // Update prompt comments array
    promptExists.comments.push(newComment._id);
    await promptExists.save();
    const populatedComment = await comments_model_1.Comment.findById(newComment._id)
        .populate('user', 'name avatar') // populate only needed user fields
        .lean();
    res.status(201).json(new ApiResponse_1.ApiResponse(201, { comment: populatedComment }, "Comment created successfully"));
});
exports.createCommentController = createCommentController;
// Controller for update comments 
const updateCommentController = (0, asyncHandler_1.default)(async (req, res) => {
    const userId = req.user?._id; // assuming auth middleware sets req.user
    const { commentId } = req.params;
    const { text } = req.body;
    if (!text || typeof text !== "string" || text.trim() === "") {
        throw new ApiError_1.ApiError(400, "Comment text is required");
    }
    const comment = await comments_model_1.Comment.findById(commentId);
    if (!comment) {
        throw new ApiError_1.ApiError(404, "Comment not found");
    }
    if (String(comment.user) !== String(userId)) {
        throw new ApiError_1.ApiError(403, "You can only edit your own comments");
    }
    comment.text = text.trim();
    await comment.save();
    res.status(200).json(new ApiResponse_1.ApiResponse(200, { comment }, "Comment updated successfully"));
});
exports.updateCommentController = updateCommentController;
// Controller for delete comments
const deleteCommentController = (0, asyncHandler_1.default)(async (req, res) => {
    const userId = req?.user?._id;
    if (!userId)
        throw new ApiError_1.ApiError(401, "Unauthorized");
    const { commentId } = req.params;
    if (!mongoose_1.default.Types.ObjectId.isValid(commentId)) {
        throw new ApiError_1.ApiError(400, "Invalid comment ID");
    }
    const comment = await comments_model_1.Comment.findById(commentId);
    if (!comment)
        throw new ApiError_1.ApiError(404, "Comment not found");
    if (comment.user.toString() !== userId) {
        throw new ApiError_1.ApiError(403, "You are not authorized to delete this comment");
    }
    // Get all nested comment IDs (comment + all replies + their replies ...)
    const allCommentIds = await (0, getAllNestedCommentIds_1.getAllNestedCommentIds)(commentId);
    // Delete all likes related to these comments
    await like_model_1.Like.deleteMany({
        comment: { $in: allCommentIds.map(id => new mongoose_1.default.Types.ObjectId(id)) },
    });
    // Remove references to all these comments from their parents or prompt
    if (comment.parentComment) {
        // It's a reply, remove only from its parent's replies
        await comments_model_1.Comment.findByIdAndUpdate(comment.parentComment, {
            $pull: { replies: comment._id },
        });
    }
    else {
        // Top-level comment: remove all these comments from prompt's comments array
        await prompts_model_1.Prompt.findByIdAndUpdate(comment.prompt, {
            $pull: { comments: { $in: allCommentIds } },
        });
    }
    // Delete all comments recursively
    await comments_model_1.Comment.deleteMany({ _id: { $in: allCommentIds } });
    res.status(200).json(new ApiResponse_1.ApiResponse(200, {}, "Comment and all nested replies deleted successfully"));
});
exports.deleteCommentController = deleteCommentController;
// Controller to add comment or reply
const replyCommentController = (0, asyncHandler_1.default)(async (req, res) => {
    const userId = req.user?._id;
    const { promptId, text, parentComment } = req.body;
    if (!text || !promptId || !parentComment) {
        throw new ApiError_1.ApiError(400, "Text, promptId, and parentComment are required");
    }
    const parent = await comments_model_1.Comment.findById(parentComment);
    if (!parent)
        throw new ApiError_1.ApiError(404, "Parent comment not found");
    const comment = await comments_model_1.Comment.create({
        user: userId,
        prompt: promptId,
        text,
        parentComment: parent._id,
    });
    // Add reply to parent comment's replies
    parent.replies.push(comment._id);
    await parent.save();
    await comment.populate("user", "-password -refreshToken");
    res.status(201).json(new ApiResponse_1.ApiResponse(201, { comment }, "Reply posted successfully"));
});
exports.replyCommentController = replyCommentController;
// Controller for like comments
const likeCommentController = (0, asyncHandler_1.default)(async (req, res) => {
    const userId = req.user?._id;
    const { commentId } = req.body;
    if (!userId)
        throw new ApiError_1.ApiError(401, "Unauthorized");
    if (!commentId)
        throw new ApiError_1.ApiError(400, "Comment ID is required");
    const comment = await comments_model_1.Comment.findById(commentId);
    if (!comment)
        throw new ApiError_1.ApiError(404, "Comment not found");
    const alreadyLiked = comment.likes.includes(userId);
    if (alreadyLiked) {
        // Unlike
        comment.likes = comment.likes.filter((id) => String(id) !== String(userId));
        await comment.save();
        return res
            .status(200)
            .json(new ApiResponse_1.ApiResponse(200, { liked: false }, "Comment unliked"));
    }
    else {
        // Like
        comment.likes.push(userId);
        await comment.save();
        return res
            .status(200)
            .json(new ApiResponse_1.ApiResponse(200, { liked: true }, "Comment liked"));
    }
});
exports.likeCommentController = likeCommentController;
// Controller for my prompts
const getMyPromptsController = (0, asyncHandler_1.default)(async (req, res) => {
    const userId = req.user?._id;
    if (!userId)
        throw new ApiError_1.ApiError(401, "Unauthorized");
    // Clean up invalid prompt references
    await (0, cleanInvalidPromptReferences_1.cleanInvalidPromptReferences)(userId);
    const query = { creator: userId };
    const prompts = await prompts_model_1.Prompt.aggregate([
        { $match: { ...query, isDraft: false } },
        { $sort: { createdAt: -1 } },
        {
            $lookup: {
                from: "users",
                foreignField: "_id",
                localField: "creator",
                as: "creator",
                pipeline: [{ $project: { password: 0, refreshToken: 0 } }],
            },
        },
        {
            $unwind: {
                path: "$creator",
                preserveNullAndEmptyArrays: true,
            },
        },
        {
            $lookup: {
                from: "comments",
                foreignField: "prompt",
                localField: "_id",
                as: "comments",
                pipeline: [
                    { $match: { parentComment: null } },
                    {
                        $project: {
                            text: 1,
                            createdAt: 1,
                            user: 1,
                            replies: 1,
                            likes: 1,
                        },
                    },
                ],
            },
        },
    ]).exec();
    // Recursively populate nested replies + user data
    for (const prompt of prompts) {
        for (const comment of prompt.comments) {
            await (0, populateRepliesRecursively_1.populateRepliesRecursively)(comment);
        }
    }
    // Attach likes for prompts
    const promptLikes = await like_model_1.Like.find({ prompt: { $in: prompts.map(p => p._id) } }).lean();
    const likeMap = {};
    for (const like of promptLikes) {
        const promptId = String(like.prompt);
        const userId = String(like.user);
        if (!likeMap[promptId])
            likeMap[promptId] = [];
        likeMap[promptId].push(userId);
    }
    const promptsWithLikes = prompts.map((prompt) => ({
        ...prompt,
        likes: likeMap[String(prompt._id)] || [],
    }));
    res.status(200).json(new ApiResponse_1.ApiResponse(200, promptsWithLikes, "Your prompts fetched successfully"));
});
exports.getMyPromptsController = getMyPromptsController;
// Controller for get single
const getSinglePromptController = (0, asyncHandler_1.default)(async (req, res) => {
    const promptId = req.params.id;
    const userId = req.user?._id;
    const ip = req.headers["x-forwarded-for"] || req.socket.remoteAddress;
    const prompt = await prompts_model_1.Prompt.findById(promptId).populate("creator", "name avatar");
    if (!prompt) {
        throw new ApiError_1.ApiError(404, "Prompt not found");
    }
    let shouldUpdate = false;
    if (userId) {
        const hasViewed = prompt.viewedBy.some((id) => id.toString() === userId.toString());
        if (!hasViewed) {
            prompt.viewedBy.push(userId);
            prompt.views += 1;
            shouldUpdate = true;
        }
    }
    else if (ip && typeof ip === "string") {
        const hasViewed = prompt.viewedIPs.includes(ip);
        if (!hasViewed) {
            prompt.viewedIPs.push(ip);
            prompt.views += 1;
            shouldUpdate = true;
        }
    }
    if (shouldUpdate) {
        await prompt.save();
    }
    res
        .status(200)
        .json(new ApiResponse_1.ApiResponse(200, { prompt }, "Prompt fetched successfully"));
});
exports.getSinglePromptController = getSinglePromptController;
// Controller for update prompt
const updatePromptController = (0, asyncHandler_1.default)(async (req, res) => {
    const promptId = req.params.id;
    const userId = req.user?._id;
    if (!promptId)
        throw new ApiError_1.ApiError(400, "Prompt ID is required");
    const existingPrompt = await prompts_model_1.Prompt.findById(promptId);
    if (!existingPrompt)
        throw new ApiError_1.ApiError(404, "Prompt not found");
    if (String(existingPrompt.creator) !== String(userId)) {
        throw new ApiError_1.ApiError(403, "You are not authorized to update this prompt");
    }
    const { title, description, category, aiModel, promptText, resultType, resultContent: rawResultContent, paymentStatus, price, tags, } = req.body;
    // Log everything for debug
    console.log("---- UPDATE PROMPT INPUT ----");
    console.log("Body:", req.body);
    console.log("Files:", req.files);
    console.log("File:", req.file);
    // Normalize tags
    let normalizedTags = existingPrompt.tags;
    if (tags) {
        try {
            const parsed = typeof tags === "string" ? JSON.parse(tags) : tags;
            normalizedTags = Array.isArray(parsed)
                ? parsed.flatMap((tag) => tag.split(",").map((t) => t.trim()))
                : [];
        }
        catch {
            console.warn("❌ Failed to parse tags JSON:", tags);
            normalizedTags = [];
        }
    }
    // Decide result content
    let finalResultContent = existingPrompt.resultContent;
    if (resultType === "text") {
        if (!rawResultContent?.trim()) {
            throw new ApiError_1.ApiError(400, "Text result content is required");
        }
        finalResultContent = rawResultContent.trim();
    }
    else if (["image", "video"].includes(resultType)) {
        const file = req.files?.promptContent?.[0] || req.file;
        if (file?.path) {
            const uploaded = await (0, cloudinary_1.uploadOnCloudinary)(file.path);
            if (!uploaded?.secure_url) {
                throw new ApiError_1.ApiError(500, "Failed to upload media to Cloudinary");
            }
            finalResultContent = uploaded.secure_url;
        }
        else if (rawResultContent?.trim()) {
            if (!isValidUrl(rawResultContent.trim())) {
                throw new ApiError_1.ApiError(400, "Invalid media URL provided");
            }
            finalResultContent = rawResultContent.trim();
        }
        else {
            throw new ApiError_1.ApiError(400, "Please upload a file or provide a valid media link");
        }
    }
    // Apply updates
    if (title)
        existingPrompt.title = title;
    if (description)
        existingPrompt.description = description;
    if (category)
        existingPrompt.category = category;
    if (aiModel)
        existingPrompt.aiModel = aiModel;
    if (promptText)
        existingPrompt.promptText = promptText;
    if (resultType)
        existingPrompt.resultType = resultType;
    if (finalResultContent)
        existingPrompt.resultContent = finalResultContent;
    if (normalizedTags)
        existingPrompt.tags = normalizedTags;
    if (paymentStatus === "free" || paymentStatus === "paid") {
        existingPrompt.paymentStatus = paymentStatus;
        existingPrompt.price = paymentStatus === "paid" ? Number(price) || 0 : 0;
    }
    const updatedPrompt = await existingPrompt.save();
    res.status(200).json(new ApiResponse_1.ApiResponse(200, { prompt: updatedPrompt }, "Prompt updated successfully"));
});
exports.updatePromptController = updatePromptController;
// Controller for delete prompts
const deletePromptController = (0, asyncHandler_1.default)(async (req, res) => {
    const userId = req.user?._id;
    const promptId = req.params.id;
    if (!userId)
        throw new ApiError_1.ApiError(401, "Unauthorized");
    if (!promptId)
        throw new ApiError_1.ApiError(400, "Prompt ID is required");
    const prompt = await prompts_model_1.Prompt.findById(promptId);
    if (!prompt)
        throw new ApiError_1.ApiError(404, "Prompt not found");
    if (String(prompt.creator) !== String(userId)) {
        throw new ApiError_1.ApiError(403, "You are not authorized to delete this prompt");
    }
    // 1. Delete likes on this prompt
    await like_model_1.Like.deleteMany({ prompt: prompt._id });
    // 2. Delete comments and replies (nested)
    const deleteCommentsRecursively = async (commentIds) => {
        for (const commentId of commentIds) {
            const comment = await comments_model_1.Comment.findById(commentId);
            if (comment) {
                // Recursively delete replies
                await deleteCommentsRecursively(comment.replies);
                // Delete likes on the comment
                await like_model_1.Like.deleteMany({ comment: comment._id });
                // Delete the comment
                await comment.deleteOne();
            }
        }
    };
    // Get top-level comments for this prompt
    const topLevelComments = await comments_model_1.Comment.find({
        prompt: prompt._id,
        parentComment: null,
    });
    const topLevelCommentIds = topLevelComments.map((c) => c._id);
    // Delete all nested comments
    await deleteCommentsRecursively(topLevelCommentIds);
    // 3. Delete the prompt itself
    await prompt.deleteOne();
    // 4. Remove prompt ID from user's prompts array
    await users_model_1.User.updateOne({ _id: userId }, {
        $pull: {
            prompts: prompt._id,
            bookmarks: prompt._id,
        },
    });
    res
        .status(200)
        .json(new ApiResponse_1.ApiResponse(200, {}, "Prompt deleted successfully"));
});
exports.deletePromptController = deletePromptController;
//controller for buy prompt
const buyPromptController = (0, asyncHandler_1.default)(async (req, res) => {
    const promptId = req.params.id;
    const userId = req.user?._id;
    if (!userId)
        throw new ApiError_1.ApiError(401, "Unauthorized");
    if (!promptId)
        throw new ApiError_1.ApiError(400, "Prompt ID is required");
    const prompt = await prompts_model_1.Prompt.findById(promptId);
    if (!prompt)
        throw new ApiError_1.ApiError(404, "Prompt not found");
    if (String(prompt.creator) === String(userId)) {
        throw new ApiError_1.ApiError(403, "You cannot buy your own prompt");
    }
    if (prompt.paymentStatus === "free") {
        throw new ApiError_1.ApiError(400, "This prompt is free");
    }
    if (prompt.purchasedBy.includes(userId)) {
        throw new ApiError_1.ApiError(400, "You have already purchased this prompt");
    }
    const price = prompt.price ?? 0;
    const buyer = await users_model_1.User.findById(userId);
    const creator = await users_model_1.User.findById(prompt.creator);
    if (!buyer || !creator)
        throw new ApiError_1.ApiError(404, "User not found");
    if (buyer.credits < price) {
        throw new ApiError_1.ApiError(400, "Insufficient credits");
    }
    // Deduct from buyer
    buyer.credits -= price;
    await buyer.save();
    // Add to creator
    creator.credits += price;
    await creator.save();
    // Update prompt
    prompt.purchasedBy.push(userId);
    await prompt.save();
    // Store purchase history
    await purchaseHistory_model_1.PurchaseHistory.create({
        buyer: buyer._id,
        prompt: prompt._id,
        seller: creator._id,
        amount: price,
        paymentMethod: "credits",
    });
    // updated buyer purchasedPrompts
    buyer.purchasedPrompts.push(prompt._id);
    await buyer.save();
    return res.status(200).json(new ApiResponse_1.ApiResponse(200, { updatedCredits: buyer.credits }, //   send updated buyer credits
    "Prompt purchased successfully"));
});
exports.buyPromptController = buyPromptController;
// Controller for get my purchases
const getMyPurchasesController = (0, asyncHandler_1.default)(async (req, res) => {
    const userId = req.user?._id;
    if (!userId)
        throw new ApiError_1.ApiError(401, "Unauthorized");
    const history = await purchaseHistory_model_1.PurchaseHistory.find({ buyer: userId })
        .populate("prompt", "title price")
        .populate("creator", "name email");
    return res.status(200).json(new ApiResponse_1.ApiResponse(200, history, "Purchase history fetched"));
});
exports.getMyPurchasesController = getMyPurchasesController;
// Controller for get prompt by slug
const getPromptBySlugController = (0, asyncHandler_1.default)(async (req, res) => {
    const { slug } = req.params;
    const ip = req.clientIP;
    const prompt = await prompts_model_1.Prompt.findOne({ slug, isPublic: true })
        .populate({
        path: "creator",
        select: "-password -refreshToken",
    })
        .populate({
        path: "comments",
        match: { parentComment: null },
        populate: [
            {
                path: "user",
                select: "name avatar",
            },
            {
                path: "likes",
                select: "user",
            },
            {
                path: "replies",
                populate: [
                    {
                        path: "user",
                        select: "name avatar",
                    },
                    {
                        path: "likes",
                        select: "user",
                    },
                    {
                        path: "replies",
                        populate: [
                            {
                                path: "user",
                                select: "name avatar",
                            },
                            {
                                path: "likes",
                                select: "user",
                            },
                        ],
                    },
                ],
            },
        ],
    });
    if (!prompt) {
        throw new ApiError_1.ApiError(404, "Prompt not found");
    }
    // Ensure `sharedBy` exists
    if (!prompt.sharedBy) {
        prompt.sharedBy = { users: [], ips: [] };
    }
    let isNewShare = false;
    if (ip && !prompt.sharedBy.ips.includes(ip)) {
        prompt.sharedBy.ips.push(ip);
        isNewShare = true;
    }
    if (isNewShare) {
        prompt.shareCount += 1;
        prompt.markModified("sharedBy");
        await prompts_model_1.Prompt.findByIdAndUpdate(prompt._id, {
            sharedBy: prompt.sharedBy,
            shareCount: prompt.shareCount,
        });
    }
    return res.status(200).json(new ApiResponse_1.ApiResponse(200, { data: [prompt] }, "Prompts fetched successfully"));
});
exports.getPromptBySlugController = getPromptBySlugController;
// Controller for save prompt as draft
const savePromptAsDraftController = (0, asyncHandler_1.default)(async (req, res) => {
    const userId = req.user?._id;
    if (!userId)
        throw new ApiError_1.ApiError(401, "Unauthorized");
    const { title, description, category, promptText, resultType, resultContent, aiModel, paymentStatus, price, } = req.body;
    let tags = [];
    if (Array.isArray(req.body.tags)) {
        tags = req.body.tags;
    }
    else if (typeof req.body.tags === "string") {
        try {
            tags = JSON.parse(req.body.tags);
        }
        catch {
            tags = [];
        }
    }
    if (!title || !category || !promptText || !resultType || !aiModel || !paymentStatus) {
        throw new ApiError_1.ApiError(400, "Missing required fields");
    }
    // Process uploaded file if exists
    let finalResultContent = resultContent?.trim() || "";
    if (!finalResultContent && ["image", "video"].includes(resultType)) {
        const file = req.files?.promptContent?.[0];
        if (!file || !file.path) {
            throw new ApiError_1.ApiError(400, `File or URL is required for ${resultType}`);
        }
        const uploaded = await (0, cloudinary_1.uploadOnCloudinary)(file.path);
        if (!uploaded?.secure_url) {
            throw new ApiError_1.ApiError(500, "Failed to upload file to Cloudinary");
        }
        finalResultContent = uploaded.secure_url;
    }
    const prompt = await prompts_model_1.Prompt.create({
        title,
        description,
        tags,
        category,
        promptText,
        resultType,
        resultContent: finalResultContent,
        aiModel,
        price: paymentStatus === "paid" ? Number(price) || 0 : 0,
        paymentStatus,
        isDraft: true,
        creator: userId,
    });
    const newCreatedPrompt = await prompts_model_1.Prompt.findById(prompt._id).populate("creator", "name email");
    if (!newCreatedPrompt)
        throw new ApiError_1.ApiError(404, "Prompt was not created");
    res
        .status(200)
        .json(new ApiResponse_1.ApiResponse(200, newCreatedPrompt, "Prompt saved as draft"));
});
exports.savePromptAsDraftController = savePromptAsDraftController;
// Controller for get all draft prompts
const getAllMyDraftPromptsController = (0, asyncHandler_1.default)(async (req, res) => {
    const userId = req?.user?._id;
    if (!userId)
        throw new ApiError_1.ApiError(401, "Unauthorized");
    const { category, isPaid, searchString } = req.query;
    const query = { creator: userId };
    if (category)
        query.category = category;
    if (isPaid === "true")
        query.isPaid = true;
    if (typeof searchString === "string" && searchString.trim() !== "") {
        query.$or = [
            { title: { $regex: new RegExp(searchString, "i") } },
            { description: { $regex: new RegExp(searchString, "i") } },
        ];
    }
    const prompts = await prompts_model_1.Prompt.aggregate([
        { $match: { ...query, isDraft: true } },
        { $sort: { createdAt: -1 } },
        {
            $lookup: {
                from: "users",
                foreignField: "_id",
                localField: "creator",
                as: "creator",
                pipeline: [{ $project: { password: 0, refreshToken: 0 } }],
            },
        },
        {
            $unwind: {
                path: "$creator",
                preserveNullAndEmptyArrays: true,
            },
        },
        {
            $lookup: {
                from: "comments",
                foreignField: "prompt",
                localField: "_id",
                as: "comments",
                pipeline: [
                    { $match: { parentComment: null } },
                    {
                        $project: {
                            text: 1,
                            createdAt: 1,
                            user: 1,
                            replies: 1,
                            likes: 1,
                        },
                    },
                ],
            },
        },
    ]);
    // Recursively populate nested replies + user data
    for (const prompt of prompts) {
        for (const comment of prompt.comments) {
            await (0, populateRepliesRecursively_1.populateRepliesRecursively)(comment);
        }
    }
    // Attach likes for prompts
    const promptLikes = await like_model_1.Like.find({ prompt: { $ne: null } }).lean();
    const likeMap = {};
    for (const like of promptLikes) {
        const promptId = String(like.prompt);
        const userId = String(like.user);
        if (!likeMap[promptId])
            likeMap[promptId] = [];
        likeMap[promptId].push(userId);
    }
    const promptsWithLikes = prompts.map((prompt) => ({
        ...prompt,
        likes: likeMap[String(prompt._id)] || [],
    }));
    res.status(200).json(new ApiResponse_1.ApiResponse(200, promptsWithLikes, "Prompts fetched successfully"));
});
exports.getAllMyDraftPromptsController = getAllMyDraftPromptsController;
// Controller for publish prompt from draft
const publishPromptFromDraftsController = (0, asyncHandler_1.default)(async (req, res) => {
    const userId = req?.user?._id;
    if (!userId)
        throw new ApiError_1.ApiError(401, "Unauthorized");
    const promptId = req.params.id;
    if (!promptId || !mongoose_1.default.Types.ObjectId.isValid(promptId)) {
        throw new ApiError_1.ApiError(400, "Valid Prompt ID is required");
    }
    const prompt = await prompts_model_1.Prompt.findById(promptId);
    if (!prompt)
        throw new ApiError_1.ApiError(404, "Prompt not found");
    if (String(prompt.creator) !== String(userId)) {
        throw new ApiError_1.ApiError(403, "You are not authorized to publish this prompt");
    }
    if (!prompt.isDraft) {
        throw new ApiError_1.ApiError(400, "Prompt is already published");
    }
    await prompts_model_1.Prompt.updateOne({ _id: promptId }, {
        $set: {
            isDraft: false,
            createdAt: new Date(),
        },
    }, {
        timestamps: false,
        overwriteImmutable: true,
    });
    return res
        .status(200)
        .json(new ApiResponse_1.ApiResponse(200, { data: null }, "Prompt published successfully"));
});
exports.publishPromptFromDraftsController = publishPromptFromDraftsController;
// Controller for toggling prompt bookmark
const savePromptAsBookmarkController = (0, asyncHandler_1.default)(async (req, res) => {
    const userId = req.user?._id;
    if (!userId)
        throw new ApiError_1.ApiError(401, "Unauthorized");
    const { promptId } = req.body;
    if (!promptId)
        throw new ApiError_1.ApiError(400, "Prompt ID is required");
    const prompt = await prompts_model_1.Prompt.findById(promptId);
    if (!prompt)
        throw new ApiError_1.ApiError(404, "Prompt not found");
    const user = await users_model_1.User.findById(userId);
    if (!user)
        throw new ApiError_1.ApiError(404, "User not found");
    const isBookmarked = user.bookmarks.includes(promptId);
    let updatedUser;
    if (isBookmarked) {
        // Remove the bookmark
        updatedUser = await users_model_1.User.findOneAndUpdate({ _id: userId }, { $pull: { bookmarks: promptId } }, { new: true });
        return res.status(200).json(new ApiResponse_1.ApiResponse(200, { removed: true, bookmarks: updatedUser?.bookmarks }, "Prompt removed from bookmarks"));
    }
    else {
        // Add the bookmark
        updatedUser = await users_model_1.User.findOneAndUpdate({ _id: userId }, { $addToSet: { bookmarks: promptId } }, { new: true });
        return res.status(200).json(new ApiResponse_1.ApiResponse(200, { added: true, bookmarks: updatedUser?.bookmarks }, "Prompt saved as bookmark"));
    }
});
exports.savePromptAsBookmarkController = savePromptAsBookmarkController;
// Controller for getting all draft prompts created by the logged-in user
const getAllMyBookmarkedPromptsController = (0, asyncHandler_1.default)(async (req, res) => {
    const userId = req?.user?._id;
    if (!userId)
        throw new ApiError_1.ApiError(401, "Unauthorized");
    // Clean up invalid prompt references
    await (0, cleanInvalidPromptReferences_1.cleanInvalidPromptReferences)(userId);
    const { category, isPaid, searchString } = req.query;
    // Step 1: Get user's bookmarks
    const user = await users_model_1.User.findById(userId).select("bookmarks").lean();
    if (!user || user.bookmarks.length === 0) {
        return res
            .status(200)
            .json(new ApiResponse_1.ApiResponse(200, { data: [] }, "No bookmarked prompts found"));
    }
    // Step 2: Build query
    const query = {
        _id: { $in: user.bookmarks },
        isDraft: false,
    };
    if (category)
        query.category = category;
    if (isPaid === "true")
        query.paymentStatus = "paid";
    if (typeof searchString === "string" && searchString.trim() !== "") {
        query.$or = [
            { title: { $regex: new RegExp(searchString, "i") } },
            { description: { $regex: new RegExp(searchString, "i") } },
        ];
    }
    // Step 3: Aggregate prompts
    const prompts = await prompts_model_1.Prompt.aggregate([
        { $match: query },
        { $sort: { createdAt: -1 } },
        {
            $lookup: {
                from: "users",
                localField: "creator",
                foreignField: "_id",
                as: "creator",
                pipeline: [{ $project: { password: 0, refreshToken: 0 } }],
            },
        },
        {
            $unwind: {
                path: "$creator",
                preserveNullAndEmptyArrays: true,
            },
        },
        {
            $lookup: {
                from: "comments",
                localField: "_id",
                foreignField: "prompt",
                as: "comments",
                pipeline: [
                    { $match: { parentComment: null } },
                    {
                        $project: {
                            text: 1,
                            createdAt: 1,
                            user: 1,
                            replies: 1,
                            likes: 1,
                        },
                    },
                ],
            },
        },
    ]);
    // Step 4: Populate replies recursively
    for (const prompt of prompts) {
        for (const comment of prompt.comments) {
            await (0, populateRepliesRecursively_1.populateRepliesRecursively)(comment);
        }
    }
    // Step 5: Attach likes
    const allLikes = await like_model_1.Like.find({ prompt: { $in: user.bookmarks } });
    const likeMap = {};
    for (const like of allLikes) {
        const pid = String(like.prompt);
        const uid = String(like.user);
        if (!likeMap[pid])
            likeMap[pid] = [];
        likeMap[pid].push(uid);
    }
    const promptsWithLikes = prompts.map((prompt) => ({
        ...prompt,
        likes: likeMap[String(prompt._id)] || [],
    }));
    // Step 6: Return response
    res.status(200).json(new ApiResponse_1.ApiResponse(200, promptsWithLikes, "Bookmarked prompts fetched successfully"));
});
exports.getAllMyBookmarkedPromptsController = getAllMyBookmarkedPromptsController;
// Controller for remove prompt from bookmarks
const removePromptFromBookmarksController = (0, asyncHandler_1.default)(async (req, res) => {
    const userId = req?.user?._id;
    if (!userId)
        throw new ApiError_1.ApiError(401, "Unauthorized");
    const promptId = req.params.id;
    if (!promptId || !mongoose_1.default.Types.ObjectId.isValid(promptId)) {
        throw new ApiError_1.ApiError(400, "Valid Prompt ID is required");
    }
    const prompt = await prompts_model_1.Prompt.findById(promptId).lean();
    if (!prompt)
        throw new ApiError_1.ApiError(404, "Prompt not found");
    const user = await users_model_1.User.findById(userId);
    if (!user)
        throw new ApiError_1.ApiError(404, "User not found");
    const isBookmarked = user.bookmarks.some((id) => id.toString() === promptId.toString());
    if (!isBookmarked) {
        throw new ApiError_1.ApiError(404, "Prompt not found in your bookmarks");
    }
    await users_model_1.User.findByIdAndUpdate(userId, {
        $pull: { bookmarks: promptId },
    });
    return res
        .status(200)
        .json(new ApiResponse_1.ApiResponse(200, null, "Prompt removed from bookmarks"));
});
exports.removePromptFromBookmarksController = removePromptFromBookmarksController;
// Controller for get all prompt by user slug 
const getAllPromptsByUserSlugController = (0, asyncHandler_1.default)(async (req, res) => {
    const userId = req?.user?._id;
    if (!userId)
        throw new ApiError_1.ApiError(401, "Unauthorized");
    const { category, isPaid, searchString } = req.query;
    const { slug } = req.params;
    console.log("Slug:", slug);
    const user = await users_model_1.User.findOne({ slug });
    if (!user)
        throw new ApiError_1.ApiError(404, "User not found");
    const id = String(user._id);
    if (!id) {
        throw new ApiError_1.ApiError(400, "Invalid or missing user ID");
    }
    // Build match query
    const matchQuery = {
        creator: new mongoose_1.default.Types.ObjectId(id),
        isDraft: false,
    };
    if (category && typeof category === "string") {
        matchQuery.category = category;
    }
    if (isPaid === "true") {
        matchQuery.paymentStatus = "paid";
    }
    else if (isPaid === "false") {
        matchQuery.paymentStatus = "free";
    }
    if (typeof searchString === "string" && searchString.trim() !== "") {
        matchQuery.$or = [
            { title: { $regex: new RegExp(searchString, "i") } },
            { description: { $regex: new RegExp(searchString, "i") } },
        ];
    }
    const prompts = await prompts_model_1.Prompt.aggregate([
        { $match: matchQuery },
        { $sort: { createdAt: -1 } },
        {
            $lookup: {
                from: "users",
                localField: "creator",
                foreignField: "_id",
                as: "creator",
                pipeline: [{ $project: { password: 0, refreshToken: 0 } }],
            },
        },
        {
            $unwind: {
                path: "$creator",
                preserveNullAndEmptyArrays: true,
            },
        },
        {
            $lookup: {
                from: "comments",
                localField: "_id",
                foreignField: "prompt",
                as: "comments",
                pipeline: [
                    { $match: { parentComment: null } },
                    {
                        $project: {
                            text: 1,
                            createdAt: 1,
                            user: 1,
                            replies: 1,
                            likes: 1,
                        },
                    },
                ],
            },
        },
    ]);
    // Populate nested replies — ensure populateRepliesRecursively is defined
    for (const prompt of prompts) {
        for (const comment of prompt.comments) {
            await (0, populateRepliesRecursively_1.populateRepliesRecursively)(comment);
        }
    }
    // Attach likes
    const promptLikes = await like_model_1.Like.find({ prompt: { $ne: null } }).lean();
    const likeMap = {};
    for (const like of promptLikes) {
        const promptId = String(like.prompt);
        const userId = String(like.user);
        if (!likeMap[promptId])
            likeMap[promptId] = [];
        likeMap[promptId].push(userId);
    }
    const promptsWithLikes = prompts.map((prompt) => ({
        ...prompt,
        likes: likeMap[String(prompt._id)] || [],
    }));
    res.status(200).json(new ApiResponse_1.ApiResponse(200, promptsWithLikes, "User prompts fetched successfully"));
});
exports.getAllPromptsByUserSlugController = getAllPromptsByUserSlugController;
