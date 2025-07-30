import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middlewares";
import { getConnectedDevices, getSecurityEvents, logoutConnectedDevice } from "../controller/security-and-privacy.controller";


const router = Router()

// route to get security events
router.get("/security-events", verifyJWT, getSecurityEvents)
router.get("/devices", verifyJWT, getConnectedDevices)
router.get("/devices/:id", verifyJWT, logoutConnectedDevice)

export default router