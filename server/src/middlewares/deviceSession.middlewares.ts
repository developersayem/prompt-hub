import { Request, Response, NextFunction } from "express";
import { ConnectedDevice } from "../models/connected-device.model";
import { ApiError } from "../utils/ApiError";

/**
 * Middleware to check if the current device session is still valid
 */
export const checkDeviceSession = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).user?._id;
    const sessionToken = req.headers['x-session-token'] as string;
    const deviceId = req.headers['x-device-id'] as string;

    if (!userId) {
      return next(); // Let auth middleware handle this
    }

    // If no session token provided, skip check (for backward compatibility)
    if (!sessionToken && !deviceId) {
      return next();
    }

    let device;
    
    if (sessionToken) {
      // Check by session token (preferred method)
      device = await ConnectedDevice.findOne({
        userId,
        sessionToken,
        isActive: true
      });
    } else if (deviceId) {
      // Fallback to device ID
      device = await ConnectedDevice.findOne({
        _id: deviceId,
        userId,
        isActive: true
      });
    }

    if (!device) {
      throw new ApiError(401, "Device session expired. Please login again.");
    }

    // Update last active time
    device.lastActive = new Date();
    await device.save();

    // Add device info to request
    (req as any).currentDevice = device;

    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Middleware to enforce device limit during login
 */
export const enforceDeviceLimit = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).user?._id;
    
    if (!userId) {
      return next();
    }

    const activeDeviceCount = await ConnectedDevice.countDocuments({
      userId,
      isActive: true
    });

    if (activeDeviceCount >= 3) {
      // This will be handled by trackConnectedDevice function
      // Just log for monitoring
      console.log(`User ${userId} has reached device limit (${activeDeviceCount} devices)`);
    }

    next();
  } catch (error) {
    console.error("Error in enforceDeviceLimit middleware:", error);
    next(); // Don't block the request if this fails
  }
};

/**
 * Middleware to add device info to response headers
 */
export const addDeviceHeaders = (req: Request, res: Response, next: NextFunction) => {
  const device = (req as any).currentDevice;
  
  if (device) {
    res.setHeader('X-Device-ID', device._id.toString());
    res.setHeader('X-Device-Name', device.deviceName);
    res.setHeader('X-Last-Active', device.lastActive.toISOString());
  }

  next();
};