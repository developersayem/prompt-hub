import { ApiError } from "../utils/ApiError";
import { ApiResponse } from "../utils/ApiResponse";
import asyncHandler from "../utils/asyncHandler";
import type { Request, Response } from "express";
import type { UploadApiResponse } from "cloudinary";
import { uploadOnCloudinary } from "../utils/cloudinary";
import { Prompt } from "../models/prompts.model";
import { User } from "../models/users.model";
import mongoose, { Schema, Types } from "mongoose";
import { Like } from "../models/like.model";
import { Comment } from "../models/comments.model";
import { populateRepliesRecursively } from "../utils/populateRepliesRecursively";
import { PurchaseHistory } from "../models/purchaseHistory.model";
import { RequestWithIP } from "../middlewares/getClientIp.middlewares";
import { getAllNestedCommentIds } from "../helper/getAllNestedCommentIds";
import { cleanInvalidPromptReferences } from "../utils/cleanInvalidPromptReferences";
import { Report } from "../models/report.model";
import { CreditService } from "../services/credit.service";

// Helper: check if a string is a valid URL
const isValidUrl = (urlString: string) => {
  try {
    new URL(urlString);
    return true;
  } catch {
    return false;
  }
};



// Controller for get all prompts
const getAllPromptsController = asyncHandler(async (req: Request, res: Response) => {
  const { category, isPaid, searchString } = req.query;

  const query: any = {};
  if (category) query.category = category;
  if (isPaid === "true") query.isPaid = true;
  if (typeof searchString === "string" && searchString.trim() !== "") {
    query.$or = [
      { title: { $regex: new RegExp(searchString, "i") } },
      { description: { $regex: new RegExp(searchString, "i") } },
    ];
  }

const prompts = await Prompt.aggregate([
  { $match: { ...query, isDraft: false } },
  { $sort: { createdAt: -1 } },
  {
    $lookup: {
      from: "users",
      foreignField: "_id",
      localField: "creator",
      as: "creator",
      pipeline: [{ $project: { 
            slug: 1,      // add this line to include slug
            name: 1,      // optional, keep if you want to display name too
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
      await populateRepliesRecursively(comment);
    }
  }

  // Attach likes for prompts
  const promptLikes = await Like.find({ prompt: { $ne: null } }).lean();

  const likeMap: Record<string, string[]> = {};
  for (const like of promptLikes) {
    const promptId = String(like.prompt);
    const userId = String(like.user);
    if (!likeMap[promptId]) likeMap[promptId] = [];
    likeMap[promptId].push(userId);
  }

  const promptsWithLikes = prompts.map((prompt) => ({
    ...prompt,
    likes: likeMap[String(prompt._id)] || [],
  }));

  res.status(200).json(
    new ApiResponse(200, promptsWithLikes , "Prompts fetched successfully")
  );
});
// Controller to get trending prompts
const getTrendingPrompts = asyncHandler(async (req: Request, res: Response) => {
  const prompts = await Prompt.aggregate([
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
      await populateRepliesRecursively(comment);
    }
  }

  // Attach likes (mapped to user IDs)
  const promptLikes = await Like.find({ prompt: { $ne: null } }).lean();

  const likeMap: Record<string, string[]> = {};
  for (const like of promptLikes) {
    const promptId = String(like.prompt);
    const userId = String(like.user);
    if (!likeMap[promptId]) likeMap[promptId] = [];
    likeMap[promptId].push(userId);
  }

  const promptsWithLikes = prompts.map((prompt) => ({
    ...prompt,
    likes: likeMap[String(prompt._id)] || [],
  }));

  res
    .status(200)
    .json(new ApiResponse(200, promptsWithLikes, "Trending prompts fetched successfully"));
});
// Controller for create prompt
const createPromptController = asyncHandler(async (req: Request, res: Response) => {
  const {
    title,
    description,
    tags,
    category,
    promptText,
    resultType,
    resultContent: rawResultContent,
    aiModel,
    price,
    paymentStatus,
  } = req.body;

  const userId = (req as any).user?._id;
  if (!userId) throw new ApiError(401, "Unauthorized");

  // Validate required fields
  if (!title || !category || !promptText || !resultType || !aiModel || !paymentStatus) {
    throw new ApiError(400, "Missing required fields");
  }

  // Validate payment status
  if (!["free", "paid"].includes(paymentStatus)) {
    throw new ApiError(400, "Invalid payment status");
  }

  // Parse and normalize tags
  let parsedTags = tags;
  if (typeof tags === "string") {
    try {
      parsedTags = JSON.parse(tags);
    } catch {
      console.warn("Failed to parse tags JSON:", tags);
      parsedTags = [];
    }
  }
  const normalizedTags = Array.isArray(parsedTags)
    ? parsedTags.flatMap((tag: string) => tag.split(",").map((t) => t.trim()))
    : [];

  // Handle result content
  let finalResultContent = "";
  if (resultType === "text") {
    if (!rawResultContent || rawResultContent.trim() === "") {
      throw new ApiError(400, "Text result content is required");
    }
    finalResultContent = rawResultContent.trim();
  } else if (["image", "video"].includes(resultType)) {
    if (rawResultContent && rawResultContent.trim() !== "") {
      // Use pasted URL if valid
      if (!isValidUrl(rawResultContent.trim())) {
        throw new ApiError(400, "Invalid URL provided for media content");
      }
      finalResultContent = rawResultContent.trim();
    } else {
      // Otherwise expect uploaded file
      const file = (req.files as any)?.promptContent?.[0];
      if (!file || !file.path) {
        throw new ApiError(400, `Media file or URL is required for ${resultType} prompt`);
      }
      const uploaded: UploadApiResponse | null = await uploadOnCloudinary(file.path);
      if (!uploaded || !uploaded.secure_url) {
        throw new ApiError(500, "Failed to upload media to Cloudinary");
      }
      finalResultContent = uploaded.secure_url;
    }
  } else {
    throw new ApiError(400, "Invalid result type");
  }

  // Create the prompt
  const newPrompt = await Prompt.create({
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
    throw new ApiError(500, "Failed to create prompt");
  }

  res
    .status(201)
    .json(new ApiResponse(201, newPrompt , "Prompt created successfully"));
});
// Controller to increase prompt views
const increasePromptViewsController = asyncHandler(
  async (req: RequestWithIP, res: Response) => {
    const userId = (req as any).user?._id;
  if (!userId) throw new ApiError(401, "Unauthorized");

    const promptId = req.params.id;
    if (!promptId || !mongoose.Types.ObjectId.isValid(promptId)) {
      throw new ApiError(400, "Valid Prompt ID is required");
    }

    const prompt = await Prompt.findById(promptId);
    if (!prompt) {
      throw new ApiError(404, "Prompt not found");
    }

    const ip = req.clientIP;

    const alreadyViewedByUser = userId && prompt.viewedBy.includes(userId);
    const alreadyViewedByIP = ip && prompt.viewedIPs.includes(ip);

    if (!alreadyViewedByUser && !alreadyViewedByIP) {
      prompt.views += 1;
      if (userId) prompt.viewedBy.push(userId);
      if (ip) prompt.viewedIPs.push(ip);
      await prompt.save();
    }

    return res.status(200).json(
      new ApiResponse(
        200,
        { views: prompt.views },
        alreadyViewedByUser || alreadyViewedByIP
          ? "Already viewed"
          : "View recorded"
      )
    );
  }
);
// Controller for like prompt
const likePromptController = asyncHandler(async (req: Request, res: Response) => {
  const userId = (req as any)?.user?._id as mongoose.Types.ObjectId;
  if (!userId) throw new ApiError(401, "Unauthorized");

  const { promptId } = req.body;
  if (!promptId) throw new ApiError(400, "Prompt ID is required");

  const prompt = await Prompt.findById(promptId);
  if (!prompt) throw new ApiError(404, "Prompt not found");

  const existingLike = await Like.findOne({ user: userId, prompt: promptId });

  if (existingLike) {
    await Like.findByIdAndDelete(existingLike._id);

    const updatedLikes = await Like.find({ prompt: promptId }).select("_id");
    prompt.likes = updatedLikes.map((like) => like._id) as mongoose.Types.ObjectId[];
    await prompt.save();

    return res.status(200).json(
      new ApiResponse(200, { data: null }, "Disliked successfully")
    );
  }

  try {
    const newLike = await Like.create({ user: userId, prompt: promptId });

    const updatedLikes = await Like.find({ prompt: promptId }).select("_id");
    prompt.likes = updatedLikes.map((like) => like._id) as mongoose.Types.ObjectId[];
    await prompt.save();

    return res.status(200).json(
      new ApiResponse(200, { data: null }, "Liked successfully")
    );
  } catch (err: any) {
    if (err.code === 11000) {
      return res.status(400).json(new ApiResponse(400, null, "Already liked"));
    }

    throw new ApiError(500, "Something went wrong while liking the prompt");
  }
});
//Controller for comments
const createCommentController = asyncHandler(async (req: Request, res: Response) => {
  const userId = (req as any).user?._id;
  const { promptId, text } = req.body;

  if (!userId) throw new ApiError(401, "Unauthorized");
  if (!promptId || !text) throw new ApiError(400, "Prompt ID and text are required");

  // Optional: check if prompt exists
  const promptExists = await Prompt.findById(promptId);
  if (!promptExists) throw new ApiError(404, "Prompt not found");

  // Create new comment
  const newComment = await Comment.create({
    user: userId,
    prompt: promptId,
    text,
  });
  // Update prompt comments array
  promptExists.comments.push(newComment._id as Types.ObjectId);
  await promptExists.save();

  const populatedComment = await Comment.findById(newComment._id)
  .populate('user', 'name avatar') // populate only needed user fields
  .lean();


  res.status(201).json(
    new ApiResponse(201, { comment: populatedComment }, "Comment created successfully"));
});
// Controller for update comments 
const updateCommentController = asyncHandler(async (req: Request, res: Response) => {
  const userId = (req as any).user?._id; // assuming auth middleware sets req.user
  const { commentId } = req.params;
  const { text } = req.body;

  if (!text || typeof text !== "string" || text.trim() === "") {
    throw new ApiError(400, "Comment text is required");
  }

  const comment = await Comment.findById(commentId);
  if (!comment) {
    throw new ApiError(404, "Comment not found");
  }

  if (String(comment.user) !== String(userId)) {
    throw new ApiError(403, "You can only edit your own comments");
  }

  comment.text = text.trim();
  await comment.save();

  res.status(200).json(
    new ApiResponse(200, { comment }, "Comment updated successfully")
  );
});
// Controller for delete comments
const deleteCommentController = asyncHandler(async (req: Request, res: Response) => {
   const userId = (req as any)?.user?._id as mongoose.Types.ObjectId;
  if (!userId) throw new ApiError(401, "Unauthorized");
  const { commentId } = req.params;

  if (!mongoose.Types.ObjectId.isValid(commentId)) {
    throw new ApiError(400, "Invalid comment ID");
  }

  const comment = await Comment.findById(commentId);
  if (!comment) throw new ApiError(404, "Comment not found");

  if (comment.user.toString() !== userId) {
    throw new ApiError(403, "You are not authorized to delete this comment");
  }

  // Get all nested comment IDs (comment + all replies + their replies ...)
  const allCommentIds = await getAllNestedCommentIds(commentId);

  // Delete all likes related to these comments
  await Like.deleteMany({
    comment: { $in: allCommentIds.map(id => new mongoose.Types.ObjectId(id)) },
  });

  // Remove references to all these comments from their parents or prompt
  if (comment.parentComment) {
    // It's a reply, remove only from its parent's replies
    await Comment.findByIdAndUpdate(comment.parentComment, {
      $pull: { replies: comment._id },
    });
  } else {
    // Top-level comment: remove all these comments from prompt's comments array
    await Prompt.findByIdAndUpdate(comment.prompt, {
      $pull: { comments: { $in: allCommentIds } },
    });
  }

  // Delete all comments recursively
  await Comment.deleteMany({ _id: { $in: allCommentIds } });

  res.status(200).json(new ApiResponse(200, {}, "Comment and all nested replies deleted successfully"));
});
// Controller to add comment or reply
const replyCommentController = asyncHandler(async (req: Request, res: Response) => {
  const userId = (req as any).user?._id;
  const { promptId, text, parentComment } = req.body;

  if (!text || !promptId || !parentComment) {
    throw new ApiError(400, "Text, promptId, and parentComment are required");
  }

  const parent = await Comment.findById(parentComment);
  if (!parent) throw new ApiError(404, "Parent comment not found");

  const comment = await Comment.create({
    user: userId,
    prompt: promptId,
    text,
    parentComment: parent._id,
  });

  // Add reply to parent comment's replies
  parent.replies.push(comment._id);
  await parent.save();

  await comment.populate("user", "-password -refreshToken");

  res.status(201).json(new ApiResponse(201, { comment }, "Reply posted successfully"));
});
// Controller for like comments
const likeCommentController = asyncHandler(async (req: Request, res: Response) => {
  const userId = (req as any).user?._id;
  const { commentId } = req.body;

  if (!userId) throw new ApiError(401, "Unauthorized");
  if (!commentId) throw new ApiError(400, "Comment ID is required");

  const comment = await Comment.findById(commentId);
  if (!comment) throw new ApiError(404, "Comment not found");

  const alreadyLiked = comment.likes.includes(userId);

  if (alreadyLiked) {
    // Unlike
    comment.likes = comment.likes.filter((id: mongoose.Types.ObjectId | string) => String(id) !== String(userId));
    await comment.save();
    return res
      .status(200)
      .json(new ApiResponse(200, { liked: false }, "Comment unliked"));
  } else {
    // Like
    comment.likes.push(userId);
    await comment.save();
    return res
      .status(200)
      .json(new ApiResponse(200, { liked: true }, "Comment liked"));
  }
});
// Controller for my prompts
const getMyPromptsController = asyncHandler(async (req: Request, res: Response) => {
  const userId = (req as any).user?._id;
  if (!userId) throw new ApiError(401, "Unauthorized");
  // Clean up invalid prompt references
  await cleanInvalidPromptReferences(userId);

  const query = { creator: userId };

  const prompts = await Prompt.aggregate([
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
      await populateRepliesRecursively(comment);
    }
  }

  // Attach likes for prompts
  const promptLikes = await Like.find({ prompt: { $in: prompts.map(p => p._id) } }).lean();

  const likeMap: Record<string, string[]> = {};
  for (const like of promptLikes) {
    const promptId = String(like.prompt);
    const userId = String(like.user);
    if (!likeMap[promptId]) likeMap[promptId] = [];
    likeMap[promptId].push(userId);
  }

  const promptsWithLikes = prompts.map((prompt) => ({
    ...prompt,
    likes: likeMap[String(prompt._id)] || [],
  }));

  res.status(200).json(
    new ApiResponse(200, promptsWithLikes, "Your prompts fetched successfully")
  );
});
// Controller for get single
const getSinglePromptController = asyncHandler(async (req: Request, res: Response) => {
    const promptId = req.params.id;
    const userId = (req as any).user?._id;
    const ip =
      (req.headers["x-forwarded-for"] as string) || req.socket.remoteAddress;

    const prompt = await Prompt.findById(promptId).populate(
      "creator",
      "name avatar"
    );

    if (!prompt) {
      throw new ApiError(404, "Prompt not found");
    }

    let shouldUpdate = false;

    if (userId) {
      const hasViewed = prompt.viewedBy.some(
        (id) => id.toString() === userId.toString()
      );
      if (!hasViewed) {
        prompt.viewedBy.push(userId);
        prompt.views += 1;
        shouldUpdate = true;
      }
    } else if (ip && typeof ip === "string") {
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
      .json(new ApiResponse(200, { prompt }, "Prompt fetched successfully"));
  }
);
// Controller for update prompt
const updatePromptController = asyncHandler(async (req: Request, res: Response) => {
  const promptId = req.params.id;
  const userId = (req as any).user?._id;

  if (!promptId) throw new ApiError(400, "Prompt ID is required");

  const existingPrompt = await Prompt.findById(promptId);
  if (!existingPrompt) throw new ApiError(404, "Prompt not found");

  if (String(existingPrompt.creator) !== String(userId)) {
    throw new ApiError(403, "You are not authorized to update this prompt");
  }

  const {
    title,
    description,
    category,
    aiModel,
    promptText,
    resultType,
    resultContent: rawResultContent,
    paymentStatus,
    price,
    tags,
  } = req.body;

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
        ? parsed.flatMap((tag: string) => tag.split(",").map((t) => t.trim()))
        : [];
    } catch {
      console.warn("❌ Failed to parse tags JSON:", tags);
      normalizedTags = [];
    }
  }

  // Decide result content
  let finalResultContent = existingPrompt.resultContent;

  if (resultType === "text") {
    if (!rawResultContent?.trim()) {
      throw new ApiError(400, "Text result content is required");
    }
    finalResultContent = rawResultContent.trim();
  } else if (["image", "video"].includes(resultType)) {
    const file = (req.files as any)?.promptContent?.[0] || req.file;

    if (file?.path) {
      const uploaded: UploadApiResponse | null = await uploadOnCloudinary(file.path);
      if (!uploaded?.secure_url) {
        throw new ApiError(500, "Failed to upload media to Cloudinary");
      }
      finalResultContent = uploaded.secure_url;
    } else if (rawResultContent?.trim()) {
      if (!isValidUrl(rawResultContent.trim())) {
        throw new ApiError(400, "Invalid media URL provided");
      }
      finalResultContent = rawResultContent.trim();
    } else {
      throw new ApiError(400, "Please upload a file or provide a valid media link");
    }
  }

  // Apply updates
  if (title) existingPrompt.title = title;
  if (description) existingPrompt.description = description;
  if (category) existingPrompt.category = category;
  if (aiModel) existingPrompt.aiModel = aiModel;
  if (promptText) existingPrompt.promptText = promptText;
  if (resultType) existingPrompt.resultType = resultType;
  if (finalResultContent) existingPrompt.resultContent = finalResultContent;
  if (normalizedTags) existingPrompt.tags = normalizedTags;

  if (paymentStatus === "free" || paymentStatus === "paid") {
    existingPrompt.paymentStatus = paymentStatus;
    existingPrompt.price = paymentStatus === "paid" ? Number(price) || 0 : 0;
  }

  const updatedPrompt = await existingPrompt.save();

  res.status(200).json(
    new ApiResponse(200, { prompt: updatedPrompt }, "Prompt updated successfully")
  );
});
// Controller for delete prompts
const deletePromptController = asyncHandler(async (req: Request, res: Response) => {
  const userId = (req as any).user?._id;
  const promptId = req.params.id;

  if (!userId) throw new ApiError(401, "Unauthorized");
  if (!promptId) throw new ApiError(400, "Prompt ID is required");

  const prompt = await Prompt.findById(promptId);
  if (!prompt) throw new ApiError(404, "Prompt not found");

  if (String(prompt.creator) !== String(userId)) {
    throw new ApiError(403, "You are not authorized to delete this prompt");
  }

  // 1. Delete likes on this prompt
  await Like.deleteMany({ prompt: prompt._id });

  // 2. Delete comments and replies (nested)
  const deleteCommentsRecursively = async (commentIds: Types.ObjectId[]) => {
    for (const commentId of commentIds) {
      const comment = await Comment.findById(commentId);
      if (comment) {
        // Recursively delete replies
        await deleteCommentsRecursively(comment.replies);

        // Delete likes on the comment
        await Like.deleteMany({ comment: comment._id });

        // Delete the comment
        await comment.deleteOne();
      }
    }
  };

  // Get top-level comments for this prompt
  const topLevelComments = await Comment.find({
    prompt: prompt._id,
    parentComment: null,
  });

  const topLevelCommentIds = topLevelComments.map((c) => c._id);

  // Delete all nested comments
  await deleteCommentsRecursively(topLevelCommentIds);

  // 3. Delete the prompt itself
  await prompt.deleteOne();

  // 4. Remove prompt ID from user's prompts array
await User.updateOne(
  { _id: userId },
  {
    $pull: {
      prompts: prompt._id,
      bookmarks: prompt._id,
    },
  }
);


  res
    .status(200)
    .json(new ApiResponse(200, {}, "Prompt deleted successfully"));
});
//controller for buy prompt
const buyPromptController = asyncHandler(async (req: Request, res: Response) => {
  const promptId = req.params.id;
  const userId = (req as any).user?._id;

  if (!userId) throw new ApiError(401, "Unauthorized");
  if (!promptId) throw new ApiError(400, "Prompt ID is required");

  const prompt = await Prompt.findById(promptId);
  if (!prompt) throw new ApiError(404, "Prompt not found");

  if (String(prompt.creator) === String(userId)) {
    throw new ApiError(403, "You cannot buy your own prompt");
  }

  if (prompt.paymentStatus === "free") {
    throw new ApiError(400, "This prompt is free");
  }

  if (prompt.purchasedBy.includes(userId)) {
    throw new ApiError(400, "You have already purchased this prompt");
  }

  const price = prompt.price ?? 0;
  const buyer = await User.findById(userId);
  const creator = await User.findById(prompt.creator);

  if (!buyer || !creator) throw new ApiError(404, "User not found");

  try {
    // Use CreditService for the transaction
    const { fromUser: updatedBuyer } = await CreditService.transferCredits(
      userId,
      prompt.creator,
      price,
      `Purchased prompt: ${prompt.title}`,
      { promptId: prompt._id }
    );

    // Update prompt
    prompt.purchasedBy.push(userId);
    await prompt.save();

    // Store purchase history
    await PurchaseHistory.create({
      buyer: buyer._id,
      prompt: prompt._id,
      seller: creator._id,
      amount: price,
      paymentMethod: "credits",
    });

    // Update buyer purchasedPrompts
    buyer.purchasedPrompts.push(prompt._id as Schema.Types.ObjectId);
    await buyer.save();

    return res.status(200).json(
      new ApiResponse(
        200,
        { updatedCredits: updatedBuyer.credits },
        "Prompt purchased successfully"
      )
    );
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError(500, "Failed to process prompt purchase");
  }
});
// Controller for get my purchases
const getMyPurchasesController = asyncHandler(async (req: Request, res: Response) => {
  const userId = (req as any).user?._id;
  if (!userId) throw new ApiError(401, "Unauthorized");

  const history = await PurchaseHistory.find({ buyer: userId })
    .populate("prompt", "title price")
    .populate("creator", "name email");

  return res.status(200).json(new ApiResponse(200, history, "Purchase history fetched"));
});
// Controller for get prompt by slug
const getPromptBySlugController = asyncHandler(
  async (req: RequestWithIP, res: Response) => {
    const { slug } = req.params;
    const ip = req.clientIP;

    const prompt = await Prompt.findOne({ slug, isPublic: true })
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
      })

    if (!prompt) {
      throw new ApiError(404, "Prompt not found");
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
      await Prompt.findByIdAndUpdate(prompt._id, {
        sharedBy: prompt.sharedBy,
        shareCount: prompt.shareCount,
      });
    }

    return res.status(200).json(
      new ApiResponse(200, { data: [prompt] }, "Prompts fetched successfully")
    );
  }
);
// Controller for save prompt as draft
const savePromptAsDraftController = asyncHandler(async (req: Request, res: Response) => {
  const userId = (req as any).user?._id;
  if (!userId) throw new ApiError(401, "Unauthorized");

  const {
    title,
    description,
    category,
    promptText,
    resultType,
    resultContent,
    aiModel,
    paymentStatus,
    price,
  } = req.body;

  let tags: string[] = [];
if (Array.isArray(req.body.tags)) {
  tags = req.body.tags;
} else if (typeof req.body.tags === "string") {
  try {
    tags = JSON.parse(req.body.tags);
  } catch {
    tags = [];
  }
}

  if (!title || !category || !promptText || !resultType || !aiModel || !paymentStatus) {
    throw new ApiError(400, "Missing required fields");
  }

  // Process uploaded file if exists
  let finalResultContent = resultContent?.trim() || "";
  if (!finalResultContent && ["image", "video"].includes(resultType)) {
    const file = (req.files as any)?.promptContent?.[0];
    if (!file || !file.path) {
      throw new ApiError(400, `File or URL is required for ${resultType}`);
    }

    const uploaded: UploadApiResponse | null = await uploadOnCloudinary(file.path);
    if (!uploaded?.secure_url) {
      throw new ApiError(500, "Failed to upload file to Cloudinary");
    }
    finalResultContent = uploaded.secure_url;
  }

  const prompt = await Prompt.create({
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

  const newCreatedPrompt = await Prompt.findById(prompt._id).populate("creator", "name email");
  if (!newCreatedPrompt) throw new ApiError(404, "Prompt was not created");

  res
    .status(200)
    .json(new ApiResponse(200, newCreatedPrompt, "Prompt saved as draft"));
});
// Controller for get all draft prompts
const getAllMyDraftPromptsController = asyncHandler(async (req: Request, res: Response) => {
  const userId = (req as any)?.user?._id as mongoose.Types.ObjectId;
  if (!userId) throw new ApiError(401, "Unauthorized");
  const { category, isPaid, searchString } = req.query;

  const query: any = { creator: userId };
  if (category) query.category = category;
  if (isPaid === "true") query.isPaid = true;
  if (typeof searchString === "string" && searchString.trim() !== "") {
    query.$or = [
      { title: { $regex: new RegExp(searchString, "i") } },
      { description: { $regex: new RegExp(searchString, "i") } },
    ];
  }

  const prompts = await Prompt.aggregate([
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
      await populateRepliesRecursively(comment);
    }
  }

  // Attach likes for prompts
  const promptLikes = await Like.find({ prompt: { $ne: null } }).lean();

  const likeMap: Record<string, string[]> = {};
  for (const like of promptLikes) {
    const promptId = String(like.prompt);
    const userId = String(like.user);
    if (!likeMap[promptId]) likeMap[promptId] = [];
    likeMap[promptId].push(userId);
  }

  const promptsWithLikes = prompts.map((prompt) => ({
    ...prompt,
    likes: likeMap[String(prompt._id)] || [],
  }));

  res.status(200).json(
    new ApiResponse(200, promptsWithLikes, "Prompts fetched successfully")
  );
});
// Controller for publish prompt from draft
const publishPromptFromDraftsController = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = (req as any)?.user?._id as mongoose.Types.ObjectId;
    if (!userId) throw new ApiError(401, "Unauthorized");

    const promptId = req.params.id;
    if (!promptId || !mongoose.Types.ObjectId.isValid(promptId)) {
      throw new ApiError(400, "Valid Prompt ID is required");
    }

    const prompt = await Prompt.findById(promptId);
    if (!prompt) throw new ApiError(404, "Prompt not found");

    if (String(prompt.creator) !== String(userId)) {
      throw new ApiError(403, "You are not authorized to publish this prompt");
    }

    if (!prompt.isDraft) {
      throw new ApiError(400, "Prompt is already published");
    }

    await Prompt.updateOne(
      { _id: promptId },
      {
        $set: {
          isDraft: false,
          createdAt: new Date(),
        },
      },
      {
        timestamps: false,
        overwriteImmutable: true,
      } as any
    );

    return res
      .status(200)
      .json(new ApiResponse(200, { data: null }, "Prompt published successfully"));
  }
);
// Controller for toggling prompt bookmark
const savePromptAsBookmarkController = asyncHandler(async (req: Request, res: Response) => {
  const userId = (req as any).user?._id;
  if (!userId) throw new ApiError(401, "Unauthorized");

  const { promptId } = req.body;
  if (!promptId) throw new ApiError(400, "Prompt ID is required");

  const prompt = await Prompt.findById(promptId);
  if (!prompt) throw new ApiError(404, "Prompt not found");

  const user = await User.findById(userId);
  if (!user) throw new ApiError(404, "User not found");

  const isBookmarked = user.bookmarks.includes(promptId);

  let updatedUser;

  if (isBookmarked) {
    // Remove the bookmark
    updatedUser = await User.findOneAndUpdate(
      { _id: userId },
      { $pull: { bookmarks: promptId } },
      { new: true }
    );

    return res.status(200).json(
      new ApiResponse(
        200,
        { removed: true, bookmarks: updatedUser?.bookmarks },
        "Prompt removed from bookmarks"
      )
    );
  } else {
    // Add the bookmark
    updatedUser = await User.findOneAndUpdate(
      { _id: userId },
      { $addToSet: { bookmarks: promptId } },
      { new: true }
    );

    return res.status(200).json(
      new ApiResponse(
        200,
        { added: true, bookmarks: updatedUser?.bookmarks },
        "Prompt saved as bookmark"
      )
    );
  }
});
// Controller for getting all draft prompts created by the logged-in user
const getAllMyBookmarkedPromptsController = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = (req as any)?.user?._id as mongoose.Types.ObjectId;
    if (!userId) throw new ApiError(401, "Unauthorized");
    // Clean up invalid prompt references
  await cleanInvalidPromptReferences(userId);

    const { category, isPaid, searchString } = req.query;

    // Step 1: Get user's bookmarks
    const user = await User.findById(userId).select("bookmarks").lean();
    if (!user || user.bookmarks.length === 0) {
      return res
        .status(200)
        .json(new ApiResponse(200, { data: [] }, "No bookmarked prompts found"));
    }

    // Step 2: Build query
    const query: any = {
      _id: { $in: user.bookmarks },
      isDraft: false,
    };
    if (category) query.category = category;
    if (isPaid === "true") query.paymentStatus = "paid";
    if (typeof searchString === "string" && searchString.trim() !== "") {
      query.$or = [
        { title: { $regex: new RegExp(searchString, "i") } },
        { description: { $regex: new RegExp(searchString, "i") } },
      ];
    }

    // Step 3: Aggregate prompts
    const prompts = await Prompt.aggregate([
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
        await populateRepliesRecursively(comment);
      }
    }

    // Step 5: Attach likes
    const allLikes = await Like.find({ prompt: { $in: user.bookmarks } });
    const likeMap: Record<string, string[]> = {};
    for (const like of allLikes) {
      const pid = String(like.prompt);
      const uid = String(like.user);
      if (!likeMap[pid]) likeMap[pid] = [];
      likeMap[pid].push(uid);
    }

    const promptsWithLikes = prompts.map((prompt) => ({
      ...prompt,
      likes: likeMap[String(prompt._id)] || [],
    }));

    // Step 6: Return response
    res.status(200).json(
      new ApiResponse(200, promptsWithLikes, "Bookmarked prompts fetched successfully")
    );
  }
);
// Controller for remove prompt from bookmarks
const removePromptFromBookmarksController = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = (req as any)?.user?._id as mongoose.Types.ObjectId;
    if (!userId) throw new ApiError(401, "Unauthorized");

    const promptId = req.params.id;
    if (!promptId || !mongoose.Types.ObjectId.isValid(promptId)) {
      throw new ApiError(400, "Valid Prompt ID is required");
    }

    const prompt = await Prompt.findById(promptId).lean();
    if (!prompt) throw new ApiError(404, "Prompt not found");

    const user = await User.findById(userId);
    if (!user) throw new ApiError(404, "User not found");

    const isBookmarked = user.bookmarks.some(
      (id) => id.toString() === promptId.toString()
    );
    if (!isBookmarked) {
      throw new ApiError(404, "Prompt not found in your bookmarks");
    }

    await User.findByIdAndUpdate(userId, {
      $pull: { bookmarks: promptId },
    });

    return res
      .status(200)
      .json(new ApiResponse(200, null, "Prompt removed from bookmarks"));
  }
);
// Controller for get all prompt by user slug 
const getAllPromptsByUserSlugController = asyncHandler(async (req: Request, res: Response) => {
  const userId = (req as any)?.user?._id as mongoose.Types.ObjectId;
  if (!userId) throw new ApiError(401, "Unauthorized");

  const { category, isPaid, searchString } = req.query;
  const { slug } = req.params;

  const user = await User.findOne({ slug });
  if (!user) throw new ApiError(404, "User not found");

  const id = String(user._id);
  if (!id) {
    throw new ApiError(400, "Invalid or missing user ID");
  }

  // Build match query
  const matchQuery: any = {
    creator: new mongoose.Types.ObjectId(id),
    isDraft: false,
  };

  if (category && typeof category === "string") {
    matchQuery.category = category;
  }

  if (isPaid === "true") {
    matchQuery.paymentStatus = "paid";
  } else if (isPaid === "false") {
    matchQuery.paymentStatus = "free";
  }

  if (typeof searchString === "string" && searchString.trim() !== "") {
    matchQuery.$or = [
      { title: { $regex: new RegExp(searchString, "i") } },
      { description: { $regex: new RegExp(searchString, "i") } },
    ];
  }

  const prompts = await Prompt.aggregate([
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
      await populateRepliesRecursively(comment);
    }
  }

  // Attach likes
  const promptLikes = await Like.find({ prompt: { $ne: null } }).lean();
  const likeMap: Record<string, string[]> = {};
  for (const like of promptLikes) {
    const promptId = String(like.prompt);
    const userId = String(like.user);
    if (!likeMap[promptId]) likeMap[promptId] = [];
    likeMap[promptId].push(userId);
  }

  const promptsWithLikes = prompts.map((prompt) => ({
    ...prompt,
    likes: likeMap[String(prompt._id)] || [],
  }));

  res.status(200).json(
    new ApiResponse(200, promptsWithLikes, "User prompts fetched successfully")
  );
});
// Controller for getting all reports against the current user's prompts
const getAllReportsAgainstMyPromptsController = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = (req as any).user?._id;
    if (!userId) throw new ApiError(401, "Unauthorized: User not found");

    const {
      status,
      reason,
      search,
      limit = "50",
    } = req.query as {
      status?: string;
      reason?: string;
      search?: string;
      limit?: string;
    };

    const parsedLimit = parseInt(limit);
    const resultLimit = isNaN(parsedLimit) ? 50 : Math.min(parsedLimit, 100);

    const matchQuery: any = { postAuthor: userId }; // 👈 Match posts owned by current user
    if (status) matchQuery.status = status;
    if (reason) matchQuery.reason = reason;

    const searchConditions: any[] = [];
    if (search?.trim()) {
      const regex = new RegExp(search, "i");
      searchConditions.push(
        { additionalDetails: { $regex: regex } },
        { "postId.title": { $regex: regex } },
        { "postId.promptText": { $regex: regex } },
        { "postId.resultContent": { $regex: regex } }
      );
    }

    const reports = await Report.find({
      ...matchQuery,
      ...(searchConditions.length ? { $or: searchConditions } : {}),
    })
      .populate({
        path: "postId",
        model: "Prompt",
        select:
          "title promptText description resultContent resultType createdAt slug creator",
        populate: {
          path: "creator",
          model: "User",
          select: "username slug avatar",
        },
      })
      .sort({ reportedAt: -1 })
      .limit(resultLimit)
      .lean();

    const formatted = reports.map((report) => {
      const post = report.postId as any;
      const creator = post?.creator || {};

      return {
        _id: String(report._id),
        reason: report.reason,
        additionalDetails: report.additionalDetails,
        status: report.status,
        priority: report.priority,
        actionTaken: report.actionTaken,
        reportedAt: report.reportedAt?.toISOString() || "",
        post: {
          _id: String(post?._id || ""),
          title: post?.title || "",
          description: post?.description || "",
          content: post?.promptText || "",
          resultContent: post?.resultContent || "",
          resultType: post?.resultType || "text",
          createdAt: post?.createdAt?.toISOString() || "",
          slug: post?.slug || "",
          author: {
            _id: String(creator?._id || ""),
            username: creator?.username || "",
            slug: creator?.slug || "",
            avatar: creator?.avatar || "",
          },
        },
        postAuthor: creator?.username || "Unknown",
      };
    });

    return res.status(200).json(
      new ApiResponse(
        200,
        formatted,
        "Reports against your prompts fetched successfully"
      )
    );
  }
);







// Export the controllers
export { 
  getAllPromptsController,
  getTrendingPrompts,
  createPromptController,
  increasePromptViewsController,
  likePromptController,
  createCommentController,
  updateCommentController,
  deleteCommentController,
  replyCommentController,
  likeCommentController,
  getMyPromptsController,
  getSinglePromptController,
  updatePromptController,
  deletePromptController,
  buyPromptController,
  getMyPurchasesController,
  getPromptBySlugController,
  savePromptAsDraftController,
  getAllMyDraftPromptsController,
  publishPromptFromDraftsController,
  savePromptAsBookmarkController,
  getAllMyBookmarkedPromptsController,
  removePromptFromBookmarksController,
  getAllPromptsByUserSlugController,
  getAllReportsAgainstMyPromptsController
};
