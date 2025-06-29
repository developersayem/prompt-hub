import { ApiError } from "../utils/ApiError";
import { ApiResponse } from "../utils/ApiResponse";
import asyncHandler from "../utils/asyncHandler";
import type { Request, Response } from "express";
import type { UploadApiResponse } from "cloudinary";
import { uploadOnCloudinary } from "../utils/cloudinary";
import { Prompt } from "../models/prompts.model";
import { User } from "../models/users.model";
import mongoose, { Types } from "mongoose";
import { Like } from "../models/like.model"; // adjust the path
import { Comment } from "../models/comments.model";
import { populateRepliesRecursively } from "../utils/populateRepliesRecursively";

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
    isPaid,
  } = req.body;

  // Get the user ID from the authenticated request
  const userId = (req as any).user?._id;
  if (!userId) throw new ApiError(401, "Unauthorized"); // If user is not authenticated

  // Validate required fields (some are optional like description and price)
  if (!title || !category || !promptText || !resultType || !aiModel || typeof isPaid === "undefined") {
    throw new ApiError(400, "Missing required fields");
  }

  // Normalize tags: if tags come as comma-separated strings, split and trim them
  const normalizedTags =
    Array.isArray(tags)
      ? tags.flatMap((tag: string) => tag.split(",").map((t) => t.trim()))
      : [];

  // Final content to be saved in DB (URL for media, or text)
  let finalResultContent = "";

  // Handle resultType === "text"
  if (resultType === "text") {
    if (!rawResultContent) {
      throw new ApiError(400, "Text result content is required");
    }
    finalResultContent = rawResultContent;
  }

  // Handle resultType === "image" or "video"
  else if (resultType === "image" || resultType === "video") {
    // File should come from field name: "promptContent"
    const file = (req.files as any)?.promptContent?.[0];

    if (!file?.path) {
      throw new ApiError(400, "Media file is required for image/video prompt");
    }

    // Upload to Cloudinary
    try {
    let uploaded: UploadApiResponse | null = await uploadOnCloudinary(file.path);
    if (!uploaded) {
    throw new ApiError(500, "Failed to upload media to Cloudinary");
}
      finalResultContent = uploaded.secure_url; // Save the media URL
    } catch (error) {
      console.error("Cloudinary upload failed:", error);
      throw new ApiError(500, "Failed to upload media");
    }
  }

  // Catch unknown result types
  else {
    throw new ApiError(400, "Invalid result type");
  }

  // Create the new Prompt document in the database
  const newPrompt = await Prompt.create({
    title,
    description,
    tags: normalizedTags,
    category,
    promptText,
    resultType,
    resultContent: finalResultContent,
    aiModel,
    price: isPaid ? Number(price) || 0 : 0, // If not paid, price is 0
    isPaid: Boolean(isPaid),
    creator: userId,
    likes: [], // Empty by default
    comments: [], // Empty by default
    buyers: [], // Empty by default
  });

  if (!newPrompt) {
    throw new ApiError(500, "Failed to create prompt");
  }

  //now that prompt is created, add it to the user's prompts
  const user = await User.findById(userId);
  if (!user) {
    throw new ApiError(404, "User not found");
  }
  user.prompts.push(newPrompt._id as mongoose.Schema.Types.ObjectId);
  await user.save();

  // Send response to client
  res.status(201).json(
    new ApiResponse(
      201,
      { data: newPrompt },
      "Prompt created successfully"
    )
  );
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





export { 
  getAllPromptsController,
  createPromptController,
  likePromptController,
  createCommentController,
  updateCommentController,
  deleteCommentController,
  replyCommentController,
  likeCommentController
};
