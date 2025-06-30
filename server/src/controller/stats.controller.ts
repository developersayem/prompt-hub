import { Request, Response } from "express";
import asyncHandler from "../utils/asyncHandler";
import { Prompt } from "../models/prompts.model";
import { ApiResponse } from "../utils/ApiResponse";

// Controller for get top creators
const getTopCreatorsController = asyncHandler(async (req: Request, res: Response) => {
  // Optional: limit number of top creators, default 5
  const limit = parseInt(req.query.limit as string) || 5;

  const result = await Prompt.aggregate([
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

  res.status(200).json(
    new ApiResponse(200, { data: result }, "Top creators fetched successfully")
  );
});

// Controller for trading tags
const getTrendingTagsController = asyncHandler(async (req: Request, res: Response) => {
  const limit = parseInt(req.query.limit as string) || 6;

  const trendingTagsAgg = await Prompt.aggregate([
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

  res.status(200).json(
    new ApiResponse(200, { data: trendingTagsAgg }, "Trending tags fetched successfully")
  );
});

// controller for community stats
const getCommunityStatsController = asyncHandler(async (req: Request, res: Response) => {
  // 1. Total Prompts
  const totalPrompts = await Prompt.countDocuments();

  // 2. Active Creators (unique users who created prompts)
  const activeCreators = await Prompt.distinct("creator").then(creators => creators.length);

  // 3. This Week's Prompts (prompts created in the last 7 days)
  const oneWeekAgo = new Date();
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
  const thisWeekPrompts = await Prompt.countDocuments({ createdAt: { $gte: oneWeekAgo } });


  res.status(200).json(
    new ApiResponse(200, {
      totalPrompts,
      activeCreators,
      thisWeekPrompts,
    }, "Community stats fetched successfully")
  );
});

export{
getTopCreatorsController,
getTrendingTagsController,
getCommunityStatsController
}
