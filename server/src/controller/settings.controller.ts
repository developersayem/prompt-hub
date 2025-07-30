import type { Request, Response } from "express";
import { ApiError } from "../utils/ApiError";
import { User } from "../models/users.model";
import asyncHandler from "../utils/asyncHandler";
import { ApiResponse } from "../utils/ApiResponse";
import { NotificationHistory } from "../models/notifications-history.model";

// Array of allowed setting keys
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
// Type for allowed setting keys
type AllowedSettingKey = typeof allowedSettings[number];
// Add display labels for more readable toast messages
const settingLabels: Record<AllowedSettingKey, string> = {
  isEmailNotificationEnabled: "Email Notifications",
  isPushNotificationEnabled: "Push Notifications",
  isMarketingNotificationEnabled: "Marketing Emails",
  loginAlerts: "Login Alerts",
  passwordChangeAlerts: "Password Change Alerts",
  twoFactorAlerts: "2FA Alerts",
  inAppSound: "In-App Sound",
  doNotDisturb: "Do Not Disturb",
  dndStart: "DND Start Time",
  dndEnd: "DND End Time",
};

// Helper function to create a notification message
function createNotificationMessage(key: AllowedSettingKey, value: any) {
  if (typeof value === "boolean") {
    return `${settingLabels[key]} turned ${value ? "ON" : "OFF"}`;
  }
  return `${settingLabels[key]} updated to ${value}`;
}
// Controller for toggling notification settings
const toggleNotificationSetting = asyncHandler(async (req: Request, res: Response) => {
  const requestId = Date.now() + Math.random().toString(36).substr(2, 9);
  const userId = (req as any).user?._id;

  if (!userId) {
    throw new ApiError(401, "Unauthorized.");
  }

  const { setting, value } = req.body;
  console.log(`[${requestId}] Received toggle request: ${setting} = ${value} for user ${userId}`);

  if (!allowedSettings.includes(setting)) {
    throw new ApiError(400, "Invalid notification setting.");
  }

  const user = await User.findById(userId);
  if (!user) {
    throw new ApiError(404, "User not found.");
  }

  const key = setting as AllowedSettingKey;

  if ((key === "dndStart" || key === "dndEnd") && typeof value !== "string") {
    throw new ApiError(400, `${key} must be a string in HH:mm format.`);
  }

  // Update the user setting
  (user[key] as any) = value;
  await user.save();
  console.log(`[${requestId}] Updated user setting ${key} to ${value}`);

  // Create and save notification history entry
  const message = createNotificationMessage(key, value);

    const historyEntry = await NotificationHistory.create({
      userId,
      message,
      date: new Date(),
    });
    console.log(`[${requestId}] Created notification history entry: ${historyEntry._id} - "${message}"`);
  

  console.log(`[${requestId}] Request completed successfully`);
  return res.status(200).json(
    new ApiResponse(200, { [key]: user[key] }, `${settingLabels[key]} updated successfully.`)
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
// Controller to get all notification histories for the authenticated user
const getNotificationHistories = asyncHandler(async (req: Request, res: Response) => {
  const userId = (req as any).user?._id;

  if (!userId) {
    throw new ApiError(401, "Unauthorized.");
  }

  const histories = await NotificationHistory.find({ userId })
    .sort({ date: -1 }) // newest first
    .limit(100); // optional limit

  return res.status(200).json(new ApiResponse(200, histories, "Notification histories fetched"));
});



export {
    toggleNotificationSetting,
    getNotificationSettings,
    getNotificationHistories
}