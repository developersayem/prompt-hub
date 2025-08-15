import { Types } from "mongoose";
import { ConnectedDevice, IConnectedDevice } from "../models/connected-device.model";
import { SecurityEvent } from "../models/security-event.model";
import { ApiError } from "../utils/ApiError";

export class DeviceManagementService {
  private static readonly MAX_DEVICES = 3;

  /**
   * Get all active devices for a user
   */
  static async getUserDevices(userId: string | Types.ObjectId) {
    const devices = await ConnectedDevice.find({
      userId,
      isActive: true
    }).sort({ lastActive: -1 });

    return devices.map(device => ({
      id: device._id,
      deviceName: device.deviceName,
      os: device.os,
      browser: device.browser,
      location: device.location,
      lastActive: device.lastActive,
      isCurrent: device.isCurrent,
      loginCount: device.loginCount,
      deviceType: this.getDeviceType(device.os),
      trustLevel: this.getTrustLevel(device.loginCount, device.createdAt),
      isActive: device.isActive
    }));
  }

  /**
   * Force logout a specific device
   */
  static async logoutDevice(userId: string | Types.ObjectId, deviceId: string) {
    const device = await ConnectedDevice.findOne({
      _id: deviceId,
      userId,
      isActive: true
    });

    if (!device) {
      throw new ApiError(404, "Device not found or already logged out");
    }

    // Mark device as inactive
    device.isActive = false;
    device.isCurrent = false;
    device.sessionToken = undefined;
    await device.save();

    // Log security event
    await SecurityEvent.create({
      userId,
      type: "DEVICE_LOGOUT",
      action: "LOGOUT",
      message: `Device logged out: ${device.deviceName}`,
      ip: device.ip,
      userAgent: device.userAgent,
      location: device.location
    });

    return {
      deviceName: device.deviceName,
      loggedOutAt: new Date()
    };
  }

  /**
   * Logout all other devices except current
   */
  static async logoutAllOtherDevices(userId: string | Types.ObjectId, currentDeviceId?: string) {
    const filter: any = { userId, isActive: true };
    if (currentDeviceId) {
      filter._id = { $ne: currentDeviceId };
    }

    const devicesToLogout = await ConnectedDevice.find(filter);

    // Update all devices to inactive
    await ConnectedDevice.updateMany(filter, {
      $set: {
        isActive: false,
        isCurrent: false
      },
      $unset: {
        sessionToken: 1
      }
    });

    // Log security events
    for (const device of devicesToLogout) {
      await SecurityEvent.create({
        userId,
        type: "DEVICE_LOGOUT_ALL",
        action: "LOGOUT",
        message: `Logged out via "Logout All": ${device.deviceName}`,
        ip: device.ip,
        userAgent: device.userAgent,
        location: device.location
      });
    }

    return devicesToLogout.length;
  }

  /**
   * Get device statistics for a user
   */
  static async getDeviceStats(userId: string | Types.ObjectId) {
    const [activeDevices, totalDevices, recentLogins] = await Promise.all([
      ConnectedDevice.countDocuments({ userId, isActive: true }),
      ConnectedDevice.countDocuments({ userId }),
      ConnectedDevice.find({ userId, isActive: true })
        .sort({ lastActive: -1 })
        .limit(5)
        .select('deviceName lastActive location os')
    ]);

    return {
      activeDevices,
      totalDevices,
      maxDevices: this.MAX_DEVICES,
      availableSlots: Math.max(0, this.MAX_DEVICES - activeDevices),
      recentLogins: recentLogins.map(device => ({
        deviceName: device.deviceName,
        lastActive: device.lastActive,
        location: device.location,
        deviceType: this.getDeviceType(device.os)
      }))
    };
  }

  /**
   * Check if device session is valid
   */
  static async validateDeviceSession(userId: string | Types.ObjectId, sessionToken: string) {
    const device = await ConnectedDevice.findOne({
      userId,
      sessionToken,
      isActive: true
    });

    if (!device) {
      return null;
    }

    // Update last active
    device.lastActive = new Date();
    await device.save();

    return device;
  }

  /**
   * Get current device info
   */
  static async getCurrentDevice(userId: string | Types.ObjectId) {
    return await ConnectedDevice.findOne({
      userId,
      isCurrent: true,
      isActive: true
    });
  }

  /**
   * Clean up old inactive devices
   */
  static async cleanupOldDevices() {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const result = await ConnectedDevice.deleteMany({
      isActive: false,
      lastActive: { $lt: thirtyDaysAgo }
    });

    return result.deletedCount;
  }

  /**
   * Get device type from OS
   */
  private static getDeviceType(os: string): string {
    const osLower = os.toLowerCase();
    
    if (osLower.includes('android') || osLower.includes('ios')) {
      return 'mobile';
    } else if (osLower.includes('windows') || osLower.includes('mac') || osLower.includes('linux')) {
      return 'desktop';
    } else if (osLower.includes('tablet')) {
      return 'tablet';
    }
    
    return 'unknown';
  }

  /**
   * Calculate trust level based on usage
   */
  private static getTrustLevel(loginCount: number, createdAt: Date): string {
    const daysSinceCreated = Math.floor(
      (Date.now() - createdAt.getTime()) / (1000 * 60 * 60 * 24)
    );
    
    if (loginCount >= 10 && daysSinceCreated >= 7) {
      return 'high';
    } else if (loginCount >= 3 && daysSinceCreated >= 1) {
      return 'medium';
    }
    
    return 'low';
  }

  /**
   * Check if user has reached device limit
   */
  static async hasReachedDeviceLimit(userId: string | Types.ObjectId): Promise<boolean> {
    const activeDeviceCount = await ConnectedDevice.countDocuments({
      userId,
      isActive: true
    });

    return activeDeviceCount >= this.MAX_DEVICES;
  }

  /**
   * Get device limit info
   */
  static getDeviceLimitInfo() {
    return {
      maxDevices: this.MAX_DEVICES,
      message: `You can be logged in on up to ${this.MAX_DEVICES} devices at once. Logging in on a new device will automatically log out the oldest device.`
    };
  }
}