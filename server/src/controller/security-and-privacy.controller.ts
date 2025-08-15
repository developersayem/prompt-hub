import type { Request, Response } from "express";
import { SecurityEvent } from "../models/security-event.model";
import { ApiResponse } from "../utils/ApiResponse";
import asyncHandler from "../utils/asyncHandler";
import { ApiError } from "../utils/ApiError";
import { ConnectedDevice } from "../models/connected-device.model";
import { forceLogoutDevice, logoutAllOtherDevices as logoutAllDevicesUtil } from "../utils/trackConnectedDevice";
import { getDeviceType } from "../helper/getDeviceType";
import { getTrustLevel } from "../helper/getTrustLevel";

// Controller for getting security events
const getSecurityEvents = asyncHandler(async (req: Request, res: Response) => {
  const userId = (req as any).user?._id;
  if (!userId) throw new ApiError(401, "Unauthorized");

  const { page = 1, limit = 20 } = req.query;
  const skip = (parseInt(page as string) - 1) * parseInt(limit as string);

  const [events, total] = await Promise.all([
    SecurityEvent.find({ userId })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit as string)),
    SecurityEvent.countDocuments({ userId })
  ]);

  res.status(200).json(
    new ApiResponse(200, {
      events,
      pagination: {
        page: parseInt(page as string),
        limit: parseInt(limit as string),
        total,
        pages: Math.ceil(total / parseInt(limit as string))
      }
    }, "Security events fetched successfully")
  );
});

// Controller for get all connected devices
const getConnectedDevices = asyncHandler(async (req: Request, res: Response) => {
  const userId = (req as any).user?._id;
  if (!userId) throw new ApiError(401, "Unauthorized");

  const devices = await ConnectedDevice.find({ 
    userId, 
    isActive: true 
  }).sort({ lastActive: -1 });

  // Add additional info for frontend
  const devicesWithInfo = devices.map(device => ({
    ...device.toObject(),
    isCurrentDevice: device.isCurrent,
    lastActiveFormatted: device.lastActive.toISOString(),
    deviceType: getDeviceType(device.os, device.browser),
    trustLevel: getTrustLevel(device.loginCount, (device as any).createdAt)
  }));

  res.status(200).json(
    new ApiResponse(200, {
      devices: devicesWithInfo,
      totalDevices: devices.length,
      maxDevices: 3
    }, "Connected devices fetched successfully")
  );
});

// Controller for logout specific device
const logoutConnectedDevice = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  if (!id) throw new ApiError(400, "Device ID is required");
  
  const userId = (req as any).user?._id;
  if (!userId) throw new ApiError(401, "Unauthorized");

  try {
    const device = await forceLogoutDevice(userId, id);
    
    res.status(200).json(
      new ApiResponse(200, { 
        deviceName: device.deviceName,
        loggedOutAt: new Date().toISOString()
      }, "Device logged out successfully")
    );
  } catch (error) {
    if (error instanceof Error && error.message === "Device not found") {
      throw new ApiError(404, "Device not found or already logged out");
    }
    throw new ApiError(500, "Failed to logout device");
  }
});

// Controller for logout all other devices
const logoutAllOtherDevices = asyncHandler(async (req: Request, res: Response) => {
  const userId = (req as any).user?._id;
  if (!userId) throw new ApiError(401, "Unauthorized");

  // Get current device ID from request (if available)
  const currentDeviceId = req.headers['x-device-id'] as string;

  try {
    const loggedOutCount = await logoutAllDevicesUtil(userId, currentDeviceId);
    
    res.status(200).json(
      new ApiResponse(200, { 
        loggedOutDevices: loggedOutCount,
        message: `Successfully logged out from ${loggedOutCount} other devices`
      }, "All other devices logged out successfully")
    );
  } catch (error) {
    throw new ApiError(500, "Failed to logout from other devices");
  }
});

// Controller for getting device statistics
const getDeviceStats = asyncHandler(async (req: Request, res: Response) => {
  const userId = (req as any).user?._id;
  if (!userId) throw new ApiError(401, "Unauthorized");

  const [activeDevices, totalDevices, recentLogins] = await Promise.all([
    ConnectedDevice.countDocuments({ userId, isActive: true }),
    ConnectedDevice.countDocuments({ userId }),
    ConnectedDevice.find({ userId, isActive: true })
      .sort({ lastActive: -1 })
      .limit(5)
      .select('deviceName lastActive location')
  ]);

  const stats = {
    activeDevices,
    totalDevices,
    maxDevices: 3,
    availableSlots: Math.max(0, 3 - activeDevices),
    recentLogins: recentLogins.map(device => ({
      deviceName: device.deviceName,
      lastActive: device.lastActive,
      location: device.location
    }))
  };

  res.status(200).json(
    new ApiResponse(200, stats, "Device statistics fetched successfully")
  );
});




export {
  getSecurityEvents,
  getConnectedDevices,
  logoutConnectedDevice,
  logoutAllOtherDevices,
  getDeviceStats
};