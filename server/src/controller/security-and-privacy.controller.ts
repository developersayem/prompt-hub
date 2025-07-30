import type { Request, Response } from "express";
import { SecurityEvent } from "../models/security-event.model";
import { ApiResponse } from "../utils/ApiResponse";
import asyncHandler from "../utils/asyncHandler";
import { ApiError } from "../utils/ApiError";
import { ConnectedDevice } from "../models/connected-device.model";


// Controller for getting security events
const getSecurityEvents = asyncHandler(async (req: Request, res: Response) => {
  const userId = (req as any).user?._id;
  if(!userId) throw new ApiError(401, "Unauthorized")
  const events = await SecurityEvent.find({ userId }).sort({ date: -1 }).limit(10);
  res.status(200).json(new ApiResponse(200, events, "Security events fetched"));
});
// Controller for get all connected devices
const getConnectedDevices = asyncHandler(async (req: Request, res: Response) => {
  const userId = (req as any).user?._id;
  if(!userId) throw new ApiError(401, "Unauthorized")
  const devices = await ConnectedDevice.find({ userId }).sort({ lastActive: -1 });
  res.json(new ApiResponse(200, devices));
});

// Controller for logout specific device
const logoutConnectedDevice = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  if(!id) throw new ApiError(400, "Device id is required");
  const userId = (req as any).user?._id;
  if (!userId) throw new ApiError(401, "Unauthorized");

  const device = await ConnectedDevice.findOne({ _id: id, userId });
  if (!device) throw new ApiError(404, "Device not found");

  await device.deleteOne();

  res.json(new ApiResponse(200, {}, "Logged out from device"));
});



export{
    getSecurityEvents,
    getConnectedDevices,
    logoutConnectedDevice
}