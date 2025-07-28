import type { Request, Response } from "express";
import asyncHandler from "../utils/asyncHandler";
import { ApiError } from "../utils/ApiError";
import { ApiResponse } from "../utils/ApiResponse";
import { AiModel } from "../models/al-model.model";
import { User } from "../models/users.model";


// Controller for get all ai models
const getAllAiModelsController = asyncHandler(async (req: Request, res: Response) => {
    const userId = (req as any).user?._id;
    if (!userId) throw new ApiError(401, "Unauthorized");
  try {
    const AiModelWithUsage = await AiModel.aggregate([
      {
        $lookup: {
          from: "prompts",
          localField: "name",
          foreignField: "aimodel",
          as: "usedInPrompts",
        },
      },
      {
        $addFields: {
          usageCount: { $size: "$usedInPrompts" },
        },
      },
      {
        $sort: {
          usageCount: -1, // Most used first
          createdAt: -1,  // Tie-breaker: latest created first
        },
      },
      {
        $project: {
          usedInPrompts: 0, // exclude heavy joined data
        },
      },
    ]);

    return res.status(200).json(
      new ApiResponse(200, AiModelWithUsage, "Ai Models fetched successfully")
    );
  } catch (error) {
    console.error("Error fetching categories:", error);
    throw new ApiError(500, "Internal Server Error");
  }
});
// Controller for create ai model
const createAiModelController = asyncHandler(async (req: Request, res: Response) => {
  const userId = (req as any).user?._id;
  if (!userId) throw new ApiError(401, "Unauthorized");

  const { name, isUserCreated = true } = req.body;

  if (!name || name.trim() === "") {
    throw new ApiError(400, "ai model name is required");
  }

  const normalizedName = name.trim().toLowerCase();

  // Check for existing ai model with same name
  const existing = await AiModel.findOne({ name: normalizedName });
  if (existing) {
    throw new ApiError(409, "ai model already exists");
  }
  // Create ai model
  const newAiModel = await AiModel.create({
    name: name.trim().toLowerCase(),
    isUserCreated,
    creator: userId,
  });

  // also update user ai models
  const user = await User.findByIdAndUpdate(
    userId,
    { $push: { aiModels: newAiModel._id } },
    { new: true, useFindAndModify: false }
  );
  if (!user) throw new ApiError(404, "User not found");

  return res.status(201).json(
    new ApiResponse(201, newAiModel, "Ai model created successfully")
  );
});
// Controller for delete category
const deleteAiModelController = asyncHandler(async (req: Request, res: Response) => {
  const userId = (req as any).user?._id;
  if (!userId) throw new ApiError(401, "Unauthorized");

  const aiModelId = req.params.id;

  if (!aiModelId) throw new ApiError(400, "Ai model ID is required");

  const category = await AiModel.findById(aiModelId);
  if (!category) throw new ApiError(404, "ai model not found");

  if (String(category.creator) !== String(userId)) {
    throw new ApiError(403, "You are not authorized to delete this ai model");
  }
  
  await AiModel.findByIdAndDelete(aiModelId);

  // also update user ai models
  const user = await User.findByIdAndUpdate(
    userId,
    { $pull: { aiModels: aiModelId } },
    { new: true, useFindAndModify: false }
  );
  if (!user) throw new ApiError(404, "User not found");

  return res.status(200).json(
    new ApiResponse(200, null, "Ai model deleted successfully")
  );
});

export{
    createAiModelController,
    getAllAiModelsController,
    deleteAiModelController
}