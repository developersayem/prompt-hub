import { ApiError } from "../utils/ApiError";
import { ApiResponse } from "../utils/ApiResponse";
import asyncHandler from "../utils/asyncHandler";
import type { Request, Response } from "express";
import type { UploadApiResponse } from "cloudinary";
import { uploadOnCloudinary } from "../utils/cloudinary";
import { Prompt } from "../models/prompts.model";
import { User } from "../models/users.model";
import mongoose, { Schema, Types } from "mongoose";
import { Like } from "../models/like.model"; // adjust the path
import { Comment } from "../models/comments.model";
import { populateRepliesRecursively } from "../utils/populateRepliesRecursively";
import { PurchaseHistory } from "../models/purchaseHistory.model";

// Controller for show all prompts
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

  const prompts = await Prompt.find(query)
    .sort({ createdAt: -1 })
    .populate("creator", "-password -refreshToken")
    .populate({
      path: "comments",
      match: { parentComment: null },
      select: "text createdAt user replies likes",
    })
    .lean();

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

// Controller to handle prompt creation
const createPromptController = asyncHandler(async (req: Request, res: Response) => {
  // Destructure fields from the request body
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
    paymentStatus, // ⬅ updated from isPaid
  } = req.body;

  // Get the user ID from the authenticated request
  const userId = (req as any).user?._id;
  if (!userId) throw new ApiError(401, "Unauthorized");

  // Validate required fields
  if (
    !title ||
    !category ||
    !promptText ||
    !resultType ||
    !aiModel ||
    typeof paymentStatus === "undefined"
  ) {
    throw new ApiError(400, "Missing required fields");
  }

  // Validate paymentStatus value
  if (!["free", "paid"].includes(paymentStatus)) {
    throw new ApiError(400, "Invalid paymentStatus value");
  }

  // Normalize tags
  const normalizedTags = Array.isArray(tags)
    ? tags.flatMap((tag: string) => tag.split(",").map((t) => t.trim()))
    : [];

  // Handle resultContent
  let finalResultContent = "";

  if (resultType === "text") {
    if (!rawResultContent) {
      throw new ApiError(400, "Text result content is required");
    }
    finalResultContent = rawResultContent;
  } else if (resultType === "image" || resultType === "video") {
    const file = (req.files as any)?.promptContent?.[0];
    if (!file?.path) {
      throw new ApiError(400, "Media file is required for image/video prompt");
    }

    try {
      const uploaded: UploadApiResponse | null = await uploadOnCloudinary(file.path);
      if (!uploaded) {
        throw new ApiError(500, "Failed to upload media to Cloudinary");
      }
      finalResultContent = uploaded.secure_url;
    } catch (error) {
      console.error("Cloudinary upload failed:", error);
      throw new ApiError(500, "Failed to upload media");
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
    isPaid: paymentStatus === "paid",
    creator: userId,
    likes: [],
    comments: [],
    buyers: [],
  });

  if (!newPrompt) {
    throw new ApiError(500, "Failed to create prompt");
  }

  // Update user with new prompt
  const user = await User.findById(userId);
  if (!user) {
    throw new ApiError(404, "User not found");
  }
  user.prompts.push(newPrompt._id as Schema.Types.ObjectId);
  await user.save();

  res
    .status(201)
    .json(new ApiResponse(201, { data: newPrompt }, "Prompt created successfully"));
});

// Controller to handle like/unlike
const likePromptController = asyncHandler(async (req: Request, res: Response) => {
  const userId = (req as any).user?._id;
  if (!userId) throw new ApiError(401, "Unauthorized");

  const { promptId } = req.body;
  if (!promptId) throw new ApiError(400, "Prompt ID is required");

  const prompt = await Prompt.findById(promptId);
  if (!prompt) throw new ApiError(404, "Prompt not found");

  // Check if the user already liked the prompt
  const existingLike = await Like.findOne({ user: userId, prompt: promptId });

  if (existingLike) {
    // Unlike: remove the like document and update prompt.likes array
    await Like.deleteOne({ _id: (existingLike as any)._id });

    prompt.likes = prompt.likes.filter(
      (likeId) => likeId.toString() !== ((existingLike as any)._id as Types.ObjectId).toString()
    );
    await prompt.save();

    return res
      .status(200)
      .json(new ApiResponse(200, { data: null }, "Disliked successfully"));
  }

  // Like: create new like and update prompt.likes array
  const newLike = await Like.create({ user: userId, prompt: promptId });

  prompt.likes.push(newLike._id as Types.ObjectId);
  await prompt.save();

  return res
    .status(200)
    .json(new ApiResponse(200, { data: newLike }, "Liked successfully"));
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
  const userId = (req as any).user?._id;
  const { commentId } = req.params;

  const comment = await Comment.findById(commentId);
  if (!comment) throw new ApiError(404, "Comment not found");

  if (String(comment.user) !== String(userId)) {
    throw new ApiError(403, "You are not authorized to delete this comment");
  }

  // If it's a reply, remove from parent.replies
  if (comment.parentComment) {
    await Comment.findByIdAndUpdate(comment.parentComment, {
      $pull: { replies: comment._id }
    });
  } else {
    // If it's a top-level comment, remove from prompt.comments
    await Prompt.findByIdAndUpdate(comment.prompt, {
      $pull: { comments: comment._id }
    });
  }

  await comment.deleteOne();

  res.status(200).json(
    new ApiResponse(200, {}, "Comment deleted successfully")
  );
});

// Controller to add comment or reply
const replyCommentController = asyncHandler(async (req: Request, res: Response) => {
  const userId = (req as any).user?._id;
  const { promptId, text, parentComment } = req.body;
  console.log(userId, promptId, text, parentComment)

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

  const prompts = await Prompt.find(query)
    .sort({ createdAt: -1 })
    .populate("creator", "-password -refreshToken")
    .populate({
      path: "comments",
      match: { parentComment: null },
      select: "text createdAt user replies likes",
    })
    .lean();

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
    console.log("promptId",promptId)
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

  await prompt.deleteOne();

  res.status(200).json(new ApiResponse(200, {}, "Prompt deleted successfully"));
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
    { updatedCredits: buyer.credits }, // ✅ send updated buyer credits
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
  getMyPurchasesController
};
