import type { Request, Response } from "express";
import { Category } from "../models/category.model";
import asyncHandler from "../utils/asyncHandler";
import { ApiError } from "../utils/ApiError";
import { ApiResponse } from "../utils/ApiResponse";
import { User } from "../models/users.model";


// Controller for get all categories
const getAllCategoriesController = asyncHandler(async (req: Request, res: Response) => {
    const userId = (req as any).user?._id;
    if (!userId) throw new ApiError(401, "Unauthorized");
  try {
    const categoriesWithUsage = await Category.aggregate([
      {
        $lookup: {
          from: "prompts",
          localField: "name",
          foreignField: "category",
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
      new ApiResponse(200, categoriesWithUsage, "Categories fetched successfully")
    );
  } catch (error) {
    console.error("Error fetching categories:", error);
    throw new ApiError(500, "Internal Server Error");
  }
});
// Controller for create category
const createCategoryController = asyncHandler(async (req: Request, res: Response) => {
  const userId = (req as any).user?._id;
  if (!userId) throw new ApiError(401, "Unauthorized");

  const { name, isUserCreated = true } = req.body;

  if (!name || name.trim() === "") {
    throw new ApiError(400, "Category name is required");
  }

  const normalizedName = name.trim().toLowerCase();

  // Check for existing category with same name
  const existing = await Category.findOne({ name: normalizedName });
  if (existing) {
    throw new ApiError(409, "Category already exists");
  }

  const newCategory = await Category.create({
    name: name.trim(),
    isUserCreated,
    creator: userId,
  });

  // also update user categories
    const user = await User.findByIdAndUpdate(
      userId,
      { $push: { categories: newCategory._id } },
      { new: true, useFindAndModify: false }
    );
    if (!user) throw new ApiError(404, "User not found");

  return res.status(201).json(
    new ApiResponse(201, newCategory, "Category created successfully")
  );
});
// Controller for delete category
const deleteCategoryController = asyncHandler(async (req: Request, res: Response) => {
  const userId = (req as any).user?._id;
  if (!userId) throw new ApiError(401, "Unauthorized");

  const categoryId = req.params.id;

  if (!categoryId) throw new ApiError(400, "Category ID is required");

  const category = await Category.findById(categoryId);
  if (!category) throw new ApiError(404, "Category not found");

  if (String(category.creator) !== String(userId)) {
    throw new ApiError(403, "You are not authorized to delete this category");
  }

  await Category.findByIdAndDelete(categoryId);

  // also update user categories
  const user = await User.findByIdAndUpdate(
    userId,
    { $pull: { categories: categoryId } },
    { new: true, useFindAndModify: false }
  );
  if (!user) throw new ApiError(404, "User not found");

  return res.status(200).json(
    new ApiResponse(200, null, "Category deleted successfully")
  );
});

export{
    createCategoryController,
    getAllCategoriesController,
    deleteCategoryController
}