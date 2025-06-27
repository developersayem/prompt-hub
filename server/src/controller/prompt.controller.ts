import { ApiError } from "../utils/ApiError";
import { ApiResponse } from "../utils/ApiResponse";
import asyncHandler from "../utils/asyncHandler";
import type { Request, Response } from "express";
import type { UploadApiResponse } from "cloudinary";
import { uploadOnCloudinary } from "../utils/cloudinary";
import { Prompt } from "../models/prompts.model";
import { User } from "../models/users.model";
import mongoose from "mongoose";

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

export { createPromptController };
