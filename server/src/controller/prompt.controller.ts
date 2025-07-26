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
// import { trackPromptView } from "../utils/trackPromptView";
import { getAllNestedCommentIds } from "../helper/getAllNestedCommentIds";

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
        pipeline: [{ $project: { password: 0, refreshToken: 0 } }],
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
    new ApiResponse(200, { data: promptsWithLikes }, "Prompts fetched successfully")
  );
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

  // Add prompt to user's profile
  const user = await User.findById(userId);
  if (!user) throw new ApiError(404, "User not found");

  user.prompts.push(newPrompt._id as Schema.Types.ObjectId);
  await user.save();

  res
    .status(201)
    .json(new ApiResponse(201, { data: newPrompt }, "Prompt created successfully"));
});
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
      new ApiResponse(200, { data: newLike }, "Liked successfully")
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
  const userId = (req as any).user?._id?.toString();
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
    new ApiResponse(200, { data: promptsWithLikes }, "Your prompts fetched successfully")
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
  const {
    title,
    description,
    category,
    aiModel,
    promptText,
    resultType,
    resultContent,
    paymentStatus,
    price,
    tags,
  } = req.body;
   if (!req.body) {
    throw new ApiError(400, "Request body is missing. Did you forget to use multer middleware?");
  }

  if (!promptId) throw new ApiError(400, "Prompt ID is required");

  const prompt = await Prompt.findById(promptId);
  if (!prompt) throw new ApiError(404, "Prompt not found");

  if (String(prompt.creator) !== String(userId)) {
    throw new ApiError(403, "You are not authorized to update this prompt");
  }

  // Update fields
  if (title) prompt.title = title;
  if (description) prompt.description = description;
  if (category) prompt.category = category;
  if (aiModel) prompt.aiModel = aiModel;
  if (promptText) prompt.promptText = promptText;
  if (resultType) prompt.resultType = resultType;
  if (resultContent) prompt.resultContent = resultContent;

  if (tags) {
    prompt.tags = Array.isArray(tags) ? tags : [tags]; // Handles both single and multi tags
  }

  if (paymentStatus === "free" || paymentStatus === "paid") {
    prompt.paymentStatus = paymentStatus;
    prompt.price = paymentStatus === "paid" ? price : undefined;
  }

  // Handle file upload if exists (Multer middleware must be used)
  if (req.file) {
    prompt.resultContent = req.file.path; // or filename, URL, etc.
  }

  const updatedPrompt = await prompt.save();

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

  if (buyer.credits < price) {
    throw new ApiError(400, "Insufficient credits");
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
  await PurchaseHistory.create({
    buyer: buyer._id,
    prompt: prompt._id,
    seller: creator._id,
    amount: price,
    paymentMethod: "credits",
  });
  // updated buyer purchasedPrompts
  buyer.purchasedPrompts.push(prompt._id as Schema.Types.ObjectId);
  await buyer.save();

  return res.status(200).json(
  new ApiResponse(
    200,
    { updatedCredits: buyer.credits }, //   send updated buyer credits
    "Prompt purchased successfully"
  )
);

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

  res
    .status(200)
    .json(new ApiResponse(200, newCreatedPrompt, "Prompt saved as draft"));
});
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
// Controller for get all draft prompts
const getAllDraftPromptsController = asyncHandler(async (req: Request, res: Response) => {
  console.log("getAllDraftPromptsController");
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
    new ApiResponse(200, { data: promptsWithLikes }, "Prompts fetched successfully")
  );
});



// Export the controllers
export { 
  getAllPromptsController,
  createPromptController,
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
  savePromptAsBookmarkController,
  getAllDraftPromptsController
};
