import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middlewares";
import { getSecurityEvents } from "../controller/security-and-privacy.controller";


const router = Router()

// route to get security events
router.get("/security-events", verifyJWT, getSecurityEvents)

export default router