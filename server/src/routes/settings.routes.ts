import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middlewares";
import { getNotificationHistories, getNotificationSettings, toggleNotificationSetting } from "../controller/settings.controller";


const router = Router()

// Route from toggle notification settings on/off
router.patch("/toggle-notification", verifyJWT, toggleNotificationSetting);
// Routes for get all settings
router.get("/notification-settings", verifyJWT, getNotificationSettings);
router.get("/notification-histories", verifyJWT, getNotificationHistories);

export default router