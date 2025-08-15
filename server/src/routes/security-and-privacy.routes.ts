import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middlewares";
import { 
  getConnectedDevices, 
  getSecurityEvents, 
  logoutConnectedDevice,
  logoutAllOtherDevices,
  getDeviceStats
} from "../controller/security-and-privacy.controller";

const router = Router();

// All routes require authentication
router.use(verifyJWT);

// Security events
router.get("/security-events", getSecurityEvents);

// Device management
router.get("/devices", getConnectedDevices);
router.get("/devices/stats", getDeviceStats);
router.delete("/devices/:id", logoutConnectedDevice);
router.post("/devices/logout-all", logoutAllOtherDevices);

export default router;