"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getCommunityStatsController = exports.getTrendingTagsController = exports.getTopCreatorsController = void 0;
const asyncHandler_1 = __importDefault(require("../utils/asyncHandler"));
const prompts_model_1 = require("../models/prompts.model");
const ApiResponse_1 = require("../utils/ApiResponse");
// Controller for get top creators
const getTopCreatorsController = (0, asyncHandler_1.default)(async (req, res) => {
    // Optional: limit number of top creators, default 5
    const limit = parseInt(req.query.limit) || 5;
    const result = await prompts_model_1.Prompt.aggregate([
        {
            $group: {
                _id: "$creator",
                promptCount: { $sum: 1 }
            }
        },
        { $sort: { promptCount: -1 } },
        { $limit: limit },
        {
            $lookup: {
                from: "users",
                localField: "_id",
                foreignField: "_id",
                as: "userInfo",
            },
        },
        { $unwind: "$userInfo" },
        {
            $project: {
                _id: 0,
                userId: "$userInfo._id",
                name: "$userInfo.name",
                email: "$userInfo.email",
                avatar: "$userInfo.avatar",
                promptCount: 1,
            },
        },
    ]);
    res.status(200).json(new ApiResponse_1.ApiResponse(200, { data: result }, "Top creators fetched successfully"));
});
exports.getTopCreatorsController = getTopCreatorsController;
// Controller for trading tags
const getTrendingTagsController = (0, asyncHandler_1.default)(async (req, res) => {
    const limit = parseInt(req.query.limit) || 6;
    const trendingTagsAgg = await prompts_model_1.Prompt.aggregate([
        { $unwind: "$tags" }, // Unwind tags array
        {
            $group: {
                _id: "$tags",
                count: { $sum: 1 }
            }
        },
        { $sort: { count: -1 } },
        { $limit: limit },
        {
            $project: {
                _id: 0,
                tag: "$_id",
                count: 1
            }
        },
    ]);
    res.status(200).json(new ApiResponse_1.ApiResponse(200, { data: trendingTagsAgg }, "Trending tags fetched successfully"));
});
exports.getTrendingTagsController = getTrendingTagsController;
// controller for community stats
const getCommunityStatsController = (0, asyncHandler_1.default)(async (req, res) => {
    // 1. Total Prompts
    const totalPrompts = await prompts_model_1.Prompt.countDocuments();
    // 2. Active Creators (unique users who created prompts)
    const activeCreators = await prompts_model_1.Prompt.distinct("creator").then(creators => creators.length);
    // 3. This Week's Prompts (prompts created in the last 7 days)
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    const thisWeekPrompts = await prompts_model_1.Prompt.countDocuments({ createdAt: { $gte: oneWeekAgo } });
    res.status(200).json(new ApiResponse_1.ApiResponse(200, {
        totalPrompts,
        activeCreators,
        thisWeekPrompts,
    }, "Community stats fetched successfully"));
});
exports.getCommunityStatsController = getCommunityStatsController;
