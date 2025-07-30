import { Request } from "express";
import { ConnectedDevice } from "../models/connected-device.model";
import { getGeoLocationFromIP } from "./ipGeolocation";
import { SecurityEvent } from "../models/security-event.model";

export const trackConnectedDevice = async (userId: string, req: Request) => {
  const { ip, userAgent, os, browser, deviceName } = (req as any).deviceInfo;
  const location = await getGeoLocationFromIP(ip);

  // Try to find if this device already exists
  const existingDevice = await ConnectedDevice.findOne({
    userId,
    ip,
    os,
    browser,
    deviceName,
  });

  if (existingDevice) {
    // ✅ Device exists — update info
    existingDevice.userAgent = userAgent;
    existingDevice.location = location;
    existingDevice.lastActive = new Date();
    existingDevice.isCurrent = true;
    await existingDevice.save();
    return;
  }

  // ❗ Mark all other devices as not current
  await ConnectedDevice.updateMany(
    { userId },
    { $set: { isCurrent: false } }
  );

  // 📦 Enforce device limit — max 3
  const activeDevices = await ConnectedDevice.find({ userId }).sort({ updatedAt: 1 });
  if (activeDevices.length >= 3) {
    const oldest = activeDevices[0];
    await ConnectedDevice.findByIdAndDelete(oldest._id);
  }

  // 💾 Save new device
  await ConnectedDevice.create({
    userId,
    ip,
    userAgent,
    os,
    browser,
    deviceName,
    location,
    isCurrent: true,
    lastActive: new Date(),
  });

  // 🛡️ Security log
  await SecurityEvent.create({
  userId,
  type: "NEW_DEVICE_LOGIN", // ✅ Add this line
  action: "LOGIN",
  message: "Logged in from a new device",
  ip,
  userAgent,
  location,
});
};
