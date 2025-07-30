import type { Request, Response } from "express";
import { ApiError } from "../utils/ApiError";
import { User } from "../models/users.model";
import asyncHandler from "../utils/asyncHandler";
import { ApiResponse } from "../utils/ApiResponse";

// Define the allowed keys manually
const allowedSettings = [
  "isEmailNotificationEnabled",
  "isPushNotificationEnabled",
  "isMarketingNotificationEnabled",
  "loginAlerts",
  "passwordChangeAlerts",
  "twoFactorAlerts",
  "inAppSound",
  "doNotDisturb",
  "dndStart",
  "dndEnd",
] as const;

type AllowedSettingKey = typeof allowedSettings[number]; // literal union of allowed keys

const toggleNotificationSetting = asyncHandler(async (req: Request, res: Response) => {
  const userId = (req as any).user?._id;

  if (!userId) {
    throw new ApiError(401, "Unauthorized.");
  }
  const { setting, value } = req.body;

  // Validate setting
  if (!allowedSettings.includes(setting)) {
    throw new ApiError(400, "Invalid notification setting.");
  }

  const user = await User.findById(userId);
  if (!user) {
    throw new ApiError(404, "User not found.");
  }

  // Now we can safely assert the type
  const key = setting as AllowedSettingKey;

  // Validate time values
  if ((key === "dndStart" || key === "dndEnd") && typeof value !== "string") {
    throw new ApiError(400, `${key} must be a string in HH:mm format.`);
  }

  // Assign value with type safety
  (user[key] as any) = value;

  await user.save();

  return res.status(200).json(
    new ApiResponse(200, { [key]: user[key] }, `${key} updated successfully.`)
  );
});
// Routes for getting all settings 
const getNotificationSettings = asyncHandler(async (req: Request, res: Response) => {
  const userId = (req as any).user?._id;

  if (!userId) {
    throw new ApiError(401, "Unauthorized.");
  }

  const user = await User.findById(userId).select(
    "isEmailNotificationEnabled isPushNotificationEnabled isMarketingNotificationEnabled loginAlerts passwordChangeAlerts twoFactorAlerts inAppSound doNotDisturb dndStart dndEnd"
  );

  if (!user) {
    throw new ApiError(404, "User not found.");
  }

  return res.status(200).json(new ApiResponse(200, user, "Notification settings fetched"));
});



export {
    toggleNotificationSetting,
    getNotificationSettings
}