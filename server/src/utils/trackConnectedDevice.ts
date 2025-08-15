import { Request } from "express";
import { ConnectedDevice } from "../models/connected-device.model";
import { getGeoLocationFromIP } from "./ipGeolocation";
import { SecurityEvent } from "../models/security-event.model";
import crypto from "crypto";

const MAX_DEVICES_PER_USER = 3;

/**
 * Generate a unique device fingerprint
 */
export const generateDeviceFingerprint = (deviceInfo: any): string => {
  const { ip, userAgent, os, browser, deviceName } = deviceInfo;
  const fingerprint = `${ip}|${userAgent}|${os}|${browser}|${deviceName}`;
  return crypto.createHash('sha256').update(fingerprint).digest('hex');
};

/**
 * Track and manage connected devices for a user
 */
export const trackConnectedDevice = async (userId: string, req: Request) => {
  const { ip, userAgent, os, browser, deviceName } = (req as any).deviceInfo;
  const location = await getGeoLocationFromIP(ip);
  
  // Generate unique device fingerprint
  const deviceFingerprint = generateDeviceFingerprint({ ip, userAgent, os, browser, deviceName });
  
  // Generate session token for this login
  const sessionToken = crypto.randomBytes(32).toString('hex');

  try {
    // Try to find if this device already exists
    const existingDevice = await ConnectedDevice.findOne({
      userId,
      deviceFingerprint
    });

    if (existingDevice) {
      // ✅ Device exists — update info and mark as current
      existingDevice.userAgent = userAgent;
      existingDevice.location = location;
      existingDevice.lastActive = new Date();
      existingDevice.isCurrent = true;
      existingDevice.isActive = true;
      existingDevice.sessionToken = sessionToken;
      existingDevice.loginCount += 1;
      await existingDevice.save();

      // Mark all other devices as not current
      await ConnectedDevice.updateMany(
        { userId, _id: { $ne: existingDevice._id } },
        { $set: { isCurrent: false } }
      );

      // Log returning device login
      await SecurityEvent.create({
        userId,
        type: "DEVICE_LOGIN",
        action: "LOGIN",
        message: `Logged in from known device: ${deviceName}`,
        ip,
        userAgent,
        location,
      });

      return existingDevice;
    }

    // 📦 Enforce device limit — max 3 active devices
    const activeDevices = await ConnectedDevice.find({ 
      userId, 
      isActive: true 
    }).sort({ lastActive: 1 }); // Sort by oldest first

    if (activeDevices.length >= MAX_DEVICES_PER_USER) {
      // Remove the oldest device(s) to make room
      const devicesToRemove = activeDevices.slice(0, activeDevices.length - MAX_DEVICES_PER_USER + 1);
      
      for (const device of devicesToRemove) {
        await ConnectedDevice.findByIdAndUpdate(device._id, {
          $set: {
            isActive: false,
            isCurrent: false
          },
          $unset: { sessionToken: 1 }
        });

        // Log forced logout
        await SecurityEvent.create({
          userId,
          type: "DEVICE_FORCE_LOGOUT",
          action: "LOGOUT",
          message: `Device automatically logged out due to limit: ${device.deviceName}`,
          ip: device.ip,
          userAgent: device.userAgent,
          location: device.location,
        });
      }
    }

    // ❗ Mark all other devices as not current
    await ConnectedDevice.updateMany(
      { userId },
      { $set: { isCurrent: false } }
    );

    // 💾 Create new device record
    const newDevice = await ConnectedDevice.create({
      userId,
      ip,
      userAgent,
      os,
      browser,
      deviceName,
      location,
      isCurrent: true,
      isActive: true,
      lastActive: new Date(),
      sessionToken,
      deviceFingerprint,
      loginCount: 1
    });

    // 🛡️ Security log for new device
    await SecurityEvent.create({
      userId,
      type: "NEW_DEVICE_LOGIN",
      action: "LOGIN",
      message: `Logged in from a new device: ${deviceName}`,
      ip,
      userAgent,
      location,
    });

    return newDevice;

  } catch (error) {
    console.error("Error tracking connected device:", error);
    throw error;
  }
};

/**
 * Force logout a specific device
 */
export const forceLogoutDevice = async (userId: string, deviceId: string) => {
  try {
    const device = await ConnectedDevice.findOne({ 
      _id: deviceId, 
      userId 
    });

    if (!device) {
      throw new Error("Device not found");
    }

    // Mark device as inactive and remove session
    device.isActive = false;
    device.isCurrent = false;
    device.sessionToken = undefined;
    await device.save();

    // Log the forced logout
    await SecurityEvent.create({
      userId,
      type: "DEVICE_LOGOUT",
      action: "LOGOUT",
      message: `Manually logged out device: ${device.deviceName}`,
      ip: device.ip,
      userAgent: device.userAgent,
      location: device.location,
    });

    return device;
  } catch (error) {
    console.error("Error forcing device logout:", error);
    throw error;
  }
};

/**
 * Logout all other devices except current
 */
export const logoutAllOtherDevices = async (userId: string, currentDeviceId?: string) => {
  try {
    const filter: any = { userId, isActive: true };
    if (currentDeviceId) {
      filter._id = { $ne: currentDeviceId };
    }

    const devicesToLogout = await ConnectedDevice.find(filter);

    // Update all other devices
    await ConnectedDevice.updateMany(filter, {
      $set: {
        isActive: false,
        isCurrent: false
      },
      $unset: { sessionToken: 1 }
    });

    // Log security events for each device
    for (const device of devicesToLogout) {
      await SecurityEvent.create({
        userId,
        type: "DEVICE_LOGOUT_ALL",
        action: "LOGOUT",
        message: `Logged out from device via "Logout All": ${device.deviceName}`,
        ip: device.ip,
        userAgent: device.userAgent,
        location: device.location,
      });
    }

    return devicesToLogout.length;
  } catch (error) {
    console.error("Error logging out all devices:", error);
    throw error;
  }
};

/**
 * Check if a device session is still valid
 */
export const isDeviceSessionValid = async (userId: string, sessionToken: string): Promise<boolean> => {
  try {
    const device = await ConnectedDevice.findOne({
      userId,
      sessionToken,
      isActive: true
    });

    if (!device) {
      return false;
    }

    // Update last active time
    device.lastActive = new Date();
    await device.save();

    return true;
  } catch (error) {
    console.error("Error checking device session:", error);
    return false;
  }
};

/**
 * Clean up inactive devices (older than 30 days)
 */
export const cleanupInactiveDevices = async () => {
  try {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const result = await ConnectedDevice.deleteMany({
      isActive: false,
      lastActive: { $lt: thirtyDaysAgo }
    });

    console.log(`Cleaned up ${result.deletedCount} inactive devices`);
    return result.deletedCount;
  } catch (error) {
    console.error("Error cleaning up inactive devices:", error);
    throw error;
  }
};